// ============================================================
// Phase 22 — AI Multimodal Resolution Verification Service
// src/lib/services/aiVerificationService.ts
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { getGeminiClient, GEMINI_DEFAULT_MODEL } from '@/lib/gemini'
import { z } from 'zod'

export type VerificationVerdict =
  | 'RESOLUTION_CONSISTENT'
  | 'POTENTIALLY_UNRESOLVED'
  | 'HUMAN_REVIEW_REQUIRED'

const VerificationSchema = z.object({
  verdict: z.enum(['RESOLUTION_CONSISTENT', 'POTENTIALLY_UNRESOLVED', 'HUMAN_REVIEW_REQUIRED']),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  consistency_notes: z.string().optional(),
})

type VerificationResult = z.infer<typeof VerificationSchema>

/**
 * Fetch an image URL and convert to base64 for Gemini multimodal input.
 */
async function urlToBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const buf = await res.arrayBuffer()
    const base64 = Buffer.from(buf).toString('base64')
    return { data: base64, mimeType: contentType.split(';')[0] }
  } catch {
    return null
  }
}

/**
 * Run AI multimodal verification on a resolution submission.
 * Compares original complaint photo vs officer before/after evidence.
 */
export async function runAiVerification(complaintId: string): Promise<{
  verdict: VerificationVerdict
  confidence: number
  explanation: string
}> {
  const supabase = await createClient()

  // Fetch complaint + resolution submission + images
  const [{ data: complaint }, { data: submission }, { data: images }] = await Promise.all([
    supabase.from('complaints').select('description, category, address, permanent_id').eq('id', complaintId).single(),
    supabase.from('resolution_submissions').select('*').eq('complaint_id', complaintId).order('submitted_at', { ascending: false }).limit(1).single(),
    supabase.from('complaint_images').select('*').eq('complaint_id', complaintId).order('created_at'),
  ])

  if (!complaint || !submission) {
    throw new Error('Complaint or resolution submission not found')
  }

  const originalImg = images?.find((i) => i.image_type === 'original')

  // Build multimodal parts
  const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = []

  parts.push({
    text: `You are an AI verification system for a municipal complaints resolution platform.

TASK: Analyze the provided evidence to determine if the reported complaint has been genuinely resolved.

COMPLAINT: ${complaint.permanent_id}
Category: ${complaint.category}
Location: ${complaint.address}
Citizen's Original Description: "${complaint.description}"

OFFICER'S ACTION TAKEN: "${submission.action_taken}"

Compare the photographic evidence provided and return a JSON verdict with this exact structure:
{
  "verdict": "RESOLUTION_CONSISTENT" | "POTENTIALLY_UNRESOLVED" | "HUMAN_REVIEW_REQUIRED",
  "confidence": <0.0 to 1.0>,
  "explanation": "<2-3 sentences summarizing your assessment>",
  "consistency_notes": "<specific observations about evidence consistency>"
}

IMPORTANT RULES:
- NEVER claim 100% certainty. Use "Evidence appears consistent with resolution" not "fully resolved".
- If images are missing or unclear, use HUMAN_REVIEW_REQUIRED.
- RESOLUTION_CONSISTENT: Clear photographic evidence shows the issue has been addressed.
- POTENTIALLY_UNRESOLVED: Evidence is ambiguous or does not clearly show resolution.
- HUMAN_REVIEW_REQUIRED: Insufficient evidence or contradictory information.

Return ONLY valid JSON, no markdown fences.`
  })

  // Add original complaint photo if available
  if (originalImg?.image_url) {
    const imgData = await urlToBase64(originalImg.image_url)
    if (imgData) {
      parts.push({ text: 'ORIGINAL COMPLAINT PHOTO (what the issue looked like when reported):' })
      parts.push({ inlineData: imgData })
    }
  }

  // Add before/after officer evidence photos
  if (submission.before_photo_url) {
    const imgData = await urlToBase64(submission.before_photo_url)
    if (imgData) {
      parts.push({ text: 'OFFICER BEFORE PHOTO (site condition during/before fix):' })
      parts.push({ inlineData: imgData })
    }
  }

  if (submission.after_photo_url) {
    const imgData = await urlToBase64(submission.after_photo_url)
    if (imgData) {
      parts.push({ text: 'OFFICER AFTER PHOTO (site condition after resolution):' })
      parts.push({ inlineData: imgData })
    }
  }

  const gemini = getGeminiClient()
  const response = await gemini.models.generateContent({
    model: GEMINI_DEFAULT_MODEL,
    contents: [{ role: 'user', parts }],
  })

  const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  let parsed: VerificationResult
  try {
    // Strip any accidental markdown fences
    const clean = rawText.replace(/```json|```/g, '').trim()
    const json = JSON.parse(clean)
    parsed = VerificationSchema.parse(json)
  } catch {
    // Fallback to human review if parsing fails
    parsed = {
      verdict: 'HUMAN_REVIEW_REQUIRED',
      confidence: 0,
      explanation: 'AI verification response could not be parsed. Manual review required.',
    }
  }

  // Save to ai_verifications table
  await supabase.from('ai_verifications').insert({
    complaint_id: complaintId,
    verdict: parsed.verdict,
    confidence: parsed.confidence,
    explanation: parsed.explanation,
    raw_response: { text: rawText, parsed },
  })

  // Transition complaint status based on verdict
  const supabase2 = await createClient()
  const newStatus =
    parsed.verdict === 'RESOLUTION_CONSISTENT'
      ? 'CITIZEN_VERIFICATION'
      : 'HUMAN_REVIEW_REQUIRED'

  const { data: current } = await supabase2.from('complaints').select('status').eq('id', complaintId).single()

  await supabase2.from('complaints').update({ status: newStatus }).eq('id', complaintId)
  await supabase2.from('complaint_status_history').insert({
    complaint_id: complaintId,
    old_status: current?.status ?? 'RESOLUTION_SUBMITTED',
    new_status: newStatus,
    updated_by: null,
    notes: `AI Verification: ${parsed.verdict} (confidence: ${Math.round(parsed.confidence * 100)}%). ${parsed.explanation}`,
  })

  return { verdict: parsed.verdict, confidence: parsed.confidence, explanation: parsed.explanation }
}
