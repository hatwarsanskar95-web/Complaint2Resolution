'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Clock,
  Settings as WrenchIcon,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  X,
  ChevronRight,
  Sparkles,
  Info,
  Building2,
  Calendar,
  Image as ImageIcon,
  Check,
  Send,
  Upload,
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/ui/motion'
import { STATUS_LABELS, PRIORITY_LABELS, getSlaStatus, ComplaintStatus } from '@/lib/types'

export interface ComplaintItem {
  id: string
  permanent_id: string
  category: string
  description: string
  address: string
  latitude?: number
  longitude?: number
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: string
  created_at: string
  sla_start_time?: string | null
  sla_deadline?: string | null
  assigned_on?: string
}

interface OfficerDashboardClientProps {
  complaints?: ComplaintItem[]
  officerName?: string
  departmentName?: string
}

export default function OfficerDashboardClient({
  complaints = [],
  officerName = 'Municipal Officer',
  departmentName = 'Municipal Division',
}: OfficerDashboardClientProps) {
  const activeComplaints = complaints
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null)
  const [activeTab, setActiveTab] = useState<'Overview' | 'Updates' | 'Evidence' | 'Location'>('Overview')
  const [workNotes, setWorkNotes] = useState('')
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false)

  // Real Dynamic Metrics derived from Supabase Database
  const assignedCount = activeComplaints.length
  const pendingCount = activeComplaints.filter((c) => ['SUBMITTED', 'RECEIVED'].includes(c.status)).length
  const inProgressCount = activeComplaints.filter((c) => ['IN_PROGRESS', 'ASSIGNED', 'REOPENED'].includes(c.status)).length
  const resolvedCount = activeComplaints.filter((c) => ['RESOLVED', 'CLOSED', 'RESOLUTION_SUBMITTED', 'CITIZEN_VERIFICATION'].includes(c.status)).length

  // Dynamic Donut SVG Math for SLA Overview
  const slaStats = useMemo(() => {
    let onTrack = 0
    let atRisk = 0
    let breached = 0
    let resolved = 0

    activeComplaints.forEach((c) => {
      if (['RESOLVED', 'CLOSED'].includes(c.status)) {
        resolved++
      } else if (c.sla_deadline) {
        const { label } = getSlaStatus(c.sla_deadline, c.sla_start_time ?? null, c.status)
        if (label === 'breached') breached++
        else if (label === 'warning' || label === 'critical') atRisk++
        else onTrack++
      } else {
        onTrack++
      }
    })

    return { onTrack, atRisk, breached, resolved, total: activeComplaints.length }
  }, [activeComplaints])

  const slaDonutSlices = [
    { key: 'on_track', label: 'On Track', count: slaStats.onTrack, color: '#10b981' },
    { key: 'at_risk', label: 'At Risk', count: slaStats.atRisk, color: '#f59e0b' },
    { key: 'breached', label: 'Breached', count: slaStats.breached, color: '#ef4444' },
    { key: 'resolved', label: 'Resolved', count: slaStats.resolved, color: '#06b6d4' },
  ]

  const slaTotal = slaStats.total
  const radius = 60
  const circumference = 2 * Math.PI * radius
  let accumOffset = 0
  const slicesWithDash = slaDonutSlices.map((s) => {
    const dash = slaTotal > 0 ? (s.count / slaTotal) * circumference : 0
    const offset = -accumOffset
    accumOffset += dash
    return { ...s, dashArray: `${dash} ${circumference - dash}`, dashOffset: offset }
  })

  // Open complaint drawer
  const handleOpenComplaint = (c: ComplaintItem) => {
    setSelectedComplaint(c)
  }

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="max-w-[1450px] mx-auto flex gap-6 relative">
      {/* Main Dashboard Area */}
      <div className={`flex-1 flex flex-col gap-6 transition-all duration-300 ${selectedComplaint ? 'lg:pr-[420px]' : ''}`}>
        {/* 1. Greeting & Date Card */}
        <FadeIn direction="up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Good Morning, {officerName.split(' ')[0]} ☀️
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Division: <span className="text-emerald-400 font-semibold">{departmentName}</span> · Active real-time complaints queue.
              </p>
            </div>

            {/* Date Card */}
            <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#141e17] via-[#1a2b1f] to-[#122218] border border-amber-500/30 flex items-center gap-4 relative overflow-hidden shadow-lg">
              <Calendar size={18} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-100">{todayStr}</p>
                <p className="text-[10px] text-amber-300/80 font-medium">Active Database Synchronization</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 2. Top 4 Metric Cards Row (Calculated from REAL Complaints) */}
        <StaggerContainer staggerChildren={0.06} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Assigned */}
          <StaggerItem>
            <div className="glass-card p-4.5 rounded-2xl border border-[#16271e] bg-[#09120d]/90 flex items-center justify-between hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <FileText size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Assigned</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <AnimatedNumber value={assignedCount} duration={0.8} />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Live Queue
                </span>
              </div>
            </div>
          </StaggerItem>

          {/* Pending */}
          <StaggerItem>
            <div className="glass-card p-4.5 rounded-2xl border border-[#16271e] bg-[#09120d]/90 flex items-center justify-between hover:border-amber-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] group">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <Clock size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Pending Review</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <AnimatedNumber value={pendingCount} duration={0.8} />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Unprocessed
                </span>
              </div>
            </div>
          </StaggerItem>

          {/* In Progress */}
          <StaggerItem>
            <div className="glass-card p-4.5 rounded-2xl border border-[#16271e] bg-[#09120d]/90 flex items-center justify-between hover:border-purple-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] group">
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
                  Active Work
                </span>
              </div>
            </div>
          </StaggerItem>

          {/* Resolved */}
          <StaggerItem>
            <div className="glass-card p-4.5 rounded-2xl border border-[#16271e] bg-[#09120d]/90 flex items-center justify-between hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group">
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
                  Verified
                </span>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* 3. Middle Section: Complaint Locations Map & SLA Overview Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: GIS Location Map Widget */}
          <FadeIn direction="up" delay={0.1} className="lg:col-span-7">
            <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#16271e] bg-[#09120d]/90 shadow-xl flex flex-col h-full relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <MapPin size={18} className="text-emerald-400" />
                  Complaint Locations
                </h3>
                <Link href="/officer/complaints" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                  View Complaints →
                </Link>
              </div>

              {/* GIS Map Canvas */}
              <div className="relative flex-1 min-h-[200px] rounded-xl bg-[#0b1410] border border-slate-800/80 overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full absolute inset-0 opacity-40" viewBox="0 0 500 200">
                  <path d="M 50 0 L 50 200 M 150 0 L 150 200 M 250 0 L 250 200 M 350 0 L 350 200 M 450 0 L 450 200" stroke="#1e293b" strokeWidth="1" />
                  <path d="M 0 40 L 500 40 M 0 100 L 500 100 M 0 160 L 500 160" stroke="#1e293b" strokeWidth="1" />
                  <path d="M 20 180 C 120 120, 280 180, 480 30" fill="none" stroke="#162e21" strokeWidth="12" />
                  <path d="M 20 180 C 120 120, 280 180, 480 30" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 4" />
                </svg>

                {activeComplaints.length === 0 ? (
                  <div className="text-center p-6 text-slate-400 z-10">
                    <MapPin size={24} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-xs font-semibold">No active complaint coordinates registered</p>
                    <p className="text-[10px] text-slate-500">GIS map will update as citizens submit complaints.</p>
                  </div>
                ) : (
                  activeComplaints.slice(0, 5).map((c, i) => {
                    const leftPct = 20 + ((i * 25) % 70)
                    const topPct = 25 + ((i * 30) % 55)
                    return (
                      <div
                        key={c.id}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                        onClick={() => handleOpenComplaint(c)}
                        className="absolute flex flex-col items-center group cursor-pointer"
                      >
                        <div className="px-2.5 py-1 rounded-lg bg-[#0b1424]/95 border border-emerald-500/40 text-[10px] text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none mb-1 whitespace-nowrap z-20">
                          <p className="font-bold text-emerald-400">{c.permanent_id}</p>
                          <p className="text-slate-300">{c.category} · {c.address}</p>
                        </div>
                        <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_12px_#10b981] animate-pulse" />
                      </div>
                    )
                  })
                )}

                {/* Legend Overlay */}
                <div className="absolute right-3 top-3 bg-[#070f0b]/90 border border-emerald-900/40 p-2.5 rounded-xl text-[11px] flex flex-col gap-1.5 shadow-lg backdrop-blur-md">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending
                    </span>
                    <span className="font-mono font-bold text-white">{pendingCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-purple-500" /> In Progress
                    </span>
                    <span className="font-mono font-bold text-white">{inProgressCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> At Risk / Breached
                    </span>
                    <span className="font-mono font-bold text-white">{slaStats.atRisk + slaStats.breached}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Resolved
                    </span>
                    <span className="font-mono font-bold text-white">{resolvedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Right 5 Cols: SLA Overview Donut Chart */}
          <FadeIn direction="up" delay={0.15} className="lg:col-span-5">
            <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#16271e] bg-[#09120d]/90 shadow-xl flex flex-col h-full">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                SLA Compliance Breakdown
              </h3>

              <div className="flex items-center justify-center relative my-2">
                <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                  <circle cx="90" cy="90" r={radius} stroke="#132018" strokeWidth="16" fill="transparent" />
                  {slaTotal > 0 && slicesWithDash.map((slice) => (
                    <circle
                      key={slice.key}
                      cx="90"
                      cy="90"
                      r={radius}
                      stroke={slice.color}
                      strokeWidth="16"
                      strokeDasharray={slice.dashArray}
                      strokeDashoffset={slice.dashOffset}
                      fill="transparent"
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {slaTotal}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Total Complaints
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/80">
                {slaDonutSlices.map((s) => (
                  <div key={s.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800/50">
                    <span className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* 4. Active Complaints List Table */}
        <FadeIn direction="up" delay={0.2}>
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#16271e] bg-[#09120d]/90 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Assigned Complaints Queue
                </h3>
                <p className="text-xs text-slate-400">
                  Select any ticket to view details and update repair progress.
                </p>
              </div>
            </div>

            {activeComplaints.length === 0 ? (
              <div className="p-10 text-center text-slate-400 border border-slate-800/80 rounded-xl bg-slate-950/40">
                <FileText size={32} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold">No complaints currently registered</p>
                <p className="text-xs text-slate-500 mt-0.5">When a citizen submits a complaint, it will appear here automatically.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeComplaints.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleOpenComplaint(c)}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 group"
                  >
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          {c.permanent_id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {STATUS_LABELS[c.status as ComplaintStatus] ?? c.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {PRIORITY_LABELS[c.priority] ?? c.priority}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                        {c.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {c.category} · {c.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        href={`/officer/complaints/${c.id}`}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 rounded-lg hover:bg-emerald-900/60 transition-colors flex items-center gap-1"
                      >
                        Open Workspace <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Complaint Drawer */}
      {selectedComplaint && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#09120d] border-l border-slate-800 z-50 p-6 flex flex-col gap-5 overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <code className="text-lg font-mono font-bold text-emerald-400">{selectedComplaint.permanent_id}</code>
              <p className="text-xs text-slate-400">{selectedComplaint.category}</p>
            </div>
            <button
              onClick={() => setSelectedComplaint(null)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Resident Description</span>
              <p className="text-slate-200 leading-relaxed">{selectedComplaint.description}</p>
            </div>

            <div className="flex flex-col gap-1 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Location Address</span>
              <p className="text-slate-200">{selectedComplaint.address}</p>
            </div>

            <Link
              href={`/officer/complaints/${selectedComplaint.id}`}
              className="btn-primary text-center py-2.5 text-xs font-semibold mt-2"
            >
              Open Full Officer Workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
