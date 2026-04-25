import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

type RideInfoBoxesProps = {
  startTime: string;
  endTime: string;
  date: string;
};

export const RideInfoBoxes: FC<RideInfoBoxesProps> = ({ startTime, endTime, date }) => (
  <View style={styles.timeDateContainer}>
    <View style={styles.infoBox}>
      <MaterialCommunityIcons name='clock-outline' size={16} color={colors.textMuted} />
      <Text style={styles.infoText}>
        {startTime} - {endTime}
      </Text>
    </View>
    <View style={styles.infoBox}>
      <MaterialCommunityIcons name='calendar-month-outline' size={16} color={colors.textMuted} />
      <Text style={styles.infoText}>{date}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  timeDateContainer: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  infoBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  infoText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
});
