import { i18n } from '@/i18n';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, popupStyles } from '@theme';
import { Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PassengersPopupProps {
  visible: boolean;
  onClose: () => void;
  passengers: Array<{
    id: string;
    user?: {
      fullName?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    };
  }>;
}

export const PassengersPopup = ({ visible, onClose, passengers }: PassengersPopupProps) => {
  const handleCall = (phoneNumber?: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch((err) => console.error('Failed to open dialer', err));
    }
  };

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={popupStyles.overlay}>
        <View style={popupStyles.container}>
          <Text style={popupStyles.title}>{i18n.ride_detail.passengers_list}</Text>

          <ScrollView style={styles.passengersList} contentContainerStyle={{ paddingBottom: 8 }}>
            {passengers.length > 0 ? (
              passengers.map((passenger, index) => (
                <TouchableOpacity
                  key={passenger.id || index}
                  style={styles.passengerRow}
                  onPress={() => handleCall(passenger.user?.phoneNumber)}
                  disabled={!passenger.user?.phoneNumber}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name='person' size={20} color={colors.yellow} style={{ marginLeft: 8 }} />
                  <Text style={styles.passengerName}>
                    {passenger.user?.fullName ||
                      `${passenger.user?.firstName || ''} ${passenger.user?.lastName || ''}`.trim() ||
                      i18n.general.passenger}
                  </Text>
                  {passenger.user?.phoneNumber && (
                    <MaterialIcons
                      name='phone'
                      size={16}
                      color={colors.textMuted}
                      style={{ marginRight: 'auto', paddingLeft: 8 }}
                    />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noPassengersText}>{i18n.ride_detail.no_passengers}</Text>
            )}
          </ScrollView>

          <View style={popupStyles.actions}>
            <TouchableOpacity style={[popupStyles.button, popupStyles.submitBtn, { minWidth: 120 }]} onPress={onClose}>
              <Text style={popupStyles.submitText}>{i18n.general.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  passengersList: {
    maxHeight: 250,
    marginVertical: 8,
  },
  passengerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  passengerName: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'right',
  },
  noPassengersText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginVertical: 20,
  },
});
