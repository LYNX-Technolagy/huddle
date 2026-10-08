// components/Input.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../design';
import { responsive } from '../utils/responsive';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  containerStyle?: ViewStyle;
  secureTextEntry?: boolean;
  variant?: 'light' | 'dark';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  iconRight,
  onIconPress,
  containerStyle,
  secureTextEntry,
  variant = 'light',
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  const togglePassword = () => setShowPassword(!showPassword);

  const getBackgroundColor = () => {
    if (variant === 'dark') {
      return isFocused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)';
    }
    return isFocused ? colors.backgroundLight : colors.background;
  };

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  const getTextColor = () => {
    if (variant === 'dark') return colors.textLight;
    return colors.text;
  };

  const getLabelColor = () => {
    if (variant === 'dark') return 'rgba(255,255,255,0.8)';
    return colors.textSecondary;
  };

  const getPlaceholderColor = () => {
    if (variant === 'dark') return 'rgba(255,255,255,0.4)';
    return colors.textMuted;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: getLabelColor() }]}>
          {label.toUpperCase()}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            ...(isFocused && !error && shadows.panel),
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textMuted}
            style={styles.iconLeft}
          />
        )}
        <TextInput
          style={[
            styles.input,
            { color: getTextColor() },
            style,
          ]}
          placeholderTextColor={getPlaceholderColor()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword ? !showPassword : false}
          {...props}
        />
        {iconRight && (
          <TouchableOpacity onPress={onIconPress} style={styles.iconRight}>
            <Ionicons 
              name={iconRight} 
              size={20} 
              color={isFocused ? colors.primary : colors.textMuted} 
            />
          </TouchableOpacity>
        )}
        {isPassword && (
          <TouchableOpacity onPress={togglePassword} style={styles.iconRight}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={isFocused ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4, // Square corners - manga style
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    height: responsive.inputHeight,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: spacing.sm,
  },
  iconLeft: {
    marginRight: spacing.md,
  },
  iconRight: {
    padding: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});