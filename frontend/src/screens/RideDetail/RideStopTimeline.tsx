import type { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { i18n } from '@/i18n';
import type { RideStopInfo } from '@/services/ride/rideService';
import { colors, spacing } from '@/theme';

type RideStopTimelineProps = {
  stops: RideStopInfo[];
};

export const RideStopTimeline: FC<RideStopTimelineProps> = ({ stops }) => (
  <View style={styles.routeContainer}>
    {stops.map((stop, index) => {
      const isFirst = index === 0;
      const isLast = index === stops.length - 1;
      return (
        <View key={stop.id} style={styles.stopRow}>
          <View style={styles.timelineWrapper}>
            <View style={[styles.timelineLine, isFirst && styles.transparent]} />
            <View style={[styles.timelineDot, (isFirst || isLast) && styles.timelineDotAccent]} />
            <View style={[styles.timelineLine, isLast && styles.transparent]} />
          </View>
          <View style={styles.stopContent}>
            <View style={styles.stopHeader}>
              <Text style={styles.stopName}>{stop.locationName}</Text>
              <Text style={styles.stopTime}>{stop.estimatedArrivalAt}</Text>
            </View>
            {stop.passengerCount > 0 && (
              <Text style={styles.passengerJoinText}>
                + {stop.passengerCount} {i18n.ride_detail.passengers_joining}
              </Text>
            )}
          </View>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  routeContainer: { marginVertical: spacing.sm, paddingRight: 8 },
  stopRow: { flexDirection: 'row-reverse', minHeight: 44 },
  timelineWrapper: { width: 24, alignItems: 'center', marginLeft: 16 },
  timelineLine: { flex: 1, borderRightWidth: 2, borderStyle: 'dashed', borderRightColor: colors.inputBorder },
  transparent: { borderRightColor: 'transparent' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginVertical: 4, backgroundColor: colors.inputBorder },
  timelineDotAccent: { backgroundColor: colors.yellow },
  stopContent: { flex: 1, justifyContent: 'center', paddingBottom: 16 },
  stopHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  stopName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
  stopTime: { fontSize: 13, fontWeight: '600', color: colors.textLight },
  passengerJoinText: { fontSize: 12, fontWeight: '600', marginTop: 4, textAlign: 'right', color: colors.yellow },
});
