import { useRideNavigation } from '@/hooks/rides';
import { i18n } from '@/i18n';
import { RideStatus, type Ride } from '@/schemas/ride';
import { useDeleteRide, useRidesByDriverId, useUpdateRide } from '@/services/ride/rideQueries';
import { AppButton } from '@components';
import { useAuth } from '@services';
import { spacing } from '@theme';
import { useRouter } from 'expo-router';
import type { FC } from 'react';
import { View } from 'react-native';
import { useBoolean } from 'usehooks-ts';
import { DeleteRideConfirmationModal } from './DeleteRideConfirmationModal';
import { RideActionButton } from './RideActionButton';

export type RideActionButtonsProps = { ride: Ride; readOnly?: boolean };

export const RideActionButtons: FC<RideActionButtonsProps> = ({ ride, readOnly }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { navigateToMap, navigateToEditRide } = useRideNavigation();

  const { mutateAsync: deleteRide, reset: resetDeleteRideMutation } = useDeleteRide();
  const { mutateAsync: updateRide, isPending: isUpdating } = useUpdateRide(ride.id);
  const { value: isDeleteRideModalOpen, setTrue: openDeleteRideModal, setFalse: closeDeleteRideModal } = useBoolean();

  const { data: driverRides } = useRidesByDriverId(user?.id ?? '');

  const isUserRideCreator = Boolean(user?.id && ride?.driver?.id && user.id === ride.driver.id);
  const isPassenger = Boolean(
    user?.id && ride?.passengers?.some((p) => p?.userId === user.id || p?.user?.id === user.id),
  );

  const onDeleteRide = async () => {
    await deleteRide(ride.id);

    resetDeleteRideMutation();
    closeDeleteRideModal();

    router.back();
  };

  if (!isUserRideCreator && !isPassenger) return null;

  if (readOnly) return null;

  const isRidePending = ride.rideStatus === RideStatus.PENDING;
  const isRideActive = ride.rideStatus === RideStatus.ACTIVE;

  if (isPassenger && !isUserRideCreator) {
    if (!isRideActive) return null;
    return (
      <View style={{ gap: spacing.sm, width: '100%' }}>
        <AppButton
          iconName='play-outline'
          label={i18n.ride_detail.watch_ride}
          onPress={() => navigateToMap(ride.id)}
          style={{ alignSelf: 'center' }}
        />
      </View>
    );
  }

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
          disabled={isRideActive}
          onPress={() => navigateToEditRide(ride.id)}
        />

        <RideActionButton
          iconName='trash-outline'
          label={i18n.general.delete}
          disabled={isRideActive}
          onPress={openDeleteRideModal}
        />
      </View>

      <DeleteRideConfirmationModal
        onClose={closeDeleteRideModal}
        onDelete={onDeleteRide}
        visible={isDeleteRideModalOpen}
      />
    </View>
  );
};
