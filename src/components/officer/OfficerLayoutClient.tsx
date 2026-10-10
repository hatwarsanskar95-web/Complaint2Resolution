'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  Clock,
  ShieldCheck,
  BarChart3,
  User,
  LogOut,
  Menu,
  Search,
  Hexagon,
  Leaf,
  ChevronRight,
  Building2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/ui/motion'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: '/officer/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/officer/complaints', label: 'My Complaints', icon: <FileText size={18} /> },
  { href: '/officer/sla', label: 'SLA Tracker', icon: <Clock size={18} /> },
  { href: '/officer/resolutions', label: 'Resolutions', icon: <ShieldCheck size={18} /> },
  { href: '/officer/reports', label: 'Reports', icon: <BarChart3 size={18} /> },
  { href: '/officer/profile', label: 'Profile', icon: <User size={18} /> },
]

interface OfficerLayoutClientProps {
  children: React.ReactNode
  officerName: string
  officerInitials: string
  departmentName: string
  departmentCode: string
}

export default function OfficerLayoutClient({
  children,
  officerName,
  officerInitials,
  departmentName,
  departmentCode,
}: OfficerLayoutClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/officer/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <aside className="flex flex-col h-full p-4 border-r border-[#15231c] bg-[#070e0a] w-64 select-none relative overflow-hidden justify-between">
      <div>
        {/* Branding */}
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] relative">
            <Hexagon size={20} className="fill-emerald-500/30 stroke-white stroke-[2]" />
            <span className="absolute text-[11px] font-bold">C2R</span>
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Complaint2Resolution
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              People Speak. Problems Solve.
            </span>
          </div>
        </div>

        {/* Department Badge — Phase 15 */}
        {departmentName && (
          <div className="mx-1 mb-3 px-3 py-2 rounded-xl bg-emerald-900/25 border border-emerald-500/25 flex items-center gap-2">
            <Building2 size={13} className="text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">Active Department</p>
              <p className="text-xs font-bold text-emerald-300 truncate">{departmentName}</p>
              {departmentCode && (
                <p className="text-[9px] font-mono text-emerald-600">{departmentCode}</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 mt-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/officer/dashboard' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1e3a29] text-emerald-300 font-semibold border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0d1812]'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-emerald-400 opacity-80" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Sidebar */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[#15231c] z-10">
        <div className="p-3 rounded-2xl bg-gradient-to-t from-[#0b1710] to-[#12241a] border border-emerald-900/40 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <Leaf size={14} />
            <span>Field Operations</span>
          </div>
          <p className="text-[11px] font-bold text-slate-200 leading-tight">
            Better Infrastructure
          </p>
          <p className="text-[10px] text-emerald-400/80 font-medium mt-0.5">
            Happier Communities
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#060a08] text-slate-100 font-sans">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col z-10"
            >
              <SidebarContent />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 bg-black/70 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-[#15231c] bg-[#070e0a]/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="relative w-full max-w-sm hidden sm:block">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search complaints, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-14 py-1.5 text-xs rounded-xl bg-[#0b1410] border border-[#16271e] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                Ctrl K
              </span>
            </div>
          </div>

          {/* Center pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/30 text-xs text-emerald-400 font-medium">
            <Building2 size={13} className="text-emerald-400" />
            <span>{departmentName || 'Authorized Operations'} · Active Session</span>
          </div>

          {/* Officer Profile */}
          <div className="flex items-center gap-3">
            <Link
              href="/track"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b1410] border border-[#16271e] hover:border-emerald-500/50 text-xs text-slate-300 hover:text-emerald-400 transition-all cursor-pointer"
            >
              <Search size={13} className="text-emerald-400" />
              <span>Public Tracker</span>
            </Link>
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#15231c]">
              <div className="w-8 h-8 rounded-full bg-amber-600/90 border border-amber-500/40 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                {officerInitials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight">{officerName}</p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {departmentName || 'Field Officer'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#060a08]">
          <PageTransition key={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
