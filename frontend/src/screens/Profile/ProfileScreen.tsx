import { FlickeringWrapper, PageHead } from '@/components';
import { AppBackground } from '@/components/ui';
import { useRideNavigation } from '@/hooks/rides';
import { i18n } from '@/i18n';
import type { Ride } from '@/schemas/ride';
import { useAuth } from '@/services/auth/AuthContext';
import { useRidesByDriverId, useRidesByPassengerId } from '@/services/ride/rideQueries';
import { colors, spacing } from '@/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RideCard } from '../AvailableRides/RideCard';

const filterAndSortRides = (
  activeTab: 'all' | 'driver' | 'passenger',
  driverRides: Ride[],
  passengerRides: Ride[],
): Ride[] => {
  if (activeTab === 'driver') {
    return driverRides;
  }
  if (activeTab === 'passenger') {
    return passengerRides;
  }
  return [...driverRides, ...passengerRides]
    .filter((ride, index, self) => index === self.findIndex((t) => t.id === ride.id))
    .sort((rideA, rideB) => new Date(rideA.startsAt).getTime() - new Date(rideB.startsAt).getTime());
};

export const ProfileScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'driver' | 'passenger'>('all');

  const { data: driverRides = [], isLoading: isDriverLoading } = useRidesByDriverId(user?.id || '');

  const { data: passengerRides = [], isLoading: isPassengerLoading } = useRidesByPassengerId(user?.id || '');

  const isLoading = isDriverLoading || isPassengerLoading;
  const { navigateToRideDetail } = useRideNavigation();

  if (!user) return <View style={styles.container} />;

  const rides = filterAndSortRides(activeTab, driverRides, passengerRides);

  const now = new Date();
  const activeOrFutureRides = rides.filter((ride) => {
    const endsAt = new Date(ride.estimatedEndsAt);
    const isFutureOrActive = endsAt >= now || ride.rideStatus === 'ACTIVE';
    const isNotDoneOrCancelled = ride.rideStatus !== 'DONE' && ride.rideStatus !== 'CANCELLED';
    return isFutureOrActive && isNotDoneOrCancelled;
  });

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <PageHead title='Profile' />

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.userName}>{user.fullName}</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name='email-outline' size={20} color={colors.textMuted} />
              <Text style={styles.detailText}>{user.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name='phone' size={20} color={colors.textMuted} />
              <Text style={styles.detailText}>{user.phoneNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name='card-account-details-outline' size={20} color={colors.textMuted} />
              <Text style={styles.detailText}>{user.nationalId}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name='shield-account-outline' size={20} color={colors.textMuted} />
              <Text style={styles.detailText}>
                {user.role ? i18n.roles[user.role as keyof typeof i18n.roles] || user.role : ''}
              </Text>
            </View>
          </View>
        </View>

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
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size='large' color={colors.yellow} />
          </View>
        ) : activeOrFutureRides.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No rides found.</Text>
          </View>
        ) : (
          <FlatList
            data={activeOrFutureRides}
            keyExtractor={(ride) => ride.id}
            renderItem={({ item: ride }) => {
              const card = <RideCard item={ride} onPress={() => navigateToRideDetail(ride.id)} />;
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
    paddingVertical: 6,
    height: 28,
  },
  filterChipActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
    height: 32,
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
