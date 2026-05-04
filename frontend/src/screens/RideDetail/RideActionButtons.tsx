import { i18n } from '@/i18n';
import type { Ride } from '@/schemas/ride';
import { useDeleteRide } from '@/services/ride/rideQueries';
import { useAuth } from '@services';
import { spacing } from '@theme';
import type { Href } from 'expo-router';
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

  const { mutateAsync: deleteRide, reset: resetDeleteRideMutation } = useDeleteRide();
  const { value: isDeleteRideModalOpen, setTrue: openDeleteRideModal, setFalse: closeDeleteRideModal } = useBoolean();

  const isUserRideCreator = user?.id === ride.driver?.id;

  const openUpdateRideModal = () => {
    const destination: Href = { pathname: '/editRideFormModal', params: { rideId: ride.id } };

    router.push(destination);
  };

  const onDeleteRide = async () => {
    await deleteRide(ride.id);

    resetDeleteRideMutation();
    closeDeleteRideModal();

    router.back();
  };

  if (!isUserRideCreator) return null;

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
      <RideActionButton iconName='create-outline' label={i18n.general.edit} onPress={openUpdateRideModal} />

      <RideActionButton iconName='trash-outline' label={i18n.general.delete} onPress={openDeleteRideModal} />

      <DeleteRideConfirmationModal
        onClose={closeDeleteRideModal}
        onDelete={onDeleteRide}
        visible={isDeleteRideModalOpen}
      />
    </View>
  );
};
