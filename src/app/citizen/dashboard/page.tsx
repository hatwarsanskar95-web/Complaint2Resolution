import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Complaint, ComplaintStatus, STATUS_LABELS, getSlaStatus } from '@/lib/types'

function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function SlaBar({ deadline, start }: { deadline: string | null; start: string | null }) {
  const { percent, label } = getSlaStatus(deadline, start)
  if (!deadline) return null
  return (
    <div className="sla-bar mt-2">
      <div
        className={`sla-bar-fill sla-${label}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-[var(--text-secondary)]">{label}</div>
      </div>
    </div>
  )
}

export default async function CitizenDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: complaints } = await supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .eq('citizen_id', user.id)
    .order('created_at', { ascending: false })

  const all = (complaints as Complaint[]) ?? []
  const active = all.filter(c => !['CLOSED'].includes(c.status))
  const resolved = all.filter(c => c.status === 'CLOSED')
  const pending = all.filter(c => c.status === 'CITIZEN_VERIFICATION')

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            My Complaints
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            Track all your civic complaints in one place
          </p>
        </div>
        <Link href="/citizen/report" className="btn-primary gap-2">
          <PlusCircle size={16} /> File Complaint
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<FileText size={20} className="text-white" />} label="Total" value={all.length} color="bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)]" />
        <StatCard icon={<Clock size={20} className="text-[hsl(40,96%,65%)]" />} label="Active" value={active.length} color="bg-[hsla(40,96%,53%,0.15)]" />
        <StatCard icon={<AlertCircle size={20} className="text-[hsl(0,84%,72%)]" />} label="Needs Action" value={pending.length} color="bg-[hsla(0,84%,60%,0.15)]" />
        <StatCard icon={<CheckCircle2 size={20} className="text-[hsl(152,69%,60%)]" />} label="Resolved" value={resolved.length} color="bg-[hsla(152,69%,43%,0.15)]" />
      </div>

      {/* Pending Action Banner */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-[hsla(40,96%,53%,0.25)] bg-[hsla(40,96%,53%,0.08)] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-[hsl(40,96%,65%)] shrink-0" />
            <div>
              <p className="font-semibold text-sm">Action Required</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {pending.length} complaint{pending.length > 1 ? 's' : ''} awaiting your verification
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Complaints List */}
      {all.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
            <FileText size={24} className="text-[var(--text-muted)]" />
          </div>
          <div>
            <p className="font-semibold">No complaints yet</p>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              File your first complaint to get started
            </p>
          </div>
          <Link href="/citizen/report" className="btn-primary mt-2">
            <PlusCircle size={15} /> File a Complaint
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {all.map((complaint) => (
            <Link
              href={`/citizen/complaints/${complaint.id}`}
              key={complaint.id}
              className="complaint-card flex flex-col gap-3 no-underline"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs text-[var(--text-muted)] font-mono">
                      {complaint.permanent_id}
                    </code>
                    <StatusBadge status={complaint.status} />
                    <span className={`badge badge-${complaint.priority.toLowerCase()}`}>
                      {complaint.priority}
                    </span>
                  </div>
                  <p className="font-medium text-sm line-clamp-2 text-[var(--text-primary)]">
                    {complaint.description}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {complaint.category} · {complaint.subcategory} · {complaint.address}
                  </p>
                </div>
                <div className="text-xs text-[var(--text-muted)] shrink-0 text-right">
                  {new Date(complaint.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </div>
              </div>

              {complaint.sla_deadline && (
                <SlaBar deadline={complaint.sla_deadline} start={complaint.sla_start_time} />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
