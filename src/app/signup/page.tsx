'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Leaf,
  Shield,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  UserPlus,
  RotateCcw,
  Camera,
  MapPin,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/context/ToastContext'
import { formatAuthError } from '@/lib/auth-errors'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false)

  // Password strength calculation
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: 'EMPTY', color: 'text-slate-500' }
    let score = 0
    if (password.length >= 8) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++

    if (score <= 1) return { score: 1, label: 'WEAK', color: 'text-rose-400' }
    if (score <= 2) return { score: 2, label: 'FAIR', color: 'text-amber-400' }
    if (score === 3) return { score: 3, label: 'GOOD', color: 'text-teal-400' }
    return { score: 4, label: 'STRONG', color: 'text-emerald-400' }
  }, [password])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!agree) {
      const msg = 'Please agree to the Civic Charter & Privacy Protocols to proceed.'
      setError(msg)
      toast.warning('Agreement Required', msg)
      setLoading(false)
      return
    }

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.'
      setError(msg)
      toast.warning('Password Policy', msg)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match. Please re-enter your password.'
      setError(msg)
      toast.error('Password Mismatch', msg)
      setLoading(false)
      return
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = fullName.trim()

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: 'citizen',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/verification-success`,
        },
      })

      if (signUpError) {
        const friendlyMsg = formatAuthError(signUpError)
        setError(friendlyMsg)
        toast.error('Registration Failed', friendlyMsg)
        setLoading(false)
        return
      }

      // Check if email verification is required or if session is active
      if (data?.user && !data?.session) {
        setRequiresEmailConfirmation(true)
        setSuccess(true)
        toast.info('Account Created', 'Please check your email to verify your account.')
        setLoading(false)
      } else {
        setRequiresEmailConfirmation(false)
        setSuccess(true)
        toast.success('Account Created Successfully', 'Welcome to Complaint2Resolution! Entering your dashboard...')
        setLoading(false)
        setTimeout(() => {
          router.push('/citizen/dashboard')
        }, 1500)
      }
    } catch (err) {
      const errMsg = formatAuthError(err)
      setError(errMsg)
      toast.error('Registration Error', errMsg)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#050C0A] text-slate-100 relative overflow-hidden font-sans">
        <div className="rounded-3xl bg-[#081511]/90 border border-emerald-500/30 p-8 max-w-md w-full text-center animate-fade-in-up flex flex-col items-center gap-4 shadow-[0_0_60px_rgba(16,185,129,0.2)] relative z-10 backdrop-blur-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]">
            <CheckCircle2 size={32} />
          </div>

          <h2 className="text-2xl font-bold text-white">
            {requiresEmailConfirmation ? 'Verify Your Email' : 'Account Created!'}
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            {requiresEmailConfirmation
              ? `Account created successfully for ${email}. Please check your email to verify your account before signing in.`
              : 'Welcome to Complaint2Resolution! Your civic profile is ready. Redirecting to your dashboard…'}
          </p>

          <div className="w-full pt-4 border-t border-slate-800">
            {requiresEmailConfirmation ? (
              <Link
                href="/login"
                className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                Go to Citizen Login <ArrowRight size={14} />
              </Link>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
                <Loader2 size={16} className="animate-spin" />
                <span>Entering Citizen Portal…</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
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

            <div className="relative text-right hidden sm:block">
              <span className="font-handwriting text-2xl sm:text-3xl text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] leading-tight block">
                Together for a<br />Better City
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
              Join the Movement <br />
              for a Smarter <br />
              <span className="text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.6)]">Community</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mb-10 font-normal">
              Register as a verified citizen to report neighborhood infrastructure issues, track live municipal resolution milestones, and vote on civic priorities.
            </p>

            {/* 4 Feature Pills Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/70 border border-emerald-500/25 backdrop-blur-md shadow-xl hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all group">
                <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                  <Camera size={20} />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Instant<br />Photo Report</span>
                <span className="text-[10px] text-slate-400 mt-1">Direct upload</span>
              </div>

              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/70 border border-emerald-500/25 backdrop-blur-md shadow-xl hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all group">
                <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                  <MapPin size={20} />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Auto GPS<br />Geotag</span>
                <span className="text-[10px] text-slate-400 mt-1">Pinpoint location</span>
              </div>

              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/70 border border-emerald-500/25 backdrop-blur-md shadow-xl hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all group">
                <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                  <Clock size={20} />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Guaranteed<br />SLA Tracking</span>
                <span className="text-[10px] text-slate-400 mt-1">Time-bound fixes</span>
              </div>

              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/70 border border-emerald-500/25 backdrop-blur-md shadow-xl hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all group">
                <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <span className="text-xs font-bold text-white leading-tight">Ward<br />Solidarity</span>
                <span className="text-[10px] text-slate-400 mt-1">Upvote complaints</span>
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

        {/* RIGHT CITIZEN PORTAL SIGNUP FORM PANEL */}
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
                CITIZEN ENROLLMENT
              </span>
            </div>

            {/* Title & Subtitle */}
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Create Citizen Profile
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 mb-6 leading-relaxed">
              Register to submit complaints, receive real-time SMS alerts, and track work orders.
            </p>

            {/* Error Notification */}
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 leading-relaxed flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Full Legal Name <span className="text-emerald-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
                  <input
                    id="citizen-signup-name"
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                    placeholder="e.g. Ramesh Kulkarni"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Email Address <span className="text-emerald-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
                  <input
                    id="citizen-signup-email"
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">
                    Create Password <span className="text-emerald-400">*</span>
                  </label>
                  <span className={`text-[10px] font-bold ${strength.color}`}>
                    STRENGTH: {strength.label}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
                  <input
                    id="citizen-signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all font-mono"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Confirm Password <span className="text-emerald-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
                  <input
                    id="citizen-signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all font-mono"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer mt-0.5"
                    required
                  />
                  <span className="leading-snug text-[11px] text-slate-400">
                    I agree to the <span className="text-emerald-400 underline">Civic Charter</span> &amp; data protection terms for geotagged grievance reporting.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="citizen-signup-submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] mt-3 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Registering Citizen Profile…</span>
                  </>
                ) : (
                  <>
                    <span>Create Citizen Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Login Redirect Box */}
            <div className="mt-6 p-3.5 px-5 rounded-full bg-slate-950/80 border border-emerald-900/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <RotateCcw size={14} className="text-emerald-400" />
                <span>Already registered?</span>
              </div>
              <Link href="/login" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors flex items-center gap-1">
                Sign In →
              </Link>
            </div>

            {/* Security Note */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Shield size={12} className="text-emerald-400" />
                SSL Encrypted &amp; Verified
              </span>
              <span>Civic Action for Cleaner Communities</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
