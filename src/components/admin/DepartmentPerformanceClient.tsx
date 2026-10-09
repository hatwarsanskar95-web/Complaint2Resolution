'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Filter,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldCheck,
  Loader2
} from 'lucide-react'
import { DepartmentAnalyticsResponse, DetailedDepartmentMetric } from '@/lib/services/analyticsService'

interface DepartmentPerformanceClientProps {
  initialData: DepartmentAnalyticsResponse
}

export default function DepartmentPerformanceClient({ initialData }: DepartmentPerformanceClientProps) {
  const [period, setPeriod] = useState<'1_month' | '6_months' | '1_year'>('6_months')
  const [data, setData] = useState<DepartmentAnalyticsResponse>(initialData)
  const [loading, setLoading] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<{ title: string; content: string } | null>(null)

  const fetchAnalytics = async (selectedPeriod: '1_month' | '6_months' | '1_year') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/department-analytics?period=${selectedPeriod}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to fetch department analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (newPeriod: '1_month' | '6_months' | '1_year') => {
    setPeriod(newPeriod)
    fetchAnalytics(newPeriod)
  }

  const periodLabels = {
    '1_month': 'Last 1 Month',
    '6_months': 'Last 6 Months (Default)',
    '1_year': 'Last 1 Year (Max)',
  }

  // Calculate top performers
  const departments = data.departments || []
  const maxScore = Math.max(...departments.map((d) => d.score), 100)
  const maxComplaints = Math.max(...departments.map((d) => d.total_complaints), 1)
  const maxAvgHours = Math.max(...departments.map((d) => d.avg_resolution_hours), 1)

  // Status distribution total
  const totalStatusCount = (data.statusDistribution || []).reduce((acc, curr) => acc + curr.count, 0)

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              DEPARTMENT ACCOUNTABILITY & PERFORMANCE ANALYTICS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Department Performance Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Compare municipal division efficiency, verified resolution rates, SLA compliance, and resolution timelines over time.
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-md">
          <Filter size={14} className="text-slate-400 ml-2 mr-1" />
          {(['1_month', '6_months', '1_year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              disabled={loading}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === p
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {p === '1_month' ? '1 Month' : p === '6_months' ? '6 Months' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-emerald-400" />
          <span>Updating department analytics for {periodLabels[period]}…</span>
        </div>
      )}

      {/* DEPARTMENT PERFORMANCE SUMMARY CARDS (One card per department) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} className="text-emerald-400" />
            <span>Department Summary Matrix ({departments.length} Divisions)</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Period: {periodLabels[period]}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Link
              key={dept.department_id}
              href={`/admin/complaints?department_id=${dept.department_id}`}
              className="group glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 bg-slate-900/60 hover:bg-slate-900/90 transition-all shadow-lg flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    {dept.department_code}
                  </span>
                  <div className="flex items-center gap-1">
                    <Award size={14} className="text-amber-400" />
                    <span className="text-xs font-mono font-bold text-emerald-400">{dept.score} / 100</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors mt-2">
                  {dept.department_name}
                </h3>
              </div>

              {/* Grid of KPIs */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Intake</p>
                  <p className="font-mono font-bold text-slate-200 text-sm">{dept.total_complaints}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Resolved</p>
                  <p className="font-mono font-bold text-emerald-400 text-sm">{dept.resolved_count}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Currently Open</p>
                  <p className="font-mono font-bold text-amber-400 text-sm">{dept.open_count}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">SLA Met Rate</p>
                  <p className="font-mono font-bold text-cyan-400 text-sm">{dept.sla_compliance_rate}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Avg Resolution: <strong className="text-slate-200">{dept.avg_resolution_hours}h</strong></span>
                <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  View Complaints <ChevronRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* REQUIRED CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* CHART 1: Department Performance Ranking */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award size={16} className="text-amber-400" /> Chart 1 — Performance Score Ranking
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">Score = 100 - 30(Breach) - 25(Reopen) - 20(Escalation) + 15(Resolution)</p>

          <div className="space-y-3 pt-2">
            {departments.map((dept) => (
              <div key={dept.department_id} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-200">{dept.department_name}</span>
                  <span className="font-mono text-emerald-400 font-bold">{dept.score} pts</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dept.score}%` }}
                    title={`${dept.department_name}: ${dept.score} score points`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 2: Complaint Status Distribution */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-cyan-400" /> Chart 2 — Complaint Status Distribution
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">Lifecyle distribution across all registered complaints</p>

          <div className="space-y-3 pt-2">
            {(data.statusDistribution || []).map((item) => {
              const pct = totalStatusCount > 0 ? Math.round((item.count / totalStatusCount) * 100) : 0
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-mono text-slate-200 font-bold">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: item.color }}
                      title={`${item.name}: ${item.count} complaints (${pct}%)`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CHART 3: SLA Compliance */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" /> Chart 3 — SLA Met vs Breached
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">Completed complaint SLA fulfillment per division</p>

          <div className="space-y-3 pt-2">
            {departments.map((dept) => {
              const totalResolved = dept.sla_met_count + dept.sla_breached_count
              const metPct = totalResolved > 0 ? Math.round((dept.sla_met_count / totalResolved) * 100) : 100
              return (
                <div key={dept.department_id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{dept.department_name}</span>
                    <span className="font-mono text-xs">
                      <strong className="text-emerald-400">{dept.sla_met_count} Met</strong> / <span className="text-rose-400">{dept.sla_breached_count} Breached</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${metPct}%` }}
                      title={`Met SLA: ${dept.sla_met_count}`}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${100 - metPct}%` }}
                      title={`Breached SLA: ${dept.sla_breached_count}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CHART 4: Resolution Trends */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-400" /> Chart 4 — Resolution Volume Trends
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">Total complaints resolved per department over time</p>

          <div className="space-y-3 pt-2">
            {departments.map((dept) => (
              <div key={dept.department_id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-300">{dept.department_name}</span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">Intake: {dept.total_complaints}</span>
                  <span className="font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    {dept.resolved_count} Resolved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 5: Average Resolution Time */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-amber-400" /> Chart 5 — Average Resolution Time
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">Mean elapsed hours from submission to resolution</p>

          <div className="space-y-3 pt-2">
            {departments.map((dept) => {
              const barWidth = maxAvgHours > 0 ? Math.min(100, Math.round((dept.avg_resolution_hours / maxAvgHours) * 100)) : 0
              return (
                <div key={dept.department_id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{dept.department_name}</span>
                    <span className="font-mono text-amber-300 font-bold">{dept.avg_resolution_hours} Hours</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth || 5}%` }}
                      title={`${dept.department_name}: ${dept.avg_resolution_hours} hours average`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CHART 6: Verified Resolution Percentage */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" /> Chart 6 — Verified Resolution Rate
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">Percentage of intake reaching verified closed state</p>

          <div className="space-y-3 pt-2">
            {departments.map((dept) => (
              <div key={dept.department_id} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{dept.department_name}</span>
                  <span className="font-mono text-emerald-400 font-bold">{dept.verified_resolution_rate}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dept.verified_resolution_rate}%` }}
                    title={`${dept.department_name}: ${dept.verified_resolution_rate}% verified resolution rate`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* D. DEPARTMENT RANKING TABLE */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl space-y-0">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              <span>Official Department Performance Ranking Table</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Sorted by official performance score ({periodLabels[period]})</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 text-center">Complaints Received</th>
                <th className="py-3.5 px-4 text-center">Verified Resolutions</th>
                <th className="py-3.5 px-4 text-center">SLA Compliance</th>
                <th className="py-3.5 px-4 text-center">Avg Resolution Time</th>
                <th className="py-3.5 px-4 text-right">Performance Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {departments.map((dept, index) => (
                <tr key={dept.department_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      index === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      index === 1 ? 'bg-slate-400/20 text-slate-200 border border-slate-400/40' :
                      index === 2 ? 'bg-amber-800/20 text-amber-400 border border-amber-800/40' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-xs">{dept.department_name}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">Code: {dept.department_code}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                    {dept.total_complaints}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                    {dept.resolved_count} ({dept.verified_resolution_rate}%)
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-400">
                    {dept.sla_compliance_rate}%
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-amber-300 font-semibold">
                    {dept.avg_resolution_hours}h
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                    <span className="bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                      {dept.score} / 100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
