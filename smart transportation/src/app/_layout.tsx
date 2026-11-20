import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import { useColorScheme } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import '@/i18n';

import { AuthProvider } from '@/context/auth-context';
import { AuthGuard } from '@/components/auth-guard';
import { LoadingOverlay } from '@/components/loading-overlay';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGuard>
          <Slot />
        </AuthGuard>
        {!fontsLoaded && <LoadingOverlay />}
      </ThemeProvider>
    </AuthProvider>
  );
}
