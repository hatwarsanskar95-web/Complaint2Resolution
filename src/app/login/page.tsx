'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Leaf,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  UserPlus,
  Camera,
  MapPin,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/context/ToastContext'
import { formatAuthError } from '@/lib/auth-errors'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberDevice, setRememberDevice] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  async function handleForgotPassword() {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      const msg = 'Please enter your email address to receive password reset instructions.'
      setError(msg)
      toast.warning('Email Required', msg)
      return
    }
    setError(null)
    setResetMessage(null)
    const toastId = toast.loading('Sending reset link...', `Sending password reset instructions to ${cleanEmail}`)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (resetErr) {
        const friendlyMsg = formatAuthError(resetErr)
        setError(friendlyMsg)
        toast.update(toastId, {
          type: 'error',
          title: 'Password Reset Failed',
          message: friendlyMsg,
        })
      } else {
        const successMsg = `Password reset link sent to ${cleanEmail}. Please check your email inbox.`
        setResetMessage(successMsg)
        toast.update(toastId, {
          type: 'success',
          title: 'Password Reset Sent',
          message: 'Check your email inbox for password reset instructions.',
        })
      }
    } catch (err) {
      const errMsg = formatAuthError(err)
      setError(errMsg)
      toast.update(toastId, {
        type: 'error',
        title: 'Password Reset Error',
        message: errMsg,
      })
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResetMessage(null)

    const cleanEmail = email.trim().toLowerCase()

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (signInError) {
        const friendlyMsg = formatAuthError(signInError)
        setError(friendlyMsg)
        toast.error('Sign In Failed', friendlyMsg)
        setLoading(false)
        return
      }

      // Check user role from profile / metadata
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single()

      const role = (profile?.role || data.user?.user_metadata?.role || 'citizen').toLowerCase()

      toast.success('Signed In Successfully', `Welcome back, ${profile?.full_name || 'Citizen'}!`)

      if (role === 'officer') {
        router.push('/officer/dashboard')
      } else if (role === 'dept_admin' || role === 'super_admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/citizen/dashboard')
      }
    } catch (err) {
      const errMsg = formatAuthError(err)
      setError(errMsg)
      toast.error('Sign In Error', errMsg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050C0A] text-slate-100 flex flex-col justify-between overflow-x-hidden relative font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen w-full">
        {/* LEFT BRANDING & SCENERY PANEL */}
        <div className="lg:col-span-7 relative p-6 sm:p-10 lg:p-14 flex flex-col justify-between overflow-hidden min-h-[600px] lg:min-h-screen border-r border-emerald-950/40">
          {/* Background Scenery Image & Gradients */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sunset_city.jpg"
            alt="Sunset City Skyline"
            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040807] via-[#040807]/60 to-[#040807]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#040807]/90 via-[#040807]/50 to-transparent" />

          {/* Top Brand Header Row */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Leaf size={22} className="fill-emerald-400/30" />
              </div>
              <div>
                <div className="font-extrabold text-white text-lg tracking-tight flex items-center gap-1.5">
                  Complaint2Resolution
                </div>
                <p className="text-[11px] text-slate-300 font-medium tracking-wide">
                  People Speak. Problems Solve.
                </p>
              </div>
            </div>

            {/* Top Right Tagline */}
            <div className="relative text-right hidden sm:block">
              <span className="font-handwriting text-2xl sm:text-3xl text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] leading-tight block">
                A Cleaner<br />Greener<br />Happier City
              </span>
              <svg className="w-24 h-3 text-emerald-400/70 absolute -bottom-1.5 right-0" viewBox="0 0 100 20" fill="none">
                <path d="M5 15 Q 50 5 95 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Center Display Hero Section */}
          <div className="relative z-10 my-auto py-8 max-w-xl">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08] mb-4"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Your Voice <br />
              Builds a Better <br />
              <span className="text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.6)]">Tomorrow</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mb-10 font-normal">
              Report civic issues, track progress, and see real change in your neighborhood. Together, we can create cleaner, safer and happier communities.
            </p>

            {/* 4 Feature Pills Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/70 border border-emerald-500/25 backdrop-blur-md shadow-xl hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all group">
                <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                  <Camera size={20} />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Report<br />with a Photo</span>
                <span className="text-[10px] text-slate-400 mt-1">Show the issue</span>
              </div>

              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/70 border border-emerald-500/25 backdrop-blur-md shadow-xl hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all group">
                <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                  <MapPin size={20} />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Exact<br />Location</span>
                <span className="text-[10px] text-slate-400 mt-1">Smart GPS geotag</span>
              </div>

              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/70 border border-emerald-500/25 backdrop-blur-md shadow-xl hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all group">
                <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                  <Clock size={20} />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Fast<br />Resolution</span>
                <span className="text-[10px] text-slate-400 mt-1">SLA countdowns</span>
              </div>

              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/70 border border-emerald-500/25 backdrop-blur-md shadow-xl hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all group">
                <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Stronger<br />Together</span>
                <span className="text-[10px] text-slate-400 mt-1">Community action</span>
              </div>
            </div>
          </div>

          {/* Bottom Left Note */}
          <div className="relative z-10 pt-4 border-t border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2 font-handwriting text-2xl sm:text-3xl text-emerald-300 drop-shadow">
              <span>Small Complaints Big Changes</span>
              <Leaf size={20} className="text-emerald-400 fill-emerald-400/40" />
            </div>
          </div>
        </div>

        {/* RIGHT CITIZEN PORTAL FORM PANEL */}
        <div className="lg:col-span-5 relative p-6 sm:p-10 flex flex-col justify-center items-center bg-[#030806]/90 backdrop-blur-xl min-h-screen">
          {/* Back to Home Button */}
          <div className="w-full max-w-md flex justify-end mb-4 z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md backdrop-blur-md"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Glass Card Container */}
          <div className="w-full max-w-md rounded-3xl bg-[#081511]/90 border border-emerald-500/30 p-7 sm:p-9 shadow-[0_0_60px_rgba(16,185,129,0.15)] backdrop-blur-2xl relative z-10">
            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              <span className="text-xs font-bold tracking-widest uppercase text-emerald-400">
                CITIZEN PORTAL
              </span>
            </div>

            {/* Title & Subtitle */}
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Welcome Back, Citizen
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 mb-6 leading-relaxed">
              Access your complaints, track progress, and help build a better city.
            </p>

            {/* Error / Reset Alerts */}
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 leading-relaxed flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {resetMessage && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 leading-relaxed">
                {resetMessage}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {/* Registered Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">
                    Registered Email <span className="text-emerald-400">*</span>
                  </label>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <Check size={12} /> Verified Citizen
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
                  <input
                    id="citizen-login-email"
                    type="email"
                    className="w-full pl-10 pr-24 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <span className="absolute right-3 px-2.5 py-1 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#12242e] text-cyan-300 border border-cyan-800/60 shadow-sm pointer-events-none">
                    CITIZEN
                  </span>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">Password</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
                  <input
                    id="citizen-login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all font-mono"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Checkbox & Secure Login Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Remember this device for 30 days</span>
                </label>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-semibold">
                  <Shield size={12} className="text-emerald-400" /> Secure Login
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="citizen-login-submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Citizen Portal</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Signup Redirect Box */}
            <div className="mt-6 p-3.5 px-5 rounded-full bg-slate-950/80 border border-emerald-900/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <UserPlus size={15} className="text-emerald-400" />
                <span>New to Complaint2Resolution?</span>
              </div>
              <Link href="/signup" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors flex items-center gap-1">
                Create Account →
              </Link>
            </div>

            {/* Card Footer Security Note */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Leaf size={12} className="text-emerald-400 fill-emerald-400/30" />
                Your data is secure and protected
              </span>
              <span>Powered by People. Driven by Change.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
