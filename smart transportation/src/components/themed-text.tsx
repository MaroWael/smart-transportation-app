import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { fontFamily, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor = 'textPrimary', ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  smallBold: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  default: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  link: {
    fontFamily: fontFamily.semiBold,
    lineHeight: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  linkPrimary: {
    fontFamily: fontFamily.semiBold,
    lineHeight: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: (Platform.select({ android: '700' }) ?? '400') as any,
    fontSize: 12,
  },
});
