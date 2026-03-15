import '@/app/globals.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/services/auth/AuthContext';
import { SplashScreen } from '@components';
import { APP_NAME } from '@constants';
import { Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_700Bold, useFonts } from '@expo-google-fonts/heebo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import 'react-native-reanimated';

I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export const unstable_settings = { anchor: '(tabs)' };

const queryClient = new QueryClient();

export default function AppLayout() {
  const colorScheme = useColorScheme();

  const [isFontsLoaded] = useFonts({ Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_700Bold });

  if (!isFontsLoaded) return <SplashScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name='(auth)' options={{ headerShown: false, title: `${APP_NAME} - כניסה` }} />
            <Stack.Screen name='(tabs)' options={{ headerShown: false, title: `${APP_NAME}` }} />
            <Stack.Screen name='modal' options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>

          <StatusBar style='auto' />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
