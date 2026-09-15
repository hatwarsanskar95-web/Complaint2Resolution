'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Users,
  FileText,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ChevronRight,
  Shield,
  ArrowRight
} from 'lucide-react'
import { toast } from '@/context/ToastContext'

interface DepartmentCategory {
  id: string
  department_id: string
  category: string
  subcategory: string
  default_sla_hours: number
}

interface Department {
  id: string
  code: string
  name: string
  description: string | null
  categories: DepartmentCategory[]
  categoryCount: number
  activeOfficers: number
  openComplaints: number
  resolvedComplaints: number
  totalComplaints: number
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [managingCategoriesDept, setManagingCategoriesDept] = useState<Department | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Category addition state
  const [newCatName, setNewCatName] = useState('')
  const [newSubcatName, setNewSubcatName] = useState('')
  const [newSlaHours, setNewSlaHours] = useState(48)
  const [categorySubmitting, setCategorySubmitting] = useState(false)

  async function loadDepartments() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/departments')
      if (res.ok) {
        const data = await res.json()
        setDepartments(data.departments || [])
      } else {
        toast.error('Load Error', 'Failed to fetch departments.')
      }
    } catch (err) {
      toast.error('Network Error', 'Could not load departments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepartments()
  }, [])

  function openCreateModal() {
    setFormName('')
    setFormCode('')
    setFormDesc('')
    setShowCreateModal(true)
  }

  function openEditModal(dept: Department) {
    setEditingDept(dept)
    setFormName(dept.name)
    setFormCode(dept.code)
    setFormDesc(dept.description || '')
  }

  async function handleCreateDepartment(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim() || !formCode.trim()) {
      toast.warning('Validation Required', 'Please enter department name and code.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
          description: formDesc.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create department')

      toast.success('Department Created', `Division "${formName}" created successfully.`)
      setShowCreateModal(false)
      loadDepartments()
    } catch (err) {
      toast.error('Creation Failed', (err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateDepartment(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDept) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDept.id,
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
          description: formDesc.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update department')

      toast.success('Department Updated', 'Changes saved successfully.')
      setEditingDept(null)
      loadDepartments()
    } catch (err) {
      toast.error('Update Failed', (err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteDepartment(dept: Department) {
    if (!confirm(`Are you sure you want to delete "${dept.name}" (${dept.code})?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/departments?id=${dept.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete department')

      toast.success('Department Deleted', `Division "${dept.name}" removed.`)
      loadDepartments()
    } catch (err) {
      toast.error('Deletion Failed', (err as Error).message)
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!managingCategoriesDept || !newCatName.trim() || !newSubcatName.trim()) {
      toast.warning('Input Required', 'Please enter category and subcategory.')
      return
    }

    setCategorySubmitting(true)
    try {
      const res = await fetch(`/api/admin/departments/${managingCategoriesDept.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCatName.trim(),
          subcategory: newSubcatName.trim(),
          default_sla_hours: newSlaHours,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add category')

      toast.success('Category Added', `Subcategory "${newSubcatName}" registered with ${newSlaHours}h SLA.`)
      setNewCatName('')
      setNewSubcatName('')
      setNewSlaHours(48)
      loadDepartments()

      // Refresh managing dept object
      if (data.category) {
        setManagingCategoriesDept((prev) =>
          prev ? { ...prev, categories: [...(prev.categories || []), data.category] } : null
        )
      }
    } catch (err) {
      toast.error('Error Adding Category', (err as Error).message)
    } finally {
      setCategorySubmitting(false)
    }
  }

  async function handleDeleteCategory(catId: string) {
    if (!managingCategoriesDept) return

    try {
      const res = await fetch(
        `/api/admin/departments/${managingCategoriesDept.id}/categories?categoryId=${catId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) throw new Error('Failed to delete category')

      toast.success('Category Removed', 'Subcategory removed from department taxonomy.')
      setManagingCategoriesDept((prev) =>
        prev ? { ...prev, categories: prev.categories.filter((c) => c.id !== catId) } : null
      )
      loadDepartments()
    } catch (err) {
      toast.error('Deletion Error', (err as Error).message)
    }
  }

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold">
              CENTRAL GOVERNANCE MATRIX
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Department &amp; Category Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure municipal divisions, define issue taxonomy categories, and calibrate default SLA resolution targets.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Municipal Department</span>
        </button>
      </div>

      {/* Search and Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search divisions by name, code (e.g. ROADS, WATER)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-all shadow-inner"
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
            {departments.length}
          </div>
          <div>
            <div className="text-xs font-bold text-white">Active Divisions</div>
            <div className="text-[10px] text-slate-500">Configured in taxonomy</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            {departments.reduce((acc, d) => acc + d.activeOfficers, 0)}
          </div>
          <div>
            <div className="text-xs font-bold text-white">Field Officers</div>
            <div className="text-[10px] text-slate-500">Assigned across divisions</div>
          </div>
        </div>
      </div>

      {/* Departments Roster Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} className="text-blue-400" />
            <span>Municipal Divisions Directory</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            {filtered.length} of {departments.length} Divisions
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span className="text-xs">Loading department matrix…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No departments matching &quot;{search}&quot;. Click &quot;Add Municipal Department&quot; above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Taxonomy Subcategories</th>
                  <th className="py-3 px-4">Field Officers</th>
                  <th className="py-3 px-4">Open Load</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800/60">
                        {dept.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{dept.name}</div>
                      {dept.description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {dept.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setManagingCategoriesDept(dept)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/70 text-indigo-300 hover:text-white hover:bg-indigo-900 border border-indigo-800/50 transition-all font-semibold cursor-pointer"
                      >
                        <Layers size={13} />
                        <span>{dept.categories?.length || 0} Subcategories</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-200 font-semibold">
                        <Users size={13} className="text-blue-400" />
                        <span>{dept.activeOfficers} Officers</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                        dept.openComplaints > 0
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      }`}>
                        {dept.openComplaints} Open ({dept.totalComplaints} Total)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setManagingCategoriesDept(dept)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
                          title="Manage Categories"
                        >
                          <Layers size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(dept)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Edit Department"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDepartment(dept)}
                          className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Department"
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

      {/* CREATE DEPARTMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 size={16} className="text-blue-400" />
                <span>Create Municipal Department</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. Health & Vector Control"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Division Code (Uppercase)</label>
                <input
                  type="text"
                  placeholder="e.g. HEALTH"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  required
                  maxLength={15}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Mandate and operational responsibilities..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-all resize-none"
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
                  <span>Create Division</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 size={16} className="text-blue-400" />
                <span>Edit Department</span>
              </h3>
              <button onClick={() => setEditingDept(null)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Department Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Division Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
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

      {/* MANAGE CATEGORIES & SLA MODAL */}
      {managingCategoriesDept && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-indigo-400" />
                  <span>Categories &amp; SLA Rules — {managingCategoriesDept.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Code: {managingCategoriesDept.code}</p>
              </div>
              <button onClick={() => setManagingCategoriesDept(null)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {/* Existing Categories Table */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Taxonomy Subcategories</h4>
              {managingCategoriesDept.categories?.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No subcategories configured. Add one below to calibrate Gemini AI triage.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {managingCategoriesDept.categories?.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">
                          {cat.subcategory} <span className="text-slate-500 text-[11px]">({cat.category})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
                          <Clock size={12} />
                          <span>Default SLA: {cat.default_sla_hours} Hours</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Subcategory"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Category Form */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Add Subcategory</h4>
              <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Category (e.g. Roads)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Subcategory (e.g. Pothole / Crater)"
                    value={newSubcatName}
                    onChange={(e) => setNewSubcatName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center gap-1.5">
                  <select
                    value={newSlaHours}
                    onChange={(e) => setNewSlaHours(parseInt(e.target.value, 10))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 outline-none focus:border-indigo-500 cursor-pointer font-mono"
                  >
                    <option value={6}>6h (Crit)</option>
                    <option value={24}>24h (High)</option>
                    <option value={48}>48h (Med)</option>
                    <option value={72}>72h (Low)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={categorySubmitting}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {categorySubmitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
