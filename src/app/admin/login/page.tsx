'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Building2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      const role = data.user?.user_metadata?.role ?? 'citizen'

      if (role !== 'dept_admin' && role !== 'super_admin') {
        await supabase.auth.signOut()
        setError('Access Denied: This portal is strictly restricted to Department Administrators and Central Authority.')
        setLoading(false)
        return
      }

      router.push('/admin/dashboard')
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred during sign in.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-base)]">
      <div className="glass-card w-full max-w-md p-8 animate-fade-in-up border-[hsla(220,80%,55%,0.2)]">
        {/* Header / Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[hsl(220,90%,55%)] to-[hsl(262,80%,55%)] flex items-center justify-center shadow-[var(--shadow-glow-blue)]">
            <Building2 size={26} className="text-white" />
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[hsla(220,90%,55%,0.12)] border border-[hsla(220,90%,55%,0.25)] text-xs text-[hsl(220,90%,75%)] font-semibold mb-2">
              <ShieldCheck size={12} /> Municipal Administration
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Admin Portal
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Sign in to manage departments, officers, and civic accountability
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-[hsla(0,84%,60%,0.1)] border border-[hsla(0,84%,60%,0.25)] text-sm text-[hsl(0,84%,75%)] mb-5 leading-relaxed">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Administrative Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="admin-email"
                type="email"
                className="input-field pl-10"
                placeholder="admin@municipality.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="admin-login-submit"
            disabled={loading}
            className="btn-primary mt-2 py-3"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Authenticating…</>
            ) : (
              <>Access Admin Dashboard <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Other Portals Switcher */}
        <div className="border-t border-[var(--bg-border)] mt-7 pt-4 flex justify-between items-center text-xs text-[var(--text-muted)]">
          <span>Other portals:</span>
          <div className="flex gap-3">
            <Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors">
              Citizen Portal →
            </Link>
            <Link href="/officer/login" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors">
              Officer Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
