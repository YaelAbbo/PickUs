import { SplashScreen } from '@/components/SplashScreen';
import { useAuth } from '@/services/auth/AuthContext';
import { Redirect } from 'expo-router';

export default function AppRoot() {
  const { isUserLoading, user } = useAuth();

  if (isUserLoading) return <SplashScreen />;

  if (user) return <Redirect href={user.isTempPassword ? '/(auth)/change-password' : '/(tabs)/home'} />;

  return <Redirect href='/(auth)/login' />;
}
