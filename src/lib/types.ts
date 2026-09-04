// ============================================================
// COMPLAINT2RESOLUTION — MASTER TYPESCRIPT DEFINITIONS
// SIH 2026 — Smart Automation
// ============================================================

export type UserRole = 'citizen' | 'officer' | 'dept_admin' | 'super_admin'

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLUTION_SUBMITTED'
  | 'AI_VERIFICATION'
  | 'RESOLVED'
  | 'CITIZEN_VERIFICATION'
  | 'CLOSED'
  | 'DISPUTED'
  | 'AI_DISPUTE_VERIFICATION'
  | 'REOPENED'
  | 'HUMAN_REVIEW_REQUIRED'

export interface Profile {
  id: string
  full_name: string | null
  email: string
  phone_number: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  code: string
  description?: string | null
  created_at: string
  updated_at?: string
  // Computed / joined
  officer_count?: number
  active_complaints_count?: number
}

export interface DepartmentCategory {
  id: string
  department_id: string
  category: string
  subcategory: string
  default_sla_hours: number
  created_at: string
  departments?: Department
}

export interface OfficerDepartment {
  profile_id: string
  department_id: string
  created_at: string
  profiles?: Profile
  departments?: Department
}

export interface Complaint {
  id: string
  permanent_id: string // Format: CR-YYYY-XXXXXX
  citizen_id: string
  category: string
  subcategory: string
  description: string
  latitude: number
  longitude: number
  address: string
  department_id: string | null
  priority: PriorityLevel
  status: ComplaintStatus
  sla_start_time: string | null
  sla_duration_hours: number | null
  sla_deadline: string | null
  assigned_officer_id: string | null
  needs_human_review?: boolean
  created_at: string
  updated_at: string
  // Joined fields
  departments?: Department | null
  profiles?: Profile | null
  assigned_officer?: Profile | null
  complaint_images?: ComplaintImage[]
  complaint_ai_analysis?: ComplaintAiAnalysis | null
  resolution_submissions?: ResolutionSubmission | null
  resolution_reports?: ResolutionReport | null
  ai_verifications?: AiVerification | null
}

export interface ComplaintImage {
  id: string
  complaint_id: string
  image_url: string
  image_type: 'original' | 'before' | 'after' | 'dispute'
  created_at: string
}

export interface ComplaintAiAnalysis {
  id: string
  complaint_id: string
  category: string | null
  subcategory: string | null
  department_recommendation: string | null
  priority_recommendation: PriorityLevel | string | null
  summary: string | null
  recommended_actions: string[] | null
  suggested_sla_hours: number | null
  confidence: number | null
  needs_human_review?: boolean
  raw_response: Record<string, unknown> | null
  created_at: string
}

export interface ComplaintStatusHistory {
  id: string
  complaint_id: string
  old_status: ComplaintStatus | null
  new_status: ComplaintStatus
  updated_by: string | null
  notes: string | null
  created_at: string
  updater?: Profile
}

export interface SlaEvent {
  id: string
  complaint_id: string
  event_type: 'reminder' | 'warning' | 'critical_warning' | 'breach'
  elapsed_percent: number | null
  triggered_at: string
}

export interface Escalation {
  id: string
  complaint_id: string
  escalation_level: number // 1: Supervisor, 2: Dept Admin, 3: Central Authority
  previous_assigned_to: string | null
  escalated_to: string | null
  reason: string | null
  delay_duration_hours: number | null
  created_at: string
  complaints?: Complaint
  previous_officer?: Profile
  escalated_officer?: Profile
}

export interface ResolutionSubmission {
  id: string
  complaint_id: string
  officer_id: string | null
  action_taken: string
  before_photo_url: string
  after_photo_url: string
  submitted_at: string
  officer?: Profile
}

export interface ResolutionReport {
  id: string
  complaint_id: string
  officer_id: string | null
  report_text: string
  ai_generated_text: string | null
  is_edited: boolean
  confirmed_at: string
  created_at: string
}

