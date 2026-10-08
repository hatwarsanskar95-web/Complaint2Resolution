'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Clock, ShieldAlert } from 'lucide-react'
import { computeSlaStatus, SlaThreshold } from '@/lib/services/slaService'

interface SlaCountdownProps {
  slaDeadline: string | null
  slaStartTime: string | null
  /** If true, shows compact version (bar + time only) */
  compact?: boolean
  className?: string
}

const THRESHOLD_CONFIG: Record<SlaThreshold, {
  bar: string
  text: string
  bg: string
  border: string
  label: string
  pulse: boolean
}> = {
  normal:   { bar: 'bg-emerald-500',    text: 'text-emerald-400', bg: 'bg-emerald-950/10', border: 'border-emerald-800/30', label: 'On Track',        pulse: false },
  reminder: { bar: 'bg-yellow-400',     text: 'text-yellow-400',  bg: 'bg-yellow-950/10',  border: 'border-yellow-800/30',  label: 'Reminder',         pulse: false },
  warning:  { bar: 'bg-orange-400',     text: 'text-orange-400',  bg: 'bg-orange-950/15',  border: 'border-orange-700/40',  label: 'Warning',          pulse: false },
  critical: { bar: 'bg-rose-400',       text: 'text-rose-400',    bg: 'bg-rose-950/20',    border: 'border-rose-600/40',    label: 'Critical',         pulse: true  },
  breached: { bar: 'bg-rose-600',       text: 'text-rose-400',    bg: 'bg-rose-950/25',    border: 'border-rose-500/60',    label: 'SLA Breached',     pulse: true  },
}

export default function SlaCountdown({ slaDeadline, slaStartTime, compact = false, className = '' }: SlaCountdownProps) {
  // Live tick every 30 seconds
  const [tick, setTick] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  if (!slaDeadline || !slaStartTime) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-slate-500 ${className}`}>
        <Clock size={13} /> No SLA assigned
      </div>
    )
  }

  const { percent, label, formattedTimeLeft } = computeSlaStatus(slaDeadline, slaStartTime)
  const cfg = THRESHOLD_CONFIG[label]

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${cfg.bar} ${cfg.pulse ? 'animate-pulse' : ''}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`text-[10px] font-mono font-bold shrink-0 ${cfg.text}`}>{formattedTimeLeft}</span>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border ${cfg.bg} ${cfg.border} p-4 flex flex-col gap-3 ${className}`}>
      {/* Header row */}
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          {label === 'breached' || label === 'critical'
            ? <ShieldAlert size={14} className={cfg.text} />
            : <Clock size={14} className="text-slate-400" />
          }
          SLA Deadline
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${cfg.text} border ${cfg.border}`}>
            {cfg.label}
          </span>
        </span>
        <span className={`font-mono font-bold text-sm ${cfg.text} ${cfg.pulse ? 'animate-pulse' : ''}`}>
          {formattedTimeLeft}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cfg.bar} ${cfg.pulse ? 'animate-pulse' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Metadata row */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>
          Deadline: {new Date(slaDeadline).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </span>
        <span className={cfg.text}>{percent}% elapsed</span>
      </div>
    </div>
  )
}
