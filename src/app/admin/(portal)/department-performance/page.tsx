import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DepartmentPerformanceClient from '@/components/admin/DepartmentPerformanceClient'
import { calculateDepartmentAnalytics } from '@/lib/services/analyticsService'

export default async function DepartmentPerformancePage() {
  const adminCtx = await getAdminContext()
  if (!adminCtx) redirect('/admin/login')

  const initialData = await calculateDepartmentAnalytics('6_months')

  return <DepartmentPerformanceClient initialData={initialData} />
}
