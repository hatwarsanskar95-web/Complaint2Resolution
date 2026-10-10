import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3, CheckCircle2, Clock, AlertTriangle, RotateCcw } from 'lucide-react'
import { FadeIn, AnimatedNumber } from '@/components/ui/motion'
import { getSlaStatus } from '@/lib/types'
import { getOfficerContext } from '@/lib/auth'

export default async function OfficerReportsPage() {
  const supabase = await createClient()
  const ctx = await getOfficerContext()
  if (!ctx) redirect('/officer/login')

  let query = supabase
    .from('complaints')
    .select('id, status, created_at, sla_start_time, sla_deadline')

  if (['officer', 'dept_admin'].includes(ctx.role)) {
    if (ctx.departmentId) {
      query = query.or(`department_id.eq.${ctx.departmentId},assigned_officer_id.eq.${ctx.id}`)
    } else {
      query = query.eq('assigned_officer_id', ctx.id)
    }
  }

  const { data: complaints } = await query
  const list = complaints || []
  const total = list.length
  const resolvedList = list.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status))
  const resolvedCount = resolvedList.length

  // Calculate real SLA compliance (complaints that did not breach SLA deadline)
  const compliantCount = list.filter(c => {
    if (!c.sla_deadline) return true
    const { label } = getSlaStatus(c.sla_deadline, c.sla_start_time)
    return label !== 'breached'
  }).length

  const slaCompliancePct = total > 0 ? Math.round((compliantCount / total) * 100) : 100

  // Calculate average resolution time in hours/days for resolved complaints
  let avgDaysStr = '0.0'
  if (resolvedList.length > 0) {
    const totalMs = resolvedList.reduce((acc, c) => {
      const start = new Date(c.sla_start_time || c.created_at).getTime()
      const end = new Date().getTime()
      return acc + (end - start)
    }, 0)
    const avgMs = totalMs / resolvedList.length
    const avgDays = avgMs / (1000 * 60 * 60 * 24)
    avgDaysStr = avgDays.toFixed(1)
  }

  const reopenedCount = list.filter(c => ['REOPENED', 'DISPUTED'].includes(c.status)).length

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <FadeIn direction="up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <BarChart3 className="text-emerald-400" size={24} /> My Officer Performance
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Real-time resolution metrics, SLA compliance, and operational summary calculated from active database complaints.
          </p>
        </div>
      </FadeIn>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#09120d] border border-slate-800">
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">
            {slaCompliancePct}%
          </p>
          <p className="text-xs text-slate-400 mt-1">SLA Compliance Rate</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#09120d] border border-slate-800">
          <p className="text-3xl font-extrabold text-white font-mono">
            {resolvedCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total Verified Resolves</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#09120d] border border-slate-800">
          <p className="text-3xl font-extrabold text-white font-mono">
            {avgDaysStr} days
          </p>
          <p className="text-xs text-slate-400 mt-1">Avg Resolution Time</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#09120d] border border-slate-800">
          <p className="text-3xl font-extrabold text-amber-400 font-mono">
            {reopenedCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Reopened / Disputed Tickets</p>
        </div>
      </div>
    </div>
  )
}
