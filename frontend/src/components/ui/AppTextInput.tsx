import { IS_WEB } from '@constants';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '@theme';
import type { ComponentProps, FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { useBoolean } from 'usehooks-ts';

export type AppTextInputProps = Omit<ComponentProps<typeof TextInput>, 'style' | 'error'> & {
  label?: string;
  rightIconName?: ComponentProps<typeof Ionicons>['name'];
  isPassword?: boolean;
  isError?: boolean;
  helperText?: string;
};

export const AppTextInput: FC<AppTextInputProps> = ({
  label,
  rightIconName,
  isPassword,
  value,
  onChangeText,
  isError,
  helperText,
  ...props
}) => {
  const { value: showPassword, toggle: toggleShowPassword } = useBoolean();

  const getColor = (focused: boolean) => (isError ? colors.error : focused ? colors.yellowLight : colors.textMuted);

  const clearIcon = value ? (
    <TextInput.Icon
      icon={({ size }) => <Ionicons {...{ name: 'close-circle', size, color: colors.textMuted }} />}
      onPress={() => onChangeText?.('')}
    />
  ) : undefined;

  const startIcon = isPassword ? (
    <TextInput.Icon
      icon={({ size, color }) => (
        <Ionicons {...{ name: showPassword ? 'eye-off-outline' : 'eye-outline', size, color }} />
      )}
      color={getColor}
      onPress={toggleShowPassword}
    />
  ) : rightIconName ? (
    <TextInput.Icon
      icon={({ size, color }) => <Ionicons {...{ name: rightIconName, size, color }} />}
      color={getColor}
    />
  ) : undefined;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: isError ? colors.error : colors.yellowLight }]}>{label}</Text>}

      <TextInput
        mode='outlined'
        label=''
        value={value}
        onChangeText={onChangeText}
        error={isError}
        secureTextEntry={isPassword && !showPassword}
        textAlign={isPassword && !showPassword ? 'left' : 'right'}
        contentStyle={[styles.content, isPassword && !showPassword && { writingDirection: 'ltr', textAlign: 'left' }]}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.yellow}
        selectionHandleColor={colors.yellow}
        right={IS_WEB ? startIcon : clearIcon}
        left={IS_WEB ? clearIcon : startIcon}
        style={styles.input}
        theme={{
          roundness: radii.md,
          colors: {
            primary: colors.yellow,
            error: colors.error,
            onSurfaceVariant: 'transparent',
            outline: colors.inputBorder,
          },
          fonts: {
            bodyLarge: { fontFamily: typography.fonts.regular },
          },
        }}
        {...props}
      />

      {!!helperText && (
        <HelperText
          type={isError ? 'error' : 'info'}
          style={[styles.helperText, { color: isError ? colors.error : colors.textMuted }]}
        >
          {helperText}
        </HelperText>
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
    textAlign: 'right',
    alignSelf: IS_WEB ? 'auto' : 'flex-start',
  },
  input: {
    backgroundColor: colors.inputBg,
    height: 56,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  content: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  helperText: {
    textAlign: 'right',
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignSelf: IS_WEB ? 'auto' : 'flex-start',
  },
});
