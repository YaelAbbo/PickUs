import { colors, popupStyles } from '@theme';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmationPopupProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmBtnStyle?: any;
  confirmTextStyle?: any;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onClose,
  onConfirm,
  confirmBtnStyle,
  confirmTextStyle,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={popupStyles.overlay}>
        <View style={popupStyles.container}>
          <Text style={popupStyles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={popupStyles.actions}>
            <TouchableOpacity style={[popupStyles.button, popupStyles.cancelBtn]} onPress={onClose}>
              <Text style={popupStyles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[popupStyles.button, confirmBtnStyle || styles.deleteBtn]}
              onPress={onConfirm}
            >
              <Text style={confirmTextStyle || styles.deleteText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: 32,
  },
  deleteBtn: {
    backgroundColor: colors.error,
  },
  deleteText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default ConfirmationPopup;

