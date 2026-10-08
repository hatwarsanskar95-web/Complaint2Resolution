import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/citizen/complaints/[id]/confirm-resolution — Phase 23
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
      feedback_rating?: number
      feedback_comment?: string
    }

    // Fetch complaint
    const { data: complaint } = await supabase
      .from('complaints')
      .select('id, status, citizen_id, permanent_id')
      .eq('id', id)
      .single()

    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })

    // Only the complaint owner can confirm
    if (complaint.citizen_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: only the complaint owner can confirm resolution' }, { status: 403 })
    }

    if (complaint.status !== 'CITIZEN_VERIFICATION') {
      return NextResponse.json({ error: `Cannot confirm: complaint is in ${complaint.status} state` }, { status: 422 })
    }

    // Save citizen_verifications record (satisfied = true)
    const { error: verifyErr } = await supabase.from('citizen_verifications').insert({
      complaint_id: id,
      citizen_id: user.id,
      is_satisfied: true,
      feedback_rating: body.feedback_rating ?? null,
      feedback_comment: body.feedback_comment ?? null,
      dispute_photo_url: null,
      dispute_reason: null,
    })
    if (verifyErr) throw verifyErr

    // Transition to CLOSED
    await supabase.from('complaints').update({ status: 'CLOSED' }).eq('id', id)
    await supabase.from('complaint_status_history').insert({
      complaint_id: id,
      old_status: 'CITIZEN_VERIFICATION',
      new_status: 'CLOSED',
      updated_by: user.id,
      notes: `Citizen confirmed resolution. Rating: ${body.feedback_rating ?? 'N/A'}/5.`,
    })

    return NextResponse.json({ success: true, new_status: 'CLOSED', permanent_id: complaint.permanent_id })
  } catch (err) {
    console.error('[Confirm Resolution]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
