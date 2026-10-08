import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Complaint, ResolutionSubmission } from '@/lib/types'
import CitizenVerifyClient from '@/components/citizen/CitizenVerifyClient'

// Phase 23 — Citizen Resolution Verification Page
// /citizen/complaints/[id]/verify

export default async function CitizenVerifyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: complaint } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single()

  if (!complaint) notFound()

  // Only the complaint owner may access
  if (complaint.citizen_id !== user.id) redirect('/citizen/dashboard')

  // Must be in CITIZEN_VERIFICATION status
  if (complaint.status !== 'CITIZEN_VERIFICATION') {
    redirect(`/citizen/complaints/${id}`)
  }

  // Fetch resolution evidence
  const [{ data: submissionRows }, { data: images }, { data: report }] = await Promise.all([
    supabase
      .from('resolution_submissions')
      .select('*')
      .eq('complaint_id', id)
      .order('submitted_at', { ascending: false })
      .limit(1),
    supabase.from('complaint_images').select('*').eq('complaint_id', id).order('created_at'),
    supabase
      .from('resolution_reports')
      .select('report_text')
      .eq('complaint_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const submission = (submissionRows?.[0] ?? null) as ResolutionSubmission | null
  const originalPhoto = images?.find((i) => i.image_type === 'original')?.image_url ?? null
  const aiReport = report?.report_text ?? null

  return (
    <CitizenVerifyClient
      complaint={complaint as Complaint}
      submission={submission}
      originalPhotoUrl={originalPhoto}
      aiReport={aiReport}
    />
  )
}
