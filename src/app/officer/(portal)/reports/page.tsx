import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { FadeIn } from '@/components/ui/motion'

export default async function OfficerReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/officer/login')

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <FadeIn direction="up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <BarChart3 className="text-emerald-400" size={24} /> My Officer Performance
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Personal resolution metrics, SLA compliance, and operational summary.
          </p>
        </div>
      </FadeIn>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#09120d] border border-slate-800">
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">92%</p>
          <p className="text-xs text-slate-400 mt-1">SLA Compliance Rate</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#09120d] border border-slate-800">
          <p className="text-3xl font-extrabold text-white font-mono">18</p>
          <p className="text-xs text-slate-400 mt-1">Total Verified Resolves</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#09120d] border border-slate-800">
          <p className="text-3xl font-extrabold text-white font-mono">2.4 days</p>
          <p className="text-xs text-slate-400 mt-1">Avg Resolution Time</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#09120d] border border-slate-800">
          <p className="text-3xl font-extrabold text-white font-mono">1</p>
          <p className="text-xs text-slate-400 mt-1">Reopened Tickets</p>
        </div>
      </div>
    </div>
  )
}
