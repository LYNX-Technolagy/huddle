// src/screens/GameDetailScreen.tsx
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
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SportIcon } from '../components/SportIcon';
import {
  getGame,
  joinGame,
  leaveGame,
  approveParticipant,
  rejectParticipant,
  cancelGame,
  transferHost,
  GameDetail,
} from '../lib/games';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import type { GameStatus } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'GameDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'GameDetail'>;

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

function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel: string = 'Confirm'
) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const LEVEL_LABEL: Record<string, string> = {
  casual: 'CASUAL',
  regular: 'REGULAR',
  competitive: 'COMPETITIVE',
  any: 'ANY LEVEL',
};

const STATUS_LABEL: Record<GameStatus, string> = {
  open: 'OPEN',
  full: 'FULL',
  cancelled: 'CANCELLED',
  completed: 'COMPLETED',
};

function formatGameDateTime(iso: string): string {
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

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function GameDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { gameId } = route.params;
  const { user } = useAuth();

  const [detail, setDetail] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);

  // ----- Fetch game -----
  const fetchGame = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGame(gameId);
      setDetail(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  // ----- Derived state -----
  const game = detail?.game;
  const participants = detail?.participants ?? [];

  const approved = participants.filter((p) => p.status === 'approved');
  const pending = participants.filter((p) => p.status === 'pending');

  const isHost = game?.host_id === user?.id;
  const myParticipation = participants.find((p) => p.user_id === user?.id);
  const isApproved = myParticipation?.status === 'approved';
  const isPending = myParticipation?.status === 'pending';
  const isFull = (game?.current_players ?? 0) >= (game?.max_players ?? 0);
  const isOpen = game?.status === 'open';
  const isTerminal = game?.status === 'cancelled' || game?.status === 'completed';

  // Other approved participants (for transfer host)
  const otherApproved = approved.filter((p) => p.user_id !== user?.id);
  const canTransfer = isHost && isOpen && otherApproved.length > 0;

  // ----- Actions -----

  const handleJoin = async () => {
    if (!game) return;
    setActionLoading(true);
    const result = await joinGame(game.id);
    setActionLoading(false);

    if (result.status === 'error') {
      showAlert('Could not join', result.message);
      return;
    }
    if (result.status === 'pending') {
      showAlert('Request sent', 'Waiting for the host to approve you.');
    }
    await fetchGame();
  };

  const handleLeave = async () => {
    if (!game) return;
    showConfirm(
      'Leave game?',
      'You can join again later if there is space.',
      async () => {
        setActionLoading(true);
        const result = await leaveGame(game.id);
        setActionLoading(false);
        if (result.status === 'error') {
          showAlert('Could not leave', result.message);
          return;
        }
        await fetchGame();
      },
      'Leave'
    );
  };

  const handleApprove = async (userId: string) => {
    if (!game) return;
    setActionLoading(true);
    const result = await approveParticipant(game.id, userId);
    setActionLoading(false);
    if (result.status === 'error') {
      showAlert('Could not approve', result.message);
      return;
    }
    await fetchGame();
  };

  const handleReject = async (userId: string) => {
    if (!game) return;
    setActionLoading(true);
    const result = await rejectParticipant(game.id, userId);
    setActionLoading(false);
    if (result.status === 'error') {
      showAlert('Could not reject', result.message);
      return;
    }
    await fetchGame();
  };

  const handleCancel = () => {
    if (!game) return;
    showConfirm(
      'Cancel this game?',
      'All approved players will be notified. This cannot be undone.',
      async () => {
        setActionLoading(true);
        const result = await cancelGame(game.id);
        setActionLoading(false);
        if (result.error) {
          showAlert('Could not cancel', result.error.message);
          return;
        }
        await fetchGame();
      },
      'Cancel Game'
    );
  };

  const handleOpenTransfer = () => {
    setTransferModalVisible(true);
  };

  const handleTransferTo = (newHostId: string, newHostName: string) => {
    setTransferModalVisible(false);
    showConfirm(
      `Transfer host to ${newHostName}?`,
      'You will remain an approved player but lose host controls.',
      async () => {
        if (!game) return;
        setActionLoading(true);
        const result = await transferHost(game.id, newHostId);
        setActionLoading(false);
        if (result.status === 'error') {
          showAlert('Could not transfer', result.message);
          return;
        }
        await fetchGame();
      },
      'Transfer'
    );
  };

  // ----- Loading / error states -----

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.stateBlock}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>LOADING GAME...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !game) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GAME DETAIL</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.stateBlock}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateText}>{error?.toUpperCase() ?? 'GAME NOT FOUND'}</Text>
          <TouchableOpacity onPress={fetchGame} style={styles.stateButton}>
            <Text style={styles.stateButtonText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ----- Render -----

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {game.sport_id.toUpperCase()}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Card mangaStyle style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <SportIcon sport={game.sport_id} size={48} color={colors.ink} />
            </View>
            <View style={[styles.statusBadge, isTerminal && styles.statusBadgeTerminal]}>
              <Text style={styles.statusBadgeText}>{STATUS_LABEL[game.status as GameStatus]}</Text>
            </View>
          </View>

          <Text style={styles.title}>{game.title}</Text>
          {game.description ? (
            <Text style={styles.description}>{game.description}</Text>
          ) : null}
        </Card>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Ionicons name="calendar-outline" size={20} color={colors.ink} />
            <Text style={styles.infoLabel}>WHEN</Text>
            <Text style={styles.infoValue}>{formatGameDateTime(game.starts_at)}</Text>
          </View>

          <View style={styles.infoBlock}>
            <Ionicons name="location-outline" size={20} color={colors.ink} />
            <Text style={styles.infoLabel}>WHERE</Text>
            <Text style={styles.infoValue}>{game.location_name}</Text>
          </View>

          <View style={styles.infoBlock}>
            <Ionicons name="people-outline" size={20} color={colors.ink} />
            <Text style={styles.infoLabel}>PLAYERS</Text>
            <Text style={styles.infoValue}>
              {game.current_players}/{game.max_players}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Ionicons name="trophy-outline" size={20} color={colors.ink} />
            <Text style={styles.infoLabel}>LEVEL</Text>
            <Text style={styles.infoValue}>
              {LEVEL_LABEL[game.skill_level] ?? game.skill_level.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Host */}
        {game.host ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOST</Text>
            <Card mangaStyle style={styles.hostCard}>
              <View style={styles.hostRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(game.host.username)}</Text>
                </View>
                <View style={styles.hostInfo}>
                  <Text style={styles.hostName}>{game.host.username.toUpperCase()}</Text>
                  <Text style={styles.hostRank}>RANK {game.host.rank}</Text>
                </View>
              </View>
            </Card>
          </View>
        ) : null}

        {/* Pending requests (host only) */}
        {isHost && pending.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              PENDING REQUESTS ({pending.length})
            </Text>
            {pending.map((p) => (
              <Card key={p.id} mangaStyle style={styles.participantCard}>
                <View style={styles.participantRow}>
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarTextSmall}>
                      {initials(p.profile?.username ?? '??')}
                    </Text>
                  </View>
                  <Text style={styles.participantName} numberOfLines={1}>
                    {p.profile?.username.toUpperCase() ?? 'UNKNOWN'}
                  </Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApprove(p.user_id)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.actionBtnTextLight}>APPROVE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(p.user_id)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.actionBtnTextDark}>REJECT</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Approved players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            PLAYERS ({approved.length}/{game.max_players})
          </Text>
          {approved.map((p) => (
            <Card key={p.id} mangaStyle style={styles.participantCard}>
              <View style={styles.participantRow}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarTextSmall}>
                    {initials(p.profile?.username ?? '??')}
                  </Text>
                </View>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName} numberOfLines={1}>
                    {p.profile?.username.toUpperCase() ?? 'UNKNOWN'}
                  </Text>
                  {p.user_id === game.host_id ? (
                    <Text style={styles.participantTag}>HOST</Text>
                  ) : null}
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Sticky action footer */}
      <View style={styles.footer}>
        {isTerminal ? (
          <View style={styles.footerMessage}>
            <Text style={styles.footerMessageText}>
              {game.status === 'cancelled' ? 'THIS GAME WAS CANCELLED' : 'THIS GAME HAS ENDED'}
            </Text>
          </View>
        ) : isHost ? (
          <>
            <View style={styles.footerMessage}>
              <Text style={styles.footerMessageText}>
                {isFull ? 'GAME IS FULL — YOU ARE THE HOST' : 'YOU ARE THE HOST'}
              </Text>
            </View>

            {isOpen ? (
              <View style={styles.hostActionsRow}>
                {canTransfer ? (
                  <TouchableOpacity
                    style={styles.transferButton}
                    onPress={handleOpenTransfer}
                    disabled={actionLoading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.transferButtonText}>TRANSFER HOST</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={actionLoading}
                  activeOpacity={0.85}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Text style={styles.cancelButtonText}>CANCEL GAME</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        ) : isApproved ? (
          <Button
            variant="outline"
            size="large"
            pill={false}
            onPress={handleLeave}
            loading={actionLoading}
            style={styles.footerButton}
          >
            LEAVE GAME
          </Button>
        ) : isPending ? (
          <View style={styles.footerMessage}>
            <Text style={styles.footerMessageText}>REQUEST PENDING</Text>
          </View>
        ) : isFull ? (
          <View style={styles.footerMessage}>
            <Text style={styles.footerMessageText}>GAME IS FULL</Text>
          </View>
        ) : isOpen ? (
          <Button
            variant="primary"
            size="large"
            pill={false}
            onPress={handleJoin}
            loading={actionLoading}
            style={styles.footerButton}
          >
            JOIN GAME
          </Button>
        ) : (
          <View style={styles.footerMessage}>
            <Text style={styles.footerMessageText}>NOT AVAILABLE</Text>
          </View>
        )}
      </View>

      {/* Transfer Host modal */}
      <Modal
        visible={transferModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setTransferModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>TRANSFER HOST TO</Text>
              <TouchableOpacity
                onPress={() => setTransferModalVisible(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={22} color={colors.ink} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Choose an approved player to become the new host
            </Text>

            <ScrollView style={styles.modalList}>
              {otherApproved.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.modalRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    handleTransferTo(
                      p.user_id,
                      p.profile?.username ?? 'this player'
                    )
                  }
                >
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarTextSmall}>
                      {initials(p.profile?.username ?? '??')}
                    </Text>
                  </View>
                  <Text style={styles.modalRowName} numberOfLines={1}>
                    {p.profile?.username.toUpperCase() ?? 'UNKNOWN'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, gap: spacing.lg },

  // Header
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

  // Hero
  heroCard: { padding: spacing.xl, gap: spacing.md },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.primary,
  },
  statusBadgeTerminal: { backgroundColor: colors.ink },
  statusBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '900',
    color: colors.textLight,
    letterSpacing: 1.5,
  },
  title: {
    ...typography.heading,
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoBlock: {
    width: '48%',
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    gap: spacing.xs,
    minHeight: 96,
  },
  infoLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: spacing.xs,
  },
  infoValue: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.ink,
    fontSize: 13,
  },

  // Sections
  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.sporty,
    fontSize: 12,
    color: colors.ink,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },

  // Host
  hostCard: { padding: spacing.md },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hostInfo: { flex: 1 },
  hostName: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  hostRank: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },

  // Participants
  participantCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  participantInfo: { flex: 1 },
  participantName: {
    ...typography.subtitle,
    fontSize: 13,
    color: colors.ink,
    flex: 1,
    letterSpacing: 0.5,
  },
  participantTag: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },

  // Approve/Reject
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  approveBtn: { backgroundColor: colors.primary },
  rejectBtn: { backgroundColor: colors.background },
  actionBtnTextLight: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '900',
    color: colors.textLight,
    letterSpacing: 1,
  },
  actionBtnTextDark: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 1,
  },

  // State blocks
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

  // Footer
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 3,
    borderTopColor: colors.ink,
    gap: spacing.sm,
  },
  footerButton: { width: '100%', borderRadius: 0 },
  footerMessage: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
  },
  footerMessageText: {
    ...typography.sporty,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 2,
    textAlign: 'center',
  },

  // Host actions row (Transfer + Cancel)
  hostActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  transferButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    minHeight: 48,
  },
  transferButtonText: {
    ...typography.sporty,
    fontSize: 11,
    color: colors.ink,
    letterSpacing: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.background,
    minHeight: 48,
  },
  cancelButtonText: {
    ...typography.sporty,
    fontSize: 11,
    color: colors.error,
    letterSpacing: 1,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.ink,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.sporty,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 2,
    flex: 1,
  },
  modalClose: {
    padding: spacing.xs,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalList: {
    maxHeight: 400,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalRowName: {
    ...typography.subtitle,
    fontSize: 13,
    color: colors.ink,
    flex: 1,
    letterSpacing: 0.5,
  },
});