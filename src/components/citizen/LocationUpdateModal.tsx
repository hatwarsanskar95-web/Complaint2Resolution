'use client'

import React, { useState, useEffect } from 'react'
import {
  MapPin,
  Crosshair,
  Compass,
  X,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Search,
  Layers
} from 'lucide-react'
import { toast } from '@/context/ToastContext'
import {
  CitizenLocationData,
  getStoredCitizenLocation,
  setStoredCitizenLocation
} from '@/components/citizen/CitizenLocationSync'
import InteractiveLocationMap from '@/components/citizen/InteractiveLocationMap'

interface LocationUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdated?: (loc: CitizenLocationData) => void
}

export default function LocationUpdateModal({
  isOpen,
  onClose,
  onUpdated
}: LocationUpdateModalProps) {
  const [viewMode, setViewMode] = useState<'options' | 'map'>('options')
  const [locating, setLocating] = useState(false)
  const [currentLoc, setCurrentLoc] = useState<CitizenLocationData | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCurrentLoc(getStoredCitizenLocation())
      setViewMode('options')
    }
  }, [isOpen])

  if (!isOpen) return null

  // Option 1: Auto-Detect via GPS Geolocation
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation Error', 'Geolocation is not supported by your browser.')
      return
    }

    setLocating(true)
    const toastId = toast.loading('Acquiring high-accuracy live GPS...')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        const isApproximate = accuracy > 200

        let humanAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          )
          const data = await res.json()
          if (data?.address) {
            const parts = [
              data.address.road || data.address.suburb || data.address.neighbourhood || data.address.hamlet,
              data.address.city || data.address.town || data.address.county || data.address.state_district,
              data.address.state,
            ].filter(Boolean)
            if (parts.length > 0) humanAddress = parts.join(', ')
          }
        } catch {}

        const locData: CitizenLocationData = {
          address: humanAddress,
          lat,
          lng,
          accuracy,
          isApproximate,
          timestamp: Date.now(),
        }

        setStoredCitizenLocation(locData)
        setCurrentLoc(locData)
        setLocating(false)

        if (onUpdated) onUpdated(locData)

        toast.update(toastId, {
          type: isApproximate ? 'warning' : 'success',
          message: isApproximate
            ? `Location updated (Approximate ±${Math.round(accuracy)}m): ${humanAddress}`
            : `Live GPS Locked: ${humanAddress}`,
        })

        onClose()
      },
      (err) => {
        setLocating(false)
        let errMsg = 'Location access denied or unavailable.'
        if (err.code === err.PERMISSION_DENIED) {
          errMsg = 'Location permission was denied. Please allow location access or pick manually.'
        } else if (err.code === err.TIMEOUT) {
          errMsg = 'Location request timed out. Please retry or choose manually.'
        }
        toast.update(toastId, {
          type: 'warning',
          message: errMsg,
        })
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  // Option 2: Choose Manually on Interactive Map
  const handleMapConfirm = (loc: CitizenLocationData) => {
    setStoredCitizenLocation(loc)
    setCurrentLoc(loc)
    if (onUpdated) onUpdated(loc)
    toast.success('Location Updated', `Ward set to: ${loc.address}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className={`bg-[#07130f] border border-[#18382c] text-white rounded-3xl w-full shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        viewMode === 'map' ? 'max-w-6xl h-[92vh] max-h-[92vh]' : 'max-w-md'
      }`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#18382c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <MapPin size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {viewMode === 'map' ? 'Choose Location on Map' : 'Update Your Location'}
              </h3>
              <p className="text-[11px] text-emerald-200/70">
                {viewMode === 'map' ? 'Drag pin or search area to adjust' : 'Choose how you want to calibrate your location'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#0f241d] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {viewMode === 'options' ? (
            <div className="space-y-4">
              {/* Current Location Preview */}
              <div className="p-3.5 rounded-2xl bg-[#0b1d16] border border-[#1b4332] flex items-start gap-3">
                <Compass size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Current Saved Address</span>
                  <p className="text-xs font-semibold text-white truncate">
                    {currentLoc?.address || 'No location saved yet'}
                  </p>
                </div>
              </div>

              {/* Action 1: Auto Detect via Live GPS */}
              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={locating}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#0f2d21] to-[#123829] hover:from-[#134230] hover:to-[#184d39] border border-emerald-600/40 text-left flex items-center justify-between gap-3 shadow-lg group transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform shrink-0">
                    {locating ? <RefreshCw size={20} className="animate-spin text-emerald-300" /> : <Crosshair size={22} />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      <span>Auto-Detect Live GPS</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">Fast</span>
                    </h4>
                    <p className="text-[11px] text-emerald-200/70 mt-0.5">
                      Acquire high-precision satellite coordinates from your device automatically.
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-black text-emerald-400 flex items-center justify-center transition-all shrink-0">
                  →
                </div>
              </button>

              {/* Action 2: Choose Manually on Real Map */}
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className="w-full p-4 rounded-2xl bg-[#0a1813] hover:bg-[#0f241d] border border-[#1b4332] text-left flex items-center justify-between gap-3 shadow-md group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform shrink-0">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                      <span>Choose Manually on Map</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono font-bold">Satellite / Street</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Drop a pin, search landmarks, or explore high-resolution satellite imagery.
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-blue-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-all shrink-0">
                  →
                </div>
              </button>
            </div>
          ) : (
            <InteractiveLocationMap
              initialLocation={currentLoc}
              onLocationConfirm={handleMapConfirm}
              onCancel={() => setViewMode('options')}
              title="Pinpoint Your Ward / Area Location"
              subtitle="Drag the pin or toggle between Street, Satellite, and Terrain views to accurately set your location."
            />
          )}
        </div>
      </div>
    </div>
  )
}
