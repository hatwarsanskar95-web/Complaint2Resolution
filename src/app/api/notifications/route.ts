import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserNotifications } from '@/lib/services/notificationService'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 })
    }

    const notifications = await getUserNotifications(user.id)
    const unreadCount = notifications.filter((n) => !n.is_read).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { notification_id, mark_all_read } = body

    if (mark_all_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
    } else if (notification_id) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification_id)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
