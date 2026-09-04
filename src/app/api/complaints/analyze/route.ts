import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const DEPARTMENTS: Record<string, string[]> = {
  'Roads & Potholes': ['Roads', 'Potholes', 'Footpath', 'Divider', 'Traffic Signal', 'Road Lighting'],
  'Water Supply': ['Water Supply', 'Water Leakage', 'Water Quality', 'No Water', 'Water Pressure'],
  'Sanitation': ['Garbage', 'Waste Disposal', 'Open Defecation', 'Toilet', 'Sewage'],
  'Drainage': ['Drainage', 'Waterlogging', 'Stormwater', 'Flood', 'Blocked Drain'],
  'Electrical': ['Street Light', 'Power Outage', 'Fallen Wire', 'Electrical Hazard'],
  'Parks & Gardens': ['Park', 'Garden', 'Trees', 'Encroachment', 'Public Space'],
}

const SLA_HOURS: Record<string, number> = {
  CRITICAL: 6,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { imageUrl, description, latitude, longitude, address } = await request.json()

    if (!imageUrl || !description || !latitude || !longitude || !address) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    // Fetch image as base64 for Gemini multimodal
    const imgRes = await fetch(imageUrl)
    const imgBuffer = await imgRes.arrayBuffer()
    const base64 = Buffer.from(imgBuffer).toString('base64')
    const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg'

    const prompt = `You are an AI assistant for a civic complaint management system in India. 
Analyze the provided photo and description to classify this complaint.

Description from citizen: "${description}"
Location: ${address}

Based on the photo and description, return a JSON object with exactly these fields:
{
  "category": "<main category from: ${Object.keys(DEPARTMENTS).join(', ')}>",
  "subcategory": "<specific subcategory>",
  "department": "<exact department name>",
  "priority": "<CRITICAL|HIGH|MEDIUM|LOW>",
  "summary": "<1-2 sentence summary of the issue>",
  "recommended_actions": ["<step 1>", "<step 2>", "<step 3>"],
  "suggested_sla_hours": <number>,
  "confidence": <0.0 to 1.0>,
  "needs_human_review": <true|false>
}

Priority rules:
- CRITICAL: Immediate safety hazard (live wires, sewage overflow, major road collapse)
- HIGH: Significant disruption (large pothole, water supply outage)
- MEDIUM: Moderate issue (minor leak, garbage overflow)
- LOW: Minor issue (broken bench, small pothole)

Respond with ONLY the JSON object, no markdown.`

    const model = ai.models

    const response = await model.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType: mimeType as 'image/jpeg',
              },
            },
            { text: prompt },
          ],
        },
      ],
    })

    const text = response.text ?? ''
    let analysis: {
      category: string
      subcategory: string
      department: string
      priority: string
      summary: string
      recommended_actions: string[]
      suggested_sla_hours: number
      confidence: number
      needs_human_review: boolean
    }

    try {
      const clean = text.replace(/```json|```/g, '').trim()
      analysis = JSON.parse(clean)
    } catch {
      // Fallback if Gemini returns non-JSON
      analysis = {
        category: 'Roads & Potholes',
        subcategory: 'General',
        department: 'Roads & Potholes',
        priority: 'MEDIUM',
        summary: description.slice(0, 150),
        recommended_actions: ['Inspect the issue', 'Assign to relevant officer', 'Resolve within SLA'],
        suggested_sla_hours: 48,
        confidence: 0.5,
        needs_human_review: true,
      }
    }

    // Look up department by name/code
    const { data: depts } = await supabase.from('departments').select('id, name, code')
    const dept = depts?.find(
      (d: { id: string; name: string; code: string }) =>
        d.name.toLowerCase().includes(analysis.department.toLowerCase()) ||
        analysis.department.toLowerCase().includes(d.name.toLowerCase())
    )

    const priority = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(analysis.priority)
      ? analysis.priority
      : 'MEDIUM'

    const slaHours = SLA_HOURS[priority] ?? 48
    const now = new Date()
    const slaDeadline = new Date(now.getTime() + slaHours * 3600 * 1000)

    // Create the complaint
    const { data: complaint, error: complaintErr } = await supabase
      .from('complaints')
      .insert({
        citizen_id: user.id,
        category: analysis.category,
        subcategory: analysis.subcategory,
        description,
        latitude,
        longitude,
        address,
        department_id: dept?.id ?? null,
        priority,
        status: analysis.needs_human_review || !dept ? 'SUBMITTED' : 'RECEIVED',
        sla_start_time: now.toISOString(),
        sla_duration_hours: slaHours,
        sla_deadline: slaDeadline.toISOString(),
      })
      .select()
      .single()

    if (complaintErr) throw new Error(complaintErr.message)

    // Save image record
    await supabase.from('complaint_images').insert({
      complaint_id: complaint.id,
      image_url: imageUrl,
      image_type: 'original',
    })

    // Save AI analysis
    await supabase.from('complaint_ai_analysis').insert({
      complaint_id: complaint.id,
      category: analysis.category,
      subcategory: analysis.subcategory,
      department_recommendation: analysis.department,
      priority_recommendation: priority,
      summary: analysis.summary,
      recommended_actions: analysis.recommended_actions,
      suggested_sla_hours: analysis.suggested_sla_hours,
      confidence: analysis.confidence,
      raw_response: analysis,
    })

    return NextResponse.json({
      complaintId: complaint.id,
      permanentId: complaint.permanent_id,
      category: analysis.category,
      department: dept?.name ?? analysis.department,
      priority,
    })
  } catch (err) {
    console.error('[Analyze API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
