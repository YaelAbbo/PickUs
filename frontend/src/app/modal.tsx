import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Card, IconButton } from 'react-native-paper';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRide } from '@/services/ride/rideQueries';
import { colors } from '@/theme';

export default function ModalScreen() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: ride, isLoading, isError } = useRide(rideId as string);

  const themeStyles = {
    background: isDark ? '#121212' : '#F7F8FA',
    cardSurface: isDark ? '#1E1E1E' : colors.white,
    textPrimary: isDark ? '#FFFFFF' : '#11181C',
    textSecondary: isDark ? '#A0A0A0' : '#687076',
    border: isDark ? '#333333' : '#E0E0E0',
    infoBoxBg: isDark ? '#2C2C2C' : '#F0F0F0',
    accentDynamic: isDark ? colors.yellow : colors.purple,
    pillBg: isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(108, 92, 231, 0.15)',
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.centerContainer, { backgroundColor: themeStyles.background }]}>
        <ActivityIndicator size='large' color={themeStyles.accentDynamic} />
      </ThemedView>
    );
  }

  if (isError || !ride) {
    return (
      <ThemedView style={[styles.centerContainer, { backgroundColor: themeStyles.background }]}>
        <ThemedText style={{ color: colors.error }}>שגיאה בטעינת נסיעה.</ThemedText>
        <AppButton onPress={() => router.back()} style={{ marginTop: 20 }}>
          <ThemedText style={{ color: colors.white }}>חזור</ThemedText>
        </AppButton>
      </ThemedView>
    );
  }

  const driverName = ride.driver ? `${ride.driver.firstName} ${ride.driver.lastName}` : 'נהג לא ידוע';
  const driverInitials = ride.driver ? `${ride.driver.firstName[0]}${ride.driver.lastName[0]}` : 'נ';

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <ThemedText style={[styles.headerTitle, { color: themeStyles.textPrimary }]}>פרטי נסיעה</ThemedText>
        <IconButton
          icon='close'
          iconColor={themeStyles.textPrimary}
          size={24}
          onPress={() => router.back()}
          style={styles.closeButton}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, { backgroundColor: themeStyles.cardSurface, borderColor: themeStyles.border }]}>
          <Card.Content>
            <View style={styles.statusRow}>
              <View style={[styles.statusPill, { backgroundColor: themeStyles.pillBg }]}>
                <ThemedText style={[styles.statusText, { color: themeStyles.accentDynamic }]}>
                  {ride.rideStatus === 'ACTIVE' ? 'פעיל' : 'ממתין'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <View style={styles.routeIconWrapper}>
                  <View style={[styles.dot, { backgroundColor: themeStyles.accentDynamic }]} />
                </View>
                <ThemedText style={[styles.routeText, { color: themeStyles.textPrimary }]}>{ride.startDest}</ThemedText>
              </View>

              <View style={[styles.routeLine, { borderRightColor: themeStyles.border }]} />

              <View style={styles.routePoint}>
                <View style={styles.routeIconWrapper}>
                  <MaterialCommunityIcons name='map-marker' size={20} color={themeStyles.accentDynamic} />
                </View>
                <ThemedText style={[styles.routeText, { color: themeStyles.textPrimary }]}>{ride.endDest}</ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: themeStyles.border }]} />

            <View style={styles.timeDateContainer}>
              <View style={[styles.infoBox, { backgroundColor: themeStyles.infoBoxBg }]}>
                <MaterialCommunityIcons name='clock-outline' size={18} color={themeStyles.textSecondary} />
                <ThemedText style={[styles.infoText, { color: themeStyles.textPrimary }]}>
                  {ride.startTime} - {ride.endTime}
                </ThemedText>
              </View>
              <View style={[styles.infoBox, { backgroundColor: themeStyles.infoBoxBg }]}>
                <MaterialCommunityIcons name='calendar-month-outline' size={18} color={themeStyles.textSecondary} />
                <ThemedText style={[styles.infoText, { color: themeStyles.textPrimary }]}>{ride.date}</ThemedText>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.peopleSection}>
          <ThemedText style={[styles.sectionTitle, { color: themeStyles.textSecondary }]}>נהג/ת</ThemedText>
          <View style={styles.personRow}>
            <Avatar.Text size={44} label={driverInitials} style={{ backgroundColor: themeStyles.accentDynamic }} />
            <ThemedText style={[styles.personName, { color: themeStyles.textPrimary }]}>{driverName}</ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: themeStyles.border, marginVertical: 16 }]} />

          <ThemedText style={[styles.sectionTitle, { color: themeStyles.textSecondary }]}>
            נוסעים ({(ride.maxSeatsAmount || 4) - ride.availableSeats}/{ride.maxSeatsAmount || 4})
          </ThemedText>

          {ride.passengers && ride.passengers.length > 0 ? (
            ride.passengers.map((p, index) => (
              <View key={index} style={styles.personRow}>
                <Avatar.Icon
                  size={44}
                  icon='account'
                  style={{ backgroundColor: themeStyles.infoBoxBg }}
                  color={themeStyles.textSecondary}
                />
                <ThemedText style={[styles.personName, { color: themeStyles.textPrimary }]}>
                  נוסע {index + 1}
                </ThemedText>
              </View>
            ))
          ) : (
            <ThemedText style={{ color: themeStyles.textSecondary, textAlign: 'right', marginTop: 8 }}>
              אין נוסעים כרגע
            </ThemedText>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: themeStyles.border, backgroundColor: themeStyles.background }]}>
        <AppButton onPress={() => console.log('Join Ride pressed!')}>
          <ThemedText style={{ color: colors.white, fontSize: 16, fontWeight: 'bold' }}>הצטרפות לנסיעה</ThemedText>
        </AppButton>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    direction: 'rtl',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerSpacer: {
    width: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 0,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    direction: 'rtl',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeContainer: {
    marginVertical: 8,
  },
  routePoint: {
    flexDirection: 'row',
    direction: 'rtl',
    alignItems: 'center',
  },
  routeIconWrapper: {
    width: 24,
    alignItems: 'center',
    marginLeft: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    height: 30,
    borderRightWidth: 2,
    borderStyle: 'dashed',
    marginRight: 11,
    marginVertical: 4,
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  timeDateContainer: {
    flexDirection: 'row',
    direction: 'rtl',
    justifyContent: 'space-between',
  },
  infoBox: {
    flexDirection: 'row',
    direction: 'rtl',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  peopleSection: {
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
  },
  personRow: {
    flexDirection: 'row',
    direction: 'rtl',
    alignItems: 'center',
    marginBottom: 12,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
});
