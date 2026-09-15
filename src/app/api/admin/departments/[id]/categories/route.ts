import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/admin/departments/[id]/categories - List categories for department
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { id: departmentId } = await params
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from('department_categories')
      .select('*')
      .eq('department_id', departmentId)
      .order('category', { ascending: true })

    if (error) throw new Error(error.message)

    return NextResponse.json({ categories: categories || [] })
  } catch (err) {
    console.error('[Categories GET API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/admin/departments/[id]/categories - Add a new subcategory with SLA
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const { id: departmentId } = await params
    const body = await request.json()
    const { category, subcategory, default_sla_hours } = body

    if (!category?.trim() || !subcategory?.trim()) {
      return NextResponse.json({ error: 'Category and subcategory names are required.' }, { status: 400 })
    }

    const slaHours = parseInt(default_sla_hours, 10) || 48

    const supabase = await createClient()

    const { data: newCategory, error } = await supabase
      .from('department_categories')
      .insert({
        department_id: departmentId,
        category: category.trim(),
        subcategory: subcategory.trim(),
        default_sla_hours: slaHours,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ category: newCategory, message: 'Category added successfully.' }, { status: 201 })
  } catch (err) {
    console.error('[Categories POST API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// DELETE /api/admin/departments/[id]/categories?categoryId=... - Remove a subcategory
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('department_categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw new Error(error.message)

    return NextResponse.json({ message: 'Category removed successfully.' })
  } catch (err) {
    console.error('[Categories DELETE API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
