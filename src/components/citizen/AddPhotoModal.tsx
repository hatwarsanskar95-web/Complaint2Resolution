'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Camera,
  FolderOpen,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  ShieldCheck,
  VideoOff
} from 'lucide-react'

interface AddPhotoModalProps {
  isOpen: boolean
  slotLabel: string
  slotNumber: number
  onClose: () => void
  onSelectFileFromDevice: () => void
  onPhotoCaptured: (file: File) => void
}

type ModalStep = 'SELECT_SOURCE' | 'CAMERA' | 'PREVIEW' | 'ERROR'

export default function AddPhotoModal({
  isOpen,
  slotLabel,
  slotNumber,
  onClose,
  onSelectFileFromDevice,
  onPhotoCaptured,
}: AddPhotoModalProps) {
  const [step, setStep] = useState<ModalStep>('SELECT_SOURCE')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [cameraLoading, setCameraLoading] = useState(false)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Clean up camera stream helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  // Handle modal close or unmount
  const handleCloseModal = () => {
    stopCameraStream()
    setStep('SELECT_SOURCE')
    setCapturedFile(null)
    setCapturedPreview(null)
    onClose()
  }

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream()
      setStep('SELECT_SOURCE')
      setCapturedFile(null)
      setCapturedPreview(null)
    }
    return () => {
      stopCameraStream()
    }
  }, [isOpen])

  // Keydown listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCloseModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Start Device Camera
  const startCamera = async () => {
    setCameraLoading(true)
    setErrorMessage('')
    setStep('CAMERA')

    // Check MediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Camera access is not supported on this device/browser.')
      setStep('ERROR')
      setCameraLoading(false)
      return
    }

    try {
      stopCameraStream()

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraLoading(false)
    } catch (err: any) {
      stopCameraStream()
      console.error('Camera access error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied by your browser permissions.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera hardware was found on this device.')
      } else {
        setErrorMessage(err.message || 'Camera is not available on this device.')
      }
      setStep('ERROR')
      setCameraLoading(false)
    }
  }

  // Capture Video Frame to Canvas
  const capturePhoto = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return

        const file = new File(
          [blob],
          `complaint_slot_${slotNumber}_${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        )

        const previewUrl = URL.createObjectURL(blob)
        setCapturedFile(file)
        setCapturedPreview(previewUrl)

        // Stop camera stream after capture
        stopCameraStream()
        setStep('PREVIEW')
      },
      'image/jpeg',
      0.92
    )
  }

  // Use Captured Photo
  const handleUsePhoto = () => {
    if (capturedFile) {
      onPhotoCaptured(capturedFile)
      handleCloseModal()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#04120d] border border-[#1b4332] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-white relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#1b4332]/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <Camera size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Photo</h2>
              <p className="text-[11px] text-emerald-200/70 font-medium">
                Image {slotNumber}: {slotLabel}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-[#081f16] border border-[#1b4332] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: Select Source */}
        {step === 'SELECT_SOURCE' && (
          <div className="space-y-4 text-xs py-2">
            <p className="text-slate-300 font-medium text-xs text-center">
              How would you like to add your photo?
            </p>

            <div className="grid grid-cols-1 gap-3 pt-1">
              {/* Take a Photo Button */}
              <button
                type="button"
                onClick={startCamera}
                className="w-full p-4 rounded-2xl bg-[#081f16] hover:bg-[#0e2c1f] border border-[#1b4332] hover:border-emerald-500/60 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Camera size={20} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-white block group-hover:text-emerald-300">
                      Take a Photo
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Use real-time device camera
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                  ➔
                </div>
              </button>

              {/* Upload from Device Button */}
              <button
                type="button"
                onClick={() => {
                  handleCloseModal()
                  onSelectFileFromDevice()
                }}
                className="w-full p-4 rounded-2xl bg-[#081f16] hover:bg-[#0e2c1f] border border-[#1b4332] hover:border-emerald-500/60 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0">
                    <FolderOpen size={20} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-white block group-hover:text-teal-300">
                      Upload from Device
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Select photo from gallery or file manager
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center">
                  ➔
                </div>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Live Camera View */}
        {step === 'CAMERA' && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black border border-[#1b4332] flex items-center justify-center">
              {cameraLoading && (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 size={28} className="animate-spin text-emerald-400" />
                  <span className="text-xs">Initializing camera...</span>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraLoading ? 'hidden' : 'block'}`}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream()
                  setStep('SELECT_SOURCE')
                }}
                className="px-4 py-2 rounded-xl bg-[#081f16] border border-[#1b4332] text-slate-300 text-xs font-semibold hover:text-white transition-all"
              >
                Back
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                disabled={cameraLoading}
                className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Camera size={16} />
                <span>Capture Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Captured Photo Preview */}
        {step === 'PREVIEW' && capturedPreview && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black border border-emerald-500/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedPreview}
                alt="Captured Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#1b4332]">
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2.5 rounded-xl bg-[#081f16] border border-[#1b4332] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleUsePhoto}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Use Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Camera Error Fallback */}
        {step === 'ERROR' && (
          <div className="space-y-4 text-xs py-2 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <VideoOff size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Camera Unavailable</h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleCloseModal()
                  onSelectFileFromDevice()
                }}
                className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <FolderOpen size={16} />
                <span>Upload from Device Instead</span>
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
