import type { Notification } from '@/api/notification.api';
import { RideIrrelevantReason } from '@/api/notification.types';
import { UserRole } from '@/api/user';
import { i18n } from '@/i18n';
import { rideService } from '@/services/ride/rideService';
import { colors } from '@/theme';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NOTIFICATION_ICON_SIZE = 40;

type NotificationItemProps = {
  item: Notification;
  onRideIrrelevant?: (reason: RideIrrelevantReason) => void;
};

export const NotificationItem = ({ item, onRideIrrelevant }: NotificationItemProps) => {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);

  const isAI = item.creator.role === UserRole.AI;
  const hasRide = !!item.ride?.id;
  const isClickable = isAI && hasRide;

  const handlePress = async () => {
    if (!isClickable || !item.ride?.id) return;

    setIsValidating(true);
    try {
      const result = await rideService.validateRideRelevance(item.ride.id);

      if (result.isRelevant) {
        router.push({
          pathname: '/rideDetailModal',
          params: { rideId: item.ride.id },
        });
      } else if (result.reason && Object.values(RideIrrelevantReason).includes(result.reason as RideIrrelevantReason)) {
        onRideIrrelevant?.(result.reason as RideIrrelevantReason);
      }
    } catch {
      // Validation errors are handled silently
    } finally {
      setIsValidating(false);
    }
  };

  const CardWrapper = isClickable ? TouchableOpacity : View;
  const cardWrapperProps = isClickable ? { onPress: handlePress, activeOpacity: 0.7, disabled: isValidating } : {};

  return (
    <CardWrapper style={[styles.notificationCard, isClickable && styles.clickableCard]} {...cardWrapperProps}>
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

        {isClickable && (
          <View style={styles.actionRow}>
            {isValidating ? (
              <ActivityIndicator size='small' color={colors.yellow} />
            ) : (
              <>
                <Text style={styles.viewRideText}>{i18n.notifications.view_ride}</Text>
                <AntDesign name='arrow-left' size={14} color={colors.yellow} />
              </>
            )}
          </View>
        )}
      </View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  notificationCard: {
    flexDirection: 'row-reverse',
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
  clickableCard: {
    borderWidth: 1,
    borderColor: 'rgba(245, 200, 66, 0.2)',
  },
  avatarContainer: {
    position: 'relative',
    marginLeft: 12,
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
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'right',
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'left',
  },
  contentText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  viewRideText: {
    fontSize: 13,
    color: colors.yellow,
    fontWeight: '600',
  },
});
