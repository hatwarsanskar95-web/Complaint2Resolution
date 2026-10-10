import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/citizen/complaints/[id]/dispute — Phase 24 / RLS Fix
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
      dispute_photo_url?: string
      dispute_reason?: string
    }

    if (!body.dispute_reason?.trim()) {
      return NextResponse.json(
        { error: 'Dispute reason is required.' },
        { status: 400 }
      )
    }

    // Call PostgreSQL SECURITY DEFINER RPC function
    const { data: rpcData, error: rpcErr } = await supabase.rpc('dispute_complaint_resolution', {
      p_complaint_id: id,
      p_dispute_reason: body.dispute_reason.trim(),
      p_dispute_photo_url: body.dispute_photo_url?.trim() || null,
    })

    if (rpcErr) {
      console.error('[Dispute Resolution RPC Error]', rpcErr)
      return NextResponse.json({ error: rpcErr.message }, { status: 422 })
    }

    // Trigger AI Dispute Analysis asynchronously (non-blocking)
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/complaints/${id}/analyze-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispute_reason: body.dispute_reason }),
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      new_status: 'DISPUTED',
      permanent_id: rpcData?.permanent_id ?? id,
    })
  } catch (err) {
    console.error('[Dispute Resolution Exception]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

