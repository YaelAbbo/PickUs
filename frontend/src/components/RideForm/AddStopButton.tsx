import { i18n } from '@/i18n';
import { AppButton } from '@components';
import { IS_WEB } from '@constants';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@theme';
import type { FC } from 'react';

export type AddStopButtonProps = {
  onPress: () => void;
};

export const AddStopButton: FC<AddStopButtonProps> = ({ onPress }) => (
  <AppButton
    label={i18n.rideForm.another_ride_stop}
    onPress={onPress}
    icon={({ size }) => <Ionicons name='add-circle-outline' size={size} color={colors.yellow} />}
    style={{
      alignSelf: 'flex-start',
      borderRadius: radii.full,
      backgroundColor: 'rgba(245,200,66,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(245,200,66,0.25)',
      marginTop: spacing.xs,
    }}
    contentStyle={{
      paddingVertical: 0,
      paddingHorizontal: IS_WEB ? spacing.sm : spacing.xs,
      height: 32,
    }}
    labelStyle={{
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.sm,
      color: colors.yellow,
      height: '100%',
      textAlignVertical: 'center',
    }}
  />
);
