'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Clock,
  Settings as WrenchIcon,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
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

interface ComplaintItem {
  id: string
  permanent_id: string
  category: string
  description: string
  address: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: string
  created_at: string
  sla_deadline?: string | null
  assigned_on?: string
}

interface OfficerDashboardClientProps {
  complaints?: ComplaintItem[]
  officerName?: string
  departmentName?: string
}

const DEFAULT_RECENT_COMPLAINTS: ComplaintItem[] = [
  {
    id: 'c1',
    permanent_id: 'CR-2025-1042',
    category: 'Water Leakage',
    description: 'Continuous water leakage from underground pipeline near the public road. Causing water wastage and traffic issues.',
    address: 'MG Road, Nashik',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    created_at: '2025-09-12T10:30:00Z',
    assigned_on: '12 Sep 2025',
    sla_deadline: '18h remaining',
  },
  {
    id: 'c2',
    permanent_id: 'CR-2025-1048',
    category: 'Pipeline Damage',
    description: 'Main pipeline joint leaking heavily onto sidewalk near shop entrance.',
    address: 'Shastri Nagar',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    created_at: '2025-09-11T14:20:00Z',
    assigned_on: '11 Sep 2025',
    sla_deadline: '1d remaining',
  },
  {
    id: 'c3',
    permanent_id: 'CR-2025-1051',
    category: 'Low Water Pressure',
    description: 'Low water pressure reported across sector 4 residential area for 3 consecutive days.',
    address: 'Civil Lines',
    priority: 'MEDIUM',
    status: 'RECEIVED',
    created_at: '2025-09-11T09:15:00Z',
    assigned_on: '11 Sep 2025',
    sla_deadline: '1d remaining',
  },
  {
    id: 'c4',
    permanent_id: 'CR-2025-1068',
    category: 'Drainage Overflow',
    description: 'Stormwater drain blocked by debris causing minor waterlogging.',
    address: 'Indira Nagar',
    priority: 'LOW',
    status: 'IN_PROGRESS',
    created_at: '2025-09-10T16:45:00Z',
    assigned_on: '10 Sep 2025',
    sla_deadline: '2d remaining',
  },
  {
    id: 'c5',
    permanent_id: 'CR-2025-1071',
    category: 'Pipeline Maintenance',
    description: 'Scheduled valve inspection and filter replacement for sector B pump station.',
    address: 'Laxmi Nagar',
    priority: 'LOW',
    status: 'RECEIVED',
    created_at: '2025-09-10T11:00:00Z',
    assigned_on: '10 Sep 2025',
    sla_deadline: '2d remaining',
  },
]

