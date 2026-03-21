import { createUser, deleteUser, fetchUsers, updateUser, User } from '@/api/user.api';
import Toast from '@/components/common/Toast';
import EmployeeTable from '@/components/hr/EmployeeTable';
import HRActionsPopup, { PopupMode } from '@/components/hr/HRActionsPopup';
import DeleteConfirmationPopup from '@/components/hr/DeleteConfirmationPopup';
import UserActions from '@/components/hr/UserActions';
import { AppBackground } from '@/components/ui/AppBackground';
import { i18n } from '@/i18n';
import { useAuth } from '@services';
import { colors } from '@theme';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as XLSX from 'xlsx';

export default function HRPage() {
  const queryClient = useQueryClient();

  const [activeQuery, setActiveQuery] = useState('');
  const { user } = useAuth();
  const orgId = user?.orgId;

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMode, setPopupMode] = useState<PopupMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
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
    queryFn: ({ pageParam = 1 }) => fetchUsers(orgId!, pageParam, activeQuery),
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
      setDeleteDialogVisible(false);
      setSelectedUser(null);
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

  const handleUserTap = (selectedUserItem: User) => {
    if (actionMode === 'edit') {
      setSelectedUser(selectedUserItem);
      setPopupMode('update');
      setPopupVisible(true);
      setActionMode('idle');
    } else if (actionMode === 'delete') {
      if (selectedUserItem.id === user?.id) {
        showToast(i18n.hr_popup.cannot_delete_self, 'error');
        return;
      }
      setSelectedUser(selectedUserItem);
      setDeleteDialogVisible(true);
    }
  };

  const handlePopupSubmit = (formData: any) => {
    if (popupMode === 'create') {
      createMutation.mutate({
        ...formData,
        organizationId: orgId!,
      });
    } else if (popupMode === 'update' && selectedUser) {
      updateMutation.mutate({
        id: selectedUser.id,
        ...formData,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const handleExport = async () => {
    if (users.length === 0) {
      showToast(i18n.hr_popup.error, 'error');
      return;
    }

    try {
      const exportData = users.map((u) => ({
        [i18n.hr_table.first_name]: u.firstName,
        [i18n.hr_table.last_name]: u.lastName,
        [i18n.hr_table.role]: (i18n.roles as any)[u.role] || u.role,
        [i18n.hr_table.org_id]: u.orgId,
        [i18n.hr_table.created_at]: new Date(u.createdAt).toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, i18n.hr_table.title);

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const file = new File(Paths.cache, `pickus_employees_${Date.now()}.xlsx`);

      file.write(wbout, { encoding: 'base64' });

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: i18n.hr_actions.export_to_excel,
        UTI: 'com.microsoft.excel.xlsx',
      });
    } catch (err) {
      console.error('Export error:', err);
      showToast(i18n.hr_popup.error, 'error');
    }
  };

  if (isError) {
    return (
      <AppBackground>
        <View style={styles.center}>
          <Text style={styles.errorText}>Error: {(error as Error).message}</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
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

      <DeleteConfirmationPopup
        visible={deleteDialogVisible}
        userName={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleConfirmDelete}
      />

      {isLoading && users.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color={colors.yellow} />
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
                hasUsers={users.length > 0}
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
                <ActivityIndicator size='small' color={colors.yellow} />
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
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
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
    color: colors.error,
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
    color: colors.textLight,
    marginRight: 8,
  },
  modeIndicator: {
    backgroundColor: colors.yellow,
    padding: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  modeText: {
    color: colors.textDark,
    fontWeight: '700',
    fontSize: 14,
  },
  cancelModeText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
  },
});
