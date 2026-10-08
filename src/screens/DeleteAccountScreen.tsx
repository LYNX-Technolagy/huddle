// src/screens/DeleteAccountScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import {
  fetchDeletionInventory,
  deleteMyAccount,
  DeletionInventory,
} from '../lib/accountDeletion';
import type { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'DeleteAccount'>;

const CONFIRM_WORD = 'DELETE';

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function DeleteAccountScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, signOut } = useAuth();

  const [inventory, setInventory] = useState<DeletionInventory | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch inventory
  // ---------------------------------------------------------------------------

  const loadInventory = useCallback(async () => {
    try {
      setLoadingInventory(true);
      setInventoryError(null);
      const data = await fetchDeletionInventory();
      setInventory(data);
    } catch (e: any) {
      setInventoryError(e?.message ?? 'Failed to load account summary');
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canDelete || deleting) return;

    setDeleteError(null);
    setDeleting(true);

    try {
      await deleteMyAccount();
      // Server is done. Now clear local session.
      // RootNavigator will see session = null and swap to Login.
      await signOut();
      // No navigation call needed — the navigator handles it.
    } catch (e: any) {
      setDeleteError(e?.message ?? 'Something went wrong. Please try again.');
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // ---------------------------------------------------------------------------
  // Render — inventory skeleton
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.headerButton}
          disabled={deleting}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DELETE ACCOUNT</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Warning card */}
          <Card mangaStyle style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <Ionicons name="warning-outline" size={28} color={colors.error} />
            </View>
            <Text style={styles.warningEyebrow}>THIS CANNOT BE UNDONE</Text>
            <Text style={styles.warningTitle}>
              DELETE YOUR{'\n'}ACCOUNT?
            </Text>
            <Text style={styles.warningBody}>
              Your profile, sports, games, and activity will be permanently
              removed. Any games you host will be cancelled and other players
              will be notified.
            </Text>
          </Card>

          {/* What will be deleted — inventory */}
          <Card mangaStyle style={styles.card}>
            <Text style={styles.sectionTitle}>WHAT WILL BE DELETED</Text>

            {loadingInventory ? (
              <>
                <Skeleton height={20} width="80%" style={{ marginBottom: 12 }} />
                <Skeleton height={20} width="60%" style={{ marginBottom: 12 }} />
                <Skeleton height={20} width="70%" style={{ marginBottom: 12 }} />
                <Skeleton height={20} width="50%" />
              </>
            ) : inventoryError ? (
              <View style={styles.inventoryErrorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.error}
                />
                <Text style={styles.inventoryErrorText}>{inventoryError}</Text>
                <TouchableOpacity
                  onPress={loadInventory}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>RETRY</Text>
                </TouchableOpacity>
              </View>
            ) : inventory ? (
              <>
                <InventoryRow
                  icon="calendar-outline"
                  label="Hosted games"
                  count={inventory.gamesHosted}
                  note={
                    inventory.gamesHosted > 0
                      ? 'Will be cancelled'
                      : undefined
                  }
                />
                <InventoryRow
                  icon="checkmark-done-outline"
                  label="Games joined"
                  count={inventory.gamesJoined}
                />
                <InventoryRow
                  icon="people-outline"
                  label="Followers"
                  count={inventory.followers}
                />
                <InventoryRow
                  icon="person-add-outline"
                  label="Following"
                  count={inventory.following}
                />
                <InventoryRow
                  icon="basketball-outline"
                  label="Sports"
                  count={inventory.sports}
                  isLast
                />
              </>
            ) : null}
          </Card>

          {/* Confirmation */}
          <Card mangaStyle style={styles.card}>
            <Text style={styles.sectionTitle}>CONFIRM DELETION</Text>
            <Text style={styles.confirmBody}>
              Type{' '}
              <Text style={styles.confirmWord}>{CONFIRM_WORD}</Text>{' '}
              below to confirm. This is your last chance to turn back.
            </Text>

            <TextInput
              style={[
                styles.confirmInput,
                canDelete && styles.confirmInputValid,
              ]}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={CONFIRM_WORD}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!deleting}
              maxLength={20}
            />
          </Card>

          {/* Delete error */}
          {deleteError ? (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={colors.error}
              />
              <Text style={styles.errorText}>{deleteError}</Text>
            </View>
          ) : null}

          {/* Delete button */}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              (!canDelete || deleting) && styles.deleteButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={!canDelete || deleting}
            activeOpacity={0.85}
          >
            {deleting ? (
              <ActivityIndicator color={colors.textLight} size="small" />
            ) : (
              <>
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.textLight}
                />
                <Text style={styles.deleteButtonText}>
                  PERMANENTLY DELETE ACCOUNT
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={deleting}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelButtonText}>KEEP MY ACCOUNT</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// InventoryRow
// -----------------------------------------------------------------------------

interface InventoryRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  count: number;
  note?: string;
  isLast?: boolean;
}

const InventoryRow: React.FC<InventoryRowProps> = ({
  icon,
  label,
  count,
  note,
  isLast = false,
}) => {
  return (
    <View style={[styles.inventoryRow, isLast && styles.inventoryRowLast]}>
      <Ionicons name={icon} size={18} color={colors.ink} />
      <View style={styles.inventoryText}>
        <Text style={styles.inventoryLabel}>{label}</Text>
        {note ? <Text style={styles.inventoryNote}>{note}</Text> : null}
      </View>
      <Text style={styles.inventoryCount}>{count}</Text>
    </View>
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
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },

  card: {
    padding: spacing.lg,
  },

  // Warning card
  warningCard: {
    padding: spacing.lg,
    borderColor: colors.error,
    alignItems: 'flex-start',
  },
  warningIcon: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  warningEyebrow: {
    ...typography.caption,
    fontSize: 10,
    color: colors.error,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  warningTitle: {
    ...typography.heading,
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  warningBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Section titles
  sectionTitle: {
    ...typography.sporty,
    fontSize: 11,
    color: colors.ink,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },

  // Inventory
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inventoryRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  inventoryText: { flex: 1 },
  inventoryLabel: {
    ...typography.body,
    fontSize: 14,
    color: colors.text,
  },
  inventoryNote: {
    ...typography.caption,
    fontSize: 10,
    color: colors.error,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  inventoryCount: {
    ...typography.heading,
    fontSize: 20,
    color: colors.ink,
    minWidth: 32,
    textAlign: 'right',
  },

  inventoryErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
    paddingHorizontal: spacing.md,
  },
  inventoryErrorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: colors.error,
  },
  retryText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.error,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Confirm
  confirmBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  confirmWord: {
    fontWeight: '900',
    color: colors.error,
    letterSpacing: 1,
  },
  confirmInput: {
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  confirmInputValid: {
    borderColor: colors.error,
    backgroundColor: colors.error + '08',
  },

  // Delete button
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.error,
    marginTop: spacing.xs,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    ...typography.button,
    fontSize: 13,
    color: colors.textLight,
    letterSpacing: 1,
  },

  // Cancel button
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    ...typography.button,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 1,
  },

  // Error box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    flex: 1,
  },
});