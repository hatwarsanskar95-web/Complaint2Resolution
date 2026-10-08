import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateDepartmentScores } from '@/lib/services/analyticsService'

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scores = await calculateDepartmentScores()

    return NextResponse.json({
      success: true,
      scores,
    })
  } catch (err: any) {
    console.error('Department scores GET error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
