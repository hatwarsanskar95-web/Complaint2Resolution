'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import GhostFibers from '@/components/ui/GhostFibers'
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Building2,
  Shield,
  ArrowLeft,
  AlertTriangle,
  Server,
  KeyRound,
  CheckCircle2,
  Zap,
  Activity,
  Layers,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/context/ToastContext'
import { formatAuthError } from '@/lib/auth-errors'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [maintainSession, setMaintainSession] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleForgotPassword() {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      toast.info('Admin Password Recovery', 'Enter your admin email address above, then click Forgot Password to receive reset instructions.')
      return
    }
    const toastId = toast.loading('Sending reset link...', `Sending admin password reset instructions to ${cleanEmail}`)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (resetErr) {
        const friendlyMsg = formatAuthError(resetErr)
        toast.update(toastId, {
          type: 'error',
          title: 'Reset Request Failed',
          message: friendlyMsg,
        })
      } else {
        toast.update(toastId, {
          type: 'success',
          title: 'Reset Instructions Sent',
          message: 'Check your government email inbox for security reset link.',
        })
      }
    } catch (err) {
      const errMsg = formatAuthError(err)
      toast.update(toastId, {
        type: 'error',
        title: 'Recovery Error',
        message: errMsg,
      })
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (signInError) {
        const friendlyMsg = formatAuthError(signInError)
        setError(friendlyMsg)
        toast.error('Authentication Failed', friendlyMsg)
        setLoading(false)
        return
      }

      // Fetch verified profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single()

      const role = (profile?.role || data.user?.user_metadata?.role || 'citizen').toLowerCase()

      if (role !== 'dept_admin' && role !== 'super_admin') {
        await supabase.auth.signOut()
        const accessErr = 'You do not have permission to access the Admin Portal.'
        setError(accessErr)
        toast.error('Access Restricted', accessErr)
        setLoading(false)
        return
      }

      toast.success('Root Authority Authenticated', `Welcome, ${profile?.full_name || 'Administrator'}`)
      router.push('/admin/dashboard')
    } catch (err) {
      const errMsg = formatAuthError(err)
      setError(errMsg)
      toast.error('Authentication Error', errMsg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-blue-600 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* GhostFibers Dynamic Background */}
      <GhostFibers
        lineColor="#140E35"
        glowColor="#3437A0"
        speed={0.2}
        scale={2}
        rotation={0}
        rotationSpeed={0.25}
        layers={4}
        waveAmplitude={0.015}
        waveFrequency={3}
        waveSpeed={0.15}
        layerSpeed={0.08}
        twist={0.1}
        twistFrequency={5}
        twistSpeed={1.2}
        lineFrequency={5}
        lineSpacing={2}
        lineSharpness={16}
        glowFalloff={10}
        glowIntensity={1.6}
        brightness={2}
        blueBoost={1.25}
        vignette={0.8}
        grain={0.05}
        dpr={1}
      />

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-md px-6 h-16 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.35)]">
            <span className="font-extrabold text-white text-base">M</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-white leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Complaint2Resolution
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-blue-950 text-blue-400 border border-blue-800/60">
              CENTRAL GOVERNANCE
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>GovSecure Cluster Alpha · Root Node Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300">
            <Lock size={11} className="text-blue-400" />
            <span>256-bit TLS · SHA-512 Signed</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-300">
            <KeyRound size={11} className="text-purple-400" />
            <span>FIDO2 / Hardware Security Enabled</span>
          </div>
        </div>
      </header>

      {/* Main Content: 2 Columns */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        {/* Left Column: Command & Matrix Display */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/50 text-xs font-semibold text-indigo-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Central Municipal Authority · System Oversight Command</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            City-Wide Governance &amp; <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Automated SLA Enforcement
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
            Central Command provides macro-level telemetry, AI triage calibration, department oversight, and real-time SLA escalation management across all municipal zones.
          </p>

          {/* Matrix Card */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-700/80 text-[10px] text-emerald-400 font-semibold backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Matrix Live Feed · 100% Health</span>
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
              <Image
                src="/images/admin_matrix_command.jpg"
                alt="City Governance Command Center"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Gemini 1.5 Flash AI Engine</div>
                    <div className="text-[10px] text-slate-400">Automated classification, SLA tier assignment, and fraud prevention</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-indigo-950 border border-indigo-800 text-[10px] font-mono text-purple-400 font-semibold">
                  Zero Trust Policy
                </span>
              </div>
            </div>
          </div>

          {/* 3 Telemetry Pillars */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md text-center">
              <div className="text-lg font-black text-white font-mono">100%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">SLA Escalation Auto-Enforced</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md text-center">
              <div className="text-lg font-black text-white font-mono">6/6</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Departments Monitored</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md text-center">
              <div className="text-lg font-black text-white font-mono">&lt; 2.4s</div>
              <div className="text-[10px] text-slate-400 mt-0.5">AI Classification Latency</div>
            </div>
          </div>
        </div>

        {/* Right Column: Admin Login Box */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-7 sm:p-8 shadow-2xl backdrop-blur-xl animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Complaint2Resolution</div>
                  <div className="text-[9px] text-indigo-400 uppercase font-semibold">ADMIN PORTAL</div>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-[10px] font-medium text-indigo-300">
                <Lock size={10} className="text-indigo-400" />
                <span>Central Root Access</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Central Governance Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Enter your administrative credentials to manage city-wide civic infrastructure.
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 leading-relaxed flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Admin Email Address</label>
                  <span className="text-[10px] text-slate-500 font-mono">Official Authority Domain</span>
                </div>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="admin-email"
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                    placeholder="admin@c2r.gov.in"
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
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <span className="text-[10px] text-slate-500 font-mono">Hardware Session Bound</span>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all font-mono"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Maintain Session & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={maintainSession}
                    onChange={(e) => setMaintainSession(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Maintain secure session</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="admin-login-submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-[0_0_25px_rgba(79,70,229,0.4)] hover:shadow-[0_0_35px_rgba(79,70,229,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Authenticating Root Authority…</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate &amp; Enter Matrix</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Security Warning & Back Link */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-400 font-medium">
                <AlertTriangle size={12} />
                <span>Restricted to Central Authority &amp; System Administrators.</span>
              </div>
              <div>
                <Link
                  href="/"
                  className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft size={12} />
                  <span>Back to Complaint2Resolution</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050810]/85 backdrop-blur-md py-4 px-6 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
        <div>
          © 2026 Complaint2Resolution · Municipal Central Authority &amp; Governance Matrix
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>Root Node Alpha</span>
          <span>·</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            System SLA Compliance 99.98%
          </span>
        </div>
      </footer>
    </div>
  )
}
