// src/screens/ProfileScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Card } from '../components/Card';
import { SportIcon } from '../components/SportIcon';
import { Skeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfile,
  getMySportsWithMeta,
  getMyStats,
  ProfileStats,
  UserSportWithMeta,
} from '../lib/profile';
import { getMyGames, GameWithHost } from '../lib/games';
import type { ProfileRow } from '../types';

// -----------------------------------------------------------------------------
// Cross-platform alert helpers
// -----------------------------------------------------------------------------

function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(`${title}${message ? `\n\n${message}` : ''}`);
  } else {
    Alert.alert(title, message);
  }
}

function showConfirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

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

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <Text style={styles.headerSubtitle}>YOUR STATS</Text>
      </View>

      {/* Profile card skeleton */}
      <Card mangaStyle style={styles.profileCard}>
        <View style={styles.profileContent}>
          <Skeleton width={80} height={80} style={{ borderRadius: 40 }} />
          <Skeleton height={20} width={140} style={{ marginTop: 8 }} />
          <Skeleton height={12} width={100} />
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
          <Skeleton height={44} width="100%" style={{ marginTop: 12 }} />
        </View>
      </Card>

      {/* Sports section skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR SPORTS</Text>
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

      {/* Games section skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR UPCOMING GAMES</Text>
          <View style={styles.sectionLine} />
        </View>
        <Card mangaStyle style={styles.gameCard}>
          <View style={styles.gameCardContent}>
            <Skeleton width={26} height={26} />
            <View style={styles.gameCardRight}>
              <Skeleton height={14} width="70%" style={{ marginBottom: 6 }} />
              <Skeleton height={10} width="90%" />
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

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { signOut } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [sports, setSports] = useState<UserSportWithMeta[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [games, setGames] = useState<GameWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [p, s, st, g] = await Promise.all([
        getMyProfile(),
        getMySportsWithMeta(),
        getMyStats(),
        getMyGames(),
      ]);

      const now = Date.now();
      const upcoming = g.filter((game) => new Date(game.starts_at).getTime() > now);

      setProfile(p);
      setSports(s);
      setStats(st);
      setGames(upcoming);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleNotifications = () => {
    showAlert('Coming soon', 'Notification settings will be available soon.');
  };

  const handleLocation = () => {
    navigation.navigate('Location')
  };

  const handlePrivacy = () => {
   navigation.navigate('Privacy')
  };

  const handleSignOut = () => {
    showConfirm('Log out?', 'You can log back in anytime.', () => {
      signOut();
      
    });
  };

  const handleGameTap = (gameId: string) => {
    navigation?.navigate('GameDetail', { gameId });
  };

  // ---------------------------------------------------------------------------
  // Loading — skeleton
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFILE</Text>
          <Text style={styles.headerSubtitle}>YOUR STATS</Text>
        </View>
        <View style={styles.stateBlock}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateText}>
            {error?.toUpperCase() ?? 'PROFILE NOT FOUND'}
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

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFILE</Text>
          <Text style={styles.headerSubtitle}>YOUR STATS</Text>
        </View>

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

            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
              activeOpacity={0.85}
            >
              <Text style={styles.editButtonText}>EDIT PROFILE</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR SPORTS</Text>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR UPCOMING GAMES</Text>
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

        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SETTINGS</Text>
            <View style={styles.sectionLine} />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleNotifications}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.ink} />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={20} color={colors.ink} />
            <Text style={styles.settingText}>Location</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handlePrivacy}
            activeOpacity={0.7}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.ink} />
            <Text style={styles.settingText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, styles.settingItemLogout]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.settingText, styles.settingTextLogout]}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mangaFooter}>
          <View style={styles.mangaFooterBorder} />
          <Text style={styles.mangaFooterText}>HUDDLE v1.0</Text>
          <View style={styles.mangaFooterBorder} />
        </View>
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

  editButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  editButtonText: {
    ...typography.button,
    fontSize: 12,
    color: colors.textLight,
    letterSpacing: 1,
  },

  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  lastSection: { paddingBottom: 100 },
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

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  settingText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  settingItemLogout: {
    borderBottomWidth: 0,
    marginTop: spacing.sm,
  },
  settingTextLogout: { color: colors.error },

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
});