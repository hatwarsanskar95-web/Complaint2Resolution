import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { runSecurityAudit } from '@/lib/securityAudit'

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const audit = runSecurityAudit()

    return NextResponse.json({ success: true, audit })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
