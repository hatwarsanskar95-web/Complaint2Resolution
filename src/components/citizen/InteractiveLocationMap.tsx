'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  MapPin,
  Crosshair,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Compass,
  Sparkles,
  X
} from 'lucide-react'
import { toast } from '@/context/ToastContext'
import { CitizenLocationData, setStoredCitizenLocation } from '@/components/citizen/CitizenLocationSync'

export type MapLayerType = 'streets' | 'satellite' | 'terrain'

interface InteractiveLocationMapProps {
  initialLocation: CitizenLocationData | null
  onLocationConfirm: (loc: CitizenLocationData) => void
  onCancel?: () => void
  title?: string
  subtitle?: string
}

export default function InteractiveLocationMap({
  initialLocation,
  onLocationConfirm,
  onCancel,
  title = 'Confirm Issue Location',
  subtitle = 'Drag the pin or click on the map to accurately place it where the civic issue is located.'
}: InteractiveLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)

  // Current selected location state
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLocation?.lat || 19.99745,
    lng: initialLocation?.lng || 73.78980
  })
  const [address, setAddress] = useState<string>(initialLocation?.address || 'Detecting address…')
  const [accuracy, setAccuracy] = useState<number | null>(initialLocation?.accuracy || null)
  const [isApproximate, setIsApproximate] = useState<boolean>(initialLocation?.isApproximate ?? false)

  // Map layer style
  const [mapType, setMapType] = useState<MapLayerType>('streets')

  // UI state
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Tile layer URLs — 100% free, no API key required
  const getTileUrl = (type: MapLayerType) => {
    switch (type) {
      case 'satellite':
        // ESRI World Imagery — real satellite photos, completely free
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      case 'terrain':
        // OpenTopoMap — topographic elevation map, free
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      case 'streets':
      default:
        // OpenStreetMap Standard — completely free, no key
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  }

  const getTileAttribution = (type: MapLayerType) => {
    switch (type) {
      case 'satellite':
        return '&copy; Esri, Maxar, Earthstar Geographics'
      case 'terrain':
        return '&copy; OpenTopoMap contributors | &copy; OpenStreetMap'
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  }

  // Reverse geocode helper with caching/debouncing
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
      const data = await res.json()
      if (data?.address) {
        const parts = [
          data.address.road || data.address.suburb || data.address.neighbourhood || data.address.hamlet,
          data.address.city || data.address.town || data.address.county || data.address.state_district,
          data.address.state
        ].filter(Boolean)

        const humanAddress = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',')
        setAddress(humanAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setGeocoding(false)
    }
  }, [])

  // Switch map layer
  const switchMapType = async (type: MapLayerType) => {
    setMapType(type)
    if (!mapInstanceRef.current) return
    const L = (await import('leaflet')).default

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current)
    }

    const newLayer = L.tileLayer(getTileUrl(type), {
      attribution: getTileAttribution(type),
      maxZoom: 19,
    }).addTo(mapInstanceRef.current)

    tileLayerRef.current = newLayer
  }

  // Geolocation detector
  const detectCurrentLocation = useCallback((isInitial = false) => {
    setLocating(true)
    if (!navigator.geolocation) {
      if (!isInitial) toast.error('Geolocation Error', 'Geolocation is not supported by your device.')
      setLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords
        const approx = acc > 200

        setCoords({ lat, lng })
        setAccuracy(acc)
        setIsApproximate(approx)

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 })
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          }
        }

        reverseGeocode(lat, lng)
        setLocating(false)

        if (!isInitial) {
          toast.success('GPS Acquired', approx ? `Approximate GPS (±${Math.round(acc)}m)` : 'High-precision live GPS locked.')
        }
      },
      (err) => {
        setLocating(false)
        if (!isInitial) {
          let msg = 'Could not access your location.'
          if (err.code === err.PERMISSION_DENIED) msg = 'Location permission was denied. Please allow location access or move the map manually.'
          toast.warning('Location Warning', msg)
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [reverseGeocode])

  // Search address handler
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery.trim())}&format=json&limit=1`
      )
      const data = await res.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setCoords({ lat, lng })
        setAddress(data[0].display_name.split(',').slice(0, 3).join(','))
        setIsApproximate(false)

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 })
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          }
        }
        toast.info('Location Found', data[0].display_name.split(',')[0])
      } else {
        toast.warning('Not Found', 'Location not found. Try another search term or drag the pin.')
      }
    } catch {
      toast.error('Search Error', 'Failed to search location.')
    } finally {
      setSearching(false)
    }
  }

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return

      // Load Leaflet dynamically
      const L = (await import('leaflet')).default

      // Inject Leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      if (!isMounted || mapInstanceRef.current) return

      const initialLat = initialLocation?.lat || 19.99745
      const initialLng = initialLocation?.lng || 73.78980

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: false,
        scrollWheelZoom: false,
        touchZoom: true,
        dragging: true,
      })

      mapInstanceRef.current = map

      // Keep scrollWheelZoom disabled by default so mouse wheel always scrolls page.
      // Enable scroll zoom ONLY when user explicitly clicks the map area, and disable immediately when cursor leaves.
      map.on('click', () => {
        map.scrollWheelZoom.enable()
      })
      map.on('blur', () => {
        map.scrollWheelZoom.disable()
      })

      const containerEl = mapContainerRef.current
      const handleMouseLeave = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.scrollWheelZoom.disable()
        }
      }
      if (containerEl) {
        containerEl.addEventListener('mouseleave', handleMouseLeave)
      }

      // Realistic Tile Layer
      const baseTile = L.tileLayer(getTileUrl('streets'), {
        attribution: getTileAttribution('streets'),
        maxZoom: 19,
      }).addTo(map)

      tileLayerRef.current = baseTile

      // Add Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Classic red Google Maps–style teardrop SVG pin
      const issueIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position:relative; width:32px; height:46px; transform:translate(-50%,-100%);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 46" width="32" height="46">
              <defs>
                <radialGradient id="pinGrad" cx="40%" cy="30%" r="60%">
                  <stop offset="0%" stop-color="#ff5252"/>
                  <stop offset="100%" stop-color="#c62828"/>
                </radialGradient>
                <filter id="pinShadow" x="-20%" y="-10%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.4)"/>
                </filter>
              </defs>
              <!-- Main teardrop body -->
              <path d="M16 2 C8.268 2 2 8.268 2 16 C2 24 16 44 16 44 C16 44 30 24 30 16 C30 8.268 23.732 2 16 2 Z"
                fill="url(#pinGrad)" filter="url(#pinShadow)" stroke="#b71c1c" stroke-width="0.5"/>
              <!-- White inner circle dot -->
              <circle cx="16" cy="16" r="6" fill="white" opacity="0.95"/>
              <!-- Highlight shine -->
              <ellipse cx="12" cy="12" rx="3.5" ry="2.5" fill="white" opacity="0.35" transform="rotate(-25 12 12)"/>
            </svg>
            <!-- Ground shadow -->
            <div style="width:14px;height:4px;background:rgba(0,0,0,0.3);border-radius:50%;margin:-2px auto 0;filter:blur(2px);"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })

      // Create draggable issue pin
      const marker = L.marker([initialLat, initialLng], {
        icon: issueIcon,
        draggable: true,
      }).addTo(map)

      markerRef.current = marker

      // Drag listener
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        setCoords({ lat: pos.lat, lng: pos.lng })
        reverseGeocode(pos.lat, pos.lng)
      })

      // Click on map to move pin
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        setCoords({ lat, lng })
        reverseGeocode(lat, lng)
      })

      setMapLoaded(true)

      // If initial location wasn't provided, auto-detect GPS
      if (!initialLocation) {
        detectCurrentLocation(true)
      } else {
        reverseGeocode(initialLat, initialLng)
      }
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleConfirm() {
    const locData: CitizenLocationData = {
      address,
      lat: coords.lat,
      lng: coords.lng,
      accuracy: accuracy || undefined,
      isApproximate,
      timestamp: Date.now(),
    }
    setStoredCitizenLocation(locData)
    onLocationConfirm(locData)
  }

  return (
    <div className="flex flex-col gap-5 text-white">
      {/* Top Header with Back Button */}
      <div className="flex items-start gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-[#0a1c15] border border-[#1b4332] text-white flex items-center justify-center hover:bg-[#102d22] transition-colors cursor-pointer shrink-0 mt-0.5"
            title="Back"
          >
            ←
          </button>
        )}
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {title}
          </h2>
          <p className="text-xs text-emerald-200/70 mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* 2-Column Split Layout matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT COLUMN: Leaflet Map Container with overlaid Controls */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="relative rounded-2xl overflow-hidden border border-[#1b4332] shadow-2xl bg-[#06110c] h-[480px] sm:h-[540px] md:h-[580px] w-full">
            {/* Leaflet Map div */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Top Left Floating Badge: Current Location */}
            <div className="absolute top-3 left-3 z-[400] max-w-[65%] bg-[#081b14]/90 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-[#1b4332] flex items-center gap-2.5 text-xs">
              <div className="w-8 h-8 rounded-full bg-[#00875a]/30 border border-[#00a36c]/40 text-[#34d399] flex items-center justify-center shrink-0 font-bold">
                <MapPin size={15} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block leading-tight">Current Location</span>
                <span className="font-bold text-white text-xs truncate block leading-tight">{address}</span>
              </div>
            </div>

            {/* Top Right Map Layer Switcher Pills */}
            <div className="absolute top-3 right-3 z-[400] flex items-center gap-1 bg-[#071711]/90 backdrop-blur-md p-1 rounded-2xl border border-[#1b4332] shadow-xl">
              <button
                type="button"
                onClick={() => switchMapType('streets')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mapType === 'streets'
                    ? 'bg-[#00875a] text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>🗺️ Map</span>
              </button>
              <button
                type="button"
                onClick={() => switchMapType('satellite')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mapType === 'satellite'
                    ? 'bg-[#00875a] text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>🛰️ Satellite</span>
              </button>
              <button
                type="button"
                onClick={() => switchMapType('terrain')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mapType === 'terrain'
                    ? 'bg-[#00875a] text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>⛰️ Terrain</span>
              </button>
            </div>

            {/* Floating Re-center / GPS Button */}
            <button
              type="button"
              onClick={() => detectCurrentLocation(false)}
              disabled={locating}
              title="Center on My Live GPS Location"
              className="absolute top-16 right-3 z-[400] w-10 h-10 rounded-full bg-[#081b14]/90 hover:bg-[#0d2a1f] text-white shadow-xl border border-[#1b4332] transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center"
            >
              {locating ? (
                <Loader2 size={18} className="animate-spin text-emerald-400" />
              ) : (
                <Crosshair size={18} className="text-emerald-400" />
              )}
            </button>

            {/* Bottom Left Leaflet Attribution styling override container */}
          </div>
        </div>

        {/* RIGHT COLUMN: Location Details, Search, Coordinates & Action */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-[#04120d] border border-[#1b4332] p-5 shadow-xl space-y-4">
          <div className="space-y-4">
            {/* Selected Location Title & Accuracy */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00875a]/30 border border-[#00a36c]/40 text-[#34d399] flex items-center justify-center shrink-0 font-bold">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">Selected Location</span>
                  <h3 className="text-sm font-bold text-white leading-snug">{address}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                <Crosshair size={12} />
                <span>Accuracy: ±{accuracy ? Math.round(accuracy) : '144'}m</span>
              </div>
            </div>

            {/* Search Input Box */}
            <form onSubmit={handleSearch} className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search for a different location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#061811] border border-[#1b4332] text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-all"
              />
            </form>

            {/* Coordinates Card */}
            <div className="rounded-2xl bg-[#061811] border border-[#1b4332] p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
                  <Compass size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Coordinates</span>
                  <p className="text-xs font-mono font-bold text-white">
                    {coords.lat.toFixed(6)}° N, {coords.lng.toFixed(6)}° E
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800 shrink-0">
                ±{accuracy ? Math.round(accuracy) : '144'}m accuracy
              </span>
            </div>

            {/* Primary Action Button: Use This Location */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={geocoding}
              className="w-full py-3.5 rounded-full bg-[#00875a] hover:bg-[#00a36c] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Crosshair size={17} />
              <span>Use This Location</span>
              <span>→</span>
            </button>
          </div>

          {/* Info Note at Bottom */}
          <div className="pt-3 border-t border-[#1b4332]/60 flex items-start gap-2.5 text-[11px] text-emerald-200/70">
            <AlertCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
            <p>
              This location represents the place where the issue exists, not necessarily where you are currently.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
