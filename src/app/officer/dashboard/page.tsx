import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import { Complaint, ComplaintStatus, STATUS_LABELS, PRIORITY_LABELS, getSlaStatus } from '@/lib/types'

function SlaBar({ complaint }: { complaint: Complaint }) {
  const { percent, label, hoursLeft } = getSlaStatus(complaint.sla_deadline, complaint.sla_start_time)
  if (!complaint.sla_deadline) return null
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1"><Clock size={11} /> SLA</span>
        <span className={label === 'breached' ? 'text-[hsl(0,84%,72%)] font-bold' : ''}>
          {label === 'breached' ? 'BREACHED' : `${hoursLeft}h left`}
        </span>
      </div>
      <div className="sla-bar">
        <div className={`sla-bar-fill sla-${label}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

const QUEUE_TABS: { status: ComplaintStatus[]; label: string; color: string }[] = [
  { status: ['RECEIVED'], label: 'New', color: 'text-[hsl(200,80%,70%)]' },
  { status: ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'], label: 'Active', color: 'text-[hsl(40,96%,65%)]' },
  { status: ['RESOLUTION_SUBMITTED', 'AI_VERIFICATION', 'CITIZEN_VERIFICATION'], label: 'Pending', color: 'text-[hsl(262,80%,75%)]' },
  { status: ['CLOSED'], label: 'Closed', color: 'text-[hsl(152,69%,60%)]' },
]

export default async function OfficerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/officer/login')

  const role = user.user_metadata?.role ?? 'citizen'
  if (!['officer', 'dept_admin', 'super_admin'].includes(role)) redirect('/login')

  const activeTab = QUEUE_TABS.find(t => t.label.toLowerCase() === tab) ?? QUEUE_TABS[0]

  const { data: complaints } = await supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .in('status', activeTab.status)
    .order('sla_deadline', { ascending: true })

  const all = (complaints ?? []) as Complaint[]

  // Count per tab
  const { data: allComplaints } = await supabase
    .from('complaints')
    .select('id, status')

  const counts = QUEUE_TABS.reduce((acc, t) => {
    acc[t.label] = (allComplaints as { id: string; status: string }[] ?? []).filter(
      (c) => t.status.includes(c.status as ComplaintStatus)
    ).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Complaint Queue</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-0.5">Manage assigned complaints with SLA tracking</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-[var(--bg-border)] pb-0">
        {QUEUE_TABS.map(t => (
          <Link
            key={t.label}
            href={`/officer/dashboard?tab=${t.label.toLowerCase()}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab.label === t.label
                ? `border-[var(--brand-primary)] ${t.color}`
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {t.label}
            {counts[t.label] > 0 && (
              <span className="text-xs rounded-full bg-[var(--bg-elevated)] px-1.5 py-0.5 min-w-[20px] text-center">
                {counts[t.label]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Complaints */}
      {all.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center gap-4">
          <CheckCircle2 size={32} className="text-[var(--text-muted)]" />
          <p className="text-[var(--text-secondary)]">No complaints in this queue</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {all.map(complaint => (
            <Link
              key={complaint.id}
              href={`/officer/complaints/${complaint.id}`}
              className="complaint-card no-underline flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs font-mono text-[var(--text-muted)]">{complaint.permanent_id}</code>
                    <span className={`badge badge-${complaint.status.toLowerCase()}`}>
                      {STATUS_LABELS[complaint.status]}
                    </span>
                    <span className={`badge badge-${complaint.priority.toLowerCase()}`}>
                      {PRIORITY_LABELS[complaint.priority]}
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-2">{complaint.description}</p>
                  <p className="text-xs text-[var(--text-muted)]">{complaint.category} · {complaint.address}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] shrink-0">
                  <FileText size={12} />
                  {new Date(complaint.created_at).toLocaleDateString('en-IN')}
                </div>
              </div>
              <SlaBar complaint={complaint} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
