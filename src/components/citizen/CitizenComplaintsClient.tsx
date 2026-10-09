'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  FileText,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  Search,
  Building2,
  Calendar
} from 'lucide-react'

export interface ComplaintItem {
  id: string
  permanent_id: string
  category: string
  subcategory: string
  description: string
  address: string
  status: string
  priority: string
  created_at: string
  sla_deadline: string | null
  departments?: { name: string } | null
}

export default function CitizenComplaintsClient({
  initialComplaints,
}: {
  initialComplaints: ComplaintItem[]
}) {
  // Stable client reference — must NOT be recreated on every render
  // (calling createClient() in component body without useMemo causes [supabase] dep
  // in useEffect to change every render, re-registering the auth listener infinitely)
  const supabase = useMemo(() => createClient(), [])
  const [complaints, setComplaints] = useState<ComplaintItem[]>(initialComplaints)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setComplaints(initialComplaints)
  }, [initialComplaints])

  useEffect(() => {
    const fetchFreshComplaints = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('complaints')
        .select('id, permanent_id, category, subcategory, description, address, status, priority, created_at, sla_deadline, departments(name)')
        .eq('citizen_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setComplaints(data as unknown as ComplaintItem[])
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchFreshComplaints()
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const filtered = complaints.filter((c) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'RESOLVED'
        ? ['RESOLVED', 'CLOSED'].includes(c.status)
        : !['RESOLVED', 'CLOSED'].includes(c.status)

    const matchesSearch =
      c.permanent_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase())

    return matchesFilter && matchesSearch
  })

  function getStatusBadge(status: string) {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'ASSIGNED':
      case 'RECEIVED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      case 'ESCALATED':
        return 'bg-rose-100 text-rose-800 border-rose-300'
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300'
    }
  }

  function getPriorityBadge(priority: string) {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            My Complaints
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Track real-time status, departmental work orders, and SLA deadlines.
          </p>
        </div>
        <Link
          href="/citizen/report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Filters & Search Bar */}
      <div className="rounded-2xl bg-white border border-[#e2e8f0] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === f
                  ? 'bg-[#15803d] text-white shadow-sm'
                  : 'bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              {f === 'ALL' ? 'All Complaints' : f === 'ACTIVE' ? 'Active / In Progress' : 'Resolved'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search by ID, keyword, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#15803d] transition-all"
          />
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-[#e2e8f0] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white border border-[#e2e8f0] p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#15803d] flex items-center justify-center">
            <FileText size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">No Complaints Found</h3>
            <p className="text-xs text-[#64748b] mt-1 max-w-sm">
              {search
                ? 'No matching complaints found. Try clearing your search filter.'
                : 'You have not registered any civic complaints under this filter yet.'}
            </p>
          </div>
          <Link
            href="/citizen/report"
            className="px-5 py-2.5 rounded-full bg-[#15803d] text-white text-xs font-bold shadow-md hover:bg-[#166534] transition-all"
          >
            File a Complaint →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl bg-white border border-[#e2e8f0] hover:border-[#15803d]/50 p-5 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {c.permanent_id || 'CR-PENDING'}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPriorityBadge(c.priority)}`}>
                      {c.priority} PRIORITY
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#0f172a] line-clamp-1">
                    {c.category} {c.subcategory ? `— ${c.subcategory}` : ''}
                  </h3>

                  <p className="text-xs text-[#475569] line-clamp-2">{c.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-[#64748b] pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-[#15803d]" />
                      <span className="truncate max-w-[200px]">{c.address || 'Location Tagged'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 size={12} className="text-blue-600" />
                      <span>{c.departments?.name || 'Unassigned'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Submitted: {new Date(c.created_at).toLocaleDateString()}</span>
                    </span>
                    {c.sla_deadline && (
                      <span className="flex items-center gap-1 text-amber-700 font-semibold">
                        <Clock size={12} />
                        <span>SLA Target: {new Date(c.sla_deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <Link
                    href={`/citizen/complaints/${c.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <span>Track Progress</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
