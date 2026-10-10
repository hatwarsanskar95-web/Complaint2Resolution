import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/citizen/complaints/[id]/confirm-resolution — Phase 23 / RLS Fix
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Use session client to authenticate the citizen
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as {
      feedback_rating?: number
      feedback_comment?: string
    }

    // Call PostgreSQL SECURITY DEFINER RPC function
    const { data: rpcData, error: rpcErr } = await supabase.rpc('confirm_complaint_resolution', {
      p_complaint_id: id,
      p_rating: body.feedback_rating ?? null,
      p_comment: body.feedback_comment ?? null,
    })

    if (rpcErr) {
      console.error('[Confirm Resolution RPC Error]', rpcErr)
      return NextResponse.json({ error: rpcErr.message }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      new_status: 'CLOSED',
      permanent_id: rpcData?.permanent_id ?? id,
    })
  } catch (err) {
    console.error('[Confirm Resolution Exception]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

