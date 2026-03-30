import { i18n } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, radii, spacing, typography } from '@theme';
import type { FC } from 'react';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { HelperText } from 'react-native-paper';

export type TimeInputProps = {
  label?: string;
  value: Date;
  onChange: (value: Date | undefined) => void;
  error?: string;
};

export const TimeInput: FC<TimeInputProps> = ({ label, value, onChange, error }) => {
  const [showPicker, setShowPicker] = useState(false);
  const hasError = !!error;

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);

    onChange(selected);
  };

  const displayValue = value ? value.toLocaleTimeString('he-IL', { timeStyle: 'short' }) : i18n.general.time_pick;

  return (
    <View style={styles.container}>
      {!!label && <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>}

      <Pressable
        style={[styles.field, hasError && styles.fieldError]}
        onPress={() => setShowPicker(true)}
        accessibilityRole='button'
        accessibilityLabel={label ?? i18n.general.hour_pick}
      >
        <Ionicons name='time-outline' size={18} color={hasError ? colors.error : colors.textMuted} />

        <Text style={[styles.value, !value && styles.placeholder]}>{displayValue}</Text>
      </Pressable>

      {hasError && (
        <HelperText type='error' style={styles.helperText}>
          {error}
        </HelperText>
      )}

      {showPicker && (
        <DateTimePicker
          value={value}
          mode='time'
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          {...(Platform.OS === 'ios' && { onTouchCancel: () => setShowPicker(false) })}
        />
      )}
    </View>
  );
};

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
