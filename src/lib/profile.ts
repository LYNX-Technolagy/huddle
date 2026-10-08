// src/lib/profile.ts
import { supabase } from './supabase';
import type {
  ProfileRow,
  UserSportRow,
  SkillLevel,
  Rank,
} from '../types';

/**
 * Get the current user's full profile.
 */
export async function getMyProfile(): Promise<ProfileRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw new Error(error.message);
  return data as ProfileRow;
}

export interface UpdateProfileParams {
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  rank?: Rank;
  city?: string;
  location?: { lat: number; lng: number };
}

export async function updateProfile(
  params: UpdateProfileParams
): Promise<{ data: ProfileRow | null; error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not authenticated') };

  const update: Record<string, unknown> = {};
  if (params.username !== undefined) update.username = params.username;
  if (params.full_name !== undefined) update.full_name = params.full_name;
  if (params.bio !== undefined) update.bio = params.bio;
  if (params.avatar_url !== undefined) update.avatar_url = params.avatar_url;
  if (params.rank !== undefined) update.rank = params.rank;
  if (params.city !== undefined) update.city = params.city;
  if (params.location) {
    update.location = `POINT(${params.location.lng} ${params.location.lat})`;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(update as any)
    .eq('id', user.id)
    .select()
    .single();

  return {
    data: data ?? null,
    error: error ? new Error(error.message) : null,
  };
}

/**
 * Get the current user's sports + per-sport skill levels.
 */
export async function getMySports(): Promise<UserSportRow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_sports')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  return (data ?? []) as UserSportRow[];
}

/**
 * Mark the current user as having completed onboarding.
 * Sets onboarded_at = now().
 */
export async function completeOnboarding(): Promise<{ error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  const { error } = await supabase
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() } as any)
    .eq('id', user.id);

  return { error: error ? new Error(error.message) : null };
}

export interface UserSportInput {
  sport_id: string;
  skill_level: SkillLevel;
  is_primary: boolean;
}

/**
 * Replace the current user's sports list.
 * Simpler than diffing — delete all + re-insert.
 * Runs as two sequential calls; if the insert fails, the user ends up with no sports.
 * For now this is acceptable; we can wrap in an RPC later if needed.
 */
export async function setMySports(
  sports: UserSportInput[]
): Promise<{ error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  const { error: deleteErr } = await supabase
    .from('user_sports')
    .delete()
    .eq('user_id', user.id);

  if (deleteErr) return { error: new Error(deleteErr.message) };

  if (sports.length === 0) return { error: null };

  const rows = sports.map((s) => ({
    user_id: user.id,
    sport_id: s.sport_id,
    skill_level: s.skill_level,
    is_primary: s.is_primary,
  }));

  const { error: insertErr } = await supabase.from('user_sports').insert(rows);

  return { error: insertErr ? new Error(insertErr.message) : null };
}

// ---- Stats ----

export interface ProfileStats {
  hosted: number;
  joined: number;
  followers: number;
  following: number;
}

export async function getMyStats(): Promise<ProfileStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [hosted, joined, followers, following] = await Promise.all([
    supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', user.id),
    supabase
      .from('game_participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'approved'),
    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', user.id),
    supabase
      .from('follows')
      .select('following_id', { count: 'exact', head: true })
      .eq('follower_id', user.id),
  ]);

  return {
    hosted: hosted.count ?? 0,
    joined: joined.count ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

// ---- Sports with metadata ----

export interface UserSportWithMeta {
  sport_id: string;
  skill_level: SkillLevel;
  is_primary: boolean;
  name: string;
  emoji: string | null;
  icon: string | null;
  color: string | null;
}

export async function getMySportsWithMeta(): Promise<UserSportWithMeta[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_sports')
    .select(`
      sport_id,
      skill_level,
      is_primary,
      sport:sports!user_sports_sport_id_fkey(name, emoji, icon, color)
    `)
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    sport_id: row.sport_id,
    skill_level: row.skill_level as SkillLevel,
    is_primary: row.is_primary,
    name: row.sport?.name ?? row.sport_id,
    emoji: row.sport?.emoji ?? null,
    icon: row.sport?.icon ?? null,
    color: row.sport?.color ?? null,
  }));
}

/**
 * Check if a username is available (not taken by another user).
 * Returns true if available, false if taken or on error.
 */
export async function isUsernameAvailable(
  username: string,
  excludeUserId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', excludeUserId)
    .maybeSingle();

  if (error) return false;
  return data === null;
}