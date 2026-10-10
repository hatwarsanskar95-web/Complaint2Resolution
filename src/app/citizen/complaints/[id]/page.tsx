import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import {
  Complaint, ComplaintImage, ComplaintStatusHistory, ComplaintAiAnalysis
} from '@/lib/types'
import ComplaintDetailView from '@/components/citizen/ComplaintDetailView'

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
  if (complaint.citizen_id !== user.id) redirect('/citizen/dashboard')

  const complaintId = complaint.id

  const [{ data: images }, { data: history }, { data: aiAnalysis }, { data: resolutionSubmission }] = await Promise.all([
    supabase.from('complaint_images').select('*').eq('complaint_id', complaintId).order('created_at'),
    supabase.from('complaint_status_history').select('*').eq('complaint_id', complaintId).order('created_at'),
    supabase.from('complaint_ai_analysis').select('*').eq('complaint_id', complaintId).maybeSingle(),
    supabase.from('resolution_submissions').select('*').eq('complaint_id', complaintId).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  return (
    <ComplaintDetailView
      complaint={complaint as Complaint}
      images={(images ?? []) as ComplaintImage[]}
      timeline={(history ?? []) as ComplaintStatusHistory[]}
      ai={aiAnalysis as ComplaintAiAnalysis | null}
      resolutionSubmission={resolutionSubmission}
    />
  )
}
