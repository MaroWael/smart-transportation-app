/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Theme, FORCE_LIGHT_THEME } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();

  // FORCE_LIGHT_THEME is the single switch: when true the app always uses the
  // light palette. Flipping it to false enables the (placeholder) dark theme.
  if (FORCE_LIGHT_THEME) {
    return Theme.light;
  }
  return scheme === 'dark' ? Theme.dark : Theme.light;
}
