// src/lib/accountDeletion.ts
import { supabase } from './supabase';

export interface DeletionInventory {
  gamesHosted: number;
  gamesJoined: number;
  followers: number;
  following: number;
  sports: number;
}

export interface DeletionResult {
  success: true;
  games_cancelled: number;
  games_left: number;
  follows_removed: number;
  sports_removed: number;
}

/**
 * Count what will be deleted. Uses the same tables the RPC touches,
 * but as read-only counts so we can show the user a summary.
 */
export async function fetchDeletionInventory(): Promise<DeletionInventory> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [hosted, joined, followers, following, sports] = await Promise.all([
    supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', user.id)
      .in('status', ['open', 'full']),

    supabase
      .from('game_participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),

    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', user.id),

    supabase
      .from('follows')
      .select('following_id', { count: 'exact', head: true })
      .eq('follower_id', user.id),

    supabase
      .from('user_sports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  return {
    gamesHosted: hosted.count ?? 0,
    gamesJoined: joined.count ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    sports: sports.count ?? 0,
  };
}

/**
 * Permanently delete the current user's account.
 * After this succeeds, the client should call signOut() —
 * the session is dead on the server but the client still holds a token.
 */
export async function deleteMyAccount(): Promise<DeletionResult> {
  const { data, error } = await supabase.rpc('delete_my_account');

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Empty response from server');

  return data as unknown as DeletionResult;
}