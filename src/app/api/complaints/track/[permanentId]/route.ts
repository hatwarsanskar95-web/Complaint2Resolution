import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// ============================================================
// Public Complaint Tracking API
// GET /api/complaints/track/[permanentId]
//
// Read-only server lookup using createServiceRoleClient().
// Does NOT touch or mutate user cookies, session tokens, or auth state.
// Only exposes approved public fields — citizen identity is NEVER exposed.
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

    // Use service role client for public tracking lookup so it is 100% read-only,
    // bypasses RLS, and does NOT mutate or clear any authenticated user cookies.
    const supabase = createServiceRoleClient()

    // 1. Try calling SECURITY DEFINER RPC first if present
    let complaintData: any = null
    const { data: rpcRows, error: rpcErr } = await supabase.rpc('get_public_complaint_tracking', { p_permanent_id: cleanId })

    if (!rpcErr && rpcRows && rpcRows.length > 0) {
      const r = rpcRows[0]
      complaintData = {
        id: r.id,
        permanent_id: r.permanent_id,
        category: r.category,
        subcategory: r.subcategory,
        description: r.description,
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        priority: r.priority,
        status: r.status,
        sla_start_time: r.sla_start_time,
        sla_duration_hours: r.sla_duration_hours,
        sla_deadline: r.sla_deadline,
        created_at: r.created_at,
        updated_at: r.updated_at,
        departments: r.department_name ? { name: r.department_name, code: r.department_code } : null,
      }
    } else {
      // Fallback: Direct select on complaints + departments
      const { data: directComplaint, error: fetchErr } = await supabase
        .from('complaints')
        .select(`
          id,
          permanent_id,
          category,
          subcategory,
          description,
          address,
          latitude,
          longitude,
          priority,
          status,
          sla_start_time,
          sla_duration_hours,
          sla_deadline,
          created_at,
          updated_at,
          department_id,
          departments (
            name,
            code
          )
        `)
        .ilike('permanent_id', cleanId)
        .maybeSingle()

      if (fetchErr) {
        console.error('[Public Tracking API] Direct fetch error:', fetchErr.message)
      }
      complaintData = directComplaint
    }

    if (!complaintData) {
      return NextResponse.json(
        { error: 'Complaint ticket not found. Please check the Permanent ID (e.g. CR-2026-000001).' },
        { status: 404 }
      )
    }

    // 2. Fetch images, timeline, and AI analysis in parallel
    const [{ data: images }, { data: timeline }, { data: aiAnalysis }] = await Promise.all([
      supabase
        .from('complaint_images')
        .select('image_url, image_type')
        .eq('complaint_id', complaintData.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('complaint_status_history')
        .select('id, old_status, new_status, notes, created_at')
        .eq('complaint_id', complaintData.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('complaint_ai_analysis')
        .select('category, subcategory, department_recommendation, summary, recommended_actions, confidence')
        .eq('complaint_id', complaintData.id)
        .maybeSingle(),
    ])

    const dept = Array.isArray(complaintData.departments)
      ? complaintData.departments[0]
      : complaintData.departments

    return NextResponse.json({
      complaint: {
        id: complaintData.id,
        permanentId: complaintData.permanent_id,
        category: complaintData.category,
        subcategory: complaintData.subcategory,
        description: complaintData.description,
        address: complaintData.address,
        latitude: complaintData.latitude,
        longitude: complaintData.longitude,
        priority: complaintData.priority,
        status: complaintData.status,
        slaStartTime: complaintData.sla_start_time,
        slaDurationHours: complaintData.sla_duration_hours,
        slaDeadline: complaintData.sla_deadline,
        createdAt: complaintData.created_at,
        updatedAt: complaintData.updated_at,
        department: dept ? { name: dept.name, code: dept.code } : null,
      },
      images: (images || []).map((img) => ({
        image_url: img.image_url,
        image_type: img.image_type,
      })),
      timeline: (timeline || []).map((h) => ({
        id: h.id,
        oldStatus: h.old_status,
        newStatus: h.new_status,
        notes: h.notes,
        createdAt: h.created_at,
      })),
      aiAnalysis: aiAnalysis ? {
        category: aiAnalysis.category,
        subcategory: aiAnalysis.subcategory,
        departmentRecommendation: aiAnalysis.department_recommendation,
        summary: aiAnalysis.summary,
        recommendedActions: aiAnalysis.recommended_actions,
        confidence: aiAnalysis.confidence,
      } : null,
    })
  } catch (err) {
    console.error('[Public Tracking API Error]', err)
    return NextResponse.json({ error: 'Internal server error while searching ticket.' }, { status: 500 })
  }
}
