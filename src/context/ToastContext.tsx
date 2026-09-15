'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  X
} from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: ToastItem[]
  showToast: (toast: Omit<ToastItem, 'id'>) => string
  success: (title: string, message?: string, duration?: number) => string
  error: (title: string, message?: string, duration?: number) => string
  warning: (title: string, message?: string, duration?: number) => string
  info: (title: string, message?: string, duration?: number) => string
  loading: (title: string, message?: string) => string
  update: (id: string, updates: Partial<Omit<ToastItem, 'id'>>) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
  loading: 0, // indefinite
}

// Global reference for calling toast outside React tree if needed
let globalToastRef: ToastContextType | null = null

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    globalToastRef?.success(title, message, duration) ?? '',
  error: (title: string, message?: string, duration?: number) =>
    globalToastRef?.error(title, message, duration) ?? '',
  warning: (title: string, message?: string, duration?: number) =>
    globalToastRef?.warning(title, message, duration) ?? '',
  info: (title: string, message?: string, duration?: number) =>
    globalToastRef?.info(title, message, duration) ?? '',
  loading: (title: string, message?: string) =>
    globalToastRef?.loading(title, message) ?? '',
  update: (id: string, updates: Partial<Omit<ToastItem, 'id'>>) =>
    globalToastRef?.update(id, updates),
  dismiss: (id: string) => globalToastRef?.dismiss(id),
  dismissAll: () => globalToastRef?.dismissAll(),
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const recentToastsRef = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  const showToast = useCallback(
    ({ type, title, message, duration }: Omit<ToastItem, 'id'>): string => {
      // Deduplication check (prevent duplicate messages within 800ms)
      const key = `${type}-${title}-${message || ''}`
      const now = Date.now()
      const lastShown = recentToastsRef.current.get(key)
      if (lastShown && now - lastShown < 800) {
        return ''
      }
      recentToastsRef.current.set(key, now)

      const id = 'toast_' + Math.random().toString(36).substring(2, 9)
      const itemDuration = duration !== undefined ? duration : DEFAULT_DURATIONS[type]

      const newItem: ToastItem = { id, type, title, message, duration: itemDuration }

      setToasts((prev) => [...prev.slice(-4), newItem]) // Keep maximum 5 active toasts

      if (itemDuration > 0) {
        setTimeout(() => {
          dismiss(id)
        }, itemDuration)
      }

      return id
    },
    [dismiss]
  )

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'success', title, message, duration }),
    [showToast]
  )

  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'error', title, message, duration }),
    [showToast]
  )

  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'warning', title, message, duration }),
    [showToast]
  )

  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'info', title, message, duration }),
    [showToast]
  )

  const loading = useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'loading', title, message, duration: 0 }),
    [showToast]
  )

  const update = useCallback(
    (id: string, updates: Partial<Omit<ToastItem, 'id'>>) => {
      setToasts((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const updatedType = updates.type ?? t.type
            const updatedDuration =
              updates.duration !== undefined
                ? updates.duration
                : DEFAULT_DURATIONS[updatedType]

            if (updatedDuration > 0) {
              setTimeout(() => {
                dismiss(id)
              }, updatedDuration)
            }

            return { ...t, ...updates, type: updatedType, duration: updatedDuration }
          }
          return t
        })
      )
    },
    [dismiss]
  )

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    loading,
    update,
    dismiss,
    dismissAll,
  }

  globalToastRef = contextValue

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: () => void
}) {
  const typeStyles = {
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      icon: <CheckCircle2 size={17} className="text-emerald-400" />,
      glow: 'shadow-[0_8px_32px_rgba(16,185,129,0.18)]',
    },
    error: {
      border: 'border-rose-500/35',
      bg: 'bg-rose-950/25',
      iconBg: 'bg-rose-500/15',
      iconColor: 'text-rose-400',
      icon: <AlertCircle size={17} className="text-rose-400" />,
      glow: 'shadow-[0_8px_32px_rgba(244,63,94,0.22)]',
    },
    warning: {
      border: 'border-amber-500/35',
      bg: 'bg-amber-950/20',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      icon: <AlertTriangle size={17} className="text-amber-400" />,
      glow: 'shadow-[0_8px_32px_rgba(245,158,11,0.18)]',
    },
    info: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-950/20',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      icon: <Info size={17} className="text-blue-400" />,
      glow: 'shadow-[0_8px_32px_rgba(59,130,246,0.18)]',
    },
    loading: {
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-950/20',
      iconBg: 'bg-indigo-500/15',
      iconColor: 'text-indigo-400',
      icon: <Loader2 size={17} className="text-indigo-400 animate-spin" />,
      glow: 'shadow-[0_8px_32px_rgba(99,102,241,0.18)]',
    },
  }

  const s = typeStyles[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 28, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 28, scale: 0.95 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto w-full rounded-xl border ${s.border} ${s.bg} ${s.glow} bg-slate-900/90 backdrop-blur-xl p-3.5 flex items-start gap-3 relative overflow-hidden`}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
        {s.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight leading-snug">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss Button */}
      {toast.type !== 'loading' && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  )
}
