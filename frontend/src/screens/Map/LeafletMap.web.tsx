import { useUserLocationContext } from '@/contexts';
import { useRide } from '@/services/ride/rideQueries';
import { useRideLocationsLogic } from '@hooks';
import type { Coordinates } from '@types';
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { DEFAULT_ZOOM } from './constants';
import { FocusControl } from './FocusControl.web';
import { MapMarker } from './MapMarker';

if (typeof document !== 'undefined') {
  const link = document.createElement('link');

  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

const RIDE_ID = '657fd615-a228-41af-9902-e416761e2a5b';

export const LeafletMap = () => {
  const { userLocation, joinRideTracking } = useUserLocationContext();

  const { data: ride } = useRide(RIDE_ID);
  const { currentRideLocations } = useRideLocationsLogic({ ride });

  useEffect(() => {
    joinRideTracking(RIDE_ID);
  }, [joinRideTracking]);

  const center = useMemo<Coordinates>(
    () => [userLocation?.coords.latitude ?? 0, userLocation?.coords.longitude ?? 0],
    [userLocation],
  );

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer center={center} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
        <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />

        <FocusControl userLocation={userLocation} />

        {currentRideLocations.map((currentRideLocation) => (
          <MapMarker key={currentRideLocation.id} {...currentRideLocation} />
        ))}
      </MapContainer>
    </div>
  );
};
