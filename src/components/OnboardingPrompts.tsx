// src/components/OnboardingPrompts.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../design';
import { useAuth } from '../context/AuthContext';

interface OnboardingPromptsProps {
  /** Which prompts to show on this screen. Pass an array of keys. */
  show?: Array<'sports' | 'location'>;
}

export const OnboardingPrompts: React.FC<OnboardingPromptsProps> = ({
  show = ['sports', 'location'],
}) => {
  const navigation = useNavigation<any>();
  const { profileState } = useAuth();

  if (!profileState) return null;
  if (profileState.isComplete) return null;

  const prompts: React.ReactNode[] = [];

  // Sports prompt
  if (show.includes('sports') && !profileState.hasSports) {
    prompts.push(
      <TouchableOpacity
        key="sports"
        style={styles.promptCard}
        onPress={() => navigation.navigate('EditSports')}
        activeOpacity={0.85}
      >
        <View style={styles.promptIcon}>
          <Ionicons name="basketball-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.promptContent}>
          <Text style={styles.promptEyebrow}>ONE STEP TO GO</Text>
          <Text style={styles.promptTitle}>Add your sports</Text>
          <Text style={styles.promptBody}>
            Tell us what you play to see matching games
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.ink} />
      </TouchableOpacity>
    );
  }

  // Location prompt
  if (show.includes('location') && !profileState.hasLocation) {
    prompts.push(
      <TouchableOpacity
        key="location"
        style={styles.promptCard}
        onPress={() => navigation.navigate('Location')}
        activeOpacity={0.85}
      >
        <View style={styles.promptIcon}>
          <Ionicons name="location-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.promptContent}>
          <Text style={styles.promptEyebrow}>ONE STEP TO GO</Text>
          <Text style={styles.promptTitle}>Set your location</Text>
          <Text style={styles.promptBody}>
            We use this to show games near you
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.ink} />
      </TouchableOpacity>
    );
  }

  if (prompts.length === 0) return null;

  return <View style={styles.container}>{prompts}</View>;
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  promptIcon: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptContent: {
    flex: 1,
    gap: 2,
  },
  promptEyebrow: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  promptTitle: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.ink,
  },
  promptBody: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
});