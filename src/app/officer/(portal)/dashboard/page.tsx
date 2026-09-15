import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OfficerDashboardClient from '@/components/officer/OfficerDashboardClient'

export default async function OfficerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/officer/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, permanent_id, category, description, address, priority, status, created_at, sla_deadline')
    .order('created_at', { ascending: false })

  return (
    <OfficerDashboardClient
      complaints={(complaints as any) ?? []}
      officerName={profile?.full_name || 'Rajesh Kumar'}
      departmentName="Water Management"
    />
  )
}
