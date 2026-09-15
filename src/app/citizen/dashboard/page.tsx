import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Complaint } from '@/lib/types'
import CitizenDashboardClient from '@/components/citizen/CitizenDashboardClient'

export default async function CitizenDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: complaints } = await supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .eq('citizen_id', user.id)
    .order('created_at', { ascending: false })

  const all = (complaints as Complaint[]) ?? []

  return <CitizenDashboardClient complaints={all} />
}
