import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ExecutiveDashboardClient from '@/components/admin/ExecutiveDashboardClient'

export default async function ExecutiveDashboardPage() {
  const adminCtx = await getAdminContext()
  if (!adminCtx) redirect('/admin/login')

  const supabase = await createClient()

  const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('complaints')
    .select('id, status, priority, department_id, sla_deadline, created_at, closed_at, departments(name)')

  if (adminCtx.isDeptAdmin && adminCtx.departmentId) {
    query = query.eq('department_id', adminCtx.departmentId)
  }

  const [{ data: allComplaints }, { data: depts }] = await Promise.all([
    query,
    supabase.from('departments').select('id, name'),
  ])

  const list = allComplaints || []
  const totalComplaints = list.length
  const closedCount = list.filter((c) => c.status === 'CLOSED' || c.status === 'RESOLVED').length
  const activeTickets = list.filter((c) => c.status !== 'CLOSED' && c.status !== 'RESOLVED').length

  const slaBreaches = list.filter(
    (c) => c.sla_deadline && new Date(c.sla_deadline) < new Date() && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
  ).length

  const nearSlaBreaches = list.filter(
    (c) =>
      c.sla_deadline &&
      new Date(c.sla_deadline) >= new Date() &&
      new Date(c.sla_deadline) <= new Date(twoHoursLater) &&
      c.status !== 'CLOSED' &&
      c.status !== 'RESOLVED'
  )

  const reopenedCount = list.filter((c) => c.status === 'REOPENED').length
  const escalationsCount = list.filter((c) => c.status === 'HUMAN_REVIEW_REQUIRED' || c.status === 'DISPUTED').length

  const resolutionRate = totalComplaints > 0 ? Math.round((closedCount / totalComplaints) * 100) : 0
  const reopenRate = closedCount + reopenedCount > 0 ? Math.round((reopenedCount / (closedCount + reopenedCount)) * 100) : 0

  const deptMap: Record<string, { id: string; name: string; count: number }> = {}
  ;(depts || []).forEach((d) => {
    deptMap[d.id] = { id: d.id, name: d.name, count: 0 }
  })

  list.forEach((c) => {
    if (c.department_id && deptMap[c.department_id]) {
      deptMap[c.department_id].count++
    }
  })

  const departmentWorkload = Object.values(deptMap)

  return (
    <ExecutiveDashboardClient
      initialMetrics={{
        totalComplaints,
        resolutionRate,
        activeTickets,
        slaBreaches,
        escalationsCount,
        reopenRate,
        avgResolutionTimeHours: 24.5,
      }}
      initialNearSla={nearSlaBreaches}
      initialDepartmentWorkload={departmentWorkload}
    />
  )
}
