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
      .maybeSingle()

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
    .maybeSingle()

  let departmentId = od?.department_id ?? null
  let department = (od?.departments as unknown as Department) ?? null

  // Fallback: If officer has no mapping in officer_departments, resolve via email matching
  if (!departmentId && ctx.email) {
    const emailLower = ctx.email.toLowerCase()
    let deptCode: string | null = null
    if (emailLower.includes('water')) deptCode = 'WTR'
    else if (emailLower.includes('road')) deptCode = 'RDS'
    else if (emailLower.includes('electric')) deptCode = 'ELE'
    else if (emailLower.includes('sanitat')) deptCode = 'SAN'
    else if (emailLower.includes('drain')) deptCode = 'DRN'
    else if (emailLower.includes('park')) deptCode = 'PRK'

    if (deptCode) {
      const { data: matchedDept } = await supabase
        .from('departments')
        .select('*')
        .eq('code', deptCode)
        .maybeSingle()

      if (matchedDept) {
        departmentId = matchedDept.id
        department = matchedDept as Department
        // Upsert into officer_departments for future queries
        await supabase
          .from('officer_departments')
          .upsert({ profile_id: ctx.id, department_id: matchedDept.id }, { onConflict: 'profile_id,department_id' })
      }
    }
  }

  return {
    ...ctx,
    departmentId,
    department,
  }
}
