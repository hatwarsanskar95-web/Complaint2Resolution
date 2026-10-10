import { createClient } from '@/lib/supabase/server'

export interface SeedAccount {
  role: string
  email: string
  name: string
  department?: string
}

export const DEMO_ACCOUNTS: SeedAccount[] = [
  { role: 'CITIZEN', email: 'hatwarsanskar31@gmail.com', name: 'Sanskar Hatwar' },
  { role: 'OFFICER', email: 'officer.water@c2r.gov.in', name: 'Rajesh Kumar', department: 'Water Management' },
  { role: 'OFFICER', email: 'officer.roads@c2r.gov.in', name: 'Priya Sharma', department: 'Roads / Public Works' },
  { role: 'OFFICER', email: 'officer.sanitation@c2r.gov.in', name: 'Neha Gupta', department: 'Sanitation' },
  { role: 'OFFICER', email: 'officer.electrical@c2r.gov.in', name: 'Amit Verma', department: 'Electrical' },
  { role: 'OFFICER', email: 'officer.drainage@c2r.gov.in', name: 'Suresh Patel', department: 'Drainage' },
  { role: 'OFFICER', email: 'officer.parks@c2r.gov.in', name: 'Kavita Singh', department: 'Parks & Recreation' },
  { role: 'SUPER_ADMIN', email: 'admin@c2r.gov.in', name: 'Central Admin' },
]

/**
 * Canonical departments — MUST match exact names used in analyze/route.ts DEPARTMENTS map.
 * UUIDs are stable and must not be changed; they are referenced by officer_departments and complaints.
 */
export const CANONICAL_DEPARTMENTS = [
  { id: '47f60f28-429e-4cfc-adc1-c048d33eed7d', name: 'Water Management', code: 'WTR' },
  { id: '267d6dc4-1f7a-499e-b8aa-26668e9ce320', name: 'Roads / Public Works', code: 'RDS' },
  { id: 'f4833006-3356-4bf6-9d95-0d81944872a8', name: 'Sanitation', code: 'SAN' },
  { id: '6359ef5c-27e4-4200-a1bb-bc6f609b8486', name: 'Electrical', code: 'ELE' },
  { id: '56c0b101-06a0-4a82-a962-bda1281922db', name: 'Drainage', code: 'DRN' },
  { id: '73730a2f-ac6f-449d-942f-cdb2f99a65d9', name: 'Parks & Recreation', code: 'PRK' },
]

/**
 * Officer profile_id → department_id mapping (canonical UUIDs from profiles table).
 * These must match auth.users / profiles table IDs.
 */
export const CANONICAL_OFFICER_DEPARTMENTS = [
  { profile_id: '0e10dbe0-400f-4e81-a733-9c55c21e2f59', department_id: '47f60f28-429e-4cfc-adc1-c048d33eed7d' }, // Rajesh Kumar → Water Management
  { profile_id: '3f0eb68c-562a-4554-9602-0c709640c823', department_id: '267d6dc4-1f7a-499e-b8aa-26668e9ce320' }, // Priya Sharma → Roads / Public Works
  { profile_id: '13e92d22-be98-4aea-bd6c-c500c6e64710', department_id: 'f4833006-3356-4bf6-9d95-0d81944872a8' }, // Neha Gupta → Sanitation
  { profile_id: '3035c647-254a-4397-bcdc-7952ae35066d', department_id: '6359ef5c-27e4-4200-a1bb-bc6f609b8486' }, // Amit Verma → Electrical
  { profile_id: 'f29ac5d0-a009-4bc0-aff6-f7360ef8a930', department_id: '56c0b101-06a0-4a82-a962-bda1281922db' }, // Suresh Patel → Drainage
  { profile_id: '467cdf8b-2f72-472c-90da-7736128cc364', department_id: '73730a2f-ac6f-449d-942f-cdb2f99a65d9' }, // Kavita Singh → Parks & Recreation
]

export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  try {
    // ── 1. Ensure all 6 canonical departments exist with correct names ──
    const { error: deptErr } = await supabase
      .from('departments')
      .upsert(CANONICAL_DEPARTMENTS, { onConflict: 'id' })

    if (deptErr) {
      throw new Error(`Department upsert failed: ${deptErr.message}`)
    }

    // ── 2. Ensure all officer→department links exist ──
    // Only insert for profiles that actually exist in the profiles table
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .in('id', CANONICAL_OFFICER_DEPARTMENTS.map((od) => od.profile_id))

    if (existingProfiles && existingProfiles.length > 0) {
      const existingProfileIds = new Set(existingProfiles.map((p) => p.id))
      const validMappings = CANONICAL_OFFICER_DEPARTMENTS.filter((od) =>
        existingProfileIds.has(od.profile_id)
      )

      if (validMappings.length > 0) {
        const { error: odErr } = await supabase
          .from('officer_departments')
          .upsert(validMappings, { onConflict: 'profile_id,department_id' })

        if (odErr && !odErr.message.includes('duplicate')) {
          console.warn('[seedDemoData] officer_departments upsert warning:', odErr.message)
        }
      }
    }

    return {
      success: true,
      message: `Seeded ${CANONICAL_DEPARTMENTS.length} departments and officer-department mappings successfully.`,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Seeding failed',
    }
  }
}
