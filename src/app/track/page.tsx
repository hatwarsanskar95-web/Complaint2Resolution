'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search, ShieldCheck, Clock, MapPin, Calendar, Building2, AlertTriangle, CheckCircle2, ArrowLeft, RefreshCw, FileText, Sparkles, Image as ImageIcon
} from 'lucide-react'
import { STATUS_LABELS, PRIORITY_LABELS, getSlaStatus, ComplaintStatus } from '@/lib/types'

interface TrackResult {
  complaint: {
    id: string
    permanentId: string
    category: string
    subcategory: string
    description: string
    address: string
    latitude: number
    longitude: number
    priority: string
    status: string
    slaStartTime: string | null
    slaDurationHours: number | null
    slaDeadline: string | null
    createdAt: string
    updatedAt: string
    department: { name: string; code: string } | null
  }
  images: Array<{ image_url: string; image_type: string }>
  timeline: Array<{ id: string; oldStatus: string | null; newStatus: string; notes: string | null; createdAt: string }>
  aiAnalysis: {
    category: string | null
    subcategory: string | null
    departmentRecommendation: string | null
    summary: string | null
    recommendedActions: string[] | null
    confidence: number | null
  } | null
}

function SlaBar({ deadline, start }: { deadline: string | null; start: string | null }) {
  if (!deadline) return null
  const { percent, label, hoursLeft } = getSlaStatus(deadline, start)

  const labelColors: Record<string, string> = {
    normal: 'text-emerald-400',
    reminder: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-orange-400',
    breached: 'text-rose-400 font-bold',
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock size={16} className="text-cyan-400" />
          <span>SLA Target Timeline</span>
        </div>
        <span className={`text-xs sm:text-sm font-semibold ${labelColors[label] || 'text-cyan-400'}`}>
          {label === 'breached' ? 'SLA BREACHED' : `${hoursLeft}h remaining`}
        </span>
      </div>
      <div className="sla-bar">
        <div className={`sla-bar-fill sla-${label}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
        <span>Started: {start ? new Date(start).toLocaleDateString('en-IN') : 'N/A'}</span>
        <span>Deadline: {new Date(deadline).toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

function TrackingContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('id') || ''
  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrackResult | null>(null)

  const handleSearch = async (searchId: string) => {
    if (!searchId.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/complaints/track/${encodeURIComponent(searchId.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to locate ticket.')
        setResult(null)
      } else {
        setResult(data)
      }
    } catch (e) {
      setError('Network error while searching ticket.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery)
    }
  }, [initialQuery])

  const originalImage = result?.images?.find((i) => i.image_type === 'original') || result?.images?.[0]

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[var(--brand-emerald)]" />
            <span className="text-sm font-semibold tracking-wide text-emerald-400">Public Civic Resolution Portal</span>
          </div>
        </div>

        {/* Hero Banner & Search Input */}
        <div className="glass-card p-6 sm:p-8 flex flex-col gap-6 text-center items-center bg-gradient-to-b from-slate-900/80 via-slate-950/70 to-slate-950/90 border-slate-800">
          <div className="flex flex-col gap-2 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Track Complaint Status
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              Enter your Permanent Complaint Ticket ID (e.g., <code className="text-cyan-400 font-mono font-bold">CR-2026-000001</code>) for real-time resolution updates.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch(query)
            }}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-lg"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input
                type="text"
                placeholder="Enter CR-YYYY-XXXXXX..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors uppercase tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Searching...
                </>
              ) : (
                <>
                  <Search size={16} /> Track Ticket
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="glass-card p-5 border-rose-500/30 bg-rose-950/20 text-rose-300 text-sm flex items-center gap-3">
            <AlertTriangle size={18} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header info */}
            <div className="glass-card p-6 flex flex-wrap items-start justify-between gap-4 border-slate-800">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <code className="text-xl sm:text-2xl font-mono font-extrabold text-cyan-400 tracking-wider">
                    {result.complaint.permanentId}
                  </code>
                  <span className={`badge badge-${result.complaint.status.toLowerCase()}`}>
                    {STATUS_LABELS[result.complaint.status as ComplaintStatus] ?? result.complaint.status}
                  </span>
                  <span className={`badge badge-${result.complaint.priority.toLowerCase()}`}>
                    {PRIORITY_LABELS[result.complaint.priority as keyof typeof PRIORITY_LABELS] ?? result.complaint.priority}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                  <Calendar size={14} /> Reported on {new Date(result.complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* SLA Bar */}
            <SlaBar deadline={result.complaint.slaDeadline} start={result.complaint.slaStartTime} />

            {/* 2-Column Split: Citizen Info vs AI Info */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: Citizen Provided Info */}
              <div className="glass-card p-6 flex flex-col gap-4 border-slate-800">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileText size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                    Citizen Provided Information
                  </h3>
                </div>

                {originalImage && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalImage.image_url}
                      alt="Photographic Evidence"
                      className="w-full max-h-56 object-cover"
                    />
                    <div className="px-3 py-2 text-[11px] text-slate-400 flex items-center justify-between bg-slate-900/60">
                      <span className="flex items-center gap-1">
                        <ImageIcon size={12} /> Photographic Evidence
                      </span>
                      <span className="font-mono text-cyan-400 text-[10px]">Verified Upload</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Description</span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
                    {result.complaint.description}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                    <MapPin size={12} className="text-cyan-400" /> Location Details
                  </span>
                  <p className="text-xs text-slate-300">{result.complaint.address}</p>
                </div>
              </div>

              {/* Right Column: AI Generated Information & Department */}
              <div className="glass-card p-6 flex flex-col gap-4 border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-400" />
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                      AI Generated Intelligence
                    </h3>
                  </div>
                  {result.aiAnalysis?.confidence && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Confidence: {Math.round(result.aiAnalysis.confidence * 100)}%
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <Building2 size={16} className="text-blue-400 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">Routed Department</span>
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {result.complaint.department?.name || result.aiAnalysis?.departmentRecommendation || 'Under Assessment'}
                      </span>
                    </div>
                  </div>

                  {result.aiAnalysis?.summary && (
                    <div className="flex flex-col gap-1.5 bg-blue-950/20 p-3 rounded-lg border border-blue-900/30">
                      <span className="text-[11px] font-bold text-blue-300">AI Problem Summary</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{result.aiAnalysis.summary}</p>
                    </div>
                  )}

                  {result.aiAnalysis?.recommendedActions && result.aiAnalysis.recommendedActions.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Recommended Remediation Steps</span>
                      <ul className="flex flex-col gap-1.5">
                        {result.aiAnalysis.recommendedActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chronological Timeline */}
            <div className="glass-card p-6 flex flex-col gap-4 border-slate-800">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[var(--text-muted)] border-b border-slate-800 pb-3">
                Chronological Audit Timeline
              </h3>
              <div className="flex flex-col gap-3 pl-2">
                {result.timeline.map((item, index) => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 ${
                          index === result.timeline.length - 1
                            ? 'bg-cyan-400 ring-4 ring-cyan-400/20'
                            : 'bg-slate-700'
                        }`}
                      />
                      {index < result.timeline.length - 1 && (
                        <div className="w-0.5 h-10 bg-slate-800 mt-1" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">
                        {STATUS_LABELS[item.newStatus as ComplaintStatus] ?? item.newStatus}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleString('en-IN')}
                      </span>
                      {item.notes && (
                        <p className="text-xs text-slate-300 mt-1 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center text-slate-400 text-sm">Loading tracker...</div>}>
      <TrackingContent />
    </Suspense>
  )
}
