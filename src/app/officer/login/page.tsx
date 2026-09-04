'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, UserCog } from 'lucide-react'

export default function OfficerLoginPage() {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    const role = data.user?.user_metadata?.role ?? 'citizen'
    if (role !== 'officer' && role !== 'dept_admin' && role !== 'super_admin') {
      await supabase.auth.signOut()
      setError('This portal is for officers only. Please use the citizen login.')
      setLoading(false)
      return
    }
    if (role === 'dept_admin' || role === 'super_admin') router.push('/admin/dashboard')
    else router.push('/officer/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 animate-fade-in-up">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-accent)] to-[hsl(220,90%,56%)] flex items-center justify-center shadow-[var(--shadow-glow-purple)]">
            <UserCog size={22} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Officer Portal</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Sign in to access your complaint queue</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-lg bg-[hsla(0,84%,60%,0.1)] border border-[hsla(0,84%,60%,0.2)] text-sm text-[hsl(0,84%,72%)]">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Official Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input id="officer-email" type="email" className="input-field pl-9" placeholder="officer@municipality.gov.in"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input id="officer-password" type={showPassword ? 'text' : 'password'} className="input-field pl-9 pr-10"
                placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" id="officer-login-submit" disabled={loading} className="btn-primary mt-2 py-3">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="border-t border-[var(--bg-border)] mt-6 pt-4 flex justify-center gap-4 text-xs">
          <a href="/login" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors">Citizen Login →</a>
          <a href="/admin/login" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors">Admin Login →</a>
        </div>
      </div>
    </div>
  )
}
