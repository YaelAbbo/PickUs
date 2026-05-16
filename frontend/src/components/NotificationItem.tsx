import type { Notification } from '@/api/notification.api';
import { UserRole } from '@/api/user';
import { colors } from '@/theme';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

const NOTIFICATION_ICON_SIZE = 40;

export const NotificationItem = ({ item }: { item: Notification }) => {
  const isAI = item.creator.role === UserRole.AI;

  return (
    <View style={styles.notificationCard}>
      <View style={styles.avatarContainer}>
        {item.creator.profileImageUrl ? (
          <Image source={{ uri: item.creator.profileImageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar, isAI && styles.aiAvatarBackground]}>
            {isAI ? (
              <MaterialIcons name='auto-awesome' size={24} color={colors.yellow} />
            ) : (
              <AntDesign name='user' size={24} color={colors.textMuted} />
            )}
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.creatorName}>
            {item.creator.firstName} {item.creator.lastName}
          </Text>
          <Text style={styles.dateText}>{format(new Date(item.createdAt), 'MMM d, HH:mm')}</Text>
        </View>
        <Text style={styles.contentText}>{item.content}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.purpleCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: NOTIFICATION_ICON_SIZE,
    height: NOTIFICATION_ICON_SIZE,
    borderRadius: NOTIFICATION_ICON_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  aiAvatarBackground: {
    backgroundColor: 'rgba(245, 200, 66, 0.15)',
    borderColor: 'rgba(245, 200, 66, 0.3)',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  contentText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
});
