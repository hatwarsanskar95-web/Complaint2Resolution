'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Edit2,
  Building2,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Trash2,
  Layers,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from '@/context/ToastContext'

interface Officer {
  id: string
  full_name: string
  email: string
  phone_number: string | null
  role: string
  department_id: string | null
  department_name: string
  department_code: string
  activeLoad: number
  resolvedCount: number
  created_at: string
}

interface DepartmentOption {
  id: string
  name: string
  code: string
}

export default function AdminOfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null)
  const [reassigningOfficer, setReassigningOfficer] = useState<Officer | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formDeptId, setFormDeptId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [offRes, deptRes] = await Promise.all([
        fetch('/api/admin/officers'),
        fetch('/api/admin/departments'),
      ])

      if (offRes.ok) {
        const offData = await offRes.json()
        setOfficers(offData.officers || [])
      }

      if (deptRes.ok) {
        const deptData = await deptRes.json()
        const depts = (deptData.departments || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          code: d.code,
        }))
        setDepartments(depts)
        if (depts.length > 0 && !formDeptId) {
          setFormDeptId(depts[0].id)
        }
      }
    } catch (err) {
      toast.error('Load Error', 'Failed to load officer roster.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreateModal() {
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormPhone('')
    if (departments.length > 0) setFormDeptId(departments[0].id)
    setShowCreateModal(true)
  }

  function openEditModal(officer: Officer) {
    setEditingOfficer(officer)
    setFormName(officer.full_name)
    setFormPhone(officer.phone_number || '')
  }

  function openReassignModal(officer: Officer) {
    setReassigningOfficer(officer)
    setFormDeptId(officer.department_id || departments[0]?.id || '')
  }

  async function handleCreateOfficer(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim() || !formPassword || !formDeptId) {
      toast.warning('Input Required', 'Please fill all required fields.')
      return
    }

    if (formPassword.length < 8) {
      toast.warning('Password Policy', 'Password must be at least 8 characters long.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword,
          department_id: formDeptId,
          phone_number: formPhone.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create officer account')

      toast.success('Officer Provisioned', `Account created for "${formName}".`)
      setShowCreateModal(false)
      loadData()
    } catch (err) {
      toast.error('Provisioning Error', (err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateOfficer(e: React.FormEvent) {
    e.preventDefault()
    if (!editingOfficer) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/officers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOfficer.id,
          full_name: formName.trim(),
          phone_number: formPhone.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update officer')

      toast.success('Officer Updated', 'Officer profile updated successfully.')
      setEditingOfficer(null)
      loadData()
    } catch (err) {
      toast.error('Update Error', (err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReassignDepartment(e: React.FormEvent) {
    e.preventDefault()
    if (!reassigningOfficer || !formDeptId) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/officers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reassigningOfficer.id,
          department_id: formDeptId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reassign department')

      const deptObj = departments.find((d) => d.id === formDeptId)
      toast.success('Department Reassigned', `Officer assigned to "${deptObj?.name || 'Department'}".`)
      setReassigningOfficer(null)
      loadData()
    } catch (err) {
      toast.error('Reassignment Error', (err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevokeAccess(officer: Officer) {
    if (!confirm(`Are you sure you want to revoke officer portal access for "${officer.full_name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/officers?id=${officer.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to revoke access')

      toast.success('Access Revoked', `Officer access for ${officer.full_name} has been revoked.`)
      loadData()
    } catch (err) {
      toast.error('Revocation Error', (err as Error).message)
    }
  }

  const filtered = officers.filter(
    (o) =>
      o.full_name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      o.department_name.toLowerCase().includes(search.toLowerCase()) ||
      o.department_code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              FIELD OPERATIONS COMMAND
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Officer Management &amp; Department Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Provision official municipal accounts, allocate field divisions, and monitor departmental case throughput.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Provision Municipal Officer</span>
        </button>
      </div>

      {/* Metrics and Search Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search officers by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-all shadow-inner"
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            {officers.length}
          </div>
          <div>
            <div className="text-xs font-bold text-white">Active Field Officers</div>
            <div className="text-[10px] text-slate-500">Authorized in portal</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
            {departments.length}
          </div>
          <div>
            <div className="text-xs font-bold text-white">Covered Divisions</div>
            <div className="text-[10px] text-slate-500">Synced to field units</div>
          </div>
        </div>
      </div>

      {/* Officers Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-emerald-400" />
            <span>Authorized Officer Roster</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            {filtered.length} of {officers.length} Officers
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span className="text-xs">Loading officer roster…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No officers matching &quot;{search}&quot;. Click &quot;Provision Municipal Officer&quot; to register one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Officer Name</th>
                  <th className="py-3 px-4">Official Gov Email</th>
                  <th className="py-3 px-4">Assigned Department</th>
                  <th className="py-3 px-4">Active Workload</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((officer) => (
                  <tr key={officer.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center">
                          {officer.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{officer.full_name}</div>
                          {officer.phone_number && (
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Phone size={10} />
                              <span>{officer.phone_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      {officer.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60 text-[10px]">
                          {officer.department_code}
                        </span>
                        <span className="font-semibold text-slate-200 text-xs">
                          {officer.department_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        officer.activeLoad > 0
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      }`}>
                        {officer.activeLoad} Active ({officer.resolvedCount} Resolved)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Active On-Duty</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openReassignModal(officer)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-950 hover:text-indigo-300 text-slate-300 transition-all text-[11px] font-semibold flex items-center gap-1"
                          title="Reassign Department"
                        >
                          <Building2 size={12} />
                          <span>Reassign</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(officer)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevokeAccess(officer)}
                          className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Revoke Access"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROVISION OFFICER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                <span>Provision Municipal Field Officer</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateOfficer} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Full Legal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Inspector Rajesh Kumar"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Official Gov Email Address</label>
                <input
                  type="email"
                  placeholder="officer.name@c2r.gov.in"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Initial Secure Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Designated Department Division</label>
                <select
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500 cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900">
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Official Mobile / Contact (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN DEPARTMENT MODAL */}
      {reassigningOfficer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-400" />
                  <span>Reassign Officer Division</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{reassigningOfficer.full_name} ({reassigningOfficer.email})</p>
              </div>
              <button onClick={() => setReassigningOfficer(null)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReassignDepartment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Select Target Municipal Department</label>
                <select
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900">
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Reassigning this officer will allow them to claim and resolve grievances assigned to the selected division.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReassigningOfficer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Confirm Reassignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT OFFICER MODAL */}
      {editingOfficer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 size={16} className="text-blue-400" />
                <span>Edit Officer Details</span>
              </h3>
              <button onClick={() => setEditingOfficer(null)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateOfficer} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Full Legal Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Contact Phone</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingOfficer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
