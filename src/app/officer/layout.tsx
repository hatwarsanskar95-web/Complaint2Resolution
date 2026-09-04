'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/officer/login')
    router.refresh()
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full p-4 border-r border-[var(--bg-border)] bg-[var(--bg-surface)] w-60">
      <div className="flex items-center gap-2 px-2 py-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-accent)] to-[var(--brand-primary)] flex items-center justify-center">
          <Shield size={15} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight block">C2Resolution</span>
          <span className="text-xs text-[var(--text-muted)]">Officer Portal</span>
        </div>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        <Link href="/officer/dashboard"
          className={`nav-link ${pathname.startsWith('/officer/dashboard') ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}>
          <LayoutDashboard size={18} /> Queue
        </Link>
      </nav>
      <div className="border-t border-[var(--bg-border)] pt-4">
        <button onClick={handleLogout} className="nav-link w-full text-left text-[var(--brand-danger)] hover:bg-[hsla(0,84%,60%,0.08)]">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex flex-col"><Sidebar /></div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex flex-col"><Sidebar /></div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--bg-border)] bg-[var(--bg-surface)]">
          <button className="md:hidden p-1.5 rounded-md hover:bg-[var(--bg-elevated)]" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
