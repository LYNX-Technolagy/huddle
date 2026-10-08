// src/screens/EditProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfile,
  updateProfile,
  isUsernameAvailable,
} from '../lib/profile';
import type { RootStackParamList } from '../navigation/types';
import type { Rank } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const RANK_OPTIONS: { id: Rank; label: string; description: string }[] = [
  { id: 'S', label: 'S', description: 'Top player' },
  { id: 'A', label: 'A', description: 'Experienced' },
  { id: 'B', label: 'B', description: 'Solid' },
  { id: 'C', label: 'C', description: 'Casual' },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function EditProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    full_name?: string;
  }>({});

  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [rank, setRank] = useState<Rank>('C');
  const [city, setCity] = useState('');

  // ---------------------------------------------------------------------------
  // Fetch current profile
  // ---------------------------------------------------------------------------

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const p = await getMyProfile();
      setUsername(p.username);
      setFullName(p.full_name ?? '');
      setBio(p.bio ?? '');
      setRank(p.rank as Rank);
      setCity(p.city ?? '');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = async (): Promise<boolean> => {
    const errs: typeof fieldErrors = {};

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      errs.username = 'Username is required';
    } else if (trimmedUsername.length < 3) {
      errs.username = 'Must be at least 3 characters';
    } else if (trimmedUsername.length > 20) {
      errs.username = 'Must be 20 characters or fewer';
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      errs.username = 'Only letters, numbers, and underscores';
    } else if (user) {
      // Uniqueness check
      const available = await isUsernameAvailable(trimmedUsername, user.id);
      if (!available) {
        errs.username = 'That username is taken';
      }
    }

    if (fullName.trim().length > 60) {
      errs.full_name = 'Must be 60 characters or fewer';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    setError(null);

    const valid = await validate();
    if (!valid) return;

    setSaving(true);

    const { error: saveErr } = await updateProfile({
      username: username.trim(),
      full_name: fullName.trim() || undefined,
      bio: bio.trim() || undefined,
      rank,
      city: city.trim() || undefined,
    });

    setSaving(false);

    if (saveErr) {
      setError(saveErr.message);
      return;
    }

    navigation.goBack();
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT PROFILE</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarBlock}>
            <Skeleton width={80} height={80} style={{ borderRadius: 40 }} />
          </View>

          <View style={styles.field}>
            <Skeleton height={12} width={80} style={{ marginBottom: 8 }} />
            <Skeleton height={48} width="100%" />
          </View>

          <View style={styles.field}>
            <Skeleton height={12} width={100} style={{ marginBottom: 8 }} />
            <Skeleton height={48} width="100%" />
          </View>

          <View style={styles.field}>
            <Skeleton height={12} width={60} style={{ marginBottom: 8 }} />
            <Skeleton height={80} width="100%" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error && !saving) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT PROFILE</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.stateBlock}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateText}>{error.toUpperCase()}</Text>
          <TouchableOpacity onPress={fetchProfile} style={styles.stateButton}>
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

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT PROFILE</Text>
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
          {/* Avatar */}
          <View style={styles.avatarBlock}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {initials(username || '??')}
              </Text>
            </View>
            <Text style={styles.avatarHint}>Avatar upload coming soon</Text>
          </View>

          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>USERNAME</Text>
            <TextInput
              style={[
                styles.input,
                fieldErrors.username && styles.inputError,
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            {fieldErrors.username ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.username}</Text>
            ) : null}
          </View>

          {/* Full name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <TextInput
              style={[
                styles.input,
                fieldErrors.full_name && styles.inputError,
              ]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name (optional)"
              placeholderTextColor={colors.textMuted}
              maxLength={60}
            />
            {fieldErrors.full_name ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.full_name}</Text>
            ) : null}
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>BIO (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell players a bit about yourself"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length} / 200</Text>
          </View>

          {/* Rank */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>RANK</Text>
            <View style={styles.rankRow}>
              {RANK_OPTIONS.map((option) => {
                const active = rank === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.rankTile, active && styles.rankTileActive]}
                    onPress={() => setRank(option.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.rankLetter,
                        active && styles.rankLetterActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.rankDesc,
                        active && styles.rankDescActive,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* City */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CITY</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Cape Town"
              placeholderTextColor={colors.textMuted}
              maxLength={60}
            />
          </View>

          {/* Submit error */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Save button */}
          <Button
            variant="primary"
            size="large"
            pill={false}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            SAVE CHANGES
          </Button>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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

  // Content
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.lg,
  },

  // Avatar
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
  },
  avatarHint: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  // Fields
  field: { gap: spacing.sm },
  fieldLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.ink,
    fontSize: 15,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  inputError: {
    borderColor: colors.error,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  fieldErrorText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  charCount: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
  },

  // Rank
  rankRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rankTile: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    gap: spacing.xs,
  },
  rankTileActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  rankLetter: {
    ...typography.heading,
    fontSize: 20,
    color: colors.textSecondary,
  },
  rankLetterActive: {
    color: colors.primary,
  },
  rankDesc: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rankDescActive: {
    color: colors.primary,
  },

  // Save
  saveButton: {
    width: '100%',
    borderRadius: 0,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
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
});