import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Clock, ShieldAlert, Building2, User, ExternalLink, CheckCircle2 } from 'lucide-react'
import { Complaint, STATUS_LABELS, PRIORITY_LABELS, getSlaStatus, ComplaintStatus } from '@/lib/types'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

export default async function AdminEscalationsPage() {
  const adminCtx = await getAdminContext()
  if (!adminCtx) redirect('/admin/login')

  const supabase = await createClient()

  // Fetch complaints requiring escalation attention or nearing/breaching SLA
  const { data: complaints } = await supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .or('status.eq.HUMAN_REVIEW_REQUIRED,status.eq.DISPUTED,status.eq.REOPENED,priority.eq.CRITICAL')
    .order('created_at', { ascending: false })

  const list = (complaints ?? []) as (Complaint & { departments?: { name: string; code: string } })[]

  const humanReviewCount = list.filter((c) => c.status === 'HUMAN_REVIEW_REQUIRED').length
  const disputedCount = list.filter((c) => ['DISPUTED', 'REOPENED'].includes(c.status)).length
  const criticalCount = list.filter((c) => c.priority === 'CRITICAL').length

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <AlertTriangle className="text-rose-400" size={24} /> Escalations &amp; SLA Monitor
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Priority escalations, human review triage queue, and SLA breach management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-rose-950/60 border border-rose-500/30 text-xs text-rose-400 font-semibold font-mono">
              {list.length} Attention Required
            </span>
          </div>
        </div>
      </FadeIn>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl border border-rose-900/40 bg-rose-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-300 font-medium">Critical Safety Hazards</p>
            <p className="text-3xl font-extrabold text-rose-400 mt-1 font-mono">{criticalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-amber-900/40 bg-amber-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-300 font-medium">Human Triage Queue</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-1 font-mono">{humanReviewCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-purple-900/40 bg-purple-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-300 font-medium">Disputed / Reopened</p>
            <p className="text-3xl font-extrabold text-purple-400 mt-1 font-mono">{disputedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Escalations List */}
      {list.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-card rounded-2xl border border-slate-800">
          <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-slate-200">Zero active escalations</p>
          <p className="text-xs text-slate-500 mt-1">All complaints are progressing within standard SLA parameters.</p>
        </div>
      ) : (
        <StaggerContainer staggerChildren={0.05} className="flex flex-col gap-4">
          {list.map((c) => {
            const { percent, label, hoursLeft } = getSlaStatus(c.sla_deadline, c.sla_start_time)
            const isBreached = label === 'breached'

            return (
              <StaggerItem key={c.id}>
                <div className={`p-5 rounded-xl glass-card border flex flex-col gap-3 transition-all ${
                  isBreached
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : c.priority === 'CRITICAL'
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <code className="text-xs font-mono font-bold text-rose-400 bg-slate-900/90 px-2 py-0.5 rounded border border-rose-900/40">
                        {c.permanent_id}
                      </code>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Level {c.priority === 'CRITICAL' ? '3: Central Authority' : '2: Department Triage'}
                      </span>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>
                        {STATUS_LABELS[c.status as ComplaintStatus] ?? c.status}
                      </span>
                      <span className={`badge badge-${c.priority.toLowerCase()}`}>
                        {PRIORITY_LABELS[c.priority as keyof typeof PRIORITY_LABELS] ?? c.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${isBreached ? 'text-rose-400' : 'text-amber-400'}`}>
                        {isBreached ? 'SLA BREACHED' : `${hoursLeft}h remaining`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-200">
                    {c.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Building2 size={13} className="text-blue-400" />
                        {c.departments?.name || 'Unassigned Dept'}
                      </span>
                      <span>·</span>
                      <span>{c.address}</span>
                    </div>

                    <Link
                      href={`/track?id=${c.permanent_id}`}
                      target="_blank"
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      Inspect Public Tracker <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      )}
    </div>
  )
}
