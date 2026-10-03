'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Calendar, Clock, CheckCircle2, Send, Upload,
  FileText, ZoomIn, X, Info, ShieldCheck, Layers,
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
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [evidenceImages, setEvidenceImages] = useState<ComplaintImage[]>(
    initialImages.filter((i) => i.image_type === 'after' || i.image_type === 'before')
  )
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null)

  const originalPhoto = initialImages.find((i) => i.image_type === 'original')
  const { percent, label, formattedTimeLeft } = getSlaStatus(c.sla_deadline, c.sla_start_time)
  const isWorkable = c.status === 'IN_PROGRESS' || c.status === 'REOPENED'

  const slaBarColor =
    label === 'breached' ? 'bg-rose-500' :
    label === 'critical' ? 'bg-rose-400' :
    label === 'warning' ? 'bg-amber-400' :
    label === 'reminder' ? 'bg-yellow-400' : 'bg-emerald-400'

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

  const handleSubmitResolution = async () => {
    if (!notes.trim()) {
      toast.error('Please enter work/action notes before submitting.')
      return
    }
    setSubmitting(true)
    const toastId = toast.loading('Submitting resolution for AI verification...')
    try {
      const { error: resErr } = await supabase.from('resolution_submissions').insert({
        complaint_id: c.id, officer_id: officerId,
        action_taken_notes: notes, resolution_date: new Date().toISOString(),
      })
      if (resErr) throw resErr
      const { error: updErr } = await supabase
        .from('complaints').update({ status: 'RESOLUTION_SUBMITTED' }).eq('id', c.id)
      if (updErr) throw updErr
      await supabase.from('complaint_status_history').insert({
        complaint_id: c.id, old_status: c.status, new_status: 'RESOLUTION_SUBMITTED',
        updated_by: officerId, notes,
      })
      fetch('/api/complaints/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId: c.id, stage: 'resolution_verification' }),
      }).catch(() => {})
      toast.update(toastId, { type: 'success', message: 'Resolution submitted! Undergoing AI verification.' })
      setTimeout(() => window.location.reload(), 1000)
    } catch (err: unknown) {
      toast.update(toastId, { type: 'error', message: err instanceof Error ? err.message : 'Submission failed' })
      setSubmitting(false)
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

        {/* ── 3-COLUMN WORKSPACE ── */}
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
                  {originalPhoto ? (
                    <div className="relative group cursor-zoom-in" onClick={() => setZoomPhoto(originalPhoto.image_url)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={originalPhoto.image_url} alt="Citizen evidence"
                        className="w-full max-h-72 object-cover rounded-xl border border-slate-800 group-hover:brightness-110 transition-all"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/60 rounded-full p-2.5">
                          <ZoomIn size={20} className="text-white" />
                        </div>
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
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Resolution Submission</h3>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    {/* Action Notes */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Field Work Notes <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Describe inspection performed, equipment replaced, or corrective action taken..."
                        className="w-full p-3 text-xs rounded-xl bg-[#060c09] border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 resize-none"
                      />
                    </div>

                    {/* Evidence Upload */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-300">
                        Before / After Evidence Photos <span className="text-slate-500">(Recommended)</span>
                      </label>
                      <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors border border-slate-700 w-fit">
                        <Upload size={13} />
                        {uploading ? 'Uploading...' : 'Upload Evidence Photo'}
                        <input type="file" accept="image/*" onChange={handleUploadEvidence} disabled={uploading} className="hidden" />
                      </label>
                      {evidenceImages.length > 0 && (
                        <p className="text-[10px] text-emerald-400">{evidenceImages.length} photo(s) uploaded</p>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSubmitResolution}
                      disabled={submitting || !notes.trim()}
                      className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Send size={14} />
                      {submitting ? 'Submitting...' : 'Submit Completed Resolution'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-[#09140f] p-5 flex items-start gap-3 text-xs text-slate-400">
                  <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-300 mb-0.5">Work Controls Locked</p>
                    <p>
                      This complaint is in <strong className="text-white">{STATUS_LABELS[c.status as ComplaintStatus] || c.status}</strong> state.
                      Resolution submission is only available when status is In Progress or Reopened.
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
