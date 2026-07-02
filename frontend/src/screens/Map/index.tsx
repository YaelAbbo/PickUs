import { FinishRideOverlay, MapMenu, type FinishRideOverlayRef } from '@/components';
import { useUserLocationContext } from '@/contexts';
import { i18n } from '@/i18n';
import { RideEntityType } from '@/services/ride/rideService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRideLocationsLogic } from '@hooks';
import { useAuth } from '@services';
import { colors } from '@theme';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region, UrlTile } from 'react-native-maps';
import { MapMarker } from './MapMarker';

export const MapScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { userLocation, activeRide, isUserLocationLoading, userLocationErrorMessage } = useUserLocationContext();
  const mapRef = useRef<MapView>(null);

  const { currentRideLocations } = useRideLocationsLogic({ ride: activeRide });
  const stopLocations = currentRideLocations.filter((loc) => loc.type === RideEntityType.STOP);

  const finishRideRef = useRef<FinishRideOverlayRef>(null);

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

        {currentRideLocations.map((currentRideLocation) => (
          <MapMarker key={currentRideLocation.id} {...currentRideLocation} totalStops={stopLocations.length} />
        ))}

        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            title={i18n.location.my_location}
          >
            <MaterialIcons
              name={activeRide?.driverId === user?.id ? 'directions-car' : 'person'}
              size={30}
              color={colors.purple}
            />
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

      {activeRide?.driverId === user?.id && <MapMenu onFinishRide={() => finishRideRef.current?.trigger()} />}

      <FinishRideOverlay ref={finishRideRef} activeRide={activeRide ?? null} />
    </View>
  );
};

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
});
