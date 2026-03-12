import { colors, radii, spacing, typography } from '@theme';
import type { WithStyle } from '@types';
import type { ComponentProps, FC } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export type AppButtonProps = WithStyle<ComponentProps<typeof Pressable>> & { label: string; isLoading?: boolean };

export const AppButton: FC<AppButtonProps> = ({ label, isLoading, disabled, onPress, style, ...props }) => {
  const isDisabled = isLoading || disabled;

  return (
    <View style={{ display: 'flex', alignItems: 'center' }}>
      <Pressable
        {...props}
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.button,
          pressed && !disabled && styles.buttonPressed,
          isLoading && styles.buttonLoading,
          isDisabled && styles.buttonDisabled,
          style,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.textDark} size='small' />
        ) : (
          <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.yellow,
    borderRadius: radii.md,
    paddingVertical: spacing.xs + 4,
    paddingHorizontal: spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.yellowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    fontSize: typography.sizes.sm,
  },
  buttonPressed: {
    backgroundColor: colors.yellowDark,
    transform: [{ scale: 0.97 }],
  },
  buttonLoading: { opacity: 0.8 },
  buttonDisabled: {
    backgroundColor: colors.inputBg,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.lg + 2,
    color: colors.textDark,
    letterSpacing: 0.5,
  },
  labelDisabled: {
    color: colors.textMuted,
  },
});
