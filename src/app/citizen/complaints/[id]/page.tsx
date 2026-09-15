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

  return (
    <ComplaintDetailView
      complaint={complaint as Complaint}
      images={(images ?? []) as ComplaintImage[]}
      timeline={(history ?? []) as ComplaintStatusHistory[]}
      ai={aiAnalysis as ComplaintAiAnalysis | null}
    />
  )
}
