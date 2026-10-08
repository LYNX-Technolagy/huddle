export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
  circle: 999,
};

export const layout = {
  screenPadding: 20,
  cardPadding: 24,
  cardGap: 16,
  sectionSpacing: 24,
  itemSpacing: 12,
  maxWidth: 400,
  heroHeight: 160,
  cardHeight: 180,
  buttonHeight: 56,
  inputHeight: 52,
  bottomBarHeight: 80,
};

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;