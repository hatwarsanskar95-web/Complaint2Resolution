import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import HumanReviewClient from '@/components/admin/HumanReviewClient'

export default async function HumanReviewPage() {
  const adminCtx = await getAdminContext()
  if (!adminCtx) redirect('/admin/login')

  const supabase = await createClient()

  // Fetch complaints with HUMAN_REVIEW_REQUIRED or DISPUTED status
  let query = supabase
    .from('complaints')
    .select('*, departments(id, name)')
    .in('status', ['HUMAN_REVIEW_REQUIRED', 'DISPUTED'])
    .order('created_at', { ascending: false })

  if (adminCtx.isDeptAdmin && adminCtx.departmentId) {
    query = query.eq('department_id', adminCtx.departmentId)
  }

  const { data: complaintsData } = await query

  const complaints = (complaintsData ?? []).map((c: any) => ({
    id: c.id,
    permanent_id: c.permanent_id,
    description: c.description,
    category: c.category,
    subcategory: c.subcategory,
    address: c.address,
    status: c.status,
    created_at: c.created_at,
    departments: c.departments,
    original_photo_url: c.image_url,
    before_photo_url: null,
    after_photo_url: null,
    dispute_photo_url: null,
    dispute_reason: null,
    ai_report: {
      confidence: 0.45,
      reasoning: 'Flagged for human supervisor review due to low confidence or disputed evidence.',
    },
  }))

  const { data: depts } = await supabase.from('departments').select('id, name').order('name')

  return (
    <HumanReviewClient
      initialComplaints={complaints}
      departments={depts ?? []}
    />
  )
}
