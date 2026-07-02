import { NotificationItem, PageHead } from '@/components';
import Toast from '@/components/common/Toast';
import { AppBackground } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { i18n } from '@/i18n';
import { RideIrrelevantReason } from '@/schemas/ride';
import { useAuth } from '@/services';
import { useNotifications } from '@/services/notification';
import { colors } from '@/theme';
import { AntDesign } from '@expo/vector-icons';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

const getRideIrrelevantMessage = (reason: RideIrrelevantReason): string => {
  switch (reason) {
    case RideIrrelevantReason.RIDE_CANCELLED:
      return i18n.notifications.ride_cancelled;
    case RideIrrelevantReason.RIDE_COMPLETED:
      return i18n.notifications.ride_completed;
    case RideIrrelevantReason.RIDE_TIME_PASSED:
      return i18n.notifications.ride_time_passed;
    case RideIrrelevantReason.RIDE_FULL:
      return i18n.notifications.ride_full;
    case RideIrrelevantReason.RIDE_NOT_FOUND:
      return i18n.notifications.ride_not_found;
    case RideIrrelevantReason.RIDE_ACTIVE:
      return i18n.notifications.ride_active;
    default:
      return i18n.notifications.ride_unavailable;
  }
};

export default function NotificationsScreen() {
  const { user: currentUser } = useAuth();
  const { data, isLoading, isRefetching, refetch } = useNotifications(currentUser?.id);
  const { toast, showToast, hideToast } = useToast();

  const notifications = data || [];

  const onRefresh = () => {
    refetch();
  };

  const handleRideIrrelevant = useCallback(
    (reason: RideIrrelevantReason) => {
      const message = getRideIrrelevantMessage(reason);
      showToast(message, 'error');
    },
    [showToast],
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <AntDesign name='bell' size={64} color={colors.textMuted} />
      <Text style={styles.emptyText}>{i18n.notifications.empty_text}</Text>
    </View>
  );

  return (
    <AppBackground>
      <PageHead />
      <View style={styles.container}>
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => item.id + index}
          renderItem={({ item }) => <NotificationItem item={item} onRideIrrelevant={handleRideIrrelevant} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={colors.yellow}
              colors={[colors.yellow]}
            />
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          contentContainerStyle={styles.listContent}
        />
      </View>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
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
    textAlign: 'center',
  },
});
