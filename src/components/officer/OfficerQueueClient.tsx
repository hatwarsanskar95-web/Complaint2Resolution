'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Inbox, User, Wrench, Clock,
  CheckCircle2, Archive, ArrowRight, MapPin, Search, Building2,
  AlertTriangle, Sparkles, RefreshCw,
} from 'lucide-react'
import { Complaint, STATUS_LABELS, PRIORITY_LABELS, getSlaStatus, ComplaintStatus, PriorityLevel } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/context/ToastContext'
import { FadeIn, StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/ui/motion'

const POLL_INTERVAL_SECONDS = 30

type ComplaintWithDept = Complaint & { departments?: { name: string; code: string } }

interface Queues {
  new: ComplaintWithDept[]
  assigned: ComplaintWithDept[]
  inProgress: ComplaintWithDept[]
  nearSla: ComplaintWithDept[]
  breached: ComplaintWithDept[]
  pendingVerification: ComplaintWithDept[]
  closed: ComplaintWithDept[]
}

interface Metrics {
  totalActive: number
  totalClosed: number
  slaBreachedCount: number
  pendingCount: number
}

interface Props {
  officerName: string
  departmentName: string
  officerId: string
  queues: Queues
  metrics: Metrics
}

type TabKey = keyof Queues

interface TabDef {
  key: TabKey
  label: string
  icon: React.ReactNode
  accent: string
  badgeColor: string
}

const TABS: TabDef[] = [
  { key: 'new',                label: 'New',                icon: <Inbox size={15} />,         accent: 'border-blue-500/40 bg-blue-950/20',       badgeColor: 'bg-blue-500 text-white' },
  { key: 'assigned',           label: 'Assigned',           icon: <User size={15} />,          accent: 'border-purple-500/40 bg-purple-950/20',    badgeColor: 'bg-purple-500 text-white' },
  { key: 'inProgress',         label: 'In Progress',        icon: <Wrench size={15} />,        accent: 'border-emerald-500/40 bg-emerald-950/20',  badgeColor: 'bg-emerald-500 text-white' },
  { key: 'nearSla',            label: 'Near SLA',           icon: <Clock size={15} />,         accent: 'border-amber-500/40 bg-amber-950/20',      badgeColor: 'bg-amber-500 text-white' },
  { key: 'breached',           label: 'SLA Breached',       icon: <AlertTriangle size={15} />, accent: 'border-rose-500/50 bg-rose-950/20',        badgeColor: 'bg-rose-500 text-white' },
  { key: 'pendingVerification',label: 'Pending Verify',     icon: <Sparkles size={15} />,      accent: 'border-cyan-500/40 bg-cyan-950/20',        badgeColor: 'bg-cyan-500 text-white' },
  { key: 'closed',             label: 'Closed',             icon: <Archive size={15} />,       accent: 'border-slate-600/40 bg-slate-900/20',      badgeColor: 'bg-slate-600 text-white' },
]

const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  HIGH:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
  MEDIUM:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  LOW:      'bg-slate-700/40 text-slate-300 border-slate-700',
}

