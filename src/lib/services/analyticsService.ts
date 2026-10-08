import { createClient } from '@/lib/supabase/server'

export interface DepartmentScore {
  department_id: string
  department_name: string
  department_code: string
  total_complaints: number
  resolved_count: number
  breach_count: number
  reopened_count: number
  escalated_count: number
  avg_rating: number
  breach_rate: number
  reopen_rate: number
  escalation_rate: number
  resolution_rate: number
  score: number
}

export async function calculateDepartmentScores(): Promise<DepartmentScore[]> {
  const supabase = await createClient()

  const [{ data: depts }, { data: complaints }] = await Promise.all([
    supabase.from('departments').select('id, name, code'),
    supabase.from('complaints').select('id, status, department_id, sla_deadline, created_at, closed_at'),
  ])

  const departmentList = depts || []
  const complaintList = complaints || []

  const scores: DepartmentScore[] = departmentList.map((d) => {
    const deptComplaints = complaintList.filter((c) => c.department_id === d.id)
    const total = deptComplaints.length

    if (total === 0) {
      return {
        department_id: d.id,
        department_name: d.name,
        department_code: d.code,
        total_complaints: 0,
        resolved_count: 0,
        breach_count: 0,
        reopened_count: 0,
        escalated_count: 0,
        avg_rating: 4.0,
        breach_rate: 0,
        reopen_rate: 0,
        escalation_rate: 0,
        resolution_rate: 1,
        score: 85,
      }
    }

    const resolved = deptComplaints.filter((c) => c.status === 'CLOSED' || c.status === 'RESOLVED').length
    const breached = deptComplaints.filter(
      (c) => c.sla_deadline && new Date(c.sla_deadline) < new Date() && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
    ).length
    const reopened = deptComplaints.filter((c) => c.status === 'REOPENED').length
    const escalated = deptComplaints.filter((c) => c.status === 'HUMAN_REVIEW_REQUIRED' || c.status === 'DISPUTED').length

    const breachRate = breached / total
    const reopenRate = (resolved + reopened > 0) ? reopened / (resolved + reopened) : 0
    const escalationRate = escalated / total
    const resolutionRate = resolved / total
    const avgRating = 4.2 // Default high performance rating benchmark

    // Score = 100 - (30 * Breach Rate) - (25 * Reopen Rate) - (20 * Escalation Rate) + (15 * Resolution Rate) + (10 * Rating/5)
    let rawScore =
      100 -
      30 * breachRate -
      25 * reopenRate -
      20 * escalationRate +
      15 * resolutionRate +
      10 * (avgRating / 5)

    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)))

    return {
      department_id: d.id,
      department_name: d.name,
      department_code: d.code,
      total_complaints: total,
      resolved_count: resolved,
      breach_count: breached,
      reopened_count: reopened,
      escalated_count: escalated,
      avg_rating: avgRating,
      breach_rate: Math.round(breachRate * 100) / 100,
      reopen_rate: Math.round(reopenRate * 100) / 100,
      escalation_rate: Math.round(escalationRate * 100) / 100,
      resolution_rate: Math.round(resolutionRate * 100) / 100,
      score: finalScore,
    }
  })

  // Sort descending by score
  return scores.sort((a, b) => b.score - a.score)
}
