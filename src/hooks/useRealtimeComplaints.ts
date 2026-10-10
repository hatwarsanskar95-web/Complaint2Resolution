/**
 * useRealtimeComplaints — shared Supabase Realtime hook
 *
 * Subscribes to INSERT/UPDATE/DELETE events on `complaints`, `citizen_verifications`,
 * and `resolution_submissions` tables in Supabase Realtime.
 * On any relevant change, invokes `onRefresh()` so the component can update state
 * or re-fetch authoritative data from the server.
 */

'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseRealtimeComplaintsOptions {
  /** Unique channel name — avoids duplicate subscriptions across components */
  channelName: string
  /** Called when a relevant complaint INSERT, UPDATE, or DELETE event fires */
  onRefresh: (payload?: any) => void
  /**
   * Optional department_id filter.
   * If provided, listens to changes and verifies if the event pertains to this department
   * (or is an unassigned/new complaint), preventing missed events.
   * If undefined/null, listens to all changes (for admin or citizen).
   */
  departmentId?: string | null
}

export function useRealtimeComplaints({
  channelName,
  onRefresh,
  departmentId,
}: UseRealtimeComplaintsOptions) {
  const onRefreshRef = useRef(onRefresh)
  useEffect(() => {
    onRefreshRef.current = onRefresh
  })

  useEffect(() => {
    const supabase = createClient()

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
        },
        (payload) => {
          const newDept = payload.new ? (payload.new as any).department_id : null
          const oldDept = payload.old ? (payload.old as any).department_id : null

          if (!departmentId) {
            // Admin / Super Admin scope -> trigger refresh for any complaint change
            onRefreshRef.current(payload)
          } else {
            // Officer scope -> trigger refresh if new or old matches departmentId or is unassigned
            if (
              newDept === departmentId ||
              oldDept === departmentId ||
              newDept === null ||
              newDept === undefined ||
              !newDept
            ) {
              onRefreshRef.current(payload)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'citizen_verifications',
        },
        (payload) => {
          onRefreshRef.current(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resolution_submissions',
        },
        (payload) => {
          onRefreshRef.current(payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected successfully
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // On disconnect/error, schedule a safe refetch fallback
          setTimeout(() => onRefreshRef.current(), 1500)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, departmentId])
}
