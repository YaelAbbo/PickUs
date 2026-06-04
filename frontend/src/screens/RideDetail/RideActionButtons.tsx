import { useRideNavigation } from '@/hooks/rides';
import { i18n } from '@/i18n';
import { RideStatus, type Ride } from '@/schemas/ride';
import { useDeleteRide, useUpdateRide, useRidesByDriverId } from '@/services/ride/rideQueries';
import { AppButton } from '@components';
import { useAuth } from '@services';
import { spacing } from '@theme';
import { useRouter } from 'expo-router';
import type { FC } from 'react';
import { View } from 'react-native';
import { useBoolean } from 'usehooks-ts';
import { DeleteRideConfirmationModal } from './DeleteRideConfirmationModal';
import { RideActionButton } from './RideActionButton';

export type RideActionButtonsProps = { ride: Ride };

export const RideActionButtons: FC<RideActionButtonsProps> = ({ ride }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { navigateToMap, navigateToEditRide } = useRideNavigation();

  const { mutateAsync: deleteRide, reset: resetDeleteRideMutation } = useDeleteRide();
  const { mutateAsync: updateRide, isPending: isUpdating } = useUpdateRide(ride.id);
  const { value: isDeleteRideModalOpen, setTrue: openDeleteRideModal, setFalse: closeDeleteRideModal } = useBoolean();

  const { data: driverRides } = useRidesByDriverId(user?.id ?? '');

  const isUserRideCreator = user?.id === ride.driver?.id;

  const onDeleteRide = async () => {
    await deleteRide(ride.id);

    resetDeleteRideMutation();
    closeDeleteRideModal();

    router.back();
  };

  if (!isUserRideCreator) return null;
  const isRidePending = ride.rideStatus === RideStatus.PENDING;

  const hasActiveRide = driverRides?.some((r) => r.rideStatus === RideStatus.ACTIVE);
  const isStartDisabled = isRidePending && hasActiveRide;

  return (
    <View style={{ gap: spacing.sm, width: '100%' }}>
      <AppButton
        iconName='play-outline'
        label={isRidePending ? i18n.ride_detail.start_ride : i18n.ride_detail.watch_ride}
        loading={isUpdating}
        disabled={isStartDisabled}
        onPress={async () => {
          if (isRidePending) await updateRide({ rideStatus: RideStatus.ACTIVE });
          navigateToMap(ride.id);
        }}
        style={{ alignSelf: 'center' }}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <RideActionButton
          iconName='create-outline'
          label={i18n.general.edit}
          onPress={() => navigateToEditRide(ride.id)}
        />

        <RideActionButton iconName='trash-outline' label={i18n.general.delete} onPress={openDeleteRideModal} />
      </View>

      <DeleteRideConfirmationModal
        onClose={closeDeleteRideModal}
        onDelete={onDeleteRide}
        visible={isDeleteRideModalOpen}
      />
    </View>
  );
};
