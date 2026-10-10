import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGeminiClient, GEMINI_DEFAULT_MODEL } from '@/lib/gemini'
import { determineRoutingDecision } from '@/lib/services/routingService'
import { z } from 'zod'

// Exact department names from the database
const DEPARTMENTS: Record<string, string[]> = {
  'Roads / Public Works': ['Roads', 'Potholes', 'Footpath', 'Divider', 'Traffic Signal', 'Road Lighting', 'Road Damage'],
  'Water Management': ['Water Supply', 'Water Leakage', 'Water Quality', 'No Water', 'Water Pressure', 'Water Pipe', 'Water Pump'],
  'Sanitation': ['Garbage', 'Waste Disposal', 'Open Defecation', 'Toilet', 'Sewage'],
  'Drainage': ['Drainage', 'Waterlogging', 'Stormwater', 'Flood', 'Blocked Drain'],
  'Electrical': ['Street Light', 'Power Outage', 'Fallen Wire', 'Electrical Hazard'],
  'Parks & Recreation': ['Park', 'Garden', 'Trees', 'Encroachment', 'Public Space'],
}

// Zod Schema for Structured Output Validation
const AiAnalysisResultSchema = z.object({
  category: z.string().catch('Roads / Public Works'),
  subcategory: z.string().catch('General Civic Issue'),
  department: z.string().catch('Roads / Public Works'),
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
Analyze the provided multi-angle photographic evidence AND the citizen's written description to classify this complaint accurately.

IMPORTANT CLASSIFICATION RULES (follow strictly):
- If images show water leaking from a PIPE, tap, pump, or water supply line → category = "Water Management", department = "Water Management"
- If images show road SURFACE damage (pothole, cracked road, broken pavement) → category = "Roads / Public Works", department = "Roads / Public Works"
- A water leak NEAR a road does NOT make it a Roads complaint — classify by what is BROKEN, not where it is
- If images show drainage overflow or waterlogging from drains → category = "Drainage", department = "Drainage"
- If images show uncollected garbage or waste → category = "Sanitation", department = "Sanitation"
- If images show broken/missing street lights → category = "Electrical", department = "Electrical"
- If images show damage in a park or garden → category = "Parks & Recreation", department = "Parks & Recreation"
- If images are unclear or contradict description, set confidence < 0.60 and needs_human_review = true
- Do NOT invent visual observations not visible in the images

Citizen description: "${description}"
Location: ${address} (Lat: ${latitude}, Lng: ${longitude})

Based on BOTH the visual evidence AND the description, return a JSON object with exactly these fields:
{
  "category": "<one of: ${Object.keys(DEPARTMENTS).join(', ')}>",
  "subcategory": "<specific subcategory based on what you observe>",
  "department": "<exact department name from the category list above>",
  "priority": "<CRITICAL|HIGH|MEDIUM|LOW>",
  "summary": "<1-2 sentence factual summary of what is observed and why it was classified this way>",
  "recommended_actions": ["<step 1>", "<step 2>", "<step 3>"],
  "suggested_sla_hours": <number>,
  "confidence": <0.0 to 1.0>,
  "needs_human_review": <true if uncertain, false if confident>
}

Priority rules:
- CRITICAL: Immediate safety hazard (live electrical wires, open manhole, severe sewage flood)
- HIGH: Major disruption (large road craters, main water line burst, overflowing garbage)
- MEDIUM: Moderate civic issue (minor leak, overflowing bin, minor pothole)
- LOW: Minor cosmetic issue (broken park bench, faded sign)

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
    // Keyword-based fallback department selection (better than always defaulting to Roads)
    const descLower = (description || '').toLowerCase()
    let fallbackCategory = 'Roads / Public Works'
    let fallbackDept = 'Roads / Public Works'
    let fallbackSubcategory = 'General Civic Issue'

    if (/water|leak|pipe|pump|supply|tap|pressure|flow/.test(descLower)) {
      fallbackCategory = 'Water Management'
      fallbackDept = 'Water Management'
      fallbackSubcategory = 'Water Leakage'
    } else if (/drain|waterlog|flood|overflow|sewer|sewage/.test(descLower)) {
      fallbackCategory = 'Drainage'
      fallbackDept = 'Drainage'
      fallbackSubcategory = 'Blocked Drain'
    } else if (/garbage|waste|trash|litter|bin|sanit/.test(descLower)) {
      fallbackCategory = 'Sanitation'
      fallbackDept = 'Sanitation'
      fallbackSubcategory = 'Garbage'
    } else if (/light|electric|power|wire/.test(descLower)) {
      fallbackCategory = 'Electrical'
      fallbackDept = 'Electrical'
      fallbackSubcategory = 'Street Light'
    } else if (/park|garden|tree|grass/.test(descLower)) {
      fallbackCategory = 'Parks & Recreation'
      fallbackDept = 'Parks & Recreation'
      fallbackSubcategory = 'Park'
    }

    console.warn('[Analyze API] All Gemini AI retry attempts failed. Applying keyword-based fallback.')
    analysis = {
      category: fallbackCategory,
      subcategory: fallbackSubcategory,
      department: fallbackDept,
      priority: 'MEDIUM',
      summary: description.slice(0, 150),
      recommended_actions: ['Conduct on-site inspection', 'Assign to divisional field unit', 'Complete resolution within SLA'],
      suggested_sla_hours: 48,
      confidence: 0.40,
      needs_human_review: true,
    }
    }

    // Determine smart routing decision prior to inserting complaint
    const { data: depts } = await supabase.from('departments').select('id, name, code')
    const routingDecision = determineRoutingDecision(
      {
        category: analysis.category,
        subcategory: analysis.subcategory,
        department: analysis.department,
        priority: analysis.priority,
        confidence: analysis.confidence,
        needs_human_review: analysis.needs_human_review || !aiSuccess,
      },
      depts || []
    )

    // Initial creation of complaint record with department_id, priority, status and SLA already populated
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
        department_id: routingDecision.departmentId,
        priority: routingDecision.priority,
        status: routingDecision.status,
        sla_start_time: routingDecision.slaStart,
        sla_duration_hours: routingDecision.slaDurationHours,
        sla_deadline: routingDecision.slaDeadline,
      })
      .select()
      .single()

    if (complaintErr) throw new Error(complaintErr.message)

    // Record initial status in status history
    await supabase.from('complaint_status_history').insert({
      complaint_id: complaint.id,
      old_status: null,
      new_status: routingDecision.status,
      updated_by: user.id,
      notes: routingDecision.routingReason,
    })

    // Save all uploaded image records (citizen INSERT policy allows this)
    for (const imgUrl of rawImages) {
      await supabase.from('complaint_images').insert({
        complaint_id: complaint.id,
        image_url: imgUrl,
        image_type: 'original',
      })
    }

    // Persist AI analysis via SECURITY DEFINER RPC (no INSERT RLS policy for citizens on complaint_ai_analysis)
    await supabase.rpc('insert_ai_analysis', {
      p_complaint_id: complaint.id,
      p_category: analysis.category,
      p_subcategory: analysis.subcategory,
      p_department_recommendation: analysis.department,
      p_priority_recommendation: analysis.priority,
      p_summary: analysis.summary,
      p_recommended_actions: analysis.recommended_actions,
      p_suggested_sla_hours: analysis.suggested_sla_hours,
      p_confidence: analysis.confidence,
      p_needs_human_review: analysis.needs_human_review,
      p_raw_response: { ...analysis, ai_status: aiSuccess ? 'SUCCESS' : 'AI_PROCESSING_FAILED' },
    })

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

