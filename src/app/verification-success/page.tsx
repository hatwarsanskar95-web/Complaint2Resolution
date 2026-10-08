'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, ShieldCheck, Leaf } from 'lucide-react'

export default function VerificationSuccessPage() {
  return (
    <div className="min-h-screen bg-[#050C0A] text-slate-100 flex flex-col justify-center items-center p-4 relative font-sans">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md rounded-3xl bg-[#081511]/90 border border-emerald-500/30 p-8 sm:p-10 shadow-[0_0_60px_rgba(16,185,129,0.15)] backdrop-blur-2xl relative z-10 text-center space-y-6">
        {/* Branding header */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Leaf size={18} />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">Complaint2Resolution</span>
        </div>

        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in zoom-in-75 duration-300">
          <CheckCircle2 size={44} />
        </div>

        {/* Main Header & Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Email Verified Successfully
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Your email has been verified successfully. You can now continue to your Complaint2Resolution account.
          </p>
        </div>

        {/* Security badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
          <ShieldCheck size={14} />
          <span>Account Activated</span>
        </div>

        {/* Button to Login */}
        <div className="pt-2">
          <Link
            href="/login"
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to Login</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
