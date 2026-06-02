import type { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from 'react-native-paper';

import { i18n } from '@/i18n';
import { colors, spacing } from '@/theme';

type RideDriverSectionProps = {
  name: string;
  initials: string;
  isDriver?: boolean;
};

export const RideDriverSection: FC<RideDriverSectionProps> = ({ name, initials, isDriver }) => (
  <View style={styles.peopleSection}>
    {isDriver ? <Text style={styles.sectionTitle}>{i18n.general.driver}</Text> : null}
    <View style={styles.personRow}>
      <Avatar.Text
        size={44}
        label={initials}
        style={{ backgroundColor: colors.yellow }}
        labelStyle={{ color: colors.textDark }}
      />
      <Text style={styles.personName}>{name}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  peopleSection: { paddingHorizontal: 8, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, textAlign: 'right', color: colors.textMuted },
  personRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  personName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
});
