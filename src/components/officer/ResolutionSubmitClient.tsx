'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Upload, Send, CheckCircle2, Camera, ClipboardList,
  AlertTriangle, X, ZoomIn, ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/context/ToastContext'
import { Complaint } from '@/lib/types'
import { FadeIn } from '@/components/ui/motion'

interface Props {
  complaint: Complaint
  officerId: string
}

type PhotoSlot = { url: string; file: string } | null

export default function ResolutionSubmitClient({ complaint: c, officerId }: Props) {
  const supabase = createClient()
  const [notes, setNotes] = useState('')
  const [beforePhoto, setBeforePhoto] = useState<PhotoSlot>(null)
  const [afterPhoto, setAfterPhoto] = useState<PhotoSlot>(null)
  const [uploadingBefore, setUploadingBefore] = useState(false)
  const [uploadingAfter, setUploadingAfter] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const allFilled = notes.trim().length > 0 && beforePhoto !== null && afterPhoto !== null

  async function uploadPhoto(
    file: File,
    slot: 'before' | 'after'
  ): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${c.id}/${slot}_${Date.now()}.${ext}`
    const setUploading = slot === 'before' ? setUploadingBefore : setUploadingAfter
    setUploading(true)
    try {
      const { error } = await supabase.storage
        .from('resolution-evidence')
        .upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from('resolution-evidence')
        .getPublicUrl(path)
      return publicUrl
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }

  async function handlePhotoChange(
    e: React.ChangeEvent<HTMLInputElement>,
    slot: 'before' | 'after'
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const toastId = toast.loading(`Uploading ${slot} photo...`)
    const url = await uploadPhoto(file, slot)
    if (url) {
      const setter = slot === 'before' ? setBeforePhoto : setAfterPhoto
      setter({ url, file: file.name })
      toast.update(toastId, { type: 'success', message: `${slot} photo uploaded.` })
    } else {
      toast.update(toastId, { type: 'error', message: `${slot} photo upload failed.` })
    }
  }

  async function handleSubmit() {
    if (!allFilled) return
    setSubmitting(true)
    const toastId = toast.loading('Submitting resolution evidence...')
    try {
      const res = await fetch(`/api/officer/complaints/${c.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_taken: notes,
          before_photo_url: beforePhoto!.url,
          after_photo_url: afterPhoto!.url,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      toast.update(toastId, { type: 'success', message: 'Resolution submitted for AI verification!' })
      setDone(true)
    } catch (err: unknown) {
      toast.update(toastId, { type: 'error', message: err instanceof Error ? err.message : 'Submission failed' })
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center text-center gap-6 py-20">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <ShieldCheck size={40} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Resolution Submitted!
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your evidence has been submitted for AI verification. The citizen will be notified once the review is complete.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/officer/complaints/${c.id}`}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
          >
            View Complaint
          </Link>
          <Link
            href="/officer/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Photo Zoom Modal */}
      {zoomImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomImg(null)}
        >
          <button
            onClick={() => setZoomImg(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 cursor-pointer"
          >
            <X size={18} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImg}
            alt="Zoomed"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-xl border border-slate-700 shadow-2xl"
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Back nav */}
        <FadeIn direction="up">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/officer/complaints/${c.id}`}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back to Complaint
            </Link>
            <code className="font-mono text-sm font-bold text-emerald-400">{c.permanent_id}</code>
          </div>
        </FadeIn>

        {/* Page Header */}
        <FadeIn direction="up" delay={0.05}>
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[#0a1811]">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Submit Resolution Evidence
                </h1>
                <p className="text-xs text-slate-400">All 3 fields are mandatory before submission</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Progress indicator */}
        <FadeIn direction="up" delay={0.08}>
          <div className="grid grid-cols-3 gap-3">
            <StepIndicator
              num={1}
              label="Action Notes"
              done={notes.trim().length > 0}
              icon={<ClipboardList size={16} />}
            />
            <StepIndicator
              num={2}
              label="Before Photo"
              done={beforePhoto !== null}
              icon={<Camera size={16} />}
            />
            <StepIndicator
              num={3}
              label="After Photo"
              done={afterPhoto !== null}
              icon={<Camera size={16} />}
            />
          </div>
        </FadeIn>

        {/* Field 1: Action Notes */}
        <FadeIn direction="up" delay={0.1}>
          <div className="p-5 rounded-2xl bg-[#09140f] border border-[#16291e]">
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
              <ClipboardList size={16} className="text-emerald-400" />
              Field 1 — Action Taken Notes
              <span className="text-rose-400 text-xs">*Required</span>
            </label>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe in detail the field work performed: what was inspected, what was fixed/replaced, equipment used, measurements taken, and any follow-up actions required..."
              className="w-full p-3.5 text-sm rounded-xl bg-[#060c09] border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all resize-none leading-relaxed"
            />
            <p className="text-[10px] text-slate-500 mt-1.5">
              {notes.length} characters {notes.length < 30 && notes.length > 0 ? '— please provide more detail' : ''}
            </p>
          </div>
        </FadeIn>

        {/* Photo Fields — Side by Side */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Field 2: Before Photo */}
          <FadeIn direction="up" delay={0.12}>
            <PhotoUploadField
              slot="before"
              label="Field 2 — Before Photo"
              description="Site condition during / before fix"
              photo={beforePhoto}
              uploading={uploadingBefore}
              onFile={(e) => handlePhotoChange(e, 'before')}
              onClear={() => setBeforePhoto(null)}
              onZoom={() => beforePhoto && setZoomImg(beforePhoto.url)}
            />
          </FadeIn>

          {/* Field 3: After Photo */}
          <FadeIn direction="up" delay={0.14}>
            <PhotoUploadField
              slot="after"
              label="Field 3 — After Photo"
              description="Completed fix / site after resolution"
              photo={afterPhoto}
              uploading={uploadingAfter}
              onFile={(e) => handlePhotoChange(e, 'after')}
              onClear={() => setAfterPhoto(null)}
              onZoom={() => afterPhoto && setZoomImg(afterPhoto.url)}
            />
          </FadeIn>
        </div>

        {/* Validation warning */}
        {!allFilled && (
          <FadeIn direction="up" delay={0.15}>
            <div className="flex items-start gap-2 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/25 text-xs text-amber-300">
              <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
              <span>
                All 3 evidence fields are <strong>mandatory</strong>. Submission is blocked until action notes, before photo, and after photo are all provided.
              </span>
            </div>
          </FadeIn>
        )}

        {/* Submit */}
        <FadeIn direction="up" delay={0.18}>
          <button
            onClick={handleSubmit}
            disabled={!allFilled || submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-[0_0_24px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2.5 cursor-pointer transition-all"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Resolution Evidence
              </>
            )}
          </button>
        </FadeIn>
      </div>
    </>
  )
}

