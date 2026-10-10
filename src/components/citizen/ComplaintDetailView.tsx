'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, Clock, Calendar, User, Building2,
  CheckCircle2, AlertCircle, AlertTriangle, Sparkles, FileText, Download, Share2,
  Check, Circle, RefreshCw, X, Camera, Send, Loader2, Eye
} from 'lucide-react'
import {
  Complaint, ComplaintImage, ComplaintStatusHistory,
  ComplaintAiAnalysis, STATUS_LABELS, PRIORITY_LABELS, getSlaStatus, ComplaintStatus
} from '@/lib/types'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { toast } from '@/context/ToastContext'

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {STATUS_LABELS[status as ComplaintStatus] ?? status}
    </span>
  )
}

function SlaSection({ complaint }: { complaint: Complaint }) {
  const { percent, label, hoursLeft, formattedTimeLeft } = getSlaStatus(complaint.sla_deadline, complaint.sla_start_time, complaint.status)
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
          {formattedTimeLeft}
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
  resolutionSubmission?: {
    action_taken?: string
    before_photo_url?: string
    after_photo_url?: string
  } | null
}

export default function ComplaintDetailView({
  complaint: c,
  images: imgs,
  timeline,
  ai,
  resolutionSubmission,
}: ComplaintDetailViewProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<string>(c.status)
  const originalImgs = imgs.filter(i => i.image_type === 'original')
  const resolutionImgs = imgs.filter(i => ['before', 'after', 'dispute'].includes(i.image_type))

  // Dispute & Confirm Resolution Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showSolutionModal, setShowSolutionModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [disputePhotoUrl, setDisputePhotoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Determine stage status for the 7-Stage Stepper
  const getStageInfo = (stageNumber: number) => {
    const statusOrder: Record<string, number> = {
      SUBMITTED: 1,
      RECEIVED: 2,
      ASSIGNED: 3,
      IN_PROGRESS: 4,
      RESOLUTION_SUBMITTED: 5,
      AI_VERIFICATION: 5,
      CITIZEN_VERIFICATION: 6,
      RESOLVED: 6,
      CLOSED: 7,
      DISPUTED: 4, // reopened returns to active work order
      REOPENED: 4,
    }

    const currentStageNum = statusOrder[currentStatus] || 1
    const isCompleted = currentStageNum > stageNumber || currentStatus === 'CLOSED'
    const isCurrent = currentStageNum === stageNumber && currentStatus !== 'CLOSED'
    const isPending = currentStageNum < stageNumber

    // Look for matching history timestamp
    let stageTimestamp: string | null = null
    if (stageNumber === 1) stageTimestamp = c.created_at
    else if (stageNumber === 2 && ai?.created_at) stageTimestamp = ai.created_at
    else if (stageNumber === 3) {
      const match = timeline.find(t => t.new_status === 'ASSIGNED')
      if (match) stageTimestamp = match.created_at
    } else if (stageNumber === 4) {
      const match = timeline.find(t => t.new_status === 'IN_PROGRESS' || t.new_status === 'REOPENED')
      if (match) stageTimestamp = match.created_at
    } else if (stageNumber === 5) {
      const match = timeline.find(t => t.new_status === 'RESOLUTION_SUBMITTED')
      if (match) stageTimestamp = match.created_at
    } else if (stageNumber === 6) {
      const match = timeline.find(t => t.new_status === 'CITIZEN_VERIFICATION' || t.new_status === 'RESOLVED' || t.new_status === 'AI_VERIFICATION')
      if (match) stageTimestamp = match.created_at
    } else if (stageNumber === 7) {
      const match = timeline.find(t => t.new_status === 'CLOSED')
      if (match) stageTimestamp = match.created_at
    }

    return { isCompleted, isCurrent, isPending, stageTimestamp }
  }

  const STAGES = [
    { num: 1, title: 'Complaint Submitted', desc: 'Registered & geotagged in portal' },
    { num: 2, title: 'AI Analysis Completed', desc: 'Intelligent triage & SLA assignment' },
    { num: 3, title: 'Department Assigned', desc: 'Routed to responsible municipal authority' },
    { num: 4, title: 'Officer Started Work', desc: 'Field officer dispatched & working' },
    { num: 5, title: 'Resolution Evidence Submitted', desc: 'Officer submitted before/after proof' },
    { num: 6, title: 'Citizen Verification', desc: 'Citizen inspects & confirms resolution' },
    { num: 7, title: 'Complaint Closed', desc: 'Official grievance closed & archived' },
  ]

  const handleConfirmResolution = async () => {
    setSubmitting(true)
    setActionError(null)
    const toastId = toast.loading('Confirming complaint resolution...')
    try {
      const res = await fetch(`/api/citizen/complaints/${c.id}/confirm-resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_rating: rating,
          feedback_comment: comment,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to confirm resolution')

      toast.update(toastId, {
        type: 'success',
        message: `Resolution confirmed! Complaint ${c.permanent_id} has been marked as Closed.`,
      })
      setShowConfirmModal(false)
      setCurrentStatus('CLOSED')
      router.push('/citizen/complaints')
    } catch (err: any) {
      toast.update(toastId, { type: 'error', message: err.message || 'Failed to confirm' })
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisputeResolution = async () => {
    if (!disputeReason.trim()) {
      setActionError('Please enter the reason for reporting this issue as unresolved.')
      return
    }

    setSubmitting(true)
    setActionError(null)
    const toastId = toast.loading('Submitting dispute report...')
    try {
      const res = await fetch(`/api/citizen/complaints/${c.id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_reason: disputeReason,
          dispute_photo_url: disputePhotoUrl || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?q=80&w=800',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit dispute')

      toast.update(toastId, {
        type: 'success',
        message: `Dispute submitted. Complaint ${c.permanent_id} has been reopened for officer resolution.`,
      })
      setShowDisputeModal(false)
      setCurrentStatus('REOPENED')
      router.push('/citizen/complaints')
    } catch (err: any) {
      toast.update(toastId, { type: 'error', message: err.message || 'Failed to submit dispute' })
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      {/* Top Bar */}
      <FadeIn direction="left" distance={10} className="flex items-center justify-between">
        <Link
          href="/citizen/complaints"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-white transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> Back to My Complaints
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/track?id=${c.permanent_id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 rounded-lg hover:bg-cyan-900/60 transition-colors"
          >
            <Share2 size={13} /> Public Tracking
          </Link>
        </div>
      </FadeIn>

      {/* Header Info Banner */}
      <FadeIn direction="up" className="glass-card p-6 flex flex-wrap items-start justify-between gap-4 border-slate-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <code className="text-xl sm:text-2xl font-mono font-extrabold text-cyan-400 tracking-wider">{c.permanent_id}</code>
            <StatusBadge status={currentStatus} />
            <span className={`badge badge-${c.priority?.toLowerCase() ?? 'medium'}`}>
              {PRIORITY_LABELS[c.priority] ?? c.priority}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Calendar size={14} /> Reported on {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </FadeIn>

      {/* REOPENED / DISPUTED ALERT BANNER */}
      {['REOPENED', 'DISPUTED'].includes(currentStatus) && (
        <FadeIn direction="up">
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-200 flex items-start gap-3 shadow-lg">
            <RefreshCw size={20} className="text-rose-400 animate-spin mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-rose-300">Complaint Reopened &amp; Active</h4>
              <p className="text-xs text-rose-200/80 mt-0.5 leading-relaxed">
                This grievance was disputed/reopened by the citizen. The issue maintains its permanent complaint ID <strong>{c.permanent_id}</strong> and has been reassigned to field officers for resolution.
              </p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* 7-STAGE VERTICAL COMPLAINT PROGRESS STEPPER */}
      <FadeIn direction="up" delay={0.05}>
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" />
              <span>7-Stage Complaint Progress Stepper</span>
            </h2>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">ID: {c.permanent_id}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {STAGES.map((stg) => {
              const { isCompleted, isCurrent, isPending, stageTimestamp } = getStageInfo(stg.num)
              const isVerificationState = ['RESOLUTION_SUBMITTED', 'AI_VERIFICATION', 'CITIZEN_VERIFICATION', 'RESOLVED'].includes(currentStatus)
              return (
                <div
                  key={stg.num}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    isCompleted
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-slate-200'
                      : isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isCompleted ? <Check size={12} strokeWidth={3} /> : stg.num}
                    </span>

                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      isCompleted ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
                      isCurrent ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50 animate-pulse' :
                      'bg-slate-900 text-slate-600'
                    }`}>
                      {isCompleted ? 'Completed' : isCurrent ? 'Active Stage' : 'Pending'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold leading-tight">{stg.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{stg.desc}</p>
                  </div>

                  {stg.num === 5 && (isCompleted || isCurrent) && (
                    <button
                      type="button"
                      onClick={() => setShowSolutionModal(true)}
                      className="mt-2 text-[10px] font-bold px-2 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/60 transition-colors flex items-center justify-center gap-1 cursor-pointer w-full"
                    >
                      <Eye size={12} /> View Solution
                    </button>
                  )}

                  {stg.num === 6 && (isCurrent || isVerificationState) && currentStatus !== 'CLOSED' && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowConfirmModal(true)}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1 cursor-pointer w-full"
                      >
                        <CheckCircle2 size={11} /> Confirm Resolution
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDisputeModal(true)}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 transition-colors flex items-center justify-center gap-1 cursor-pointer w-full"
                      >
                        <AlertTriangle size={11} /> Report Unresolved
                      </button>
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-800/50 text-[10px] font-mono text-slate-400">
                    {stageTimestamp ? new Date(stageTimestamp).toLocaleDateString() : 'Waiting…'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </FadeIn>


      <div className="grid md:grid-cols-5 gap-6">
        {/* Left Column: Details & Evidence */}
        <div className="md:col-span-3 flex flex-col gap-6">

          {/* SECTION 1: Citizen Provided Info */}
          <FadeIn direction="up" delay={0.1}>
            <div className="glass-card p-5 sm:p-6 flex flex-col gap-4 border-emerald-900/30 bg-emerald-950/10">
              <div className="flex items-center gap-2 border-b border-emerald-900/40 pb-3">
                <FileText size={18} className="text-emerald-400" />
                <h2 className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  Original Complaint Information
                </h2>
              </div>

              {originalImgs.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                    Original Photos ({originalImgs.length})
                  </span>
                  <div className={`grid gap-2 ${originalImgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                    {originalImgs.map((img, idx) => (
                      <div key={img.id} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.image_url}
                          alt={`Evidence photo ${idx + 1}`}
                          className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-200"
                        />
                        <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] bg-slate-950/80 text-center font-semibold">
                          Photo {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Issue Description</span>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-200 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  {c.description}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center gap-1">
                  <MapPin size={13} className="text-cyan-400" /> Location Address
                </span>
                <p className="text-xs sm:text-sm text-slate-300">{c.address}</p>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">{c.latitude?.toFixed(6)}° N, {c.longitude?.toFixed(6)}° E</p>
              </div>
            </div>
          </FadeIn>

          {/* SECTION 2: Officer Resolution Proof */}
          {resolutionImgs.length > 0 && (
            <FadeIn direction="up" delay={0.15}>
              <div className="glass-card p-5 sm:p-6 flex flex-col gap-4 border-cyan-900/40 bg-cyan-950/10">
                <div className="flex items-center gap-2 border-b border-cyan-900/40 pb-3">
                  <CheckCircle2 size={18} className="text-cyan-400" />
                  <h2 className="text-xs sm:text-sm font-bold text-cyan-400 uppercase tracking-wider">
                    Officer Resolution Evidence
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {resolutionImgs.map((img, idx) => (
                    <div key={img.id} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.image_url}
                        alt={`Resolution photo ${idx + 1}`}
                        className="w-full aspect-[4/3] object-cover"
                      />
                      <div className="px-2 py-1.5 text-[10px] font-bold text-cyan-300 bg-slate-950 text-center uppercase">
                        {img.image_type} Proof
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          {/* SECTION 3: AI Intelligence */}
          {ai && (
            <FadeIn direction="up" delay={0.2}>
              <div className="glass-card p-5 sm:p-6 flex flex-col gap-4 border-blue-900/40 bg-blue-950/15">
                <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-400" />
                    <h2 className="text-xs sm:text-sm font-bold text-blue-400 uppercase tracking-wider">
                      AI Triage Summary
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Confidence: {Math.round((ai.confidence ?? 0) * 100)}%
                  </span>
                </div>

                {ai.summary && (
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-blue-950/30 p-3 rounded-lg border border-blue-900/40">
                    {ai.summary}
                  </p>
                )}
              </div>
            </FadeIn>
          )}
        </div>

        {/* Right Column: Classification, SLA & Timeline */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* Classification */}
          <FadeIn direction="up" delay={0.1}>
            <div className="glass-card p-5 flex flex-col gap-4 border-slate-800">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Ticket Classification</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <Building2 size={15} />, label: 'Assigned Department', value: (c as any).departments?.name ?? 'Routed via Smart Routing' },
                  { icon: <AlertTriangle size={15} />, label: 'Category & Subcategory', value: `${c.category} › ${c.subcategory}` },
                  { icon: <User size={15} />, label: 'Assigned Officer', value: c.assigned_officer_id ? 'Officer Assigned' : 'Awaiting Officer' },
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

          {/* SLA Countdown */}
          <FadeIn direction="up" delay={0.15}>
            <SlaSection complaint={c} />
          </FadeIn>

          {/* Timeline Audit */}
          <FadeIn direction="up" delay={0.25}>
            <div className="glass-card p-5 flex flex-col gap-4 border-slate-800">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold border-b border-slate-800 pb-2">
                Audit Timeline History
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

      {/* CONFIRM RESOLUTION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>Confirm Complaint Resolution</span>
              </h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Are you satisfied with the repair work completed for complaint <strong>{c.permanent_id}</strong>?
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Satisfaction Rating (1 to 5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${
                        rating >= star ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Optional Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Thank you for resolving this issue quickly..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolution}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Confirm &amp; Close Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPUTE / REPORT UNRESOLVED MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-400" />
                <span>Report Unresolved Issue</span>
              </h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                If the problem is not fixed, submit your feedback. Ticket <strong>{c.permanent_id}</strong> will be reopened.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Dispute Reason / What is still broken?</label>
                <textarea
                  rows={3}
                  placeholder="The pothole was only partially filled and water is still accumulating..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Current Photo Evidence URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={disputePhotoUrl}
                  onChange={(e) => setDisputePhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisputeResolution}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={14} />}
                <span>Reopen Complaint</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SOLUTION MODAL FOR STEP 5 */}
      {showSolutionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-cyan-400" />
                <span>Officer Solution Evidence (Step 5)</span>
              </h3>
              <button onClick={() => setShowSolutionModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {/* Officer Action Description */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] uppercase font-bold text-cyan-400">Action Taken / Resolution Description</span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {resolutionSubmission?.action_taken ||
                  timeline.find(t => t.notes?.includes('Action:'))?.notes?.split('Action:')[1]?.trim() ||
                  timeline.find(t => t.new_status === 'RESOLUTION_SUBMITTED' && !t.notes?.includes('Status transitioned'))?.notes ||
                  'Officer completed site repair and submitted photographic proof.'}
              </p>
            </div>

            {/* Before / After Evidence Images */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-slate-400">Before &amp; After Photographic Evidence</span>
              <div className="grid grid-cols-2 gap-3">
                {(resolutionSubmission?.before_photo_url || imgs.find(i => i.image_type === 'before')?.image_url) ? (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolutionSubmission?.before_photo_url || imgs.find(i => i.image_type === 'before')!.image_url}
                      alt="Before Fix"
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <div className="px-2 py-1 text-[10px] font-bold text-amber-300 bg-slate-950 text-center uppercase">
                      Before Fix
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col items-center justify-center text-slate-600 text-xs aspect-[4/3]">
                    No Before Photo
                  </div>
                )}

                {(resolutionSubmission?.after_photo_url || imgs.find(i => i.image_type === 'after')?.image_url) ? (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolutionSubmission?.after_photo_url || imgs.find(i => i.image_type === 'after')!.image_url}
                      alt="After Fix"
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <div className="px-2 py-1 text-[10px] font-bold text-emerald-300 bg-slate-950 text-center uppercase">
                      After Fix
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col items-center justify-center text-slate-600 text-xs aspect-[4/3]">
                    No After Photo
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSolutionModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
