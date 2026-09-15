import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Complaint, ComplaintImage, ComplaintStatusHistory, ComplaintAiAnalysis } from '@/lib/types'
import OfficerComplaintDetailClient from '@/components/officer/OfficerComplaintDetailClient'

export default async function OfficerComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/officer/login')

  const { data: complaint } = await supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .eq('id', id)
    .single()

  if (!complaint) notFound()

  // AUTOMATIC IN_PROGRESS TRANSITION:
  // When an assigned officer opens a complaint in RECEIVED or ASSIGNED status, automatically transition to IN_PROGRESS
  if (['RECEIVED', 'ASSIGNED', 'SUBMITTED'].includes(complaint.status)) {
    await supabase
      .from('complaints')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', id)

    await supabase.from('complaint_status_history').insert({
      complaint_id: id,
      old_status: complaint.status,
      new_status: 'IN_PROGRESS',
      updated_by: user.id,
      notes: 'Automatically started when officer opened this complaint',
    })

    complaint.status = 'IN_PROGRESS'
  }

  const [{ data: images }, { data: history }, { data: aiAnalysis }] = await Promise.all([
    supabase.from('complaint_images').select('*').eq('complaint_id', id).order('created_at'),
    supabase.from('complaint_status_history').select('*').eq('complaint_id', id).order('created_at'),
    supabase.from('complaint_ai_analysis').select('*').eq('complaint_id', id).single(),
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
