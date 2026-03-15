import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, radii, spacing, typography } from '@theme';
import type { FC } from 'react';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { HelperText } from 'react-native-paper';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** "HH:MM" → Date at that time today */
function timeStringToDate(time: string): Date {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Date → "HH:MM" */
function dateToTimeString(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export type TimeInputProps = {
  label?: string;
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  error?: string;
};

export const TimeInput: FC<TimeInputProps> = ({ label, value, onChange, error }) => {
  const [showPicker, setShowPicker] = useState(false);
  const hasError = !!error;

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    // On Android the picker closes itself; on iOS we close on confirm
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) onChange(dateToTimeString(selected));
  };

  return (
    <View style={styles.container}>
      {!!label && <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>}

      <Pressable
        style={[styles.field, hasError && styles.fieldError]}
        onPress={() => setShowPicker(true)}
        accessibilityRole='button'
        accessibilityLabel={label ?? 'בחר שעה'}
      >
        <Ionicons
          name='time-outline'
          size={18}
          color={hasError ? colors.error : colors.textMuted}
          style={styles.icon}
        />

        <Text style={[styles.value, !value && styles.placeholder]}>{value || '00:00'}</Text>
      </Pressable>

      {hasError && (
        <HelperText type='error' style={styles.helperText}>
          {error}
        </HelperText>
      )}

      {showPicker && (
        <DateTimePicker
          value={timeStringToDate(value || '00:00')}
          mode='time'
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          // On iOS wrap in a modal-style inline; on Android it's a dialog automatically
          {...(Platform.OS === 'ios' && { onTouchCancel: () => setShowPicker(false) })}
        />
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.yellowLight,
    marginBottom: spacing.xs,
  },
  labelError: {
    color: colors.error,
  },
  field: {
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  fieldError: {
    borderColor: colors.error,
  },
  icon: {
    // icon sits to the right; row is centered so this pairs naturally with the value
  },
  value: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  helperText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.error,
    paddingHorizontal: 0,
  },
});
