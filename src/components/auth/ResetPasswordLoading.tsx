import React from 'react'
import { Leaf, Loader2 } from 'lucide-react'

export default function ResetPasswordLoading() {
  return (
    <div className="min-h-screen bg-[#050C0A] text-slate-100 flex flex-col justify-center items-center p-4 relative font-sans">
      <div className="w-full max-w-md rounded-3xl bg-[#081511]/90 border border-emerald-500/30 p-8 shadow-2xl backdrop-blur-2xl text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Leaf size={18} />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">Complaint2Resolution</span>
        </div>
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-medium">Preparing password reset...</p>
      </div>
    </div>
  )
}
