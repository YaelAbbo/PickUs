import { User } from '@/api/user';
import { fetchUsers, getErrorMessage, useCreateUser, useDeleteUser, useUpdateUser } from '@/api/user.api';

import { PopupMode } from '@/components/hr/HRActionsPopup';
import { useToast } from '@/hooks/useToast';
import { i18n } from '@/i18n';
import { exportEmployeesToExcel } from '@/utils/hr/export';
import { useAuthContext } from '@services';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Keyboard } from 'react-native';

export type ActionMode = 'idle' | 'edit' | 'delete';

export const useHRLogic = () => {
  const { user } = useAuthContext();
  const orgId = user?.orgId;
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [popupMode, setPopupMode] = useState<PopupMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState<boolean>(false);
  const [actionMode, setActionMode] = useState<ActionMode>('idle');

  const { toast, showToast, hideToast } = useToast();

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

  const deleteMutation = useDeleteUser({
    onSuccess: () => {
      showToast(i18n.hr_popup.delete_success, 'success');
      setActionMode('idle');
      setDeleteDialogVisible(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error');
    },
  });

  const createMutation = useCreateUser({
    onSuccess: () => {
      showToast(i18n.hr_popup.create_success, 'success');
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error');
    },
  });

  const updateMutation = useUpdateUser({
    onSuccess: () => {
      showToast(i18n.hr_popup.update_success, 'success');
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error');
    },
  });

  const handleApplySearch = (text: string) => {
    if (text !== activeQuery) {
      setActiveQuery(text);
      Keyboard.dismiss();
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
      const { nationalId, ...updateData } = formData;
      updateMutation.mutate({
        id: selectedUser.id,
        ...updateData,
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
