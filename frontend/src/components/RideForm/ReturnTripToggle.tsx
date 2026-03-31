import { i18n } from '@/i18n';
import { IS_WEB } from '@constants';
import { colors, spacing, typography } from '@theme';
import type { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Switch } from 'react-native-paper';

export type ReturnTripToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export const ReturnTripToggle: FC<ReturnTripToggleProps> = ({ value, onChange }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{i18n.rideForm.return_trip}</Text>

    <Switch value={value} onValueChange={onChange} color={colors.yellow} />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: IS_WEB ? spacing.sm : spacing.xs,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: IS_WEB ? typography.sizes.md : typography.sizes.md,
    color: colors.textLight,
  },
});
