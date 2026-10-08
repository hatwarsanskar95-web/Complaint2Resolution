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

    // Enforce mandatory fields (Phase 24)
    const missing: string[] = []
    if (!body.dispute_photo_url?.trim()) missing.push('dispute_photo_url')
    if (!body.dispute_reason?.trim()) missing.push('dispute_reason')
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}. A current photo is mandatory.` },
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
    if (complaint.status !== 'CITIZEN_VERIFICATION') {
      return NextResponse.json({ error: `Cannot dispute: complaint is in ${complaint.status} state` }, { status: 422 })
    }

    // Save dispute photo to complaint_images with image_type='dispute'
    const { error: imgErr } = await supabase.from('complaint_images').insert({
      complaint_id: id,
      image_url: body.dispute_photo_url,
      image_type: 'dispute',
    })
    if (imgErr) throw imgErr

    // Save citizen_verifications record (is_satisfied = false)
    const { error: verifyErr } = await supabase.from('citizen_verifications').insert({
      complaint_id: id,
      citizen_id: user.id,
      is_satisfied: false,
      feedback_rating: null,
      feedback_comment: null,
      dispute_photo_url: body.dispute_photo_url,
      dispute_reason: body.dispute_reason,
    })
    if (verifyErr) throw verifyErr

    // Transition to DISPUTED
    await supabase.from('complaints').update({ status: 'DISPUTED' }).eq('id', id)
    await supabase.from('complaint_status_history').insert({
      complaint_id: id,
      old_status: 'CITIZEN_VERIFICATION',
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
