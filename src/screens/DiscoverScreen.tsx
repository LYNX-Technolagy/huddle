// src/screens/DiscoverScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Card } from '../components/Card';
import { SportIcon } from '../components/SportIcon';
import { listGames, GameWithHost } from '../lib/games';
import type { GameSkillLevel } from '../types';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SPORT_FILTERS = [
  { id: 'ALL', label: 'All', emoji: '' },
  { id: 'volleyball', label: 'Volleyball', emoji: '🏐' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'soccer', label: 'Soccer', emoji: '⚽' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾' },
  { id: 'running', label: 'Running', emoji: '🏃' },
];

const LEVEL_FILTERS: { id: GameSkillLevel | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Levels' },
  { id: 'casual', label: 'Casual' },
  { id: 'regular', label: 'Regular' },
  { id: 'competitive', label: 'Competitive' },
  { id: 'any', label: 'Any' },
];

const LEVEL_LABEL: Record<string, string> = {
  casual: 'CASUAL',
  regular: 'REGULAR',
  competitive: 'COMPETITIVE',
  any: 'ANY LEVEL',
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

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

function SkeletonCard() {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Card mangaStyle style={styles.gameCard}>
      <View style={styles.gameCardContent}>
        <Animated.View style={[styles.skeleton, styles.skeletonIcon, { opacity: pulse }]} />
        <View style={styles.gameCardRight}>
          <Animated.View style={[styles.skeleton, styles.skeletonTitle, { opacity: pulse }]} />
          <Animated.View style={[styles.skeleton, styles.skeletonLine, { opacity: pulse }]} />
          <Animated.View
            style={[styles.skeleton, styles.skeletonLineShort, { opacity: pulse }]}
          />
        </View>
      </View>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();

  // Input state (instant — for text field responsiveness)
  const [searchInput, setSearchInput] = useState('');
  // Debounced query (used for the actual fetch)
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState<GameSkillLevel | 'ALL'>('ALL');

  const [games, setGames] = useState<GameWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Debounce search input → searchQuery
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await listGames({
        sportId: selectedSport === 'ALL' ? undefined : selectedSport,
        skillLevel: selectedLevel === 'ALL' ? undefined : selectedLevel,
        searchQuery: searchQuery.trim() || undefined,
        limit: 50,
      });

      setGames(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [selectedSport, selectedLevel, searchQuery]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // ---------------------------------------------------------------------------
  // Card render
  // ---------------------------------------------------------------------------

  const renderGameCard = (item: GameWithHost) => {
    const isFull = item.current_players >= item.max_players;
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.85}
        onPress={() =>
          navigation.getParent()?.navigate('GameDetail', { gameId: item.id })
        }
      >
        <Card mangaStyle variant="light" style={styles.gameCard}>
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
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.detailText}>{formatGameTime(item.starts_at)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    {item.current_players}/{item.max_players}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
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
                {isFull ? (
                  <View style={styles.fullTag}>
                    <Text style={styles.fullTagText}>FULL</Text>
                  </View>
                ) : (
                  <View style={styles.openTag}>
                    <Text style={styles.openTagText}>OPEN</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const showResults = !loading && !error && games.length > 0;
  const showEmpty = !loading && !error && games.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>DISCOVER</Text>
        <Text style={styles.headerSubtitle}>FIND YOUR GAME</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search games, locations..."
            placeholderTextColor={colors.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchInput('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <Text style={styles.filterLabel}>SPORT</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {SPORT_FILTERS.map((sport) => {
            const active = selectedSport === sport.id;
            return (
              <TouchableOpacity
                key={sport.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedSport(sport.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {sport.emoji ? `${sport.emoji} ${sport.label}` : sport.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.filterLabel}>LEVEL</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {LEVEL_FILTERS.map((level) => {
            const active = selectedLevel === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedLevel(level.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView
        style={styles.results}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading → skeleton */}
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : null}

        {/* Error */}
        {!loading && error ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateEmoji}>⚠️</Text>
            <Text style={styles.stateText}>{error.toUpperCase()}</Text>
            <TouchableOpacity onPress={fetchGames} style={styles.stateButton}>
              <Text style={styles.stateButtonText}>TRY AGAIN</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Results header + list */}
        {showResults ? (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                FOUND {games.length} {games.length === 1 ? 'GAME' : 'GAMES'}
              </Text>
            </View>
            {games.map(renderGameCard)}
            <View style={styles.mangaFooter}>
              <View style={styles.mangaFooterBorder} />
              <Text style={styles.mangaFooterText}>TO BE CONTINUED...</Text>
              <View style={styles.mangaFooterBorder} />
            </View>
          </>
        ) : null}

        {/* Empty */}
        {showEmpty ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateEmoji}>🔍</Text>
            <Text style={styles.stateText}>NO GAMES MATCH</Text>
            <Text style={styles.stateSub}>Try adjusting your filters</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
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

  // Search
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
    height: 48,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },

  // Filters
  filtersSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  filterScroll: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    height: 34,
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  filterChipTextActive: { color: colors.textLight },

  // Results
  results: { flex: 1 },
  resultsContent: {
    padding: spacing.xl,
    paddingBottom: 100,
    gap: spacing.md,
  },
  resultsHeader: {
    marginBottom: spacing.xs,
  },
  resultsTitle: {
    ...typography.sporty,
    fontSize: 12,
    color: colors.ink,
    letterSpacing: 1.5,
  },

  // Game card
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
  openTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: colors.background,
  },
  openTagText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },
  fullTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.textMuted,
    backgroundColor: colors.background,
  },
  fullTagText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  // Skeleton
  skeleton: {
    backgroundColor: colors.textMuted ?? '#F0F0F0',
    borderRadius: 2,
  },
  skeletonIcon: {
    width: 32,
    height: 32,
  },
  skeletonTitle: {
    height: 14,
    width: '70%',
    marginBottom: 4,
  },
  skeletonLine: {
    height: 10,
    width: '90%',
    marginBottom: 4,
  },
  skeletonLineShort: {
    height: 10,
    width: '50%',
  },

  // States
  stateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
    gap: spacing.sm,
  },
  stateEmoji: { fontSize: 48 },
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

  // Manga footer
  mangaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
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