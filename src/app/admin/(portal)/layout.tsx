import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/auth'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getAdminContext()

  // Server-side role verification — reject non-admin users
  if (!ctx) {
    redirect('/admin/login')
  }

  return (
    <AdminShell
      adminName={ctx.profile?.full_name ?? null}
      adminEmail={ctx.email}
      isSuperAdmin={ctx.isSuperAdmin}
      departmentName={ctx.department?.name ?? null}
    >
      {children}
    </AdminShell>
  )
}
