/**
 * App design tokens — modern 2026 mobile aesthetic.
 *
 * Light palette (designed): background, surface, surfaceAlt, surfaceElevated,
 * border, textPrimary, textSecondary, primary, primaryGradient, onPrimary,
 * error, success. Plus spacing (8pt grid), radius, fontSize, shadow and
 * gradient tokens.
 *
 * Dark is NOT designed yet. The `dark` object below is a placeholder that reuses
 * the light values. To enable dark mode later: flip `FORCE_LIGHT_THEME` to `false`
 * and replace the dark placeholder with real dark values (see TODO).
 */

import '@/global.css';

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Theme switch
// ---------------------------------------------------------------------------

// Force the app to use the light palette for now. Enabling dark mode later =
// flip this constant to `false` and fill in the dark tokens (see TODO below).
export const FORCE_LIGHT_THEME = true;

// ---------------------------------------------------------------------------
// Fonts & Typography (Inter 2026 font tokens)
// ---------------------------------------------------------------------------

export const fontFamily = {
  regular: 'Inter_400Regular',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Fonts = {
  sans: fontFamily.regular,
  serif: 'serif',
  rounded: fontFamily.regular,
  mono: Platform.select({
    ios: 'ui-monospace',
    default: 'monospace',
  }) as string,
  regular: fontFamily.regular,
  semiBold: fontFamily.semiBold,
  bold: fontFamily.bold,
};

// ---------------------------------------------------------------------------
// Spacing (8pt grid)
// ---------------------------------------------------------------------------

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// ---------------------------------------------------------------------------
// Radius — modern 2026: inputs/buttons 14, cards 20, pills 9999
// ---------------------------------------------------------------------------

export const radius = {
  /** Inputs and buttons (14px). */
  sm: 14,
  /** Cards (20px). */
  md: 20,
  /** Modals / large surfaces (24px). */
  lg: 24,
  /** Explicit semantic aliases */
  input: 14,
  button: 14,
  card: 20,
  full: 9999,
  pill: 9999,
} as const;

// ---------------------------------------------------------------------------
// Font sizes — strong modern hierarchy (display 32, title 22, body 16, caption 13, label 14)
// ---------------------------------------------------------------------------

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 22,
  xl: 32,
  caption: 13,
  label: 14,
  body: 16,
  title: 22,
  display: 32,
} as const;

// ---------------------------------------------------------------------------
// Elevation / shadow (depth without noise: low opacity, large blur, Android elevation 1-2)
// ---------------------------------------------------------------------------

export const elevation = {
  /** Subtle lift for chips and inputs. */
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  /** Soft card shadow (2026): low opacity, large blur, y-offset 6, Android elevation 2. */
  card: {
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  /** Moderate lift for floating elements / modals. */
  md: {
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  },
  /** Floating pill tab bar or dialog shadow. */
  floating: {
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
} as const;

// ---------------------------------------------------------------------------
// Gradients (modern accent usage)
// ---------------------------------------------------------------------------

export const gradient = {
  /** Primary button gradient: metro blue -> slightly lighter blue. */
  primary: ['#0B4F8A', '#1466B3'],
  /** Subtle surface gradient for glass cards. */
  surface: ['#FFFFFF', '#F8F9F6'],
} as const;

// ---------------------------------------------------------------------------
// Semantic color tokens (light designed, dark placeholder)
// ---------------------------------------------------------------------------

const lightColors = {
  background: '#F7F7F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F1EF',
  surfaceElevated: '#FFFFFF',
  border: '#DDDFDC',
  textPrimary: '#17181A',
  textSecondary: '#5B5F66',
  primary: '#0B4F8A',
  /** Soft tinted accent surface token (~8-10% blue on white) for highlights, selected states and icon badges */
  accentSoft: '#EBF3FA',
  primaryGradient: ['#0B4F8A', '#1466B3'],
  onPrimary: '#FFFFFF',
  error: '#C62828',
  /** Soft tinted error surface token for form alert banners */
  errorSoft: '#FDF2F2',
  success: '#15803D',
} as const;

// TODO: design the dark palette here once FORCE_LIGHT_THEME is flipped to false.
// Placeholder reuses the light values so the app stays readable in the meantime.
const darkColors = {
  ...lightColors,
  // TODO: fill real dark tokens when dark theme is enabled
} as const;

export type ThemeColor = Exclude<keyof typeof lightColors, 'primaryGradient'>;

export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  accentSoft: string;
  primaryGradient: string[];
  onPrimary: string;
  error: string;
  errorSoft: string;
  success: string;
  fontFamily: typeof fontFamily;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  elevation: typeof elevation;
  gradient: typeof gradient;
}

export const Theme = {
  light: { ...lightColors, fontFamily, spacing, radius, fontSize, elevation, gradient },
  dark: { ...darkColors, fontFamily, spacing, radius, fontSize, elevation, gradient },
} as const;

// ---------------------------------------------------------------------------
// Legacy exports (kept working)
// ---------------------------------------------------------------------------

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