export default function OfficerQueueClient({ officerName, departmentName, officerId, queues, metrics }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('new')
  const [search, setSearch] = useState('')
  const [claiming, setClaiming] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [countdown, setCountdown] = useState(POLL_INTERVAL_SECONDS)
  const countdownRef = useRef(POLL_INTERVAL_SECONDS)
  const supabase = createClient()

  const currentList = queues[activeTab]

  const filtered = useMemo(() => {
    if (!search.trim()) return currentList
    const q = search.toLowerCase()
    return currentList.filter((c) =>
      c.permanent_id.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    )
  }, [currentList, search])

  // Manual + auto-poll refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    router.refresh()
    countdownRef.current = POLL_INTERVAL_SECONDS
    setCountdown(POLL_INTERVAL_SECONDS)
    await new Promise((r) => setTimeout(r, 600))
    setRefreshing(false)
  }, [router])

  // Countdown tick and auto-refresh every POLL_INTERVAL_SECONDS
  useEffect(() => {
    const tick = setInterval(() => {
      countdownRef.current -= 1
      setCountdown(countdownRef.current)
      if (countdownRef.current <= 0) {
        countdownRef.current = POLL_INTERVAL_SECONDS
        setCountdown(POLL_INTERVAL_SECONDS)
        router.refresh()
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [router])

  // Claim a complaint (New queue → ASSIGNED)
  async function handleClaim(complaint: ComplaintWithDept) {
    setClaiming(complaint.id)
    const toastId = toast.loading(`Claiming ${complaint.permanent_id}...`)
    try {
      const { error: updErr } = await supabase
        .from('complaints')
        .update({ status: 'ASSIGNED', assigned_officer_id: officerId })
        .eq('id', complaint.id)
      if (updErr) throw updErr

      await supabase.from('complaint_status_history').insert({
        complaint_id: complaint.id,
        old_status: complaint.status,
        new_status: 'ASSIGNED',
        updated_by: officerId,
        notes: `Claimed by Officer ${officerName}`,
      })
      toast.update(toastId, { type: 'success', message: `${complaint.permanent_id} claimed successfully.` })
      setTimeout(() => handleRefresh(), 800)
    } catch (err: unknown) {
      toast.update(toastId, { type: 'error', message: err instanceof Error ? err.message : 'Claim failed' })
      setClaiming(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">

      {/* Page Header */}
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <LayoutDashboard className="text-emerald-400" size={24} />
              Officer Dashboard
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Welcome back, <span className="text-white font-semibold">{officerName}</span> · {departmentName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Live Refresh Button + Countdown */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title={`Auto-refreshes in ${countdown}s. Click to refresh now.`}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-xs text-slate-300 hover:text-emerald-400 font-semibold transition-all disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
              {refreshing ? 'Refreshing…' : `Refresh (${countdown}s)`}
            </button>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/25 text-xs text-emerald-400 font-semibold">
              <Building2 size={13} />
              {departmentName}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Active Tickets" value={metrics.totalActive} color="text-white" accent="border-slate-800" />
        <MetricCard label="Pending Intake" value={metrics.pendingCount} color="text-blue-400" accent="border-blue-900/40" />
        <MetricCard label="SLA Breached" value={metrics.slaBreachedCount} color="text-rose-400" accent="border-rose-900/40" />
        <MetricCard label="Resolved / Closed" value={metrics.totalClosed} color="text-emerald-400" accent="border-emerald-900/40" />
      </div>

      {/* Tab Bar + Search */}
      <FadeIn direction="up" delay={0.05}>
        <div className="flex flex-col gap-3">
          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const count = queues[tab.key].length
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSearch('') }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? `${tab.accent} border text-white shadow-sm`
                      : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className={isActive ? 'text-current' : 'text-slate-500'}>{tab.icon}</span>
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center ${
                    isActive ? tab.badgeColor : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, description, location..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#0b1410] border border-[#16271e] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/40 transition-all"
            />
          </div>
        </div>
      </FadeIn>

      {/* Queue List */}
      <div>
        {filtered.length === 0 ? (
          <EmptyQueue tab={TABS.find((t) => t.key === activeTab)!} hasSearch={!!search} />
        ) : (
          <StaggerContainer staggerChildren={0.04} className="flex flex-col gap-3">
            {filtered.map((c) => (
              <StaggerItem key={c.id}>
                <ComplaintCard
                  complaint={c}
                  tabKey={activeTab}
                  officerId={officerId}
                  claiming={claiming === c.id}
                  onClaim={() => handleClaim(c)}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ──

function MetricCard({ label, value, color, accent }: { label: string; value: number; color: string; accent: string }) {
  return (
    <FadeIn direction="up">
      <div className={`glass-card p-4 rounded-xl border ${accent} flex flex-col gap-1`}>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-2xl font-extrabold font-mono ${color}`}>
          <AnimatedNumber value={value} />
        </p>
      </div>
    </FadeIn>
  )
}

function ComplaintCard({
  complaint: c, tabKey, officerId, claiming, onClaim
}: {
  complaint: ComplaintWithDept
  tabKey: TabKey
  officerId: string
  claiming: boolean
  onClaim: () => void
}) {
  const sla = getSlaStatus(c.sla_deadline, c.sla_start_time)
  const isBreached = sla.label === 'breached'
  const slaBarColor =
    sla.label === 'breached' ? 'bg-rose-500' :
    sla.label === 'critical' ? 'bg-rose-400' :
    sla.label === 'warning' ? 'bg-amber-400' :
    sla.label === 'reminder' ? 'bg-yellow-400' : 'bg-emerald-400'

  return (
    <div className={`p-4 rounded-2xl border transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
      isBreached
        ? 'bg-rose-950/10 border-rose-500/30 hover:border-rose-400/60'
        : c.priority === 'CRITICAL'
        ? 'bg-amber-950/10 border-amber-500/25 hover:border-amber-400/50'
        : 'bg-[#09120d] border-slate-800 hover:border-emerald-500/40'
    }`}>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* ID + badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <code className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
            isBreached ? 'text-rose-400 bg-rose-950/60 border-rose-900/40' : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
          }`}>
            {c.permanent_id}
          </code>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/40 text-slate-300 border border-slate-700">
            {STATUS_LABELS[c.status as ComplaintStatus] ?? c.status}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.LOW}`}>
            {PRIORITY_LABELS[c.priority as PriorityLevel] ?? c.priority}
          </span>
          {isBreached && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              <AlertTriangle size={9} /> SLA BREACHED
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
          {c.description}
        </p>

        {/* Meta */}
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <MapPin size={11} className="text-slate-500 shrink-0" />
          {c.category} · {c.address}
        </p>

        {/* SLA bar */}
        {c.sla_deadline && c.sla_start_time && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${slaBarColor}`} style={{ width: `${sla.percent}%` }} />
            </div>
            <span className={`text-[10px] font-mono font-bold shrink-0 ${
              isBreached ? 'text-rose-400' : sla.label === 'warning' ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {sla.formattedTimeLeft}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Claim button — only on New queue */}
        {tabKey === 'new' && (
          <button
            onClick={onClaim}
            disabled={claiming}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-xs shadow-[0_0_12px_rgba(37,99,235,0.3)] flex items-center gap-1.5 cursor-pointer transition-all"
          >
            {claiming ? (
              <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <CheckCircle2 size={13} />
            )}
            {claiming ? 'Claiming...' : 'Claim'}
          </button>
        )}

        {/* Open workspace */}
        <Link
          href={`/officer/complaints/${c.id}`}
          className="px-3.5 py-2 rounded-xl bg-[#0d1812] hover:bg-emerald-900/30 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          Open <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

function EmptyQueue({ tab, hasSearch }: { tab: TabDef; hasSearch: boolean }) {
  return (
    <div className={`p-14 text-center rounded-2xl border ${tab.accent}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3 text-slate-500">
        {tab.icon}
      </div>
      <p className="text-sm font-semibold text-slate-300">
        {hasSearch ? 'No complaints match your search' : `${tab.label} queue is empty`}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        {hasSearch
          ? 'Try a different keyword or clear the search filter.'
          : tab.key === 'new'
          ? 'No new complaints awaiting claim in your department.'
          : tab.key === 'closed'
          ? 'No resolved complaints yet — keep up the great work!'
          : `No complaints currently in the "${tab.label}" state.`
        }
      </p>
    </div>
  )
}
