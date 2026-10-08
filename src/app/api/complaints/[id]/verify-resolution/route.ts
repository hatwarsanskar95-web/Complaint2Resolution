import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAiVerification } from '@/lib/services/aiVerificationService'

// POST /api/complaints/[id]/verify-resolution — Phase 22
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await runAiVerification(id)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[AI Verify Resolution]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
