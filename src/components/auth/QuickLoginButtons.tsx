'use client'

import React from 'react'
import { KeyRound, UserCheck, ShieldCheck, HardHat, Sparkles } from 'lucide-react'

interface QuickLoginButtonsProps {
  onSelectAccount: (email: string, pass: string) => void
  roleFilter?: 'CITIZEN' | 'OFFICER' | 'ADMIN'
}

export default function QuickLoginButtons({ onSelectAccount, roleFilter }: QuickLoginButtonsProps) {
  const accounts = [
    {
      role: 'CITIZEN',
      label: 'Citizen Demo',
      email: 'citizen@demo.in',
      pass: 'Password123!',
      icon: <UserCheck className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      role: 'OFFICER',
      label: 'Water Officer',
      email: 'officer.water@demo.in',
      pass: 'Password123!',
      icon: <HardHat className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      role: 'OFFICER',
      label: 'Roads Officer',
      email: 'officer.roads@demo.in',
      pass: 'Password123!',
      icon: <HardHat className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      role: 'ADMIN',
      label: 'Water Dept Admin',
      email: 'admin.water@demo.in',
      pass: 'Password123!',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      role: 'ADMIN',
      label: 'Super Admin',
      email: 'superadmin@demo.in',
      pass: 'Password123!',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />,
    },
  ]

  const filtered = roleFilter ? accounts.filter((a) => a.role === roleFilter) : accounts

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-2.5 my-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Hackathon Quick-Login Helpers</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {filtered.map((acc) => (
          <button
            key={acc.email}
            type="button"
            onClick={() => onSelectAccount(acc.email, acc.pass)}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {acc.icon}
            <span>{acc.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
