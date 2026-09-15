'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  Send,
  Upload,
  Sparkles,
  Info,
  Check,
  Image as ImageIcon,
} from 'lucide-react'
import {
  Complaint,
  ComplaintImage,
  ComplaintStatusHistory,
  ComplaintAiAnalysis,
  STATUS_LABELS,
  PRIORITY_LABELS,
  getSlaStatus,
  ComplaintStatus,
} from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/context/ToastContext'
import { FadeIn } from '@/components/ui/motion'

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

  const originalPhoto = initialImages.find((i) => i.image_type === 'original')
  const { percent, label, hoursLeft } = getSlaStatus(c.sla_deadline, c.sla_start_time)

  // Handle Resolution Evidence Photo Upload
  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast.loading('Uploading resolution evidence photo...')

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${c.id}/resolution_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('resolution-evidence')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('resolution-evidence')
        .getPublicUrl(filePath)

      const { data: newImg, error: imgDbError } = await supabase
        .from('complaint_images')
        .insert({
          complaint_id: c.id,
          image_url: publicUrlData.publicUrl,
          image_type: 'after',
        })
        .select()
        .single()

      if (imgDbError) throw imgDbError

      if (newImg) {
        setEvidenceImages((prev) => [...prev, newImg as ComplaintImage])
      }

      toast.update(toastId, {
        type: 'success',
        message: 'Resolution evidence uploaded successfully.',
      })
    } catch (err: unknown) {
      toast.update(toastId, {
        type: 'error',
        message: err instanceof Error ? err.message : 'Evidence upload failed',
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle Submit Resolution
  const handleSubmitResolution = async () => {
    if (!notes.trim()) {
      toast.error('Please enter work/action notes before submitting resolution.')
      return
    }

    setSubmitting(true)
    const toastId = toast.loading('Submitting resolution for AI verification...')

    try {
      // 1. Insert resolution submission
      const { error: resError } = await supabase
        .from('resolution_submissions')
        .insert({
          complaint_id: c.id,
          officer_id: officerId,
          action_taken_notes: notes,
          resolution_date: new Date().toISOString(),
        })

      if (resError) throw resError

      // 2. Update complaint status to RESOLUTION_SUBMITTED
      const { error: updateError } = await supabase
        .from('complaints')
        .update({ status: 'RESOLUTION_SUBMITTED' })
        .eq('id', c.id)

      if (updateError) throw updateError

      // 3. Log status transition
      await supabase.from('complaint_status_history').insert({
        complaint_id: c.id,
        old_status: c.status,
        new_status: 'RESOLUTION_SUBMITTED',
        updated_by: officerId,
        notes: notes,
      })

      // 4. Trigger server-side AI verification endpoint asynchronously
      fetch('/api/complaints/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId: c.id, stage: 'resolution_verification' }),
      }).catch(() => {})

      toast.update(toastId, {
        type: 'success',
        message: 'Resolution submitted! Complaint is now undergoing AI verification.',
      })

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: unknown) {
      toast.update(toastId, {
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit resolution',
      })
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Back button */}
      <FadeIn direction="left" distance={10}>
        <Link
          href="/officer/complaints"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Complaints
        </Link>
      </FadeIn>

      {/* Section A: Header */}
      <FadeIn direction="up">
        <div className="p-6 rounded-2xl bg-[#09140f] border border-[#16291e] flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <code className="text-xl font-mono font-extrabold text-emerald-400">{c.permanent_id}</code>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {STATUS_LABELS[c.status as ComplaintStatus] ?? c.status}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {PRIORITY_LABELS[c.priority] ?? c.priority}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400">Category & Department</p>
              <p className="text-sm font-semibold text-white mt-0.5">{c.category} ({c.departments?.name || 'Assigned Dept'})</p>
            </div>
            <div>
              <p className="text-slate-400">Location Address</p>
              <p className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1">
                <MapPin size={14} className="text-emerald-400" /> {c.address}
              </p>
            </div>
          </div>

          {/* SLA Countdown bar */}
          {c.sla_deadline && (
            <div className="p-3 rounded-xl bg-[#060c09] border border-slate-800 flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Clock size={14} className="text-emerald-400" /> SLA Target Deadline
                </span>
                <span className="font-mono font-bold text-emerald-400">{label === 'breached' ? 'BREACHED' : `${hoursLeft}h remaining`}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percent}%` }} />
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Section B: Original Complaint Details */}
      <FadeIn direction="up" delay={0.1}>
        <div className="p-6 rounded-2xl bg-[#09140f] border border-[#16291e] flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Original Citizen Complaint</h3>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#060c09] p-4 rounded-xl border border-slate-800">
            {c.description}
          </p>

          {/* Citizen Photo Evidence */}
          {originalPhoto && (
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium">Citizen Photographic Evidence:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalPhoto.image_url}
                alt="Citizen Evidence"
                className="w-full max-h-80 object-cover rounded-xl border border-slate-800"
              />
            </div>
          )}

          {/* AI Recommended Action */}
          {ai && (
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3 text-xs">
              <Sparkles size={18} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-purple-300">AI Triage Insights</p>
                <p className="text-slate-300 mt-0.5">
                  {ai.recommended_actions ? ai.recommended_actions.join(', ') : ai.summary}
                </p>
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Section C: Status Timeline */}
      <FadeIn direction="up" delay={0.15}>
        <div className="p-6 rounded-2xl bg-[#09140f] border border-[#16291e] flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Status Timeline</h3>
          <div className="space-y-4 pl-4 border-l-2 border-slate-800">
            {timeline.map((item, idx) => (
              <div key={item.id || idx} className="relative pl-4">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold text-white">
                  {STATUS_LABELS[item.new_status as ComplaintStatus] || item.new_status}
                </p>
                {item.notes && <p className="text-[11px] text-slate-300 mt-0.5">{item.notes}</p>}
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {new Date(item.created_at).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Section D: Officer Work Area */}
      {c.status === 'IN_PROGRESS' || c.status === 'REOPENED' ? (
        <FadeIn direction="up" delay={0.2}>
          <div className="p-6 rounded-2xl bg-[#0a1811] border border-emerald-500/40 shadow-xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" /> Officer Operational Work Area
            </h3>

            {/* 1. Action Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Action / Field Work Notes:</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe field inspection performed, parts replaced, or action taken..."
                className="w-full p-3 text-xs rounded-xl bg-[#060c09] border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* 2. Evidence Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300">Resolution Evidence Photos:</label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors">
                  <Upload size={14} />
                  <span>{uploading ? 'Uploading...' : 'Upload Evidence Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadEvidence}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-400">Upload before/after work completion photos</span>
              </div>

              {/* Evidence thumbnails */}
              {evidenceImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {evidenceImages.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.image_url}
                      alt="Resolution evidence"
                      className="h-20 w-full object-cover rounded-xl border border-slate-800"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 3. Submit Resolution */}
            <button
              onClick={handleSubmitResolution}
              disabled={submitting}
              className="mt-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Send size={15} />
              <span>{submitting ? 'Submitting Resolution...' : 'Submit Completed Resolution'}</span>
            </button>
          </div>
        </FadeIn>
      ) : (
        <div className="p-4 rounded-xl bg-[#09140f] border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <Info size={16} className="text-emerald-400 shrink-0" />
          <span>This complaint is currently in <strong>{STATUS_LABELS[c.status as ComplaintStatus] || c.status}</strong> state. Work controls are disabled.</span>
        </div>
      )}
    </div>
  )
}
