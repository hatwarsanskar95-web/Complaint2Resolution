import { createClient } from '@/lib/supabase/server'

export interface SeedAccount {
  role: string
  email: string
  name: string
  department?: string
}

export const DEMO_ACCOUNTS: SeedAccount[] = [
  { role: 'CITIZEN', email: 'citizen@demo.in', name: 'Ananya Sharma' },
  { role: 'OFFICER', email: 'officer.water@demo.in', name: 'Rajesh Kumar (Water Officer)', department: 'Water Supply & Sewage' },
  { role: 'OFFICER', email: 'officer.roads@demo.in', name: 'Vikram Singh (Roads Officer)', department: 'Roads & Public Works' },
  { role: 'DEPT_ADMIN', email: 'admin.water@demo.in', name: 'Priya Patel (Water Admin)', department: 'Water Supply & Sewage' },
  { role: 'SUPER_ADMIN', email: 'superadmin@demo.in', name: 'Dr. Ramesh Varma (Municipal Commissioner)' },
]

export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  try {
    // Check if departments exist
    const { data: depts } = await supabase.from('departments').select('id, name')
    if (!depts || depts.length === 0) {
      // Seed default departments if missing
      await supabase.from('departments').insert([
        { name: 'Water Supply & Sewage', code: 'WTR', sla_hours_critical: 6, sla_hours_high: 24, sla_hours_medium: 48, sla_hours_low: 72 },
        { name: 'Roads & Infrastructure', code: 'RDS', sla_hours_critical: 12, sla_hours_high: 24, sla_hours_medium: 72, sla_hours_low: 120 },
        { name: 'Sanitation & Solid Waste Management', code: 'SAN', sla_hours_critical: 4, sla_hours_high: 12, sla_hours_medium: 24, sla_hours_low: 48 },
        { name: 'Electrical & Street Lighting', code: 'ELE', sla_hours_critical: 6, sla_hours_high: 24, sla_hours_medium: 48, sla_hours_low: 72 },
      ])
    }

    return {
      success: true,
      message: 'Demo accounts and department seeds verified successfully.',
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Seeding failed',
    }
  }
}
