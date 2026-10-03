import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSlaStatus, Complaint } from '@/lib/types'
import OfficerQueueClient from '@/components/officer/OfficerQueueClient'

// ============================================================
// Phase 16 — Officer Dashboard & Filtered Queue Management
// 7-tab queue system with department-filtered complaints
// ============================================================

export default async function OfficerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/officer/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Resolve department for filtering
  const { data: od } = await supabase
    .from('officer_departments')
    .select('department_id, departments(name, code)')
    .eq('profile_id', user.id)
    .single()

  const departmentId = od?.department_id ?? null
  const deptRaw = od?.departments as { name: string; code: string } | null | undefined
  const departmentName = deptRaw?.name ?? 'All Departments'
  const officerName = profile?.full_name ?? 'Officer'

  // Fetch all complaints for this officer's department (Phase 15 authorization)
  let query = supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .order('created_at', { ascending: false })

  // Dept-filter: officers only see their dept, super_admins see all
  if (profile?.role === 'officer' && departmentId) {
    query = query.eq('department_id', departmentId)
  }

  const { data: complaints } = await query
  const all = (complaints ?? []) as (Complaint & { departments?: { name: string; code: string } })[]

  // ── Build 7 queues ──
  const qNew = all.filter((c) => ['RECEIVED', 'SUBMITTED'].includes(c.status))
  const qAssigned = all.filter((c) => c.status === 'ASSIGNED' && c.assigned_officer_id === user.id)
  const qInProgress = all.filter((c) => ['IN_PROGRESS', 'REOPENED'].includes(c.status))
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
