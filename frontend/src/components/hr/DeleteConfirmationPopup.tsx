import { i18n } from '@/i18n';
import { colors } from '@theme';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DeleteConfirmationPopupProps {
  visible: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationPopup: React.FC<DeleteConfirmationPopupProps> = ({
  visible,
  userName,
  onClose,
  onConfirm,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{i18n.hr_popup.delete_confirm_title}</Text>
          <Text style={styles.message}>
            {i18n.hr_popup.delete_confirm_message.replace('{name}', userName)}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>{i18n.hr_popup.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.deleteBtn]} onPress={onConfirm}>
              <Text style={styles.deleteText}>{i18n.hr_actions.delete_user}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: colors.purpleDark,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 48,
    elevation: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'right',
    color: colors.textPrimary,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  deleteBtn: {
    backgroundColor: colors.error,
  },
  cancelText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default DeleteConfirmationPopup;
