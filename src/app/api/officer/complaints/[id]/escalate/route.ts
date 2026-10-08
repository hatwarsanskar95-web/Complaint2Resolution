import { NextRequest, NextResponse } from 'next/server'
import { batchEscalateBreachedComplaints } from '@/lib/services/escalationService'
import { createClient } from '@/lib/supabase/server'

// POST /api/officer/complaints/[id]/escalate — escalate a single complaint
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { checkAndEscalate } = await import('@/lib/services/escalationService')
  const result = await checkAndEscalate(id)
  return NextResponse.json(result)
}
