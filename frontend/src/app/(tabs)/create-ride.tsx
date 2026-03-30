import { i18n } from '@/i18n';
import { PageHead, RideForm } from '@components';

export default function CreateRidePage() {
  return (
    <>
      <PageHead title={i18n.rideForm.create_ride} />

      <RideForm />
    </>
  );
}
