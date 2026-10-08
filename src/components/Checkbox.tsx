// src/components/Checkbox.tsx
import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../design';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  /** Size of the checkbox square */
  size?: number;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  disabled = false,
  style,
  size = 22,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.box,
        {
          width: size,
          height: size,
          opacity: disabled ? 0.5 : 1,
        },
        checked && styles.boxChecked,
        style,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      {checked ? (
        <Ionicons
          name="checkmark"
          size={Math.round(size * 0.7)}
          color={colors.textLight}
        />
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.ink,
  },
});