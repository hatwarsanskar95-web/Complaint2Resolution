import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { runE2EWorkflowTests } from '@/lib/e2eTestRunner'

export async function POST() {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const report = await runE2EWorkflowTests()

    return NextResponse.json({ success: true, report })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
