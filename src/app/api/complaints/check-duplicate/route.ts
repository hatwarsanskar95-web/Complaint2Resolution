import { NextRequest, NextResponse } from 'next/server'
import { checkDuplicateComplaint } from '@/lib/services/duplicateDetectionService'
import { z } from 'zod'

const Schema = z.object({
  category: z.string().min(1),
  address: z.string().min(1),
  description: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = Schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const result = await checkDuplicateComplaint(
      parsed.data.category,
      parsed.data.address,
      parsed.data.description
    )

    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
