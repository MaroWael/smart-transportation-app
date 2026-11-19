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
// Fonts (unchanged)
// ---------------------------------------------------------------------------

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

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
// Radius — modern: larger, pill-friendly
// ---------------------------------------------------------------------------

export const radius = {
  /** Inputs and buttons. */
  sm: 12,
  /** Cards. */
  md: 16,
  /** Large rounded elements / pills. */
  lg: 24,
} as const;

// ---------------------------------------------------------------------------
// Font sizes
// ---------------------------------------------------------------------------

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
} as const;

// ---------------------------------------------------------------------------
// Elevation / shadow (soft, modern depth)
// ---------------------------------------------------------------------------

export const elevation = {
  /** Subtle lift for cards and inputs. */
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  /** Moderate lift for modal-ish surfaces. */
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
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
  primaryGradient: ['#0B4F8A', '#1466B3'],
  onPrimary: '#FFFFFF',
  error: '#C62828',
  success: '#15803D',
} as const;

// TODO: design the dark palette here once FORCE_LIGHT_THEME is flipped to false.
// Placeholder reuses the light values so the app stays readable in the meantime.
const darkColors = lightColors;

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
  primaryGradient: string[];
  onPrimary: string;
  error: string;
  success: string;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  elevation: typeof elevation;
  gradient: typeof gradient;
}

export const Theme = {
  light: { ...lightColors, spacing, radius, fontSize, elevation, gradient },
  dark: { ...darkColors, spacing, radius, fontSize, elevation, gradient },
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
