import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Complaint } from '@/lib/types'
import ResolutionSubmitClient from '@/components/officer/ResolutionSubmitClient'

// Phase 20 — Officer Resolution Evidence Submission Page
// /officer/complaints/[id]/resolve

export default async function OfficerResolvePage({
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

  // Block if not in a workable state
  const workable = ['IN_PROGRESS', 'REOPENED', 'ASSIGNED', 'RECEIVED', 'SUBMITTED', 'DISPUTED']
  if (!workable.includes(complaint.status)) {
    redirect(`/officer/complaints/${id}`)
  }

  return (
    <ResolutionSubmitClient
      complaint={complaint as Complaint}
      officerId={user.id}
    />
  )
}
