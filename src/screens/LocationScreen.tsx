// src/screens/LocationScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import {
  LocationPicker,
  LocationValue,
} from '../components/LocationPicker';
import { getMyProfile, updateProfile } from '../lib/profile';
import type { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Location'>;

export default function LocationScreen() {
  const navigation = useNavigation<NavProp>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [value, setValue] = useState<LocationValue | null>(null);
  const [initialCity, setInitialCity] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load current city
  // ---------------------------------------------------------------------------

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await getMyProfile();
      setInitialCity(profile.city ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load location');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!value) return;

    setSaveError(null);
    setSaving(true);

    const { error: saveErr } = await updateProfile({
      location: { lat: value.lat, lng: value.lng },
      city: value.city ?? undefined,
    });

    setSaving(false);

    if (saveErr) {
      setSaveError(saveErr.message);
      return;
    }

    navigation.goBack();
  };

  // ---------------------------------------------------------------------------
  // Loading
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
          <Text style={styles.headerTitle}>LOCATION</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.scrollContent}>
          <Card mangaStyle style={styles.pickerCard}>
            <Skeleton
              height={80}
              width={80}
              style={{ marginBottom: 16, alignSelf: 'center' }}
            />
            <Skeleton
              height={14}
              width="60%"
              style={{ marginBottom: 8, alignSelf: 'center' }}
            />
            <Skeleton
              height={12}
              width="40%"
              style={{ marginBottom: 24, alignSelf: 'center' }}
            />
            <Skeleton height={52} width="100%" />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------------------

  if (error) {
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
          <Text style={styles.headerTitle}>LOCATION</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.stateBlock}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.ink} />
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
        <Text style={styles.headerTitle}>LOCATION</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current city — only shown when a city is set AND user hasn't started changing */}
        {initialCity && !value ? (
          <Card mangaStyle style={styles.currentCard}>
            <Text style={styles.currentLabel}>CURRENT CITY</Text>
            <View style={styles.currentRow}>
              <Ionicons name="location-outline" size={18} color={colors.ink} />
              <Text style={styles.currentCity}>{initialCity}</Text>
            </View>
            <Text style={styles.currentHint}>
              Change it below if you have moved or want games in a different area.
            </Text>
          </Card>
        ) : null}

        {/* Picker */}
        <Card mangaStyle style={styles.pickerCard}>
          <Text style={styles.sectionEyebrow}>SET YOUR LOCATION</Text>
          <Text style={styles.sectionTitle}>
            {initialCity && !value ? 'UPDATE' : 'FIND GAMES NEAR YOU'}
          </Text>

          <View style={styles.pickerWrap}>
            <LocationPicker
              value={value}
              onChange={setValue}
              initialMode="gps"
              primaryLabel="USE MY LOCATION"
            />
          </View>
        </Card>

        {/* Save error */}
        {saveError ? (
          <Text style={styles.saveErrorText}>{saveError}</Text>
        ) : null}

        {/* Save button */}
        <Button
          variant="primary"
          size="large"
          pill={false}
          onPress={handleSave}
          loading={saving}
          disabled={!value || saving}
          style={styles.saveButton}
        >
          SAVE LOCATION
        </Button>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Ionicons
            name="lock-closed-outline"
            size={14}
            color={colors.textMuted}
          />
          <Text style={styles.privacyText}>
            Your exact location is never shared with other users — only your
            city is visible.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },

  // Current city card
  currentCard: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  currentLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  currentCity: {
    ...typography.title,
    fontSize: 18,
    color: colors.ink,
  },
  currentHint: {
    ...typography.bodySmall,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  // Picker card
  pickerCard: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  sectionEyebrow: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 20,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  pickerWrap: {
    marginTop: spacing.sm,
  },

  // Save
  saveButton: {
    width: '100%',
    borderRadius: 0,
    marginTop: spacing.xs,
  },
  saveErrorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Privacy note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  privacyText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    flex: 1,
  },

  // Error state
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