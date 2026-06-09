import { AppButton, type AppButtonProps } from '@components';
import { colors } from '@theme';
import type { FC } from 'react';

export type RideActionButtonProps = Pick<AppButtonProps, 'label' | 'onPress' | 'iconName' | 'disabled'>;

export const RideActionButton: FC<RideActionButtonProps> = (appButtonProps) => {
  const { disabled } = appButtonProps;
  return (
    <AppButton
      style={{
        flex: 1,
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        opacity: 1,
      }}
      iconColor={disabled ? colors.textMuted : colors.yellow}
      labelStyle={{ color: disabled ? colors.textMuted : colors.white }}
      {...appButtonProps}
    />
  );
};
