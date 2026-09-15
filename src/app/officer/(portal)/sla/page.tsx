import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { Complaint, STATUS_LABELS, getSlaStatus } from '@/lib/types'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

export default async function OfficerSlaTrackerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/officer/login')

  const { data: complaints } = await supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .not('status', 'eq', 'CLOSED')
    .order('sla_deadline', { ascending: true })

  const list = (complaints ?? []) as Complaint[]

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Clock className="text-amber-400" size={24} /> SLA Urgency Tracker
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Prioritized queue based on remaining SLA deadline hours. Address urgent tickets first.
            </p>
          </div>
        </div>
      </FadeIn>

      <StaggerContainer staggerChildren={0.05} className="flex flex-col gap-3">
        {list.map((c) => {
          const { percent, label, hoursLeft } = getSlaStatus(c.sla_deadline, c.sla_start_time)
          return (
            <StaggerItem key={c.id}>
              <Link
                href={`/officer/complaints/${c.id}`}
                className="p-5 rounded-2xl bg-[#09120d] border border-slate-800 hover:border-amber-500/40 flex flex-col gap-3 transition-all duration-200 group no-underline"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      {c.permanent_id}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{c.category}</span>
                  </div>
                  <span className={`text-xs font-extrabold font-mono ${label === 'breached' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {label === 'breached' ? 'BREACHED' : `${hoursLeft}h remaining`}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-1">{c.description}</p>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${label === 'breached' ? 'bg-rose-500' : label === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </Link>
            </StaggerItem>
          )
        })}
      </StaggerContainer>
    </div>
  )
}
