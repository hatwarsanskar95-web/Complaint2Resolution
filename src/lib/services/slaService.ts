// ============================================================
// Phase 18 — Centralized SLA Service
// src/lib/services/slaService.ts
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { PriorityLevel } from '@/lib/types'

// SLA durations by priority (in hours) — PRD spec
export const SLA_HOURS: Record<PriorityLevel, number> = {
  CRITICAL: 6,
  HIGH:     24,
  MEDIUM:   48,
  LOW:      72,
}

export type SlaThreshold = 'normal' | 'reminder' | 'warning' | 'critical' | 'breached'

/**
 * Compute the SLA status for a complaint given its deadline and start time.
 * Returns percent elapsed, label, and formatted time-left string.
 */
export function computeSlaStatus(
  slaDeadline: string | null,
  slaStartTime: string | null
): {
  percent: number
  label: SlaThreshold
  hoursLeft: number
  formattedTimeLeft: string
} {
  if (!slaDeadline || !slaStartTime) {
    return { percent: 0, label: 'normal', hoursLeft: 0, formattedTimeLeft: 'No SLA' }
  }

  const now = Date.now()
  const start = new Date(slaStartTime).getTime()
  const deadline = new Date(slaDeadline).getTime()
  const total = deadline - start
  const elapsed = now - start

  if (total <= 0) {
    return { percent: 100, label: 'breached', hoursLeft: 0, formattedTimeLeft: 'Breached' }
  }

  const percent = Math.min(Math.round((elapsed / total) * 100), 100)
  const msLeft = deadline - now
  const hoursLeft = Math.max(0, Math.floor(msLeft / 3_600_000))
  const minsLeft = Math.max(0, Math.floor((msLeft % 3_600_000) / 60_000))

  let label: SlaThreshold
  if (percent >= 100) label = 'breached'
  else if (percent >= 90) label = 'critical'
  else if (percent >= 75) label = 'warning'
  else if (percent >= 50) label = 'reminder'
  else label = 'normal'

  let formattedTimeLeft: string
  if (percent >= 100) {
    formattedTimeLeft = 'SLA Breached'
  } else if (hoursLeft >= 24) {
    const days = Math.floor(hoursLeft / 24)
    formattedTimeLeft = `${days}d ${hoursLeft % 24}h left`
  } else if (hoursLeft > 0) {
    formattedTimeLeft = `${hoursLeft}h ${minsLeft}m left`
  } else {
    formattedTimeLeft = `${minsLeft}m left`
  }

  return { percent, label, hoursLeft, formattedTimeLeft }
}

/**
 * Calculate and assign SLA deadline to a complaint.
 * Sets sla_start_time = NOW(), sla_deadline = NOW() + SLA_HOURS[priority].
 */
export async function assignSlaDeadline(
  complaintId: string,
  priority: PriorityLevel
): Promise<{ sla_start_time: string; sla_deadline: string; sla_duration_hours: number }> {
  const supabase = await createClient()
  const hours = SLA_HOURS[priority]
  const now = new Date()
  const deadline = new Date(now.getTime() + hours * 3_600_000)

  const sla_start_time = now.toISOString()
  const sla_deadline = deadline.toISOString()

  await supabase
    .from('complaints')
    .update({
      sla_start_time,
      sla_deadline,
      sla_duration_hours: hours,
    })
    .eq('id', complaintId)

  return { sla_start_time, sla_deadline, sla_duration_hours: hours }
}

/**
 * Log an SLA threshold event to the sla_events table.
 * Prevents duplicate logging for the same event_type on the same complaint.
 */
export async function logSlaEvent(
  complaintId: string,
  eventType: 'reminder' | 'warning' | 'critical_warning' | 'breach',
  elapsedPercent: number
): Promise<void> {
  const supabase = await createClient()

  // Check if this event_type already logged for this complaint
  const { data: existing } = await supabase
    .from('sla_events')
    .select('id')
    .eq('complaint_id', complaintId)
    .eq('event_type', eventType)
    .single()

  if (existing) return // Idempotent — already logged

  await supabase.from('sla_events').insert({
    complaint_id: complaintId,
    event_type: eventType,
    elapsed_percent: elapsedPercent,
    triggered_at: new Date().toISOString(),
  })
}

/**
 * Check a complaint's SLA and log appropriate threshold events.
 * Meant to be called when loading a complaint detail page or via a cron job.
 */
export async function checkAndLogSlaThresholds(
  complaintId: string,
  slaDeadline: string | null,
  slaStartTime: string | null
): Promise<void> {
  if (!slaDeadline || !slaStartTime) return

  const { percent, label } = computeSlaStatus(slaDeadline, slaStartTime)

  if (label === 'breached') {
    await logSlaEvent(complaintId, 'breach', percent)
  } else if (label === 'critical') {
    await logSlaEvent(complaintId, 'critical_warning', percent)
  } else if (label === 'warning') {
    await logSlaEvent(complaintId, 'warning', percent)
  } else if (label === 'reminder') {
    await logSlaEvent(complaintId, 'reminder', percent)
  }
}
