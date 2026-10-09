import { createClient } from '@/lib/supabase/server'

export interface DetailedDepartmentMetric {
  department_id: string
  department_name: string
  department_code: string
  total_complaints: number
  resolved_count: number
  open_count: number
  sla_met_count: number
  sla_breached_count: number
  breach_count: number
  reopened_count: number
  escalated_count: number
  avg_rating: number
  breach_rate: number
  reopen_rate: number
  escalation_rate: number
  resolution_rate: number
  sla_compliance_rate: number // Percentage 0 - 100
  verified_resolution_rate: number // Percentage 0 - 100
  avg_resolution_hours: number
  score: number
}

export type DepartmentScore = DetailedDepartmentMetric

export interface DepartmentAnalyticsResponse {
  period: '1_month' | '6_months' | '1_year'
  departments: DetailedDepartmentMetric[]
  statusDistribution: Array<{ name: string; count: number; color: string }>
  monthlyTrends: Array<{ month: string; [deptName: string]: string | number }>
}

export async function calculateDepartmentAnalytics(
  period: '1_month' | '6_months' | '1_year' = '6_months'
): Promise<DepartmentAnalyticsResponse> {
  const supabase = await createClient()

  // Calculate cutoff timestamp
  const now = new Date()
  const cutoff = new Date(now)
  if (period === '1_month') {
    cutoff.setDate(now.getDate() - 30)
  } else if (period === '1_year') {
    cutoff.setFullYear(now.getFullYear() - 1)
  } else {
    // Default 6 months
    cutoff.setMonth(now.getMonth() - 6)
  }

  const [{ data: depts }, { data: complaints }] = await Promise.all([
    supabase.from('departments').select('id, name, code'),
    supabase
      .from('complaints')
      .select('id, status, category, department_id, sla_deadline, created_at, closed_at')
      .gte('created_at', cutoff.toISOString()),
  ])

  // Canonical departments checklist if DB has subset
  const CANONICAL_DEPARMENTS = [
    { name: 'Water Management', code: 'WTR' },
    { name: 'Roads / Public Works', code: 'RDS' },
    { name: 'Electrical', code: 'ELE' },
    { name: 'Sanitation', code: 'SAN' },
    { name: 'Drainage', code: 'DRN' },
    { name: 'Parks & Recreation', code: 'PRK' },
  ]

  const dbDepts = depts || []
  const complaintList = complaints || []

  // Map database departments, combining canonical definitions if necessary
  const departmentMetrics: DetailedDepartmentMetric[] = dbDepts.map((d) => {
    const deptComplaints = complaintList.filter((c) => c.department_id === d.id)
    const total = deptComplaints.length

    if (total === 0) {
      return {
        department_id: d.id,
        department_name: d.name,
        department_code: d.code,
        total_complaints: 0,
        resolved_count: 0,
        open_count: 0,
        sla_met_count: 0,
        sla_breached_count: 0,
        breach_count: 0,
        reopened_count: 0,
        escalated_count: 0,
        avg_rating: 4.0,
        breach_rate: 0,
        reopen_rate: 0,
        escalation_rate: 0,
        resolution_rate: 1,
        sla_compliance_rate: 100,
        verified_resolution_rate: 100,
        avg_resolution_hours: 0,
        score: 85,
      }
    }

    const resolvedComplaints = deptComplaints.filter((c) => ['CLOSED', 'RESOLVED'].includes(c.status))
    const resolvedCount = resolvedComplaints.length
    const openCount = total - resolvedCount

    // SLA Met vs Breached for completed complaints
    let slaMetCount = 0
    let slaBreachedCount = 0

    deptComplaints.forEach((c) => {
      if (['CLOSED', 'RESOLVED'].includes(c.status)) {
        if (c.sla_deadline && c.closed_at) {
          if (new Date(c.closed_at) <= new Date(c.sla_deadline)) {
            slaMetCount++
          } else {
            slaBreachedCount++
          }
        } else {
          slaMetCount++
        }
      } else {
        // Active complaint check
        if (c.sla_deadline && new Date() > new Date(c.sla_deadline)) {
          slaBreachedCount++
        }
      }
    })

    const reopenedCount = deptComplaints.filter((c) => c.status === 'REOPENED').length
    const escalatedCount = deptComplaints.filter((c) => ['HUMAN_REVIEW_REQUIRED', 'DISPUTED'].includes(c.status)).length

    // Average resolution time in hours for resolved complaints
    let totalResolutionHours = 0
    resolvedComplaints.forEach((c) => {
      const created = new Date(c.created_at).getTime()
      const closed = c.closed_at ? new Date(c.closed_at).getTime() : new Date().getTime()
      const hours = Math.max(0, (closed - created) / 3600000)
      totalResolutionHours += hours
    })
    const avgResolutionHours = resolvedCount > 0 ? Math.round(totalResolutionHours / resolvedCount) : 0

    const slaComplianceRate = resolvedCount > 0 ? Math.round((slaMetCount / resolvedCount) * 100) : 100
    const verifiedResolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0

    // Existing performance score formula:
    // Score = 100 - (30 * Breach Rate) - (25 * Reopen Rate) - (20 * Escalation Rate) + (15 * Resolution Rate) + (10 * Rating/5)
    const breachRate = slaBreachedCount / total
    const reopenRate = (resolvedCount + reopenedCount > 0) ? reopenedCount / (resolvedCount + reopenedCount) : 0
    const escalationRate = escalatedCount / total
    const resolutionRate = resolvedCount / total
    const avgRating = 4.2

    let rawScore =
      100 -
      30 * breachRate -
      25 * reopenRate -
      20 * escalationRate +
      15 * resolutionRate +
      10 * (avgRating / 5)

    const score = Math.min(100, Math.max(0, Math.round(rawScore)))

    return {
      department_id: d.id,
      department_name: d.name,
      department_code: d.code,
      total_complaints: total,
      resolved_count: resolvedCount,
      open_count: openCount,
      sla_met_count: slaMetCount,
      sla_breached_count: slaBreachedCount,
      breach_count: slaBreachedCount,
      reopened_count: reopenedCount,
      escalated_count: escalatedCount,
      avg_rating: avgRating,
      breach_rate: Math.round(breachRate * 100) / 100,
      reopen_rate: Math.round(reopenRate * 100) / 100,
      escalation_rate: Math.round(escalationRate * 100) / 100,
      resolution_rate: Math.round(resolutionRate * 100) / 100,
      sla_compliance_rate: slaComplianceRate,
      verified_resolution_rate: verifiedResolutionRate,
      avg_resolution_hours: avgResolutionHours,
      score,
    }
  })

  // Ensure all 6 canonical departments exist in returned list
  CANONICAL_DEPARMENTS.forEach((cd) => {
    const exists = departmentMetrics.some((dm) => dm.department_name.toLowerCase().includes(cd.name.toLowerCase()) || dm.department_code === cd.code)
    if (!exists) {
      departmentMetrics.push({
        department_id: `canon-${cd.code}`,
        department_name: cd.name,
        department_code: cd.code,
        total_complaints: 0,
        resolved_count: 0,
        open_count: 0,
        sla_met_count: 0,
        sla_breached_count: 0,
        breach_count: 0,
        reopened_count: 0,
        escalated_count: 0,
        avg_rating: 4.0,
        breach_rate: 0,
        reopen_rate: 0,
        escalation_rate: 0,
        resolution_rate: 1,
        sla_compliance_rate: 100,
        verified_resolution_rate: 100,
        avg_resolution_hours: 0,
        score: 85,
      })
    }
  })

  // Sort descending by score
  departmentMetrics.sort((a, b) => b.score - a.score)

  // Calculate status distribution
  const statusCounts: Record<string, number> = {
    'Open / In Progress': 0,
    'Awaiting Verification': 0,
    'Closed / Verified': 0,
    'Reopened': 0,
  }

  complaintList.forEach((c) => {
    if (['CLOSED', 'RESOLVED'].includes(c.status)) {
      statusCounts['Closed / Verified']++
    } else if (['RESOLUTION_SUBMITTED', 'AI_VERIFICATION', 'CITIZEN_VERIFICATION'].includes(c.status)) {
      statusCounts['Awaiting Verification']++
    } else if (['REOPENED', 'DISPUTED'].includes(c.status)) {
      statusCounts['Reopened']++
    } else {
      statusCounts['Open / In Progress']++
    }
  })

  const statusDistribution = [
    { name: 'Open / In Progress', count: statusCounts['Open / In Progress'], color: '#3b82f6' },
    { name: 'Awaiting Verification', count: statusCounts['Awaiting Verification'], color: '#f59e0b' },
    { name: 'Closed / Verified', count: statusCounts['Closed / Verified'], color: '#10b981' },
    { name: 'Reopened', count: statusCounts['Reopened'], color: '#ef4444' },
  ]

  // Monthly trends (group complaints resolved per month)
  const monthlyTrendsMap: Record<string, Record<string, number>> = {}
  complaintList.forEach((c) => {
    if (['CLOSED', 'RESOLVED'].includes(c.status) && c.closed_at) {
      const monthKey = new Date(c.closed_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      if (!monthlyTrendsMap[monthKey]) {
        monthlyTrendsMap[monthKey] = {}
      }
      const deptName = dbDepts.find((d) => d.id === c.department_id)?.name || 'General'
      monthlyTrendsMap[monthKey][deptName] = (monthlyTrendsMap[monthKey][deptName] || 0) + 1
    }
  })

  const monthlyTrends = Object.entries(monthlyTrendsMap).map(([month, depts]) => ({
    month,
    ...depts,
  }))

  return {
    period,
    departments: departmentMetrics,
    statusDistribution,
    monthlyTrends,
  }
}

export async function calculateDepartmentScores() {
  const result = await calculateDepartmentAnalytics('6_months')
  return result.departments
}
