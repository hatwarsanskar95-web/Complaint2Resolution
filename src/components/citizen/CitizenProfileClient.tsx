'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  MapPin,
  Shield,
  Edit,
  CheckCircle2,
  Key,
  LogOut,
  ChevronRight,
  Info,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { Profile } from '@/lib/types'
import { FadeIn } from '@/components/ui/motion'
import {
  getStoredCitizenLocation,
  CitizenLocationData,
} from '@/components/citizen/CitizenLocationSync'
import LocationUpdateModal from '@/components/citizen/LocationUpdateModal'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/context/ToastContext'
import { useCitizenTheme } from '@/context/CitizenThemeContext'

interface Props {
  profile: Profile | null
  email: string
  counts: {
    total: number
    resolved: number
    active: number
  }
}

export default function CitizenProfileClient({ profile, email }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { isDark } = useCitizenTheme()

  const [location, setLocation] = useState<CitizenLocationData | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || 'X-gamer- 700K')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loc = getStoredCitizenLocation()
    if (loc) setLocation(loc)
    if (profile?.full_name) setFullName(profile.full_name)
  }, [profile])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      toast.success('Signed Out', 'You have been successfully signed out.')
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Sign Out Failed', 'Could not complete sign out. Please try again.')
      setLoggingOut(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName.trim() })
          .eq('id', user.id)
        toast.success('Profile Updated', 'Your full name has been updated.')
        setEditing(false)
      }
    } catch {
      toast.error('Update Failed', 'Could not update profile information.')
    } finally {
      setSaving(false)
    }
  }

  const userDisplayName = fullName || profile?.full_name || email.split('@')[0] || 'Resident Citizen'
  const avatarLetter = userDisplayName.charAt(0).toUpperCase()

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-16 text-white">
      {/* Top Banner with Background Image Overlay and Handwriting Slogan */}
      <FadeIn direction="up">
        <div className="relative rounded-3xl border border-[#1b4332] overflow-hidden p-6 sm:p-10 shadow-2xl min-h-[160px] flex items-center justify-between bg-gradient-to-r from-[#03150d] via-[#072418] to-[#0d3624]">
          {/* Background Right Graphic Overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 pointer-events-none opacity-80 z-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero_banner.jpg"
              alt="Civic Banner"
              className="w-full h-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#03150d] via-[#072418]/70 to-transparent" />
          </div>

          <div className="relative z-10 space-y-1 max-w-xl">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Your <span className="text-[#34d399]">Profile</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/70 font-medium">
              Manage your personal information and location.
            </p>
          </div>

          {/* Right Handwriting Slogan matching screenshot */}
          <div className="hidden lg:flex flex-col items-end text-right z-10 pr-4">
            <div className="font-handwriting text-2xl sm:text-3xl font-bold text-emerald-300 leading-tight drop-shadow-md">
              Cleaner<br />
              Greener<br />
              Happier Nagpur
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 2-Column Split Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT CARD: Profile Information */}
        <FadeIn direction="up" delay={0.05}>
          <div className="rounded-3xl bg-[#04120d] border border-[#1b4332] p-6 shadow-xl flex flex-col justify-between h-full space-y-6">
            <div className="space-y-6">
              {/* Header with Edit Button */}
              <div className="flex items-center justify-between border-b border-[#1b4332]/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                  <h2 className="text-base font-bold text-white">Profile Information</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-1.5 rounded-full bg-[#081f16] border border-[#1b4332] hover:bg-[#0d2a1f] text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit size={13} />
                  <span>{editing ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              {/* Avatar + Verified Citizen Badge */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-3xl flex items-center justify-center shadow-xl border-2 border-blue-400/40">
                    {avatarLetter}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#071711] border border-blue-400/60 flex items-center justify-center text-blue-400">
                    <User size={14} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white">{userDisplayName}</h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 size={13} /> Verified Citizen
                  </span>
                </div>
              </div>

              {/* Full Name & Email Inputs / Displays */}
              <div className="space-y-4 pt-2">
                {/* Full Name Field */}
                <div className="rounded-2xl bg-[#061811] border border-[#1b4332] p-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Full Name</span>
                    {editing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-[#081f16] border border-[#1b4332] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-white truncate mt-0.5">{userDisplayName}</p>
                    )}
                  </div>
                </div>

                {/* Email Address Field */}
                <div className="rounded-2xl bg-[#061811] border border-[#1b4332] p-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Email Address</span>
                    <p className="text-xs font-bold text-white truncate mt-0.5">{email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* RIGHT CARD: Current Location */}
        <FadeIn direction="up" delay={0.1}>
          <div className="rounded-3xl bg-[#04120d] border border-[#1b4332] p-6 shadow-xl flex flex-col justify-between h-full space-y-6">
            <div className="space-y-6">
              {/* Header with Location Active Pill */}
              <div className="flex items-center justify-between border-b border-[#1b4332]/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <MapPin size={18} />
                  </div>
                  <h2 className="text-base font-bold text-white">Current Location</h2>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Location Active</span>
                </span>
              </div>

              {/* Main Location Box with Update Button */}
              <div className="rounded-2xl bg-[#061811] border border-[#1b4332] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#00875a]/30 border border-[#00a36c]/40 text-[#34d399] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {location?.address || 'Agne Layout, Nagpur, Maharashtra'}
                    </h3>
                    <p className="text-[11px] text-emerald-200/70 leading-normal">
                      This is your current detected location. It helps us suggest nearby issues and improve accuracy.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="px-4 py-2.5 rounded-full bg-[#00875a] hover:bg-[#00a36c] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
                >
                  <RefreshCw size={14} />
                  <span>Update Location</span>
                </button>
              </div>

              {/* Info Banner at Bottom */}
              <div className="rounded-2xl bg-[#081d15] border border-[#1b4332] p-4 flex items-start gap-3 text-xs text-emerald-200/70">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                  <Info size={14} />
                </div>
                <p>
                  Your location is only used to improve your experience and is not shared publicly.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Account Settings Card matching screenshot */}
      <FadeIn direction="up" delay={0.15}>
        <div className="rounded-3xl bg-[#04120d] border border-[#1b4332] p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-[#1b4332]/60 pb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Shield size={18} />
            </div>
            <h2 className="text-base font-bold text-white">Account Settings</h2>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Change Password Option */}
            <div className="flex-1 rounded-2xl bg-[#061811] border border-[#1b4332] p-4 flex items-center justify-between cursor-pointer hover:border-emerald-600/60 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Change Password</h3>
                  <p className="text-[11px] text-slate-400">Keep your account secure</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </div>

            {/* Logout Red Button matching screenshot */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="lg:w-72 p-4 rounded-2xl bg-[#2a1215] border border-rose-900/60 hover:bg-[#38161a] transition-all flex items-center justify-between cursor-pointer group shrink-0 disabled:opacity-50"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <LogOut size={18} />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-bold text-rose-400 group-hover:text-rose-300">Logout</h3>
                  <p className="text-[11px] text-rose-300/60">Sign out from your account</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Bottom Footer matching screenshot */}
      <div className="pt-6 border-t border-[#1b4332]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <p className="flex items-center gap-1.5 font-medium">
          <span>Building a Cleaner, Greener, Happier Nagpur</span>
          <span className="text-emerald-400">♡</span>
        </p>

        <div className="flex items-center gap-4 text-slate-400 font-medium text-[11px]">
          <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          <span>|</span>
          <span className="hover:text-white cursor-pointer">Terms of Service</span>
          <span>|</span>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Location Update Modal */}
      <LocationUpdateModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onUpdated={(loc) => setLocation(loc)}
      />
    </div>
  )
}
