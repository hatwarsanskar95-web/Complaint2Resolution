import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGeminiClient, GEMINI_DEFAULT_MODEL } from '@/lib/gemini'
import { executeSmartRouting } from '@/lib/services/routingService'
import { z } from 'zod'

const DEPARTMENTS: Record<string, string[]> = {
  'Roads & Potholes': ['Roads', 'Potholes', 'Footpath', 'Divider', 'Traffic Signal', 'Road Lighting'],
  'Water Supply': ['Water Supply', 'Water Leakage', 'Water Quality', 'No Water', 'Water Pressure'],
  'Sanitation': ['Garbage', 'Waste Disposal', 'Open Defecation', 'Toilet', 'Sewage'],
  'Drainage': ['Drainage', 'Waterlogging', 'Stormwater', 'Flood', 'Blocked Drain'],
  'Electrical': ['Street Light', 'Power Outage', 'Fallen Wire', 'Electrical Hazard'],
  'Parks & Gardens': ['Park', 'Garden', 'Trees', 'Encroachment', 'Public Space'],
}

// Zod Schema for Structured Output Validation
const AiAnalysisResultSchema = z.object({
  category: z.string().catch('Roads & Potholes'),
  subcategory: z.string().catch('General Civic Issue'),
  department: z.string().catch('Roads & Potholes'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).catch('MEDIUM'),
  summary: z.string().catch('Civic issue reported by citizen needing municipal attention.'),
  recommended_actions: z.array(z.string()).catch(['Conduct on-site inspection', 'Assign to divisional field unit', 'Complete resolution within SLA']),
  suggested_sla_hours: z.number().catch(48),
  confidence: z.number().min(0).max(1).catch(0.85),
  needs_human_review: z.boolean().catch(false),
})

export type AiAnalysisResult = z.infer<typeof AiAnalysisResultSchema>

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

Respond with ONLY the JSON object, no markdown code blocks.`

    let analysis: AiAnalysisResult | null = null
    let aiSuccess = false

    // Exponential Backoff Retry Mechanism (up to 3 attempts)
    const MAX_ATTEMPTS = 3
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const aiClient = getGeminiClient()
        const response = await aiClient.models.generateContent({
          model: GEMINI_DEFAULT_MODEL,
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
        const parsed = JSON.parse(clean)
        
        // Enforce structured JSON output using Zod schema
        const validated = AiAnalysisResultSchema.safeParse(parsed)
        if (validated.success) {
          analysis = validated.data
          aiSuccess = true
          break
        } else {
          console.warn(`[Analyze API] Attempt ${attempt} Zod validation warnings:`, validated.error.format())
          analysis = AiAnalysisResultSchema.parse(parsed)
          aiSuccess = true
          break
        }
      } catch (attemptErr) {
        console.warn(`[Analyze API] Attempt ${attempt}/${MAX_ATTEMPTS} failed:`, attemptErr)
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 500))
        }
      }
    }

    // Fallback handling if all 3 retry attempts fail
    if (!aiSuccess || !analysis) {
      console.warn('[Analyze API] All Gemini AI retry attempts failed. Applying fallback processing.')
      analysis = {
        category: 'Roads & Potholes',
        subcategory: 'General Civic Issue',
        department: 'Roads & Potholes',
        priority: 'MEDIUM',
        summary: description.slice(0, 150),
        recommended_actions: ['Conduct on-site inspection', 'Assign to divisional field unit', 'Complete resolution within SLA'],
        suggested_sla_hours: 48,
        confidence: 0.50,
        needs_human_review: true,
      }
    }

    // Initial creation of complaint record
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
        status: 'SUBMITTED',
      })
      .select()
      .single()

    if (complaintErr) throw new Error(complaintErr.message)

    // Save all uploaded image records
    for (const imgUrl of rawImages) {
      await supabase.from('complaint_images').insert({
        complaint_id: complaint.id,
        image_url: imgUrl,
        image_type: 'original',
      })
    }

    // Persist complete AI analysis to complaint_ai_analysis table
    await supabase.from('complaint_ai_analysis').insert({
      complaint_id: complaint.id,
      category: analysis.category,
      subcategory: analysis.subcategory,
      department_recommendation: analysis.department,
      priority_recommendation: analysis.priority,
      summary: analysis.summary,
      recommended_actions: analysis.recommended_actions,
      suggested_sla_hours: analysis.suggested_sla_hours,
      confidence: analysis.confidence,
      needs_human_review: analysis.needs_human_review,
      raw_response: { ...analysis, ai_status: aiSuccess ? 'SUCCESS' : 'AI_PROCESSING_FAILED' },
    })

    // Execute Smart Department Routing & Fallback Queue Assignment via routingService
    const routingDecision = await executeSmartRouting(
      supabase,
      complaint.id,
      {
        category: analysis.category,
        subcategory: analysis.subcategory,
        department: analysis.department,
        priority: analysis.priority,
        confidence: analysis.confidence,
        needs_human_review: analysis.needs_human_review || !aiSuccess,
      },
      user.id
    )

    return NextResponse.json({
      complaintId: complaint.id,
      permanentId: complaint.permanent_id,
      category: analysis.category,
      department: routingDecision.departmentName ?? analysis.department,
      priority: routingDecision.priority,
      status: routingDecision.status,
      isAutoRouted: routingDecision.isAutoRouted,
      routingReason: routingDecision.routingReason,
      aiStatus: aiSuccess ? 'SUCCESS' : 'AI_PROCESSING_FAILED',
    })
  } catch (err) {
    console.error('[Analyze API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

