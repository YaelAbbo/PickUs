import { AppButton, type AppButtonProps } from '@components';
import { colors } from '@theme';
import type { FC } from 'react';

export type RideActionButtonProps = Pick<AppButtonProps, 'label' | 'onPress' | 'iconName'>;

export const RideActionButton: FC<RideActionButtonProps> = (appButtonProps) => {
  return (
    <AppButton
      style={{ flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder }}
      iconColor={colors.yellow}
      labelStyle={{ color: colors.white }}
      {...appButtonProps}
    />
  );
};
