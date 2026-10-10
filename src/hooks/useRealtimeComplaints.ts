/**
 * useRealtimeComplaints — shared Supabase Realtime hook
 *
 * Subscribes to INSERT/UPDATE events on the `complaints` table.
 * On any change, calls `onRefresh()` so the component can re-fetch
 * authoritative data from the server (never blindly trusts payload,
 * preserving RLS authorization semantics).
 *
 * Usage:
 *   useRealtimeComplaints({ channelName: 'officer-queue', onRefresh: router.refresh })
 *
 * Security: The hook only triggers a refresh call. The actual data load
 * always goes through the server (router.refresh → Server Component re-render)
 * or an authenticated fetch. RLS is enforced server-side.
 */

'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseRealtimeComplaintsOptions {
  /** Unique channel name — avoids duplicate subscriptions across components */
  channelName: string
  /** Called when a relevant complaint INSERT or UPDATE event fires */
  onRefresh: () => void
  /**
   * Optional department_id filter. If provided the subscription filters
   * Postgres Changes to only that department, reducing noise.
   * If undefined/null, listens to all changes (for super_admin or citizen).
   */
  departmentId?: string | null
}

export function useRealtimeComplaints({
  channelName,
  onRefresh,
  departmentId,
}: UseRealtimeComplaintsOptions) {
  // Stable ref so the effect doesn't re-run when onRefresh identity changes
  const onRefreshRef = useRef(onRefresh)
  useEffect(() => {
    onRefreshRef.current = onRefresh
  })

  useEffect(() => {
    const supabase = createClient()

    // Build filter if a specific department is scoped
    const filter = departmentId
      ? `department_id=eq.${departmentId}`
      : undefined

    const channel = supabase
      .channel(channelName, {
        config: { broadcast: { self: false } },
      })
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'complaints',
          ...(filter ? { filter } : {}),
        },
        (_payload) => {
          // Do NOT use payload data directly — always re-fetch via server
          // to ensure RLS is applied and data is authoritative.
          onRefreshRef.current()
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // On channel error, attempt a refresh so the UI isn't permanently stale
          setTimeout(() => onRefreshRef.current(), 2000)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
    // Only departmentId and channelName affect the subscription topology
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, departmentId])
}
