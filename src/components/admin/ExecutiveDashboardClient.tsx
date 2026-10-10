'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldAlert,
  Building,
  BarChart3,
  Flame,
  ArrowUpRight,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useRealtimeComplaints } from '@/hooks/useRealtimeComplaints'

interface MetricsData {
  totalComplaints: number
  resolutionRate: number
  activeTickets: number
  slaBreaches: number
  escalationsCount: number
  reopenRate: number
  avgResolutionTimeHours: number
}

interface ExecutiveDashboardClientProps {
  initialMetrics: MetricsData
  initialNearSla: any[]
  initialDepartmentWorkload: Array<{ id: string; name: string; count: number }>
}

export default function ExecutiveDashboardClient({
  initialMetrics,
  initialNearSla,
  initialDepartmentWorkload,
}: ExecutiveDashboardClientProps) {
  const router = useRouter()
  const [metrics, setMetrics] = useState<MetricsData>(initialMetrics)
  const [nearSla, setNearSla] = useState<any[]>(initialNearSla)
  const [workload, setWorkload] = useState(initialDepartmentWorkload)
  const [refreshing, setRefreshing] = useState(false)
  const [realtimeOk, setRealtimeOk] = useState(true)

  // Sync when server re-fetches (via router.refresh) push new props down
  useEffect(() => { setMetrics(initialMetrics) }, [initialMetrics])
  useEffect(() => { setNearSla(initialNearSla) }, [initialNearSla])
  useEffect(() => { setWorkload(initialDepartmentWorkload) }, [initialDepartmentWorkload])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    router.refresh()
    await new Promise((r) => setTimeout(r, 800))
    setRefreshing(false)
  }, [router])

  // ── Supabase Realtime ──
  // Subscribes to ALL complaint changes (admin sees everything).
  // On any event, triggers router.refresh() which re-fetches the Server Component
  // and pushes updated metrics/workload/nearSla props down to this client.
  useRealtimeComplaints({
    channelName: 'admin-executive-dashboard',
    departmentId: null, // null = subscribe to all departments
    onRefresh: () => {
      setRealtimeOk(true)
      router.refresh()
    },
  })

  // Fallback poll every 5 minutes
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [router])

  const maxWorkload = Math.max(...workload.map((w) => w.count), 1)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-emerald-400">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            Executive Command & Municipal Performance Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time municipal operations monitoring, KPI metrics, and SLA urgency tracking.
          </p>
        </div>
        {/* Live indicator + refresh */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            realtimeOk ? 'bg-emerald-950/40 border-emerald-500/25 text-emerald-400' : 'bg-amber-950/40 border-amber-500/25 text-amber-400'
          }`}>
            {realtimeOk ? <Wifi size={12} /> : <WifiOff size={12} />}
            {realtimeOk ? 'Live' : 'Reconnecting…'}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-xs text-slate-300 hover:text-emerald-400 font-semibold transition-all disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Live SLA Urgency Alert Banner */}
      {(metrics.slaBreaches > 0 || nearSla.length > 0) && (
        <div className="bg-gradient-to-r from-red-950/80 via-amber-950/60 to-slate-900 border border-red-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-red-400 shrink-0 animate-pulse" />
            <div>
              <h3 className="font-bold text-red-200 text-sm">
                SLA Urgency Alert: {metrics.slaBreaches} Active Breaches | {nearSla.length} Tickets Nearing Breach (&lt;2h)
              </h3>
              <p className="text-xs text-red-300/80">
                Immediate department dispatch required to prevent performance penalty escalation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid (7 Key Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Total Complaints</span>
          <p className="text-2xl font-extrabold text-slate-100 font-mono">{metrics.totalComplaints}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Resolution Rate</span>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono">{metrics.resolutionRate}%</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Active Tickets</span>
          <p className="text-2xl font-extrabold text-blue-400 font-mono">{metrics.activeTickets}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">SLA Breaches</span>
          <p className="text-2xl font-extrabold text-red-400 font-mono">{metrics.slaBreaches}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Escalations</span>
          <p className="text-2xl font-extrabold text-amber-400 font-mono">{metrics.escalationsCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Reopen Rate</span>
          <p className="text-2xl font-extrabold text-purple-400 font-mono">{metrics.reopenRate}%</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Avg Res Time</span>
          <p className="text-2xl font-extrabold text-teal-400 font-mono">{metrics.avgResolutionTimeHours}h</p>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload Progress Bars */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-emerald-400" />
            Department Workload Distribution
          </h2>
          <div className="space-y-4">
            {workload.map((w) => {
              const pct = Math.round((w.count / maxWorkload) * 100)
              return (
                <div key={w.id} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-300">{w.name}</span>
                    <span className="text-slate-400 font-mono">{w.count} tickets</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Urgent SLA / Escalations List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            Urgent Tickets Nearing Breach (&lt;2 Hours)
          </h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {nearSla.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">
                No tickets currently nearing SLA breach.
              </p>
            ) : (
              nearSla.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-amber-400">{item.permanent_id}</span>
                    <p className="text-slate-300 font-medium">{item.category}</p>
                    <p className="text-slate-500 text-[11px]">{item.departments?.name ?? 'Unassigned'}</p>
                  </div>
                  <div className="text-right font-mono text-red-400">
                    {new Date(item.sla_deadline).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
