// src/components/SportIcon.tsx
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../design';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type SportKey =
  | 'volleyball'
  | 'basketball'
  | 'soccer'
  | 'tennis'
  | 'running'
  | 'other';

interface SportIconProps {
  sport: string | SportKey;
  size?: number;
  color?: string;
}

// Map app sport names (from data) → SportKey
const normalize = (sport: string): SportKey => {
  const s = sport.toLowerCase();
  if (s.includes('volley')) return 'volleyball';
  if (s.includes('basket')) return 'basketball';
  if (s.includes('soccer') || s.includes('football')) return 'soccer';
  if (s.includes('tennis')) return 'tennis';
  if (s.includes('run') || s.includes('track')) return 'running';
  return 'other';
};

// Ionicons covers everything except volleyball
const IONICON_MAP: Record<Exclude<SportKey, 'volleyball'>, IoniconName> = {
  basketball: 'basketball-outline',
  soccer: 'football-outline',
  tennis: 'tennisball-outline',
  running: 'walk-outline',
  other: 'ellipsis-horizontal-outline',
};

// Custom volleyball glyph — one documented exception to the Ionicons-only rule.
// Ionicons has no volleyball icon. Drawn to match Ionicons' outline weight (~2px stroke @ 24).
const VolleyballGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => {
  const stroke = Math.max(1.5, size / 12);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Ball outline */}
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={stroke} />
      {/* Three panel curves — classic volleyball seams */}
      <Path
        d="M12 2 C 8 6, 8 18, 12 22"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <Path
        d="M3.4 6.5 C 9 8, 18 10, 21.8 14.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <Path
        d="M4 17.5 C 8 14, 16 10, 20.6 9.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const SportIcon: React.FC<SportIconProps> = ({
  sport,
  size = 24,
  color = colors.ink,
}) => {
  const key = normalize(sport);

  if (key === 'volleyball') {
    return <VolleyballGlyph size={size} color={color} />;
  }

  return <Ionicons name={IONICON_MAP[key]} size={size} color={color} />;
};