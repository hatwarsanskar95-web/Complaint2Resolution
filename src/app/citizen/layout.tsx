'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import {
  Home,
  FilePlus,
  FileText,
  CheckSquare,
  HelpCircle,
  User,
  LogOut,
  Menu,
  X,
  MapPin,
  Crosshair,
  ChevronDown,
  Leaf,
  Sprout,
  Sun,
  Moon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getStoredCitizenLocation } from '@/components/citizen/CitizenLocationSync'
import { CitizenThemeProvider, useCitizenTheme } from '@/context/CitizenThemeContext'
import CitizenThemeToggle from '@/components/citizen/CitizenThemeToggle'
import LocationUpdateModal from '@/components/citizen/LocationUpdateModal'
import { PageTransition } from '@/components/ui/motion'

const navItems = [
  { href: '/citizen/dashboard', icon: <Home size={18} />, label: 'Home' },
  { href: '/citizen/report', icon: <FilePlus size={18} />, label: 'Report an Issue' },
  { href: '/citizen/complaints', icon: <FileText size={18} />, label: 'My Complaints' },
  { href: '/citizen/verification', icon: <CheckSquare size={18} />, label: 'Resolution Verification' },
  { href: '/citizen/help', icon: <HelpCircle size={18} />, label: 'Help & Support' },
  { href: '/citizen/profile', icon: <User size={18} />, label: 'Profile' },
]

function CitizenLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { isDark } = useCitizenTheme()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [citizenLocation, setCitizenLocation] = useState('Nashik, Maharashtra')
  const [userName, setUserName] = useState('Citizen')
  const [showLocationModal, setShowLocationModal] = useState(false)

  useEffect(() => {
    const loc = getStoredCitizenLocation()
    if (loc && loc.address) {
      setCitizenLocation(loc.address)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
          if (data && data.full_name) setUserName(data.full_name)
          else if (user.email) setUserName(user.email.split('@')[0])
        })
      }
    })

    const handleLocationUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ address: string }>
      if (customEvt.detail?.address) {
        setCitizenLocation(customEvt.detail.address)
      }
    }
    window.addEventListener('citizen_location_updated', handleLocationUpdate)
    return () => window.removeEventListener('citizen_location_updated', handleLocationUpdate)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'C2R'

  const SidebarContent = () => (
    <aside className={`flex flex-col h-full p-5 border-r w-64 select-none justify-between transition-colors duration-200 ${
      isDark ? 'bg-[#07130f] border-[#18382c] text-[#f1f5f9]' : 'bg-[#f8faf7] border-[#e2e8f0] text-[#0f172a]'
    }`}>
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#14532d] flex items-center justify-center text-white shadow-md">
            <Sprout size={20} className="text-emerald-300" />
          </div>
          <div>
            <span className={`font-extrabold text-sm tracking-tight block ${isDark ? 'text-white' : 'text-[#0f172a]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
              Complaint2Resolution
            </span>
            <span className={`text-[10px] font-medium block ${isDark ? 'text-emerald-400/80' : 'text-[#475569]'}`}>
              People Speak. Problems Solve.
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/citizen/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? isDark
                      ? 'bg-[#14532d] text-emerald-200 shadow-sm font-bold border border-emerald-600/40'
                      : 'bg-[#dcfce7] text-[#14532d] shadow-sm font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#0f241d]'
                    : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#edf4ec]'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={isActive ? (isDark ? 'text-emerald-300' : 'text-[#14532d]') : 'text-[#64748b]'}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className={`flex flex-col gap-3 pt-4 border-t relative overflow-hidden ${isDark ? 'border-[#18382c]' : 'border-[#e2e8f0]'}`}>
        <div className="px-2 py-1 flex items-center justify-between z-10">
          <span className="text-[11px] font-medium text-slate-400">Theme</span>
          <CitizenThemeToggle />
        </div>

        {/* Bottom City Vector Illustration & Slogan matching screenshot */}
        <div className="relative rounded-2xl overflow-hidden p-4 mt-2 bg-gradient-to-t from-[#03150d] via-[#062418] to-transparent border border-emerald-900/40 flex flex-col justify-end min-h-[120px]">
          <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay">
            <svg viewBox="0 0 200 120" className="w-full h-full fill-emerald-400">
              <path d="M0 120 L0 80 L15 80 L15 60 L30 60 L30 95 L50 95 L50 40 L70 40 L70 100 L95 100 L95 20 L120 20 L120 120 Z" />
            </svg>
          </div>
          <div className="relative z-10 font-serif italic text-emerald-300 space-y-0.5">
            <p className="text-xs font-bold leading-tight">People Speak</p>
            <p className="text-xs font-bold leading-tight pl-2 text-emerald-400">Problems Solve</p>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#050c09] text-[#f1f5f9]' : 'bg-[#f4f7f3] text-[#0f172a]'
    }`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
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
              className="flex-1 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className={`flex items-center justify-between px-6 py-3 border-b backdrop-blur-md z-20 transition-colors duration-200 ${
          isDark
            ? 'bg-[#07130f]/90 border-[#18382c]'
            : 'bg-white/90 border-[#e2e8f0]'
        }`}>
          <div className="flex items-center gap-3">
            <button
              className={`md:hidden p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#0f241d] text-slate-300' : 'hover:bg-slate-100 text-slate-600'
              }`}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Current Location Badge */}
            <div className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-medium ${
              isDark
                ? 'bg-[#0f241d] border-[#18382c] text-slate-200'
                : 'bg-[#e2e8f0]/60 border-slate-300/80 text-slate-700'
            }`}>
              <MapPin size={14} className="text-[#15803d]" />
              <span>Current Location: <strong className={isDark ? 'text-white font-semibold' : 'text-slate-900 font-semibold'}>{citizenLocation}</strong></span>
              <button
                onClick={() => setShowLocationModal(true)}
                title="Update Location"
                className="p-1 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer ml-0.5"
              >
                <Crosshair size={13} />
              </button>
              <button
                onClick={() => setShowLocationModal(true)}
                className="px-2.5 py-0.5 rounded-lg bg-[#14532d] hover:bg-[#166534] text-white text-[11px] font-bold transition-colors cursor-pointer ml-1"
              >
                Update
              </button>
            </div>
          </div>

          {/* Right Header: Theme Toggle + Citizen Profile */}
          <div className="flex items-center gap-3">
            {/* Day / Night Theme Toggle */}
            <CitizenThemeToggle />

            {/* Profile */}
            <Link href="/citizen/profile" className="flex items-center gap-2.5 no-underline group cursor-pointer">
              <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shadow-sm ${
                isDark ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/50' : 'bg-[#1e293b] text-white'
              }`}>
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className={`text-xs font-bold leading-tight transition-colors ${
                  isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-[#14532d]'
                }`}>
                  {userName}
                </p>
                <p className={`text-[10px] leading-tight font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Citizen</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-200" />
            </Link>
          </div>
        </header>

        {/* Main Body */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-200 ${
          isDark ? 'bg-[#050c09]' : 'bg-[#f4f7f3]'
        }`}>
          <PageTransition key={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Global Location Update Modal */}
      <LocationUpdateModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onUpdated={(loc) => setCitizenLocation(loc.address)}
      />
    </div>
  )
}

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <CitizenThemeProvider>
      <CitizenLayoutInner>{children}</CitizenLayoutInner>
    </CitizenThemeProvider>
  )
}
