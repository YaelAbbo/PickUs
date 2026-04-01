import '@/app/globals.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { i18n } from '@/i18n';
import { AuthProvider } from '@/services/auth/AuthContext';
import { SplashScreen } from '@components';
import { Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_700Bold, useFonts } from '@expo-google-fonts/heebo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

if (!I18nManager.isRTL) I18nManager.forceRTL(true);

export const unstable_settings = { anchor: '(tabs)' };

const queryClient = new QueryClient();

export default function AppLayout() {
  const colorScheme = useColorScheme();

  const [isFontsLoaded] = useFonts({ Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_700Bold });

  if (!isFontsLoaded) return <SplashScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name='(auth)' options={{ headerShown: false, title: `PickUs - ${i18n.general.enter}` }} />
              <Stack.Screen name='(tabs)' options={{ headerShown: false, title: 'PickUs' }} />
              <Stack.Screen name='modal' options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>

            <StatusBar style='auto' />
          </ThemeProvider>
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
