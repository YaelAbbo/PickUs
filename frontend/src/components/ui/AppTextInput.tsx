import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '@theme';
import type { ComponentProps, FC } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { useBoolean } from 'usehooks-ts';

export const IS_WEB = Platform.OS === 'web';

export type AppTextInputProps = Omit<ComponentProps<typeof TextInput>, 'style' | 'error'> & {
  label: string;
  rightIconName?: ComponentProps<typeof Ionicons>['name'];
  isPassword?: boolean;
  error?: string;
};

export const AppTextInput: FC<AppTextInputProps> = ({
  label,
  rightIconName,
  isPassword,
  value,
  onChangeText,
  error,
  ...props
}) => {
  const { value: showPassword, toggle: toggleShowPassword } = useBoolean();

  const hasError = !!error;

  const iconColor = (focused: boolean) => (hasError ? colors.error : focused ? colors.yellowLight : colors.textMuted);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        mode='outlined'
        label=''
        value={value}
        onChangeText={onChangeText}
        error={hasError}
        secureTextEntry={isPassword && !showPassword}
        textAlign={isPassword && !showPassword ? 'left' : 'right'}
        contentStyle={[styles.content, isPassword && !showPassword && { writingDirection: 'ltr', textAlign: 'left' }]}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.yellow}
        selectionHandleColor={colors.yellow}
        right={
          value ? (
            <TextInput.Icon
              icon={({ size }) => <Ionicons {...{ name: 'close-circle', size, color: colors.textMuted }} />}
              onPress={() => onChangeText?.('')}
            />
          ) : undefined
        }
        left={
          isPassword ? (
            <TextInput.Icon
              icon={({ size, color }) => (
                <Ionicons {...{ name: showPassword ? 'eye-off-outline' : 'eye-outline', size, color }} />
              )}
              color={iconColor}
              onPress={toggleShowPassword}
            />
          ) : rightIconName ? (
            <TextInput.Icon
              icon={({ size, color }) => <Ionicons {...{ name: rightIconName, size, color }} />}
              color={iconColor}
            />
          ) : undefined
        }
        style={styles.input}
        theme={{
          colors: {
            primary: colors.yellow,
            error: colors.error,
            onSurfaceVariant: 'transparent',
            outline: colors.inputBorder,
          },
          roundness: radii.md,
          fonts: {
            bodyLarge: { fontFamily: typography.fonts.regular },
          },
        }}
        {...props}
      />

      <HelperText type='error' visible={hasError} style={styles.helperText}>
        {error}
      </HelperText>
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
    textAlign: 'right',
    alignSelf: 'flex-start',
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
    color: colors.error,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
  },
});
