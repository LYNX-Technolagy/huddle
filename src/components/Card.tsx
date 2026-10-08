// components/Card.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../design';

interface CardProps extends ViewProps {
  variant?: 'light' | 'dark' | 'ink' | 'glass';
  children: React.ReactNode;
  style?: ViewStyle;
  bordered?: boolean;
  mangaStyle?: boolean; // Adds panel border effect
}

export const Card: React.FC<CardProps> = ({
  variant = 'light',
  children,
  style,
  bordered = true,
  mangaStyle = false,
  ...props
}) => {
  const getStyles = (): ViewStyle[] => {
    const styles: ViewStyle[] = [baseStyles.card];

    if (variant === 'light') {
      styles.push({ 
        backgroundColor: colors.card,
        ...(bordered && { borderWidth: 2, borderColor: colors.border }),
      });
    } else if (variant === 'dark') {
      styles.push({ 
        backgroundColor: colors.cardDark,
        ...(bordered && { borderWidth: 2, borderColor: colors.borderDark }),
      });
    } else if (variant === 'ink') {
      styles.push({ 
        backgroundColor: colors.ink,
        ...(bordered && { borderWidth: 2, borderColor: colors.ink }),
      });
    } else {
      styles.push({
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
      });
    }

    // Manga panel style - bold borders, no shadow
    if (mangaStyle) {
      styles.push({
        borderWidth: 3,
        borderColor: colors.ink,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        borderRadius: 0, // Square corners for manga panels
      });
    } else {
      styles.push(shadows.button);
    }

    return styles;
  };

  return (
    <View style={[...getStyles(), style]} {...props}>
      {children}
    </View>
  );
};

const baseStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md, // Slightly less rounded
    padding: spacing.lg,
    overflow: 'hidden',
  },
});