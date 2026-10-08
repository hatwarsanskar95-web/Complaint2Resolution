import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnalyticsClient from '@/components/admin/AnalyticsClient'
import { calculateDepartmentScores } from '@/lib/services/analyticsService'
import { detectRecurringIssues } from '@/lib/services/recurringIssueService'

export default async function AnalyticsPage() {
  const adminCtx = await getAdminContext()
  if (!adminCtx) redirect('/admin/login')

  const [scores, clusters] = await Promise.all([
    calculateDepartmentScores(),
    detectRecurringIssues(),
  ])

  return <AnalyticsClient initialScores={scores} initialClusters={clusters} />
}
