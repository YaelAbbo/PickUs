import { IS_WEB } from '@constants';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@theme';
import type { FC } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PlaceResult } from '../hooks';
import { LocationInput } from './LocationInput';
import { TimeInput } from './TimeInput';

export type LocationRowProps = {
  label: string;
  timeValue: Date;
  onTimeChange: (value: Date | undefined) => void;
  timeError?: string;
  locationValue: string;
  onLocationChange: (value: string, place?: PlaceResult) => void;
  locationError?: string;
  onRemove?: () => void;
};

export const LocationRow: FC<LocationRowProps> = ({
  label,
  timeValue,
  onTimeChange,
  timeError,
  locationValue,
  onLocationChange,
  locationError,
  onRemove,
}) => (
  <View style={styles.wrapper}>
    <Text style={styles.rowLabel}>{label}</Text>

    <View style={styles.row}>
      <View style={styles.timeWrapper}>
        <TimeInput value={timeValue} onChange={onTimeChange} error={timeError} />
      </View>

      <View style={styles.locationWrapper}>
        <LocationInput value={locationValue} onChange={onLocationChange} error={locationError} placeholder={label} />
      </View>

      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton} hitSlop={8}>
          <Ionicons name='close-circle' size={22} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  rowLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.yellowLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    zIndex: 10,
  },
  timeWrapper: {
    width: IS_WEB ? 100 : 92,
  },
  locationWrapper: {
    flex: 1,
    zIndex: 10,
  },
  removeButton: {
    marginTop: spacing.md + 2,
  },
});
