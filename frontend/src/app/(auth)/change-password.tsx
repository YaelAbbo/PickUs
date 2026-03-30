import { i18n } from '@/i18n';
import { PageHead } from '@components';
import { ChangePasswordScreen } from '@screens';
import { useRouter } from 'expo-router';

export default function ChangePasswordPage() {
  const router = useRouter();

  return (
    <>
      <PageHead title={i18n.change_password.title} />

      <ChangePasswordScreen onSuccess={() => router.replace('/(tabs)/home')} />
    </>
  );
}
