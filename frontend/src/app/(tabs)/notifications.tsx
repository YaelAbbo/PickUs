import { Notification, getNotifications } from '@/api/notification.api';
import { UserRole } from '@/api/user';
import { PageHead } from '@/components';
import { AppBackground } from '@/components/ui';
import { useAuth } from '@/services';
import { colors } from '@/theme';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

const NOTIFICATION_ICON_SIZE = 40;

const MOCK_NOTIFICATIONS: Notification[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `mock-${i}` as Notification['id'],
  content:
    i % 2 === 0
      ? `Your ride #${100 + i} to the office has been scheduled successfully.`
      : `AI Assistant has suggested a new carpool route that saves you 15 minutes today.`,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  isDeleted: false,
  creator: {
    firstName: i % 2 === 0 ? 'Human' : 'PickUs',
    lastName: i % 2 === 0 ? `User ${i}` : 'AI',
    role: i % 2 === 0 ? UserRole.BASIC_USER : UserRole.AI,
    profileImageUrl: i % 2 === 0 ? `https://i.pravatar.cc/150?u=user${i}` : undefined,
  } as unknown as Notification['creator'],
}));

const NotificationItem = ({ item }: { item: Notification }) => {
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

export default function NotificationsScreen() {
  const { user: currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      if (!currentUser?.id) return;

      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const data = await getNotifications(currentUser.id);

        // Combine mock data with real data or just show real data
        setNotifications([...MOCK_NOTIFICATIONS, ...data]);
        setHasMore(false);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications(MOCK_NOTIFICATIONS);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentUser?.id],
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    fetchNotifications(true);
  };

  const loadMore = () => {
    if (!hasMore || isLoading) return;
  };

  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <AntDesign name='bell' size={64} color={colors.textMuted} />
      <Text style={styles.emptyText}>No notifications yet</Text>
    </View>
  );

  return (
    <AppBackground>
      <PageHead />
      <View style={styles.container}>
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => item.id + index}
          renderItem={({ item }) => <NotificationItem item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.yellow}
              colors={[colors.yellow]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
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
  loaderFooter: {
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMuted,
  },
});
