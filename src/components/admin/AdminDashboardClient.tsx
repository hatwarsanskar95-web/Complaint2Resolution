'use client'

import React, { useState, useMemo } from 'react'
import {
  FileText,
  Clock,
  Settings as WrenchIcon,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Building2,
  Zap,
  Droplets,
  HardHat,
  Trash2,
  Trees,
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/ui/motion'
import { STATUS_LABELS, PRIORITY_LABELS, ComplaintStatus } from '@/lib/types'

export interface ComplaintRecord {
  id: string
  permanent_id: string
  category: string
  subcategory?: string
  priority: string
  status: string
  created_at: string
  department_id: string | null
  sla_deadline?: string | null
  sla_start_time?: string | null
}

export interface DepartmentRecord {
  id: string
  name: string
  code: string
}

interface AdminDashboardClientProps {
  greeting: string
  displayName: string
  isSuperAdmin: boolean
  departmentName: string | null
  complaints?: ComplaintRecord[]
  departments?: DepartmentRecord[]
}

export default function AdminDashboardClient({
  greeting,
  displayName,
  isSuperAdmin,
  departmentName,
  complaints = [],
  departments = [],
}: AdminDashboardClientProps) {
  const [trendRange, setTrendRange] = useState<'7D' | '1M' | '3M' | '6M' | '1Y'>('3M')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [selectedDept, setSelectedDept] = useState('All Departments')

  // Real Dynamic Metrics derived from Supabase Database
  const totalComplaints = complaints.length
  const pendingCount = complaints.filter((c) => ['SUBMITTED', 'RECEIVED'].includes(c.status)).length
  const inProgressCount = complaints.filter((c) => ['IN_PROGRESS', 'ASSIGNED', 'REOPENED'].includes(c.status)).length
  const resolvedCount = complaints.filter((c) => ['RESOLVED', 'CLOSED', 'RESOLUTION_SUBMITTED', 'CITIZEN_VERIFICATION'].includes(c.status)).length
  const reopenedCount = complaints.filter((c) => ['REOPENED', 'DISPUTED'].includes(c.status)).length
  const escalatedCount = complaints.filter((c) => c.status === 'HUMAN_REVIEW_REQUIRED').length

  // Filter complaints by selected department if filtered
  const filteredComplaints = useMemo(() => {
    if (selectedDept === 'All Departments') return complaints
    const matchedDept = departments.find((d) => d.name === selectedDept)
    if (!matchedDept) return complaints
    return complaints.filter((c) => c.department_id === matchedDept.id)
  }, [complaints, departments, selectedDept])

  // Donut Chart Status Segments
  const statusSegments = useMemo(() => {
    const total = complaints.length
    if (total === 0) {
      return [
        { key: 'pending', label: 'Pending', count: 0, pct: '0%', color: '#f97316' },
        { key: 'in_progress', label: 'In Progress', count: 0, pct: '0%', color: '#a855f7' },
        { key: 'resolved', label: 'Resolved', count: 0, pct: '0%', color: '#10b981' },
        { key: 'reopened', label: 'Reopened', count: 0, pct: '0%', color: '#6366f1' },
        { key: 'escalated', label: 'Escalated', count: 0, pct: '0%', color: '#ef4444' },
      ]
    }

    return [
      { key: 'pending', label: 'Pending', count: pendingCount, pct: `${Math.round((pendingCount / total) * 100)}%`, color: '#f97316' },
      { key: 'in_progress', label: 'In Progress', count: inProgressCount, pct: `${Math.round((inProgressCount / total) * 100)}%`, color: '#a855f7' },
      { key: 'resolved', label: 'Resolved', count: resolvedCount, pct: `${Math.round((resolvedCount / total) * 100)}%`, color: '#10b981' },
      { key: 'reopened', label: 'Reopened', count: reopenedCount, pct: `${Math.round((reopenedCount / total) * 100)}%`, color: '#6366f1' },
      { key: 'escalated', label: 'Escalated', count: escalatedCount, pct: `${Math.round((escalatedCount / total) * 100)}%`, color: '#ef4444' },
    ]
  }, [complaints, pendingCount, inProgressCount, resolvedCount, reopenedCount, escalatedCount])

  // Real Department Cards calculated dynamically
  const departmentCards = useMemo(() => {
    if (departments.length === 0) return []

    return departments.map((dept) => {
      const deptComplaints = complaints.filter((c) => c.department_id === dept.id)
      const totalDept = deptComplaints.length
      const resDept = deptComplaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length
      const rate = totalDept > 0 ? Math.round((resDept / totalDept) * 100) : 100

      let icon = <Building2 size={16} className="text-blue-400" />
      const lowerCode = dept.code.toLowerCase()
      if (lowerCode.includes('water')) icon = <Droplets size={16} className="text-blue-400" />
      else if (lowerCode.includes('road')) icon = <HardHat size={16} className="text-purple-400" />
      else if (lowerCode.includes('elect')) icon = <Zap size={16} className="text-amber-400" />
      else if (lowerCode.includes('sanit')) icon = <Trash2 size={16} className="text-teal-400" />
      else if (lowerCode.includes('park') || lowerCode.includes('tree')) icon = <Trees size={16} className="text-emerald-400" />

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        icon,
        complaints: totalDept.toLocaleString('en-IN'),
        resolutionRate: rate,
        slaCompliance: rate,
        score: rate,
      }
    })
  }, [departments, complaints])

  // Real Trend Data calculated dynamically from complaint timestamps
  const activeTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonthIdx = new Date().getMonth()
    const last6 = []

    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonthIdx - i + 12) % 12
      const monthName = months[mIdx]

      const rec = complaints.filter((c) => {
        const d = new Date(c.created_at)
        return d.getMonth() === mIdx
      }).length

      const res = complaints.filter((c) => {
        const d = new Date(c.created_at)
        return d.getMonth() === mIdx && ['RESOLVED', 'CLOSED'].includes(c.status)
      }).length

      last6.push({ month: monthName, received: rec, resolved: res })
    }

    return last6
  }, [complaints])

  // Donut SVG Math
  const donutRadius = 70
  const donutCircumference = 2 * Math.PI * donutRadius
  const donutTotal = totalComplaints

  let strokeOffsetAccumulator = 0
  const donutSlices = statusSegments.map((seg) => {
    const strokeDasharray = donutTotal > 0 ? (seg.count / donutTotal) * donutCircumference : 0
    const strokeDashoffset = -strokeOffsetAccumulator
    strokeOffsetAccumulator += strokeDasharray
    return {
      ...seg,
      dashArray: `${strokeDasharray} ${donutCircumference - strokeDasharray}`,
      dashOffset: strokeDashoffset,
    }
  })

  return (
    <div className="max-w-[1450px] mx-auto flex flex-col gap-6">
      {/* 1. Greeting Header */}
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {greeting}, {displayName} 👋
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Live Central Command Dashboard · Real-time data from database.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* 2. Top Metric Cards Row (4 Cards) */}
      <StaggerContainer staggerChildren={0.06} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <StaggerItem>
          <div className="glass-card p-4.5 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 flex items-center justify-between hover:border-blue-500/40 transition-all duration-300 shadow-md group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/35 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.25)]">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Complaints</p>
                <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedNumber value={totalComplaints} duration={1} />
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Database Total
              </span>
            </div>
          </div>
        </StaggerItem>

        {/* Pending */}
        <StaggerItem>
          <div className="glass-card p-4.5 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 flex items-center justify-between hover:border-orange-500/40 transition-all duration-300 shadow-md group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/35 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Pending</p>
                <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedNumber value={pendingCount} duration={0.8} />
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                Awaiting Work
              </span>
            </div>
          </div>
        </StaggerItem>

        {/* In Progress */}
        <StaggerItem>
          <div className="glass-card p-4.5 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 flex items-center justify-between hover:border-purple-500/40 transition-all duration-300 shadow-md group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/35 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                <WrenchIcon size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">In Progress</p>
                <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedNumber value={inProgressCount} duration={0.9} />
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                Field Active
              </span>
            </div>
          </div>
        </StaggerItem>

        {/* Resolved */}
        <StaggerItem>
          <div className="glass-card p-4.5 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 flex items-center justify-between hover:border-emerald-500/40 transition-all duration-300 shadow-md group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Resolved</p>
                <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedNumber value={resolvedCount} duration={1} />
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Verified Closed
              </span>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* 3. Middle Section: Donut Breakdown & Status List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Donut Chart */}
        <FadeIn direction="up" delay={0.1} className="lg:col-span-5">
          <div className="glass-card p-6 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 shadow-xl flex flex-col h-full">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Complaints Status Distribution
            </h3>

            <div className="flex items-center justify-center relative my-4">
              <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                <circle cx="100" cy="100" r={donutRadius} stroke="#1e293b" strokeWidth="18" fill="transparent" />
                {donutTotal > 0 && donutSlices.map((slice) => (
                  <circle
                    key={slice.key}
                    cx="100"
                    cy="100"
                    r={donutRadius}
                    stroke={slice.color}
                    strokeWidth="18"
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                ))}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {totalComplaints}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Total Complaints
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-800">
              {statusSegments.map((seg) => (
                <div key={seg.key} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/40">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                    {seg.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white">{seg.count}</span>
                    <span className="text-[10px] text-slate-400 w-8 text-right font-mono">{seg.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Right 7 Cols: Department Performance Matrix */}
        <FadeIn direction="up" delay={0.15} className="lg:col-span-7">
          <div className="glass-card p-6 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 shadow-xl flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Municipal Departments Load &amp; Resolution Performance
              </h3>
            </div>

            {departmentCards.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-xl">
                <Building2 size={24} className="mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-semibold">No departments configured in system</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {departmentCards.map((d) => (
                  <div key={d.id} className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                        {d.icon}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-white">{d.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Code: {d.code}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-bold text-white font-mono">{d.complaints}</p>
                        <p className="text-[10px] text-slate-400">Total Complaints</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400 font-mono">{d.resolutionRate}%</p>
                        <p className="text-[10px] text-slate-400">Resolution Rate</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      {/* 4. Recent Complaints Queue */}
      <FadeIn direction="up" delay={0.2}>
        <div className="glass-card p-6 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 shadow-xl flex flex-col gap-4">
          <h3 className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            System-Wide Active Complaints Log
          </h3>

          {complaints.length === 0 ? (
            <div className="p-10 text-center text-slate-400 border border-slate-800/80 rounded-xl bg-slate-950/40">
              <FileText size={32} className="mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold">0 Complaints Registered</p>
              <p className="text-xs text-slate-500 mt-0.5">All metrics will update live when citizens submit complaints.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {complaints.slice(0, 8).map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        {c.permanent_id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {STATUS_LABELS[c.status as ComplaintStatus] ?? c.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {PRIORITY_LABELS[c.priority as keyof typeof PRIORITY_LABELS] ?? c.priority}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">{c.category} — {c.permanent_id}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(c.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  )
}
