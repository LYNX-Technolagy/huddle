// src/lib/moderation.ts
import { supabase } from './supabase';

// -----------------------------------------------------------------------------
// Blocks
// -----------------------------------------------------------------------------

export async function blockUser(userId: string): Promise<{ error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };
  if (user.id === userId) return { error: new Error('Cannot block yourself') };

  const { error } = await supabase
    .from('blocks')
    .insert({ blocker_id: user.id, blocked_id: userId });

  // Duplicate block (unique violation) is fine — treat as success
  if (error && error.code !== '23505') {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function unblockUser(userId: string): Promise<{ error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', userId);

  return { error: error ? new Error(error.message) : null };
}

/**
 * Returns TRUE if the current user has blocked OR is blocked by `userId`.
 */
export async function isBlockedWith(userId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('blocks')
    .select('blocker_id')
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${userId}),` +
      `and(blocker_id.eq.${userId},blocked_id.eq.${user.id})`
    )
    .limit(1);

  if (error) return false;
  return (data ?? []).length > 0;
}

/**
 * Get all user IDs blocked by the current user (outbound only).
 */
export async function getMyBlockedUserIds(): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id);

  if (error || !data) return new Set();
  return new Set(data.map((r: { blocked_id: string }) => r.blocked_id));
}

// -----------------------------------------------------------------------------
// Reports
// -----------------------------------------------------------------------------

export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'fake_profile'
  | 'inappropriate_content'
  | 'no_show'
  | 'other';

export interface ReportInput {
  reportedUserId?: string;
  reportedGameId?: string;
  reason: ReportReason;
  details?: string;
}

export async function submitReport(
  input: ReportInput
): Promise<{ error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  if (!input.reportedUserId && !input.reportedGameId) {
    return { error: new Error('Must specify a user or game to report') };
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: input.reportedUserId ?? null,
    reported_game_id: input.reportedGameId ?? null,
    reason: input.reason,
    details: input.details?.trim() || null,
  });

  return { error: error ? new Error(error.message) : null };
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  harassment: 'Harassment or bullying',
  spam: 'Spam or advertising',
  fake_profile: 'Fake profile',
  inappropriate_content: 'Inappropriate content',
  no_show: 'No-show at a game',
  other: 'Other',
};