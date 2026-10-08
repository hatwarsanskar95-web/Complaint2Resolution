import { createClient } from '@/lib/supabase/server'

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  link_url?: string | null
  is_read: boolean
  created_at: string
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = 'INFO',
  linkUrl?: string
): Promise<void> {
  const supabase = await createClient()

  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      link_url: linkUrl || null,
      is_read: false,
    })
  } catch (err) {
    console.error('Failed to create notification:', err)
  }
}

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (data || []) as NotificationItem[]
}
