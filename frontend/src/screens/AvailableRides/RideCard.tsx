import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { FC } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Ride } from '@/services/ride/rideService';
import { colors, spacing } from '@/theme';

type RideCardProps = {
  item: Ride;
  onPress: () => void;
};

export const RideCard: FC<RideCardProps> = ({ item, onPress }) => {
  const totalIcons = Math.min(item.maxSeatsAmount || 4, 4);
  const freeIcons = Math.min(item.availableSeats, totalIcons);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardRow}>
        <View style={styles.routeContainer}>
          <Text style={styles.routeText}>{item.startDest}</Text>
          <MaterialCommunityIcons name='arrow-left' size={18} color={colors.yellow} style={styles.routeArrow} />
          <Text style={styles.routeText}>{item.endDest}</Text>
        </View>
        <View style={styles.seatsContainer}>
          {Array.from({ length: totalIcons }).map((_, i) => (
            <MaterialCommunityIcons
              key={i}
              name='account'
              size={18}
              color={i < freeIcons ? colors.yellow : colors.textMuted}
              style={styles.seatIcon}
            />
          ))}
        </View>
      </View>
      <View style={[styles.cardRow, { marginBottom: 0 }]}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.timeText}>
          {item.startTime} - {item.endTime}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.purpleCard,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  cardRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeContainer: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1 },
  routeText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'right' },
  routeArrow: { marginHorizontal: 4 },
  seatsContainer: { flexDirection: 'row-reverse', gap: -4 },
  seatIcon: { width: 18, height: 18, textAlign: 'center' },
  dateText: { color: colors.yellow, fontSize: 14, fontWeight: '600' },
  timeText: { color: colors.yellow, fontSize: 14, fontWeight: '600' },
});
