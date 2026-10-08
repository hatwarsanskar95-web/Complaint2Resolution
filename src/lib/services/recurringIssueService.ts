import { createClient } from '@/lib/supabase/server'
import { getGeminiClient, GEMINI_DEFAULT_MODEL } from '@/lib/gemini'

export interface IssueCluster {
  id: string
  category: string
  location_summary: string
  complaint_count: number
  permanent_ids: string[]
  root_cause_hypothesis: string
  preventive_advice: string
  created_at: string
}

export async function detectRecurringIssues(): Promise<IssueCluster[]> {
  const supabase = await createClient()

  // Fetch recent complaints from past 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: complaints } = await supabase
    .from('complaints')
    .select('id, permanent_id, category, subcategory, address, description, created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })

  if (!complaints || complaints.length === 0) return []

  // Group complaints by category & address key
  const groups: Record<string, typeof complaints> = {}
  complaints.forEach((c) => {
    // Basic spatial/category cluster key (category + area name prefix)
    const areaKey = (c.address || 'Central Ward').split(',')[0].trim()
    const key = `${c.category}::${areaKey}`
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  })

  const clusters: IssueCluster[] = []

  for (const [key, items] of Object.entries(groups)) {
    // Filter clusters with >= 3 complaints
    if (items.length >= 3) {
      const category = items[0].category
      const location = items[0].address || 'Central Municipal Ward'
      const ids = items.map((i) => i.permanent_id)

      let rootCause = 'Repeated infrastructure stress or unaddressed root defect in ward area.'
      let advice = 'Conduct comprehensive structural inspection and preventative maintenance.'

      try {
        const gemini = getGeminiClient()
        const prompt = `Analyze this cluster of ${items.length} municipal complaints in category "${category}" around location "${location}".
Descriptions:
${items.map((i) => `- ${i.description}`).join('\n')}

Provide:
1. Root cause hypothesis (1-2 sentences)
2. Preventive advice for department supervisor (1-2 sentences)

Return valid JSON:
{
  "root_cause": "...",
  "preventive_advice": "..."
}`

        const res = await gemini.models.generateContent({
          model: GEMINI_DEFAULT_MODEL,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        })

        const text = res.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)
        if (parsed.root_cause) rootCause = parsed.root_cause
        if (parsed.preventive_advice) advice = parsed.preventive_advice
      } catch {
        // Fallback default values
      }

      clusters.push({
        id: `cluster-${key.replace(/[^a-zA-Z0-9]/g, '-')}`,
        category,
        location_summary: location,
        complaint_count: items.length,
        permanent_ids: ids,
        root_cause_hypothesis: rootCause,
        preventive_advice: advice,
        created_at: new Date().toISOString(),
      })
    }
  }

  return clusters
}
