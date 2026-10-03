import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OfficerLayoutClient from '@/components/officer/OfficerLayoutClient'

// ============================================================
// Phase 15 — Officer Authentication & Department Authorization
// Server layout resolves department from officer_departments table
// and passes real data into the client shell.
// ============================================================

export default async function OfficerPortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Block unauthenticated users
  if (!user) redirect('/officer/login')

  // Verify role server-side (Phase 15 — server-side department check)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'citizen'
  if (!['officer', 'dept_admin', 'super_admin'].includes(role)) {
    redirect('/officer/login')
  }

  // Resolve assigned department from officer_departments table (Phase 15)
  const { data: od } = await supabase
    .from('officer_departments')
    .select('department_id, departments(name, code)')
    .eq('profile_id', user.id)
    .single()

  const deptRaw = od?.departments as { name: string; code: string } | null | undefined
  const departmentName = deptRaw?.name ?? (role === 'super_admin' ? 'All Departments' : 'Unassigned')
  const departmentCode = deptRaw?.code ?? ''

  const officerName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Officer'
  const officerInitials = officerName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <OfficerLayoutClient
      officerName={officerName}
      officerInitials={officerInitials}
      departmentName={departmentName}
      departmentCode={departmentCode}
    >
      {children}
    </OfficerLayoutClient>
  )
}
