// src/screens/EditSportsScreen.tsx
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { getMySports, setMySports } from '../lib/profile';
import type { RootStackParamList } from '../navigation/types';
import type { SkillLevel } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'EditSports'>;

const SPORTS: { id: string; emoji: string; name: string }[] = [
  { id: 'volleyball', emoji: '🏐', name: 'Volleyball' },
  { id: 'basketball', emoji: '🏀', name: 'Basketball' },
  { id: 'soccer',     emoji: '⚽', name: 'Soccer' },
  { id: 'tennis',     emoji: '🎾', name: 'Tennis' },
  { id: 'running',    emoji: '🏃', name: 'Running' },
  { id: 'other',      emoji: '🎯', name: 'Other' },
];

const SKILL_LEVELS: { id: SkillLevel; label: string }[] = [
  { id: 'casual',      label: 'Casual' },
  { id: 'regular',     label: 'Regular' },
  { id: 'competitive', label: 'Competitive' },
];

export default function EditSportsScreen() {
  const navigation = useNavigation<NavProp>();
  const { refreshProfileState } = useAuth();

  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [sportSkills, setSportSkills] = useState<Record<string, SkillLevel>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- Load current sports -----
  const fetchSports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const existing = await getMySports();
      const ids = existing.map((s) => s.sport_id);
      const skills: Record<string, SkillLevel> = {};
      existing.forEach((s) => {
        skills[s.sport_id] = s.skill_level as SkillLevel;
      });

      setSelectedSports(ids);
      setSportSkills(skills);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load sports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSports();
  }, [fetchSports]);

  // ----- Handlers -----
  const toggleSport = (sportId: string) => {
    if (selectedSports.includes(sportId)) {
      setSelectedSports((prev) => prev.filter((id) => id !== sportId));
      setSportSkills((prev) => {
        const next = { ...prev };
        delete next[sportId];
        return next;
      });
    } else {
      setSelectedSports((prev) => [...prev, sportId]);
    }
  };

  const setSportSkill = (sportId: string, level: SkillLevel) => {
    setSportSkills((prev) => ({ ...prev, [sportId]: level }));
  };

  const canSave =
    selectedSports.length > 0 &&
    selectedSports.every((id) => !!sportSkills[id]);

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    setError(null);

    const inputs = selectedSports.map((sportId, idx) => ({
      sport_id: sportId,
      skill_level: sportSkills[sportId] ?? 'casual',
      is_primary: idx === 0,
    }));

    const { error: saveErr } = await setMySports(inputs);
    setSaving(false);

    if (saveErr) {
      setError(saveErr.message);
      return;
    }

    await refreshProfileState();
    navigation.goBack();
  };

  // ----- Render -----
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
        <Text style={styles.headerTitle}>YOUR SPORTS</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introBlock}>
          <Text style={styles.eyebrow}>WHAT DO YOU PLAY?</Text>
          <Text style={styles.title}>PICK YOUR SPORTS</Text>
          <Text style={styles.subtitle}>
            We'll show you games that match what you play.
          </Text>
        </View>

        {loading ? (
          <>
            <Skeleton height={60} width="100%" style={{ marginBottom: 12 }} />
            <Skeleton height={60} width="100%" style={{ marginBottom: 12 }} />
            <Skeleton height={60} width="100%" />
          </>
        ) : (
          <>
            {/* Sports list */}
            {SPORTS.map((sport) => {
              const isSelected = selectedSports.includes(sport.id);
              const skill = sportSkills[sport.id];
              return (
                <Card key={sport.id} mangaStyle style={styles.sportBlock}>
                  <TouchableOpacity
                    style={[
                      styles.sportCard,
                      isSelected && styles.sportCardSelected,
                    ]}
                    onPress={() => toggleSport(sport.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                    <Text
                      style={[
                        styles.sportName,
                        isSelected && styles.sportNameSelected,
                      ]}
                    >
                      {sport.name}
                    </Text>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.primary}
                        style={{ marginLeft: spacing.md }}
                      />
                    ) : (
                      <Ionicons
                        name="ellipse-outline"
                        size={22}
                        color={colors.textMuted}
                        style={{ marginLeft: spacing.md }}
                      />
                    )}
                  </TouchableOpacity>

                  {isSelected && (
                    <View style={styles.skillRow}>
                      {SKILL_LEVELS.map((level) => {
                        const isActive = skill === level.id;
                        return (
                          <TouchableOpacity
                            key={level.id}
                            style={[
                              styles.skillPill,
                              isActive && styles.skillPillActive,
                            ]}
                            onPress={() => setSportSkill(sport.id, level.id)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.skillPillText,
                                isActive && styles.skillPillTextActive,
                              ]}
                            >
                              {level.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </Card>
              );
            })}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              variant={canSave ? 'primary' : 'outline'}
              size="large"
              pill={false}
              onPress={handleSave}
              disabled={!canSave || saving}
              loading={saving}
              style={styles.saveButton}
            >
              SAVE SPORTS
            </Button>

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
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
    padding: spacing.xl,
    gap: spacing.md,
  },

  introBlock: { gap: spacing.xs, marginBottom: spacing.sm },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    ...typography.heading,
    fontSize: 26,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  sportBlock: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportCardSelected: {},
  sportEmoji: {
    fontSize: 26,
    marginRight: spacing.md,
  },
  sportName: {
    flex: 1,
    ...typography.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sportNameSelected: { color: colors.ink },

  skillRow: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    paddingLeft: spacing.huge,
    flexWrap: 'wrap',
  },
  skillPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  skillPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  skillPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  skillPillTextActive: { color: colors.textLight },

  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    textAlign: 'center',
  },

  saveButton: {
    width: '100%',
    borderRadius: 0,
    marginTop: spacing.md,
  },
});