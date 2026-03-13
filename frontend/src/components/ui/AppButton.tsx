import { colors, radii, spacing, typography } from '@theme';
import type { WithStyle } from '@types';
import type { ComponentProps, FC } from 'react';
import { Button } from 'react-native-paper';

export type AppButtonProps = WithStyle<Omit<ComponentProps<typeof Button>, 'children'>> & { label: string };

export const AppButton: FC<AppButtonProps> = ({ label, disabled, style, contentStyle, labelStyle, ...props }) => {
  const isDisabled = props.loading || disabled;

  return (
    <Button
      mode='contained'
      disabled={isDisabled}
      style={[{ borderRadius: radii.md, backgroundColor: isDisabled ? colors.inputBg : colors.yellow }, style]}
      contentStyle={[{ paddingVertical: spacing.xs, paddingHorizontal: spacing.sm }, contentStyle]}
      labelStyle={[
        {
          fontFamily: typography.fonts.medium,
          fontSize: typography.sizes.lg + 2,
          color: isDisabled ? colors.textMuted : colors.textDark,
          letterSpacing: 0.5,
        },
        labelStyle,
      ]}
      {...props}
    >
      {label}
    </Button>
  );
};
