'use client'

import Link from 'next/link'
import {
  ArrowLeft, MapPin, Clock, Calendar, User, Building2,
  CheckCircle2, AlertCircle, AlertTriangle, Sparkles, FileText, Download, Share2
} from 'lucide-react'
import {
  Complaint, ComplaintImage, ComplaintStatusHistory,
  ComplaintAiAnalysis, STATUS_LABELS, PRIORITY_LABELS, getSlaStatus, ComplaintStatus
} from '@/lib/types'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {STATUS_LABELS[status as ComplaintStatus] ?? status}
    </span>
  )
}

function SlaSection({ complaint }: { complaint: Complaint }) {
  const { percent, label, hoursLeft } = getSlaStatus(complaint.sla_deadline, complaint.sla_start_time)
  if (!complaint.sla_deadline) return null

  const labelColors: Record<'normal' | 'reminder' | 'warning' | 'critical' | 'breached', string> = {
    normal: 'text-[hsl(152,69%,60%)] font-semibold',
    reminder: 'text-[hsl(152,69%,60%)] font-semibold',
    warning: 'text-[hsl(40,96%,65%)] font-semibold',
    critical: 'text-[hsl(25,95%,70%)] font-bold',
    breached: 'text-[hsl(0,84%,72%)] font-bold',
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-3 border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Clock size={16} className="text-cyan-400" />
          <span>SLA Resolution Countdown</span>
        </div>
        <span className={`text-xs sm:text-sm ${labelColors[label]}`}>
          {label === 'breached' ? 'SLA BREACHED' : `${hoursLeft}h remaining`}
        </span>
      </div>
      <div className="sla-bar">
        <div className={`sla-bar-fill sla-${label}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
        <span>Started {new Date(complaint.sla_start_time!).toLocaleDateString('en-IN')}</span>
        <span>Deadline {new Date(complaint.sla_deadline).toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

interface ComplaintDetailViewProps {
  complaint: Complaint
  images: ComplaintImage[]
  timeline: ComplaintStatusHistory[]
  ai: ComplaintAiAnalysis | null
}

export default function ComplaintDetailView({
  complaint: c,
  images: imgs,
  timeline,
  ai,
}: ComplaintDetailViewProps) {
  const originalImg = imgs.find(i => i.image_type === 'original') || imgs[0]

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Top Bar */}
      <FadeIn direction="left" distance={10} className="flex items-center justify-between">
        <Link
          href="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-white transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/track?id=${c.permanent_id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 rounded-lg hover:bg-cyan-900/60 transition-colors"
          >
            <Share2 size={13} /> Public Tracking
          </Link>
          <a
            href={`/api/complaints/${c.id}/pdf`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-lg hover:bg-emerald-900/60 transition-colors"
          >
            <Download size={13} /> Official PDF
          </a>
        </div>
      </FadeIn>

      {/* Header Info */}
      <FadeIn direction="up" className="glass-card p-6 flex flex-wrap items-start justify-between gap-4 border-slate-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <code className="text-xl sm:text-2xl font-mono font-extrabold text-cyan-400 tracking-wider">{c.permanent_id}</code>
            <StatusBadge status={c.status} />
            <span className={`badge badge-${c.priority?.toLowerCase() ?? 'medium'}`}>
              {PRIORITY_LABELS[c.priority] ?? c.priority}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Calendar size={14} /> Reported on {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </FadeIn>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left Column: Citizen Provided Info & AI Analysis */}
        <div className="md:col-span-3 flex flex-col gap-6">
          {/* SECTION 1: Citizen Provided Information */}
          <FadeIn direction="up" delay={0.05}>
            <div className="glass-card p-5 sm:p-6 flex flex-col gap-4 border-emerald-900/30 bg-emerald-950/10">
              <div className="flex items-center gap-2 border-b border-emerald-900/40 pb-3">
                <FileText size={18} className="text-emerald-400" />
                <h2 className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  Citizen Provided Information
                </h2>
              </div>

              {/* Photo Evidence */}
              {originalImg && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalImg.image_url}
                    alt="Photographic evidence"
                    className="w-full max-h-72 object-cover"
                  />
                  <div className="px-3 py-2 text-[11px] text-[var(--text-muted)] bg-slate-950/80 flex items-center justify-between">
                    <span>Uploaded Photographic Evidence</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Metadata Verified</span>
                  </div>
                </div>
              )}

              {/* Resident Description */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Issue Description</span>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-200 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  {c.description}
                </p>
              </div>

              {/* Geotagged Location */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center gap-1">
                  <MapPin size={13} className="text-cyan-400" /> GPS Geo-Telemetry Location
                </span>
                <p className="text-xs sm:text-sm text-slate-300">{c.address}</p>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">{c.latitude?.toFixed(6)}° N, {c.longitude?.toFixed(6)}° E</p>
              </div>
            </div>
          </FadeIn>

          {/* SECTION 2: AI Generated Intelligence */}
          {ai && (
            <FadeIn direction="up" delay={0.1}>
              <div className="glass-card p-5 sm:p-6 flex flex-col gap-4 border-blue-900/40 bg-blue-950/15">
                <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-400" />
                    <h2 className="text-xs sm:text-sm font-bold text-blue-400 uppercase tracking-wider">
                      AI Generated Intelligence
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Confidence: {Math.round((ai.confidence ?? 0) * 100)}%
                  </span>
                </div>

                {ai.summary && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">AI Executive Summary</span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-blue-950/30 p-3 rounded-lg border border-blue-900/40">
                      {ai.summary}
                    </p>
                  </div>
                )}

                {ai.recommended_actions && (ai.recommended_actions as string[]).length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Recommended Action Protocol</span>
                    <ul className="flex flex-col gap-2">
                      {(ai.recommended_actions as string[]).map((action: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                          <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </FadeIn>
          )}
        </div>

        {/* Right Column: Classification, SLA & Timeline */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Classification Card */}
          <FadeIn direction="up" delay={0.1}>
            <div className="glass-card p-5 flex flex-col gap-4 border-slate-800">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Ticket Classification</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <Building2 size={15} />, label: 'Assigned Department', value: (c as { departments?: { name: string } }).departments?.name ?? 'Assigned via Smart Routing' },
                  { icon: <AlertTriangle size={15} />, label: 'Category & Subcategory', value: `${c.category} › ${c.subcategory}` },
                  { icon: <User size={15} />, label: 'Assigned Officer', value: c.assigned_officer_id ? 'Officer Assigned' : 'Awaiting Assignment' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <span className="text-blue-400 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-[11px] text-[var(--text-muted)]">{item.label}</p>
                      <p className="text-xs sm:text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* SLA Timer */}
          <FadeIn direction="up" delay={0.15}>
            <SlaSection complaint={c} />
          </FadeIn>

          {/* Verification CTA if pending */}
          {c.status === 'CITIZEN_VERIFICATION' && (
            <FadeIn direction="up" delay={0.2}>
              <div className="glass-card p-5 flex flex-col gap-3 border-[hsla(40,96%,53%,0.3)] bg-[hsla(40,96%,53%,0.08)]">
                <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(40,96%,65%)]">
                  <AlertCircle size={16} className="animate-pulse" /> Action Required
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  The municipal officer has completed repair work. Please review the proof and confirm resolution.
                </p>
                <Link href={`/citizen/complaints/${c.id}/verify`} className="btn-primary text-xs text-center mt-1 py-2">
                  Inspect &amp; Verify Resolution
                </Link>
              </div>
            </FadeIn>
          )}

          {/* Chronological Timeline */}
          <FadeIn direction="up" delay={0.25}>
            <div className="glass-card p-5 flex flex-col gap-4 border-slate-800">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold border-b border-slate-800 pb-2">
                Chronological Audit Timeline
              </p>
              <StaggerContainer staggerChildren={0.06} className="flex flex-col gap-1">
                {timeline.map((entry, i) => (
                  <StaggerItem key={entry.id}>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full mt-1 ${
                            i === timeline.length - 1
                              ? 'bg-cyan-400 ring-4 ring-cyan-400/20'
                              : 'bg-slate-700'
                          }`}
                        />
                        {i < timeline.length - 1 && (
                          <div className="w-px flex-1 bg-slate-800 mt-1 min-h-[28px]" />
                        )}
                      </div>
                      <div className="pb-3 flex flex-col gap-0.5">
                        <p className="text-xs font-bold text-slate-200">
                          {STATUS_LABELS[entry.new_status as ComplaintStatus] ?? entry.new_status}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">
                          {new Date(entry.created_at).toLocaleString('en-IN')}
                        </p>
                        {entry.notes && (
                          <p className="text-[11px] text-slate-300 mt-1 bg-slate-900/50 p-2 rounded-md border border-slate-800">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
