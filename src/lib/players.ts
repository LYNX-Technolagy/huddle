// src/lib/players.ts
import { supabase } from './supabase';
import type {
  SuggestedPlayer,
  ProfileRow,
  FollowRow,
  SkillLevel
} from '../types';


/**
 * Get top 20 suggested players for the current user.
 * Reads throw on error.
 */
export async function getSuggestedPlayers(): Promise<SuggestedPlayer[]> {
  const { data, error } = await supabase.rpc('suggest_players');
  if (error) throw new Error(error.message);
  return (data ?? []) as SuggestedPlayer[];
}

/**
 * Follow a user.
 * Errors are expected (e.g. already following, cannot follow self).
 */
export async function followUser(
  userId: string
): Promise<{ data: FollowRow | null; error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not authenticated') };
  if (user.id === userId) {
    return { data: null, error: new Error('Cannot follow yourself') };
  }

  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: userId })
    .select()
    .single();

  return {
    data: data ?? null,
    error: error ? new Error(error.message) : null,
  };
}

export async function unfollowUser(
  userId: string
): Promise<{ error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', userId);

  return { error: error ? new Error(error.message) : null };
}

/**
 * Check whether the current user follows a given user.
 * Useful for showing FOLLOW / FOLLOWING on player cards.
 */
export async function isFollowing(userId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', userId)
    .maybeSingle();

  if (error) return false;
  return data !== null;
}

/**
 * Get a public profile by id.
 */
export async function getPlayerProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data as ProfileRow;
}

/**
 * Get a Set of users ID's the current user already follows
 * Used by PlayerScreen to determine follow state per player without N queries.
 */

export async function getMyFollowingIds(): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  
  const { data, error } = await supabase
  .from('follows')
  .select('following_id')
  .eq('follower_id', user.id);

  if (error || !data) return new Set();

  return new Set(data.map((row) => row.following_id));
}

// -----------------------------------------------------------------------------
// Player Profile Data (for viewing other users)
// -----------------------------------------------------------------------------

export interface PlayerSport {
  sport_id: string;
  skill_level: SkillLevel;
  is_primary: boolean;
  name: string;
}

export async function getPlayerSports(userId: string): Promise<PlayerSport[]> {
  const { data, error } = await supabase
    .from('user_sports')
    .select(`
      sport_id,
      skill_level,
      is_primary,
      sport:sports!user_sports_sport_id_fkey(name)
    `)
    .eq('user_id', userId)
    .order('is_primary', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    sport_id: row.sport_id,
    skill_level: row.skill_level as SkillLevel,
    is_primary: row.is_primary,
    name: row.sport?.name ?? row.sport_id,
  }));
}

export interface PlayerStats {
  hosted: number;
  joined: number;
  followers: number;
  following: number;
}

export async function getPlayerStats(userId: string): Promise<PlayerStats> {
  const [hosted, joined, followers, following] = await Promise.all([
    supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', userId),
    supabase
      .from('game_participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved'),
    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('following_id', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);

  return {
    hosted: hosted.count ?? 0,
    joined: joined.count ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

/**
 * Get the games a user is hosting, upcoming only.
 * Uses the same shape as getMyGames.
 */
export async function getPlayerHostedGames(userId: string) {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      host:profiles!games_host_id_fkey(id, username, avatar_url, rank)
    `)
    .eq('host_id', userId)
    .in('status', ['open', 'full'])
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(20);

  if (error) throw new Error(error.message);

  // Attach current_players count via second query
  const games = data ?? [];
  if (games.length === 0) return [];

  const gameIds = games.map((g: any) => g.id);
  const { data: participants } = await supabase
    .from('game_participants')
    .select('game_id, status')
    .in('game_id', gameIds)
    .eq('status', 'approved');

  const counts: Record<string, number> = {};
  (participants ?? []).forEach((p: any) => {
    counts[p.game_id] = (counts[p.game_id] ?? 0) + 1;
  });

  return games.map((g: any) => ({
    ...g,
    current_players: counts[g.id] ?? 0,
  }));
}
