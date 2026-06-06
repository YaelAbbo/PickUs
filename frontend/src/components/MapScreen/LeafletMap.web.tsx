import { useUserLocationContext } from '@/contexts';
import { useRide } from '@/services/ride/rideQueries';
import type { RideEntityType } from '@/services/ride/rideService';
import { useRideLocationsLogic } from '@hooks';
import * as Location from 'expo-location';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { MARKER_CONFIG } from './constants';

if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

const MARKER_ICONS: Record<RideEntityType, L.DivIcon> = Object.fromEntries(
  Object.entries(MARKER_CONFIG).map(([type, { pinColor }]) => [
    type,
    L.divIcon({
      html: `<div style="
        width:16px;height:16px;
        background:${pinColor};
        border-radius:50%;
        border:2px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
      "/>`,
      className: '',
      iconAnchor: [8, 8],
    }),
  ]),
) as Record<RideEntityType, L.DivIcon>;

const RIDE_ID = '657fd615-a228-41af-9902-e416761e2a5b';

const DEFAULT_ZOOM = 15;

function FocusControl({ userLocation }: { userLocation: Location.LocationObject | null }) {
  const map = useMap();

  const handleFocus = () => {
    if (!userLocation) return;
    const { latitude, longitude } = userLocation.coords;
    map.flyTo([latitude, longitude], DEFAULT_ZOOM, { duration: 1 });
  };

  return (
    <div style={{ position: 'absolute', top: 60, left: 20, zIndex: 1000 }}>
      <button
        onClick={handleFocus}
        style={{
          background: 'white',
          border: 'none',
          borderRadius: 30,
          padding: 10,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          fontSize: 20,
        }}
      >
        📍
      </button>
    </div>
  );
}

export function LeafletMap() {
  const { userLocation, joinRideTracking } = useUserLocationContext();
  const { data: ride } = useRide(RIDE_ID);
  const { currentRideLocations } = useRideLocationsLogic({ ride });

  useEffect(() => {
    joinRideTracking(RIDE_ID);
  }, [joinRideTracking]);

  const center: [number, number] = useMemo(
    () => [userLocation?.coords.latitude ?? 0, userLocation?.coords.longitude ?? 0],
    [userLocation],
  );

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer center={center} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
        <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        <FocusControl userLocation={userLocation} />
        {currentRideLocations.map(({ id, location, type, name }) => {
          const [longitude, latitude] = location.coordinates;
          return (
            <Marker key={id} position={[latitude, longitude]} icon={MARKER_ICONS[type]}>
              <Popup>{name}</Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
