import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CitizenComplaintsClient, { ComplaintItem } from '@/components/citizen/CitizenComplaintsClient'

export default async function CitizenComplaintsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, permanent_id, category, subcategory, description, address, status, priority, created_at, sla_deadline, departments(name)')
    .eq('citizen_id', user.id)
    .order('created_at', { ascending: false })

  const complaintList = (complaints as unknown as ComplaintItem[]) || []

  return <CitizenComplaintsClient initialComplaints={complaintList} />
}
