'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Search,
  ChevronRight,
  ShieldCheck,
  Hexagon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/ui/motion'
import NotificationBell from '@/components/notifications/NotificationBell'

interface AdminShellProps {
  children: React.ReactNode
  adminName: string | null
  adminEmail: string
  isSuperAdmin: boolean
  departmentName: string | null
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  superAdminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/department-performance', label: 'Department Performance', icon: <BarChart3 size={18} /> },
  { href: '/admin/departments', label: 'Departments', icon: <Building2 size={18} />, superAdminOnly: true },
  { href: '/admin/officers', label: 'Officers', icon: <Users size={18} /> },
  { href: '/admin/complaints', label: 'Complaints', icon: <FileText size={18} /> },
  { href: '/admin/escalations', label: 'Escalations', icon: <AlertTriangle size={18} /> },
  { href: '/admin/reports', label: 'Reports', icon: <BarChart3 size={18} /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
]

export default function AdminShell({
  children,
  adminName,
  adminEmail,
  isSuperAdmin,
  departmentName,
}: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const visibleNav = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const SidebarContent = () => (
    <aside className="flex flex-col h-full p-4 border-r border-[#162032] bg-[#090d16] w-64 select-none relative overflow-hidden justify-between">
      <div>
        {/* Branding */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] relative">
            <Hexagon size={20} className="fill-blue-500/30 stroke-white stroke-[2]" />
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

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {visibleNav.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-[0_0_25px_rgba(37,99,235,0.45)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111827]'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto opacity-80" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Branding & Logout */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[#162032] z-10">
        {/* City Skyline Vector Decoration */}
        <div className="px-2 py-2 rounded-xl bg-slate-900/40 border border-slate-800/60 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none text-blue-400">
            <svg width="120" height="40" viewBox="0 0 120 40" fill="currentColor">
              <path d="M0 40 L0 25 L10 25 L10 15 L20 15 L20 30 L30 30 L30 10 L45 10 L45 35 L60 35 L60 5 L75 5 L75 25 L90 25 L90 18 L100 18 L100 40 Z" />
            </svg>
          </div>
          <p className="text-[11px] font-bold text-slate-300">Cleaner Cities</p>
          <p className="text-[10px] text-slate-400">Stronger Communities</p>
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
    <div className="flex h-screen overflow-hidden bg-[#070b14] text-slate-100 font-sans">
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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header matching screenshot */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-[#162032] bg-[#080d1a]/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Global Search Bar with Ctrl K pill */}
            <div className="relative w-full max-w-sm hidden sm:block">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-14 py-2 text-xs rounded-xl bg-[#0f172a] border border-[#1e293b] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                Ctrl K
              </span>
            </div>
          </div>

          {/* Right section: Date & Admin User Profile */}
          <div className="flex items-center gap-5">
            <NotificationBell />

            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">{formattedDate}</span>
              <span className="text-[10px] text-slate-400">Stay informed. Drive change.</span>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-[#1e293b]">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]">
                {(adminName || adminEmail || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">
                  {adminName || 'Admin'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {isSuperAdmin ? 'Central Authority' : departmentName || 'Dept Admin'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#070b14]">
          <PageTransition key={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
