import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// Public Complaint Tracking API
// GET /api/complaints/track/[permanentId]
//
// Uses SECURITY DEFINER PostgreSQL functions to bypass RLS safely.
// These functions are granted to the `anon` role but only expose
// approved public fields — citizen identity is NEVER exposed.
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ permanentId: string }> }
) {
  try {
    const { permanentId } = await params
    if (!permanentId || typeof permanentId !== 'string') {
      return NextResponse.json({ error: 'Permanent ID is required' }, { status: 400 })
    }

    const cleanId = permanentId.trim().toUpperCase()
    if (!cleanId) {
      return NextResponse.json({ error: 'Permanent ID cannot be empty' }, { status: 400 })
    }

    // Use the standard anon-key server client.
    // The actual query uses a SECURITY DEFINER DB function granted to anon,
    // which safely bypasses RLS without exposing the service role key.
    const supabase = await createClient()

    // Call the SECURITY DEFINER function — returns only approved public fields
    const { data: rows, error: fnErr } = await supabase
      .rpc('get_public_complaint_tracking', { p_permanent_id: cleanId })

    if (fnErr) {
      console.error('[Public Tracking API] DB function error:', fnErr.message)
    }

    const complaint = rows && rows.length > 0 ? rows[0] : null

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint ticket not found. Please check the Permanent ID (e.g. CR-2026-000001).' },
        { status: 404 }
      )
    }

    // Fetch public timeline and images using SECURITY DEFINER functions
    const [{ data: timelineRows }, { data: imageRows }] = await Promise.all([
      supabase.rpc('get_public_complaint_timeline', { p_complaint_id: complaint.id }),
      supabase.rpc('get_public_complaint_images', { p_complaint_id: complaint.id }),
    ])

    return NextResponse.json({
      complaint: {
        id: complaint.id,
        permanentId: complaint.permanent_id,
        category: complaint.category,
        subcategory: complaint.subcategory,
        description: complaint.description,
        address: complaint.address,
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        priority: complaint.priority,
        status: complaint.status,
        slaStartTime: complaint.sla_start_time,
        slaDurationHours: complaint.sla_duration_hours,
        slaDeadline: complaint.sla_deadline,
        createdAt: complaint.created_at,
        updatedAt: complaint.updated_at,
        department: complaint.department_name
          ? { name: complaint.department_name, code: complaint.department_code }
          : null,
      },
      images: (imageRows || []).map((img: { image_url: string; image_type: string }) => ({
        image_url: img.image_url,
        image_type: img.image_type,
      })),
      timeline: (timelineRows || []).map((h: { id: string; old_status: string; new_status: string; notes: string; created_at: string }) => ({
        id: h.id,
        oldStatus: h.old_status,
        newStatus: h.new_status,
        notes: h.notes,
        createdAt: h.created_at,
      })),
    })
  } catch (err) {
    console.error('[Public Tracking API Error]', err)
    return NextResponse.json({ error: 'Internal server error while searching ticket.' }, { status: 500 })
  }
}
