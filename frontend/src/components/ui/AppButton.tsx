import { Ionicons } from '@expo/vector-icons';
import { IS_MOBILE } from '@constants';
import { rtlRow } from '@/utils/rtl';
import { colors, radii, spacing, typography } from '@theme';
import type { WithStyle } from '@types';
import type { ComponentProps, FC } from 'react';
import { Button } from 'react-native-paper';

export type AppButtonProps = WithStyle<Omit<ComponentProps<typeof Button>, 'children'>> & {
  label: string;
  iconName?: ComponentProps<typeof Ionicons>['name'];
  iconColor?: ComponentProps<typeof Ionicons>['color'];
};

export const AppButton: FC<AppButtonProps> = ({
  label,
  disabled,
  style,
  contentStyle,
  labelStyle,
  iconName,
  iconColor = colors.purple,
  ...props
}) => {
  const isDisabled = props.loading || disabled;

  return (
    <Button
      mode='contained'
      disabled={isDisabled}
      style={[{ borderRadius: radii.md, backgroundColor: isDisabled ? colors.inputBg : colors.yellow }, style]}
      icon={({ size }) => <Ionicons name={iconName} size={size} color={iconColor} />}
      contentStyle={[
        {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          flexDirection: rtlRow,
          justifyContent: 'center',
          alignItems: 'center',
        },
        contentStyle,
      ]}
      labelStyle={[
        {
          fontFamily: typography.fonts.medium,
          fontSize: typography.sizes.lg + 2,
          color: isDisabled ? colors.textMuted : colors.textDark,
          letterSpacing: 0.5,
          textAlign: 'center',
          textAlignVertical: 'center',
          includeFontPadding: false,
          paddingTop: IS_MOBILE ? 4 : 2,
        },
        labelStyle,
      ]}
      {...props}
    >
      {label}
    </Button>
  );
};
