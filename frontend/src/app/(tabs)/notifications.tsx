import { NotificationItem, PageHead } from '@/components';
import { AppBackground } from '@/components/ui';
import { i18n } from '@/i18n';
import { useAuth } from '@/services';
import { useNotifications } from '@/services/notification';
import { colors } from '@/theme';
import { AntDesign } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

export default function NotificationsScreen() {
  const { user: currentUser } = useAuth();
  const { data, isLoading, isRefetching, refetch } = useNotifications(currentUser?.id);

  const notifications = data || [];

  const onRefresh = () => {
    refetch();
  };

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
          renderItem={({ item }) => <NotificationItem item={item} />}
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
