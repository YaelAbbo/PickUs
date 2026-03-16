import { PageHead } from '@components';
import { LoginScreen } from '@screens';
import { useRouter } from 'expo-router';

export default function LoginPage() {
  const router = useRouter();

  return (
    <>
      <PageHead title='כניסה' />

      <LoginScreen onLoginSuccess={() => router.replace('/(tabs)/home')} />
    </>
  );
}
