'use client'

import React, { useEffect, useState } from 'react'
import { MapPin, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from '@/context/ToastContext'

export interface CitizenLocationData {
  address: string
  lat: number
  lng: number
  accuracy?: number
  timestamp: number
  isApproximate?: boolean
}

export function getStoredCitizenLocation(): CitizenLocationData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('citizen_location')
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function setStoredCitizenLocation(data: CitizenLocationData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('citizen_location', JSON.stringify(data))
    // Dispatch a custom event so other components (e.g. Layout, Dashboard, Report Page) can sync instantly
    window.dispatchEvent(new CustomEvent('citizen_location_updated', { detail: data }))
  } catch {}
}

export default function CitizenLocationSync({
  onLocationUpdate,
}: {
  onLocationUpdate?: (data: CitizenLocationData) => void
}) {
  const [location, setLocation] = useState<CitizenLocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<string | null>(null)

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser.'
      setErrorState(msg)
      toast.warning(msg)
      return
    }

    setLoading(true)
    setErrorState(null)
    const toastId = toast.loading('Detecting your current location...')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        const isApproximate = accuracy > 200

        let humanAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        try {
          // Reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          )
          const data = await res.json()
          if (data && data.address) {
            const parts = [
              data.address.road || data.address.suburb || data.address.neighbourhood,
              data.address.city || data.address.town || data.address.county || data.address.state,
            ].filter(Boolean)
            if (parts.length > 0) humanAddress = parts.join(', ')
          }
        } catch {
          // Fallback to coordinates
        }

        const locData: CitizenLocationData = {
          address: humanAddress,
          lat,
          lng,
          accuracy,
          isApproximate,
          timestamp: Date.now(),
        }

        setStoredCitizenLocation(locData)
        setLocation(locData)
        setLoading(false)

        if (onLocationUpdate) onLocationUpdate(locData)

        toast.update(toastId, {
          type: isApproximate ? 'warning' : 'success',
          message: isApproximate
            ? `Location detected (Approximate ±${Math.round(accuracy)}m): ${humanAddress}`
            : `Live Location Detected: ${humanAddress}`,
        })
      },
      (err) => {
        setLoading(false)
        let errMsg = 'Location access denied or unavailable.'
        if (err.code === err.PERMISSION_DENIED) {
          errMsg = 'Location permission was denied.'
        } else if (err.code === err.TIMEOUT) {
          errMsg = 'Location request timed out. Please retry.'
        }
        setErrorState(errMsg)
        toast.update(toastId, {
          type: 'warning',
          message: errMsg,
        })
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    )
  }

  useEffect(() => {
    const existing = getStoredCitizenLocation()
    if (existing) {
      setLocation(existing)
      if (onLocationUpdate) onLocationUpdate(existing)
    }

    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<CitizenLocationData>
      if (customEvt.detail) {
        setLocation(customEvt.detail)
        if (onLocationUpdate) onLocationUpdate(customEvt.detail)
      }
    }

    window.addEventListener('citizen_location_updated', handleUpdate)
    return () => window.removeEventListener('citizen_location_updated', handleUpdate)
  }, [])

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-500/30 text-xs font-medium text-blue-300 shadow-sm">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <MapPin size={14} className="text-blue-400 shrink-0" />
      <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-[300px]">
        {loading ? 'Detecting GPS...' : location ? location.address : errorState ?? 'Location Not Set'}
      </span>

      <button
        onClick={fetchCurrentLocation}
        disabled={loading}
        title="Refresh GPS Location"
        className="p-1 rounded-md hover:bg-blue-900/60 text-blue-400 hover:text-white transition-colors cursor-pointer ml-1"
      >
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  )
}
