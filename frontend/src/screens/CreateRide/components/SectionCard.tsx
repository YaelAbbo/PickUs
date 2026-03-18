import { IS_WEB } from '@constants';
import { colors, radii, spacing, typography } from '@theme';
import type { FC, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Divider } from 'react-native-paper';

export type SectionCardProps = {
  title: string;
  children: ReactNode;
  style?: object;
};

export const SectionCard: FC<SectionCardProps> = ({ title, children, style }) => (
  <View style={[styles.card, style]}>
    <Text style={styles.title}>{title}</Text>

    <Divider style={styles.divider} />

    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.inputBg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: IS_WEB ? spacing.lg : spacing.md,
    paddingTop: IS_WEB ? spacing.md : spacing.sm,
    paddingBottom: IS_WEB ? spacing.lg : spacing.md,
    marginBottom: IS_WEB ? spacing.lg : spacing.md,
    gap: IS_WEB ? spacing.md : spacing.xs,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.md,
    color: colors.yellowLight,
    letterSpacing: 0.5,
  },
  divider: {
    backgroundColor: colors.inputBorder,
    marginBottom: spacing.xs,
  },
});
