import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Region, UrlTile } from 'react-native-maps';

export default function TrackingScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<MapView>(null);
  let subscriber: Location.LocationSubscription | null = null;

  async function startTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      setIsLoading(false);
      Alert.alert('Permission Denied', 'Please enable location permissions in settings.');
      return;
    }

    try {
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(initialLocation);
      setIsLoading(false);

      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000,
          distanceInterval: 50,
        },
        (newLocation) => {
          console.log('Updated Location:', newLocation.coords);
          setLocation(newLocation);
        },
      );
    } catch (error) {
      setErrorMsg('Error getting location: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsLoading(false);
    }
  }

  useEffect(() => {
    startTracking();

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

  const handleFocus = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color='#007AFF' />
        <Text style={styles.statusText}>Initializing GPS...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: location?.coords.latitude || 0,
    longitude: location?.coords.longitude || 0,
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
      </MapView>

      <TouchableOpacity style={styles.focusButton} onPress={handleFocus} activeOpacity={0.7}>
        <MaterialIcons name='my-location' size={24} color='#007AFF' />
      </TouchableOpacity>

      <View style={styles.overlay}>
        <Text style={styles.coordinateLabel}>
          {location?.coords.latitude.toFixed(6)}:{location?.coords.longitude.toFixed(6)}
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
