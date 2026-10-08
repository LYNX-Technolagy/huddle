// src/types/index.ts
// App-level types derived from the generated Database type.
// Keeps the generated file untouched (so it can be regenerated anytime)
// while giving us nicer named types + string unions for app code.

import type { Database } from '../lib/database.types';

// ============================================================
// RAW ROW TYPES (from generated schema)
// ============================================================

export type SportRow         = Database['public']['Tables']['sports']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'] & {
  onboarded_at: string | null;
};
export type UserSportRow     = Database['public']['Tables']['user_sports']['Row'];
export type GameRow          = Database['public']['Tables']['games']['Row'];
export type GameParticipantRow = Database['public']['Tables']['game_participants']['Row'];
export type FollowRow        = Database['public']['Tables']['follows']['Row'];

// Insert types (for create operations)
export type SportInsert         = Database['public']['Tables']['sports']['Insert'];
export type ProfileInsert       = Database['public']['Tables']['profiles']['Insert'];
export type UserSportInsert     = Database['public']['Tables']['user_sports']['Insert'];
export type GameInsert          = Database['public']['Tables']['games']['Insert'];
export type GameParticipantInsert = Database['public']['Tables']['game_participants']['Insert'];
export type FollowInsert        = Database['public']['Tables']['follows']['Insert'];

// Update types (for patch operations)
export type ProfileUpdate       = Database['public']['Tables']['profiles']['Update'];
export type UserSportUpdate     = Database['public']['Tables']['user_sports']['Update'];
export type GameUpdate          = Database['public']['Tables']['games']['Update'];
export type GameParticipantUpdate = Database['public']['Tables']['game_participants']['Update'];

// ============================================================
// STRING UNIONS (redefined — CHECK constraints aren't visible to the generator)
// ============================================================

export type SkillLevel     = 'casual' | 'regular' | 'competitive';
export type GameSkillLevel = SkillLevel | 'any';
export type Rank           = 'S' | 'A' | 'B' | 'C';
export type GameStatus     = 'open' | 'full' | 'cancelled' | 'completed';
export type GameVisibility = 'public' | 'private';
export type ParticipantStatus = 'pending' | 'approved' | 'rejected' | 'left';

// ============================================================
// RPC RESULT TYPES
// (our SQL functions return jsonb; the generator sees them as Json,
//  so we declare the actual shapes here for use in app code)
// ============================================================

export interface JoinGameResult {
  status: 'approved' | 'pending' | 'error';
  game_status: GameStatus | null;
  message: string;
}

export interface LeaveGameResult {
  status: 'left' | 'error';
  game_status: GameStatus | null;
  message: string;
}

export interface ApproveParticipantResult {
  status: 'approved' | 'error';
  game_status: GameStatus | null;
  message: string;
}

export interface RejectParticipantResult {
  status: 'rejected' | 'error';
  message: string;
}

export interface TransferHostResult {
  status: 'transferred' | 'error';
  message: string;
}

// suggest_players returns a real TABLE, so the generator already knows its shape.
// We just alias it for convenience.
export type SuggestedPlayer =
  Database['public']['Functions']['suggest_players']['Returns'][number];

// ============================================================
// COMPOSITE APP-LEVEL TYPES
// (shapes used by screens — combining rows + joined data)
// ============================================================

/** A profile without sensitive fields, used in public-facing joins. */
export type PublicProfile = Pick<
  ProfileRow,
  'id' | 'username' | 'avatar_url' | 'rank'
>;

/** A game with its host profile joined in. */
export interface GameWithHost extends Omit<GameRow, 'skill_level' | 'status' | 'visibility'> {
  skill_level: GameSkillLevel;
  status: GameStatus;
  visibility: GameVisibility;
  host: PublicProfile | null;
}

/** A game participant with their profile joined in. */
export interface GameParticipantWithProfile extends Omit<GameParticipantRow, 'status'> {
  status: ParticipantStatus;
  profile: PublicProfile | null;
}

/** A user sport with its sport metadata joined in. */
export interface UserSportWithSport extends Omit<UserSportRow, 'skill_level'> {
  skill_level: SkillLevel;
  sport: SportRow | null;
}
