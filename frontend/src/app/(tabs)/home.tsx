import { i18n } from '@/i18n';
import { AvailableRidesScreen } from '@/screens/AvailableRides';
import { PageHead } from '@components';

export default function HomeScreen() {
  return (
    <>
      <PageHead title={i18n.available_rides_screen.page_head_title} />

      <AvailableRidesScreen />
    </>
  );
}