// ── Sub-components ──

function StepIndicator({ num, label, done, icon }: { num: number; label: string; done: boolean; icon: React.ReactNode }) {
  return (
    <div className={`p-3 rounded-xl border text-center transition-all ${
      done
        ? 'bg-emerald-900/25 border-emerald-500/40 text-emerald-400'
        : 'bg-slate-900/50 border-slate-800 text-slate-500'
    }`}>
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {done ? <CheckCircle2 size={15} className="text-emerald-400" /> : <span className="text-[11px] font-bold text-slate-500">Step {num}</span>}
      </div>
      <div className="flex items-center justify-center gap-1 text-xs font-semibold">
        {icon}
        <span>{label}</span>
      </div>
    </div>
  )
}

function PhotoUploadField({
  slot, label, description, photo, uploading, onFile, onClear, onZoom
}: {
  slot: string
  label: string
  description: string
  photo: PhotoSlot
  uploading: boolean
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  onZoom: () => void
}) {
  const color = slot === 'before' ? {
    bg: 'bg-blue-950/10', border: 'border-blue-500/25', text: 'text-blue-400', badge: 'bg-blue-500/20 border-blue-500/30 text-blue-300'
  } : {
    bg: 'bg-emerald-950/10', border: 'border-emerald-500/25', text: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
  }

  return (
    <div className={`p-4 rounded-2xl border ${color.bg} ${color.border} flex flex-col gap-3`}>
      <div>
        <p className={`text-xs font-bold ${color.text} mb-0.5`}>{label} <span className="text-rose-400">*</span></p>
        <p className="text-[10px] text-slate-500">{description}</p>
      </div>

      {photo ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={`${slot} photo`}
            className="w-full h-36 object-cover rounded-xl border border-slate-700 group-hover:brightness-110 transition-all cursor-zoom-in"
            onClick={onZoom}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
            <button
              onClick={onZoom}
              className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 cursor-pointer"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={onClear}
              className="p-2 bg-rose-600/80 rounded-full text-white hover:bg-rose-500 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold border ${color.badge}`}>
            ✓ Uploaded
          </span>
        </div>
      ) : (
        <label className={`h-36 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed ${color.border} cursor-pointer hover:opacity-80 transition-opacity ${uploading ? 'opacity-60' : ''}`}>
          {uploading ? (
            <span className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin text-slate-400" />
          ) : (
            <Upload size={22} className={color.text} />
          )}
          <span className="text-xs font-semibold text-slate-400">{uploading ? 'Uploading...' : 'Click to upload photo'}</span>
          <span className="text-[10px] text-slate-600">JPG, PNG, WEBP supported</span>
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
