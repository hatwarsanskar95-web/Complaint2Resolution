'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, Star, Upload, ZoomIn, X, ArrowLeft,
  Shield, AlertTriangle, Camera, MessageSquare, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/context/ToastContext'
import { Complaint, ResolutionSubmission } from '@/lib/types'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

interface Props {
  complaint: Complaint
  submission: ResolutionSubmission | null
  originalPhotoUrl: string | null
  aiReport: string | null
}

export default function CitizenVerifyClient({ complaint: c, submission, originalPhotoUrl, aiReport }: Props) {
  const supabase = createClient()
  const [mode, setMode] = useState<'choice' | 'confirm' | 'dispute' | 'done'>('choice')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [disputePhotoUrl, setDisputePhotoUrl] = useState<string | null>(null)
  const [uploadingDispute, setUploadingDispute] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  const [doneType, setDoneType] = useState<'confirmed' | 'disputed'>('confirmed')

  // Upload dispute photo to Supabase storage
  async function handleDisputePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDispute(true)
    const toastId = toast.loading('Uploading dispute photo...')
    try {
      const ext = file.name.split('.').pop()
      const path = `${c.id}/dispute_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('complaint-images').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('complaint-images').getPublicUrl(path)
      setDisputePhotoUrl(publicUrl)
      toast.update(toastId, { type: 'success', message: 'Dispute photo uploaded.' })
    } catch (err: unknown) {
      toast.update(toastId, { type: 'error', message: err instanceof Error ? err.message : 'Upload failed' })
    } finally {
      setUploadingDispute(false)
    }
  }

  async function handleConfirm() {
    setSubmitting(true)
    const toastId = toast.loading('Submitting confirmation...')
    try {
      const res = await fetch(`/api/citizen/complaints/${c.id}/confirm-resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_rating: rating || null, feedback_comment: comment || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Confirmation failed')
      toast.update(toastId, { type: 'success', message: 'Thank you! Complaint marked as resolved.' })
      setDoneType('confirmed')
      setMode('done')
    } catch (err: unknown) {
      toast.update(toastId, { type: 'error', message: err instanceof Error ? err.message : 'Failed' })
      setSubmitting(false)
    }
  }

  async function handleDispute() {
    if (!disputePhotoUrl) { toast.error('A current photo is mandatory to file a dispute.'); return }
    if (!disputeReason.trim()) { toast.error('Please describe why the issue is still unresolved.'); return }
    setSubmitting(true)
    const toastId = toast.loading('Filing dispute...')
    try {
      const res = await fetch(`/api/citizen/complaints/${c.id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispute_photo_url: disputePhotoUrl, dispute_reason: disputeReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Dispute failed')
      toast.update(toastId, { type: 'success', message: 'Dispute filed. AI analysis has been triggered.' })
      setDoneType('disputed')
      setMode('done')
    } catch (err: unknown) {
      toast.update(toastId, { type: 'error', message: err instanceof Error ? err.message : 'Failed' })
      setSubmitting(false)
    }
  }

  // Done screen
  if (mode === 'done') {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center text-center gap-6 py-20">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${doneType === 'confirmed' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
          {doneType === 'confirmed'
            ? <CheckCircle2 size={40} className="text-emerald-400" />
            : <Shield size={40} className="text-amber-400" />
          }
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {doneType === 'confirmed' ? 'Resolution Confirmed!' : 'Dispute Filed!'}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            {doneType === 'confirmed'
              ? 'Your complaint has been marked as closed. Thank you for your feedback!'
              : 'Your dispute has been submitted. Our AI system will analyze the evidence and re-route the complaint for further action.'}
          </p>
        </div>
        <Link href="/citizen/dashboard" className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Zoom Modal */}
      {zoomImg && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setZoomImg(null)}>
          <button onClick={() => setZoomImg(null)} className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 cursor-pointer"><X size={18} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomImg} alt="Zoomed" onClick={e => e.stopPropagation()} className="max-w-full max-h-[90vh] object-contain rounded-xl border border-slate-700 shadow-2xl" />
        </div>
      )}

      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Back */}
        <FadeIn direction="up">
          <Link href={`/citizen/complaints/${c.id}`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Complaint
          </Link>
        </FadeIn>

        {/* Header */}
        <FadeIn direction="up" delay={0.04}>
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[#0a1811]">
            <div className="flex items-center gap-3 mb-1">
              <Sparkles size={20} className="text-emerald-400" />
              <div>
                <h1 className="text-lg font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Verify Resolution — {c.permanent_id}
                </h1>
                <p className="text-xs text-slate-400">Review the officer&apos;s work and confirm or dispute the resolution</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Photo Evidence Comparison */}
        <FadeIn direction="up" delay={0.07}>
          <div className="rounded-2xl border border-slate-800 bg-[#09140f] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
              <Camera size={14} className="text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Photo Evidence Comparison</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PhotoCard label="Original Report Photo" url={originalPhotoUrl} onZoom={() => originalPhotoUrl && setZoomImg(originalPhotoUrl)} accent="border-blue-500/30" />
              <PhotoCard label="Officer Before Photo" url={submission?.before_photo_url ?? null} onZoom={() => submission?.before_photo_url && setZoomImg(submission.before_photo_url)} accent="border-amber-500/30" />
              <PhotoCard label="Officer After Photo" url={submission?.after_photo_url ?? null} onZoom={() => submission?.after_photo_url && setZoomImg(submission.after_photo_url)} accent="border-emerald-500/30" />
            </div>
          </div>
        </FadeIn>

        {/* Officer Action Notes */}
        {submission?.action_taken && (
          <FadeIn direction="up" delay={0.09}>
            <div className="p-4 rounded-2xl border border-slate-800 bg-[#09140f]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Officer Action Taken</p>
              <p className="text-sm text-slate-300 leading-relaxed">{submission.action_taken}</p>
            </div>
          </FadeIn>
        )}

        {/* AI Resolution Report */}
        {aiReport && (
          <FadeIn direction="up" delay={0.1}>
            <div className="p-4 rounded-2xl border border-purple-500/25 bg-purple-950/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles size={11} /> AI Resolution Report
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">{aiReport}</p>
              <p className="text-[10px] text-slate-600 mt-2 italic">Evidence appears consistent with resolution — AI assessment, not a guarantee.</p>
            </div>
          </FadeIn>
        )}

        {/* Decision */}
        {mode === 'choice' && (
          <FadeIn direction="up" delay={0.12}>
            <div className="p-5 rounded-2xl border border-slate-700 bg-[#09140f] flex flex-col gap-4">
              <p className="text-sm font-bold text-white text-center">Has the issue been resolved to your satisfaction?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('confirm')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-[0_0_16px_rgba(16,185,129,0.35)] cursor-pointer"
                >
                  <CheckCircle2 size={24} />
                  YES — Issue Resolved
                </button>
                <button
                  onClick={() => setMode('dispute')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm transition-all shadow-[0_0_16px_rgba(225,29,72,0.3)] cursor-pointer"
                >
                  <XCircle size={24} />
                  NO — Issue Still Exists
                </button>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Confirm Flow */}
        {mode === 'confirm' && (
          <StaggerContainer staggerChildren={0.06} className="flex flex-col gap-4">
            <StaggerItem>
              <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Confirm Resolution</h3>
                </div>
                {/* Star Rating */}
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-2">Rate the resolution (optional)</p>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} onClick={() => setRating(s)} className={`cursor-pointer transition-all ${s <= rating ? 'text-amber-400 scale-110' : 'text-slate-600 hover:text-amber-300'}`}>
                        <Star size={24} fill={s <= rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Comment */}
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-1.5">Additional feedback (optional)</p>
                  <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience with the resolution..." className="w-full p-3 text-xs rounded-xl bg-[#060c09] border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setMode('choice')} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors flex-1">Back</button>
                  <button onClick={handleConfirm} disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5">
                    {submitting ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 size={14} />}
                    {submitting ? 'Submitting...' : 'Confirm Resolution'}
                  </button>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Dispute Flow */}
        {mode === 'dispute' && (
          <StaggerContainer staggerChildren={0.06} className="flex flex-col gap-4">
            <StaggerItem>
              <div className="p-5 rounded-2xl border border-rose-500/40 bg-rose-950/10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <XCircle size={18} className="text-rose-400" />
                  <h3 className="text-sm font-bold text-white">File a Dispute</h3>
                </div>
                {/* Mandatory Photo Upload */}
                <div>
                  <p className="text-xs font-bold text-slate-200 mb-1">
                    Current Photo <span className="text-rose-400">*Required</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mb-2">Photograph showing the issue still exists right now</p>
                  {disputePhotoUrl ? (
                    <div className="relative group w-36 h-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={disputePhotoUrl} alt="dispute" className="w-full h-full object-cover rounded-xl border border-rose-500/40 cursor-zoom-in" onClick={() => setZoomImg(disputePhotoUrl)} />
                      <button onClick={() => setDisputePhotoUrl(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-rose-500">
                        <X size={10} />
                      </button>
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold text-emerald-300 bg-black/60 px-1 rounded">✓ Uploaded</span>
                    </div>
                  ) : (
                    <label className={`h-20 w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-rose-500/40 cursor-pointer hover:opacity-80 transition-opacity ${uploadingDispute ? 'opacity-60' : ''}`}>
                      {uploadingDispute ? <span className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={18} className="text-rose-400" />}
                      <span className="text-xs text-slate-400 font-semibold">{uploadingDispute ? 'Uploading...' : 'Upload current photo'}</span>
                      <input type="file" accept="image/*" onChange={handleDisputePhoto} disabled={uploadingDispute} className="hidden" />
                    </label>
                  )}
                </div>
                {/* Dispute Reason */}
                <div>
                  <p className="text-xs font-bold text-slate-200 mb-1.5">
                    Dispute Reason <span className="text-rose-400">*Required</span>
                  </p>
                  <textarea rows={4} value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Describe specifically why the issue is still unresolved. What was not fixed? What is the current condition?" className="w-full p-3 text-xs rounded-xl bg-[#060c09] border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/60 resize-none" />
                </div>
                {!disputePhotoUrl && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/20 border border-amber-500/25 text-xs text-amber-300">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-400" />
                    A current photo is <strong>mandatory</strong> to file a dispute. Submission is blocked until uploaded.
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setMode('choice')} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors flex-1">Back</button>
                  <button onClick={handleDispute} disabled={submitting || !disputePhotoUrl || !disputeReason.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5">
                    {submitting ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MessageSquare size={14} />}
                    {submitting ? 'Filing...' : 'Submit Dispute'}
                  </button>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        )}
      </div>
    </>
  )
}

function PhotoCard({ label, url, onZoom, accent }: { label: string; url: string | null; onZoom: () => void; accent: string }) {
  return (
    <div className={`rounded-xl border ${accent} overflow-hidden flex flex-col`}>
      <div className="px-3 py-2 border-b border-slate-800/60">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
      {url ? (
        <div className="relative group cursor-zoom-in" onClick={onZoom}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="w-full h-32 object-cover group-hover:brightness-110 transition-all" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={20} className="text-white drop-shadow" />
          </div>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-slate-600">
          <Camera size={22} />
        </div>
      )}
    </div>
  )
}
