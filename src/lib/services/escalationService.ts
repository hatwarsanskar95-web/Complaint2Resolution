// ============================================================
// Phase 19 — Escalation Service
// src/lib/services/escalationService.ts
// Automated 3-level escalation hierarchy for SLA breaches
// ============================================================

import { createClient } from '@/lib/supabase/server'

export type EscalationLevel = 1 | 2 | 3

const ESCALATION_REASON: Record<EscalationLevel, string> = {
  1: 'SLA deadline breached — escalated to department supervisor for immediate review.',
  2: 'Supervisor response overdue — escalated to department head / administrator.',
  3: 'Department head escalation exceeded — escalated to Central Authority.',
}

const ESCALATION_LABEL: Record<EscalationLevel, string> = {
  1: 'Level 1 — Department Supervisor',
  2: 'Level 2 — Department Head / Admin',
  3: 'Level 3 — Central Authority',
}

/**
 * Check if a complaint needs escalation and create escalation records.
 * Idempotent — will not re-escalate if already at this level.
 */
export async function checkAndEscalate(complaintId: string): Promise<{
  escalated: boolean
  level: EscalationLevel | null
  reason: string | null
}> {
  const supabase = await createClient()

  // Fetch the complaint
  const { data: complaint } = await supabase
    .from('complaints')
    .select('id, status, sla_deadline, sla_start_time, assigned_officer_id, department_id, priority, permanent_id')
    .eq('id', complaintId)
    .single()

  if (!complaint) return { escalated: false, level: null, reason: 'Complaint not found' }

  // Only escalate unresolved complaints past their SLA deadline
  const resolved = ['RESOLVED', 'CLOSED', 'CITIZEN_VERIFICATION', 'RESOLUTION_SUBMITTED']
  if (resolved.includes(complaint.status)) {
    return { escalated: false, level: null, reason: 'Complaint already resolved or submitted' }
  }

  if (!complaint.sla_deadline) {
    return { escalated: false, level: null, reason: 'No SLA deadline set' }
  }

  const isBreached = new Date(complaint.sla_deadline) < new Date()
  if (!isBreached) {
    return { escalated: false, level: null, reason: 'SLA not yet breached' }
  }

  // Find existing escalations for this complaint
  const { data: existing } = await supabase
    .from('escalations')
    .select('escalation_level')
    .eq('complaint_id', complaintId)
    .order('escalation_level', { ascending: false })

  const currentLevel = (existing?.[0]?.escalation_level ?? 0) as number
  const nextLevel = Math.min(currentLevel + 1, 3) as EscalationLevel

  // Already at max escalation
  if (currentLevel >= 3) {
    return { escalated: false, level: 3, reason: 'Already at maximum escalation level (Central Authority)' }
  }

  // Calculate how long SLA has been breached
  const breachedMs = Date.now() - new Date(complaint.sla_deadline).getTime()
  const delayHours = Math.round(breachedMs / 3_600_000 * 10) / 10

  // Insert escalation record
  const { error } = await supabase.from('escalations').insert({
    complaint_id: complaintId,
    escalation_level: nextLevel,
    previous_assigned_to: complaint.assigned_officer_id,
    escalated_to: null, // Would be resolved to actual supervisor/admin in production
    reason: ESCALATION_REASON[nextLevel],
    delay_duration_hours: delayHours,
  })

  if (error) throw error

  // Update complaint status to HUMAN_REVIEW_REQUIRED if Level 2+
  if (nextLevel >= 2) {
    await supabase
      .from('complaints')
      .update({ status: 'HUMAN_REVIEW_REQUIRED' })
      .eq('id', complaintId)

    await supabase.from('complaint_status_history').insert({
      complaint_id: complaintId,
      old_status: complaint.status,
      new_status: 'HUMAN_REVIEW_REQUIRED',
      updated_by: null,
      notes: `Automatically escalated: ${ESCALATION_LABEL[nextLevel]}`,
    })
  }

  return {
    escalated: true,
    level: nextLevel,
    reason: ESCALATION_REASON[nextLevel],
  }
}

/**
 * Batch check all complaints for SLA breaches and escalate as needed.
 * Called by the API escalation cron endpoint.
 */
export async function batchEscalateBreachedComplaints(): Promise<{
  checked: number
  escalated: number
  results: Array<{ complaint_id: string; permanent_id: string; level: EscalationLevel | null }>
}> {
  const supabase = await createClient()

  // Find all unresolved complaints past their SLA deadline
  const { data: breached } = await supabase
    .from('complaints')
    .select('id, permanent_id, sla_deadline, status')
    .not('sla_deadline', 'is', null)
    .lt('sla_deadline', new Date().toISOString())
    .not('status', 'in', '(RESOLVED,CLOSED,CITIZEN_VERIFICATION)')

  const complaints = breached ?? []
  const results = []
  let escalatedCount = 0

  for (const c of complaints) {
    try {
      const result = await checkAndEscalate(c.id)
      if (result.escalated) {
        escalatedCount++
        results.push({ complaint_id: c.id, permanent_id: c.permanent_id, level: result.level })
      }
    } catch (_) {
      // Continue batch even if one fails
    }
  }

  return { checked: complaints.length, escalated: escalatedCount, results }
}
