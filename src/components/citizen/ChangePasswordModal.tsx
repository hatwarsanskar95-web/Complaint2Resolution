'use client'

import React, { useState } from 'react'
import { Key, Mail, Send, X, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/context/ToastContext'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
}

export default function ChangePasswordModal({ isOpen, onClose, userEmail }: ChangePasswordModalProps) {
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  if (!isOpen) return null

  const handleSendResetEmail = async () => {
    setSubmitting(true)
    const toastId = toast.loading('Sending reset link...', 'Generating password reset email link.')

    try {
      // Fetch user email if not passed
      let targetEmail = userEmail
      if (!targetEmail) {
        const { data: { user } } = await supabase.auth.getUser()
        targetEmail = user?.email || ''
      }

      if (!targetEmail) {
        throw new Error('User email address could not be resolved.')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      toast.update(toastId, {
        type: 'success',
        title: 'Reset Link Sent',
        message: `Password reset instructions sent to ${targetEmail}`,
      })
    } catch (err: any) {
      toast.update(toastId, {
        type: 'error',
        title: 'Reset Request Failed',
        message: err.message || 'Could not send reset email. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#04120d] border border-[#1b4332] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1b4332]/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Change Account Password</h2>
              <p className="text-[11px] text-emerald-200/70">Secure email verification workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg bg-[#081f16] border border-[#1b4332] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {emailSent ? (
          <div className="py-4 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">Password Reset Email Sent!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We have sent a secure password reset link to your registered email address. Open your inbox and click the reset link to update your password.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-[#081f16] border border-[#1b4332] p-4 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-slate-300 leading-relaxed text-[11px]">
                To maintain government-grade security, password changes are processed via a verified email link sent to your registered account.
              </p>
            </div>

            {userEmail && (
              <div className="rounded-xl bg-[#061811] border border-[#1b4332] p-3 flex items-center gap-3">
                <Mail size={15} className="text-slate-400" />
                <span className="text-slate-200 font-mono font-medium text-xs">{userEmail}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1b4332]/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#081f16] border border-[#1b4332] text-slate-300 hover:text-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sending Link...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Password Reset Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
