// ============================================================
// Phase 25 — AI Dispute Analysis & Complaint Reopening
// src/lib/services/disputeService.ts
// INVARIANT: NEVER generates a new CR-ID. Reuses same complaint.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { getGeminiClient, GEMINI_DEFAULT_MODEL } from '@/lib/gemini'
import { z } from 'zod'

type DisputeOutcome = 'REOPEN' | 'RESOLVED' | 'HUMAN_REVIEW'

const DisputeSchema = z.object({
  outcome: z.enum(['REOPEN', 'RESOLVED', 'HUMAN_REVIEW']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  key_observations: z.string(),
})

async function urlToBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const ct = res.headers.get('content-type') ?? 'image/jpeg'
    const buf = await res.arrayBuffer()
    return { data: Buffer.from(buf).toString('base64'), mimeType: ct.split(';')[0] }
  } catch { return null }
}

export async function analyzeDispute(complaintId: string, disputeReason: string): Promise<{
  outcome: DisputeOutcome
  confidence: number
  reasoning: string
  newStatus: string
}> {
  const supabase = await createClient()

  const [{ data: complaint }, { data: submission }, { data: images }] = await Promise.all([
    supabase.from('complaints').select('*, departments(name)').eq('id', complaintId).single(),
    supabase.from('resolution_submissions').select('*').eq('complaint_id', complaintId).order('submitted_at', { ascending: false }).limit(1).single(),
    supabase.from('complaint_images').select('*').eq('complaint_id', complaintId).order('created_at'),
  ])

  if (!complaint) throw new Error('Complaint not found')

  const originalImg = images?.find(i => i.image_type === 'original')
  const disputeImg  = images?.find(i => i.image_type === 'dispute')

  // Build multimodal prompt parts
  const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = []

  parts.push({ text: `You are analyzing a citizen dispute for municipal complaint ${complaint.permanent_id}.

COMPLAINT: ${complaint.category} / ${complaint.subcategory}
Location: ${complaint.address}
Citizen original description: "${complaint.description}"

OFFICER RESOLUTION CLAIM: "${submission?.action_taken ?? 'No action note provided'}"
CITIZEN DISPUTE REASON: "${disputeReason}"

Analyze all provided photographic evidence to determine the correct outcome.

Return ONLY valid JSON:
{
  "outcome": "REOPEN" | "RESOLVED" | "HUMAN_REVIEW",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<2-3 sentence explanation>",
  "key_observations": "<specific photo observations>"
}

OUTCOME RULES:
- REOPEN: Citizen's current photo clearly shows issue still exists → reopen SAME complaint (no new ID)
- RESOLVED: Officer evidence clearly shows resolution and citizen photo does not contradict → confirm closed
- HUMAN_REVIEW: Ambiguous or low confidence (< 0.60) → supervisor queue
` })

  if (originalImg?.image_url) {
    const d = await urlToBase64(originalImg.image_url)
    if (d) { parts.push({ text: 'ORIGINAL COMPLAINT PHOTO:' }); parts.push({ inlineData: d }) }
  }
  if (submission?.before_photo_url) {
    const d = await urlToBase64(submission.before_photo_url)
    if (d) { parts.push({ text: 'OFFICER BEFORE PHOTO:' }); parts.push({ inlineData: d }) }
  }
  if (submission?.after_photo_url) {
    const d = await urlToBase64(submission.after_photo_url)
    if (d) { parts.push({ text: 'OFFICER AFTER PHOTO:' }); parts.push({ inlineData: d }) }
  }
  if (disputeImg?.image_url) {
    const d = await urlToBase64(disputeImg.image_url)
    if (d) { parts.push({ text: 'CITIZEN CURRENT DISPUTE PHOTO (taken now, showing issue still exists):' }); parts.push({ inlineData: d }) }
  }

  const gemini = getGeminiClient()
  const response = await gemini.models.generateContent({
    model: GEMINI_DEFAULT_MODEL,
    contents: [{ role: 'user', parts }],
  })

  const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  let parsed: z.infer<typeof DisputeSchema>
  try {
    const clean = rawText.replace(/```json|```/g, '').trim()
    parsed = DisputeSchema.parse(JSON.parse(clean))
  } catch {
    parsed = { outcome: 'HUMAN_REVIEW', confidence: 0, reasoning: 'AI response parsing failed. Supervisor review required.', key_observations: '' }
  }

  // Determine new status — NEVER create a new complaint ID (Phase 25 invariant)
  const newStatus =
    parsed.outcome === 'REOPEN' ? 'REOPENED' :
    parsed.outcome === 'RESOLVED' ? 'CLOSED' : 'HUMAN_REVIEW_REQUIRED'

  const oldStatus = complaint.status as string

  // Update the SAME complaint (permanent_id preserved)
  await supabase.from('complaints').update({ status: newStatus }).eq('id', complaintId)
  await supabase.from('complaint_status_history').insert({
    complaint_id: complaintId,
    old_status: oldStatus,
    new_status: newStatus,
    updated_by: null,
    notes: `AI Dispute Analysis: ${parsed.outcome} (confidence: ${Math.round(parsed.confidence * 100)}%). ${parsed.reasoning}`,
  })

  return { outcome: parsed.outcome, confidence: parsed.confidence, reasoning: parsed.reasoning, newStatus }
}
