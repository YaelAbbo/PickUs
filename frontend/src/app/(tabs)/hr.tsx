import Toast from '@/components/common/Toast';
import ConfirmationPopup from '@/components/hr/ConfirmationPopup';
import EmployeeTable from '@/components/hr/EmployeeTable';
import HRActionsPopup from '@/components/hr/HRActionsPopup';
import UserActions from '@/components/hr/UserActions';
import { AppBackground } from '@/components/ui/AppBackground';
import { useHRLogic } from '@/hooks/hr/useHRLogic';
import { i18n } from '@/i18n';
import { colors } from '@theme';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HRPage() {
  const {
    users,
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
  } = useHRLogic();

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

      <ConfirmationPopup
        visible={deleteDialogVisible}
        title={i18n.hr_popup.delete_confirm_title}
        message={
          selectedUser
            ? i18n.hr_popup.delete_confirm_message.replace(
                '{name}',
                `${selectedUser.firstName} ${selectedUser.lastName}`
              )
            : ''
        }
        confirmText={i18n.hr_actions.delete_user}
        cancelText={i18n.hr_popup.cancel}

        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleConfirmDelete}
      />


      <View style={{ flex: 1 }}>
        <FlatList
          data={[null]}
          keyExtractor={(_, index) => index.toString()}
          renderItem={null}
          ListHeaderComponent={
            <>
              <UserActions
                onCreate={handleCreateUser}
                onEdit={handleUpdateMode}
                onDelete={handleDeleteMode}
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
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size='small' color={colors.yellow} />
                <Text style={styles.loaderText}>{i18n.hr_table.load_more}</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.scrollContent}
        />

        {isLoading && users.length === 0 && (
          <View style={[StyleSheet.absoluteFill, styles.loaderOverlay]}>
            <ActivityIndicator size='large' color={colors.yellow} />
          </View>
        )}
      </View>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
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
    textAlign: 'center',
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
  loaderOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 100,
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
    flexDirection: 'row',
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
