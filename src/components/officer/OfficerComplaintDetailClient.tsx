'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Clock, CheckCircle2, Upload,
  FileText, ZoomIn, X, Info, ShieldCheck, Layers,
  Play, UserCheck, ArrowRight as ArrowRightIcon, AlertTriangle,
} from 'lucide-react'
import {
  Complaint, ComplaintImage, ComplaintStatusHistory, ComplaintAiAnalysis,
  STATUS_LABELS, getSlaStatus, ComplaintStatus,
} from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/context/ToastContext'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import AiActionBrief from '@/components/officer/AiActionBrief'

interface Props {
  complaint: Complaint
  images: ComplaintImage[]
  timeline: ComplaintStatusHistory[]
  ai: ComplaintAiAnalysis | null
  officerId: string
}

export default function OfficerComplaintDetailClient({
  complaint: c,
  images: initialImages,
  timeline,
  ai,
  officerId,
}: Props) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<ComplaintStatus>(c.status)
  const [evidenceImages, setEvidenceImages] = useState<ComplaintImage[]>(
    initialImages.filter((i) => i.image_type === 'after' || i.image_type === 'before')
  )
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null)

  const originalPhotos = initialImages.filter((i) => i.image_type === 'original')
  const originalPhoto = originalPhotos[0] ?? null
  const { percent, label, formattedTimeLeft } = getSlaStatus(c.sla_deadline, c.sla_start_time, c.status)
  const isWorkable = currentStatus === 'IN_PROGRESS' || currentStatus === 'REOPENED'
  const isBreached = label === 'breached'

  const slaBarColor =
    label === 'breached' ? 'bg-rose-500' :
    label === 'critical' ? 'bg-rose-400' :
    label === 'warning' ? 'bg-amber-400' :
    label === 'reminder' ? 'bg-yellow-400' : 'bg-emerald-400'

  // Phase 17 — Status Transition via API
  const transitionStatus = async (newStatus: ComplaintStatus, notes?: string) => {
    setTransitioning(true)
    const toastId = toast.loading(`Transitioning to ${STATUS_LABELS[newStatus] ?? newStatus}...`)
    try {
      const res = await fetch(`/api/officer/complaints/${c.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_status: newStatus, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Transition failed')
      setCurrentStatus(newStatus)
      toast.update(toastId, { type: 'success', message: `Status → ${STATUS_LABELS[newStatus] ?? newStatus}` })
      setTimeout(() => window.location.reload(), 800)
    } catch (err: unknown) {
      toast.update(toastId, { type: 'error', message: err instanceof Error ? err.message : 'Transition failed' })
      setTransitioning(false)
    }
  }

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const toastId = toast.loading('Uploading evidence photo...')
    try {
      const ext = file.name.split('.').pop()
      const path = `${c.id}/resolution_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('resolution-evidence').upload(path, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('resolution-evidence').getPublicUrl(path)
      const { data: newImg, error: imgErr } = await supabase
        .from('complaint_images')
        .insert({ complaint_id: c.id, image_url: publicUrl, image_type: 'after' })
        .select().single()
      if (imgErr) throw imgErr
      if (newImg) setEvidenceImages((prev) => [...prev, newImg as ComplaintImage])
      toast.update(toastId, { type: 'success', message: 'Evidence photo uploaded.' })
    } catch (err: unknown) {
      toast.update(toastId, { type: 'error', message: err instanceof Error ? err.message : 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }


  return (
    <>
      {/* ── Photo Zoom Modal ── */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomPhoto(null)}
        >
          <button
            onClick={() => setZoomPhoto(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 cursor-pointer"
          >
            <X size={18} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomPhoto} alt="Zoomed" onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-xl border border-slate-700 shadow-2xl"
          />
        </div>
      )}

      <div className="flex flex-col gap-5 max-w-[1400px] mx-auto">
        {/* Back + Page Header */}
        <FadeIn direction="up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/officer/complaints"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={15} /> Back
              </Link>
              <span className="text-slate-700">·</span>
              <code className="text-base sm:text-lg font-mono font-extrabold text-emerald-400">
                {c.permanent_id}
              </code>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                c.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                c.status === 'RESOLUTION_SUBMITTED' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                'bg-slate-700/40 text-slate-300 border-slate-700'
              }`}>
                {STATUS_LABELS[c.status as ComplaintStatus] ?? c.status}
              </span>
            </div>
            {/* PDF Download Button */}
            <a
              href={`/api/complaints/${c.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <FileText size={14} className="text-emerald-400" />
              Download Official PDF
            </a>
          </div>
        </FadeIn>

        {/* ── STATUS ACTION BAR (Phase 17) ── */}
        <FadeIn direction="up" delay={0.03}>
          <StatusActionBar
            status={currentStatus}
            isBreached={isBreached}
            transitioning={transitioning}
            complaintId={c.id}
            onTransition={transitionStatus}
          />
        </FadeIn>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-5">

            {/* Original Photo + Location */}
            <FadeIn direction="up" delay={0.05}>
              <div className="rounded-2xl border border-[#16291e] bg-[#09140f] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800/60">
                  <Layers size={14} className="text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Citizen Evidence</h3>
                </div>
              <div className="p-5 flex flex-col gap-4">
                  {originalPhotos.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        Citizen Evidence ({originalPhotos.length} photo{originalPhotos.length > 1 ? 's' : ''})
                      </p>
                      <div className={`grid gap-2 ${originalPhotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                        {originalPhotos.map((photo, idx) => (
                          <div
                            key={photo.id}
                            className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-800"
                            onClick={() => setZoomPhoto(photo.image_url)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.image_url}
                              alt={`Citizen evidence ${idx + 1}`}
                              className="w-full aspect-[4/3] object-cover group-hover:brightness-110 transition-all"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black/60 rounded-full p-2">
                                <ZoomIn size={16} className="text-white" />
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white text-center py-0.5">
                              Photo {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                      No photo evidence submitted
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                      <p className="text-slate-500 mb-1">Address</p>
                      <p className="text-slate-200 font-semibold flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-400 shrink-0" />{c.address}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                      <p className="text-slate-500 mb-1">GPS Coordinates</p>
                      <p className="text-slate-200 font-mono font-semibold">
                        {c.latitude?.toFixed(5)}, {c.longitude?.toFixed(5)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Citizen Description */}
            <FadeIn direction="up" delay={0.1}>
              <div className="rounded-2xl border border-[#16291e] bg-[#09140f] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800/60">
                  <Info size={14} className="text-slate-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Citizen Description</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    {c.description}
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* Timeline */}
            <FadeIn direction="up" delay={0.15}>
              <div className="rounded-2xl border border-[#16291e] bg-[#09140f] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800/60">
                  <Clock size={14} className="text-slate-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Status Timeline</h3>
                  <span className="ml-auto text-[10px] font-mono text-slate-500">{timeline.length} events</span>
                </div>
                <div className="p-5">
                  {timeline.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No status history yet</p>
                  ) : (
                    <StaggerContainer staggerChildren={0.04} className="space-y-4 pl-4 border-l-2 border-emerald-900/60">
                      {timeline.map((item, idx) => (
                        <StaggerItem key={item.id || idx}>
                          <div className="relative pl-4">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#09140f]" />
                            <p className="text-xs font-bold text-white">
                              {STATUS_LABELS[item.new_status as ComplaintStatus] || item.new_status}
                            </p>
                            {item.notes && <p className="text-[11px] text-slate-300 mt-0.5">{item.notes}</p>}
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {new Date(item.created_at).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  )}
                </div>
              </div>
            </FadeIn>

            {/* Evidence Locker */}
            {evidenceImages.length > 0 && (
              <FadeIn direction="up" delay={0.2}>
                <div className="rounded-2xl border border-[#16291e] bg-[#09140f] overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800/60">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Resolution Evidence Locker</h3>
                  </div>
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {evidenceImages.map((img) => (
                      <div key={img.id} className="relative group cursor-zoom-in" onClick={() => setZoomPhoto(img.image_url)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.image_url} alt="Evidence" className="h-24 w-full object-cover rounded-xl border border-slate-800 group-hover:brightness-110 transition-all" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn size={16} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-5">
            {/* AI Action Brief */}
            <FadeIn direction="up" delay={0.05}>
              <AiActionBrief complaint={c} ai={ai} />
            </FadeIn>

            {/* SLA Bar (standalone) */}
            <FadeIn direction="up" delay={0.1}>
              <div className="rounded-2xl border border-slate-800 bg-[#09140f] p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <Clock size={13} className="text-slate-400" /> SLA Progress
                  </span>
                  <span className={`font-mono font-bold text-xs ${
                    label === 'breached' ? 'text-rose-400 animate-pulse' :
                    label === 'critical' ? 'text-rose-300' :
                    label === 'warning' ? 'text-amber-300' : 'text-emerald-400'
                  }`}>{formattedTimeLeft}</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${slaBarColor}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                  <span>Start</span>
                  <span>{percent}% elapsed</span>
                  <span>Deadline</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <p className="text-slate-500 text-[10px]">Filed</p>
                    <p className="font-semibold text-slate-300 mt-0.5">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <p className="text-slate-500 text-[10px]">Deadline</p>
                    <p className="font-semibold text-slate-300 mt-0.5">
                      {c.sla_deadline
                        ? new Date(c.sla_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Officer Resolution Work Area */}
            <FadeIn direction="up" delay={0.15}>
              {isWorkable ? (
                <div className="rounded-2xl border border-emerald-500/40 bg-[#0a1811] overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-emerald-900/40 bg-emerald-950/20">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Submit Resolution</h3>
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Submit your resolution with <strong className="text-white">action notes</strong>,
                      a <strong className="text-white">before photo</strong>, and an
                      <strong className="text-white"> after photo</strong>. All 3 fields are mandatory.
                    </p>
                    <Link
                      href={`/officer/complaints/${c.id}/resolve`}
                      className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle2 size={14} />
                      Open Resolution Form
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-[#09140f] p-5 flex items-start gap-3 text-xs text-slate-400">
                  <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-300 mb-0.5">Work Controls Locked</p>
                    <p>
                      This complaint is in <strong className="text-white">{STATUS_LABELS[currentStatus as ComplaintStatus] || currentStatus}</strong> state.
                      Use the Status Action Bar above to progress it to In Progress first.
                    </p>
                  </div>
                </div>
              )}
            </FadeIn>

            {/* Complaint Meta */}
            <FadeIn direction="up" delay={0.2}>
              <div className="rounded-2xl border border-slate-800 bg-[#09140f] p-5 flex flex-col gap-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Complaint Metadata</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <MetaItem label="Category" value={c.category} />
                  <MetaItem label="Subcategory" value={c.subcategory} />
                  <MetaItem label="Department" value={c.departments?.name ?? 'Unassigned'} />
                  <MetaItem label="Submitted" value={new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
      <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
      <p className="font-semibold text-slate-300 text-xs truncate">{value}</p>
    </div>
  )
}

// ── Phase 17: Status Action Bar ──
function StatusActionBar({
  status, isBreached, transitioning, complaintId, onTransition
}: {
  status: ComplaintStatus
  isBreached: boolean
  transitioning: boolean
  complaintId: string
  onTransition: (s: ComplaintStatus, notes?: string) => void
}) {
  const RECEIVED_OR_SUBMITTED = ['RECEIVED', 'SUBMITTED'].includes(status)
  const isAssigned = status === 'ASSIGNED'
  const isInProgress = status === 'IN_PROGRESS' || status === 'REOPENED'

  if (!RECEIVED_OR_SUBMITTED && !isAssigned && !isInProgress) return null

  return (
    <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
      isBreached ? 'border-rose-500/50 bg-rose-950/15' : 'border-emerald-500/25 bg-emerald-950/10'
    }`}>
      <div className="flex-1">
        <p className="text-xs font-bold text-white mb-0.5">Status Action Bar</p>
        <p className="text-[11px] text-slate-400">
          Current: <span className="font-semibold text-slate-200">{STATUS_LABELS[status] ?? status}</span>
          {isBreached && <span className="ml-2 text-rose-400 font-bold animate-pulse">⚠ SLA BREACHED</span>}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {RECEIVED_OR_SUBMITTED && (
          <button
            onClick={() => onTransition('ASSIGNED', 'Officer accepted and claimed this complaint')}
            disabled={transitioning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(37,99,235,0.35)]"
          >
            <UserCheck size={14} /> Accept
          </button>
        )}
        {isAssigned && (
          <button
            onClick={() => onTransition('IN_PROGRESS', 'Officer started field work')}
            disabled={transitioning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)]"
          >
            <Play size={14} /> Start Work
          </button>
        )}
        {isInProgress && (
          <Link
            href={`/officer/complaints/${complaintId}/resolve`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(147,51,234,0.35)]"
          >
            <ArrowRightIcon size={14} /> Submit Resolution Evidence
          </Link>
        )}
        {transitioning && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        )}
      </div>
    </div>
  )
}
