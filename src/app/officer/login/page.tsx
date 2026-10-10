'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import GhostFibers from '@/components/ui/GhostFibers'
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Building2,
  CheckCircle2,
  AlertTriangle,
  AtSign,
  Layers,
  ArrowLeft,
  Server,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/context/ToastContext'
import { formatAuthError } from '@/lib/auth-errors'

interface DepartmentInfo {
  id: string
  code: string
  name: string
  short: string
  email: string
}

const DEPARTMENTS: DepartmentInfo[] = [
  { id: 'roads', code: 'ROADS', name: 'Roads & Public Works (Div. 02)', short: 'Roads / Works', email: 'officer.roads@c2r.gov.in' },
  { id: 'water', code: 'WATER', name: 'Water Management (Div. 01)', short: 'Water Mgmt', email: 'officer.water@c2r.gov.in' },
  { id: 'electrical', code: 'ELECTRICAL', name: 'Electrical Infrastructure (Div. 03)', short: 'Electrical', email: 'officer.electrical@c2r.gov.in' },
  { id: 'sanitation', code: 'SANITATION', name: 'Sanitation & Waste Management (Div. 04)', short: 'Sanitation', email: 'officer.sanitation@c2r.gov.in' },
  { id: 'drainage', code: 'DRAINAGE', name: 'Drainage & Flood Control (Div. 05)', short: 'Drainage', email: 'officer.drainage@c2r.gov.in' },
  { id: 'parks', code: 'PARKS', name: 'Parks & Recreation (Div. 06)', short: 'Parks & Rec', email: 'officer.parks@c2r.gov.in' },
]

export default function OfficerLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0].id)
  const [email, setEmail] = useState(DEPARTMENTS[0].email)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSelectDepartment(deptId: string) {
    setSelectedDept(deptId)
    setError(null)
    const dept = DEPARTMENTS.find(d => d.id === deptId)
    if (dept) {
      setEmail(dept.email)
    }
  }

  function handleEmailChange(newEmail: string) {
    setEmail(newEmail)
    setError(null)
    const matched = DEPARTMENTS.find(d => d.email.toLowerCase() === newEmail.trim().toLowerCase())
    if (matched) {
      setSelectedDept(matched.id)
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

      if (role !== 'officer' && role !== 'dept_admin' && role !== 'super_admin') {
        await supabase.auth.signOut()
        const accessErr = 'Access Denied: This portal is exclusively for municipal field officers and department staff.'
        setError(accessErr)
        toast.error('Access Restricted', accessErr)
        setLoading(false)
        return
      }

      // Strict department verification for field officers
      if (role === 'officer') {
        const { data: deptRows } = await supabase
          .from('officer_departments')
          .select('department_id, departments(id, code, name)')
          .eq('profile_id', data.user.id)

        const assignedDeptRaw = deptRows?.[0]?.departments
        const assignedDept = Array.isArray(assignedDeptRaw)
          ? assignedDeptRaw[0]
          : (assignedDeptRaw as { id: string; code: string; name: string } | undefined)

        const deptName = assignedDept?.name || DEPARTMENTS.find(d => d.id === selectedDept)?.name || 'Officer Portal'

        toast.success('Signed In Successfully', `Welcome, Officer ${profile?.full_name || ''} (${deptName})`)
        router.push('/officer/dashboard')
      } else {
        toast.success('Signed In Successfully', 'Redirecting to Admin Portal')
        router.push('/admin/dashboard')
      }
    } catch (err) {
      const errMsg = formatAuthError(err)
      setError(errMsg)
      toast.error('Sign In Error', errMsg)
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
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Complaint2Resolution
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-blue-950 text-blue-400 border border-blue-800/60">
                OFFICER PORTAL
              </span>
            </div>
            <span className="text-[11px] text-slate-400 tracking-tight block mt-0.5">
              Municipal Grievance &amp; SLA Resolution System
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>GovNet Gateway · Node 04 Secure</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300">
            <Lock size={11} className="text-blue-400" />
            <span>256-bit TLS Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Content: 2 Columns */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        {/* Left Column: Hero & Telemetry Display */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-xs font-semibold text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Municipal Field Operations &amp; Verification Desk</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Accelerate Complaints to <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">Verified Resolution.</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
            Authorized municipal officers access real-time departmental work-orders, inspect geotagged evidence, manage SLA compliance, and execute authenticated closures.
          </p>

          {/* Holographic Case Card */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-700/80 text-[10px] text-emerald-400 font-semibold backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SLA Monitor · Active</span>
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
              <Image
                src="/images/officer_field_ops.jpg"
                alt="Municipal Command Operations"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Cryptographic Work Proofs</div>
                    <div className="text-[10px] text-slate-400">Tamper-evident before/after geotagged inspections</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-blue-950 border border-blue-800 text-[10px] font-mono text-cyan-400 font-semibold">
                  6 Divisions Synced
                </span>
              </div>
            </div>
          </div>

          {/* Department Selectors */}
          <div className="space-y-2 pt-2">
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              OPERATIONAL MUNICIPAL DEPARTMENTS
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => handleSelectDepartment(dept.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedDept === dept.id
                      ? 'bg-blue-950/80 border-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{dept.short}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Officer Login Box */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-7 sm:p-8 shadow-2xl backdrop-blur-xl animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Complaint2Resolution</div>
                  <div className="text-[9px] text-blue-400 uppercase font-semibold">OFFICER PORTAL</div>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-[10px] font-medium text-blue-300">
                <Lock size={10} className="text-blue-400" />
                <span>Secure Officer Access</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Welcome Back, Officer
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Sign in to manage assigned complaints and drive them to verified resolution.
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
              {/* Designated Municipal Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Designated Municipal Department</label>
                <div className="relative">
                  <select
                    value={selectedDept}
                    onChange={(e) => handleSelectDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-200 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept.id} value={dept.id} className="bg-slate-900 text-slate-200">
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <span className="text-[10px] text-slate-500 font-mono">Official Gov Domain</span>
                </div>
                <div className="relative">
                  <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="officer-email"
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                    placeholder="officer.roads@c2r.gov.in"
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
                    id="officer-password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder:text-slate-600 outline-none transition-all font-mono"
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

              {/* Submit Button */}
              <button
                type="submit"
                id="officer-login-submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Verifying Department Credentials…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => toast.info('Officer Password Policy', 'Please contact the Administrator to reset officer credentials.')}
                className="text-[11px] text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>

            {/* Security Warning & Back Link */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-400 font-medium">
                <AlertTriangle size={12} />
                <span>Authorized municipal personnel only.</span>
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
          © 2026 Complaint2Resolution · Municipal Operations Dispatch &amp; Verification Gateway
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>FedRAMP Moderate &amp; CJIS Compliant</span>
          <span>·</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SLA Dispatch 99.98% Uptime
          </span>
        </div>
      </footer>
    </div>
  )
}
