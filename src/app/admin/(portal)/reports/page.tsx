import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BarChart3, TrendingUp, CheckCircle2, ShieldCheck, Clock, Building2, Download, Layers } from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

export default async function AdminReportsPage() {
  const adminCtx = await getAdminContext()
  if (!adminCtx) redirect('/admin/login')

  const supabase = await createClient()

  // Fetch all complaints for analytics calculation
  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, category, status, priority, created_at, department_id, sla_deadline, sla_start_time, departments(name, code)')

  // Fetch departments
  const { data: depts } = await supabase
    .from('departments')
    .select('id, name, code')

  const list = complaints || []
  const totalCount = list.length
  const resolvedCount = list.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length
  const activeCount = totalCount - resolvedCount

  const overallResolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100

  // Category distribution calculation
  const categoryCounts: Record<string, number> = {}
  list.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1
  })

  // Department breakdown
  const departmentBreakdown = (depts || []).map((d) => {
    const deptComplaints = list.filter((c) => c.department_id === d.id)
    const total = deptComplaints.length
    const resolved = deptComplaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100
    return {
      name: d.name,
      code: d.code,
      total,
      resolved,
      rate,
    }
  })

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <BarChart3 className="text-emerald-400" size={24} /> System Reports &amp; Analytics
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Executive performance metrics, SLA efficiency reports, and departmental load analytics.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400">Total System Intake</p>
          <p className="text-3xl font-extrabold text-white mt-1 font-mono">{totalCount}</p>
        </div>
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400">Active Workload</p>
          <p className="text-3xl font-extrabold text-amber-400 mt-1 font-mono">{activeCount}</p>
        </div>
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400">Verified Resolved</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">{resolvedCount}</p>
        </div>
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400">Resolution Efficiency</p>
          <p className="text-3xl font-extrabold text-cyan-400 mt-1 font-mono">{overallResolutionRate}%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Department SLA Efficiency Breakdown */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} className="text-blue-400" /> Department Performance Breakdown
          </h2>

          {departmentBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No department metrics available.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {departmentBreakdown.map((dept) => (
                <div key={dept.code} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{dept.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Code: {dept.code}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-300">{dept.resolved} / {dept.total}</span>
                    <span className="font-bold text-emerald-400">{dept.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Intake Breakdown */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-purple-400" /> Category Distribution
          </h2>

          {Object.keys(categoryCounts).length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No category data recorded.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
                return (
                  <div key={cat} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-200">{cat}</span>
                      <span className="font-mono text-cyan-400 font-bold">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
