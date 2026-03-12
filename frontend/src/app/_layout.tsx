import '@/app/globals.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/services/auth/AuthContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export const unstable_settings = { anchor: '(tabs)' };

const queryClient = new QueryClient();

export default function AppLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name='(auth)' options={{ headerShown: false, title: 'PickUs - כניסה' }} />
            <Stack.Screen name='(tabs)' options={{ headerShown: false, title: 'PickUs' }} />
            <Stack.Screen name='modal' options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>

          <StatusBar style='auto' />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
