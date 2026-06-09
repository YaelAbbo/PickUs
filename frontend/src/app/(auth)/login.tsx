import { PageHead } from '@components';
import { LoginScreen } from '@screens';
import { i18n } from '@/i18n';

export default function LoginPage() {
  return (
    <>
      <PageHead title={i18n.login.enter} />

      <LoginScreen />
    </>
  );
}
