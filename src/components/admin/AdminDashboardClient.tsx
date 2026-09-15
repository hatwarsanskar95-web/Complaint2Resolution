'use client'

import React, { useState, useMemo } from 'react'
import {
  FileText,
  Clock,
  Settings as WrenchIcon,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Activity,
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

interface AdminDashboardClientProps {
  greeting: string
  displayName: string
  isSuperAdmin: boolean
  departmentName: string | null
}

// Monthly Trend Datasets for 3M (Default), 7D, 1M, 6M, 1Y
const TREND_DATASETS: Record<
  string,
  Array<{ month: string; received: number; resolved: number }>
> = {
  '3M': [
    { month: 'Jan', received: 240, resolved: 180 },
    { month: 'Feb', received: 260, resolved: 220 },
    { month: 'Mar', received: 420, resolved: 360 },
    { month: 'Apr', received: 380, resolved: 310 },
    { month: 'May', received: 642, resolved: 498 },
    { month: 'Jun', received: 510, resolved: 420 },
    { month: 'Jul', received: 680, resolved: 590 },
    { month: 'Aug', received: 610, resolved: 540 },
    { month: 'Sep', received: 720, resolved: 650 },
  ],
  '7D': [
    { month: 'Mon', received: 85, resolved: 78 },
    { month: 'Tue', received: 110, resolved: 95 },
    { month: 'Wed', received: 95, resolved: 88 },
    { month: 'Thu', received: 130, resolved: 115 },
    { month: 'Fri', received: 140, resolved: 120 },
    { month: 'Sat', received: 70, resolved: 65 },
    { month: 'Sun', received: 60, resolved: 55 },
  ],
  '1M': [
    { month: 'Week 1', received: 310, resolved: 280 },
    { month: 'Week 2', received: 340, resolved: 300 },
    { month: 'Week 3', received: 420, resolved: 390 },
    { month: 'Week 4', received: 390, resolved: 360 },
  ],
  '6M': [
    { month: 'Apr', received: 380, resolved: 310 },
    { month: 'May', received: 642, resolved: 498 },
    { month: 'Jun', received: 510, resolved: 420 },
    { month: 'Jul', received: 680, resolved: 590 },
    { month: 'Aug', received: 610, resolved: 540 },
    { month: 'Sep', received: 720, resolved: 650 },
  ],
  '1Y': [
    { month: 'Oct', received: 450, resolved: 410 },
    { month: 'Nov', received: 490, resolved: 440 },
    { month: 'Dec', received: 520, resolved: 480 },
    { month: 'Jan', received: 240, resolved: 180 },
    { month: 'Feb', received: 260, resolved: 220 },
    { month: 'Mar', received: 420, resolved: 360 },
    { month: 'Apr', received: 380, resolved: 310 },
    { month: 'May', received: 642, resolved: 498 },
    { month: 'Jun', received: 510, resolved: 420 },
    { month: 'Jul', received: 680, resolved: 590 },
    { month: 'Aug', received: 610, resolved: 540 },
    { month: 'Sep', received: 720, resolved: 650 },
  ],
}

// Department Performance Records
const DEPARTMENTS_DATA = [
  {
    name: 'Water Management',
    icon: <Droplets size={16} className="text-blue-400" />,
    iconBg: 'bg-blue-500/15 border-blue-500/30',
    complaints: '2,134',
    resolutionRate: 92,
    slaCompliance: 89,
    score: 92,
    scoreColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  },
  {
    name: 'Roads / Public Works',
    icon: <HardHat size={16} className="text-purple-400" />,
    iconBg: 'bg-purple-500/15 border-purple-500/30',
    complaints: '1,876',
    resolutionRate: 86,
    slaCompliance: 81,
    score: 85,
    scoreColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  },
  {
    name: 'Electrical',
    icon: <Zap size={16} className="text-amber-400" />,
    iconBg: 'bg-amber-500/15 border-amber-500/30',
    complaints: '1,642',
    resolutionRate: 88,
    slaCompliance: 84,
    score: 87,
    scoreColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  },
  {
    name: 'Sanitation',
    icon: <Trash2 size={16} className="text-teal-400" />,
    iconBg: 'bg-teal-500/15 border-teal-500/30',
    complaints: '2,408',
    resolutionRate: 78,
    slaCompliance: 76,
    score: 79,
    scoreColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
  },
  {
    name: 'Drainage',
    icon: <Building2 size={16} className="text-indigo-400" />,
    iconBg: 'bg-indigo-500/15 border-indigo-500/30',
    complaints: '1,298',
    resolutionRate: 82,
    slaCompliance: 79,
    score: 81,
    scoreColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  },
  {
    name: 'Parks & Recreation',
    icon: <Trees size={16} className="text-emerald-400" />,
    iconBg: 'bg-emerald-500/15 border-emerald-500/30',
    complaints: '1,128',
    resolutionRate: 90,
    slaCompliance: 87,
    score: 89,
    scoreColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  },
]

export default function AdminDashboardClient({
  greeting,
  displayName,
  isSuperAdmin,
  departmentName,
}: AdminDashboardClientProps) {
  const [trendRange, setTrendRange] = useState<'7D' | '1M' | '3M' | '6M' | '1Y'>('3M')
  const [hoverIndex, setHoverIndex] = useState<number | null>(4) // Default May hover
  const [selectedDept, setSelectedDept] = useState('All Departments')
  const [selectedInsightPeriod, setSelectedInsightPeriod] = useState('This Month')
  const [highlightLegend, setHighlightLegend] = useState<'received' | 'resolved' | null>(null)
  const [activeDonutSegment, setActiveDonutSegment] = useState<string | null>(null)

  const activeTrendData = useMemo(() => TREND_DATASETS[trendRange] || TREND_DATASETS['3M'], [trendRange])

  // Donut Chart Status Segments
  const statusSegments = useMemo(
    () => [
      { key: 'pending', label: 'Pending', count: 320, pct: '3%', color: '#f97316' },
      { key: 'in_progress', label: 'In Progress', count: 512, pct: '4%', color: '#a855f7' },
      { key: 'resolved', label: 'Resolved', count: 11402, pct: '91%', color: '#10b981' },
      { key: 'reopened', label: 'Reopened', count: 186, pct: '1%', color: '#6366f1' },
      { key: 'escalated', label: 'Escalated', count: 66, pct: '1%', color: '#ef4444' },
    ],
    []
  )

  // Smooth Bezier path generator for SVG Chart
  const { pathReceived, pathResolved, areaReceived, areaResolved, pointsReceived, pointsResolved } =
    useMemo(() => {
      const width = 650
      const height = 220
      const padding = 35
      const maxVal = 800

      const data = activeTrendData
      const stepX = (width - padding * 2) / (data.length - 1)

      const ptsRec = data.map((d, i) => ({
        x: padding + i * stepX,
        y: height - padding - (d.received / maxVal) * (height - padding * 2),
      }))

      const ptsRes = data.map((d, i) => ({
        x: padding + i * stepX,
        y: height - padding - (d.resolved / maxVal) * (height - padding * 2),
      }))

      const buildSmoothPath = (pts: Array<{ x: number; y: number }>) => {
        if (pts.length === 0) return ''
        let d = `M ${pts[0].x},${pts[0].y}`
        for (let i = 0; i < pts.length - 1; i++) {
          const curr = pts[i]
          const next = pts[i + 1]
          const cp1x = curr.x + (next.x - curr.x) / 2
          const cp1y = curr.y
          const cp2x = curr.x + (next.x - curr.x) / 2
          const cp2y = next.y
          d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`
        }
        return d
      }

      const pathRec = buildSmoothPath(ptsRec)
      const pathRes = buildSmoothPath(ptsRes)

      const areaRec = `${pathRec} L ${ptsRec[ptsRec.length - 1].x},${height - padding} L ${ptsRec[0].x},${height - padding} Z`
      const areaRes = `${pathRes} L ${ptsRes[ptsRes.length - 1].x},${height - padding} L ${ptsRes[0].x},${height - padding} Z`

      return {
        pathReceived: pathRec,
        pathResolved: pathRes,
        areaReceived: areaRec,
        areaResolved: areaRes,
        pointsReceived: ptsRec,
        pointsResolved: ptsRes,
      }
    }, [activeTrendData])

  // Donut SVG circumference math
  const donutRadius = 70
  const donutCircumference = 2 * Math.PI * donutRadius
  const donutTotal = 12486

  let strokeOffsetAccumulator = 0
  const donutSlices = statusSegments.map((seg) => {
    const strokeDasharray = (seg.count / donutTotal) * donutCircumference
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
              Here&apos;s the current state of civic complaints across all departments.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* 2. Top Metric Cards Row (4 Cards) */}
      <StaggerContainer staggerChildren={0.06} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <StaggerItem>
          <div className="glass-card p-4.5 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 flex items-center justify-between hover:border-blue-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/35 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.25)]">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Complaints</p>
                <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedNumber value={12486} duration={1} />
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                ↑ 12%
              </span>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>
        </StaggerItem>

        {/* Pending */}
        <StaggerItem>
          <div className="glass-card p-4.5 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 flex items-center justify-between hover:border-orange-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/35 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Pending</p>
                <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedNumber value={320} duration={0.8} />
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                ↓ 8%
              </span>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>
        </StaggerItem>

        {/* In Progress */}
        <StaggerItem>
          <div className="glass-card p-4.5 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 flex items-center justify-between hover:border-purple-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/35 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                <WrenchIcon size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">In Progress</p>
                <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedNumber value={512} duration={0.9} />
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                ↑ 5%
              </span>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>
        </StaggerItem>

        {/* Resolved */}
        <StaggerItem>
          <div className="glass-card p-4.5 rounded-2xl border border-[#1e293b] bg-[#0c1322]/80 flex items-center justify-between hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Resolved</p>
                <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedNumber value={11402} duration={1.1} />
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                ↑ 18%
              </span>
              <p className="text-[10px] text-slate-400 mt-1">vs last month</p>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* 3. Middle Row: Complaint Trends (Glowing, Interactive) & Complaint Status (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Complaint Trends Chart */}
        <FadeIn direction="up" delay={0.1} className="lg:col-span-7">
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#1e293b] bg-[#0b101d]/90 shadow-xl flex flex-col h-full relative overflow-hidden">
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <TrendingUp size={18} className="text-blue-400" />
                  Complaint Trends
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total complaints received and resolved over time
                </p>
              </div>

              {/* Time Range Selector & Interactive Legends */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-xs pr-2 border-r border-slate-800">
                  <button
                    onMouseEnter={() => setHighlightLegend('received')}
                    onMouseLeave={() => setHighlightLegend(null)}
                    className={`flex items-center gap-1.5 transition-opacity ${
                      highlightLegend === 'resolved' ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                    <span className="text-slate-300 font-medium">Received</span>
                  </button>
                  <button
                    onMouseEnter={() => setHighlightLegend('resolved')}
                    onMouseLeave={() => setHighlightLegend(null)}
                    className={`flex items-center gap-1.5 transition-opacity ${
                      highlightLegend === 'received' ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-slate-300 font-medium">Resolved</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-slate-800 text-xs">
                  {(['7D', '1M', '3M', '6M', '1Y'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setTrendRange(r)
                        setHoverIndex(null)
                      }}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                        trendRange === r
                          ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Glowing Interactive SVG Chart Area */}
            <div className="relative flex-1 min-h-[260px] w-full pt-2">
              <svg
                viewBox="0 0 650 220"
                className="w-full h-full overflow-visible select-none"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const mouseX = e.clientX - rect.left
                  const width = rect.width
                  const pct = Math.max(0, Math.min(1, mouseX / width))
                  const index = Math.round(pct * (activeTrendData.length - 1))
                  setHoverIndex(index)
                }}
                onMouseLeave={() => setHoverIndex(4)}
              >
                <defs>
                  {/* Neon Glow Filters */}
                  <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Gradient Area Fills */}
                  <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                {[0, 200, 400, 600, 800].map((val, i) => {
                  const y = 220 - 35 - (val / 800) * (220 - 70)
                  return (
                    <g key={val}>
                      <line x1="35" y1={y} x2="615" y2={y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                      <text x="22" y={y + 4} fill="#64748b" fontSize="10" textAnchor="end" className="font-mono">
                        {val}
                      </text>
                    </g>
                  )
                })}

                {/* Gradient Area under curve */}
                <path
                  d={areaReceived}
                  fill="url(#grad-blue)"
                  className={`transition-opacity duration-300 ${
                    highlightLegend === 'resolved' ? 'opacity-10' : 'opacity-100'
                  }`}
                />
                <path
                  d={areaResolved}
                  fill="url(#grad-green)"
                  className={`transition-opacity duration-300 ${
                    highlightLegend === 'received' ? 'opacity-10' : 'opacity-100'
                  }`}
                />

                {/* Stroke Lines with Neon Glow */}
                <path
                  d={pathReceived}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  filter="url(#glow-blue)"
                  className={`transition-opacity duration-300 ${
                    highlightLegend === 'resolved' ? 'opacity-20' : 'opacity-100'
                  }`}
                />
                <path
                  d={pathResolved}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  filter="url(#glow-green)"
                  className={`transition-opacity duration-300 ${
                    highlightLegend === 'received' ? 'opacity-20' : 'opacity-100'
                  }`}
                />

                {/* X-Axis Month Labels */}
                {activeTrendData.map((d, i) => {
                  const pt = pointsReceived[i]
                  if (!pt) return null
                  const isSelected = hoverIndex === i
                  return (
                    <text
                      key={d.month}
                      x={pt.x}
                      y={212}
                      fill={isSelected ? '#38bdf8' : '#94a3b8'}
                      fontSize="11"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                      className="transition-colors cursor-pointer"
                    >
                      {d.month}
                    </text>
                  )
                })}

                {/* Hover Interaction Guide Line & Glowing Nodes */}
                {hoverIndex !== null && pointsReceived[hoverIndex] && pointsResolved[hoverIndex] && (
                  <g className="transition-all duration-150">
                    {/* Vertical dashed indicator */}
                    <line
                      x1={pointsReceived[hoverIndex].x}
                      y1="20"
                      x2={pointsReceived[hoverIndex].x}
                      y2="185"
                      stroke="#38bdf8"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                      className="opacity-70"
                    />

                    {/* Received Node */}
                    <circle
                      cx={pointsReceived[hoverIndex].x}
                      cy={pointsReceived[hoverIndex].y}
                      r="6"
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth="2"
                      filter="url(#glow-blue)"
                    />
                    {/* Resolved Node */}
                    <circle
                      cx={pointsResolved[hoverIndex].x}
                      cy={pointsResolved[hoverIndex].y}
                      r="6"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                      filter="url(#glow-green)"
                    />
                  </g>
                )}
              </svg>

              {/* Floating Interactive Glassmorphic Tooltip matching screenshot */}
              {hoverIndex !== null && activeTrendData[hoverIndex] && pointsReceived[hoverIndex] && (
                <div
                  className="absolute pointer-events-none z-30 transition-all duration-200"
                  style={{
                    left: `${(pointsReceived[hoverIndex].x / 650) * 100}%`,
                    top: '20px',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="bg-[#0b1329]/95 border border-blue-500/40 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-xs min-w-[140px]">
                    <div className="font-bold text-white text-xs mb-1.5 border-b border-slate-800 pb-1">
                      {activeTrendData[hoverIndex].month} 2025
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[11px] mb-1">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                        Received:
                      </span>
                      <span className="font-bold text-blue-400 font-mono">
                        {activeTrendData[hoverIndex].received}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                        Resolved:
                      </span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {activeTrendData[hoverIndex].resolved}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Right 5 Cols: Complaint Status Donut Chart */}
        <FadeIn direction="up" delay={0.15} className="lg:col-span-5">
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#1e293b] bg-[#0b101d]/90 shadow-xl flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Complaint Status
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Current distribution across all complaints
                </p>
              </div>

              {/* Department Selector */}
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-[#111827] border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 pr-7 font-medium appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option>All Departments</option>
                  <option>Water Management</option>
                  <option>Roads / Public Works</option>
                  <option>Electrical</option>
                  <option>Sanitation</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Donut Ring & Legend Layout matching screenshot */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto pt-2">
              {/* Donut Chart SVG */}
              <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90 select-none">
                  {donutSlices.map((slice) => {
                    const isHovered = activeDonutSegment === slice.key
                    return (
                      <circle
                        key={slice.key}
                        cx="90"
                        cy="90"
                        r={donutRadius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHovered ? '24' : '18'}
                        strokeDasharray={slice.dashArray}
                        strokeDashoffset={slice.dashOffset}
                        className="transition-all duration-300 cursor-pointer"
                        style={{
                          filter: isHovered ? `drop-shadow(0 0 10px ${slice.color})` : 'none',
                        }}
                        onMouseEnter={() => setActiveDonutSegment(slice.key)}
                        onMouseLeave={() => setActiveDonutSegment(null)}
                      />
                    )
                  })}
                </svg>

                {/* Donut Center Total Count */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    12,486
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Total</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex flex-col gap-2.5 w-full sm:w-auto text-xs flex-1">
                {statusSegments.map((seg) => {
                  const isSelected = activeDonutSegment === seg.key
                  return (
                    <div
                      key={seg.key}
                      onMouseEnter={() => setActiveDonutSegment(seg.key)}
                      onMouseLeave={() => setActiveDonutSegment(null)}
                      className={`flex items-center justify-between p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                        isSelected ? 'bg-slate-800/80 border border-slate-700/60 scale-[1.02]' : 'hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: seg.color,
                            boxShadow: `0 0 8px ${seg.color}`,
                          }}
                        />
                        <span className="text-slate-300 font-medium">{seg.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-white font-bold">{seg.count.toLocaleString()}</span>
                        <span className="text-slate-500 text-[11px]">({seg.pct})</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* 4. Bottom Row: Department Performance Table & Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Department Performance Table */}
        <FadeIn direction="up" delay={0.2} className="lg:col-span-7">
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#1e293b] bg-[#0b101d]/90 shadow-xl flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Department Performance
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Resolution rate, SLA compliance and overall performance
                </p>
              </div>

              <button className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-xs font-semibold transition-all duration-200 cursor-pointer">
                View All
              </button>
            </div>

            {/* Performance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-1">Department</th>
                    <th className="pb-3 text-center">Complaints</th>
                    <th className="pb-3 text-center">Resolution Rate</th>
                    <th className="pb-3 text-center">SLA Compliance</th>
                    <th className="pb-3 text-right pr-2">Performance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {DEPARTMENTS_DATA.map((dept) => (
                    <tr
                      key={dept.name}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Department Icon + Name */}
                      <td className="py-3 pl-1">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center ${dept.iconBg}`}
                          >
                            {dept.icon}
                          </div>
                          <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                            {dept.name}
                          </span>
                        </div>
                      </td>

                      {/* Complaints */}
                      <td className="py-3 text-center font-mono font-medium text-slate-300">
                        {dept.complaints}
                      </td>

                      {/* Resolution Rate Bar */}
                      <td className="py-3 text-center px-3">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="font-mono font-semibold text-emerald-400 w-8 text-right">
                            {dept.resolutionRate}%
                          </span>
                          <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_#10b981]"
                              style={{ width: `${dept.resolutionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* SLA Compliance Bar */}
                      <td className="py-3 text-center px-3">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="font-mono font-semibold text-blue-400 w-8 text-right">
                            {dept.slaCompliance}%
                          </span>
                          <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full shadow-[0_0_8px_#3b82f6]"
                              style={{ width: `${dept.slaCompliance}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Score Badge Pill */}
                      <td className="py-3 text-right pr-2">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border ${dept.scoreColor}`}
                        >
                          {dept.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>

        {/* Right 5 Cols: Key Insights & Callout Banner */}
        <FadeIn direction="up" delay={0.25} className="lg:col-span-5 flex flex-col gap-5">
          {/* Key Insights Box */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#1e293b] bg-[#0b101d]/90 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <Sparkles size={18} className="text-purple-400" />
                Key Insights
              </h3>

              <div className="relative">
                <select
                  value={selectedInsightPeriod}
                  onChange={(e) => setSelectedInsightPeriod(e.target.value)}
                  className="bg-[#111827] border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 pr-7 font-medium appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option>This Month</option>
                  <option>Last Quarter</option>
                  <option>This Year</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 4 Insight Items matching screenshot */}
            <div className="flex flex-col gap-3 my-auto">
              {/* Insight 1: Green Trending */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-emerald-500/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Resolution rate improved by 12%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Compared to last month
                  </p>
                </div>
              </div>

              {/* Insight 2: Amber Warning */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-amber-500/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Sanitation department has highest pending complaints
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    240 complaints pending
                  </p>
                </div>
              </div>

              {/* Insight 3: Blue Activity */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-blue-500/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Activity size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Increase in drainage complaints
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    +28% compared to last month
                  </p>
                </div>
              </div>

              {/* Insight 4: Purple AI */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-purple-500/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    AI detected 3 potential recurring issues
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    View detailed analysis in Reports
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Glowing Callout Banner matching screenshot bottom blue card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] relative overflow-hidden flex items-center justify-between group cursor-pointer border border-blue-400/30">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3.5 z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Together for a Cleaner, Safer, Better City
                </p>
                <p className="text-xs text-blue-100 mt-0.5">
                  Data. Accountability. Real Change.
                </p>
              </div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:translate-x-1 transition-transform shrink-0 z-10">
              <ArrowRight size={18} />
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
