import { i18n } from '@/i18n';
import { useNativeDriver } from '@constants';
import { colors, spacing, typography } from '@theme';
import type { FC } from 'react';
import { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MIN = 1;
const MAX = 5;

const SeatIcon: FC<{ filled: boolean }> = ({ filled }) => {
  const backgroundColor = filled ? colors.yellow : colors.inputBorder;

  return (
    <View style={{ alignItems: 'center', gap: 2, opacity: filled ? 1 : 0.4 }}>
      <View style={{ width: 14, height: 8, borderRadius: 3, backgroundColor }} />
      <View style={{ width: 14, height: 5, borderRadius: 2, backgroundColor }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 14 }}>
        <View style={{ width: 3, height: 3, borderRadius: 1, backgroundColor }} />
        <View style={{ width: 3, height: 3, borderRadius: 1, backgroundColor }} />
      </View>
    </View>
  );
};

export type SeatsCounterProps = {
  value: number;
  onChange: (value: number) => void;
};

export const SeatsCounter: FC<SeatsCounterProps> = ({ value, onChange }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const tint = useRef(new Animated.Value(0)).current;

  const pop = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.28, useNativeDriver, speed: 60 }),
        Animated.timing(tint, { toValue: 1, duration: 80, useNativeDriver }),
      ]),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver, speed: 18, bounciness: 8 }),
        Animated.timing(tint, { toValue: 0, duration: 220, useNativeDriver }),
      ]),
    ]).start();
  };

  const decrement = () => {
    if (value <= MIN) return;

    onChange(value - 1);
    pop();
  };

  const increment = () => {
    if (value >= MAX) return;

    onChange(value + 1);
    pop();
  };

  const animatedColor = tint.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textPrimary, colors.yellow],
  });

  const canDecrement = value > MIN;
  const canIncrement = value < MAX;

  return (
    <View>
      <Text style={styles.label}>{i18n.rideForm.available_seats}</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, !canDecrement && styles.btnInactive]}
          onPress={decrement}
          disabled={!canDecrement}
          activeOpacity={0.72}
          hitSlop={8}
        >
          <Text style={[styles.btnGlyph, !canDecrement && styles.btnGlyphMuted]}>−</Text>
        </TouchableOpacity>

        <View style={styles.center}>
          <Animated.Text style={[styles.count, { transform: [{ scale }], color: animatedColor }]}>
            {value}
          </Animated.Text>
          <View style={styles.iconsRow}>
            {Array.from({ length: MAX }, (_, i) => (
              <SeatIcon key={i} filled={i < value} />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, !canIncrement && styles.btnInactive]}
          onPress={increment}
          disabled={!canIncrement}
          activeOpacity={0.72}
          hitSlop={8}
        >
          <Text style={[styles.btnGlyph, !canIncrement && styles.btnGlyphMuted]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BUTTON_SIZE = 46;

const styles = StyleSheet.create({
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.yellowLight,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.yellow,
  },
  btnInactive: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  btnGlyph: {
    fontSize: 24,
    fontFamily: typography.fonts.bold,
    color: colors.textLight,
    textAlign: 'center',
    includeFontPadding: false,
  },
  btnGlyphMuted: {
    color: colors.textMuted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xs,
  },
  count: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xl + 10,
    lineHeight: 44,
  },
  iconsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
  },
});
