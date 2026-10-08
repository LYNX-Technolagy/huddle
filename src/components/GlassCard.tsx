// components/GlassCard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { borderRadius, shadows, colors } from '../design';

interface GlassCardProps extends ViewProps {
  variant?: 'light' | 'dark';
  blurIntensity?: number;
  children: React.ReactNode;
  style?: ViewStyle;
  mangaStyle?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'light',
  children,
  style,
  mangaStyle = false,
  ...props
}) => {
  const getStyles = (): ViewStyle[] => {
    const styles: ViewStyle[] = [baseStyles.card];

    if (variant === 'light') {
      styles.push({
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.15)',
      });
    } else {
      styles.push({
        backgroundColor: 'rgba(26,26,26,0.08)',
        borderColor: 'rgba(26,26,26,0.10)',
      });
    }

    if (mangaStyle) {
      styles.push({
        borderWidth: 2,
        borderColor: colors.ink,
        borderRadius: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      });
    } else {
      styles.push(shadows.glass);
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
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: 20,
    overflow: 'hidden',
  },
});