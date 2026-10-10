import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Complaint, ComplaintImage, ComplaintStatusHistory, ComplaintAiAnalysis } from '@/lib/types'
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/officer/login')

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

  // Phase 18 — Log SLA threshold events server-side when officer opens this complaint
  await checkAndLogSlaThresholds(complaint.id, complaint.sla_deadline, complaint.sla_start_time)

  const complaintId = complaint.id

  const [{ data: images }, { data: history }, { data: aiAnalysis }] = await Promise.all([
    supabase.from('complaint_images').select('*').eq('complaint_id', complaintId).order('created_at'),
    supabase.from('complaint_status_history').select('*').eq('complaint_id', complaintId).order('created_at'),
    supabase.from('complaint_ai_analysis').select('*').eq('complaint_id', complaintId).maybeSingle(),
  ])

  return (
    <OfficerComplaintDetailClient
      complaint={complaint as Complaint}
      images={(images ?? []) as ComplaintImage[]}
      timeline={(history ?? []) as ComplaintStatusHistory[]}
      ai={aiAnalysis as ComplaintAiAnalysis | null}
      officerId={user.id}
    />
  )
}
