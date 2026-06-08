import { MapMarker } from '@/components/MapMarker';
import { MapMenu } from '@/components/MapMenu';
import { useUserLocationContext } from '@/contexts';
import { i18n } from '@/i18n';
import { RideEntityType } from '@/services/ride/rideService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRideLocationsLogic } from '@hooks';
import { colors } from '@theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRide, useUpdateRide } from '@/services/ride/rideQueries';
import { RideStatus, type Ride } from '@/schemas/ride';
import type { UUID } from 'crypto';
import { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region, UrlTile } from 'react-native-maps';

export default function TrackingScreen() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { data: routeRide } = useRide(rideId as UUID);
  const { userLocation, activeRide, isUserLocationLoading, userLocationErrorMessage } = useUserLocationContext();
  const mapRef = useRef<MapView>(null);

  const displayRide = routeRide || activeRide;
  const { currentRideLocations } = useRideLocationsLogic({ ride: displayRide });
  const stopLocations = currentRideLocations.filter((loc) => loc.type === RideEntityType.STOP);

  const { mutateAsync: updateRide } = useUpdateRide((displayRide?.id ?? '') as Ride['id']);

  const [showFinishOverlay, setShowFinishOverlay] = useState(false);
  const finishFadeAnim = useRef(new Animated.Value(0)).current;
  const finishScaleAnim = useRef(new Animated.Value(0.3)).current;

  const triggerFinishAnimation = async () => {
    if (displayRide?.id) {
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

    // After 2.5 seconds, navigate to the profile screen
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
  };

  if (isUserLocationLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color={colors.purple} />
        <Text style={styles.statusText}>{i18n.location.loading_subtitle}</Text>
      </View>
    );
  }

  if (userLocationErrorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{userLocationErrorMessage}</Text>
      </View>
    );
  }

  const handleFocus = () => {
    if (userLocation && mapRef.current) {
      const animationDuration = 1000;
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        animationDuration,
      );
    }
  };

  const initialRegion: Region = {
    latitude: userLocation?.coords.latitude || 0,
    longitude: userLocation?.coords.longitude || 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType='standard'
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        <UrlTile
          urlTemplate='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          maximumZ={19}
          flipY={false}
          zIndex={1}
        />

        {currentRideLocations.map(({ id, location, type, name }) => {
          return (
            <MapMarker
              key={id}
              coordinates={location.coordinates}
              title={name}
              type={type}
              totalStops={stopLocations.length}
            />
          );
        })}

        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            title={i18n.location.my_location}
          >
            <MaterialIcons name='directions-car' size={30} color={colors.purple} />
          </Marker>
        )}
      </MapView>

      <TouchableOpacity style={styles.focusButton} onPress={handleFocus} activeOpacity={0.7}>
        <MaterialIcons name='my-location' size={24} color={colors.purple} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <MaterialIcons name='arrow-back' size={24} color={colors.purple} />
      </TouchableOpacity>

      <View style={styles.overlay}>
        <Text style={styles.coordinateLabel}>
          {userLocation?.coords.latitude.toFixed(6)}:{userLocation?.coords.longitude.toFixed(6)}
        </Text>
      </View>

      <MapMenu onFinishRide={triggerFinishAnimation} />

      {showFinishOverlay && (
        <Animated.View style={[styles.finishOverlay, { opacity: finishFadeAnim }]}>
          <Animated.View style={[styles.finishCard, { transform: [{ scale: finishScaleAnim }] }]}>
            <View style={styles.finishIconContainer}>
              <MaterialIcons name='check' size={50} color='#FFFFFF' />
            </View>
            <Text style={styles.finishTitle}>{i18n.location.finish_ride_title}</Text>
            <Text style={styles.finishSubtitle}>{i18n.location.finish_ride_subtitle}</Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
  },
  focusButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },

  overlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 10,
  },
  coordinateLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

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
