import { createClient } from '@/lib/supabase/server'
import { getGeminiClient, GEMINI_DEFAULT_MODEL } from '@/lib/gemini'

export interface DuplicateCheckResult {
  isDuplicate: boolean
  matchedComplaintId?: string
  matchedPermanentId?: string
  confidence?: number
  reasoning?: string
}

export async function checkDuplicateComplaint(
  category: string,
  address: string,
  description: string
): Promise<DuplicateCheckResult> {
  const supabase = await createClient()

  // Find active complaints in the same category
  const { data: candidates } = await supabase
    .from('complaints')
    .select('id, permanent_id, category, subcategory, address, description, created_at')
    .eq('category', category)
    .not('status', 'in', '("CLOSED","RESOLVED")')
    .order('created_at', { ascending: false })
    .limit(10)

  if (!candidates || candidates.length === 0) {
    return { isDuplicate: false }
  }

  // Filter candidates with matching address keyword
  const addressKeyword = (address || '').split(',')[0].trim().toLowerCase()
  const matchingCandidates = candidates.filter((c) =>
    (c.address || '').toLowerCase().includes(addressKeyword) || addressKeyword.includes((c.address || '').toLowerCase())
  )

  if (matchingCandidates.length === 0) {
    return { isDuplicate: false }
  }

  // Use Gemini to verify similarity
  try {
    const gemini = getGeminiClient()
    const prompt = `Compare a NEW complaint submission against existing active municipal complaints to detect if it is a DUPLICATE.

NEW COMPLAINT:
Category: "${category}"
Location: "${address}"
Description: "${description}"

EXISTING CANDIDATES:
${matchingCandidates.map((c) => `ID: ${c.permanent_id} | Location: "${c.address}" | Description: "${c.description}"`).join('\n')}

Determine if NEW COMPLAINT refers to the SAME physical issue/location as any EXISTING CANDIDATE.

Return valid JSON ONLY:
{
  "is_duplicate": boolean,
  "matched_permanent_id": string or null,
  "confidence": number (0.0 to 1.0),
  "reasoning": "brief explanation"
}`

    const res = await gemini.models.generateContent({
      model: GEMINI_DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const text = res.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (parsed.is_duplicate && parsed.confidence >= 0.70 && parsed.matched_permanent_id) {
      const matchObj = matchingCandidates.find((c) => c.permanent_id === parsed.matched_permanent_id)
      return {
        isDuplicate: true,
        matchedComplaintId: matchObj?.id,
        matchedPermanentId: parsed.matched_permanent_id,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
      }
    }
  } catch (err) {
    console.error('Duplicate detection error:', err)
  }

  return { isDuplicate: false }
}
