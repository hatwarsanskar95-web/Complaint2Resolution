import { NextResponse } from 'next/server'
import { seedDemoData, DEMO_ACCOUNTS } from '@/lib/seedDemoData'

export async function POST() {
  try {
    const result = await seedDemoData()
    return NextResponse.json({ ...result, demoAccounts: DEMO_ACCOUNTS })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ demoAccounts: DEMO_ACCOUNTS })
}
