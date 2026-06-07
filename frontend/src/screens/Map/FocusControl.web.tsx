import * as Location from 'expo-location';
import { useMap } from 'react-leaflet';
import { DEFAULT_ZOOM } from './constants';

export const FocusControl = ({ userLocation }: { userLocation: Location.LocationObject | null }) => {
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
};
