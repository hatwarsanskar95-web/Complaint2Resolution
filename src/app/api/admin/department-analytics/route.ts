import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateDepartmentAnalytics } from '@/lib/services/analyticsService'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const periodParam = searchParams.get('period') || '6_months'
  const period = ['1_month', '6_months', '1_year'].includes(periodParam)
    ? (periodParam as '1_month' | '6_months' | '1_year')
    : '6_months'

  try {
    const data = await calculateDepartmentAnalytics(period)
    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error('[Department Analytics API] Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch analytics' }, { status: 500 })
  }
}
