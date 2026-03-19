import { Ionicons } from '@expo/vector-icons';
import { getTomorrowAt8AM } from '@helpers';
import DateTimePicker, {
  type AndroidNativeProps,
  type DateTimePickerEvent,
  type IOSNativeProps,
  type WindowsNativeProps,
} from '@react-native-community/datetimepicker';
import { colors, radii, spacing, typography } from '@theme';
import type { ComponentProps, FC } from 'react';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { HelperText } from 'react-native-paper';

export type DateInputProps = Omit<ComponentProps<typeof DateTimePicker>, 'onChange'> & {
  onChange: (date: Date | undefined) => void;
  label?: string;
  error?: string;
};

export const DateInput: FC<DateInputProps> = ({
  label,
  value,
  onChange,
  error,
  minimumDate = new Date(),
  ...props
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const hasError = !!error;

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);

    onChange(selected);
  };

  const displayValue = value ? value.toLocaleDateString('he-IL', { dateStyle: 'full' }) : 'בחירת תאריך';

  return (
    <View style={styles.container}>
      {!!label && <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>}

      <Pressable
        style={[styles.field, hasError && styles.fieldError]}
        onPress={() => setShowPicker(true)}
        accessibilityRole='button'
        accessibilityLabel={displayValue}
      >
        <Ionicons name='calendar-outline' size={18} color={hasError ? colors.error : colors.textMuted} />

        <Text style={[styles.value, !displayValue && styles.placeholder]}>{displayValue}</Text>
      </Pressable>

      {hasError && (
        <HelperText type='error' style={styles.helperText}>
          {error}
        </HelperText>
      )}

      {showPicker && (
        <DateTimePicker
          value={value ?? getTomorrowAt8AM()}
          mode='date'
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          locale='he'
          onChange={handleChange}
          {...(Platform.OS === 'ios' && { onTouchCancel: () => setShowPicker(false) })}
          {...(props as Partial<IOSNativeProps | AndroidNativeProps | WindowsNativeProps>)}
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
