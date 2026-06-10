import { FinishRideOverlay, MapMenu, type FinishRideOverlayRef } from '@/components';
import { useUserLocationContext } from '@/contexts';
import { i18n } from '@/i18n';
import { RideEntityType } from '@/services/ride/rideService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRideLocationsLogic } from '@hooks';
import { useAuth } from '@services';
import { colors } from '@theme';
import type { Coordinates } from '@types';
import { useRouter } from 'expo-router';
import L from 'leaflet';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MapMarker } from './MapMarker';
import { DEFAULT_ZOOM } from './utils';

if (typeof document !== 'undefined') {
  const link = document.createElement('link');

  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

type MapControllerRef = { flyTo: (lat: number, lng: number) => void };

const MapController = forwardRef<MapControllerRef>((_, ref) => {
  const map = useMap();

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng) => map.flyTo([lat, lng], DEFAULT_ZOOM),
  }));

  return null;
});

MapController.displayName = 'MapController';

const createUserLocationIcon = (isDriver: boolean) =>
  L.divIcon({
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${colors.purple};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.3);">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        ${
          isDriver
            ? '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>'
            : '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>'
        }
      </svg>
    </div>`,
    iconAnchor: [15, 15],
    iconSize: [30, 30],
    className: '',
  });

export const LeafletMap = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { userLocation, activeRide, isUserLocationLoading, userLocationErrorMessage } = useUserLocationContext();

  const finishRideRef = useRef<FinishRideOverlayRef>(null);
  const mapControllerRef = useRef<MapControllerRef>(null);

  const { currentRideLocations } = useRideLocationsLogic({ ride: activeRide });

  const stopLocations = currentRideLocations.filter(({ type }) => type === RideEntityType.STOP);

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
    if (userLocation) mapControllerRef.current?.flyTo(userLocation.coords.latitude, userLocation.coords.longitude);
  };

  const isDriver = activeRide?.driverId === user?.id;
  const center = [userLocation?.coords.latitude ?? 0, userLocation?.coords.longitude ?? 0] as Coordinates;

  return (
    <View style={styles.container}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapContainer center={center} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />

          <MapController ref={mapControllerRef} />

          {currentRideLocations.map((currentRideLocation) => (
            <MapMarker key={currentRideLocation.id} {...currentRideLocation} totalStops={stopLocations.length} />
          ))}

          {userLocation && (
            <Marker
              position={[userLocation.coords.latitude, userLocation.coords.longitude]}
              icon={createUserLocationIcon(isDriver)}
            >
              <Popup>{i18n.location.my_location}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

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

      <MapMenu onFinishRide={() => finishRideRef.current?.trigger()} />

      <FinishRideOverlay ref={finishRideRef} activeRide={activeRide ?? null} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
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
    zIndex: 1000,
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
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 1000,
  },
  coordinateLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
