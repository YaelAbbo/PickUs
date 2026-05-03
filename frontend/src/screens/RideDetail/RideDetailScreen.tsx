import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { FC } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppBackground, AppButton } from '@/components/ui';
import { useRide } from '@/services/ride/rideQueries';
import { colors, spacing } from '@/theme';
import type { UUID } from 'crypto';

import { i18n } from '@/i18n';
import type { Ride } from '@/schemas/ride';
import { RideActionButtons } from './RideActionButtons';
import { RideDriverSection } from './RideDriverSection';
import { RideInfoBoxes } from './RideInfoBoxes';
import { RideStopTimeline } from './RideStopTimeline';

export const RideDetailScreen: FC = () => {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: Ride['id'] }>();

  const { data: ride, isLoading, isError } = useRide(rideId as UUID);

  if (isLoading) {
    return (
      <AppBackground style={styles.centerContainer}>
        <ActivityIndicator size='large' color={colors.yellow} />
      </AppBackground>
    );
  }

  if (isError || !ride) {
    return (
      <AppBackground style={styles.centerContainer}>
        <Text style={{ color: colors.error, marginBottom: 20 }}>{i18n.ride_detail.error_loading}</Text>
        <AppButton label={i18n.ride_detail.back} onPress={() => router.back()} />
      </AppBackground>
    );
  }

  const driverName = ride.driver ? `${ride.driver.firstName} ${ride.driver.lastName}` : i18n.ride_detail.unknown_driver;
  const driverInitials = ride.driver
    ? `${ride.driver.firstName[0]}${ride.driver.lastName[0]}`
    : i18n.ride_detail.unknown_driver_initial;

  return (
    <AppBackground>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>{i18n.ride_detail.title}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name='close' size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>
                {ride.rideStatus === 'ACTIVE' ? i18n.ride_detail.status_active : i18n.ride_detail.status_pending}
              </Text>
            </View>
            <Text style={styles.seatsRemainingText}>
              {ride.availableSeats} {i18n.ride_detail.seats_available}
            </Text>
          </View>

          <RideStopTimeline stops={ride.stops || []} />

          <View style={styles.divider} />

          <RideInfoBoxes startTime={ride.startTime} endTime={ride.endTime} date={ride.date} />
        </View>

        <RideDriverSection name={driverName} initials={driverInitials} isDriver={true} />

        <View style={styles.passengersContainer}>
          <Text style={styles.sectionTitle}>
            {i18n.ride_detail.passengers} ({(ride.maxSeatsAmount || 4) - ride.availableSeats}/{ride.maxSeatsAmount || 4}
            )
          </Text>

          {ride.passengers && ride.passengers.length > 0 ? (
            ride.passengers.map((passenger, index) => {
              const passengerName = passenger.user
                ? `${passenger.user.firstName} ${passenger.user.lastName}`
                : `${i18n.ride_detail.passenger} ${index + 1}`;
              const passengerInitials = passenger.user
                ? `${passenger.user.firstName[0]}${passenger.user.lastName[0]}`
                : i18n.ride_detail.unknown_driver_initial;

              return (
                <RideDriverSection
                  key={passenger.id || index}
                  name={passengerName}
                  initials={passengerInitials}
                  isDriver={false}
                />
              );
            })
          ) : (
            <Text style={styles.emptyText}>{i18n.ride_detail.no_passengers}</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <RideActionButtons ride={ride} />

        <AppButton label={i18n.ride_detail.join_ride} onPress={() => console.log('Join Ride pressed!')} />
      </View>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  centerContainer: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 24,
    paddingBottom: spacing.sm,
  },
  headerSpacer: { width: 40 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
    paddingBottom: spacing.md,
  },
  closeButton: { padding: 8, width: 40, alignItems: 'center', paddingBottom: spacing.md },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  card: {
    backgroundColor: colors.purpleCard,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  statusRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusPill: {
    backgroundColor: 'rgba(245, 200, 66, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.yellow },
  seatsRemainingText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.inputBorder, marginVertical: spacing.md },
  passengersContainer: { marginTop: spacing.sm },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'right',
    color: colors.textMuted,
    paddingHorizontal: 8,
  },
  emptyText: { color: colors.textMuted, textAlign: 'right', marginTop: 4, paddingHorizontal: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
    backgroundColor: colors.purple,
    gap: spacing.sm,
  },
});
