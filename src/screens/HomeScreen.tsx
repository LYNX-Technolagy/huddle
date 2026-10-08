// src/screens/HomeScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Card } from '../components/Card';
import { SportIcon } from '../components/SportIcon';
import { Skeleton } from '../components/Skeleton';
import { listGames, joinGame, GameWithHost } from '../lib/games';
import { useUnreadCount } from '../hooks/useUnreadCount';

const SPORTS_FILTER = ['ALL', 'VOLLEYBALL', 'BASKETBALL', 'SOCCER', 'TENNIS', 'RUNNING'];

const LEVEL_LABEL: Record<string, string> = {
  casual: 'CASUAL',
  regular: 'REGULAR',
  competitive: 'COMPETITIVE',
  any: 'ANY LEVEL',
};

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
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------

function HomeSkeletonCard() {
  return (
    <Card mangaStyle variant="light" style={styles.gameCard}>
      <View style={styles.gameCardContent}>
        <Skeleton width={32} height={32} />
        <View style={styles.gameCardRight}>
          <Skeleton height={14} width="70%" style={{ marginBottom: 6 }} />
          <Skeleton height={10} width="90%" style={{ marginBottom: 6 }} />
          <Skeleton height={10} width="60%" style={{ marginBottom: 10 }} />
          <View style={styles.gameCardFooter}>
            <Skeleton width={70} height={16} />
            <Skeleton width={80} height={28} />
          </View>
        </View>
      </View>
    </Card>
  );
}

