import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { Complaint, STATUS_LABELS } from '@/lib/types'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

export default async function OfficerResolutionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/officer/login')

  const { data: complaints } = await supabase
    .from('complaints')
    .select('*, departments(name, code)')
    .in('status', ['RESOLUTION_SUBMITTED', 'AI_VERIFICATION', 'CITIZEN_VERIFICATION', 'REOPENED', 'DISPUTED'])
    .order('created_at', { ascending: false })

  const list = (complaints ?? []) as Complaint[]

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <FadeIn direction="up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <ShieldCheck className="text-emerald-400" size={24} /> Resolutions Workflow
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Track submitted resolutions, AI verification status, and citizen verification feedback.
          </p>
        </div>
      </FadeIn>

      {list.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#09120d] rounded-2xl border border-slate-800">
          <p className="text-sm font-semibold">No pending resolution verifications at this time</p>
        </div>
      ) : (
        <StaggerContainer staggerChildren={0.05} className="flex flex-col gap-3">
          {list.map((c) => (
            <StaggerItem key={c.id}>
              <Link
                href={`/officer/complaints/${c.id}`}
                className="p-5 rounded-2xl bg-[#09120d] border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between gap-4 transition-all duration-200 group no-underline"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">{c.permanent_id}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 mt-1">{c.category} · {c.address}</p>
                </div>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  View Status <ArrowRight size={14} />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}
