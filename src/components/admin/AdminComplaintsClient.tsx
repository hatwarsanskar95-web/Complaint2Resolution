'use client'

import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Eye,
  Clock,
  AlertOctagon,
  Shield,
  Building,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  User,
  History
} from 'lucide-react'

interface ComplaintItem {
  id: string
  permanent_id: string
  category: string
  description: string
  address: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: string
  sla_deadline: string
  created_at: string
  departments?: { id: string; name: string } | null
  profiles?: { full_name: string } | null
}

interface AdminComplaintsClientProps {
  departments: Array<{ id: string; name: string }>
}

export default function AdminComplaintsClient({ departments }: AdminComplaintsClientProps) {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)

  // Quick inspect drawer state
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null)
  const [timeline, setTimeline] = useState<any[]>([])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('query', search)
      if (status) params.set('status', status)
      if (departmentId) params.set('department_id', departmentId)
      if (priority) params.set('priority', priority)
      params.set('page', page.toString())
      params.set('limit', '10')

      const res = await fetch(`/api/admin/complaints?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setComplaints(data.complaints || [])
        setTotal(data.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to load complaints:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [search, status, departmentId, priority, page])

  const inspectComplaint = async (item: ComplaintItem) => {
    // Open detailed complaint PDF in new tab immediately
    window.open(`/api/complaints/${item.id}/pdf`, '_blank')
    setSelectedComplaint(item)
    try {
      const res = await fetch(`/api/complaints/${item.id}/timeline`)
      const data = await res.json()
      if (res.ok) {
        setTimeline(data.history || [])
      }
    } catch {
      setTimeline([])
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-400">
            <Building className="w-7 h-7 text-indigo-400" />
            Admin Complaint Monitoring & Audit System
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time search, multi-department filtering, and detailed PDF complaint inspection.
          </p>
        </div>
        <div className="text-sm font-semibold bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-indigo-300">
          Total Found: {total}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search input */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search ID (CR-2026-...), address, description..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-1">
            <select
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.target.value); setPage(1) }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-1">
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1) }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="md:col-span-1 flex items-center justify-end">
            <button
              onClick={() => { setSearch(''); setStatus(''); setDepartmentId(''); setPriority(''); setPage(1) }}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-slate-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-400 font-semibold mr-1">Status Filter:</span>
          {[
            { label: 'All', val: '' },
            { label: 'Pending Routing', val: 'SUBMITTED' },
            { label: 'In Progress', val: 'IN_PROGRESS' },
            { label: 'Near SLA Breach', val: 'NEAR_SLA' },
            { label: 'SLA Breached', val: 'SLA_BREACHED' },
            { label: 'Disputed', val: 'DISPUTED' },
            { label: 'Reopened', val: 'REOPENED' },
            { label: 'Closed', val: 'CLOSED' },
          ].map((chip) => (
            <button
              key={chip.val}
              onClick={() => { setStatus(chip.val); setPage(1) }}
              className={`px-3 py-1 rounded-full text-xs transition-all font-medium ${
                status === chip.val
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading complaints data...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No complaints found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3">ID & Date</th>
                  <th className="p-3">Category & Location</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">SLA Deadline</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {complaints.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-semibold text-indigo-400">
                      <div>{item.permanent_id}</div>
                      <div className="text-[10px] text-slate-500 font-sans font-normal">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-semibold text-slate-200">{item.category}</div>
                      <div className="text-slate-400 truncate text-[11px]">{item.address}</div>
                    </td>
                    <td className="p-3 text-slate-300">
                      {item.departments?.name ?? 'Unassigned'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        item.priority === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                        item.priority === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {item.sla_deadline ? new Date(item.sla_deadline).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => inspectComplaint(item)}
                          className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 px-2.5 py-1 rounded text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect Complaint
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing page {page}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={complaints.length < 10}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Inspect Drawer Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {selectedComplaint.permanent_id}
                </span>
                <h2 className="text-lg font-bold text-slate-100">{selectedComplaint.category}</h2>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 text-slate-400 hover:text-white rounded-md bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action buttons required in Part 1 */}
            <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => window.open(`/api/complaints/${selectedComplaint.id}/pdf`, '_blank')}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4" /> View Detailed PDF
              </button>
              <button
                onClick={() => window.open(`/api/complaints/${selectedComplaint.id}/pdf`, '_blank')}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold text-xs ml-auto transition-colors border border-slate-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div><span className="text-slate-500">Address:</span> {selectedComplaint.address}</div>
                <div><span className="text-slate-500">Description:</span> {selectedComplaint.description}</div>
                <div><span className="text-slate-500">Assigned Officer:</span> {selectedComplaint.profiles?.full_name ?? 'Unassigned'}</div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <History className="w-4 h-4 text-indigo-400" /> Audit Log & Status History
                </h3>
                <div className="space-y-2">
                  {timeline.length === 0 ? (
                    <p className="text-slate-500 italic">No history events logged.</p>
                  ) : (
                    timeline.map((evt, idx) => (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-indigo-300">
                            {evt.old_status} → {evt.new_status}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {new Date(evt.created_at).toLocaleString()}
                          </span>
                        </div>
                        {evt.notes && <p className="text-slate-400">{evt.notes}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