export interface AiVerification {
  id: string
  complaint_id: string
  verdict: 'RESOLUTION_CONSISTENT' | 'POTENTIALLY_UNRESOLVED' | 'HUMAN_REVIEW_REQUIRED'
  confidence: number | null
  explanation: string | null
  raw_response?: Record<string, unknown> | null
  created_at: string
}

export interface CitizenVerification {
  id: string
  complaint_id: string
  citizen_id: string | null
  is_satisfied: boolean
  feedback_rating: number | null
  feedback_comment: string | null
  dispute_photo_url: string | null
  dispute_reason: string | null
  created_at: string
}

export interface ComplaintCluster {
  id: string
  cluster_title: string
  department_id: string | null
  category: string
  latitude: number
  longitude: number
  radius_meters: number
  complaint_count: number
  complaint_ids: string[]
  ai_insight: string | null
  root_cause_hypothesis: string | null
  created_at: string
  departments?: Department
}

export interface DepartmentScore {
  id: string
  department_id: string
  score: number
  sla_compliance_rate: number | null
  resolution_rate: number | null
  reopen_rate: number | null
  escalation_rate: number | null
  avg_resolution_hours: number | null
  calculated_at: string
  departments?: Department
}

export interface Notification {
  id: string
  profile_id: string
  title: string
  message: string
  complaint_id: string | null
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  user?: Profile
}

// ============================================================
// SLA HELPER & LABELS
// ============================================================

export function getSlaStatus(slaDeadline: string | null, slaStartTime: string | null): {
  percent: number
  label: 'normal' | 'reminder' | 'warning' | 'critical' | 'breached'
  hoursLeft: number
  formattedTimeLeft: string
} {
  if (!slaDeadline || !slaStartTime) {
    return { percent: 0, label: 'normal', hoursLeft: 0, formattedTimeLeft: 'N/A' }
  }

  const now = Date.now()
  const start = new Date(slaStartTime).getTime()
  const deadline = new Date(slaDeadline).getTime()
  const total = deadline - start
  const elapsed = now - start

  const percent = total > 0 ? Math.min(Math.round((elapsed / total) * 100), 100) : 100
  const diffMs = deadline - now
  const hoursLeft = Math.round(diffMs / 3600000)

  let label: 'normal' | 'reminder' | 'warning' | 'critical' | 'breached'
  if (now >= deadline || percent >= 100) label = 'breached'
  else if (percent >= 90) label = 'critical'
  else if (percent >= 75) label = 'warning'
  else if (percent >= 50) label = 'reminder'
  else label = 'normal'

  let formattedTimeLeft: string
  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs)
    const overdueHours = Math.floor(overdueMs / 3600000)
    const overdueMinutes = Math.floor((overdueMs % 3600000) / 60000)
    formattedTimeLeft = `Overdue by ${overdueHours}h ${overdueMinutes}m`
  } else {
    const remainingHours = Math.floor(diffMs / 3600000)
    const remainingMinutes = Math.floor((diffMs % 3600000) / 60000)
    formattedTimeLeft = `${remainingHours}h ${remainingMinutes}m remaining`
  }

  return { percent, label, hoursLeft, formattedTimeLeft }
}

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Submitted',
  RECEIVED: 'Received by Department',
  ASSIGNED: 'Officer Assigned',
  IN_PROGRESS: 'Work in Progress',
  RESOLUTION_SUBMITTED: 'Resolution Proof Submitted',
  AI_VERIFICATION: 'AI Verification in Progress',
  RESOLVED: 'Resolution Verified',
  CITIZEN_VERIFICATION: 'Awaiting Citizen Confirmation',
  CLOSED: 'Closed & Verified',
  DISPUTED: 'Disputed by Citizen',
  AI_DISPUTE_VERIFICATION: 'AI Dispute Analysis',
  REOPENED: 'Reopened',
  HUMAN_REVIEW_REQUIRED: 'Under Human Review',
}

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  CRITICAL: 'Critical (6h SLA)',
  HIGH: 'High (24h SLA)',
  MEDIUM: 'Medium (48h SLA)',
  LOW: 'Low (72h SLA)',
}

export const PRIORITY_SLA_HOURS: Record<PriorityLevel, number> = {
  CRITICAL: 6,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72,
}
