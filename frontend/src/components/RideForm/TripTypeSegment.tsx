import { i18n } from '@/i18n';
import { useSegmentAnimation } from '@hooks';
import { colors, radii, spacing, typography } from '@theme';
import type { FC } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SEGMENTS = [
  { label: i18n.rideForm.back_and_forth_ride, value: true },
  { label: i18n.rideForm.one_way_ride, value: false },
] as const;

export type TripTypeSegmentProps = { value: boolean; onChange: (value: boolean) => void };

export const TripTypeSegment: FC<TripTypeSegmentProps> = ({ value, onChange }) => {
  const activeIndex = SEGMENTS.findIndex((s) => s.value === value);

  const { translateX, pillWidth, handleLayout } = useSegmentAnimation({ activeIndex });

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{i18n.rideForm.ride_type}</Text>

      <View style={styles.track} onLayout={handleLayout}>
        {pillWidth > 0 && (
          <Animated.View style={[styles.slidingPill, { width: pillWidth, transform: [{ translateX }] }]} />
        )}

        {SEGMENTS.map(({ value, label }) => (
          <TouchableOpacity
            key={String(value)}
            style={styles.pillTouchable}
            onPress={() => onChange(value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, value === value && styles.pillTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.yellowLight,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: 3,
    gap: 3,
    position: 'relative',
  },
  slidingPill: {
    position: 'absolute',
    top: 3,
    end: 3,
    bottom: 3,
    borderRadius: radii.md,
    backgroundColor: colors.purpleDark,
  },
  pillTouchable: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  pillText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.textLight,
  },
});