function HomeSkeletonHero() {
  return (
    <View style={styles.mangaHero}>
      <View style={styles.mangaTitleContainer}>
        <View style={styles.mangaTitleLine} />
        <Text style={styles.mangaTitle}>FIND YOUR GAME</Text>
        <View style={styles.mangaTitleLine} />
      </View>

      <View style={styles.mangaStats}>
        <View style={styles.mangaStat}>
          <Skeleton height={20} width={40} />
          <Skeleton height={10} width={50} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.mangaStatDivider} />
        <View style={styles.mangaStat}>
          <Skeleton height={20} width={40} />
          <Skeleton height={10} width={50} style={{ marginTop: 4 }} />
        </View>
      </View>

      <Text style={styles.mangaTagline}>"DON'T JUST WATCH. PLAY."</Text>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const unreadCount = useUnreadCount();

  const [games, setGames] = useState<GameWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('ALL');

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinFeedback, setJoinFeedback] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchGames = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const sportId =
          selectedSport === 'ALL' ? undefined : selectedSport.toLowerCase();

        const data = await listGames({ sportId });
        setGames(data);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load games');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedSport]
  );

  // Refetch every time the screen comes into focus
  // (tab switch, modal dismiss, navigation back)
  useFocusEffect(
    useCallback(() => {
      fetchGames();
    }, [fetchGames])
  );

  const onRefresh = useCallback(() => {
    fetchGames(true);
  }, [fetchGames]);

  // Web keyboard shortcut: R to refresh
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRefresh();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onRefresh]);

  // ---------------------------------------------------------------------------
  // Join
  // ---------------------------------------------------------------------------

  const handleJoin = async (gameId: string) => {
    setJoiningId(gameId);
    setJoinFeedback((prev) => ({ ...prev, [gameId]: '' }));

    const result = await joinGame(gameId);
    setJoiningId(null);

    if (result.status === 'approved') {
      setJoinFeedback((prev) => ({ ...prev, [gameId]: 'JOINED ✓' }));
      fetchGames(true);
    } else if (result.status === 'pending') {
      setJoinFeedback((prev) => ({ ...prev, [gameId]: 'REQUEST SENT' }));
    } else {
      setJoinFeedback((prev) => ({
        ...prev,
        [gameId]: (result.message || 'ERROR').toUpperCase(),
      }));
    }

    setTimeout(() => {
      setJoinFeedback((prev) => {
        const next = { ...prev };
        delete next[gameId];
        return next;
      });
    }, 3000);
  };

  // ---------------------------------------------------------------------------
  // Card render
  // ---------------------------------------------------------------------------

  const renderGameCard = ({ item }: { item: GameWithHost }) => {
    const isFull = item.current_players >= item.max_players;
    const isJoining = joiningId === item.id;
    const feedback = joinFeedback[item.id];

    let joinLabel = 'JOIN →';
    if (feedback) joinLabel = feedback;
    else if (isFull) joinLabel = 'FULL';

    return (
      <Card mangaStyle variant="light" style={styles.gameCard}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
        >
          <View style={styles.gameCardContent}>
            <View style={styles.gameCardLeft}>
              <SportIcon sport={item.sport_id} size={32} color={colors.ink} />
            </View>

            <View style={styles.gameCardRight}>
              <Text style={styles.gameTitle} numberOfLines={1}>
                {item.title}
              </Text>

              <View style={styles.gameDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{formatGameTime(item.starts_at)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText}>
                    {item.current_players}/{item.max_players}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.location_name}
                  </Text>
                </View>
              </View>

              <View style={styles.gameCardFooter}>
                <View style={styles.levelTag}>
                  <Text style={styles.levelTagText}>
                    {LEVEL_LABEL[item.skill_level] ?? item.skill_level.toUpperCase()}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.joinButton,
                    (isFull || !!feedback) && styles.joinButtonDisabled,
                  ]}
                  disabled={isFull || isJoining || !!feedback}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleJoin(item.id);
                  }}
                  activeOpacity={0.8}
                >
                  {isJoining ? (
                    <ActivityIndicator size="small" color={colors.textLight} />
                  ) : (
                    <Text
                      style={[
                        styles.joinButtonText,
                        (isFull || !!feedback) && styles.joinButtonTextDisabled,
                      ]}
                    >
                      {joinLabel}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  // ---------------------------------------------------------------------------
  // States
  // ---------------------------------------------------------------------------

  const renderErrorState = () => (
    <View style={styles.stateBlock}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.ink} />
      <Text style={styles.stateText}>{error?.toUpperCase() ?? 'ERROR'}</Text>
      <TouchableOpacity onPress={() => fetchGames()} style={styles.stateButton}>
        <Text style={styles.stateButtonText}>TRY AGAIN</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.stateBlock}>
      <Ionicons name="basketball-outline" size={48} color={colors.ink} />
      <Text style={styles.stateText}>NO GAMES YET</Text>
      <Text style={styles.stateSub}>Be the first to start one</Text>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HUDDLE</Text>
        <View style={styles.headerActions}>
          {Platform.OS === 'web' ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onRefresh}
              disabled={refreshing}
              accessibilityLabel="Refresh feed"
            >
              <Ionicons
                name="refresh-outline"
                size={22}
                color={refreshing ? colors.textMuted : colors.ink}
              />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={24} color={colors.ink} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        // Skeleton state
        <>
          <HomeSkeletonHero />
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {SPORTS_FILTER.map((sport) => (
                <View key={sport} style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{sport}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          <View style={styles.gamesList}>
            <HomeSkeletonCard />
            <HomeSkeletonCard />
            <HomeSkeletonCard />
          </View>
        </>
      ) : (
        <>
          {/* Manga hero */}
          <View style={styles.mangaHero}>
            <View style={styles.mangaTitleContainer}>
              <View style={styles.mangaTitleLine} />
              <Text style={styles.mangaTitle}>FIND YOUR GAME</Text>
              <View style={styles.mangaTitleLine} />
            </View>

            <View style={styles.mangaStats}>
              <View style={styles.mangaStat}>
                <Text style={styles.mangaStatNumber}>{games.length}</Text>
                <Text style={styles.mangaStatLabel}>GAMES</Text>
              </View>
              <View style={styles.mangaStatDivider} />
              <View style={styles.mangaStat}>
                <Text style={styles.mangaStatNumber}>
                  {games.reduce((sum, g) => sum + g.current_players, 0)}
                </Text>
                <Text style={styles.mangaStatLabel}>PLAYERS</Text>
              </View>
            </View>

            <Text style={styles.mangaTagline}>"DON'T JUST WATCH. PLAY."</Text>
          </View>

          {/* Sport filter */}
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {SPORTS_FILTER.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.filterChip,
                    selectedSport === sport && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedSport(sport)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedSport === sport && styles.filterChipTextActive,
                    ]}
                  >
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Body */}
          {error ? (
            renderErrorState()
          ) : games.length === 0 ? (
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.ink}
                  colors={[colors.primary]}
                />
              }
              contentContainerStyle={styles.emptyScroll}
            >
              {renderEmptyState()}
            </ScrollView>
          ) : (
            <FlatList
              data={games}
              renderItem={renderGameCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.gamesList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.ink}
                  colors={[colors.primary]}
                />
              }
              ListFooterComponent={
                <View style={styles.mangaFooter}>
                  <View style={styles.mangaFooterBorder} />
                  <Text style={styles.mangaFooterText}>TO BE CONTINUED...</Text>
                  <View style={styles.mangaFooterBorder} />
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  headerTitle: {
    ...typography.sporty,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: { padding: spacing.xs },

  // Notification badge
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  mangaHero: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.ink,
  },
  mangaTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mangaTitleLine: { flex: 1, height: 2, backgroundColor: colors.ink },
  mangaTitle: {
    ...typography.sporty,
    fontSize: 12,
    color: colors.ink,
    letterSpacing: 2,
  },
  mangaStats: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  mangaStat: { flex: 1, alignItems: 'center' },
  mangaStatNumber: {
    ...typography.heading,
    fontSize: 20,
    color: colors.ink,
  },
  mangaStatLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  mangaStatDivider: { width: 2, height: 30, backgroundColor: colors.ink },
  mangaTagline: {
    ...typography.sporty,
    fontSize: 10,
    color: colors.ink,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  filterContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  filterContent: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  filterChipTextActive: { color: colors.textLight },

  gamesList: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 120,
    gap: spacing.md,
  },
  gameCard: { padding: spacing.lg },
  gameCardContent: { flexDirection: 'row', gap: spacing.md },
  gameCardLeft: { alignItems: 'center', justifyContent: 'center' },
  gameCardRight: { flex: 1, gap: spacing.xs },
  gameTitle: {
    ...typography.title,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  gameDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.textSecondary,
  },
  gameCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  levelTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
  },
  levelTagText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  joinButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  joinButtonDisabled: {
    backgroundColor: colors.inkLighter,
    borderColor: colors.inkLighter,
  },
  joinButtonText: {
    ...typography.buttonSmall,
    fontSize: 10,
    color: colors.textLight,
    letterSpacing: 1,
  },
  joinButtonTextDisabled: { color: colors.inkLight },

  stateBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  stateText: {
    ...typography.sporty,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 2,
    textAlign: 'center',
  },
  stateSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
  emptyScroll: { flexGrow: 1, justifyContent: 'center' },

  mangaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  mangaFooterBorder: { flex: 1, height: 2, backgroundColor: colors.ink },
  mangaFooterText: {
    ...typography.sporty,
    fontSize: 12,
    color: colors.ink,
    letterSpacing: 2,
  },
});