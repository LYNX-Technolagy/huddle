// components/FilterPills.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../design';

interface PillOption {
  label: string;
  value: string;
  color?: keyof typeof colors;
}

interface FilterPillsProps {
  options: PillOption[];
  selected: string;
  onSelect: (value: string) => void;
  style?: any;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  options,
  selected,
  onSelect,
  style,
}) => {
  const getPillColor = (option: PillOption, isSelected: boolean): string => {
    if (isSelected) {
      return option.color ? (colors[option.color] as string) : colors.primary;
    }
    return colors.background;
  };

  const getTextColor = (option: PillOption, isSelected: boolean) => {
    if (isSelected) {
      return colors.textLight;
    }
    return colors.textSecondary;
  };

  const getBorderColor = (isSelected: boolean) => {
    if (isSelected) {
      return 'transparent';
    }
    return colors.border;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pill,
              {
                backgroundColor: getPillColor(option, isSelected),
                borderColor: getBorderColor(isSelected),
                ...(isSelected && shadows.button),
              },
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.text,
                { color: getTextColor(option, isSelected) },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 4, // Changed to square corners (manga panel feel)
    borderWidth: 2,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...typography.bodySmall,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
});