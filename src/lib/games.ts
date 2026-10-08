// src/lib/games.ts
import { supabase } from './supabase';
import type {
  GameRow,
  GameStatus,
  GameVisibility,
  GameSkillLevel,
  JoinGameResult,
  LeaveGameResult,
  ApproveParticipantResult,
  RejectParticipantResult,
  TransferHostResult,
  ProfileRow,
  GameParticipantRow,
} from '../types';

// ---- Read (throws on error) ----

export interface GameWithHost extends GameRow {
  host: Pick<ProfileRow, 'id' | 'username' | 'avatar_url' | 'rank'> | null;
  current_players: number;
}

export interface ListGamesParams {
  sportId?: string;
  skillLevel?: GameSkillLevel;
  status?: GameStatus;
  visibility?: GameVisibility;
  searchQuery?: string;
  limit?: number;
}

/**
 * List games from the feed.
 * Excludes games hosted by users in a block relationship with the caller.
 */
export async function listGames(params: ListGamesParams = {}): Promise<GameWithHost[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Get all users in a block relationship with the current user (either direction)
  const { data: blockRows } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

  const blockedIds = new Set<string>();
  (blockRows ?? []).forEach((row: { blocker_id: string; blocked_id: string }) => {
    if (row.blocker_id === user.id) blockedIds.add(row.blocked_id);
    else blockedIds.add(row.blocker_id);
  });

  // 2. Base query
  let query = supabase
    .from('games')
    .select(`
      *,
      host:profiles!games_host_id_fkey(id, username, avatar_url, rank)
    `)
    .order('starts_at', { ascending: true })
    .limit(params.limit ?? 50);

  if (params.sportId) query = query.eq('sport_id', params.sportId);
  if (params.skillLevel) query = query.eq('skill_level', params.skillLevel);
  if (params.visibility) query = query.eq('visibility', params.visibility);

  if (params.searchQuery && params.searchQuery.trim()) {
    const q = params.searchQuery.trim().replace(/[%_]/g, '');
    query = query.or(`title.ilike.%${q}%,location_name.ilike.%${q}%`);
  }

  // 3. Exclude blocked hosts
  if (blockedIds.size > 0) {
    const blockedArray = Array.from(blockedIds);
    // PostgREST `not.in` needs quoted UUIDs
    const quoted = blockedArray.map((id) => `"${id}"`).join(',');
    query = query.not('host_id', 'in', `(${quoted})`);
  }

  query = query.in('status', params.status ? [params.status] : ['open', 'full']);

  const { data: games, error: gamesErr } = await query;
  if (gamesErr) throw new Error(gamesErr.message);
  if (!games || games.length === 0) return [];

  // 4. Attach current_players count
  const gameIds = games.map((g: any) => g.id);
  const { data: participants, error: partErr } = await supabase
    .from('game_participants')
    .select('game_id, status')
    .in('game_id', gameIds)
    .eq('status', 'approved');

  if (partErr) throw new Error(partErr.message);

  const counts: Record<string, number> = {};
  (participants ?? []).forEach((p: any) => {
    counts[p.game_id] = (counts[p.game_id] ?? 0) + 1;
  });

  return games.map((g: any) => ({
    ...g,
    current_players: counts[g.id] ?? 0,
  })) as GameWithHost[];
}

// ---- Game Detail ----

export interface GameDetail {
  game: GameWithHost;
  participants: (GameParticipantRow & {
    profile: Pick<ProfileRow, 'id' | 'username' | 'avatar_url' | 'rank'> | null;
  })[];
}

export async function getGame(gameId: string): Promise<GameDetail> {
  const { data: game, error: gameErr } = await supabase
    .from('games')
    .select(`
      *,
      host:profiles!games_host_id_fkey(id, username, avatar_url, rank)
    `)
    .eq('id', gameId)
    .single();

  if (gameErr) throw new Error(gameErr.message);

  const { data: participants, error: partErr } = await supabase
    .from('game_participants')
    .select(`
      *,
      profile:profiles!game_participants_user_id_fkey(id, username, avatar_url, rank)
    `)
    .eq('game_id', gameId)
    .in('status', ['approved', 'pending']);

  if (partErr) throw new Error(partErr.message);

  const participantList = (participants ?? []) as GameDetail['participants'];
  const current_players = participantList.filter(
    (p: GameParticipantRow) => p.status === 'approved'
  ).length;

  return {
    game: { ...(game as any), current_players } as GameWithHost,
    participants: participantList,
  };
}

