import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// POST /api/citizen/complaints/[id]/confirm-resolution — Phase 23
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Use session client to authenticate the citizen
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      feedback_rating?: number
      feedback_comment?: string
    }

    // Fetch complaint using session client (citizen can SELECT own complaints via RLS)
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

    if (!['CITIZEN_VERIFICATION', 'RESOLUTION_SUBMITTED', 'AI_VERIFICATION', 'RESOLVED'].includes(complaint.status)) {
      return NextResponse.json({ error: `Cannot confirm: complaint is in ${complaint.status} state` }, { status: 422 })
    }

    // Use service role client to bypass RLS for INSERT/UPDATE operations
    const admin = createServiceRoleClient()

    // Save citizen_verifications record (satisfied = true)
    const { error: verifyErr } = await admin.from('citizen_verifications').insert({
      complaint_id: id,
      citizen_id: user.id,
      is_satisfied: true,
      feedback_rating: body.feedback_rating ?? null,
      feedback_comment: body.feedback_comment ?? null,
      dispute_photo_url: null,
      dispute_reason: null,
    })
    if (verifyErr) throw verifyErr

    // Transition to CLOSED (service role bypasses UPDATE RLS)
    const { error: updateErr } = await admin.from('complaints').update({ status: 'CLOSED' }).eq('id', id)
    if (updateErr) throw updateErr

    await admin.from('complaint_status_history').insert({
      complaint_id: id,
      old_status: complaint.status,
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
