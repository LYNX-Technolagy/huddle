import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

const BREAKPOINTS = {
  mobile: 375,
  tablet: 768,
  desktop: 1024,
};

export const isLargeScreen = width >= BREAKPOINTS.tablet;
export const isDesktop = width >= BREAKPOINTS.desktop;

export const responsive = {
  // Font sizes that scale with screen
  fontSize: {
    hero: width > 768 ? 56 : width > 375 ? 42 : 36,
    heading: width > 768 ? 36 : 28,
    title: width > 768 ? 24 : 20,
    subtitle: width > 768 ? 18 : 16,
    body: width > 768 ? 18 : 16,
    bodySmall: width > 768 ? 16 : 14,
    caption: width > 768 ? 14 : 12,
    button: width > 768 ? 18 : 16,
  },

  // Spacing that scales
  spacing: {
    xs: width > 768 ? 8 : 4,
    sm: width > 768 ? 12 : 8,
    md: width > 768 ? 16 : 12,
    lg: width > 768 ? 24 : 16,
    xl: width > 768 ? 32 : 20,
    xxl: width > 768 ? 40 : 24,
  },

  // Layout values
  padding: {
    horizontal: width > 768 ? 40 : 20,
    vertical: width > 768 ? 40 : 20,
  },

  card: {
    padding: width > 768 ? 40 : 24,
    maxWidth: width > 768 ? 480 : 400,
  },

  inputHeight: width > 768 ? 56 : 52,
  buttonHeight: width > 768 ? 60 : 56,

  // Is tablet or larger
  isTablet: width >= BREAKPOINTS.tablet,
  isDesktop: width >= BREAKPOINTS.desktop,
};

// Get responsive value based on screen size
export function getResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T {
  if (isDesktop && desktop !== undefined) return desktop;
  if (isLargeScreen && tablet !== undefined) return tablet;
  return mobile;
}