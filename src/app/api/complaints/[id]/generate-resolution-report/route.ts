import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGeminiClient, GEMINI_DEFAULT_MODEL } from '@/lib/gemini'

// ============================================================
// Phase 21 — AI Resolution Report Generation
// POST /api/complaints/[id]/generate-resolution-report
// Passes context to Gemini, saves to resolution_reports table
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch complaint + AI analysis + resolution submission
    const [{ data: complaint }, { data: ai }, { data: submission }] = await Promise.all([
      supabase.from('complaints').select('*, departments(name)').eq('id', id).single(),
      supabase.from('complaint_ai_analysis').select('*').eq('complaint_id', id).single(),
      supabase.from('resolution_submissions').select('*').eq('complaint_id', id).order('submitted_at', { ascending: false }).limit(1).single(),
    ])

    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    if (!submission) return NextResponse.json({ error: 'No resolution submission found. Officer must submit evidence first.' }, { status: 422 })

    // Build Gemini prompt
    const prompt = `You are drafting an official government municipal resolution report for complaint ID ${complaint.permanent_id}.

COMPLAINT DETAILS:
- Category: ${complaint.category} / ${complaint.subcategory}
- Department: ${(complaint.departments as { name?: string } | null)?.name ?? 'Unknown'}
- Priority: ${complaint.priority}
- Location: ${complaint.address}
- Citizen Description: ${complaint.description}
- Filed: ${new Date(complaint.created_at).toLocaleDateString('en-IN')}

AI ANALYSIS:
- Summary: ${ai?.summary ?? 'Not available'}
- Recommended Actions: ${(ai?.recommended_actions ?? []).join('; ') || 'None'}

OFFICER RESOLUTION:
- Action Taken: ${submission.action_taken}
- Before Photo Available: ${submission.before_photo_url ? 'Yes' : 'No'}
- After Photo Available: ${submission.after_photo_url ? 'Yes' : 'No'}
- Submitted: ${new Date(submission.submitted_at).toLocaleDateString('en-IN')}

INSTRUCTIONS:
Draft a concise, formal municipal resolution report in 200-300 words. Include:
1. Brief problem summary
2. Field action taken by officer
3. Outcome and current status
4. Any follow-up recommendations

Use professional government language. Do NOT claim 100% resolution certainty. Use phrasing like "Evidence indicates the issue has been addressed" or "Field assessment suggests the condition has been remediated."

Return ONLY the report text, no headers, no markdown.`

    const gemini = getGeminiClient()
    const response = await gemini.models.generateContent({
      model: GEMINI_DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const reportText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!reportText.trim()) throw new Error('Gemini returned empty report')

    // Save to resolution_reports table
    const { data: saved, error: saveErr } = await supabase
      .from('resolution_reports')
      .insert({
        complaint_id: id,
        officer_id: user.id,
        report_text: reportText,
        ai_generated_text: reportText,
        is_edited: false,
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveErr) throw saveErr

    return NextResponse.json({ success: true, report: saved, report_text: reportText })
  } catch (err) {
    console.error('[Generate Resolution Report]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
