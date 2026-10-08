// src/screens/CreateGameScreen.tsx
import React, { useState } from 'react';
import { createElement } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { colors, spacing, typography } from '../design';
import { Button } from '../components/Button';
import { SportIcon } from '../components/SportIcon';
import { createGame } from '../lib/games';
import { reverseGeocode } from '../lib/geo';
import type { RootStackParamList } from '../navigation/types';
import type { GameSkillLevel, GameVisibility } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SPORTS: { id: string; name: string }[] = [
  { id: 'volleyball', name: 'Volleyball' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'soccer',     name: 'Soccer' },
  { id: 'tennis',     name: 'Tennis' },
  { id: 'running',    name: 'Running' },
  { id: 'other',      name: 'Other' },
];

const DURATIONS = [60, 90, 120];
const MAX_PLAYERS = [4, 6, 8, 10, 12];
const SKILL_LEVELS: { id: GameSkillLevel; label: string }[] = [
  { id: 'casual',      label: 'Casual' },
  { id: 'regular',     label: 'Regular' },
  { id: 'competitive', label: 'Competitive' },
  { id: 'any',         label: 'Any' },
];
const VISIBILITIES: { id: GameVisibility; label: string }[] = [
  { id: 'public',  label: 'Public' },
  { id: 'private', label: 'Private' },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function defaultStartTime(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeInputValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// -----------------------------------------------------------------------------
// Screen
// -----------------------------------------------------------------------------

export default function CreateGameScreen() {
  const navigation = useNavigation<NavProp>();

  // Form state
  const [sportId, setSportId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [startsAt, setStartsAt] = useState<Date>(defaultStartTime());
  const [duration, setDuration] = useState<number>(90);
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [skillLevel, setSkillLevel] = useState<GameSkillLevel>('any');
  const [visibility, setVisibility] = useState<GameVisibility>('public');

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Native picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Native picker handlers
  // ---------------------------------------------------------------------------

  const handleDateChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event?.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selected) {
      const merged = new Date(selected);
      merged.setHours(startsAt.getHours());
      merged.setMinutes(startsAt.getMinutes());
      setStartsAt(merged);
    }
  };

  const handleTimeChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event?.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    if (selected) {
      const merged = new Date(startsAt);
      merged.setHours(selected.getHours());
      merged.setMinutes(selected.getMinutes());
      setStartsAt(merged);
    }
  };

  // ---------------------------------------------------------------------------
  // Web date/time handlers
  // ---------------------------------------------------------------------------

  const handleWebDateChange = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return;
    const next = new Date(startsAt);
    next.setFullYear(y, m - 1, d);
    setStartsAt(next);
  };

  const handleWebTimeChange = (value: string) => {
    const [h, min] = value.split(':').map(Number);
    if (h === undefined || min === undefined || isNaN(h) || isNaN(min)) return;
    const next = new Date(startsAt);
    next.setHours(h, min);
    setStartsAt(next);
  };

  // ---------------------------------------------------------------------------
  // GPS location
  // ---------------------------------------------------------------------------

  const handleUseMyLocation = async () => {
    setGpsError(null);
    setGpsSuccess(false);
    setGpsLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Permission denied. Enter location manually.');
        setGpsLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      setLocation({ lat, lng });

      // Try to reverse geocode for a city name — best effort
      const geo = await reverseGeocode(lat, lng);
      const cityName = geo?.city ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setLocationName(cityName);
      setGpsSuccess(true);
    } catch {
      setGpsError("Couldn't get your location. Enter it manually.");
    } finally {
      setGpsLoading(false);
    }
  };

  // If the user edits the location text, we keep the lat/lng but drop the success badge
  const handleLocationNameChange = (text: string) => {
    setLocationName(text);
    if (gpsSuccess) setGpsSuccess(false);
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async () => {
    setError(null);

    if (!sportId) {
      setError('Please pick a sport.');
      return;
    }
    if (!title.trim()) {
      setError('Please add a title.');
      return;
    }
    if (!locationName.trim()) {
      setError('Please add a location.');
      return;
    }
    if (startsAt.getTime() <= Date.now()) {
      setError('Start time must be in the future.');
      return;
    }

    setSubmitting(true);

    const { data, error: createErr } = await createGame({
      sportId,
      title: title.trim(),
      description: description.trim() || undefined,
      locationName: locationName.trim(),
      location: location ?? undefined,
      startsAt: startsAt.toISOString(),
      durationMinutes: duration,
      maxPlayers,
      skillLevel,
      visibility,
    });

    setSubmitting(false);

    if (createErr || !data) {
      setError(createErr?.message ?? 'Could not create game.');
      return;
    }

    navigation.replace('GameDetail', { gameId: data.id });
  };

  const handleClose = () => navigation.goBack();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <Ionicons name="close" size={26} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CREATE GAME</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>SET UP YOUR GAME</Text>
          <Text style={styles.title}>NEW GAME</Text>
          <Text style={styles.subtitle}>
            Fill in the details. You can edit after posting.
          </Text>
        </View>

        {/* Sport */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>SPORT</Text>
          <View style={styles.sportGrid}>
            {SPORTS.map((sport) => {
              const isSelected = sportId === sport.id;
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={[styles.sportTile, isSelected && styles.sportTileSelected]}
                  onPress={() => setSportId(sport.id)}
                  activeOpacity={0.7}
                >
                  <SportIcon
                    sport={sport.id}
                    size={28}
                    color={isSelected ? colors.textLight : colors.ink}
                  />
                  <Text
                    style={[
                      styles.sportLabel,
                      isSelected && styles.sportLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {sport.name.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Saturday Morning Volleyball"
            placeholderTextColor={colors.textMuted}
            maxLength={80}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add any details players should know"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={300}
          />
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>LOCATION</Text>

          <TouchableOpacity
            style={styles.gpsButton}
            onPress={handleUseMyLocation}
            disabled={gpsLoading}
            activeOpacity={0.85}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color={colors.ink} />
            ) : (
              <>
                <Ionicons name="navigate-outline" size={16} color={colors.ink} />
                <Text style={styles.gpsButtonText}>USE MY LOCATION</Text>
              </>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={locationName}
            onChangeText={handleLocationNameChange}
            placeholder="e.g. Kings Beach, Port Elizabeth"
            placeholderTextColor={colors.textMuted}
            maxLength={120}
          />

          {gpsSuccess ? (
            <View style={styles.gpsSuccessRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.gpsSuccessText}>Location captured</Text>
            </View>
          ) : null}

          {gpsError ? (
            <Text style={styles.gpsErrorText}>{gpsError}</Text>
          ) : null}
        </View>

        {/* Date & Time */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>DATE & TIME</Text>
          <View style={styles.dateRow}>
            {Platform.OS === 'web' ? (
              <>
                {createElement('input', {
                  type: 'date',
                  value: toDateInputValue(startsAt),
                  min: toDateInputValue(new Date()),
                  onChange: (e: any) => handleWebDateChange(e.target.value),
                  style: webInputStyle,
                })}
                {createElement('input', {
                  type: 'time',
                  value: toTimeInputValue(startsAt),
                  onChange: (e: any) => handleWebTimeChange(e.target.value),
                  style: webInputStyle,
                })}
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.ink} />
                  <Text style={styles.dateButtonText}>{formatDate(startsAt)}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={18} color={colors.ink} />
                  <Text style={styles.dateButtonText}>{formatTime(startsAt)}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Native date/time pickers */}
        {Platform.OS !== 'web' && showDatePicker && (
          <>
            <DateTimePicker
              value={startsAt}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
            {Platform.OS === 'ios' && (
              <Button
                variant="outline"
                size="small"
                onPress={() => setShowDatePicker(false)}
                style={styles.pickerDone}
              >
                DONE
              </Button>
            )}
          </>
        )}

        {Platform.OS !== 'web' && showTimePicker && (
          <>
            <DateTimePicker
              value={startsAt}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
            {Platform.OS === 'ios' && (
              <Button
                variant="outline"
                size="small"
                onPress={() => setShowTimePicker(false)}
                style={styles.pickerDone}
              >
                DONE
              </Button>
            )}
          </>
        )}

        {/* Duration */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>DURATION (MINUTES)</Text>
          <View style={styles.segmentRow}>
            {DURATIONS.map((d) => {
              const active = duration === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setDuration(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Max players */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>MAX PLAYERS</Text>
          <View style={styles.segmentRow}>
            {MAX_PLAYERS.map((n) => {
              const active = maxPlayers === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setMaxPlayers(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Skill level */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>SKILL LEVEL</Text>
          <View style={styles.segmentRow}>
            {SKILL_LEVELS.map((s) => {
              const active = skillLevel === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setSkillLevel(s.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.segmentText, active && styles.segmentTextActive]}
                    numberOfLines={1}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Visibility */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>VISIBILITY</Text>
          <View style={styles.segmentRow}>
            {VISIBILITIES.map((v) => {
              const active = visibility === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setVisibility(v.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {v.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.helperText}>
            {visibility === 'public'
              ? 'Anyone can join instantly.'
              : 'New players must be approved by you.'}
          </Text>
        </View>

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Submit */}
        <Button
          variant="primary"
          size="large"
          pill={false}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
        >
          CREATE GAME
        </Button>

        <View style={{ height: 80 }} />
      </ScrollView>
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

  scrollContent: { padding: spacing.xl, gap: spacing.lg },
  titleBlock: { gap: spacing.xs, marginBottom: spacing.sm },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    ...typography.heading,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  field: { gap: spacing.sm },
  fieldLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  helperText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sportTile: {
    width: '31%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  sportTileSelected: {
    backgroundColor: colors.primary,
  },
  sportLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  sportLabelSelected: { color: colors.textLight },

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
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },

  // GPS button
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    minHeight: 40,
  },
  gpsButtonText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 1,
  },
  gpsSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  gpsSuccessText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  gpsErrorText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
    marginTop: spacing.xs,
  },

  // Date/time
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  dateButtonText: {
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
    fontWeight: '600',
    flex: 1,
  },
  pickerDone: {
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
    borderRadius: 0,
  },

  segmentRow: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRightWidth: 2,
    borderRightColor: colors.ink,
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  segmentTextActive: { color: colors.textLight },

  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  submitButton: {
    width: '100%',
    borderRadius: 0,
    marginTop: spacing.sm,
  },
});

// -----------------------------------------------------------------------------
// Web-only input style (raw HTML <input>)
// -----------------------------------------------------------------------------

const webInputStyle = {
  flex: 1,
  height: 52,
  borderWidth: 2,
  borderStyle: 'solid',
  borderColor: colors.ink,
  backgroundColor: colors.background,
  paddingLeft: 12,
  paddingRight: 12,
  fontSize: 15,
  fontFamily: 'inherit',
  color: colors.ink,
  outline: 'none',
  boxSizing: 'border-box' as const,
};