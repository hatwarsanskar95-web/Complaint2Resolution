'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Camera,
  MapPin,
  X,
  ArrowRight,
  Leaf,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Search,
  Bell,
  Filter,
  ChevronRight,
  TrendingUp,
  Zap,
  FileWarning,
  BadgeCheck,
  Sparkles,
  Building2,
} from 'lucide-react'
import { Complaint, ComplaintStatus, STATUS_LABELS, getSlaStatus } from '@/lib/types'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import {
  getStoredCitizenLocation,
  setStoredCitizenLocation,
  CitizenLocationData,
} from '@/components/citizen/CitizenLocationSync'
import { toast } from '@/context/ToastContext'
import { useCitizenTheme } from '@/context/CitizenThemeContext'

interface Props {
  complaints: Complaint[]
}

type FilterTab = 'all' | 'active' | 'verification' | 'closed'

const ACTIVE_STATUSES: ComplaintStatus[] = [
  'SUBMITTED', 'RECEIVED', 'ASSIGNED', 'IN_PROGRESS',
  'RESOLUTION_SUBMITTED', 'AI_VERIFICATION', 'REOPENED', 'HUMAN_REVIEW_REQUIRED',
]
const VERIFICATION_STATUSES: ComplaintStatus[] = ['CITIZEN_VERIFICATION', 'DISPUTED', 'AI_DISPUTE_VERIFICATION']
const CLOSED_STATUSES: ComplaintStatus[] = ['RESOLVED', 'CLOSED']

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-700/40',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-700/40',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-700/40',
  LOW: 'bg-sky-500/15 text-sky-400 border-sky-700/40',
}

const STATUS_COLORS_DARK: Record<string, string> = {
  SUBMITTED: 'bg-slate-500/15 text-slate-300 border-slate-600/40',
  RECEIVED: 'bg-blue-500/15 text-blue-300 border-blue-700/40',
  ASSIGNED: 'bg-indigo-500/15 text-indigo-300 border-indigo-700/40',
  IN_PROGRESS: 'bg-violet-500/15 text-violet-300 border-violet-700/40',
  RESOLUTION_SUBMITTED: 'bg-purple-500/15 text-purple-300 border-purple-700/40',
  AI_VERIFICATION: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-700/40',
  RESOLVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-700/40',
  CITIZEN_VERIFICATION: 'bg-amber-500/15 text-amber-300 border-amber-700/40',
  CLOSED: 'bg-emerald-700/15 text-emerald-400 border-emerald-700/40',
  DISPUTED: 'bg-rose-500/15 text-rose-300 border-rose-700/40',
  AI_DISPUTE_VERIFICATION: 'bg-pink-500/15 text-pink-300 border-pink-700/40',
  REOPENED: 'bg-orange-500/15 text-orange-300 border-orange-700/40',
  HUMAN_REVIEW_REQUIRED: 'bg-yellow-500/15 text-yellow-300 border-yellow-700/40',
}

