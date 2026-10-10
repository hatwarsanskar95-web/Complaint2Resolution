import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Complaint, ComplaintImage, ComplaintStatusHistory, ComplaintAiAnalysis } from '@/lib/types'
import { getOfficerContext } from '@/lib/auth'
import OfficerComplaintDetailClient from '@/components/officer/OfficerComplaintDetailClient'
import { checkAndLogSlaThresholds } from '@/lib/services/slaService'

// Phase 17 — Officer Complaint Detail Page with Status State Machine
// Removed auto-transition; now uses explicit Status Action Bar in client

export default async function OfficerComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const ctx = await getOfficerContext()
  if (!ctx) redirect('/officer/login')

  let complaintQuery = supabase
    .from('complaints')
    .select('*, departments(name, code)')

  if (id.startsWith('CR-')) {
    complaintQuery = complaintQuery.eq('permanent_id', id)
  } else {
    complaintQuery = complaintQuery.eq('id', id)
  }

  const { data: complaint } = await complaintQuery.maybeSingle()

  if (!complaint) notFound()

  // Enforce department boundary: officers can ONLY access complaints in their assigned department
  if (['officer', 'dept_admin'].includes(ctx.role)) {
    if (!ctx.departmentId || complaint.department_id !== ctx.departmentId) {
      notFound()
    }
  }

  // Phase 18 — Log SLA threshold events server-side when officer opens this complaint
  await checkAndLogSlaThresholds(complaint.id, complaint.sla_deadline, complaint.sla_start_time)

  const complaintId = complaint.id

  const [{ data: images }, { data: history }, { data: aiAnalysis }, { data: disputeVerification }, { data: resolutionSubmission }] = await Promise.all([
    supabase.from('complaint_images').select('*').eq('complaint_id', complaintId).order('created_at'),
    supabase.from('complaint_status_history').select('*').eq('complaint_id', complaintId).order('created_at'),
    supabase.from('complaint_ai_analysis').select('*').eq('complaint_id', complaintId).maybeSingle(),
    supabase.from('citizen_verifications').select('*').eq('complaint_id', complaintId).eq('is_satisfied', false).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('resolution_submissions').select('*').eq('complaint_id', complaintId).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  return (
    <OfficerComplaintDetailClient
      complaint={complaint as Complaint}
      images={(images ?? []) as ComplaintImage[]}
      timeline={(history ?? []) as ComplaintStatusHistory[]}
      ai={aiAnalysis as ComplaintAiAnalysis | null}
      officerId={ctx.id}
      disputeVerification={(disputeVerification ?? null) as any}
      resolutionSubmission={(resolutionSubmission ?? null) as any}
    />
  )
}
