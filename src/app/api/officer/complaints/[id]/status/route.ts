import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ComplaintStatus } from '@/lib/types'

// ============================================================
// Phase 17 — Status Transition API
// POST /api/officer/complaints/[id]/status
// Enforces the valid state machine transitions
// ============================================================

// Valid transitions map: current status → allowed next statuses (by officer)
const VALID_TRANSITIONS: Partial<Record<ComplaintStatus, ComplaintStatus[]>> = {
  SUBMITTED:  ['RECEIVED', 'IN_PROGRESS'],
  RECEIVED:   ['ASSIGNED', 'IN_PROGRESS'],
  ASSIGNED:   ['IN_PROGRESS'],
  IN_PROGRESS:['RESOLUTION_SUBMITTED'],
  REOPENED:   ['IN_PROGRESS', 'RESOLUTION_SUBMITTED'],
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify officer role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['officer', 'dept_admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Officer access required' }, { status: 403 })
    }

    const body = await req.json() as { new_status: ComplaintStatus; notes?: string }
    const { new_status, notes } = body

    if (!new_status) {
      return NextResponse.json({ error: 'new_status is required' }, { status: 400 })
    }

    // Fetch current complaint
    const { data: complaint, error: fetchErr } = await supabase
      .from('complaints')
      .select('id, status, permanent_id, department_id')
      .eq('id', id)
      .single()

    if (fetchErr || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const currentStatus = complaint.status as ComplaintStatus
    const allowedNext = VALID_TRANSITIONS[currentStatus] ?? []

    if (!allowedNext.includes(new_status)) {
      return NextResponse.json(
        { error: `Invalid transition: ${currentStatus} → ${new_status}. Allowed: ${allowedNext.join(', ') || 'none'}` },
        { status: 422 }
      )
    }

    // Apply the status update + assign officer on ASSIGNED transition
    const updatePayload: Record<string, unknown> = { status: new_status }
    if (new_status === 'ASSIGNED' || new_status === 'IN_PROGRESS') {
      updatePayload.assigned_officer_id = user.id
    }

    const { error: updateErr } = await supabase
      .from('complaints')
      .update(updatePayload)
      .eq('id', id)

    if (updateErr) throw updateErr

    // Log to complaint_status_history
    const { error: histErr } = await supabase
      .from('complaint_status_history')
      .insert({
        complaint_id: id,
        old_status: currentStatus,
        new_status,
        updated_by: user.id,
        notes: notes ?? `Status updated by Officer ${profile.full_name ?? user.id}`,
      })

    if (histErr) throw histErr

    return NextResponse.json({
      success: true,
      complaint_id: id,
      permanent_id: complaint.permanent_id,
      old_status: currentStatus,
      new_status,
    })
  } catch (err) {
    console.error('[Status Transition API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
