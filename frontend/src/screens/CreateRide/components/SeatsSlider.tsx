import Slider from '@react-native-community/slider';
import { colors, radii, spacing, typography } from '@theme';
import type { FC } from 'react';
import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

const MIN = 1;
const MAX = 5;
const THUMB_SIZE = 28;
// The slider component has ~10px internal padding on each side before the thumb center
const SLIDER_PADDING = 10;

export type SeatsSliderProps = {
  value: number;
  onChange: (v: number) => void;
};

export const SeatsSlider: FC<SeatsSliderProps> = ({ value, onChange }) => {
  const [sliderWidth, setSliderWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setSliderWidth(e.nativeEvent.layout.width);
  };

  // Calculate where the thumb center is (in px from left of slider)
  const effectiveWidth = sliderWidth - SLIDER_PADDING * 2;
  // RTL: value increases right-to-left visually, but the slider fills left-to-right
  // We want badge to track the thumb, which for value=1 is on the right and value=5 is on the left
  const ratio = (value - MIN) / (MAX - MIN); // 0 = left (1 seat), 1 = right (5 seats)
  const thumbCenter = SLIDER_PADDING + ratio * effectiveWidth;
  const badgeLeft = thumbCenter - THUMB_SIZE / 2;

  return (
    <View style={styles.block}>
      {/* Right-aligned row label */}
      <Text style={styles.label}>מקומות באוטו</Text>

      <View style={styles.trackWrapper}>
        {/* Badge floats above the thumb */}
        {sliderWidth > 0 && (
          <View style={[styles.badge, { left: badgeLeft }]}>
            <Text style={styles.badgeText}>{value}</Text>
          </View>
        )}

        <View onLayout={handleLayout} style={styles.sliderRow}>
          <Text style={styles.edge}>1</Text>
          <Slider
            value={value}
            onValueChange={(v) => onChange(Math.round(v))}
            minimumValue={MIN}
            maximumValue={MAX}
            step={1}
            style={styles.slider}
            thumbTintColor={colors.yellow}
            minimumTrackTintColor={colors.yellow}
            maximumTrackTintColor={colors.inputBorder}
          />
          <Text style={styles.edge}>5</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.textLight,
  },
  trackWrapper: {
    position: 'relative',
    paddingTop: THUMB_SIZE + spacing.xs, // room for the floating badge
  },
  badge: {
    position: 'absolute',
    top: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.full,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.md,
    color: colors.textDark,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  edge: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    width: 14,
    textAlign: 'center',
  },
});
