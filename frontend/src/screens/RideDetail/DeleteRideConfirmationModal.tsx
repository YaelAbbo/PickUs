import { i18n } from '@/i18n';
import { colors, popupStyles } from '@theme';
import type { FC } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type DeleteRideConfirmationModalProps = { onDelete: VoidFunction; onClose: VoidFunction; visible: boolean };

export const DeleteRideConfirmationModal: FC<DeleteRideConfirmationModalProps> = ({ onClose, onDelete, visible }) => {
  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={popupStyles.overlay}>
        <View style={popupStyles.container}>
          <Text style={popupStyles.title}>{i18n.ride_detail.delete_ride_title}</Text>

          <Text style={styles.message}>{i18n.ride_detail.delete_ride_message}</Text>

          <View style={popupStyles.actions}>
            <TouchableOpacity style={[popupStyles.button, popupStyles.cancelBtn]} onPress={onClose}>
              <Text style={popupStyles.cancelText}>{i18n.general.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[popupStyles.button, styles.deleteBtn]} onPress={onDelete}>
              <Text style={styles.deleteText}>{i18n.general.delete}</Text>
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
