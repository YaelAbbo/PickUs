import { i18n } from '@/i18n';
import type { Ride } from '@/schemas/ride';
import { convertRideToRideFormValues } from '@/schemas/rideForm';
import { useRide } from '@/services/ride/rideQueries';
import { AppBackground, AppButton, RideForm } from '@components';
import { colors } from '@theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

const EditRideFormModal = () => {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: Ride['id'] }>();

  const { data: ride, isLoading, isError } = useRide(rideId);

  if (isLoading)
    return (
      <AppBackground style={styles.centerContainer}>
        <ActivityIndicator size='large' color={colors.yellow} />
      </AppBackground>
    );

  if (isError || !ride)
    return (
      <AppBackground style={styles.centerContainer}>
        <Text style={{ color: colors.error, marginBottom: 20 }}>{i18n.ride_detail.error_loading}</Text>

        <AppButton label={i18n.ride_detail.back} onPress={() => router.back()} />
      </AppBackground>
    );

  return <RideForm defaultValues={convertRideToRideFormValues(ride)} />;
};

const styles = StyleSheet.create({
  centerContainer: { justifyContent: 'center', alignItems: 'center', flex: 1 },
});

export default EditRideFormModal;
