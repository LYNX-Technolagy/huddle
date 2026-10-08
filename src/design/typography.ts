// typography.ts - REDESIGNED
import { colors } from './colors';

export const typography = {
  // HERO - Impact font (manga title energy)
  hero: {
    fontSize: 44,
    fontWeight: '900' as const,
    letterSpacing: -1.5,
    lineHeight: 48,
    color: colors.ink,
    textTransform: 'uppercase' as const,
  },
  // HEADING - Bold sporty
  heading: {
    fontSize: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    lineHeight: 36,
    color: colors.ink,
  },
  // TITLE - Clean Nike-style
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0,
    lineHeight: 28,
    color: colors.ink,
  },
  // SUBTITLE - Secondary info
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 22,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
  // BODY - Clean readable
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.text,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  // SPORTY - Nike-style action text
  sporty: {
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 1,
    lineHeight: 18,
    color: colors.ink,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    color: colors.textLight,
    textTransform: 'uppercase' as const,
  },
  buttonSmall: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    color: colors.textLight,
    textTransform: 'uppercase' as const,
  },
};