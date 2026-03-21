import { createUser, deleteUser, fetchUsers, updateUser, User } from '@/api/user.api';
import { i18n } from '@/i18n';
import { useAuth } from '@services';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Keyboard } from 'react-native';
import { PopupMode } from '@/components/hr/HRActionsPopup';
import { exportEmployeesToExcel } from '@/utils/hr/export';

export const useHRLogic = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.orgId;

  const [activeQuery, setActiveQuery] = useState('');
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

  const hideToast = () => setToast((prev) => ({ ...prev, visible: false }));

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

  const handleDeleteMode = () => {
    setActionMode((prev) => (prev === 'delete' ? 'idle' : 'delete'));
  };

  const handleCreateUser = () => {
    setActionMode('idle');
    setPopupMode('create');
    setSelectedUser(null);
    setPopupVisible(true);
  };

  const handleUpdateMode = () => {
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
    try {
      await exportEmployeesToExcel(users);
    } catch (err) {
      showToast(i18n.hr_popup.error, 'error');
    }
  };

  return {
    users,
    activeQuery,
    popupVisible,
    popupMode,
    selectedUser,
    deleteDialogVisible,
    actionMode,
    toast,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    setPopupVisible,
    setDeleteDialogVisible,
    setActionMode,
    handleApplySearch,
    handleLoadMore,
    handleDeleteMode,
    handleCreateUser,
    handleUpdateMode,
    handleUserTap,
    handlePopupSubmit,
    handleConfirmDelete,
    handleExport,
    hideToast,
  };
};
