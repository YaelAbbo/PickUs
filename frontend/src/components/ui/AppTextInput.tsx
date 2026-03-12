import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@theme';
import { useEffect, useState, type ComponentProps, type FC } from 'react';
import { I18nManager, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useBoolean } from 'usehooks-ts';

export const IS_WEB = Platform.OS === 'web';

export type AppTextInputProps = Omit<ComponentProps<typeof TextInput>, 'style'> & {
  label: string;
  leftIcon?: ComponentProps<typeof Ionicons>['name'];
  isPassword?: boolean;
  error?: string;
};

export const AppTextInput: FC<AppTextInputProps> = ({
  label,
  leftIcon,
  isPassword,
  value,
  onChangeText,
  error,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const { value: showPassword, toggle: toggleShowPassword } = useBoolean(true);

  useEffect(() => {
    // ? The React Native TextInput's writing direction is always 'ltr' when secureTextEntry
    // ? is true. We want the direction to be always 'rtl', so the `showPassword` state
    // ? is initialized with true and then immediately changes to false, in order to set
    // ? the desired direction on mount.

    setTimeout(toggleShowPassword);
  }, [toggleShowPassword]);

  const hasError = !!error;

  return (
    <View>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.row, focused && styles.rowFocused, hasError && styles.rowError]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={hasError ? colors.error : focused ? colors.yellowLight : colors.textMuted}
            style={styles.rightIcon}
          />
        )}

        {isPassword && (
          <Pressable onPress={toggleShowPassword} hitSlop={10} style={styles.iconBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={hasError ? colors.error : focused ? colors.yellowLight : colors.textMuted}
            />
          </Pressable>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          selectionColor={colors.yellow}
          selectionHandleColor={colors.yellow}
          placeholderTextColor={colors.textMuted}
          textAlign='right'
          style={{ ...styles.input, ...(!IS_WEB ? { direction: 'rtl' } : {}) }}
          secureTextEntry={isPassword ? !showPassword : false}
          {...props}
        />

        {!!value && (
          <Pressable onPress={() => onChangeText?.('')} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name='close-circle' size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {hasError && <Text style={styles.helperText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.yellowLight,
    textAlign: 'right',
  },
  row: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.sm,
  },
  rowFocused: { borderColor: colors.yellow, backgroundColor: colors.inputFocusBg },
  rowError: { borderColor: colors.error, backgroundColor: colors.errorBg },
  input: {
    width: '100%',
    height: '100%',
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    flexShrink: 1,
    writingDirection: 'rtl',
  },
  rightIcon: { padding: 4 },
  iconBtn: { padding: 4 },
  helperText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.error,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
