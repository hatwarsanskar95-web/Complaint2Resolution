'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Send,
  MapPin,
  Clock,
  User,
  FileText,
  Building,
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react'

interface HumanReviewItem {
  id: string
  permanent_id: string
  title?: string
  description: string
  category: string
  subcategory?: string
  address: string
  status: string
  created_at: string
  departments?: { id: string; name: string } | null
  original_photo_url?: string | null
  before_photo_url?: string | null
  after_photo_url?: string | null
  dispute_photo_url?: string | null
  dispute_reason?: string | null
  ai_report?: {
    confidence: number
    reasoning: string
    suggested_action?: string
  } | null
}

interface HumanReviewClientProps {
  initialComplaints: HumanReviewItem[]
  departments: Array<{ id: string; name: string }>
}

export default function HumanReviewClient({
  initialComplaints,
  departments,
}: HumanReviewClientProps) {
  const router = useRouter()
  const [complaints, setComplaints] = useState<HumanReviewItem[]>(initialComplaints)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialComplaints.length > 0 ? initialComplaints[0].id : null
  )

  const [notes, setNotes] = useState('')
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const selectedComplaint = complaints.find((c) => c.id === selectedId)

  const handleDecision = async (action: 'CONFIRM_CLOSED' | 'REOPEN_REASSIGN' | 'MANUAL_ROUTE') => {
    if (!selectedId) return
    if (!notes.trim()) {
      alert('Please enter supervisor notes explaining your decision.')
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/complaints/${selectedId}/human-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes,
          department_id: selectedDeptId || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit decision')
      }

      setMessage(`Success: Action '${action}' processed.`)
      // Remove from list
      const updated = complaints.filter((c) => c.id !== selectedId)
      setComplaints(updated)
      setSelectedId(updated.length > 0 ? updated[0].id : null)
      setNotes('')
      setSelectedDeptId('')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
            Human Review & AI Dispute Escalation Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Inspect low-confidence AI classifications and disputed resolutions requiring supervisor override.
          </p>
        </div>
        <div className="bg-amber-950/60 border border-amber-800/80 px-4 py-2 rounded-lg text-amber-300 font-semibold text-sm">
          Pending Queue: {complaints.length}
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-200">Review Queue Empty</p>
          <p className="text-sm">There are no complaints currently flagged for human review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* List sidebar */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Queue Items ({complaints.length})
            </h2>
            {complaints.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === item.id
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-100'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className="text-amber-400">{item.permanent_id}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 text-[10px]">
                    {item.status}
                  </span>
                </div>
                <p className="text-sm font-medium line-clamp-1">{item.category}</p>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.address}</p>
              </button>
            ))}
          </div>

          {/* Inspection workspace (3 columns split screen) */}
          {selectedComplaint && (
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5">
              {/* Column 1: Citizen Original Report */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4" /> 1. Original Citizen Issue
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">ID:</span>{' '}
                    <span className="font-mono text-slate-200">{selectedComplaint.permanent_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Category:</span>{' '}
                    <span className="text-slate-200 font-medium">{selectedComplaint.category}</span>
                  </div>
                  <div className="flex items-start gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedComplaint.address}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded text-slate-300 text-xs mt-2 border border-slate-800">
                    "{selectedComplaint.description}"
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Original Photo Proof:</span>
                  {selectedComplaint.original_photo_url ? (
                    <img
                      src={selectedComplaint.original_photo_url}
                      alt="Original Issue"
                      className="w-full h-40 object-cover rounded-md border border-slate-800"
                    />
                  ) : (
                    <div className="w-full h-32 bg-slate-900 rounded-md border border-slate-800 flex items-center justify-center text-slate-600 text-xs">
                      No Photo
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Officer & Dispute Proof */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <FileText className="w-4 h-4" /> 2. Officer & Citizen Dispute
                </h3>

                <div className="space-y-3">
                  <div className="text-xs">
                    <span className="text-slate-400 block mb-1">Officer Before/After Photos:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedComplaint.before_photo_url ? (
                        <img src={selectedComplaint.before_photo_url} alt="Before" className="h-24 w-full object-cover rounded border border-slate-800" />
                      ) : (
                        <div className="h-24 bg-slate-900 rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">No Before</div>
                      )}
                      {selectedComplaint.after_photo_url ? (
                        <img src={selectedComplaint.after_photo_url} alt="After" className="h-24 w-full object-cover rounded border border-slate-800" />
                      ) : (
                        <div className="h-24 bg-slate-900 rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">No After</div>
                      )}
                    </div>
                  </div>

                  {selectedComplaint.dispute_reason && (
                    <div className="bg-red-950/30 border border-red-900/60 p-2.5 rounded text-xs">
                      <span className="text-red-400 font-semibold block mb-1">Citizen Dispute Reason:</span>
                      <p className="text-red-200">{selectedComplaint.dispute_reason}</p>
                      {selectedComplaint.dispute_photo_url && (
                        <img
                          src={selectedComplaint.dispute_photo_url}
                          alt="Citizen Dispute Proof"
                          className="mt-2 h-28 w-full object-cover rounded border border-red-900"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: AI Analysis & Supervisor Decision */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ShieldAlert className="w-4 h-4" /> 3. AI Insights & Decision
                </h3>

                {selectedComplaint.ai_report && (
                  <div className="bg-slate-900 p-3 rounded-md border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">AI Confidence:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {Math.round((selectedComplaint.ai_report.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {selectedComplaint.ai_report.reasoning}
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Supervisor Action Notes <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Specify reasoning for supervisor decision..."
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-slate-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Department Override (Optional)
                    </label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-slate-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">-- Keep Current Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Decision Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleDecision('CONFIRM_CLOSED')}
                      disabled={submitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirm Resolution & Close
                    </button>

                    <button
                      onClick={() => handleDecision('REOPEN_REASSIGN')}
                      disabled={submitting}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" /> Reopen & Reassign Officer
                    </button>

                    <button
                      onClick={() => handleDecision('MANUAL_ROUTE')}
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" /> Manual Department Route
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
