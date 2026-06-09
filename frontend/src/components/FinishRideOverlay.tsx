import { useUpdateRide } from '@/services/ride/rideQueries';
import { RideStatus, type Ride } from '@/schemas/ride';
import { i18n } from '@/i18n';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type FinishRideOverlayProps = {
  activeRide: Ride | null;
};

export type FinishRideOverlayRef = {
  trigger: () => Promise<void>;
};

export const FinishRideOverlay = forwardRef<FinishRideOverlayRef, FinishRideOverlayProps>(({ activeRide }, ref) => {
  const router = useRouter();
  const { mutateAsync: updateRide } = useUpdateRide((activeRide?.id ?? '') as Ride['id']);

  const [showFinishOverlay, setShowFinishOverlay] = useState(false);
  const finishFadeAnim = useRef(new Animated.Value(0)).current;
  const finishScaleAnim = useRef(new Animated.Value(0.3)).current;

  useImperativeHandle(ref, () => ({
    trigger: async () => {
      if (activeRide?.id) {
        try {
          await updateRide({ rideStatus: RideStatus.DONE });
        } catch (error) {
          console.error('Failed to finish ride:', error);
        }
      }

      setShowFinishOverlay(true);
      Animated.parallel([
        Animated.timing(finishFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(finishScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // After 2.2 seconds, navigate to the profile screen
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(finishFadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(finishScaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowFinishOverlay(false);
          router.replace('/(tabs)/profile');
        });
      }, 2200);
    },
  }));

  if (!showFinishOverlay) return null;

  return (
    <Animated.View style={[styles.finishOverlay, { opacity: finishFadeAnim }]}>
      <Animated.View style={[styles.finishCard, { transform: [{ scale: finishScaleAnim }] }]}>
        <View style={styles.finishIconContainer}>
          <MaterialIcons name='check' size={50} color='#FFFFFF' />
        </View>
        <Text style={styles.finishTitle}>{i18n.location.finish_ride_title}</Text>
        <Text style={styles.finishSubtitle}>{i18n.location.finish_ride_subtitle}</Text>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  finishOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 36, 112, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  finishCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 35,
    paddingHorizontal: 40,
    borderRadius: 24,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  finishIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  finishTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C2470',
    marginBottom: 8,
    textAlign: 'center',
  },
  finishSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
});
