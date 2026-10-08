// src/screens/NotificationsScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Skeleton } from '../components/Skeleton';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  NotificationRow,
  NotificationType,
} from '../lib/notifications';
import type { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Notifications'>;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Return a title + body for the notification, based on its type. */
function describe(notif: NotificationRow): { title: string; body: string } {
  const actor = notif.actor?.username ?? 'Someone';
  const gameTitle = notif.game?.title ?? 'a game';

  switch (notif.type) {
    case 'join_request':
      return {
        title: 'New join request',
        body: `${actor} wants to join ${gameTitle}`,
      };
    case 'join_approved':
      return {
        title: 'You are in',
        body: `${actor} approved your request for ${gameTitle}`,
      };
    case 'join_rejected':
      return {
        title: 'Request declined',
        body: `${actor} declined your request for ${gameTitle}`,
      };
    case 'game_cancelled':
      return {
        title: 'Game cancelled',
        body: `${gameTitle} was cancelled by the host`,
      };
    case 'host_transferred_in':
      return {
        title: 'You are the host',
        body: `${actor} transferred ${gameTitle} to you`,
      };
    case 'host_transferred_out':
      return {
        title: 'Host role transferred',
        body: `${actor} is now hosting ${gameTitle}`,
      };
    case 'new_follower':
      return {
        title: 'New follower',
        body: `${actor} started following you`,
      };
    default:
      return { title: 'Notification', body: '' };
  }
}

/** Ionicons name for the notification type */
function iconForType(type: NotificationType): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'join_request': return 'person-add-outline';
    case 'join_approved': return 'checkmark-circle-outline';
    case 'join_rejected': return 'close-circle-outline';
    case 'game_cancelled': return 'warning-outline';
    case 'host_transferred_in': return 'star-outline';
    case 'host_transferred_out': return 'swap-horizontal-outline';
    case 'new_follower': return 'people-outline';
  }
}

/** Group notifications by day bucket. */
function groupByDay(
  items: NotificationRow[]
): { label: string; items: NotificationRow[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  const weekAgo = today - 7 * 24 * 60 * 60 * 1000;

  const groups: Record<string, NotificationRow[]> = {
    Today: [],
    Yesterday: [],
    'This week': [],
    Earlier: [],
  };

  for (const item of items) {
    const t = new Date(item.created_at).getTime();
    if (t >= today) groups['Today'].push(item);
    else if (t >= yesterday) groups['Yesterday'].push(item);
    else if (t >= weekAgo) groups['This week'].push(item);
    else groups['Earlier'].push(item);
  }

  return Object.entries(groups)
    .filter(([, arr]) => arr.length > 0)
    .map(([label, arr]) => ({ label, items: arr }));
}

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------

function NotificationSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <Skeleton height={12} width={80} style={{ marginBottom: 12 }} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <Skeleton width={44} height={44} style={{ borderRadius: 22 }} />
          <View style={styles.skeletonText}>
            <Skeleton height={14} width="60%" style={{ marginBottom: 6 }} />
            <Skeleton height={11} width="85%" style={{ marginBottom: 6 }} />
            <Skeleton height={9} width={60} />
          </View>
        </View>
      ))}
    </View>
  );
}

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function NotificationsScreen() {
  const navigation = useNavigation<NavProp>();

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchAll = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await getMyNotifications();
      setNotifications(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = () => fetchAll(true);

  // ---------------------------------------------------------------------------
  // Mark read
  // ---------------------------------------------------------------------------

  const handleTap = async (notif: NotificationRow) => {
    // Optimistically mark as read locally
    if (!notif.read_at) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      // Fire and forget
      markAsRead(notif.id);
    }

    // Navigate based on type
    if (notif.game_id) {
      navigation.navigate('GameDetail', { gameId: notif.game_id });
    } else if (notif.actor_id) {
      navigation.navigate('PlayerProfile', { userId: notif.actor_id });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);

    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: now }))
    );

    const { error: err } = await markAllAsRead();
    setMarkingAll(false);

    if (err) {
      // Roll back on failure
      fetchAll(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const groups = groupByDay(notifications);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            disabled={markingAll}
            style={styles.headerButton}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={22}
              color={markingAll ? colors.textMuted : colors.ink}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ink}
            colors={[colors.primary]}
          />
        }
      >
        {/* Loading */}
        {loading && !refreshing ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : null}

        {/* Error */}
        {!loading && error ? (
          <View style={styles.stateBlock}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.ink} />
            <Text style={styles.stateText}>{error.toUpperCase()}</Text>
            <TouchableOpacity
              onPress={() => fetchAll()}
              style={styles.stateButton}
            >
              <Text style={styles.stateButtonText}>TRY AGAIN</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Empty */}
        {!loading && !error && notifications.length === 0 ? (
          <View style={styles.stateBlock}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.stateText}>NO NOTIFICATIONS YET</Text>
            <Text style={styles.stateSub}>
              Join games and follow players to see updates here
            </Text>
          </View>
        ) : null}

        {/* Grouped list */}
        {!loading && !error && notifications.length > 0
          ? groups.map((group) => (
              <View key={group.label} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>
                    {group.label.toUpperCase()}
                  </Text>
                  <View style={styles.groupLine} />
                </View>

                {group.items.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notif={notif}
                    onPress={() => handleTap(notif)}
                  />
                ))}
              </View>
            ))
          : null}

        {!loading && !error && notifications.length > 0 ? (
          <View style={styles.mangaFooter}>
            <View style={styles.mangaFooterBorder} />
            <Text style={styles.mangaFooterText}>TO BE CONTINUED...</Text>
            <View style={styles.mangaFooterBorder} />
          </View>
        ) : null}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// NotificationCard
// -----------------------------------------------------------------------------

interface NotificationCardProps {
  notif: NotificationRow;
  onPress: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notif,
  onPress,
}) => {
  const { title, body } = describe(notif);
  const isUnread = !notif.read_at;
  const iconName = iconForType(notif.type);
  const actorName = notif.actor?.username ?? '??';

  return (
    <TouchableOpacity
      style={[styles.card, isUnread && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Unread indicator */}
      {isUnread ? <View style={styles.unreadDot} /> : null}

      {/* Avatar (actor) or icon (system) */}
      {notif.actor ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(actorName)}</Text>
        </View>
      ) : (
        <View style={styles.systemIcon}>
          <Ionicons name={iconName} size={20} color={colors.ink} />
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title.toUpperCase()}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(notif.created_at)}</Text>
        </View>
        <Text style={styles.cardBody} numberOfLines={2}>
          {body}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textMuted}
      />
    </TouchableOpacity>
  );
};

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

  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },

  // Group
  group: {
    marginBottom: spacing.xl,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupTitle: {
    ...typography.sporty,
    fontSize: 10,
    color: colors.ink,
    letterSpacing: 1.5,
  },
  groupLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.ink,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  cardUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  systemIcon: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.sporty,
    fontSize: 11,
    color: colors.ink,
    flex: 1,
  },
  cardTime: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  cardBody: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // States
  stateBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
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
    maxWidth: 260,
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

  // Skeleton
  skeletonWrap: {
    marginBottom: spacing.xl,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  skeletonText: { flex: 1 },

  // Manga footer
  mangaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
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