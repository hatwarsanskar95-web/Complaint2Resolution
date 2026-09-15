import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export default async function AdminDashboardPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect('/admin/login')

  const greeting = getGreeting()
  const displayName = ctx.profile?.full_name || ctx.email.split('@')[0]

  return (
    <AdminDashboardClient
      greeting={greeting}
      displayName={displayName}
      isSuperAdmin={ctx.isSuperAdmin}
      departmentName={ctx.department?.name || null}
    />
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}
