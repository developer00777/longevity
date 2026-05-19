// Champions 100x — Design Tokens
export const Colors = {
  // Backgrounds
  bg:        '#080A0C',
  surf:      '#0F1215',
  surf2:     '#161B20',
  surf3:     '#1E252C',
  surf4:     '#252D36',
  // Borders
  border:    '#252D36',
  borderHi:  '#35404D',
  // Brand
  gold:      '#C8A84B',
  goldLt:    '#E4C76A',
  goldDk:    '#7A6028',
  goldGlow:  '#C8A84B22',
  // Text
  text:      '#EEE9E0',
  textSub:   '#8490A0',
  textMuted: '#4E5A68',
  // Semantic
  green:     '#27C98A',
  greenDk:   '#0D5E3F',
  blue:      '#3D9EF5',
  blueDk:    '#133560',
  purple:    '#9A6CF0',
  purpleDk:  '#3B1A70',
  orange:    '#F07A30',
  orangeDk:  '#5C2A0A',
  red:       '#E84040',
  teal:      '#20C0B0',
  tealDk:    '#0A4840',
  // Legacy aliases so existing screens don't break
  primary:          '#C8A84B',
  primaryDark:      '#7A6028',
  background:       '#080A0C',
  surface:          '#0F1215',
  surfaceElevated:  '#161B20',
  error:            '#E84040',
  warning:          '#F07A30',
  success:          '#27C98A',
  steps:            '#27C98A',
  heartRate:        '#E84040',
  sleep:            '#9A6CF0',
  calories:         '#F07A30',
  textSecondary:    '#8490A0',
} as const;

export const Fonts = {
  serif: 'Georgia', // fallback until expo-google-fonts added
  sans:  'System',
  mono:  'Courier',
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const FontSize = {
  xs:   10,
  sm:   12,
  md:   14,
  lg:   16,
  xl:   20,
  xxl:  26,
  xxxl: 36,
} as const;
