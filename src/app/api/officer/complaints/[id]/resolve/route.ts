import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAiVerification } from '@/lib/services/aiVerificationService'

// ============================================================
// Phase 20 — Resolution Evidence Submission API
// POST /api/officer/complaints/[id]/resolve
// Enforces mandatory: action_taken + before_photo_url + after_photo_url
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['officer', 'dept_admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Officer access required' }, { status: 403 })
    }

    const body = await req.json() as {
      action_taken: string
      before_photo_url: string
      after_photo_url: string
    }

    const { action_taken, before_photo_url, after_photo_url } = body

    // Enforce all 3 mandatory fields
    const missing: string[] = []
    if (!action_taken?.trim()) missing.push('action_taken')
    if (!before_photo_url?.trim()) missing.push('before_photo_url')
    if (!after_photo_url?.trim()) missing.push('after_photo_url')

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required evidence fields: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // Fetch complaint to check current status
    const { data: complaint } = await supabase
      .from('complaints')
      .select('id, status, permanent_id')
      .eq('id', id)
      .single()

    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })

    const workableStatuses = ['IN_PROGRESS', 'REOPENED', 'ASSIGNED', 'RECEIVED', 'SUBMITTED']
    if (!workableStatuses.includes(complaint.status)) {
      return NextResponse.json(
        { error: `Cannot submit resolution for complaint in ${complaint.status} status` },
        { status: 422 }
      )
    }

    // Save resolution_submissions record (Phase 20)
    // Use upsert so reopened complaints can have updated resolution evidence
    const { error: subErr } = await supabase.from('resolution_submissions').upsert({
      complaint_id: id,
      officer_id: user.id,
      action_taken,
      before_photo_url,
      after_photo_url,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'complaint_id' })

    if (subErr) throw subErr

    // Also record before/after photos into complaint_images history
    await supabase.from('complaint_images').insert([
      { complaint_id: id, image_url: before_photo_url, image_type: 'before' },
      { complaint_id: id, image_url: after_photo_url, image_type: 'after' }
    ])

    // Transition complaint to RESOLUTION_SUBMITTED
    const { error: updErr } = await supabase
      .from('complaints')
      .update({ status: 'RESOLUTION_SUBMITTED' })
      .eq('id', id)

    if (updErr) throw updErr

    // Log to complaint_status_history
    await supabase.from('complaint_status_history').insert({
      complaint_id: id,
      old_status: complaint.status,
      new_status: 'RESOLUTION_SUBMITTED',
      updated_by: user.id,
      notes: `Resolution submitted by Officer ${profile.full_name ?? user.id}. Action: ${action_taken.slice(0, 120)}`,
    })

    // Trigger AI verification asynchronously to analyze evidence and advance to CITIZEN_VERIFICATION
    runAiVerification(id).catch((aiErr) => {
      console.error('[Resolve API] AI verification async execution error:', aiErr)
    })

    return NextResponse.json({
      success: true,
      complaint_id: id,
      permanent_id: complaint.permanent_id,
      new_status: 'RESOLUTION_SUBMITTED',
    })
  } catch (err) {
    console.error('[Resolve API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
