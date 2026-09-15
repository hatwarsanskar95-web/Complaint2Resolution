'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useCitizenTheme } from '@/context/CitizenThemeContext'
import { motion } from 'framer-motion'

export default function CitizenThemeToggle() {
  const { theme, toggleTheme, isDark } = useCitizenTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Day Theme' : 'Switch to Night Theme'}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm border ${
        isDark
          ? 'bg-[#0f241d] border-[#18382c] text-emerald-300 hover:border-emerald-500/50 hover:bg-[#143228]'
          : 'bg-[#f1f5f9] border-[#cbd5e1] text-[#0f172a] hover:bg-[#e2e8f0]'
      }`}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.7, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-1.5"
      >
        {isDark ? (
          <>
            <Moon size={13} className="text-emerald-400 fill-emerald-400/20" />
            <span className="text-[11px] font-semibold text-emerald-300">Night</span>
          </>
        ) : (
          <>
            <Sun size={13} className="text-amber-500 fill-amber-500/20" />
            <span className="text-[11px] font-semibold text-slate-700">Day</span>
          </>
        )}
      </motion.div>
    </button>
  )
}
