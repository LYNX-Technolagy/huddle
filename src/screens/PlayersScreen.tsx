// src/screens/PlayersScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../design';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import {
  getSuggestedPlayers,
  followUser,
  unfollowUser,
  getMyFollowingIds,
} from '../lib/players';
import type { SuggestedPlayer } from '../types';

const RANK_FILTERS = ['ALL', 'S', 'A', 'B', 'C'] as const;
type RankFilter = typeof RANK_FILTERS[number];

const RANK_COLORS: Record<string, string> = {
  S: '#F56A00',
  A: '#00B897',
  B: '#4A90D9',
  C: '#8A8A8A',
};

function initials(username: string): string {
  return username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDistance(km: number | null): string {
  if (km === null || km === undefined) return '';
  if (km < 1) return '< 1 km';
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------

function PlayerSkeletonCard() {
  return (
    <Card mangaStyle style={styles.playerCard}>
      <View style={styles.playerRow}>
        <Skeleton width={56} height={56} style={{ borderRadius: 28 }} />
        <View style={styles.playerInfo}>
          <Skeleton height={14} width="70%" style={{ marginBottom: 6 }} />
          <Skeleton height={10} width="50%" style={{ marginBottom: 6 }} />
          <Skeleton height={10} width="80%" />
        </View>
        <Skeleton width={90} height={36} />
      </View>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function PlayersScreen() {
  const [players, setPlayers] = useState<SuggestedPlayer[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRank, setSelectedRank] = useState<RankFilter>('ALL');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const navigation = useNavigation<any>();
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [suggested, followingIds] = await Promise.all([
        getSuggestedPlayers(),
        getMyFollowingIds(),
      ]);

      setPlayers(suggested);
      setFollowing(followingIds);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const handleToggleFollow = async (userId: string) => {
    if (pendingIds.has(userId)) return;

    const isCurrentlyFollowing = following.has(userId);

    setFollowing((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) next.delete(userId);
      else next.add(userId);
      return next;
    });

    setPendingIds((prev) => new Set(prev).add(userId));

    const result = isCurrentlyFollowing
      ? await unfollowUser(userId)
      : await followUser(userId);

    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });

    if (result.error) {
      setFollowing((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) next.add(userId);
        else next.delete(userId);
        return next;
      });
    }
  };

  const filteredPlayers =
    selectedRank === 'ALL'
      ? players
      : players.filter((p) => p.rank_code === selectedRank);

  const renderPlayerCard = (player: SuggestedPlayer) => {
    const isFollowing = following.has(player.user_id);
    const isPending = pendingIds.has(player.user_id);
    const rankColor = RANK_COLORS[player.rank_code] ?? colors.ink;

    const subtitleParts: string[] = [`Rank ${player.rank_code}`];
    if (player.city) subtitleParts.push(player.city);
    if (player.distance_km !== null) {
      subtitleParts.push(formatDistance(player.distance_km));
    }

    return (
      <TouchableOpacity
        key={player.user_id}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('PlayerProfile', { userId: player.user_id })
        }
      >
        <Card mangaStyle style={styles.playerCard}>
          <View style={styles.playerRow}>
            <View style={[styles.avatar, { backgroundColor: rankColor + '20' }]}>
              <Text style={[styles.avatarText, { color: rankColor }]}>
                {initials(player.username)}
              </Text>
            </View>

            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.username.toUpperCase()}
              </Text>
              {player.full_name ? (
                <Text style={styles.playerFullName} numberOfLines={1}>
                  {player.full_name}
                </Text>
              ) : null}
              <Text style={styles.playerMeta} numberOfLines={1}>
                {subtitleParts.join(' • ')}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followButtonActive,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleToggleFollow(player.user_id);
              }}
              disabled={isPending}
              activeOpacity={0.7}
            >
              {isPending ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? colors.ink : colors.textLight}
                />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && styles.followButtonTextActive,
                  ]}
                >
                  {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>PLAYERS</Text>
        <Text style={styles.headerSubtitle}>SUGGESTED FOR YOU</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {RANK_FILTERS.map((rank) => {
            const active = selectedRank === rank;
            return (
              <TouchableOpacity
                key={rank}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedRank(rank)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {rank}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading → skeleton */}
        {loading ? (
          <>
            <PlayerSkeletonCard />
            <PlayerSkeletonCard />
            <PlayerSkeletonCard />
            <PlayerSkeletonCard />
          </>
        ) : null}

        {/* Error */}
        {!loading && error ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateEmoji}>⚠️</Text>
            <Text style={styles.stateText}>{error.toUpperCase()}</Text>
            <TouchableOpacity onPress={fetchAll} style={styles.stateButton}>
              <Text style={styles.stateButtonText}>TRY AGAIN</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Empty */}
        {!loading && !error && filteredPlayers.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>
              {players.length === 0
                ? 'NO SUGGESTIONS YET'
                : `NO ${selectedRank}-RANK PLAYERS`}
            </Text>
            <Text style={styles.emptySub}>
              {players.length === 0
                ? 'Play more games to meet people'
                : 'Try a different rank filter'}
            </Text>
          </View>
        ) : null}

        {/* Results */}
        {!loading && !error && filteredPlayers.length > 0
          ? filteredPlayers.map(renderPlayerCard)
          : null}

        {/* Manga footer */}
        {!loading && !error && filteredPlayers.length > 0 ? (
          <View style={styles.mangaFooter}>
            <View style={styles.mangaFooterBorder} />
            <Text style={styles.mangaFooterText}>TO BE CONTINUED...</Text>
            <View style={styles.mangaFooterBorder} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  headerTitle: {
    ...typography.sporty,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: 2,
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 2,
  },

  filterContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  filterContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minWidth: 48,
    alignItems: 'center',
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  filterChipTextActive: { color: colors.textLight },

  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.md,
  },

  playerCard: {
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
  },
  playerInfo: { flex: 1, gap: 2 },
  playerName: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  playerFullName: {
    ...typography.bodySmall,
    fontSize: 12,
    color: colors.textSecondary,
  },
  playerMeta: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  followButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
    minWidth: 90,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonActive: {
    backgroundColor: colors.background,
  },
  followButtonText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '900',
    color: colors.textLight,
    letterSpacing: 1,
  },
  followButtonTextActive: {
    color: colors.ink,
  },

  emptyBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    ...typography.sporty,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 2,
    textAlign: 'center',
  },
  emptySub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  stateBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  stateEmoji: { fontSize: 48 },
  stateText: {
    ...typography.sporty,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 2,
    textAlign: 'center',
  },
  stateButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  stateButtonText: {
    ...typography.sporty,
    fontSize: 12,
    color: colors.textLight,
    letterSpacing: 1,
  },

  mangaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  mangaFooterBorder: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  mangaFooterText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 2,
  },
});