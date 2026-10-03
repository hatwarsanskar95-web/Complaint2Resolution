import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()

    // Query complaint by permanent_id or id
    const { data: complaint, error: complaintErr } = await supabase
      .from('complaints')
      .select('id, permanent_id, category, subcategory, description, address, latitude, longitude, priority, status, sla_start_time, sla_duration_hours, sla_deadline, created_at, updated_at, departments(name, code)')
      .or(`permanent_id.ilike.${cleanId},id.eq.${cleanId}`)
      .single()

    if (complaintErr || !complaint) {
      return NextResponse.json({ error: 'Complaint ticket not found. Please check the Permanent ID (e.g. CR-2026-000001).' }, { status: 404 })
    }

    // Fetch original images, status history, and AI analysis summary (safe fields only)
    const [{ data: images }, { data: history }, { data: aiAnalysis }] = await Promise.all([
      supabase
        .from('complaint_images')
        .select('image_url, image_type')
        .eq('complaint_id', complaint.id)
        .order('created_at'),
      supabase
        .from('complaint_status_history')
        .select('id, old_status, new_status, notes, created_at')
        .eq('complaint_id', complaint.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('complaint_ai_analysis')
        .select('category, subcategory, department_recommendation, summary, recommended_actions, confidence')
        .eq('complaint_id', complaint.id)
        .single(),
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
        department: complaint.departments
          ? {
              name: (complaint.departments as unknown as { name: string; code: string }).name,
              code: (complaint.departments as unknown as { name: string; code: string }).code,
            }
          : null,
      },
      images: images || [],
      timeline: (history || []).map((h) => ({
        id: h.id,
        oldStatus: h.old_status,
        newStatus: h.new_status,
        notes: h.notes,
        createdAt: h.created_at,
      })),
      aiAnalysis: aiAnalysis
        ? {
            category: aiAnalysis.category,
            subcategory: aiAnalysis.subcategory,
            departmentRecommendation: aiAnalysis.department_recommendation,
            summary: aiAnalysis.summary,
            recommendedActions: aiAnalysis.recommended_actions,
            confidence: aiAnalysis.confidence,
          }
        : null,
    })
  } catch (err) {
    console.error('[Public Tracking API Error]', err)
    return NextResponse.json({ error: 'Internal server error while searching ticket.' }, { status: 500 })
  }
}
