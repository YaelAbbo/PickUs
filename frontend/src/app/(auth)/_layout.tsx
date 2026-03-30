import { useAuth } from '@/services/auth/AuthContext';
import { SplashScreen } from '@components';
import { Redirect, Stack, usePathname } from 'expo-router';

export default function AuthLayout() {
  const { isUserLoading, user } = useAuth();
  const pathname = usePathname();

  if (isUserLoading) return <SplashScreen />;

  if (user && !user.isTempPassword) return <Redirect href='/(tabs)/home' />;

  if (user && user.isTempPassword && pathname !== '/change-password') {
    return <Redirect href='/(auth)/change-password' />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
