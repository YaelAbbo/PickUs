import { i18n } from '@/i18n';
import { colors, spacing } from '@/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface User {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  nationalId?: string;
  role?: string;
}

interface ProfileCardProps {
  user: User;
}

export const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </Text>
      </View>
      <Text style={styles.userName}>{user.fullName}</Text>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name='email-outline' size={20} color={colors.textMuted} />
          <Text style={styles.detailText}>{user.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name='phone' size={20} color={colors.textMuted} />
          <Text style={styles.detailText}>{user.phoneNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name='card-account-details-outline' size={20} color={colors.textMuted} />
          <Text style={styles.detailText}>{user.nationalId}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name='shield-account-outline' size={20} color={colors.textMuted} />
          <Text style={styles.detailText}>
            {user.role ? i18n.roles[user.role as keyof typeof i18n.roles] || user.role : ''}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: colors.inputBg,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.yellow,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  detailText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '500',
  },
});