/**
 * Games the current user is hosting or participating in.
 */
export async function getMyGames(): Promise<GameWithHost[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      host:profiles!games_host_id_fkey(id, username, avatar_url, rank),
      participants:game_participants!inner(user_id, status)
    `)
    .eq('participants.user_id', user.id)
    .in('participants.status', ['approved', 'pending'])
    .order('starts_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const participants = row.participants ?? [];
    const current_players = participants.filter(
      (p: { status: string }) => p.status === 'approved'
    ).length;

    const { participants: _drop, ...game } = row;

    return { ...game, current_players } as GameWithHost;
  });
}

// ---- Write (returns { data, error }) ----

export interface CreateGameParams {
  sportId: string;
  title: string;
  description?: string;
  locationName: string;
  location?: { lat: number; lng: number };
  startsAt: string;
  durationMinutes?: number;
  maxPlayers: number;
  skillLevel?: GameSkillLevel;
  visibility?: GameVisibility;
}

export async function createGame(
  params: CreateGameParams
): Promise<{ data: GameRow | null; error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const locationWkt = params.location
    ? `POINT(${params.location.lng} ${params.location.lat})`
    : null;

  const { data, error } = await supabase
    .from('games')
    .insert({
      host_id: user.id,
      sport_id: params.sportId,
      title: params.title,
      description: params.description ?? null,
      location_name: params.locationName,
      location: locationWkt as any,
      starts_at: params.startsAt,
      duration_minutes: params.durationMinutes ?? 90,
      max_players: params.maxPlayers,
      skill_level: params.skillLevel ?? 'any',
      visibility: params.visibility ?? 'public',
      status: 'open',
    })
    .select()
    .single();

  return {
    data: data ?? null,
    error: error ? new Error(error.message) : null,
  };
}

// ---- RPC wrappers ----

export async function joinGame(gameId: string): Promise<JoinGameResult> {
  const { data, error } = await supabase.rpc('join_game', { p_game_id: gameId });
  if (error) {
    return { status: 'error', game_status: null, message: error.message };
  }
  return data as unknown as JoinGameResult;
}

export async function leaveGame(gameId: string): Promise<LeaveGameResult> {
  const { data, error } = await supabase.rpc('leave_game', { p_game_id: gameId });
  if (error) {
    return { status: 'error', game_status: null, message: error.message };
  }
  return data as unknown as LeaveGameResult;
}

export async function approveParticipant(
  gameId: string,
  userId: string
): Promise<ApproveParticipantResult> {
  const { data, error } = await supabase.rpc('approve_participant', {
    p_game_id: gameId,
    p_user_id: userId,
  });
  if (error) {
    return { status: 'error', game_status: null, message: error.message };
  }
  return data as unknown as ApproveParticipantResult;
}

export async function rejectParticipant(
  gameId: string,
  userId: string
): Promise<RejectParticipantResult> {
  const { data, error } = await supabase.rpc('reject_participant', {
    p_game_id: gameId,
    p_user_id: userId,
  });
  if (error) {
    return { status: 'error', message: error.message };
  }
  return data as unknown as RejectParticipantResult;
}

export async function transferHost(
  gameId: string,
  newHostId: string
): Promise<TransferHostResult> {
  const { data, error } = await supabase.rpc('transfer_host', {
    p_game_id: gameId,
    p_new_host_id: newHostId,
  });
  if (error) {
    return { status: 'error', message: error.message };
  }
  return data as unknown as TransferHostResult;
}

export async function cancelGame(
  gameId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('games')
    .update({ status: 'cancelled' })
    .eq('id', gameId);

  return { error: error ? new Error(error.message) : null };
}