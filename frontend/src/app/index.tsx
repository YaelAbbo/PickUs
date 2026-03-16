import { SplashScreen } from '@/components/SplashScreen';
import { useAuth } from '@/services/auth/AuthContext';
import { Redirect } from 'expo-router';

export default function AppRoot() {
  const { isUserLoading, user } = useAuth();

  if (isUserLoading) return <SplashScreen />;

  return <Redirect href={user ? '/(tabs)/home' : '/(auth)/login'} />;
}
