import { useAuthContext } from '@/services/auth/AuthContext';
import { SplashScreen } from '@components';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isUserLoading, user } = useAuthContext();

  if (isUserLoading) return <SplashScreen />;

  if (user) return <Redirect href='/(tabs)/home' />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
