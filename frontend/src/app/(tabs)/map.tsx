import { MapMarker } from '@/components/MapMarker';
import { useUserLocationContext } from '@/contexts';
import { MaterialIcons } from '@expo/vector-icons';
import { useRideLocationsLogic } from '@hooks';
import { useRef } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Region, UrlTile } from 'react-native-maps';

export default function TrackingScreen() {
  const { userLocation, activeRide } = useUserLocationContext();

  const mapRef = useRef<MapView>(null);

  const { currentRideLocations } = useRideLocationsLogic({ ride: activeRide });

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
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        <UrlTile
          urlTemplate='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          maximumZ={19}
          flipY={false}
          zIndex={1}
        />

        {currentRideLocations.map(({ id, location, type, name }) => (
          <MapMarker key={id} coordinates={location.coordinates} title={name} type={type} />
        ))}
      </MapView>

      <TouchableOpacity style={styles.focusButton} onPress={handleFocus} activeOpacity={0.7}>
        <MaterialIcons name='my-location' size={24} color='#007AFF' />
      </TouchableOpacity>

      <View style={styles.overlay}>
        <Text style={styles.coordinateLabel}>
          {userLocation?.coords.latitude.toFixed(6)}:{userLocation?.coords.longitude.toFixed(6)}
        </Text>
      </View>
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
