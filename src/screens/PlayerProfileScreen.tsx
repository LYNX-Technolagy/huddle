// src/screens/PlayerProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Card } from '../components/Card';
import { SportIcon } from '../components/SportIcon';
import { Skeleton } from '../components/Skeleton';
import { ReportUserModal } from '../components/ReportUserModal';
import { useAuth } from '../context/AuthContext';
import {
  getPlayerProfile,
  getPlayerSports,
  getPlayerStats,
  getPlayerHostedGames,
  isFollowing,
  followUser,
  unfollowUser,
  PlayerSport,
  PlayerStats,
} from '../lib/players';
import {
  blockUser,
  unblockUser,
  isBlockedWith,
} from '../lib/moderation';
import type { RootStackParamList } from '../navigation/types';
import type { ProfileRow } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'PlayerProfile'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'PlayerProfile'>;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const RANK_LABEL: Record<string, string> = {
  S: 'S — Top player',
  A: 'A — Experienced',
  B: 'B — Solid',
  C: 'C — Casual',
};

const LEVEL_LABEL: Record<string, string> = {
  casual: 'CASUAL',
  regular: 'REGULAR',
  competitive: 'COMPETITIVE',
};

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function formatGameTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;
  return `${date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })}, ${time}`;
}

function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(`${title}${message ? `\n\n${message}` : ''}`);
  } else {
    Alert.alert(title, message);
  }
}

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card mangaStyle style={styles.profileCard}>
        <View style={styles.profileContent}>
          <Skeleton width={80} height={80} style={{ borderRadius: 40 }} />
          <Skeleton height={20} width={140} style={{ marginTop: 8 }} />
          <Skeleton height={12} width={120} />
          <Skeleton height={12} width={180} />
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Skeleton height={20} width={30} />
              <Skeleton height={10} width={50} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Skeleton height={20} width={30} />
              <Skeleton height={10} width={50} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Skeleton height={20} width={30} />
              <Skeleton height={10} width={50} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Skeleton height={20} width={30} />
              <Skeleton height={10} width={50} style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <Skeleton height={44} width="100%" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SPORTS</Text>
          <View style={styles.sectionLine} />
        </View>
        <Card mangaStyle style={styles.sportCard}>
          <View style={styles.sportRow}>
            <Skeleton width={28} height={28} />
            <View style={styles.sportInfo}>
              <Skeleton height={14} width={120} style={{ marginBottom: 6 }} />
              <Skeleton height={10} width={80} />
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function PlayerProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { userId } = route.params;
  const { user } = useAuth();

  const isMe = user?.id === userId;

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [sports, setSports] = useState<PlayerSport[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [games, setGames] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockPending, setBlockPending] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [p, s, st, g, fol, blk] = await Promise.all([
        getPlayerProfile(userId),
        getPlayerSports(userId),
        getPlayerStats(userId),
        getPlayerHostedGames(userId),
        isMe ? Promise.resolve(false) : isFollowing(userId),
        isMe ? Promise.resolve(false) : isBlockedWith(userId),
      ]);

      setProfile(p);
      setSports(s);
      setStats(st);
      setGames(g);
      setFollowing(fol);
      setBlocked(blk);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId, isMe]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---------------------------------------------------------------------------
  // Follow / Unfollow — optimistic
  // ---------------------------------------------------------------------------

  const handleToggleFollow = async () => {
    if (followPending || isMe || blocked) return;

    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowPending(true);

    const result = wasFollowing
      ? await unfollowUser(userId)
      : await followUser(userId);

    setFollowPending(false);

    if (result.error) {
      setFollowing(wasFollowing);
    }
  };

  // ---------------------------------------------------------------------------
  // Block / Unblock
  // ---------------------------------------------------------------------------

  const handleOpenMenu = () => setMenuVisible(true);
  const handleCloseMenu = () => setMenuVisible(false);

  const handleReport = () => {
    setMenuVisible(false);
    setReportVisible(true);
  };

  const handleToggleBlock = async () => {
    if (blockPending || isMe) return;

    setMenuVisible(false);
    setBlockPending(true);

    const wasBlocked = blocked;
    const result = wasBlocked
      ? await unblockUser(userId)
      : await blockUser(userId);

    setBlockPending(false);

    if (result.error) {
      showAlert('Something went wrong', result.error.message);
      return;
    }

    setBlocked(!wasBlocked);

    // If we just blocked, navigate back — this profile is now hidden
    if (!wasBlocked) {
      showAlert(
        'User blocked',
        'You will no longer see each other in Huddle.'
      );
      navigation.goBack();
    }
  };

  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------

  const handleEditProfile = () => {
    navigation.goBack();
  };

  const handleGameTap = (gameId: string) => {
    navigation.navigate('GameDetail', { gameId });
  };

  // ---------------------------------------------------------------------------
  // Loading / error
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PLAYER</Text>
          <View style={styles.headerButton} />
        </View>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PLAYER</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.stateBlock}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateText}>
            {error?.toUpperCase() ?? 'PLAYER NOT FOUND'}
          </Text>
          <TouchableOpacity onPress={fetchAll} style={styles.stateButton}>
            <Text style={styles.stateButtonText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PLAYER</Text>
        {!isMe ? (
          <TouchableOpacity onPress={handleOpenMenu} style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.ink} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Blocked banner */}
        {blocked ? (
          <View style={styles.blockedBanner}>
            <Ionicons name="ban-outline" size={16} color={colors.error} />
            <Text style={styles.blockedBannerText}>
              YOU HAVE BLOCKED THIS USER
            </Text>
          </View>
        ) : null}

        {/* Profile Card */}
        <Card mangaStyle style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {initials(profile.username)}
              </Text>
            </View>

            <Text style={styles.profileName}>
              {profile.username.toUpperCase()}
            </Text>

            {profile.full_name ? (
              <Text style={styles.profileFullName}>{profile.full_name}</Text>
            ) : null}

            <Text style={styles.profileRank}>
              {RANK_LABEL[profile.rank] ?? `Rank ${profile.rank}`}
            </Text>

            {profile.city ? (
              <View style={styles.profileCity}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.profileCityText}>{profile.city}</Text>
              </View>
            ) : null}

            {stats ? (
              <View style={styles.statsGrid}>
                <View style={styles.statCell}>
                  <Text style={styles.statNumber}>{stats.hosted}</Text>
                  <Text style={styles.statLabel}>HOSTED</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statNumber}>{stats.joined}</Text>
                  <Text style={styles.statLabel}>JOINED</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statNumber}>{stats.followers}</Text>
                  <Text style={styles.statLabel}>FOLLOWERS</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statNumber}>{stats.following}</Text>
                  <Text style={styles.statLabel}>FOLLOWING</Text>
                </View>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Follow / Edit button */}
        <View style={styles.section}>
          {isMe ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonInk]}
              onPress={handleEditProfile}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonTextLight}>EDIT PROFILE</Text>
            </TouchableOpacity>
          ) : blocked ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonOutline]}
              onPress={handleToggleBlock}
              disabled={blockPending}
              activeOpacity={0.85}
            >
              {blockPending ? (
                <ActivityIndicator size="small" color={colors.ink} />
              ) : (
                <Text style={styles.actionButtonTextDark}>UNBLOCK USER</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                following && styles.actionButtonOutline,
              ]}
              onPress={handleToggleFollow}
              disabled={followPending}
              activeOpacity={0.85}
            >
              {followPending ? (
                <ActivityIndicator
                  size="small"
                  color={following ? colors.ink : colors.textLight}
                />
              ) : (
                <Text
                  style={
                    following
                      ? styles.actionButtonTextDark
                      : styles.actionButtonTextLight
                  }
                >
                  {following ? 'FOLLOWING' : 'FOLLOW'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Sports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isMe ? 'YOUR SPORTS' : 'SPORTS'}
            </Text>
            <View style={styles.sectionLine} />
          </View>

          {sports.length === 0 ? (
            <Text style={styles.emptyText}>No sports set yet.</Text>
          ) : (
            sports.map((sport) => (
              <Card key={sport.sport_id} mangaStyle style={styles.sportCard}>
                <View style={styles.sportRow}>
                  <SportIcon sport={sport.sport_id} size={28} color={colors.ink} />
                  <View style={styles.sportInfo}>
                    <Text style={styles.sportName}>
                      {sport.name.toUpperCase()}
                    </Text>
                    <Text style={styles.sportLevel}>
                      {LEVEL_LABEL[sport.skill_level] ??
                        sport.skill_level.toUpperCase()}
                    </Text>
                  </View>
                  {sport.is_primary ? (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Hosted games */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>HOSTED GAMES</Text>
            <View style={styles.sectionLine} />
          </View>

          {games.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming games.</Text>
          ) : (
            games.map((game) => (
              <TouchableOpacity
                key={game.id}
                onPress={() => handleGameTap(game.id)}
                activeOpacity={0.85}
              >
                <Card mangaStyle style={styles.gameCard}>
                  <View style={styles.gameCardContent}>
                    <SportIcon sport={game.sport_id} size={26} color={colors.ink} />
                    <View style={styles.gameCardRight}>
                      <Text style={styles.gameCardTitle} numberOfLines={1}>
                        {game.title}
                      </Text>
                      <Text style={styles.gameCardDetails}>
                        {formatGameTime(game.starts_at)} •{' '}
                        {game.current_players}/{game.max_players} players
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Manga footer */}
        <View style={styles.mangaFooter}>
          <View style={styles.mangaFooterBorder} />
          <Text style={styles.mangaFooterText}>TO BE CONTINUED...</Text>
          <View style={styles.mangaFooterBorder} />
        </View>
      </ScrollView>

      {/* Action sheet */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={handleCloseMenu}
        >
          <TouchableOpacity
            style={styles.sheetContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />

            <TouchableOpacity
              style={styles.sheetRow}
              onPress={handleReport}
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={20} color={colors.ink} />
              <Text style={styles.sheetLabel}>Report User</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetRow, styles.sheetRowLast]}
              onPress={handleToggleBlock}
              disabled={blockPending}
              activeOpacity={0.7}
            >
              <Ionicons
                name={blocked ? 'lock-open-outline' : 'ban-outline'}
                size={20}
                color={colors.error}
              />
              <Text style={[styles.sheetLabel, styles.sheetLabelDestructive]}>
                {blocked ? 'Unblock User' : 'Block User'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Report modal */}
      <ReportUserModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        reportedUserId={userId}
        reportedUsername={profile.username}
      />
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.sporty,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },

  // Blocked banner
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.error + '15',
    borderBottomWidth: 2,
    borderBottomColor: colors.error,
  },
  blockedBannerText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.error,
    fontWeight: '800',
    letterSpacing: 1,
  },

  profileCard: {
    margin: spacing.xl,
    padding: spacing.xl,
    borderWidth: 3,
    borderColor: colors.ink,
  },
  profileContent: { alignItems: 'center', gap: spacing.sm },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
  },
  profileName: {
    ...typography.heading,
    fontSize: 20,
    color: colors.ink,
  },
  profileFullName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  profileRank: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  profileCity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  profileCityText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },

  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    borderWidth: 2,
    borderColor: colors.ink,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statNumber: {
    ...typography.heading,
    fontSize: 20,
    color: colors.ink,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 2,
    height: 30,
    backgroundColor: colors.ink,
  },

  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  lastSection: { paddingBottom: 80 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sporty,
    fontSize: 12,
    color: colors.ink,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.ink,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },

  actionButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  actionButtonInk: {
    backgroundColor: colors.ink,
  },
  actionButtonOutline: {
    backgroundColor: colors.background,
  },
  actionButtonTextLight: {
    ...typography.button,
    fontSize: 12,
    color: colors.textLight,
    letterSpacing: 1,
  },
  actionButtonTextDark: {
    ...typography.button,
    fontSize: 12,
    color: colors.ink,
    letterSpacing: 1,
  },

  sportCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sportInfo: { flex: 1 },
  sportName: {
    ...typography.subtitle,
    fontSize: 13,
    color: colors.ink,
  },
  sportLevel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  primaryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  primaryBadgeText: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },

  gameCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  gameCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gameCardRight: { flex: 1, gap: 2 },
  gameCardTitle: {
    ...typography.subtitle,
    fontSize: 13,
    color: colors.ink,
  },
  gameCardDetails: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.textSecondary,
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

  // Action sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.background,
    borderTopWidth: 3,
    borderTopColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetRowLast: {
    borderBottomWidth: 0,
  },
  sheetLabel: {
    ...typography.body,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  sheetLabelDestructive: {
    color: colors.error,
  },
});