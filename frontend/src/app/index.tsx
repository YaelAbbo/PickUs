import { SplashScreen } from '@/components/SplashScreen';
import { useAuthContext } from '@/services/auth/AuthContext';
import { Redirect } from 'expo-router';

export default function AppRoot() {
  const { isUserLoading, user } = useAuthContext();

  if (isUserLoading) return <SplashScreen />;

  return <Redirect href={user ? '/(tabs)/home' : '/(auth)/login'} />;
}
