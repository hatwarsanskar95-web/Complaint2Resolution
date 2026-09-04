'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Camera, MapPin, FileText, Upload, X, Loader2, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react'

interface LocationData {
  lat: number
  lng: number
  address: string
}

export default function ReportComplaintPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step management
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Form data
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [description, setDescription] = useState('')

  // UI states
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Image drag
  const [dragging, setDragging] = useState(false)

  function handleImageSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageSelect(file)
  }

  async function getLocation() {
    setLocating(true)
    setLocError(null)
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          )
          const data = await res.json()
          const address = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          setLocation({ lat, lng, address })
        } catch {
          setLocation({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
        }
        setLocating(false)
      },
      (err) => {
        setLocError(err.message || 'Could not get your location. Please allow location access.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSubmit() {
    if (!imageFile || !location || !description.trim()) {
      setSubmitError('All three fields (photo, location, description) are required.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // 1. Upload image to Supabase Storage
      const ext = imageFile.name.split('.').pop() ?? 'jpg'
      const imgPath = `complaints/${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('complaint-images')
        .upload(imgPath, imageFile, { cacheControl: '3600', upsert: false })

      if (uploadErr) throw new Error(`Image upload failed: ${uploadErr.message}`)

      const { data: { publicUrl } } = supabase.storage
        .from('complaint-images')
        .getPublicUrl(imgPath)

      // 2. Call server-side analysis API
      const res = await fetch('/api/complaints/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: publicUrl,
          description: description.trim(),
          latitude: location.lat,
          longitude: location.lng,
          address: location.address,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Analysis failed')
      }

      const { complaintId, permanentId } = await res.json()
      setSuccess(permanentId)

    } catch (err) {
      setSubmitError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center gap-6 py-12 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-[hsla(152,69%,43%,0.15)] border border-[hsla(152,69%,43%,0.3)] flex items-center justify-center">
          <CheckCircle2 size={30} className="text-[var(--brand-success)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Complaint Filed!
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-2">
            Your complaint has been registered and is being analyzed by Gemini AI.
          </p>
        </div>
        <div className="glass-card px-6 py-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">Your Complaint ID</p>
          <code className="text-xl font-bold gradient-text tracking-wide">{success}</code>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/citizen/dashboard')} className="btn-primary">
            View Dashboard <ArrowRight size={15} />
          </button>
          <button onClick={() => { setSuccess(null); setStep(1); setImageFile(null); setImagePreview(null); setLocation(null); setDescription('') }} className="btn-ghost">
            File Another
          </button>
        </div>
      </div>
    )
  }

  const steps = [
    { n: 1, icon: <Camera size={16} />, label: 'Photo' },
    { n: 2, icon: <MapPin size={16} />, label: 'Location' },
    { n: 3, icon: <FileText size={16} />, label: 'Describe' },
  ]

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>File a Complaint</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">All three steps are mandatory — photo, location, and description.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              step === s.n
                ? 'bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white'
                : step > s.n
                ? 'bg-[hsla(152,69%,43%,0.15)] text-[hsl(152,69%,60%)] border border-[hsla(152,69%,43%,0.3)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
            }`}>
              {step > s.n ? <CheckCircle2 size={13} /> : s.icon}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 transition-colors ${step > s.n ? 'bg-[var(--brand-success)]' : 'bg-[var(--bg-border)]'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        {/* Step 1: Photo */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-lg">Upload a Photo</h2>
              <p className="text-[var(--text-secondary)] text-sm">Take a clear photo of the issue you&apos;re reporting.</p>
            </div>

            <div
              className={`upload-zone ${dragging ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg mx-auto object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--brand-danger)] text-white flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
                  <Upload size={32} />
                  <div>
                    <p className="font-medium text-[var(--text-secondary)]">Click to upload or drag & drop</p>
                    <p className="text-xs mt-1">JPG, PNG, WEBP up to 10 MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f) }}
            />

            <button
              className="btn-primary self-end"
              disabled={!imageFile}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-lg">Confirm Location</h2>
              <p className="text-[var(--text-secondary)] text-sm">We need your location to route this complaint to the correct department.</p>
            </div>

            {location ? (
              <div className="rounded-xl border border-[hsla(152,69%,43%,0.25)] bg-[hsla(152,69%,43%,0.06)] p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[hsl(152,69%,60%)]">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-semibold">Location Captured</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{location.address}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
                <button
                  className="btn-ghost text-xs self-start"
                  onClick={() => setLocation(null)}
                >
                  Re-detect
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {locError && (
                  <div className="p-3 rounded-lg bg-[hsla(0,84%,60%,0.1)] border border-[hsla(0,84%,60%,0.2)] text-sm text-[hsl(0,84%,72%)] flex items-start gap-2">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    {locError}
                  </div>
                )}
                <button
                  id="detect-location"
                  className="btn-primary self-start gap-2"
                  onClick={getLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <><Loader2 size={15} className="animate-spin" /> Detecting…</>
                  ) : (
                    <><MapPin size={15} /> Detect My Location</>
                  )}
                </button>
              </div>
            )}

            <div className="flex gap-3 self-end">
              <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button
                className="btn-primary"
                disabled={!location}
                onClick={() => setStep(3)}
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Description */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-lg">Describe the Issue</h2>
              <p className="text-[var(--text-secondary)] text-sm">Give us a clear description. Gemini AI will read this to classify and route your complaint.</p>
            </div>

            <textarea
              id="complaint-description"
              className="input-field resize-none"
              rows={5}
              placeholder="e.g. Large pothole on main road near metro station causing accidents. Water logging around it making it worse…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
            <p className="text-xs text-[var(--text-muted)] text-right">{description.length}/1000</p>

            {submitError && (
              <div className="p-3 rounded-lg bg-[hsla(0,84%,60%,0.1)] border border-[hsla(0,84%,60%,0.2)] text-sm text-[hsl(0,84%,72%)] flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {submitError}
              </div>
            )}

            {/* Summary before submit */}
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--bg-border)] p-4 flex flex-col gap-2 text-sm">
              <p className="font-medium text-[var(--text-secondary)] text-xs uppercase tracking-wide">Submission Summary</p>
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-[var(--brand-primary)]" />
                <span>{imageFile?.name ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[var(--brand-primary)]" />
                <span className="truncate">{location?.address ?? '—'}</span>
              </div>
            </div>

            <div className="flex gap-3 self-end">
              <button className="btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button
                id="submit-complaint"
                className="btn-primary"
                disabled={submitting || description.trim().length < 20}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                ) : (
                  <>Submit Complaint <ArrowRight size={15} /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
