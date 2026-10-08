// src/components/LocationPicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, spacing, typography } from '../design';
import { Button } from './Button';
import { reverseGeocode, forwardGeocode } from '../lib/geo';

export interface LocationValue {
  lat: number;
  lng: number;
  city: string | null;
}

interface LocationPickerProps {
  /** Current value. If set, shows the success state. */
  value: LocationValue | null;
  /** Called whenever the location changes (GPS success, manual success, or clear). */
  onChange: (value: LocationValue | null) => void;
  /** Optional initial mode — defaults to 'gps'. */
  initialMode?: 'gps' | 'manual';
  /** Optional label override for the primary button. */
  primaryLabel?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  initialMode = 'gps',
  primaryLabel = 'ENABLE LOCATION',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'gps' | 'manual'>(
    value ? 'gps' : initialMode
  );
  const [manualCity, setManualCity] = useState('');

  // ---------------------------------------------------------------------------
  // GPS flow
  // ---------------------------------------------------------------------------

  const handleEnableLocation = async () => {
    setError(null);
    setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission denied. Enter your city manually.');
        setMode('manual');
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // Best-effort reverse geocode — city may be null
      const geo = await reverseGeocode(lat, lng);

      onChange({
        lat,
        lng,
        city: geo?.city ?? null,
      });
    } catch {
      setError("Couldn't get your location. Enter it manually.");
      setMode('manual');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Manual flow
  // ---------------------------------------------------------------------------

  const handleManualCity = async () => {
    const query = manualCity.trim();
    if (!query) return;

    setError(null);
    setLoading(true);

    try {
      const geo = await forwardGeocode(query);
      if (!geo) {
        setError("Couldn't find that city. Try a different name.");
        setLoading(false);
        return;
      }

      onChange({
        lat: geo.lat,
        lng: geo.lng,
        city: geo.city ?? query,
      });
      setManualCity('');
    } catch {
      setError("Couldn't look up that city. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Clear / change
  // ---------------------------------------------------------------------------

  const handleClear = () => {
    onChange(null);
    setError(null);
    setManualCity('');
    setMode('gps');
  };

  const handleSwitchToManual = () => {
    setError(null);
    setMode('manual');
  };

  const handleSwitchToGps = () => {
    setError(null);
    setMode('gps');
  };

  // ---------------------------------------------------------------------------
  // Success state — location is set
  // ---------------------------------------------------------------------------

  if (value) {
    return (
      <View style={styles.container}>
        <View style={styles.successBlock}>
          <Ionicons
            name="checkmark-circle"
            size={32}
            color={colors.success}
          />
          <Text style={styles.successTitle}>
            {value.city ?? 'Location set'}
          </Text>
          <Text style={styles.successSub}>
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </Text>
          <TouchableOpacity onPress={handleClear} style={styles.changeButton}>
            <Text style={styles.changeText}>Change location</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Manual input mode
  // ---------------------------------------------------------------------------

  if (mode === 'manual') {
    return (
      <View style={styles.container}>
        <View style={styles.manualBlock}>
          <Text style={styles.manualLabel}>ENTER YOUR CITY</Text>
          <TextInput
            style={styles.manualInput}
            value={manualCity}
            onChangeText={setManualCity}
            placeholder="e.g. Cape Town"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
          />

          <Button
            variant="primary"
            size="large"
            pill={false}
            loading={loading}
            onPress={handleManualCity}
            disabled={loading || !manualCity.trim()}
            style={styles.primaryButton}
          >
            USE THIS CITY
          </Button>

          <TouchableOpacity
            onPress={handleSwitchToGps}
            disabled={loading}
          >
            <Text style={styles.changeText}>Try GPS instead</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // GPS mode (default)
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <View style={styles.gpsBlock}>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>📍</Text>
        </View>

        <Text style={styles.description}>
          Huddle uses your location to find games near you. Your exact
          coordinates are never shared with other users — only your city.
        </Text>

        <Button
          variant="primary"
          size="large"
          pill={false}
          loading={loading}
          onPress={handleEnableLocation}
          iconLeft={
            <Ionicons
              name="location-outline"
              size={20}
              color={colors.textLight}
            />
          }
          style={styles.primaryButton}
        >
          {primaryLabel}
        </Button>

        <TouchableOpacity onPress={handleSwitchToManual} disabled={loading}>
          <Text style={styles.changeText}>Enter city manually</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  // GPS mode
  gpsBlock: {
    alignItems: 'center',
    width: '100%',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconEmoji: {
    fontSize: 40,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Manual mode
  manualBlock: {
    width: '100%',
    gap: spacing.md,
  },
  manualLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  manualInput: {
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    padding: spacing.md,
    ...typography.body,
    color: colors.ink,
  },

  // Success state
  successBlock: {
    alignItems: 'center',
    width: '100%',
    gap: spacing.xs,
  },
  successTitle: {
    ...typography.title,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  successSub: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // Shared
  primaryButton: {
    width: '100%',
    borderRadius: 0,
  },
  changeButton: {
    marginTop: spacing.md,
  },
  changeText: {
    ...typography.caption,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
});