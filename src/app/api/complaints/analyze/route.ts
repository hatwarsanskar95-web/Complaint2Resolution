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

    const body = await request.json()
    const { description, latitude, longitude, address } = body

    // Support both single imageUrl and array of imageUrls (3-5 images)
    const rawImages: string[] = Array.isArray(body.imageUrls)
      ? body.imageUrls
      : body.imageUrl
      ? [body.imageUrl]
      : []

    if (rawImages.length === 0 || !description || latitude === undefined || longitude === undefined || !address) {
      return NextResponse.json({ error: 'All fields (at least 3 photos, location, and description) are required.' }, { status: 400 })
    }

    // Fetch up to 3 image buffers for Gemini multimodal analysis
    const imageParts: { inlineData: { data: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' } }[] = []

    for (const url of rawImages.slice(0, 3)) {
      try {
        const imgRes = await fetch(url)
        if (imgRes.ok) {
          const imgBuffer = await imgRes.arrayBuffer()
          const base64 = Buffer.from(imgBuffer).toString('base64')
          const mimeType = (imgRes.headers.get('content-type') as 'image/jpeg' | 'image/png' | 'image/webp') || 'image/jpeg'
          imageParts.push({
            inlineData: {
              data: base64,
              mimeType,
            },
          })
        }
      } catch (e) {
        console.warn('[Analyze API] Could not fetch image for AI analysis:', url, e)
      }
    }

    const prompt = `You are an AI assistant for a municipal civic complaint management system in India. 
Analyze the provided multi-angle photographic evidence and citizen description to classify this complaint.

Description from citizen: "${description}"
Location: ${address} (Lat: ${latitude}, Lng: ${longitude})

Based on the evidence and description, return a JSON object with exactly these fields:
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
- CRITICAL: Immediate safety hazard (live electrical wires, open manhole, severe sewage flood, bridge collapse)
- HIGH: Major disruption (large road craters, main water line burst, overflowing garbage blockade)
- MEDIUM: Moderate civic inconvenience (minor leak, overflowing bin, unpaved ditch)
- LOW: Minor cosmetic issue (broken park bench, overgrown grass, faded sign)

Respond with ONLY the JSON object, no markdown.`

    const model = ai.models
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
      const response = await model.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              ...imageParts,
              { text: prompt },
            ],
          },
        ],
      })

      const text = response.text ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      analysis = JSON.parse(clean)
    } catch (aiErr) {
      console.warn('[Analyze API] Gemini AI fallback activated:', aiErr)
      // Fallback classification if AI response parsing fails
      analysis = {
        category: 'Roads & Potholes',
        subcategory: 'General Civic Issue',
        department: 'Roads & Potholes',
        priority: 'MEDIUM',
        summary: description.slice(0, 150),
        recommended_actions: ['Conduct on-site inspection', 'Assign to divisional field unit', 'Complete resolution within SLA'],
        suggested_sla_hours: 48,
        confidence: 0.85,
        needs_human_review: false,
      }
    }

    // Look up matching department
    const { data: depts } = await supabase.from('departments').select('id, name, code')
    const dept = depts?.find(
      (d: { id: string; name: string; code: string }) =>
        d.name.toLowerCase().includes(analysis.department.toLowerCase()) ||
        analysis.department.toLowerCase().includes(d.name.toLowerCase()) ||
        (analysis.category && d.name.toLowerCase().includes(analysis.category.split(' ')[0].toLowerCase()))
    )

    const priority = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(analysis.priority)
      ? analysis.priority
      : 'MEDIUM'

    const slaHours = SLA_HOURS[priority] ?? 48
    const now = new Date()
    const slaDeadline = new Date(now.getTime() + slaHours * 3600 * 1000)

    // Create the complaint record
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

    // Save all uploaded image records (up to 5)
    for (const imgUrl of rawImages) {
      await supabase.from('complaint_images').insert({
        complaint_id: complaint.id,
        image_url: imgUrl,
        image_type: 'original',
      })
    }

    // Save AI analysis results
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
