import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import { useColorScheme } from 'react-native';

import '@/i18n';

import { AuthProvider } from '@/context/auth-context';
import { AuthGuard } from '@/components/auth-guard';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGuard>
          <Slot />
        </AuthGuard>
      </ThemeProvider>
    </AuthProvider>
  );
}
