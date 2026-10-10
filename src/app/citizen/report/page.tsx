'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Camera,
  MapPin,
  FileText,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Navigation,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Building2,
  Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn, AiProcessingIndicator } from '@/components/ui/motion'
import { toast } from '@/context/ToastContext'
import {
  getStoredCitizenLocation,
  CitizenLocationData,
} from '@/components/citizen/CitizenLocationSync'
import InteractiveLocationMap from '@/components/citizen/InteractiveLocationMap'
import AddPhotoModal from '@/components/citizen/AddPhotoModal'
import { useCitizenTheme } from '@/context/CitizenThemeContext'

interface PhotoSlot {
  id: number
  label: string
  subtitle: string
  required: boolean
  file: File | null
  preview: string | null
}

const INITIAL_SLOTS: PhotoSlot[] = [
  { id: 1, label: 'Problem', subtitle: 'Main issue close-up', required: true, file: null, preview: null },
  { id: 2, label: 'Problem', subtitle: 'Different angle', required: true, file: null, preview: null },
  { id: 3, label: 'Problem', subtitle: 'Wider perspective', required: true, file: null, preview: null },
  { id: 4, label: 'Location', subtitle: 'Street / landmark view', required: false, file: null, preview: null },
  { id: 5, label: 'Surroundings', subtitle: 'Nearby buildings / road', required: false, file: null, preview: null },
]

