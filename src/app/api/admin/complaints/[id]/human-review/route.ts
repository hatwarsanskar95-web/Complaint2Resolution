import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const HumanReviewActionSchema = z.object({
  action: z.enum(['CONFIRM_CLOSED', 'REOPEN_REASSIGN', 'MANUAL_ROUTE']),
  department_id: z.string().optional(),
  officer_id: z.string().optional(),
  notes: z.string().min(1, 'Supervisor notes are required'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const parsed = HumanReviewActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Auth check - ensure user is ADMIN or SUPERVISOR
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPERVISOR') {
      return NextResponse.json({ error: 'Forbidden: Admin or Supervisor role required' }, { status: 403 })
    }

    const { data: complaint, error: compErr } = await supabase
      .from('complaints')
      .select('*, departments(name)')
      .eq('id', id)
      .single()

    if (compErr || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const { action, department_id, officer_id, notes } = parsed.data
    let newStatus = complaint.status
    let updateFields: Record<string, any> = {}

    if (action === 'CONFIRM_CLOSED') {
      newStatus = 'CLOSED'
    } else if (action === 'REOPEN_REASSIGN') {
      newStatus = 'REOPENED'
      if (officer_id) {
        updateFields.assigned_officer_id = officer_id
        newStatus = 'IN_PROGRESS'
      }
    } else if (action === 'MANUAL_ROUTE') {
      newStatus = 'RECEIVED'
      if (department_id) {
        updateFields.department_id = department_id
      }
    }

    updateFields.status = newStatus

    // Update complaint
    const { error: updateErr } = await supabase
      .from('complaints')
      .update(updateFields)
      .eq('id', id)

    if (updateErr) {
      throw updateErr
    }

    // Insert status history
    await supabase.from('complaint_status_history').insert({
      complaint_id: id,
      old_status: complaint.status,
      new_status: newStatus,
      updated_by: user.id,
      notes: `[HUMAN REVIEW OVERRIDE: ${action}] ${notes}`,
    })

    // Log to audit logs
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: `HUMAN_REVIEW_${action}`,
      target_type: 'COMPLAINT',
      target_id: id,
      details: {
        old_status: complaint.status,
        new_status: newStatus,
        supervisor_notes: notes,
        department_id,
        officer_id,
      },
    })

    return NextResponse.json({
      success: true,
      complaint_id: id,
      action,
      new_status: newStatus,
      message: 'Human review action processed successfully',
    })
  } catch (err: any) {
    console.error('Human review error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
