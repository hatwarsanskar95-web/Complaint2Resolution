import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Filter, Search, Clock, ArrowRight, ShieldCheck } from 'lucide-react'
import { Complaint, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types'
import { getOfficerContext } from '@/lib/auth'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

export default async function OfficerComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()
  const ctx = await getOfficerContext()
  if (!ctx) redirect('/officer/login')

  let query = supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .order('created_at', { ascending: false })

  if (['officer', 'dept_admin'].includes(ctx.role)) {
    if (ctx.departmentId) {
      query = query.or(`department_id.eq.${ctx.departmentId},assigned_officer_id.eq.${ctx.id}`)
    } else {
      query = query.eq('assigned_officer_id', ctx.id)
    }
  }

  const { data: complaints } = await query

  const all = (complaints ?? []) as Complaint[]

  const filtered = status
    ? all.filter((c) => c.status?.toLowerCase() === status.toLowerCase())
    : all

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <FileText className="text-emerald-400" size={24} /> My Complaints Queue
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Authorized department complaint list. Click any complaint to open work area.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-400 font-semibold">
              {all.length} Assigned Tickets
            </span>
          </div>
        </div>
      </FadeIn>

      {/* Filter Pills */}
      <FadeIn direction="up" delay={0.05}>
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#15231c]">
          {['All', 'Assigned', 'In_Progress', 'Resolution_Submitted', 'Closed'].map((st) => {
            const isSelected = (!status && st === 'All') || status?.toLowerCase() === st.toLowerCase()
            return (
              <Link
                key={st}
                href={st === 'All' ? '/officer/complaints' : `/officer/complaints?status=${st}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-[#0b1410] text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </Link>
            )
          })}
        </div>
      </FadeIn>

      {/* Complaints Queue List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#09120d] rounded-2xl border border-slate-800">
          <p className="text-sm font-semibold">No complaints found for this status</p>
        </div>
      ) : (
        <StaggerContainer staggerChildren={0.05} className="flex flex-col gap-3">
          {filtered.map((c) => (
            <StaggerItem key={c.id}>
              <Link
                href={`/officer/complaints/${c.id}`}
                className="p-4 rounded-2xl bg-[#09120d] border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between gap-4 transition-all duration-200 group no-underline"
              >
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      {c.permanent_id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {PRIORITY_LABELS[c.priority] ?? c.priority}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                    {c.description}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {c.category} · {c.address}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Handle Ticket <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}
