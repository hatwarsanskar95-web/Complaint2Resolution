import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/citizen/complaints/[id]/dispute — Phase 24
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      dispute_photo_url: string
      dispute_reason: string
    }

    // Enforce mandatory dispute reason
    if (!body.dispute_reason?.trim()) {
      return NextResponse.json(
        { error: 'Dispute reason is required.' },
        { status: 400 }
      )
    }

    const { data: complaint } = await supabase
      .from('complaints')
      .select('id, status, citizen_id, permanent_id')
      .eq('id', id)
      .single()

    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    if (complaint.citizen_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!['CITIZEN_VERIFICATION', 'RESOLUTION_SUBMITTED', 'AI_VERIFICATION', 'RESOLVED'].includes(complaint.status)) {
      return NextResponse.json({ error: `Cannot dispute: complaint is in ${complaint.status} state` }, { status: 422 })
    }

    // Save dispute photo to complaint_images if provided
    if (body.dispute_photo_url?.trim()) {
      await supabase.from('complaint_images').insert({
        complaint_id: id,
        image_url: body.dispute_photo_url.trim(),
        image_type: 'dispute',
      })
    }

    // Save citizen_verifications record (is_satisfied = false)
    const { error: verifyErr } = await supabase.from('citizen_verifications').insert({
      complaint_id: id,
      citizen_id: user.id,
      is_satisfied: false,
      feedback_rating: null,
      feedback_comment: null,
      dispute_photo_url: body.dispute_photo_url?.trim() || null,
      dispute_reason: body.dispute_reason,
    })
    if (verifyErr) throw verifyErr

    // Transition to DISPUTED
    await supabase.from('complaints').update({ status: 'DISPUTED' }).eq('id', id)
    await supabase.from('complaint_status_history').insert({
      complaint_id: id,
      old_status: complaint.status,
      new_status: 'DISPUTED',
      updated_by: user.id,
      notes: `Citizen disputed resolution. Reason: ${body.dispute_reason.slice(0, 200)}`,
    })

    // Trigger AI Dispute Analysis asynchronously (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/complaints/${id}/analyze-dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispute_reason: body.dispute_reason }),
    }).catch(() => {})

    return NextResponse.json({ success: true, new_status: 'DISPUTED', permanent_id: complaint.permanent_id })
  } catch (err) {
    console.error('[Dispute Resolution]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
