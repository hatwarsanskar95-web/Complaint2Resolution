import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Clock, Calendar, User, Building2,
  CheckCircle2, AlertCircle, AlertTriangle, Info
} from 'lucide-react'
import {
  Complaint, ComplaintImage, ComplaintStatusHistory,
  ComplaintAiAnalysis, STATUS_LABELS, PRIORITY_LABELS, getSlaStatus
} from '@/lib/types'

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
    </span>
  )
}

function SlaSection({ complaint }: { complaint: Complaint }) {
  const { percent, label, hoursLeft } = getSlaStatus(complaint.sla_deadline, complaint.sla_start_time)
  if (!complaint.sla_deadline) return null

  const labelColors: Record<'normal' | 'reminder' | 'warning' | 'critical' | 'breached', string> = {
    normal: 'text-[hsl(152,69%,60%)]',
    reminder: 'text-[hsl(152,69%,60%)]',
    warning: 'text-[hsl(40,96%,65%)]',
    critical: 'text-[hsl(25,95%,70%)]',
    breached: 'text-[hsl(0,84%,72%)]',
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock size={15} />
          SLA Status
        </div>
        <span className={`text-sm font-bold ${labelColors[label]}`}>
          {label === 'breached' ? 'BREACHED' : `${hoursLeft}h remaining`}
        </span>
      </div>
      <div className="sla-bar">
        <div className={`sla-bar-fill sla-${label}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span>Started {new Date(complaint.sla_start_time!).toLocaleDateString('en-IN')}</span>
        <span>Deadline {new Date(complaint.sla_deadline).toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: complaint } = await supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .eq('id', id)
    .single()

  if (!complaint) notFound()
  if (complaint.citizen_id !== user.id) redirect('/citizen/dashboard')

  const [{ data: images }, { data: history }, { data: aiAnalysis }] = await Promise.all([
    supabase.from('complaint_images').select('*').eq('complaint_id', id).order('created_at'),
    supabase.from('complaint_status_history').select('*').eq('complaint_id', id).order('created_at'),
    supabase.from('complaint_ai_analysis').select('*').eq('complaint_id', id).single(),
  ])

  const c = complaint as Complaint
  const imgs = (images ?? []) as ComplaintImage[]
  const timeline = (history ?? []) as ComplaintStatusHistory[]
  const ai = aiAnalysis as ComplaintAiAnalysis | null
  const originalImg = imgs.find(i => i.image_type === 'original')

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in-up">
      {/* Back */}
      <Link href="/citizen/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <code className="text-lg font-bold gradient-text">{c.permanent_id}</code>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={c.status} />
            <span className={`badge badge-${c.priority.toLowerCase()}`}>{PRIORITY_LABELS[c.priority]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Calendar size={14} />
          {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="md:col-span-3 flex flex-col gap-5">
          {/* Photo */}
          {originalImg && (
            <div className="glass-card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalImg.image_url}
                alt="Complaint photo"
                className="w-full max-h-72 object-cover"
              />
              <div className="px-4 py-3 text-xs text-[var(--text-muted)]">Original complaint photo</div>
            </div>
          )}

          {/* Description */}
          <div className="glass-card p-5 flex flex-col gap-2">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-semibold">Your Description</p>
            <p className="text-sm leading-relaxed">{c.description}</p>
          </div>

          {/* Location */}
          <div className="glass-card p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin size={15} className="text-[var(--brand-primary)]" /> Location
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{c.address}</p>
            <p className="text-xs text-[var(--text-muted)]">{c.latitude.toFixed(6)}, {c.longitude.toFixed(6)}</p>
          </div>

          {/* AI Analysis */}
          {ai && (
            <div className="glass-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Info size={15} className="text-[var(--brand-accent)]" /> AI Analysis
                </p>
                <span className="text-xs text-[var(--text-muted)]">
                  Confidence: {Math.round((ai.confidence ?? 0) * 100)}%
                </span>
              </div>
              {ai.summary && <p className="text-sm text-[var(--text-secondary)]">{ai.summary}</p>}
              {ai.recommended_actions && ai.recommended_actions.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-semibold mb-2">Recommended Actions</p>
                  <ul className="flex flex-col gap-1.5">
                    {(ai.recommended_actions as string[]).map((action: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={13} className="text-[var(--brand-success)] mt-0.5 shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 flex flex-col gap-5">
          {/* Complaint Info */}
          <div className="glass-card p-5 flex flex-col gap-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-semibold">Details</p>
            <div className="flex flex-col gap-3">
              {[
                { icon: <Building2 size={14} />, label: 'Department', value: (c as { departments?: { name: string } }).departments?.name ?? '—' },
                { icon: <AlertTriangle size={14} />, label: 'Category', value: `${c.category} › ${c.subcategory}` },
                { icon: <User size={14} />, label: 'Officer', value: c.assigned_officer_id ? 'Assigned' : 'Pending Assignment' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5">
                  <span className="text-[var(--brand-primary)] mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA */}
          <SlaSection complaint={c} />

          {/* Pending Verification CTA */}
          {c.status === 'CITIZEN_VERIFICATION' && (
            <div className="glass-card p-5 flex flex-col gap-3 border border-[hsla(40,96%,53%,0.25)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(40,96%,65%)]">
                <AlertCircle size={16} /> Action Required
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                The officer has resolved your complaint. Please confirm if the issue has been fixed.
              </p>
              <Link href={`/citizen/complaints/${id}/verify`} className="btn-primary text-sm text-center">
                Verify Resolution
              </Link>
            </div>
          )}

          {/* Timeline */}
          <div className="glass-card p-5 flex flex-col gap-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-semibold">Status Timeline</p>
            <div className="flex flex-col gap-3">
              {timeline.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 ${i === timeline.length - 1 ? 'bg-[var(--brand-primary)]' : 'bg-[var(--bg-border)]'}`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-[var(--bg-border)] mt-1" />}
                  </div>
                  <div className="pb-3 flex flex-col gap-0.5">
                    <p className="text-xs font-semibold">
                      {STATUS_LABELS[entry.new_status] ?? entry.new_status}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(entry.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
