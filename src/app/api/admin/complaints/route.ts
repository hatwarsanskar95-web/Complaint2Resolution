import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')?.trim() || ''
    const status = searchParams.get('status') || ''
    const departmentId = searchParams.get('department_id') || ''
    const priority = searchParams.get('priority') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    let dbQuery = supabase
      .from('complaints')
      .select('*, departments(id, name), profiles!assigned_officer_id(full_name)', { count: 'exact' })

    if (query) {
      dbQuery = dbQuery.or(
        `permanent_id.ilike.%${query}%,address.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`
      )
    }

    if (status) {
      if (status === 'NEAR_SLA') {
        const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        const now = new Date().toISOString()
        dbQuery = dbQuery.gte('sla_deadline', now).lte('sla_deadline', twoHoursLater)
      } else if (status === 'SLA_BREACHED') {
        const now = new Date().toISOString()
        dbQuery = dbQuery.lt('sla_deadline', now).not('status', 'in', '("CLOSED","RESOLVED")')
      } else {
        dbQuery = dbQuery.eq('status', status)
      }
    }

    if (departmentId) {
      dbQuery = dbQuery.eq('department_id', departmentId)
    }

    if (priority) {
      dbQuery = dbQuery.eq('priority', priority)
    }

    dbQuery = dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: complaints, count, error } = await dbQuery

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      complaints: complaints || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (err: any) {
    console.error('Admin complaints GET error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
