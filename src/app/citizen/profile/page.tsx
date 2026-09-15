import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CitizenProfileClient from '@/components/citizen/CitizenProfileClient'

export default async function CitizenProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, status')
    .eq('citizen_id', user.id)

  const counts = {
    total: complaints?.length || 0,
    resolved: complaints?.filter(c => c.status === 'CLOSED').length || 0,
    active: complaints?.filter(c => c.status !== 'CLOSED').length || 0,
  }

  return (
    <CitizenProfileClient
      profile={profile}
      email={user.email || ''}
      counts={counts}
    />
  )
}
