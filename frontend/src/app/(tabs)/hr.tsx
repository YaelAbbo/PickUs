import { createUser, deleteUser, fetchUsers, updateUser, User } from '@/api/user.api';
import Toast from '@/components/common/Toast';
import EmployeeTable from '@/components/hr/EmployeeTable';
import HRActionsPopup, { PopupMode } from '@/components/hr/HRActionsPopup';
import UserActions from '@/components/hr/UserActions';
import { i18n } from '@/i18n';
import { useAuth } from '@services';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HRPage() {
  const queryClient = useQueryClient();

  const [activeQuery, setActiveQuery] = useState('');
  const {user} = useAuth();
  const orgId = user?.organizationId;
  
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMode, setPopupMode] = useState<PopupMode>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionMode, setActionMode] = useState<'idle' | 'edit' | 'delete'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') =>
    setToast({ message, type, visible: true });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    enabled: !!orgId,
    queryKey: ['users', activeQuery, orgId],
    queryFn: ({ pageParam = 1 }) => fetchUsers(orgId, pageParam, activeQuery),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const users = data?.pages.flatMap((page) => page.data) || [];

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast(i18n.hr_popup.delete_success, 'success');
      setActionMode('idle');
    },
    onError: (err) => {
      console.error('Delete error:', err);
      showToast(i18n.hr_popup.error, 'error');
    },
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast(i18n.hr_popup.create_success, 'success');
    },
    onError: (err) => {
      console.error('Create error:', err);
      showToast(i18n.hr_popup.error, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast(i18n.hr_popup.update_success, 'success');
    },
    onError: (err) => {
      console.error('Update error:', err);
      showToast(i18n.hr_popup.error, 'error');
    },
  });

  const handleApplySearch = (text: string) => {
    if (text !== activeQuery) {
      setActiveQuery(text);
      if (text.length >= 3 || text.length === 0) {
        Keyboard.dismiss();
      }
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleDeleteUser = () => {
    setActionMode((prev) => (prev === 'delete' ? 'idle' : 'delete'));
  };

  const handleCreateUser = () => {
    setActionMode('idle');
    setPopupMode('create');
    setSelectedUser(null);
    setPopupVisible(true);
  };

  const handleUpdateUser = () => {
    setActionMode((prev) => (prev === 'edit' ? 'idle' : 'edit'));
  };

  const handleUserTap = (user: User) => {
    if (actionMode === 'edit') {
      setSelectedUser(user);
      setPopupMode('update');
      setPopupVisible(true);
      setActionMode('idle');
    } else if (actionMode === 'delete') {
      deleteMutation.mutate(user.id);
    }
  };

  const handlePopupSubmit = (formData: any) => {
    if (popupMode === 'create') {
      createMutation.mutate({
        ...formData,
        organizationId: orgId,
      });
    } else if (popupMode === 'update' && selectedUser) {
      updateMutation.mutate({
        id: selectedUser.id,
        ...formData,
      });
    }
  };

  const handleExport = () => {
    alert('Export to Excel not implemented yet');
  };

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {(error as Error).message}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{i18n.hr_dashboard.title}</Text>
      </View>

      {actionMode !== 'idle' && (
        <View style={styles.modeIndicator}>
          <Text style={styles.modeText}>
            {actionMode === 'edit' ? i18n.hr_actions.select_to_edit : i18n.hr_actions.select_to_delete}
          </Text>
          <TouchableOpacity onPress={() => setActionMode('idle')} activeOpacity={0.7}>
            <Text style={styles.cancelModeText}>{i18n.hr_popup.cancel}</Text>
          </TouchableOpacity>
        </View>
      )}

      <HRActionsPopup
        visible={popupVisible}
        mode={popupMode}
        initialData={selectedUser}
        onClose={() => setPopupVisible(false)}
        onSubmit={handlePopupSubmit}
      />

      {isLoading && users.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color='#4F46E5' />
        </View>
      ) : (
        <FlatList
          data={[null]}
          keyExtractor={(_, index) => index.toString()}
          renderItem={null}
          ListHeaderComponent={() => (
            <>
              <UserActions
                onCreate={handleCreateUser}
                onEdit={handleUpdateUser}
                onDelete={handleDeleteUser}
                onExport={handleExport}
              />
              <EmployeeTable
                users={users}
                onSearch={handleApplySearch}
                actionMode={actionMode}
                onUserTap={handleUserTap}
              />
            </>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size='small' color='#4F46E5' />
                <Text style={styles.loaderText}>{i18n.hr_table.load_more}</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.scrollContent}
        />
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F3F4', // Google Material light background
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Material light divider
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '400', // Google Material regular weight for headers
    color: '#1F1F1F',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  loaderContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loaderText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  modeIndicator: {
    backgroundColor: '#FFFFFF', // Clean white background
    padding: 16,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAED', // Google Light Gray Border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modeText: {
    color: '#202124', // Google Dark Gray
    fontWeight: '500',
    fontSize: 16,
  },
  cancelModeText: {
    color: '#D93025', // Google Red for Cancel
    fontWeight: '600',
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
});
