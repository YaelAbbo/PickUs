import { FlickeringWrapper, PageHead, ProfileCard } from '@/components';
import { AppBackground } from '@/components/ui';
import { useRideNavigation } from '@/hooks/rides';
import { i18n } from '@/i18n';
import { useAuth } from '@/services/auth/AuthContext';
import {
  useRideHistoryByDriverId,
  useRideHistoryByPassengerId,
  useRidesByDriverId,
  useRidesByPassengerId,
} from '@/services/ride/rideQueries';
import { colors, spacing } from '@/theme';
import { filterAndSortRides } from '@/utils/profileUtils';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RideCard } from '../AvailableRides/RideCard';

export const ProfileScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'driver' | 'passenger' | 'history'>('all');

  const { data: driverRides = [], isLoading: isDriverLoading } = useRidesByDriverId(user?.id || '');

  const { data: passengerRides = [], isLoading: isPassengerLoading } = useRidesByPassengerId(user?.id || '');

  const { data: driverHistoryRides = [], isLoading: isDriverHistoryLoading } = useRideHistoryByDriverId(user?.id || '');

  const { data: passengerHistoryRides = [], isLoading: isPassengerHistoryLoading } = useRideHistoryByPassengerId(
    user?.id || '',
  );

  const isLoading = isDriverLoading || isPassengerLoading || isDriverHistoryLoading || isPassengerHistoryLoading;
  const { navigateToRideDetail } = useRideNavigation();

  if (!user) return <View style={styles.container} />;

  const rides = filterAndSortRides(activeTab, driverRides, passengerRides, driverHistoryRides, passengerHistoryRides);

  const now = new Date();
  const displayedRides =
    activeTab === 'history'
      ? rides
      : rides.filter((ride) => {
          const endsAt = new Date(ride.estimatedEndsAt);
          const isFutureOrActive = endsAt >= now || ride.rideStatus === 'ACTIVE';
          const isNotDoneOrCancelled = ride.rideStatus !== 'DONE' && ride.rideStatus !== 'CANCELLED';
          return isFutureOrActive && isNotDoneOrCancelled;
        });

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <PageHead title='Profile' />

        <ProfileCard user={user} />

        <View style={styles.filtersContainer}>
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterChip, activeTab === 'all' && styles.filterChipActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.filterChipText, activeTab === 'all' && styles.filterChipTextActive]}>
                {i18n.general.all}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeTab === 'passenger' && styles.filterChipActive]}
              onPress={() => setActiveTab('passenger')}
            >
              <Text style={[styles.filterChipText, activeTab === 'passenger' && styles.filterChipTextActive]}>
                {i18n.general.passenger}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeTab === 'driver' && styles.filterChipActive]}
              onPress={() => setActiveTab('driver')}
            >
              <Text style={[styles.filterChipText, activeTab === 'driver' && styles.filterChipTextActive]}>
                {i18n.general.driver}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeTab === 'history' && styles.filterChipActive]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.filterChipText, activeTab === 'history' && styles.filterChipTextActive]}>
                {i18n.general.history}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size='large' color={colors.yellow} />
          </View>
        ) : displayedRides.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'history' ? i18n.profile_screen.no_history_rides : i18n.profile_screen.no_rides}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayedRides}
            keyExtractor={(ride) => ride.id}
            renderItem={({ item: ride }) => {
              const isHistory = activeTab === 'history';
              const card = <RideCard item={ride} onPress={() => navigateToRideDetail(ride.id, isHistory)} />;
              return ride.rideStatus === 'ACTIVE' ? <FlickeringWrapper>{card}</FlickeringWrapper> : card;
            }}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: colors.inputBg,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.yellow,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '500',
  },
  filtersContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  filtersRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    paddingRight: 4,
    justifyContent: 'center',
  },
  filterChip: {
    marginLeft: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 16,
    paddingVertical: 3,
    height: 32,
  },
  filterChipActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
  },
  filterChipText: {
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: colors.textDark,
    fontWeight: '700',
    fontSize: 16,
  },
  listContainer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
