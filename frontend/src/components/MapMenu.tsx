import { useUserLocationContext } from '@/contexts';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@theme';
import { useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MessagePassengerPopup } from './MessagePassengerPopup';
import { PassengersPopup } from './PassengersPopup';

type MapMenuProps = {
  onFinishRide?: () => void;
};

export const MapMenu = ({ onFinishRide }: MapMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [passengerModalVisible, setPassengerModalVisible] = useState(false);
  const [messagePassengerModalVisible, setMessagePassengerModalVisible] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const { activeRide } = useUserLocationContext();

  const toggleMenu = () => {
    const toValue = menuOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 5,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    setMenuOpen(!menuOpen);
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const translateY1 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });
  const scale1 = animation;

  const translateX2 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 42],
  });
  const translateY2 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -42],
  });
  const scale2 = animation;

  const translateX3 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });
  const scale3 = animation;

  const passengers = activeRide?.passengers || [];

  return (
    <>
      <View pointerEvents={menuOpen ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
        {/* Button 1: Navigation */}
        <Animated.View style={[styles.fabSubButton, { transform: [{ translateY: translateY1 }, { scale: scale1 }] }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.subButtonTouchable}
            onPress={() => setPassengerModalVisible(true)}
          >
            <MaterialIcons name='phone' size={20} color={colors.purple} />
          </TouchableOpacity>
        </Animated.View>

        {/* Button 2: Message Passenger Quick Options */}
        <Animated.View
          style={[
            styles.fabSubButton,
            { transform: [{ translateX: translateX2 }, { translateY: translateY2 }, { scale: scale2 }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.subButtonTouchable}
            onPress={() => setMessagePassengerModalVisible(true)}
          >
            <MaterialIcons name='message' size={20} color={colors.purple} />
          </TouchableOpacity>
        </Animated.View>

        {/* Button 3: Finish Ride (סיום נסיעה) - Styled distinctly with a green background */}
        <Animated.View style={[styles.fabSubButton, { transform: [{ translateX: translateX3 }, { scale: scale3 }] }]}>
          <TouchableOpacity activeOpacity={0.7} style={styles.subButtonTouchable} onPress={onFinishRide}>
            <MaterialIcons name='check' size={20} color='#4CAF50' />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.View style={[styles.fabMainButtonContainer, { transform: [{ rotate: rotation }] }]}>
        <TouchableOpacity style={styles.fabMainButton} onPress={toggleMenu} activeOpacity={0.7}>
          <MaterialIcons name='add' size={28} color='#fff' />
        </TouchableOpacity>
      </Animated.View>

      {/* Passengers List Modal Popup */}
      <PassengersPopup
        visible={passengerModalVisible}
        passengers={passengers}
        onClose={() => setPassengerModalVisible(false)}
      />

      {/* Message Passengers Modal Popup */}
      <MessagePassengerPopup
        visible={messagePassengerModalVisible}
        passengers={passengers}
        rideId={activeRide?.id}
        onClose={() => setMessagePassengerModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fabMainButtonContainer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    width: 50,
    height: 50,
    zIndex: 1000,
  },
  fabMainButton: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabSubButton: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
  },
  subButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
