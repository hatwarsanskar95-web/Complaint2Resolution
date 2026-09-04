import { createClient } from '@/lib/supabase/server'
import { Profile, Department, UserRole } from '@/lib/types'

export interface UserContext {
  id: string
  email: string
  role: UserRole
  profile: Profile | null
}

export interface AdminContext extends UserContext {
  isSuperAdmin: boolean
  isDeptAdmin: boolean
  departmentId: string | null
  department: Department | null
}

export interface OfficerContext extends UserContext {
  departmentId: string | null
  department: Department | null
}

export async function getCurrentUserContext(): Promise<UserContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? user.user_metadata?.role ?? 'citizen') as UserRole

  return {
    id: user.id,
    email: user.email || '',
    role,
    profile: profile as Profile | null,
  }
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const ctx = await getCurrentUserContext()
  if (!ctx || (ctx.role !== 'dept_admin' && ctx.role !== 'super_admin')) {
    return null
  }

  const supabase = await createClient()
  let departmentId: string | null = null
  let department: Department | null = null

  if (ctx.role === 'dept_admin') {
    const { data: od } = await supabase
      .from('officer_departments')
      .select('department_id, departments(*)')
      .eq('profile_id', ctx.id)
      .single()

    if (od) {
      departmentId = od.department_id
      department = od.departments as unknown as Department
    }
  }

  return {
    ...ctx,
    isSuperAdmin: ctx.role === 'super_admin',
    isDeptAdmin: ctx.role === 'dept_admin',
    departmentId,
    department,
  }
}

export async function getOfficerContext(): Promise<OfficerContext | null> {
  const ctx = await getCurrentUserContext()
  if (!ctx || !['officer', 'dept_admin', 'super_admin'].includes(ctx.role)) {
    return null
  }

  const supabase = await createClient()
  const { data: od } = await supabase
    .from('officer_departments')
    .select('department_id, departments(*)')
    .eq('profile_id', ctx.id)
    .single()

  return {
    ...ctx,
    departmentId: od?.department_id ?? null,
    department: (od?.departments as unknown as Department) ?? null,
  }
}
