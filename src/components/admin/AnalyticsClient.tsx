'use client'

import React, { useState } from 'react'
import {
  Trophy,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Users,
  Building,
  RefreshCw,
  Search,
  Award,
  Layers,
  Sparkles
} from 'lucide-react'
import { DepartmentScore } from '@/lib/services/analyticsService'
import { IssueCluster } from '@/lib/services/recurringIssueService'

interface AnalyticsClientProps {
  initialScores: DepartmentScore[]
  initialClusters: IssueCluster[]
}

export default function AnalyticsClient({ initialScores, initialClusters }: AnalyticsClientProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'recurring'>('leaderboard')
  const [scores] = useState<DepartmentScore[]>(initialScores)
  const [clusters] = useState<IssueCluster[]>(initialClusters)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-400">
            <BarChart2 className="w-7 h-7 text-indigo-400" />
            Department Performance Analytics & Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Algorithmic scoring (0-100), SLA trends, officer compliance, and AI recurring issue clustering.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Department Leaderboard
          </button>

          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'recurring'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Recurring Clusters ({clusters.length})
          </button>
        </div>
      </div>

      {activeTab === 'leaderboard' ? (
        <div className="space-y-6">
          {/* Top 3 Department Podiums */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scores.slice(0, 3).map((dept, idx) => (
              <div
                key={dept.department_id}
                className={`p-5 rounded-xl border relative overflow-hidden flex flex-col justify-between ${
                  idx === 0
                    ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/60'
                    : idx === 1
                    ? 'bg-gradient-to-br from-slate-800/40 via-slate-900 to-slate-950 border-slate-400/60'
                    : 'bg-gradient-to-br from-orange-950/30 via-slate-900 to-slate-950 border-orange-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Rank #{idx + 1}
                  </span>
                  <Award
                    className={`w-6 h-6 ${
                      idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-orange-400'
                    }`}
                  />
                </div>

                <div className="my-3">
                  <h3 className="text-lg font-bold text-slate-100">{dept.department_name}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold font-mono text-indigo-400">
                      {dept.score}
                    </span>
                    <span className="text-xs text-slate-400">/ 100 Performance Score</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-800/60 pt-3 text-slate-400">
                  <div>
                    <span>Resolution Rate:</span>{' '}
                    <span className="text-emerald-400 font-bold font-mono">
                      {Math.round(dept.resolution_rate * 100)}%
                    </span>
                  </div>
                  <div>
                    <span>Breach Rate:</span>{' '}
                    <span className="text-red-400 font-bold font-mono">
                      {Math.round(dept.breach_rate * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Leaderboard Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-200">
              Department Performance Index
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Rank & Department</th>
                    <th className="p-3 text-center">Score (0-100)</th>
                    <th className="p-3 text-center">Total Tickets</th>
                    <th className="p-3 text-center">Resolved</th>
                    <th className="p-3 text-center">SLA Breaches</th>
                    <th className="p-3 text-center">Reopened</th>
                    <th className="p-3 text-center">Escalated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scores.map((d, idx) => (
                    <tr key={d.department_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-medium text-slate-200 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{d.department_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({d.department_code})</span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-indigo-400 text-sm">
                        {d.score}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-300">{d.total_complaints}</td>
                      <td className="p-3 text-center font-mono text-emerald-400">{d.resolved_count}</td>
                      <td className="p-3 text-center font-mono text-red-400">{d.breach_count}</td>
                      <td className="p-3 text-center font-mono text-purple-400">{d.reopened_count}</td>
                      <td className="p-3 text-center font-mono text-amber-400">{d.escalated_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Recurring Issues Tab */
        <div className="space-y-4">
          <div className="bg-indigo-950/30 border border-indigo-800/60 p-4 rounded-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-200">
              AI Recurring Issue Detection clusters complaints geographically ($\ge 3$ tickets within 500m) to identify underlying infrastructure failures.
            </p>
          </div>

          {clusters.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-sm">
              No recurring complaint clusters detected in the past 30 days.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clusters.map((c) => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-semibold text-sm text-indigo-300">{c.category} Cluster</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 text-xs font-mono font-bold">
                      {c.complaint_count} Linked Tickets
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{c.location_summary}</p>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs space-y-2">
                    <div>
                      <span className="text-indigo-400 font-bold block mb-0.5">Root Cause Hypothesis:</span>
                      <p className="text-slate-300">{c.root_cause_hypothesis}</p>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-bold block mb-0.5">Preventive Advice:</span>
                      <p className="text-slate-300">{c.preventive_advice}</p>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Linked IDs: {c.permanent_ids.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
