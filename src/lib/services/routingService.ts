import { SupabaseClient } from '@supabase/supabase-js'
import { PriorityLevel, ComplaintStatus } from '@/lib/types'

export const SLA_HOURS_MAP: Record<PriorityLevel, number> = {
  CRITICAL: 6,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72,
}

export const HIGH_CONFIDENCE_THRESHOLD = 0.70

export interface RoutingInput {
  category: string
  subcategory?: string
  department?: string
  priority: PriorityLevel | string
  confidence: number
  needs_human_review?: boolean
}

export interface RoutingDecision {
  departmentId: string | null
  departmentName: string | null
  priority: PriorityLevel
  status: ComplaintStatus
  slaStart: string
  slaDurationHours: number
  slaDeadline: string
  isAutoRouted: boolean
  routingReason: string
}

export interface DepartmentRecord {
  id: string
  name: string
  code: string
}

/**
 * Calculates SLA hours and deadline timestamp based on PriorityLevel
 * Priority levels: CRITICAL (6h), HIGH (24h), MEDIUM (48h), LOW (72h)
 */
export function calculateSla(priorityInput: string): { priority: PriorityLevel; slaHours: number; slaDeadline: Date; slaStart: Date } {
  const validPriority: PriorityLevel = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(priorityInput)
    ? (priorityInput as PriorityLevel)
    : 'MEDIUM'

  const slaHours = SLA_HOURS_MAP[validPriority] ?? 48
  const slaStart = new Date()
  const slaDeadline = new Date(slaStart.getTime() + slaHours * 3600 * 1000)

  return { priority: validPriority, slaHours, slaDeadline, slaStart }
}

/**
 * Finds matching department from list of departments based on recommended department or category name
 */
export function matchDepartment(recommendedDept?: string, categoryName?: string, departments: DepartmentRecord[] = []): DepartmentRecord | null {
  if (!departments || departments.length === 0) return null

  const target = (recommendedDept || categoryName || '').toLowerCase().trim()
  if (!target) return null

  // 1. Direct code or exact name match
  const exact = departments.find(
    d => d.code.toLowerCase() === target || d.name.toLowerCase() === target
  )
  if (exact) return exact

  // 2. Substring/fuzzy inclusion match
  const substringMatch = departments.find(
    d =>
      d.name.toLowerCase().includes(target) ||
      target.includes(d.name.toLowerCase()) ||
      (categoryName && d.name.toLowerCase().includes(categoryName.split(' ')[0].toLowerCase()))
  )
  if (substringMatch) return substringMatch

  return null
}

/**
 * Determines smart routing decision based on AI analysis input & available departments
 */
export function determineRoutingDecision(
  input: RoutingInput,
  departments: DepartmentRecord[] = []
): RoutingDecision {
  const { priority, slaHours, slaDeadline, slaStart } = calculateSla(input.priority)
  const matchedDept = matchDepartment(input.department, input.category, departments)

  const isHighConfidence = input.confidence >= HIGH_CONFIDENCE_THRESHOLD
  const requiresHumanReview = Boolean(input.needs_human_review)

  // Auto-route high-confidence complaints (>= 0.70) with a matching department and no human review flag
  const isAutoRouted = isHighConfidence && !requiresHumanReview && Boolean(matchedDept)

  const status: ComplaintStatus = isAutoRouted ? 'RECEIVED' : 'SUBMITTED'

  let routingReason = ''
  if (isAutoRouted) {
    routingReason = `Auto-routed to department '${matchedDept?.name}' (Code: ${matchedDept?.code}) with confidence ${(input.confidence * 100).toFixed(1)}%.`
  } else if (!isHighConfidence) {
    routingReason = `Routed to Human Review queue due to low AI confidence (${(input.confidence * 100).toFixed(1)}% < ${HIGH_CONFIDENCE_THRESHOLD * 100}%).`
  } else if (requiresHumanReview) {
    routingReason = `Routed to Human Review queue because AI flagged needs_human_review=true.`
  } else {
    routingReason = `Routed to Human Review queue because no matching department was found.`
  }

  return {
    departmentId: matchedDept?.id ?? null,
    departmentName: matchedDept?.name ?? null,
    priority,
    status,
    slaStart: slaStart.toISOString(),
    slaDurationHours: slaHours,
    slaDeadline: slaDeadline.toISOString(),
    isAutoRouted,
    routingReason,
  }
}

/**
 * Executes full smart routing process for a complaint and records status history transition in Supabase
 */
export async function executeSmartRouting(
  supabase: SupabaseClient,
  complaintId: string,
  routingInput: RoutingInput,
  updatedByUserId?: string
): Promise<RoutingDecision> {
  // Fetch available departments
  const { data: depts } = await supabase.from('departments').select('id, name, code')
  const departments: DepartmentRecord[] = depts || []

  // Determine routing decision
  const decision = determineRoutingDecision(routingInput, departments)

  // Update complaint record atomically with department, priority, status, and SLA deadline
  const { error: updateErr } = await supabase
    .from('complaints')
    .update({
      department_id: decision.departmentId,
      priority: decision.priority,
      status: decision.status,
      sla_start_time: decision.slaStart,
      sla_duration_hours: decision.slaDurationHours,
      sla_deadline: decision.slaDeadline,
    })
    .eq('id', complaintId)

  if (updateErr) {
    throw new Error(`Failed to update complaint routing: ${updateErr.message}`)
  }

  // Record status transition in complaint_status_history
  await supabase.from('complaint_status_history').insert({
    complaint_id: complaintId,
    old_status: null,
    new_status: decision.status,
    updated_by: updatedByUserId || null,
    notes: decision.routingReason,
  })

  return decision
}
