import { useUserLocationContext } from '@/contexts';
import { useRideLocationsLogic } from '@hooks';
import type { Coordinates } from '@types';
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

export const LeafletMap = () => {
  const { userLocation, activeRide } = useUserLocationContext();

  const { currentRideLocations } = useRideLocationsLogic({ ride: activeRide });

  const center = [userLocation?.coords.latitude ?? 0, userLocation?.coords.longitude ?? 0] as Coordinates;

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
