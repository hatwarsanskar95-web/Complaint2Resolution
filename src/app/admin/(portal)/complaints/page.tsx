import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminComplaintsClient from '@/components/admin/AdminComplaintsClient'

export default async function AdminComplaintsPage() {
  const adminCtx = await getAdminContext()
  if (!adminCtx) redirect('/admin/login')

  const supabase = await createClient()
  const { data: depts } = await supabase.from('departments').select('id, name').order('name')

  return <AdminComplaintsClient departments={depts ?? []} />
}
