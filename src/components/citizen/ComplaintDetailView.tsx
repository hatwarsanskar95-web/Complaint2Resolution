'use client'

import Link from 'next/link'
import {
  ArrowLeft, MapPin, Clock, Calendar, User, Building2,
  CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles
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
    normal: 'text-[hsl(152,69%,60%)]',
    reminder: 'text-[hsl(152,69%,60%)]',
    warning: 'text-[hsl(40,96%,65%)]',
    critical: 'text-[hsl(25,95%,70%)]',
    breached: 'text-[hsl(0,84%,72%)]',
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock size={15} className="text-cyan-400" />
          SLA Target Countdown
        </div>
        <span className={`text-xs sm:text-sm font-bold ${labelColors[label]}`}>
          {label === 'breached' ? 'BREACHED' : `${hoursLeft}h remaining`}
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
  const originalImg = imgs.find(i => i.image_type === 'original')

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Back link */}
      <FadeIn direction="left" distance={10}>
        <Link
          href="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-white transition-colors w-fit group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>
      </FadeIn>

      {/* Header */}
      <FadeIn direction="up" className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <code className="text-xl sm:text-2xl font-mono font-bold text-cyan-400 tracking-wide">{c.permanent_id}</code>
          <div className="flex flex-wrap gap-2 items-center">
            <StatusBadge status={c.status} />
            <span className={`badge badge-${c.priority?.toLowerCase() ?? 'medium'}`}>
              {PRIORITY_LABELS[c.priority] ?? c.priority}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-muted)]">
          <Calendar size={14} />
          {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </FadeIn>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="md:col-span-3 flex flex-col gap-5">
          {/* Photo */}
          {originalImg && (
            <FadeIn direction="up" delay={0.05}>
              <div className="glass-card overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalImg.image_url}
                  alt="Complaint photographic evidence"
                  className="w-full max-h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="px-4 py-3 text-xs text-[var(--text-muted)] bg-slate-950/60 border-t border-[var(--bg-border)] flex items-center justify-between">
                  <span>Photographic Evidence (Timestamped)</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Original Metadata Verified</span>
                </div>
              </div>
            </FadeIn>
          )}

          {/* Description */}
          <FadeIn direction="up" delay={0.1}>
            <div className="glass-card p-5 flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Resident Description</p>
              <p className="text-sm leading-relaxed text-[var(--text-primary)]">{c.description}</p>
            </div>
          </FadeIn>

          {/* Location */}
          <FadeIn direction="up" delay={0.15}>
            <div className="glass-card p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin size={15} className="text-cyan-400" /> GPS Geo-Telemetry
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{c.address}</p>
              <p className="text-xs text-[var(--text-muted)] font-mono">{c.latitude?.toFixed(6)}° N, {c.longitude?.toFixed(6)}° E</p>
            </div>
          </FadeIn>

          {/* AI Analysis */}
          {ai && (
            <FadeIn direction="up" delay={0.2}>
              <div className="glass-card p-5 flex flex-col gap-3 border-blue-500/20 bg-blue-950/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-2 text-blue-400">
                    <Sparkles size={15} /> Gemini AI Analysis
                  </p>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Confidence: {Math.round((ai.confidence ?? 0) * 100)}%
                  </span>
                </div>
                {ai.summary && <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{ai.summary}</p>}
                {ai.recommended_actions && (ai.recommended_actions as string[]).length > 0 && (
                  <div className="pt-2 border-t border-[var(--bg-border)]">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold mb-2">Recommended Operational Steps</p>
                    <ul className="flex flex-col gap-1.5">
                      {(ai.recommended_actions as string[]).map((action: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                          <CheckCircle2 size={14} className="text-[var(--brand-success)] mt-0.5 shrink-0" />
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

        {/* Right Column */}
        <div className="md:col-span-2 flex flex-col gap-5">
          {/* Complaint Info */}
          <FadeIn direction="up" delay={0.1}>
            <div className="glass-card p-5 flex flex-col gap-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Classification</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <Building2 size={14} />, label: 'Assigned Department', value: (c as { departments?: { name: string } }).departments?.name ?? '—' },
                  { icon: <AlertTriangle size={14} />, label: 'Category & Subcategory', value: `${c.category} › ${c.subcategory}` },
                  { icon: <User size={14} />, label: 'Assigned Field Officer', value: c.assigned_officer_id ? 'Assigned' : 'Pending Assignment' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <span className="text-blue-400 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-[11px] text-[var(--text-muted)]">{item.label}</p>
                      <p className="text-xs sm:text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* SLA */}
          <FadeIn direction="up" delay={0.15}>
            <SlaSection complaint={c} />
          </FadeIn>

          {/* Pending Verification CTA */}
          {c.status === 'CITIZEN_VERIFICATION' && (
            <FadeIn direction="up" delay={0.2}>
              <div className="glass-card p-5 flex flex-col gap-3 border-[hsla(40,96%,53%,0.3)] bg-[hsla(40,96%,53%,0.08)]">
                <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(40,96%,65%)]">
                  <AlertCircle size={16} className="animate-pulse" /> Action Required
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  The municipal officer has completed field repairs and submitted resolution evidence. Please review and confirm resolution.
                </p>
                <Link href={`/citizen/complaints/${c.id}/verify`} className="btn-primary text-xs sm:text-sm text-center mt-1">
                  Inspect &amp; Verify Resolution
                </Link>
              </div>
            </FadeIn>
          )}

          {/* Timeline */}
          <FadeIn direction="up" delay={0.25}>
            <div className="glass-card p-5 flex flex-col gap-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Chronological Audit Timeline</p>
              <StaggerContainer staggerChildren={0.06} className="flex flex-col gap-1">
                {timeline.map((entry, i) => (
                  <StaggerItem key={entry.id}>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 ${i === timeline.length - 1 ? 'bg-cyan-400 ring-4 ring-cyan-400/20' : 'bg-[var(--bg-border)]'}`} />
                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-[var(--bg-border)] mt-1 min-h-[24px]" />}
                      </div>
                      <div className="pb-3 flex flex-col gap-0.5">
                        <p className="text-xs font-semibold text-slate-200">
                          {STATUS_LABELS[entry.new_status as ComplaintStatus] ?? entry.new_status}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">
                          {new Date(entry.created_at).toLocaleString('en-IN')}
                        </p>
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
