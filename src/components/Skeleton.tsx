// src/components/Skeleton.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../design';

interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A single pulsing rectangle. Compose multiples of these to build
 * a skeleton layout that mirrors real content.
 *
 * Uses a shared pulse animation pattern — every instance runs its own
 * loop but the timing is identical, so they visually sync.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ width, height, style }) => {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          backgroundColor: colors.border,
          borderRadius: 2,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
};