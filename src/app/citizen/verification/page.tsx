'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Camera,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink
} from 'lucide-react'

interface VerificationComplaint {
  id: string
  permanent_id: string
  category: string
  description: string
  address: string
  status: string
  created_at: string
}

export default function ResolutionVerificationPage() {
  const supabase = createClient()
  const [complaints, setComplaints] = useState<VerificationComplaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadVerificationComplaints() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('complaints')
        .select('id, permanent_id, category, description, address, status, created_at')
        .eq('citizen_id', user.id)
        .in('status', ['RESOLVED', 'CLOSED', 'IN_PROGRESS'])
        .order('created_at', { ascending: false })

      if (data) setComplaints(data as VerificationComplaint[])
      setLoading(false)
    }
    loadVerificationComplaints()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="rounded-3xl bg-gradient-to-br from-[#0f2e21] via-[#14532d] to-[#064e3b] text-white p-7 sm:p-9 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
            <CheckSquare size={14} />
            <span>Citizen Verification Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Resolution Verification &amp; Quality Audit
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
            Inspect officer resolution submissions, compare before/after photographic evidence, and confirm if your civic issue has been genuinely resolved.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white border border-[#e2e8f0] animate-pulse" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-3xl bg-white border border-[#e2e8f0] p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#15803d] flex items-center justify-center">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">No Complaints Awaiting Verification</h3>
            <p className="text-xs text-[#64748b] mt-1 max-w-sm">
              When a municipal officer submits a fix for your grievance, it will appear here for your confirmation and signature.
            </p>
          </div>
          <Link
            href="/citizen/complaints"
            className="px-5 py-2.5 rounded-full bg-[#15803d] text-white text-xs font-bold shadow-md hover:bg-[#166534] transition-all"
          >
            View My Complaints →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl bg-white border border-[#e2e8f0] p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {c.permanent_id}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {c.status}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">{c.category}</h3>
                <p className="text-xs text-[#475569]">{c.description}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-[#64748b] pt-1">
                  <MapPin size={12} className="text-[#15803d]" />
                  <span>{c.address}</span>
                </div>
              </div>

              <Link
                href={`/citizen/complaints/${c.id}`}
                className="px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <span>Verify Fix</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
