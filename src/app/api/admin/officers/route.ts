import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'

// GET /api/admin/officers - List all municipal officers with department and workload
export async function GET() {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const supabase = await createClient()

    // 1. Fetch profiles with role 'officer'
    const { data: officers, error: officerErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, role, created_at, updated_at')
      .eq('role', 'officer')
      .order('created_at', { ascending: false })

    if (officerErr) throw new Error(officerErr.message)

    // 2. Fetch officer department mappings
    const { data: officerDepts } = await supabase
      .from('officer_departments')
      .select('profile_id, department_id, departments(id, code, name, description)')

    // 3. Fetch complaint stats (active load vs resolved count)
    const { data: allComplaints } = await supabase
      .from('complaints')
      .select('id, department_id, status')

    // If Dept Admin, they only view their department's officers unless Super Admin
    let filteredOfficers = officers || []
    if (adminCtx.isDeptAdmin && adminCtx.departmentId) {
      const allowedProfileIds = new Set(
        (officerDepts || [])
          .filter((od) => od.department_id === adminCtx.departmentId)
          .map((od) => od.profile_id)
      )
      filteredOfficers = filteredOfficers.filter((o) => allowedProfileIds.has(o.id))
    }

    // Combine data
    const officerRoster = filteredOfficers.map((officer) => {
      const mapping = (officerDepts || []).find((od) => od.profile_id === officer.id)
      const dept = Array.isArray(mapping?.departments)
        ? mapping?.departments[0]
        : (mapping?.departments as { id: string; code: string; name: string } | undefined)

      const deptComplaints = (allComplaints || []).filter((c) => c.department_id === mapping?.department_id)
      const activeLoad = deptComplaints.filter((c) => !['RESOLVED', 'CLOSED'].includes(c.status)).length
      const resolvedCount = deptComplaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length

      return {
        id: officer.id,
        full_name: officer.full_name || 'Municipal Officer',
        email: officer.email,
        phone_number: officer.phone_number,
        role: officer.role,
        department_id: mapping?.department_id || null,
        department_name: dept?.name || 'Unassigned',
        department_code: dept?.code || '—',
        activeLoad,
        resolvedCount,
        created_at: officer.created_at,
      }
    })

    return NextResponse.json({ officers: officerRoster })
  } catch (err) {
    console.error('[Officers GET API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/admin/officers - Provision a new municipal officer account
export async function POST(request: NextRequest) {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, email, password, department_id, phone_number } = body

    if (!full_name?.trim() || !email?.trim() || !password || !department_id) {
      return NextResponse.json({
        error: 'Full name, email, password, and department assignment are required.'
      }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Officer password must be at least 8 characters long.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = full_name.trim()

    const supabase = await createClient()

    // 1. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          role: 'officer',
        },
      },
    })

    if (authErr) {
      if (authErr.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }
      throw new Error(authErr.message)
    }

    const userId = authData.user?.id
    if (!userId) {
      throw new Error('Failed to create officer account.')
    }

    // 2. Ensure profile exists with role 'officer'
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: cleanName,
        email: cleanEmail,
        phone_number: phone_number?.trim() || null,
        role: 'officer',
        updated_at: new Date().toISOString(),
      })

    // 3. Assign officer to department in `officer_departments`
    const { error: deptAssignErr } = await supabase
      .from('officer_departments')
      .upsert({
        profile_id: userId,
        department_id,
        created_at: new Date().toISOString(),
      })

    if (deptAssignErr) {
      console.warn('[Officers POST API] Dept assignment error:', deptAssignErr)
    }

    return NextResponse.json({
      message: `Officer account for "${cleanName}" created and assigned successfully.`,
      officerId: userId,
    }, { status: 201 })
  } catch (err) {
    console.error('[Officers POST API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// PATCH /api/admin/officers - Update officer info or reassign department
export async function PATCH(request: NextRequest) {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const body = await request.json()
    const { id, full_name, phone_number, department_id } = body

    if (!id) {
      return NextResponse.json({ error: 'Officer ID is required.' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Update profile info
    if (full_name || phone_number !== undefined) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (full_name?.trim()) updateData.full_name = full_name.trim()
      if (phone_number !== undefined) updateData.phone_number = phone_number?.trim() || null

      await supabase.from('profiles').update(updateData).eq('id', id)
    }

    // 2. Reassign department if specified
    if (department_id) {
      await supabase
        .from('officer_departments')
        .delete()
        .eq('profile_id', id)

      await supabase
        .from('officer_departments')
        .insert({
          profile_id: id,
          department_id,
          created_at: new Date().toISOString(),
        })
    }

    return NextResponse.json({ message: 'Officer record updated successfully.' })
  } catch (err) {
    console.error('[Officers PATCH API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// DELETE /api/admin/officers - Revoke officer assignment
export async function DELETE(request: NextRequest) {
  try {
    const adminCtx = await getAdminContext()
    if (!adminCtx || !adminCtx.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Officer ID is required.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Remove department assignment
    await supabase.from('officer_departments').delete().eq('profile_id', id)

    // Demote role to citizen to revoke officer portal access
    await supabase.from('profiles').update({ role: 'citizen' }).eq('id', id)

    return NextResponse.json({ message: 'Officer portal access revoked.' })
  } catch (err) {
    console.error('[Officers DELETE API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
