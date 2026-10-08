// components/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../design';
import { responsive } from '../utils/responsive';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ink';
  size?: 'large' | 'medium' | 'small';
  pill?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'large',
  pill = true,
  loading = false,
  iconLeft,
  iconRight,
  children,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const getButtonStyles = (): ViewStyle[] => {
    const styles: ViewStyle[] = [baseStyles.button];

    // Size
    if (size === 'large') styles.push(baseStyles.large);
    else if (size === 'small') styles.push(baseStyles.small);
    else styles.push(baseStyles.medium);

    // Pill
    if (pill) styles.push(baseStyles.pill);

    // Variant
    if (variant === 'primary') {
      styles.push(
        { 
          backgroundColor: colors.primary,
          borderWidth: 0,
        },
        shadows.button as ViewStyle
      );
    } else if (variant === 'secondary') {
      styles.push({
        backgroundColor: colors.secondary,
        borderWidth: 0,
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      });
    } else if (variant === 'danger') {
      styles.push({
        backgroundColor: colors.error,
        borderWidth: 0,
        shadowColor: colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      });
    } else if (variant === 'ink') {
      styles.push({
        backgroundColor: colors.ink,
        borderWidth: 0,
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      });
    } else if (variant === 'outline') {
      styles.push({
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.ink,
      });
    }

    // Disabled
    if (disabled || loading) {
      styles.push({ opacity: 0.5 });
    }

    return styles;
  };

  const getTextStyles = (): TextStyle[] => {
    const styles: TextStyle[] = [baseStyles.text];

    if (variant === 'primary' || variant === 'secondary' || variant === 'danger' || variant === 'ink') {
      styles.push({ color: colors.textLight });
    } else if (variant === 'outline') {
      styles.push({ color: colors.ink });
    }

    // Sporty uppercase for all buttons
    styles.push({ textTransform: 'uppercase' as const });

    if (size === 'large') styles.push({ fontSize: responsive.fontSize.button });
    else if (size === 'small') styles.push({ fontSize: 12 });

    return styles;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyles(), style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.ink : '#fff'} />
      ) : (
        <>
          {iconLeft && <>{iconLeft}</>}
          <Text style={[...getTextStyles(), textStyle]}>{children}</Text>
          {iconRight && <>{iconRight}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const baseStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  large: {
    height: responsive.buttonHeight,
    paddingHorizontal: spacing.xl,
  },
  medium: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  small: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
  pill: {
    borderRadius: borderRadius.pill,
  },
  text: {
    ...typography.button,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 1,
  },
});