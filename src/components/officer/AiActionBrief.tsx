'use client'

import React from 'react'
import {
  Sparkles, Clock, ShieldAlert, CheckSquare, Square,
  Building2, AlertTriangle, Zap,
} from 'lucide-react'
import { ComplaintAiAnalysis, Complaint, getSlaStatus, PRIORITY_LABELS, PriorityLevel } from '@/lib/types'

interface AiActionBriefProps {
  complaint: Complaint
  ai: ComplaintAiAnalysis | null
}

const PRIORITY_STYLE = {
  CRITICAL: {
    border: 'border-rose-500/50',
    bg: 'bg-rose-950/20',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-500',
  },
  HIGH: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/15',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  MEDIUM: {
    border: 'border-blue-500/40',
    bg: 'bg-blue-950/15',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  LOW: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/10',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
}

export default function AiActionBrief({ complaint, ai }: AiActionBriefProps) {
  const sla = getSlaStatus(complaint.sla_deadline, complaint.sla_start_time)
  const priority = complaint.priority as PriorityLevel
  const style = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.MEDIUM
  const priorityLabel = PRIORITY_LABELS[priority] ?? priority

  const actions: string[] = Array.isArray(ai?.recommended_actions)
    ? ai.recommended_actions
    : []

  const slaBarColor =
    sla.label === 'breached' ? 'bg-rose-500'
    : sla.label === 'critical' ? 'bg-rose-400'
    : sla.label === 'warning' ? 'bg-amber-400'
    : sla.label === 'reminder' ? 'bg-yellow-400'
    : 'bg-emerald-400'

  const slaTextColor =
    sla.label === 'breached' ? 'text-rose-400'
    : sla.label === 'critical' ? 'text-rose-300'
    : sla.label === 'warning' ? 'text-amber-300'
    : sla.label === 'reminder' ? 'text-yellow-300'
    : 'text-emerald-400'

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} overflow-hidden flex flex-col`}>
      {/* Brief Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Sparkles size={14} className="text-purple-400" />
          </div>
          <span className="text-sm font-bold text-white">AI Action Brief</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${style.badge}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
          {priorityLabel}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {/* Department + Category */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Building2 size={13} className="text-blue-400" />
            <span className="font-semibold text-slate-200">
              {complaint.departments?.name ?? 'Department Unassigned'}
            </span>
            <span className="text-slate-600">·</span>
            <span>{complaint.category}</span>
          </div>
        </div>

        {/* AI Summary */}
        {ai?.summary && (
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 mb-1.5">
              AI Situation Summary
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">{ai.summary}</p>
          </div>
        )}

        {/* SLA Countdown */}
        <div className="p-3.5 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Clock size={13} className="text-slate-400" /> SLA Deadline
            </span>
            <span className={`text-xs font-mono font-bold ${slaTextColor}`}>
              {sla.label === 'breached' ? '⚠ BREACHED' : sla.formattedTimeLeft}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${slaBarColor} ${sla.label === 'breached' ? 'animate-pulse' : ''}`}
              style={{ width: `${sla.percent}%` }}
            />
          </div>
          {complaint.sla_deadline && (
            <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
              Deadline: {new Date(complaint.sla_deadline).toLocaleString('en-IN')}
            </p>
          )}
        </div>

        {/* Required Actions Checklist */}
        {actions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap size={11} className={style.text} /> Required Action Steps
            </p>
            <div className="flex flex-col gap-1.5">
              {actions.map((action, i) => (
                <ActionItem key={i} text={action} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* AI Confidence */}
        {ai?.confidence != null && (
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-500">AI Classification Confidence</span>
            <span className={`font-mono font-bold ${
              ai.confidence >= 0.8 ? 'text-emerald-400' :
              ai.confidence >= 0.6 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {Math.round(ai.confidence * 100)}%
            </span>
          </div>
        )}

        {/* Human Review Warning */}
        {(ai?.needs_human_review || complaint.needs_human_review) && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              This complaint was flagged for <strong>human supervisory review</strong> due to low AI confidence. Apply extra scrutiny.
            </p>
          </div>
        )}

        {/* Critical alert */}
        {complaint.priority === 'CRITICAL' && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
            <ShieldAlert size={14} className="text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300 leading-relaxed">
              <strong>CRITICAL PRIORITY</strong> — Requires immediate field response within 6 hours. Failure to respond may trigger automatic Level-3 escalation.
            </p>
          </div>
        )}

        {!ai && (
          <div className="flex items-center justify-center p-6 text-center">
            <div>
              <Sparkles size={24} className="mx-auto text-slate-600 mb-2" />
              <p className="text-xs text-slate-500">AI analysis pending for this complaint</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Stateful checklist item with local toggle
function ActionItem({ text, index }: { text: string; index: number }) {
  const [done, setDone] = React.useState(false)
  return (
    <button
      onClick={() => setDone((d) => !d)}
      className={`flex items-start gap-2.5 p-2.5 rounded-lg text-left w-full transition-all cursor-pointer ${
        done
          ? 'bg-emerald-900/20 border border-emerald-500/20'
          : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {done
          ? <CheckSquare size={14} className="text-emerald-400" />
          : <Square size={14} className="text-slate-500" />
        }
      </div>
      <span className={`text-xs leading-relaxed ${done ? 'line-through text-slate-500' : 'text-slate-300'}`}>
        <span className="font-semibold text-slate-500 mr-1">{index + 1}.</span>
        {text}
      </span>
    </button>
  )
}