const STATUS_COLORS_LIGHT: Record<string, string> = {
  SUBMITTED: 'bg-slate-100 text-slate-600 border-slate-300',
  RECEIVED: 'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  IN_PROGRESS: 'bg-violet-50 text-violet-700 border-violet-200',
  RESOLUTION_SUBMITTED: 'bg-purple-50 text-purple-700 border-purple-200',
  AI_VERIFICATION: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CITIZEN_VERIFICATION: 'bg-amber-50 text-amber-700 border-amber-200',
  CLOSED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  DISPUTED: 'bg-rose-50 text-rose-700 border-rose-200',
  AI_DISPUTE_VERIFICATION: 'bg-pink-50 text-pink-700 border-pink-200',
  REOPENED: 'bg-orange-50 text-orange-700 border-orange-200',
  HUMAN_REVIEW_REQUIRED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

const SLA_BAR_COLORS = {
  normal: 'bg-emerald-500',
  reminder: 'bg-yellow-400',
  warning: 'bg-orange-500',
  critical: 'bg-red-500',
  breached: 'bg-rose-600',
}

function SlaBar({ complaint, isDark }: { complaint: Complaint; isDark: boolean }) {
  const sla = getSlaStatus(complaint.sla_deadline, complaint.sla_start_time)
  if (!complaint.sla_deadline) return null
  return (
    <div className="mt-2.5 space-y-1">
      <div className="flex justify-between items-center text-[10px]">
        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>SLA</span>
        <span className={`font-semibold ${sla.label === 'breached' ? 'text-rose-500' : sla.label === 'critical' ? 'text-orange-400' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {sla.formattedTimeLeft}
        </span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#1a2e24]' : 'bg-slate-200'}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${SLA_BAR_COLORS[sla.label]} ${sla.label === 'breached' ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.min(sla.percent, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function CitizenDashboardClient({ complaints }: Props) {
  const { isDark } = useCitizenTheme()
  const [location, setLocation] = useState<CitizenLocationData | null>(null)
  const [showLocationPopup, setShowLocationPopup] = useState(false)
  const [locating, setLocating] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loc = getStoredCitizenLocation()
    if (loc) {
      setLocation(loc)
      setShowLocationPopup(false)
    } else {
      setShowLocationPopup(true)
    }
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<CitizenLocationData>
      if (customEvt.detail) setLocation(customEvt.detail)
    }
    window.addEventListener('citizen_location_updated', handleUpdate)
    return () => window.removeEventListener('citizen_location_updated', handleUpdate)
  }, [])

  const totalCount = complaints.length
  const activeCount = complaints.filter((c) => ACTIVE_STATUSES.includes(c.status)).length
  const verificationCount = complaints.filter((c) => VERIFICATION_STATUSES.includes(c.status)).length
  const closedCount = complaints.filter((c) => CLOSED_STATUSES.includes(c.status)).length
  const actionRequired = complaints.filter((c) => c.status === 'CITIZEN_VERIFICATION')

  const filtered = useMemo(() => {
    let base = complaints
    if (activeFilter === 'active') base = base.filter((c) => ACTIVE_STATUSES.includes(c.status))
    else if (activeFilter === 'verification') base = base.filter((c) => VERIFICATION_STATUSES.includes(c.status))
    else if (activeFilter === 'closed') base = base.filter((c) => CLOSED_STATUSES.includes(c.status))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      base = base.filter(
        (c) =>
          c.permanent_id.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.address || '').toLowerCase().includes(q)
      )
    }
    return base
  }, [complaints, activeFilter, searchQuery])

  const handleAllowLocation = () => {
    if (!navigator.geolocation) {
      toast.warning('Geolocation not supported.')
      return
    }
    setLocating(true)
    const toastId = toast.loading('Detecting location...')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        const isApproximate = accuracy > 200
        let humanAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          const data = await res.json()
          if (data?.address) {
            const parts = [
              data.address.road || data.address.suburb || data.address.neighbourhood,
              data.address.city || data.address.town || data.address.county || data.address.state,
            ].filter(Boolean)
            if (parts.length > 0) humanAddress = parts.join(', ')
          }
        } catch { /* fallback */ }
        const locData: CitizenLocationData = { address: humanAddress, lat, lng, accuracy, isApproximate, timestamp: Date.now() }
        setStoredCitizenLocation(locData)
        setLocation(locData)
        setShowLocationPopup(false)
        setLocating(false)
        toast.update(toastId, { type: 'success', title: 'Location Detected', message: humanAddress })
      },
      (err) => {
        setLocating(false)
        setShowLocationPopup(false)
        const msg = err.code === err.PERMISSION_DENIED ? 'Permission denied.' : 'Could not access location.'
        toast.warning('Location Unavailable', msg)
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  const metrics = [
    { icon: <PlusCircle size={22} />, value: totalCount, label: 'Total Reported', bg: isDark ? 'bg-slate-500/15' : 'bg-slate-100', iconColor: isDark ? 'text-slate-400' : 'text-slate-500' },
    { icon: <Clock size={22} />, value: activeCount, label: 'Active & In-Progress', bg: isDark ? 'bg-blue-500/15' : 'bg-blue-50', iconColor: 'text-blue-400' },
    { icon: <AlertCircle size={22} />, value: verificationCount, label: 'Needs Your Action', bg: isDark ? 'bg-amber-500/15' : 'bg-amber-50', iconColor: 'text-amber-400', pulse: verificationCount > 0 },
    { icon: <CheckCircle2 size={22} />, value: closedCount, label: 'Resolved & Closed', bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50', iconColor: 'text-emerald-400' },
  ]

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'verification', label: 'Verification Required', count: verificationCount },
    { key: 'closed', label: 'Closed', count: closedCount },
  ]

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-16">

      {/* Hero Banner matching screenshot exact styling */}
      <FadeIn direction="up">
        <div className="relative rounded-3xl border border-[#1b4332] overflow-hidden p-6 sm:p-10 shadow-2xl min-h-[420px] flex flex-col justify-between bg-gradient-to-r from-[#03150d] via-[#072418] to-[#0d3624] text-white">
          {/* Background Right Graphic Overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 pointer-events-none opacity-80 sm:opacity-90 z-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero_banner.jpg"
              alt="Civic Hero Banner"
              className="w-full h-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#03150d] via-[#072418]/60 to-transparent" />
          </div>

          {/* Location Popup Overlay */}
          {showLocationPopup && (
            <div className={`absolute left-1/2 -translate-x-1/2 top-4 sm:top-6 z-30 w-[90%] max-w-md backdrop-blur-md rounded-2xl p-5 border shadow-2xl ${isDark ? 'bg-[#0b1d16]/95 border-[#1b4332]' : 'bg-white/95 border-slate-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f5132] text-white flex items-center justify-center shrink-0"><MapPin size={20} /></div>
                  <div>
                    <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Allow location access?</h3>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>Helps route complaints to the correct municipal department.</p>
                  </div>
                </div>
                <button onClick={() => setShowLocationPopup(false)} className="p-1 cursor-pointer text-slate-400"><X size={16} /></button>
              </div>
              <div className={`flex items-center justify-end gap-2.5 mt-4 pt-2 border-t ${isDark ? 'border-[#1b4332]' : 'border-slate-100'}`}>
                <button onClick={() => setShowLocationPopup(false)} className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Not Now</button>
                <button onClick={handleAllowLocation} disabled={locating} className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0f5132] hover:bg-[#146c43] text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                  {locating ? <RefreshCw size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>{locating ? 'Detecting...' : 'Allow Location'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Top Main Content Section */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Left Content Column */}
            <div className="max-w-xl flex flex-col gap-6">
              <div>
                <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Your Civic <span className="text-[#34d399]">Dashboard</span>
                </h1>
                <p className="text-xs sm:text-sm mt-2 font-medium text-emerald-100/70">
                  Track every reported issue from submission to verified resolution.
                </p>
              </div>

              {/* Current Location Pill Container */}
              <div className="rounded-2xl border border-emerald-900/60 bg-[#051a11]/90 backdrop-blur-md p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-400">Current Location</span>
                    <p className="text-xs sm:text-sm font-bold text-white truncate max-w-xs">{location?.address || 'Agne Layout, Nagpur'}</p>
                    {location?.isApproximate && <span className="text-[10px] text-amber-400">Approximate GPS</span>}
                  </div>
                </div>
                <button
                  onClick={handleAllowLocation}
                  disabled={locating}
                  className="px-4 py-2 rounded-xl bg-[#00875a] hover:bg-[#00a36c] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-md cursor-pointer shrink-0"
                >
                  <RefreshCw size={13} className={locating ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Spot a Civic Problem Container */}
              <div className="rounded-2xl border border-emerald-900/60 bg-[#051a11]/90 backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Camera size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Spot a civic problem?</h3>
                    <p className="text-xs text-emerald-200/70">Take 3-5 photos, mark the map, and file a complaint in minutes.</p>
                  </div>
                </div>
                <Link
                  href="/citizen/report"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#00875a] hover:bg-[#00a36c] text-white font-bold text-xs sm:text-sm shadow-xl transition-all cursor-pointer shrink-0"
                >
                  <span>Report an Issue</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Right C2R Slogan & Artwork Column matching screenshot */}
            <div className="hidden lg:flex flex-col items-end text-right z-10 pt-2 pr-4">
              <div className="font-handwriting text-2xl sm:text-3xl font-bold text-emerald-300 leading-tight drop-shadow-md">
                Cleaner<br />
                Greener<br />
                Happier India
              </div>
            </div>
          </div>

          {/* Bottom Footer Feature Pills matching screenshot */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-6 mt-6 border-t border-emerald-900/50 text-xs font-semibold text-emerald-200/80">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-emerald-400 flex items-center justify-center">
                  <Sparkles size={13} />
                </div>
                <span>AI Classification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={13} />
                </div>
                <span>SLA Enforcement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-emerald-400 flex items-center justify-center">
                  <TrendingUp size={13} />
                </div>
                <span>End-to-End Tracking</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-6 text-[11px] text-emerald-300/90 font-medium">
              <div className="flex items-center gap-1.5">
                <Leaf size={14} className="text-emerald-400" />
                <span>Cleaner Environment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 size={14} className="text-emerald-400" />
                <span>Stronger Communities</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 4 Metric Cards */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <StaggerItem key={i}>
            <div className={`rounded-2xl border p-5 flex items-center gap-4 shadow-sm ${isDark ? 'bg-[#0b1a15] border-[#18382c]' : 'bg-white border-[#e2e8f0]'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.bg} ${m.iconColor} ${(m as { pulse?: boolean }).pulse ? 'animate-pulse' : ''}`}>{m.icon}</div>
              <div>
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{m.value}</span>
                <p className={`text-xs font-medium leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>{m.label}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Action Required Banner */}
      {actionRequired.length > 0 && (
        <FadeIn direction="up">
          <div className={`rounded-2xl border p-4 sm:p-5 ${isDark ? 'bg-amber-500/10 border-amber-600/30' : 'bg-amber-50 border-amber-300'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                <Bell size={20} className="animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                      ? Action Required - {actionRequired.length} Complaint{actionRequired.length > 1 ? 's' : ''} Awaiting Verification
                    </h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-200/70' : 'text-amber-700'}`}>
                      Officers have submitted resolution proof. Review and confirm whether the issue is resolved.
                    </p>
                  </div>
                  <button onClick={() => setActiveFilter('verification')} className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${isDark ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300' : 'bg-amber-200 hover:bg-amber-300 text-amber-900'}`}>
                    <span>Review Now</span><ChevronRight size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {actionRequired.map((c) => (
                    <Link key={c.id} href={`/citizen/complaints/${c.id}`} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${isDark ? 'bg-amber-500/10 border-amber-600/30 text-amber-300 hover:bg-amber-500/20' : 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'}`}>
                      <FileWarning size={12} /><span>{c.permanent_id}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Complaints List */}
      <FadeIn direction="up">
        <div className={`rounded-3xl border shadow-sm ${isDark ? 'bg-[#0b1a15] border-[#18382c]' : 'bg-white border-[#e2e8f0]'}`}>
          <div className={`p-6 sm:p-7 border-b ${isDark ? 'border-[#18382c]' : 'border-[#f1f5f9]'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>My Civic Complaints</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>Full lifecycle tracking from submission to verified closure.</p>
              </div>
              <Link href="/citizen/complaints" className="text-xs font-bold text-[#22c55e] hover:underline shrink-0">View All ({totalCount}) ?</Link>
            </div>
            <div className="mt-4 relative">
              <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input type="text" placeholder="Search by ID, category, address..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${isDark ? 'bg-[#081512] border-[#1b3828] text-white placeholder:text-slate-500 focus:border-emerald-600' : 'bg-[#f8fafc] border-[#e2e8f0] text-slate-800 placeholder:text-slate-400 focus:border-[#15803d]'}`} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {filterTabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveFilter(tab.key)} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${activeFilter === tab.key ? isDark ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-[#15803d] text-white border-[#15803d]' : isDark ? 'border-[#1b3828] text-slate-400 hover:text-slate-200' : 'border-[#e2e8f0] text-slate-500 hover:text-slate-800'}`}>
                  <Filter size={11} /><span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${activeFilter === tab.key ? 'bg-white/20' : isDark ? 'bg-[#1a2e24]' : 'bg-slate-100'}`}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-3">
            {filtered.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  {searchQuery ? <Search size={26} /> : <Leaf size={26} />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {searchQuery ? `No results for "${searchQuery}"` : activeFilter === 'all' ? 'No complaints filed yet.' : `No ${activeFilter} complaints.`}
                  </p>
                  <p className={`text-xs max-w-sm mx-auto mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {searchQuery ? 'Try a different term.' : activeFilter === 'all' ? 'Help your city by submitting your first report.' : 'Complaints matching this filter will appear here.'}
                  </p>
                </div>
                {!searchQuery && activeFilter === 'all' && (
                  <Link href="/citizen/report" className="px-5 py-2.5 rounded-full bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold shadow-md">Report a Civic Issue</Link>
                )}
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className={`text-xs font-semibold underline cursor-pointer ${isDark ? 'text-emerald-400' : 'text-[#15803d]'}`}>Clear Search</button>
                )}
              </div>
            ) : (
              <>
                {filtered.slice(0, 10).map((c) => {
                  const statusColors = isDark ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT
                  const priorityColor = PRIORITY_COLORS[c.priority] || ''
                  const isVerification = c.status === 'CITIZEN_VERIFICATION'
                  return (
                    <Link key={c.id} href={`/citizen/complaints/${c.id}`} className={`block rounded-2xl border p-4 sm:p-5 transition-all group ${isVerification ? isDark ? 'bg-amber-500/5 border-amber-600/40 hover:border-amber-500/60' : 'bg-amber-50 border-amber-300 hover:border-amber-400' : isDark ? 'bg-[#081512] border-[#18382c] hover:border-emerald-500/40 hover:bg-[#0c1f19]' : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#15803d]/40 hover:bg-white'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border ${isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/60' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{c.permanent_id}</span>
                            {isVerification && <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-400/20 text-amber-400 border border-amber-500/30 animate-pulse"><Bell size={10} /> Action Required</span>}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[c.status] || ''}`}>{STATUS_LABELS[c.status] || c.status}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColor}`}>{c.priority}</span>
                          </div>
                          <h3 className={`text-sm font-bold leading-snug ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-[#0f172a] group-hover:text-[#15803d]'}`}>
                            {c.category}{c.subcategory ? ` - ${c.subcategory}` : ''}
                          </h3>
                          <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-[#475569]'}`}>{c.description}</p>
                          <div className={`flex items-center flex-wrap gap-3 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {c.address && <span className="flex items-center gap-1"><MapPin size={10} /><span className="truncate max-w-[200px]">{c.address}</span></span>}
                            <span className="flex items-center gap-1"><Clock size={10} /><span>{new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                            {c.departments?.name && <span className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-[#12251c]' : 'bg-slate-100'}`}>{c.departments.name}</span>}
                          </div>
                          <SlaBar complaint={c} isDark={isDark} />
                        </div>
                        <div className={`flex items-center self-start sm:self-center shrink-0 transition-transform group-hover:translate-x-1 ${isDark ? 'text-emerald-400' : 'text-[#15803d]'}`}>
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {filtered.length > 10 && (
                  <div className="pt-2 text-center">
                    <Link href="/citizen/complaints" className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border transition-all ${isDark ? 'border-[#1b3828] text-emerald-400 hover:bg-[#0f2a1f]' : 'border-[#c8e6c9] text-[#15803d] hover:bg-emerald-50'}`}>
                      <TrendingUp size={14} />View All {filtered.length} Complaints
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Quick Links */}
      <FadeIn direction="up">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: '/citizen/verification', icon: <BadgeCheck size={22} />, label: 'Resolution Verification', desc: 'Confirm or dispute resolution proofs.', color: isDark ? 'text-emerald-400' : 'text-emerald-700', border: isDark ? 'border-emerald-700/30 hover:border-emerald-600/50' : 'border-emerald-200 hover:border-emerald-300', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' },
            { href: '/citizen/complaints', icon: <FileWarning size={22} />, label: 'My Complaints', desc: 'All your reported grievances with timeline.', color: isDark ? 'text-blue-400' : 'text-blue-700', border: isDark ? 'border-blue-700/30 hover:border-blue-600/50' : 'border-blue-200 hover:border-blue-300', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50' },
            { href: '/citizen/profile', icon: <Zap size={22} />, label: 'Profile & Settings', desc: 'Manage account details and preferences.', color: isDark ? 'text-violet-400' : 'text-violet-700', border: isDark ? 'border-violet-700/30 hover:border-violet-600/50' : 'border-violet-200 hover:border-violet-300', bg: isDark ? 'bg-violet-500/10' : 'bg-violet-50' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all group cursor-pointer ${isDark ? `${item.bg} ${item.border} bg-[#0b1a15]` : `${item.bg} ${item.border}`}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isDark ? 'bg-[#0a1812]' : 'bg-white'} ${item.color}`}>{item.icon}</div>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white group-hover:text-emerald-300' : 'text-slate-900 group-hover:text-[#15803d]'}`}>{item.label}</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${item.color}`}><span>Open</span><ArrowRight size={13} /></div>
            </Link>
          ))}
        </div>
      </FadeIn>
    </div>
  )
}
