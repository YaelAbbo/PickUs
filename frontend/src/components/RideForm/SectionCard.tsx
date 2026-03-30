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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
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