export default function OfficerDashboardClient({
  complaints,
  officerName = 'Rajesh Kumar',
  departmentName = 'Water Management',
}: OfficerDashboardClientProps) {
  const activeComplaints = complaints && complaints.length > 0 ? complaints : DEFAULT_RECENT_COMPLAINTS
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null)
  const [activeTab, setActiveTab] = useState<'Overview' | 'Updates' | 'Evidence' | 'Location'>('Overview')
  const [workNotes, setWorkNotes] = useState('')
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false)

  // Donut SVG Math for SLA Overview
  const slaDonutSlices = [
    { key: 'on_track', label: 'On Track', count: 15, color: '#10b981' },
    { key: 'at_risk', label: 'At Risk', count: 4, color: '#f59e0b' },
    { key: 'breached', label: 'Breached', count: 2, color: '#ef4444' },
    { key: 'resolved', label: 'Resolved', count: 3, color: '#06b6d4' },
  ]
  const slaTotal = 24
  const radius = 60
  const circumference = 2 * Math.PI * radius
  let accumOffset = 0
  const slicesWithDash = slaDonutSlices.map((s) => {
    const dash = (s.count / slaTotal) * circumference
    const offset = -accumOffset
    accumOffset += dash
    return { ...s, dashArray: `${dash} ${circumference - dash}`, dashOffset: offset }
  })

  // Open complaint drawer & trigger automatic IN_PROGRESS state transition logic
  const handleOpenComplaint = (c: ComplaintItem) => {
    setSelectedComplaint(c)
    // Automatic transition behavior: If complaint is received/assigned, note automatic start
    if (c.status === 'RECEIVED' || c.status === 'ASSIGNED') {
      c.status = 'IN_PROGRESS'
    }
  }

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
                Here are your assigned complaints and key updates for today.
              </p>
            </div>

            {/* Date Card with warm golden waves matching screenshot */}
            <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#141e17] via-[#1a2b1f] to-[#122218] border border-amber-500/30 flex items-center gap-4 relative overflow-hidden shadow-lg">
              <div className="absolute right-0 top-0 opacity-20 pointer-events-none text-amber-400">
                <svg width="100" height="40" viewBox="0 0 100 40">
                  <path d="M0 20 Q 25 5, 50 20 T 100 20" stroke="currentColor" fill="none" strokeWidth="2" />
                </svg>
              </div>
              <Calendar size={18} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-100">Friday, 12 Sep 2025</p>
                <p className="text-[10px] text-amber-300/80 font-medium">Let&apos;s keep the city flowing.</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 2. Top 4 Metric Cards Row */}
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
                    <AnimatedNumber value={24} duration={0.8} />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  ↑ 12%
                </span>
                <p className="text-[10px] text-slate-500 mt-1">vs last week</p>
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
                  <p className="text-xs text-slate-400 font-medium">Pending</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <AnimatedNumber value={8} duration={0.8} />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  ↓ 20%
                </span>
                <p className="text-[10px] text-slate-500 mt-1">vs last week</p>
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
                    <AnimatedNumber value={10} duration={0.9} />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  ↑ 25%
                </span>
                <p className="text-[10px] text-slate-500 mt-1">vs last week</p>
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
                    <AnimatedNumber value={3} duration={1} />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  ↑ 50%
                </span>
                <p className="text-[10px] text-slate-500 mt-1">vs last week</p>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* 3. Middle Section: Complaint Locations Map & SLA Overview Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: GIS Location Map Widget matching screenshot */}
          <FadeIn direction="up" delay={0.1} className="lg:col-span-7">
            <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#16271e] bg-[#09120d]/90 shadow-xl flex flex-col h-full relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <MapPin size={18} className="text-emerald-400" />
                  Complaint Locations
                </h3>
                <span className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1">
                  View Map →
                </span>
              </div>

              {/* Interactive GIS Map Canvas Container matching screenshot */}
              <div className="relative flex-1 min-h-[200px] rounded-xl bg-[#0b1410] border border-slate-800/80 overflow-hidden flex items-center justify-center">
                {/* SVG Dark Blueprint Grid Map */}
                <svg className="w-full h-full absolute inset-0 opacity-40" viewBox="0 0 500 200">
                  <path d="M 50 0 L 50 200 M 150 0 L 150 200 M 250 0 L 250 200 M 350 0 L 350 200 M 450 0 L 450 200" stroke="#1e293b" strokeWidth="1" />
                  <path d="M 0 40 L 500 40 M 0 100 L 500 100 M 0 160 L 500 160" stroke="#1e293b" strokeWidth="1" />
                  <path d="M 20 180 C 120 120, 280 180, 480 30" fill="none" stroke="#162e21" strokeWidth="12" />
                  <path d="M 20 180 C 120 120, 280 180, 480 30" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 4" />
                </svg>

                {/* Map Pins */}
                <div className="absolute left-[30%] top-[40%] flex flex-col items-center group cursor-pointer">
                  <div className="px-2.5 py-1 rounded-lg bg-[#0b1424]/95 border border-blue-500/40 text-[10px] text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none mb-1 whitespace-nowrap">
                    <p className="font-bold text-blue-400">CR-2025-1042</p>
                    <p className="text-slate-300">Water Leakage · MG Road</p>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_12px_#3b82f6] animate-pulse" />
                </div>

                <div className="absolute left-[55%] top-[25%] flex flex-col items-center group cursor-pointer">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-[0_0_10px_#f59e0b]" />
                </div>

                <div className="absolute left-[70%] top-[65%] flex flex-col items-center group cursor-pointer">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_10px_#10b981]" />
                </div>

                <div className="absolute left-[20%] top-[70%] flex flex-col items-center group cursor-pointer">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_10px_#ef4444]" />
                </div>

                {/* Legend Overlay Box on Map matching screenshot */}
                <div className="absolute right-3 top-3 bg-[#070f0b]/90 border border-emerald-900/40 p-2.5 rounded-xl text-[11px] flex flex-col gap-1.5 shadow-lg backdrop-blur-md">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending
                    </span>
                    <span className="font-mono font-bold text-white">8</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> In Progress
                    </span>
                    <span className="font-mono font-bold text-white">10</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> SLA At Risk
                    </span>
                    <span className="font-mono font-bold text-white">4</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" /> Resolved
                    </span>
                    <span className="font-mono font-bold text-white">3</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Right 5 Cols: SLA Overview Donut Chart matching screenshot */}
          <FadeIn direction="up" delay={0.15} className="lg:col-span-5">
            <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#16271e] bg-[#09120d]/90 shadow-xl flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  SLA Overview
                </h3>
                <span className="text-xs text-emerald-400 font-semibold cursor-pointer">
                  View Details →
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 my-auto">
                {/* Donut SVG Ring */}
                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 select-none">
                    {slicesWithDash.map((s) => (
                      <circle
                        key={s.key}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke={s.color}
                        strokeWidth="16"
                        strokeDasharray={s.dashArray}
                        strokeDashoffset={s.dashOffset}
                        className="transition-all duration-300 hover:stroke-width-[20] cursor-pointer"
                        style={{ filter: `drop-shadow(0 0 6px ${s.color})` }}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      24
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Total</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="flex flex-col gap-2 w-full sm:w-auto text-xs flex-1">
                  {slaDonutSlices.map((s) => (
                    <div key={s.key} className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-800/40">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-slate-300 font-medium">{s.label}</span>
                      </div>
                      <span className="font-mono font-bold text-white">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* 4. Bottom Row: Recent Assignments Table & Performance / Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Recent Assignments Table */}
          <FadeIn direction="up" delay={0.2} className="lg:col-span-7">
            <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#16271e] bg-[#09120d]/90 shadow-xl flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <FileText size={18} className="text-emerald-400" />
                  Recent Assignments
                </h3>
                <span className="text-xs text-emerald-400 font-semibold cursor-pointer">
                  View All →
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3 pl-1">ID</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Priority</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">SLA</th>
                      <th className="pb-3">Assigned On</th>
                      <th className="pb-3 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {activeComplaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="py-3 pl-1 font-mono font-bold text-emerald-400">
                          {c.permanent_id}
                        </td>
                        <td className="py-3 text-slate-200 font-medium">{c.category}</td>
                        <td className="py-3 text-slate-400">{c.address}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.priority === 'HIGH' || c.priority === 'CRITICAL'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : c.priority === 'MEDIUM'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {c.priority}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              c.status === 'IN_PROGRESS'
                                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                                : 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {c.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-300">{c.sla_deadline || '1d'}</td>
                        <td className="py-3 text-slate-400">{c.assigned_on || '12 Sep 2025'}</td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={() => handleOpenComplaint(c)}
                            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </FadeIn>

          {/* Right 5 Cols: My Performance & Department Message */}
          <FadeIn direction="up" delay={0.25} className="lg:col-span-5 flex flex-col gap-5">
            {/* My Performance Box */}
            <div className="glass-card p-5 sm:p-6 rounded-2xl border border-[#16271e] bg-[#09120d]/90 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <TrendingUp size={18} className="text-emerald-400" />
                  My Performance <span className="text-xs font-normal text-slate-400">(This Month)</span>
                </h3>
                <span className="text-xs text-emerald-400 font-semibold cursor-pointer">
                  View Reports →
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[#0b1410] border border-slate-800/80">
                  <p className="text-2xl font-extrabold text-emerald-400 font-mono">92%</p>
                  <p className="text-xs text-slate-400 mt-0.5">SLA Compliance</p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">
                    <div className="bg-emerald-500 h-full rounded-full w-[92%]" />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0b1410] border border-slate-800/80">
                  <p className="text-2xl font-extrabold text-white font-mono">18</p>
                  <p className="text-xs text-slate-400 mt-0.5">Resolved</p>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">↑ 28%</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0b1410] border border-slate-800/80">
                  <p className="text-2xl font-extrabold text-white font-mono">2.4 days</p>
                  <p className="text-xs text-slate-400 mt-0.5">Avg. Resolution Time</p>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">↓ 15%</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0b1410] border border-slate-800/80">
                  <p className="text-2xl font-extrabold text-white font-mono">1</p>
                  <p className="text-xs text-slate-400 mt-0.5">Reopened</p>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">↓ 50%</span>
                </div>
              </div>
            </div>

            {/* Department Message Card matching screenshot */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0d1f15] to-[#12281c] border border-emerald-900/40 text-slate-200 relative overflow-hidden flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Sparkles size={16} />
                <span>Department Message</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Keep up the great work! Your timely resolutions make a real difference in the community.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* 5. Complete Interactive Slide-Over Complaint Detail Drawer matching right side of screenshot */}
      {selectedComplaint && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#070f0b] border-l border-[#15271d] shadow-[0_0_50px_rgba(0,0,0,0.9)] z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-5 border-b border-[#15271d] bg-[#09140f] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-600/90 text-white font-bold text-xs flex items-center justify-center">
                RK
              </div>
              <div>
                <p className="text-xs font-bold text-white">Rajesh Kumar</p>
                <p className="text-[10px] text-slate-400">Officer - Water Management</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedComplaint(null)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Title & Badges */}
          <div className="p-5 border-b border-[#15271d] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-bold text-emerald-400">{selectedComplaint.permanent_id}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                In Progress
              </span>
            </div>
            <h2 className="text-base font-bold text-white">{selectedComplaint.category}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><MapPin size={12} className="text-emerald-400" /> {selectedComplaint.address}</span>
              <span>12 Sep 2025, 10:30 AM</span>
            </div>

            {/* Nav Tabs */}
            <div className="flex gap-2 border-t border-slate-800/80 pt-3 mt-2 text-xs font-medium">
              {(['Overview', 'Updates', 'Evidence', 'Location'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === tab ? 'bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer Body Area */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            {/* Overview Content */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Complaint Details</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#0b1611] p-3 rounded-xl border border-slate-800/80">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Evidence Photos */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Original Evidence</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-24 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden relative flex items-center justify-center text-slate-500">
                  <ImageIcon size={24} />
                </div>
                <div className="h-24 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden relative flex items-center justify-center text-slate-500">
                  <ImageIcon size={24} />
                </div>
              </div>
            </div>

            {/* Status Timeline matching right side of design screenshot */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Status Timeline</h4>

              <div className="space-y-4 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                <div className="relative">
                  <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <p className="text-xs font-bold text-white">Complaint Received</p>
                  <p className="text-[10px] text-slate-400">12 Sep 2025, 10:30 AM</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <p className="text-xs font-bold text-white">Assigned to Department</p>
                  <p className="text-[10px] text-slate-400">12 Sep 2025, 10:32 AM</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <p className="text-xs font-bold text-white">Assigned to You</p>
                  <p className="text-[10px] text-slate-400">12 Sep 2025, 10:35 AM</p>
                </div>

                {/* Current Active Stage Automatic Transition Note */}
                <div className="relative bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-xl">
                  <div className="absolute -left-[25px] top-2.5 w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e]" />
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-300">In Progress</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      Current Stage
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Automatically started when you opened this complaint
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">12 Sep 2025, 10:40 AM</p>
                </div>

                <div className="relative opacity-40">
                  <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-slate-700" />
                  <p className="text-xs font-bold text-slate-400">Resolution Submitted</p>
                  <p className="text-[10px] text-slate-500">Pending</p>
                </div>
              </div>
            </div>

            {/* Officer Work Notes & Evidence Upload Section */}
            <div className="p-4 rounded-xl bg-[#09150e] border border-emerald-900/40 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <WrenchIcon size={14} className="text-emerald-400" /> Add Work / Action Notes
              </h4>
              <textarea
                rows={3}
                placeholder="Inspected pipeline and replaced broken section..."
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-[#050a07] border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <button className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer">
                  <Upload size={13} /> Upload Evidence
                </button>
                <button
                  onClick={() => {
                    setIsSubmittingNotes(true)
                    setTimeout(() => {
                      setIsSubmittingNotes(false)
                      alert('Resolution submitted for AI verification!')
                    }, 800)
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} /> Submit Resolution
                </button>
              </div>
            </div>
          </div>

          {/* System note at bottom matching screenshot */}
          <div className="p-4 border-t border-[#15271d] bg-[#060c09] text-[11px] text-slate-400 flex items-start gap-2">
            <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              Status is updated automatically based on your actions. You can add work notes, upload evidence and submit resolution when the work is completed.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
