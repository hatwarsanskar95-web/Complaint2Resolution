import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export default async function AdminDashboardPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect('/admin/login')

  const supabase = await createClient()

  // Fetch real complaints from database
  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, permanent_id, category, subcategory, priority, status, created_at, department_id, sla_deadline, sla_start_time')
    .order('created_at', { ascending: false })

  // Fetch real departments from database
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, code')
    .order('name', { ascending: true })

  const greeting = getGreeting()
  const displayName = ctx.profile?.full_name || ctx.email.split('@')[0]

  return (
    <AdminDashboardClient
      greeting={greeting}
      displayName={displayName}
      isSuperAdmin={ctx.isSuperAdmin}
      departmentName={ctx.department?.name || null}
      complaints={(complaints as any) || []}
      departments={(departments as any) || []}
    />
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}
