import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSlaStatus, Complaint } from '@/lib/types'
import { getOfficerContext } from '@/lib/auth'
import OfficerQueueClient from '@/components/officer/OfficerQueueClient'

// ============================================================
// Phase 16 — Officer Dashboard & Filtered Queue Management
// 7-tab queue system with department-filtered complaints
// ============================================================

export default async function OfficerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/officer/login')

  // Resolve officer context & department mapping
  const ctx = await getOfficerContext()
  if (!ctx) redirect('/officer/login')

  const departmentId = ctx.departmentId
  const departmentName = ctx.department?.name ?? 'Assigned Department'
  const officerName = ctx.profile?.full_name ?? 'Officer'

  // Fetch all complaints for this officer's authorized department
  let query = supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .order('created_at', { ascending: false })

  // Dept-filter: officers and dept_admins see their department's complaints OR tickets assigned to them
  if (['officer', 'dept_admin'].includes(ctx.role)) {
    if (departmentId) {
      query = query.or(`department_id.eq.${departmentId},assigned_officer_id.eq.${user.id}`)
    } else {
      query = query.eq('assigned_officer_id', user.id)
    }
  }

  const { data: complaints } = await query
  const all = (complaints ?? []) as (Complaint & { departments?: { name: string; code: string } })[]

  // ── Build 7 queues ──
  const qNew = all.filter((c) => ['RECEIVED', 'SUBMITTED'].includes(c.status) || (c.status === 'ASSIGNED' && !c.assigned_officer_id))
  const qAssigned = all.filter((c) => c.status === 'ASSIGNED' && c.assigned_officer_id === user.id)
  const qInProgress = all.filter((c) => ['IN_PROGRESS', 'REOPENED', 'DISPUTED'].includes(c.status) || (c.status === 'ASSIGNED' && Boolean(c.assigned_officer_id) && c.assigned_officer_id !== user.id))
  const qNearSla = all.filter((c) => {
    if (!c.sla_deadline || !c.sla_start_time) return false
    const { percent } = getSlaStatus(c.sla_deadline, c.sla_start_time)
    return percent >= 75 && percent < 100 && !['RESOLVED', 'CLOSED'].includes(c.status)
  })
  const qBreached = all.filter((c) => {
    if (!c.sla_deadline || !c.sla_start_time) return false
    const { label } = getSlaStatus(c.sla_deadline, c.sla_start_time)
    return label === 'breached' && !['RESOLVED', 'CLOSED'].includes(c.status)
  })
  const qPendingVerification = all.filter((c) =>
    ['RESOLUTION_SUBMITTED', 'AI_VERIFICATION', 'CITIZEN_VERIFICATION'].includes(c.status)
  )
  const qClosed = all.filter((c) => ['CLOSED', 'RESOLVED'].includes(c.status))

  // Summary metrics
  const totalActive = all.filter((c) => !['CLOSED', 'RESOLVED'].includes(c.status)).length
  const totalClosed = qClosed.length
  const slaBreachedCount = qBreached.length
  const pendingCount = qNew.length

  return (
    <OfficerQueueClient
      officerName={officerName}
      departmentName={departmentName}
      officerId={user.id}
      departmentId={departmentId}
      queues={{
        new: qNew,
        assigned: qAssigned,
        inProgress: qInProgress,
        nearSla: qNearSla,
        breached: qBreached,
        pendingVerification: qPendingVerification,
        closed: qClosed,
      }}
      metrics={{ totalActive, totalClosed, slaBreachedCount, pendingCount }}
    />
  )
}