export default function ReportComplaintPage() {
  const router = useRouter()
  const supabase = createClient()
  const { isDark } = useCitizenTheme()

  // Stepper state
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1: Photos (3 to 5 slots)
  const [slots, setSlots] = useState<PhotoSlot[]>(INITIAL_SLOTS)
  const [activeModalSlotIndex, setActiveModalSlotIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Step 2: Location
  const [location, setLocation] = useState<CitizenLocationData | null>(null)
  const [locationConfirmed, setLocationConfirmed] = useState(false)

  // Step 3: Description
  const [description, setDescription] = useState('')

  // UI / Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitStepText, setSubmitStepText] = useState('Analyzing issue with Gemini AI…')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // On mount: load stored location as initial starting point for the map
  useEffect(() => {
    const stored = getStoredCitizenLocation()
    if (stored) {
      setLocation(stored)
    }
  }, [])

  // Count uploaded photos
  const uploadedCount = slots.filter((s) => s.file !== null).length
  const canProceedToLocation = uploadedCount >= 3

  // Photo handlers
  function handleSlotFileSelect(slotIndex: number, file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File Type', 'Please choose a valid JPG, PNG, or WEBP photo.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      setSlots((prev) => {
        const next = [...prev]
        next[slotIndex] = { ...next[slotIndex], file, preview }
        return next
      })
      toast.info('Photo Added', `Image for "${slots[slotIndex].label}" attached.`)
    }
    reader.readAsDataURL(file)
  }

  function handleSlotRemove(slotIndex: number, e: React.MouseEvent) {
    e.stopPropagation()
    setSlots((prev) => {
      const next = [...prev]
      next[slotIndex] = { ...next[slotIndex], file: null, preview: null }
      return next
    })
    // Reset file input element
    if (fileInputRefs.current[slotIndex]) {
      fileInputRefs.current[slotIndex]!.value = ''
    }
  }

  // Location confirmed handler from Interactive Map
  function handleLocationConfirmed(loc: CitizenLocationData) {
    setLocation(loc)
    setLocationConfirmed(true)
    setStep(3)
  }

  // Final complaint submission
  async function handleSubmit() {
    const validPhotos = slots.filter((s) => s.file !== null)

    if (validPhotos.length < 3) {
      const msg = 'Please attach at least 3 photographic proofs before submitting.'
      setSubmitError(msg)
      toast.warning('Evidence Required', msg)
      setStep(1)
      return
    }

    if (!location) {
      const msg = 'Please confirm the complaint location on the interactive map.'
      setSubmitError(msg)
      toast.warning('Location Required', msg)
      setStep(2)
      return
    }

    if (description.trim().length < 20) {
      const msg = 'Please provide a detailed description (minimum 20 characters).'
      setSubmitError(msg)
      toast.warning('Description Too Short', msg)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 1. Upload all 3-5 images to Supabase Storage
      setSubmitStepText(`Uploading ${validPhotos.length} photographic proofs to secure vault…`)
      const uploadedUrls: string[] = []

      for (let i = 0; i < validPhotos.length; i++) {
        const slot = validPhotos[i]
        const ext = slot.file!.name.split('.').pop() || 'jpg'
        const path = `complaints/${user.id}/${Date.now()}_slot${slot.id}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from('complaint-images')
          .upload(path, slot.file!, { cacheControl: '3600', upsert: false })

        if (uploadErr) {
          throw new Error(`Failed to upload Photo ${i + 1} (${slot.label}): ${uploadErr.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('complaint-images')
          .getPublicUrl(path)

        uploadedUrls.push(publicUrl)
      }

      // 2. Call Gemini AI triage and smart department routing API
      setSubmitStepText('Gemini AI analyzing multi-angle evidence and routing to department…')

      const res = await fetch('/api/complaints/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: uploadedUrls,
          description: description.trim(),
          latitude: location.lat,
          longitude: location.lng,
          address: location.address,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Grievance registration failed')
      }

      const { permanentId } = await res.json()
      setSuccessId(permanentId)
      toast.success('Complaint Registered', `Case ${permanentId} dispatched to concerned municipal unit.`)
    } catch (err) {
      const errMsg = (err as Error).message || 'Failed to submit complaint.'
      setSubmitError(errMsg)
      toast.error('Submission Failed', errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Processing screen
  if (submitting) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className={`rounded-3xl border p-8 shadow-xl text-center space-y-4 ${isDark ? 'bg-[#0b1a15] border-[#18382c]' : 'bg-white border-[#e2e8f0]'}`}>
          <AiProcessingIndicator />
          <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>{submitStepText}</p>
        </div>
      </div>
    )
  }

  // Success screen
  if (successId) {
    return (
      <FadeIn direction="up" className="max-w-lg mx-auto flex flex-col items-center gap-6 py-12 text-center px-4">
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-md ${isDark ? 'bg-emerald-500/10 border-emerald-700/30' : 'bg-emerald-50 border-emerald-200'}`}>
          <CheckCircle2 size={32} className="text-[#15803d]" />
        </div>

        <div>
          <h2 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
            Complaint Registered!
          </h2>
          <p className={`text-xs sm:text-sm mt-2 max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
            Your grievance has been analyzed by Gemini AI, classified into the civic taxonomy, and dispatched to the field unit with an SLA target.
          </p>
        </div>

        <div className={`rounded-2xl border px-8 py-5 text-center w-full flex flex-col items-center gap-2 shadow-sm ${isDark ? 'bg-[#0b1a15] border-[#18382c]' : 'bg-white border-[#e2e8f0]'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
            Permanent Tracking Reference
          </p>
          <div className="flex items-center gap-2">
            <code className="text-2xl font-mono font-bold text-blue-700 tracking-wider">
              {successId}
            </code>
            <button
              onClick={() => copyToClipboard(successId)}
              className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer"
              title="Copy ID"
            >
              {copied ? <Check size={16} className="text-[#15803d]" /> : <Copy size={16} />}
            </button>
          </div>
          {copied && <span className="text-[11px] text-[#15803d] font-semibold">Copied to clipboard</span>}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            onClick={() => router.push(`/track?id=${successId}`)}
            className="px-6 py-3 rounded-full bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Track Progress</span>
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => {
              setSuccessId(null)
              setStep(1)
              setSlots(INITIAL_SLOTS)
              setDescription('')
              setLocationConfirmed(false)
            }}
            className="px-6 py-3 rounded-full bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] text-xs font-bold text-[#0f172a] transition-all cursor-pointer"
          >
            File Another Complaint
          </button>
        </div>
      </FadeIn>
    )
  }

  const stepsList = [
    { n: 1, icon: <Camera size={15} />, label: 'Photos (3–5)' },
    { n: 2, icon: <MapPin size={15} />, label: 'Issue Map' },
    { n: 3, icon: <FileText size={15} />, label: 'Describe & Submit' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <FadeIn direction="up">
        <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
          Report a Civic Issue
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
          Upload 3–5 photographic proofs, confirm the issue location on the map, and explain the problem.
        </p>
      </FadeIn>

      {/* Stepper Progress Header */}
      <FadeIn direction="up" delay={0.05} className="flex items-center gap-2">
        {stepsList.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                step === s.n
                  ? 'bg-[#15803d] text-white shadow-md'
                  : step > s.n
                  ? isDark ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40' : 'bg-[#dcfce7] text-[#14532d] border border-[#bbf7d0]'
                  : isDark ? 'bg-[#0d1f17] text-slate-400' : 'bg-[#f1f5f9] text-[#64748b]'
              }`}
            >
              {step > s.n ? <CheckCircle2 size={13} /> : s.icon}
              <span>{s.label}</span>
            </div>
            {i < stepsList.length - 1 && (
              <div
                className={`h-0.5 flex-1 transition-colors duration-300 ${
                  step > s.n ? 'bg-[#15803d]' : isDark ? 'bg-[#1b3828]' : 'bg-[#e2e8f0]'
                }`}
              />
            )}
          </div>
        ))}
      </FadeIn>

      {/* Main Stepper Card */}
      <div className={`rounded-3xl border p-6 sm:p-8 shadow-sm ${isDark ? 'bg-[#0b1a15] border-[#18382c]' : 'bg-white border-[#e2e8f0]'}`}>
        <AnimatePresence mode="wait">
          {/* STEP 1: Photos (3 to 5 Slots) */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 ${isDark ? 'border-[#18382c]' : 'border-[#f1f5f9]'}`}>
                <div>
                  <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Upload Photo Evidence
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    Minimum <strong>3 photos required</strong> (maximum 5). Clear photos ensure immediate AI routing.
                  </p>
                </div>
                <div
                  className={`text-xs font-bold px-3 py-1.5 rounded-full self-start sm:self-auto border ${
                    uploadedCount >= 3
                      ? isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700/40' : 'bg-emerald-50 text-[#15803d] border-emerald-200'
                      : isDark ? 'bg-amber-900/20 text-amber-400 border-amber-700/40' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {uploadedCount} / 5 Uploaded {uploadedCount < 3 ? `(Need ${3 - uploadedCount} more)` : '✓'}
                </div>
              </div>

              {/* 5 Slots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot, idx) => (
                  <div
                    key={slot.id}
                    onClick={() => {
                      if (!slot.preview) {
                        setActiveModalSlotIndex(idx)
                      }
                    }}
                    className={`rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between p-3.5 min-h-[170px] ${
                      slot.preview
                        ? isDark ? 'border-emerald-700/40 bg-emerald-900/10 shadow-sm' : 'border-[#15803d]/40 bg-[#f0fdf4]/30 shadow-sm'
                        : slot.required
                        ? isDark ? 'border-dashed border-[#1b3828] hover:border-emerald-600 bg-[#081512] hover:bg-emerald-900/10 cursor-pointer' : 'border-dashed border-[#cbd5e1] hover:border-[#15803d] bg-[#f8fafc] hover:bg-emerald-50/30 cursor-pointer'
                        : isDark ? 'border-dashed border-[#14291f] hover:border-[#1b3828] bg-[#081512]/60 cursor-pointer' : 'border-dashed border-[#e2e8f0] hover:border-[#94a3b8] bg-[#f8fafc]/60 cursor-pointer'
                    }`}
                  >
                    {/* Top Header of Slot */}
                    <div className="flex items-center justify-between gap-1 mb-2 z-10">
                      <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-[#0f172a]'}`}>
                        Image {slot.id}: {slot.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          slot.preview
                            ? 'bg-[#15803d] text-white'
                            : slot.required
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {slot.preview ? 'Ready ✓' : slot.required ? 'Required' : 'Optional'}
                      </span>
                    </div>

                    {/* Preview / Upload Area */}
                    {slot.preview ? (
                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-950 border border-[#e2e8f0] my-1 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slot.preview}
                          alt={`Slot ${slot.id}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveModalSlotIndex(idx)
                            }}
                            className="p-2 rounded-full bg-white text-[#0f172a] hover:bg-emerald-50 text-xs font-bold shadow-md cursor-pointer"
                            title="Replace Image"
                          >
                            <RefreshCw size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSlotRemove(idx, e)}
                            className="p-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
                            title="Remove Image"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center my-auto py-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#15803d] mb-2 shadow-sm">
                          <Camera size={18} />
                        </div>
                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-[#334155]'}`}>{slot.subtitle}</span>
                        <span className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-600' : 'text-[#94a3b8]'}`}>Click to upload photo</span>
                      </div>
                    )}

                    {/* Bottom slot footer */}
                    {slot.preview && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#15803d]/10 text-[11px] text-[#15803d] font-semibold">
                        <span className="truncate">{slot.file?.name}</span>
                        <button
                          type="button"
                          onClick={(e) => handleSlotRemove(idx, e)}
                          className="text-rose-600 hover:underline text-[10px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    <input
                      ref={(el) => {
                        fileInputRefs.current[idx] = el
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleSlotFileSelect(idx, file)
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* AddPhotoModal for slot selection */}
              {activeModalSlotIndex !== null && (
                <AddPhotoModal
                  isOpen={activeModalSlotIndex !== null}
                  slotLabel={slots[activeModalSlotIndex].label}
                  slotNumber={slots[activeModalSlotIndex].id}
                  onClose={() => setActiveModalSlotIndex(null)}
                  onSelectFileFromDevice={() => {
                    fileInputRefs.current[activeModalSlotIndex]?.click()
                  }}
                  onPhotoCaptured={(capturedFile) => {
                    handleSlotFileSelect(activeModalSlotIndex, capturedFile)
                  }}
                />
              )}

              {/* Step 1 Footer Action */}
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t ${isDark ? 'border-[#18382c]' : 'border-[#f1f5f9]'}`}>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                  {uploadedCount < 3
                    ? `⚠️ Please attach at least ${3 - uploadedCount} more required photo${3 - uploadedCount > 1 ? 's' : ''} to continue.`
                    : `✓ ${uploadedCount} photos attached. Ready to confirm location.`}
                </span>

                <button
                  type="button"
                  id="continue-to-location"
                  disabled={!canProceedToLocation}
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-full bg-[#15803d] hover:bg-[#166534] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                >
                  <span>Continue to Location</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Interactive Location Map (Uber/Rapido style) */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <InteractiveLocationMap
                initialLocation={location}
                onLocationConfirm={handleLocationConfirmed}
                onCancel={() => setStep(1)}
              />
            </motion.div>
          )}

          {/* STEP 3: Description & Final Review */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Describe the Issue
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                  Explain what is happening, visible hazards, surrounding landmarks, and duration.
                </p>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <textarea
                  id="complaint-description"
                  rows={5}
                  placeholder="Describe what is happening and where you noticed it (e.g., Deep crater pothole near the bus stop causing heavy waterlogging and traffic accidents during rain)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  className={`w-full p-4 rounded-2xl border text-xs sm:text-sm outline-none transition-all resize-none shadow-inner ${
                    isDark
                      ? 'bg-[#081512] border-[#1b3828] focus:border-emerald-600 text-white placeholder:text-slate-600'
                      : 'bg-[#f8fafc] border-[#e2e8f0] focus:border-[#15803d] focus:bg-white text-[#0f172a] placeholder:text-[#94a3b8]'
                  }`}
                />
                <div className={`flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                  <span>{description.trim().length < 20 ? 'Minimum 20 characters required' : '✓ Description valid'}</span>
                  <span>{description.length} / 1000</span>
                </div>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Final Review Summary Card */}
              <div className={`rounded-2xl border p-5 space-y-3.5 ${isDark ? 'bg-[#081512] border-[#18382c]' : 'bg-[#f8fafc] border-[#e2e8f0]'}`}>
                <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-[#18382c]' : 'border-[#e2e8f0]'}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-[#0f172a]'}`}>
                    Complaint Summary Before Submission
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'text-[#15803d] bg-emerald-100'}`}>
                    Ready for AI Dispatch
                  </span>
                </div>

                {/* Photos Row */}
                <div className={`flex items-start gap-3 text-xs ${isDark ? 'text-slate-300' : 'text-[#334155]'}`}>
                  <Camera size={16} className="text-[#15803d] shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <span className="font-bold block">
                      ✓ {uploadedCount} Photos Uploaded
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {slots
                        .filter((s) => s.preview !== null)
                        .map((s) => (
                          <div
                            key={s.id}
                            className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#cbd5e1] shrink-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.preview!} alt={s.label} className="w-full h-full object-cover" />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Location Row */}
                <div className={`flex items-start gap-3 text-xs ${isDark ? 'text-slate-300' : 'text-[#334155]'}`}>
                  <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">✓ Issue Location Confirmed</span>
                    <span className={`block ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>{location?.address}</span>
                    {location && (
                      <span className="text-[10px] font-mono text-[#94a3b8]">
                        {location.lat.toFixed(5)}° N, {location.lng.toFixed(5)}° E
                      </span>
                    )}
                  </div>
                </div>

                {/* Description Row */}
                <div className={`flex items-start gap-3 text-xs ${isDark ? 'text-slate-300' : 'text-[#334155]'}`}>
                  <FileText size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">✓ Description</span>
                    <span className={`line-clamp-2 ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                      {description || 'Pending details…'}
                    </span>
                  </div>
                </div>

                <div className={`pt-2 text-[11px] flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                  <Sparkles size={13} className="text-[#15803d]" />
                  <span>Gemini AI will automatically classify category, urgency priority, and dispatch to the correct department.</span>
                </div>
              </div>

              {/* Step 3 Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${isDark ? 'border-[#1b3828] text-slate-400 hover:text-slate-200 hover:bg-[#0f2a1f]' : 'border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'}`}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Map</span>
                </button>

                <button
                  type="button"
                  id="submit-complaint"
                  disabled={submitting || description.trim().length < 20}
                  onClick={handleSubmit}
                  className="px-7 py-3 rounded-full bg-[#15803d] hover:bg-[#166534] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Complaint</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
