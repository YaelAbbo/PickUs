import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { FC } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppBackground, AppButton } from '@/components/ui';
import { useRide } from '@/services/ride/rideQueries';
import { colors, spacing } from '@/theme';

import { RideDriverSection } from './RideDriverSection';
import { RideInfoBoxes } from './RideInfoBoxes';
import { RideStopTimeline } from './RideStopTimeline';

export const RideDetailScreen: FC = () => {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();

  const { data: ride, isLoading, isError } = useRide(rideId as string);

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
        <Text style={{ color: colors.error, marginBottom: 20 }}>אירעה שגיאה בטעינת הנסיעה</Text>
        <AppButton label='חזור' onPress={() => router.back()} />
      </AppBackground>
    );
  }

  const driverName = ride.driver ? `${ride.driver.firstName} ${ride.driver.lastName}` : 'נהג לא ידוע';
  const driverInitials = ride.driver ? `${ride.driver.firstName[0]}${ride.driver.lastName[0]}` : 'נ';

  return (
    <AppBackground>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>פרטי נסיעה</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name='close' size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{ride.rideStatus === 'ACTIVE' ? 'פעיל' : 'ממתין'}</Text>
            </View>
            <Text style={styles.seatsRemainingText}>{ride.availableSeats} מקומות פנויים</Text>
          </View>

          <RideStopTimeline stops={ride.stops || []} />

          <View style={styles.divider} />

          <RideInfoBoxes startTime={ride.startTime} endTime={ride.endTime} date={ride.date} />
        </View>

        <RideDriverSection name={driverName} initials={driverInitials} />

        <View style={styles.passengersContainer}>
          <Text style={styles.sectionTitle}>
            נוסעים ({(ride.maxSeatsAmount || 4) - ride.availableSeats}/{ride.maxSeatsAmount || 4})
          </Text>

          {ride.passengers && ride.passengers.length > 0 ? (
            ride.passengers.map((p, index) => {
              const passName = p.user ? `${p.user.firstName} ${p.user.lastName}` : `נוסע ${index + 1}`;
              const passInitials = p.user ? `${p.user.firstName[0]}${p.user.lastName[0]}` : 'נ';

              return <RideDriverSection key={p.id || index} name={passName} initials={passInitials} />;
            })
          ) : (
            <Text style={styles.emptyText}>אין נוסעים כרגע</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label='הצטרפות לנסיעה' onPress={() => console.log('Join Ride pressed!')} />
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
    paddingTop: 48,
    paddingBottom: spacing.lg,
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
  },
});
