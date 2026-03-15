import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, radii, spacing, typography } from '@theme';
import type { FC } from 'react';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { HelperText } from 'react-native-paper';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTHS_HE = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

/** "YYYY-MM-DD" → Date (local noon to avoid timezone shifts) */
function dateStringToDate(s: string): Date {
  const [year, month, day] = s.split('-').map(Number);
  return new Date(year!, (month ?? 1) - 1, day ?? 1, 12, 0, 0);
}

/** Date → "YYYY-MM-DD" */
function dateToString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** "YYYY-MM-DD" → "יום שני, 14 במרץ" */
function formatDisplayDate(s: string): string {
  const d = dateStringToDate(s);
  const dayName = DAYS_HE[d.getDay()] ?? '';
  const monthName = MONTHS_HE[d.getMonth()] ?? '';
  return `יום ${dayName}, ${d.getDate()} ב${monthName}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export type DateInputProps = {
  label?: string;
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  error?: string;
  minimumDate?: Date;
};

export const DateInput: FC<DateInputProps> = ({ label, value, onChange, error, minimumDate }) => {
  const [showPicker, setShowPicker] = useState(false);
  const hasError = !!error;

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) onChange(dateToString(selected));
  };

  const displayValue = value ? formatDisplayDate(value) : null;

  return (
    <View style={styles.container}>
      {!!label && <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>}

      <Pressable
        style={[styles.field, hasError && styles.fieldError]}
        onPress={() => setShowPicker(true)}
        accessibilityRole='button'
        accessibilityLabel={label ?? 'בחר תאריך'}
      >
        <Ionicons name='calendar-outline' size={18} color={hasError ? colors.error : colors.textMuted} />
        <Text style={[styles.value, !displayValue && styles.placeholder]}>{displayValue ?? 'בחר תאריך'}</Text>
      </Pressable>

      <HelperText type='error' visible={hasError} style={styles.helperText}>
        {error}
      </HelperText>

      {showPicker && (
        <DateTimePicker
          value={value ? dateStringToDate(value) : new Date()}
          mode='date'
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate ?? new Date()}
          locale='he'
          onChange={handleChange}
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  fieldError: {
    borderColor: colors.error,
  },
  value: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
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
