// src/lib/notifications.ts
import { supabase } from './supabase';

export type NotificationType =
  | 'join_request'
  | 'join_approved'
  | 'join_rejected'
  | 'game_cancelled'
  | 'host_transferred_in'
  | 'host_transferred_out'
  | 'new_follower';

export interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  game_id: string | null;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
  // joined
  actor: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  game: {
    id: string;
    title: string;
    sport_id: string;
  } | null;
}

/**
 * Fetch notifications for the current user.
 * Reads throw on error, per convention.
 */
export async function getMyNotifications(
  limit: number = 50
): Promise<NotificationRow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      user_id,
      actor_id,
      game_id,
      type,
      read_at,
      created_at,
      actor:profiles!notifications_actor_id_fkey(id, username, avatar_url),
      game:games!notifications_game_id_fkey(id, title, sport_id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as NotificationRow[];
}

/**
 * Count unread notifications for the current user.
 * Used for the bell badge.
 */
export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(
  notificationId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('read_at', null); // only update if not already read

  return { error: error ? new Error(error.message) : null };
}

/**
 * Mark all of the current user's notifications as read.
 */
export async function markAllAsRead(): Promise<{ error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);

  return { error: error ? new Error(error.message) : null };
}

/**
 * Delete a notification (swipe-to-delete or explicit).
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  return { error: error ? new Error(error.message) : null };
}