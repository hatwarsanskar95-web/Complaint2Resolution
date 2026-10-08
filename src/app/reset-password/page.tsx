'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Leaf,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import { toast } from '@/context/ToastContext'
import { formatAuthError } from '@/lib/auth-errors'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [sessionValid, setSessionValid] = useState<boolean | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // 1. Check if error searchParam is present
    const errorParam = searchParams.get('error')
    if (errorParam === 'invalid_link' || errorParam === 'verification_failed') {
      setSessionValid(false)
      setCheckingSession(false)
      return
    }

    // 2. Check Supabase session
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setSessionValid(true)
        } else {
          // Listen briefly for auth state change (e.g. recovery PKCE exchange)
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
              setSessionValid(true)
            }
          })
          
          setTimeout(async () => {
            const { data: { session: finalSession } } = await supabase.auth.getSession()
            setSessionValid(!!finalSession)
            setCheckingSession(false)
            subscription.unsubscribe()
          }, 800)
          return
        }
      } catch {
        setSessionValid(false)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [searchParams, supabase.auth])

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.'
      setError(msg)
      toast.warning('Password Policy', msg)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match. Please re-enter your new password.'
      setError(msg)
      toast.error('Password Mismatch', msg)
      setLoading(false)
      return
    }

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateErr) {
        const friendlyMsg = formatAuthError(updateErr)
        setError(friendlyMsg)
        toast.error('Reset Failed', friendlyMsg)
        setLoading(false)
        return
      }

      setSuccess(true)
      toast.success('Password Updated', 'Your password has been reset successfully.')
      setLoading(false)
    } catch (err) {
      const errMsg = formatAuthError(err)
      setError(errMsg)
      toast.error('Reset Error', errMsg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050C0A] text-slate-100 flex flex-col justify-center items-center p-4 relative font-sans">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md rounded-3xl bg-[#081511]/90 border border-emerald-500/30 p-7 sm:p-9 shadow-[0_0_60px_rgba(16,185,129,0.15)] backdrop-blur-2xl relative z-10">
        <div className="flex items-center gap-3 mb-6 border-b border-emerald-500/20 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Leaf size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">Complaint2Resolution</h1>
            <p className="text-xs text-slate-400 mt-0.5">Password Recovery</p>
          </div>
        </div>

        {checkingSession ? (
          <div className="flex flex-col items-center text-center gap-3 py-8">
            <Loader2 size={32} className="animate-spin text-emerald-400" />
            <p className="text-xs text-slate-400">Verifying password reset link...</p>
          </div>
        ) : sessionValid === false ? (
          /* Expired / Invalid Session State */
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Reset Link Invalid or Expired</h2>
              <p className="text-xs text-slate-300">
                Your password reset link is invalid or has expired. Please request a new reset link.
              </p>
            </div>
            <Link
              href="/login"
              className="mt-3 w-full py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <RefreshCw size={15} />
              <span>Request New Reset Link</span>
            </Link>
          </div>
        ) : success ? (
          /* Password Reset Success State */
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">Password Updated</h2>
              <p className="text-xs text-slate-300">
                Your password has been reset successfully. You can now log in using your new credentials.
              </p>
            </div>
            <Link
              href="/login"
              className="mt-3 w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Login</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Set New Password Form */
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Reset Password</h2>
              <p className="text-xs text-slate-400">Enter and confirm your new account password below.</p>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 block">New Password</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all font-mono"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 block">Confirm New Password</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all font-mono"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating Password…</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
