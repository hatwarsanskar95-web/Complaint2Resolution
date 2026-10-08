import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeDispute } from '@/lib/services/disputeService'
import { z } from 'zod'

const RequestSchema = z.object({
  dispute_reason: z.string().min(1, 'Dispute reason is required'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const parsed = RequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: complaint, error: compErr } = await supabase
      .from('complaints')
      .select('id, permanent_id, status, assigned_officer_id')
      .eq('id', id)
      .single()

    if (compErr || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const result = await analyzeDispute(id, parsed.data.dispute_reason)

    return NextResponse.json({
      success: true,
      complaint_id: complaint.id,
      permanent_id: complaint.permanent_id,
      ...result,
    })
  } catch (error: any) {
    console.error('Analyze dispute error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
