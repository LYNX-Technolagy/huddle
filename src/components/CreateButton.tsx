// src/components/CreateButton.tsx
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../design';

interface CreateButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  [key: string]: any;
}

export const CreateButton: React.FC<CreateButtonProps> = ({ 
  onPress, 
  accessibilityLabel = 'Create Game',
  ...props 
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      <View style={styles.button}>
        <Ionicons name="add" size={28} color={colors.textLight} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -10,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    ...shadows.button,
  },
});