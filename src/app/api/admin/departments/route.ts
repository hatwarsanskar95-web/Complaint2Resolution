import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'

// GET /api/admin/departments - List all departments with metrics & categories
export async function GET() {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const supabase = await createClient()

    // 1. Fetch departments
    const { data: depts, error: deptsErr } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true })

    if (deptsErr) throw new Error(deptsErr.message)

    // 2. Fetch categories per department
    const { data: categories } = await supabase
      .from('department_categories')
      .select('*')
      .order('category', { ascending: true })

    // 3. Fetch officer counts per department
    const { data: officerDepts } = await supabase
      .from('officer_departments')
      .select('department_id, profile_id')

    // 4. Fetch complaint counts per department
    const { data: complaints } = await supabase
      .from('complaints')
      .select('department_id, status')

    // Aggregate metrics per department
    const departmentsWithMetrics = (depts || []).map((dept) => {
      const deptCategories = (categories || []).filter((c) => c.department_id === dept.id)
      const activeOfficers = (officerDepts || []).filter((od) => od.department_id === dept.id).length

      const deptComplaints = (complaints || []).filter((c) => c.department_id === dept.id)
      const openComplaints = deptComplaints.filter((c) => !['RESOLVED', 'CLOSED'].includes(c.status)).length
      const resolvedComplaints = deptComplaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length

      return {
        ...dept,
        categories: deptCategories,
        categoryCount: deptCategories.length,
        activeOfficers,
        openComplaints,
        resolvedComplaints,
        totalComplaints: deptComplaints.length,
      }
    })

    return NextResponse.json({ departments: departmentsWithMetrics })
  } catch (err) {
    console.error('[Departments GET API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/admin/departments - Create a new department
export async function POST(request: NextRequest) {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx || !adminCtx.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description, categories } = body

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ error: 'Department name and code are required.' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '')
    const cleanName = name.trim()
    const cleanDesc = description?.trim() || null

    const supabase = await createClient()

    // Insert department
    const { data: newDept, error: insertErr } = await supabase
      .from('departments')
      .insert({
        name: cleanName,
        code: cleanCode,
        description: cleanDesc,
      })
      .select()
      .single()

    if (insertErr) {
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: `Department code "${cleanCode}" already exists.` }, { status: 409 })
      }
      throw new Error(insertErr.message)
    }

    // Insert initial categories if provided
    if (Array.isArray(categories) && categories.length > 0) {
      const catRows = categories.map((cat: { category: string; subcategory: string; default_sla_hours?: number }) => ({
        department_id: newDept.id,
        category: cat.category || cleanName,
        subcategory: cat.subcategory || 'General',
        default_sla_hours: cat.default_sla_hours || 48,
      }))

      await supabase.from('department_categories').insert(catRows)
    }

    return NextResponse.json({ department: newDept, message: 'Department created successfully.' }, { status: 201 })
  } catch (err) {
    console.error('[Departments POST API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// PATCH /api/admin/departments - Update department details
export async function PATCH(request: NextRequest) {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx || !adminCtx.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, code, description } = body

    if (!id || !name?.trim() || !code?.trim()) {
      return NextResponse.json({ error: 'Department ID, name, and code are required.' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '')
    const cleanName = name.trim()
    const cleanDesc = description?.trim() || null

    const supabase = await createClient()

    const { data: updatedDept, error: updateErr } = await supabase
      .from('departments')
      .update({
        name: cleanName,
        code: cleanCode,
        description: cleanDesc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateErr) throw new Error(updateErr.message)

    return NextResponse.json({ department: updatedDept, message: 'Department updated successfully.' })
  } catch (err) {
    console.error('[Departments PATCH API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// DELETE /api/admin/departments - Delete a department
export async function DELETE(request: NextRequest) {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx || !adminCtx.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if complaints are linked to this department
    const { data: linkedComplaints } = await supabase
      .from('complaints')
      .select('id')
      .eq('department_id', id)
      .limit(1)

    if (linkedComplaints && linkedComplaints.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete department: Active or historical complaints are assigned to it. Reassign complaints first.'
      }, { status: 400 })
    }

    // Delete categories first
    await supabase.from('department_categories').delete().eq('department_id', id)
    // Delete officer assignments
    await supabase.from('officer_departments').delete().eq('department_id', id)

    // Delete department
    const { error: deleteErr } = await supabase.from('departments').delete().eq('id', id)
    if (deleteErr) throw new Error(deleteErr.message)

    return NextResponse.json({ message: 'Department and associated categories deleted successfully.' })
  } catch (err) {
    console.error('[Departments DELETE API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
