import { i18n } from '@/i18n';
import { useSuccessOverlayAnimation } from '@hooks';
import { WsEvent, websocketService } from '@/services/websocket';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, popupStyles } from '@theme';
import { useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Passenger {
  id: string;
  user?: {
    id?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
}

interface MessagePassengerPopupProps {
  visible: boolean;
  onClose: () => void;
  passengers: Passenger[];
  rideId?: string;
}

export const MessagePassengerPopup = ({ visible, onClose, passengers, rideId }: MessagePassengerPopupProps) => {
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);

  const { showSuccess, successFadeAnim, successScaleAnim, runSuccessAnimation } = useSuccessOverlayAnimation(
    onClose,
    1500,
  );

  const handleClose = () => {
    setSelectedPassenger(null);
    onClose();
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedPassenger) return;

    const passengerId = selectedPassenger.user?.id || selectedPassenger.id;

    console.log('[WS] Sending driver message:', { passengerId, rideId, content });

    try {
      const response = await websocketService.emit<{ status: string }>(WsEvent.DRIVER_MESSAGE, {
        passengerId,
        rideId,
        content,
      });

      console.log('[WS] Driver message sent successfully. Response:', response);
      if (response?.status === 'ok') {
        setSelectedPassenger(null);
        runSuccessAnimation();
      } else {
        setSelectedPassenger(null);
        onClose();
      }
    } catch (error) {
      console.error('[WS] Failed to send driver message:', error);
      setSelectedPassenger(null);
      onClose();
    }
  };

  return (
    <>
      {/* Main Passengers Modal */}
      <Modal visible={visible && !selectedPassenger} transparent animationType='fade' onRequestClose={handleClose}>
        <View style={popupStyles.overlay}>
          <View style={popupStyles.container}>
            <Text style={popupStyles.title}>{i18n.ride_detail.passengers_list}</Text>

            <ScrollView style={styles.passengersList} contentContainerStyle={{ paddingBottom: 8 }}>
              {passengers.length > 0 ? (
                passengers.map((passenger, index) => (
                  <TouchableOpacity
                    key={passenger.id || index}
                    style={styles.passengerRow}
                    onPress={() => setSelectedPassenger(passenger)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name='person' size={20} color={colors.yellow} style={{ marginLeft: 8 }} />
                    <Text style={styles.passengerName}>
                      {passenger.user?.fullName ||
                        `${passenger.user?.firstName || ''} ${passenger.user?.lastName || ''}`.trim() ||
                        i18n.general.passenger}
                    </Text>
                    <MaterialIcons
                      name='chat-bubble-outline'
                      size={16}
                      color={colors.textMuted}
                      style={{ marginRight: 'auto', paddingLeft: 8 }}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noPassengersText}>{i18n.ride_detail.no_passengers}</Text>
              )}
            </ScrollView>

            <View style={popupStyles.actions}>
              <TouchableOpacity
                style={[popupStyles.button, popupStyles.submitBtn, { minWidth: 120 }]}
                onPress={handleClose}
              >
                <Text style={popupStyles.submitText}>{i18n.general.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Message Options Sub-Modal */}
      <Modal
        visible={visible && !!selectedPassenger}
        transparent
        animationType='fade'
        onRequestClose={() => setSelectedPassenger(null)}
      >
        <View style={popupStyles.overlay}>
          <View style={popupStyles.container}>
            <Text style={popupStyles.title}>{i18n.ride_detail.select_message}</Text>

            {selectedPassenger && (
              <Text style={styles.subTitle}>
                {selectedPassenger.user?.fullName ||
                  `${selectedPassenger.user?.firstName || ''} ${selectedPassenger.user?.lastName || ''}`.trim() ||
                  i18n.general.passenger}
              </Text>
            )}

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                activeOpacity={0.7}
                onPress={() => handleSendMessage(i18n.ride_detail.delay_5_min)}
              >
                <Text style={styles.optionText}>{i18n.ride_detail.delay_5_min}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                activeOpacity={0.7}
                onPress={() => handleSendMessage(i18n.ride_detail.leaving_soon)}
              >
                <Text style={styles.optionText}>{i18n.ride_detail.leaving_soon}</Text>
              </TouchableOpacity>
            </View>

            <View style={popupStyles.actions}>
              <TouchableOpacity
                style={[popupStyles.button, popupStyles.cancelBtn, { minWidth: 120 }]}
                onPress={() => setSelectedPassenger(null)}
              >
                <Text style={popupStyles.cancelText}>{i18n.ride_detail.back}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Animation Modal */}
      <Modal visible={showSuccess} transparent animationType='fade'>
        <Animated.View style={[styles.successOverlay, { opacity: successFadeAnim }]}>
          <Animated.View style={[styles.successCard, { transform: [{ scale: successScaleAnim }] }]}>
            <View style={styles.successIconContainer}>
              <MaterialIcons name='check' size={48} color='#FFFFFF' />
            </View>
            <Text style={styles.successTitle}>{i18n.ride_detail.message_sent}</Text>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
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
  subTitle: {
    fontSize: 16,
    color: colors.yellow,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 12,
    marginVertical: 8,
  },
  optionButton: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 36, 112, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 35,
    paddingHorizontal: 40,
    borderRadius: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2470',
    textAlign: 'center',
  },
});
