import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Filter, Search, Clock, Building2, ExternalLink, ShieldCheck, MapPin } from 'lucide-react'
import { Complaint, STATUS_LABELS, PRIORITY_LABELS, ComplaintStatus } from '@/lib/types'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; dept?: string }>
}) {
  const adminCtx = await getAdminContext()
  if (!adminCtx) redirect('/admin/login')

  const { status, dept } = await searchParams
  const supabase = await createClient()

  // Fetch departments for filter
  const { data: depts } = await supabase
    .from('departments')
    .select('id, name, code')
    .order('name', { ascending: true })

  // Fetch complaints
  let query = supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .order('created_at', { ascending: false })

  if (adminCtx.isDeptAdmin && adminCtx.departmentId) {
    query = query.eq('department_id', adminCtx.departmentId)
  } else if (dept) {
    query = query.eq('department_id', dept)
  }

  const { data: complaints } = await query
  const all = (complaints ?? []) as (Complaint & { departments?: { name: string; code: string } })[]

  const filtered = status
    ? all.filter((c) => c.status?.toLowerCase() === status.toLowerCase())
    : all

  const totalCount = all.length
  const pendingCount = all.filter((c) => ['SUBMITTED', 'RECEIVED'].includes(c.status)).length
  const inProgressCount = all.filter((c) => ['IN_PROGRESS', 'ASSIGNED', 'REOPENED'].includes(c.status)).length
  const resolvedCount = all.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <FileText className="text-blue-400" size={24} /> Central Complaints Register
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              System-wide complaint monitoring, department allocation, and status management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-xs text-blue-400 font-semibold font-mono">
              {totalCount} Total Complaints
            </span>
          </div>
        </div>
      </FadeIn>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Total Registered</p>
            <p className="text-2xl font-extrabold text-white mt-1 font-mono">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <FileText size={20} />
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Pending Review</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">In Progress</p>
            <p className="text-2xl font-extrabold text-purple-400 mt-1 font-mono">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Resolved / Closed</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">{resolvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <FadeIn direction="up" delay={0.05}>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex gap-2 overflow-x-auto">
            {['All', 'Submitted', 'Received', 'Assigned', 'In_Progress', 'Resolved', 'Closed', 'Disputed'].map((st) => {
              const isSelected = (!status && st === 'All') || status?.toLowerCase() === st.toLowerCase()
              const url = st === 'All' ? '/admin/complaints' : `/admin/complaints?status=${st}${dept ? `&dept=${dept}` : ''}`
              return (
                <Link
                  key={st}
                  href={url}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {st.replace('_', ' ')}
                </Link>
              )
            })}
          </div>
        </div>
      </FadeIn>

      {/* Complaints List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-card rounded-2xl border border-slate-800">
          <FileText size={32} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-300">No complaints found</p>
          <p className="text-xs text-slate-500 mt-1">There are no complaints matching the selected filters in the system.</p>
        </div>
      ) : (
        <StaggerContainer staggerChildren={0.04} className="flex flex-col gap-3">
          {filtered.map((c) => (
            <StaggerItem key={c.id}>
              <div className="p-4 rounded-xl glass-card border border-slate-800/90 hover:border-blue-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all group">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs font-mono font-bold text-cyan-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/60">
                      {c.permanent_id}
                    </code>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>
                      {STATUS_LABELS[c.status as ComplaintStatus] ?? c.status}
                    </span>
                    <span className={`badge badge-${c.priority.toLowerCase()}`}>
                      {PRIORITY_LABELS[c.priority as keyof typeof PRIORITY_LABELS] ?? c.priority}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Building2 size={12} className="text-blue-400" />
                      {c.departments?.name || 'Unassigned Dept'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                    {c.description}
                  </p>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-500" />
                    {c.category} · {c.address}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/track?id=${c.permanent_id}`}
                    target="_blank"
                    className="px-3 py-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 rounded-lg hover:bg-cyan-900/60 transition-colors flex items-center gap-1"
                  >
                    Public Tracker <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}
