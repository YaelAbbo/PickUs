import { RideEntityType } from '@/services/ride/rideService';
import { colors } from '@theme';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import type { MapMarkerProps } from './MapMarker';
import { StopMarker } from './StopMarker';

const pinTip = (color: string, borderW = 5, tipH = 7) =>
  `<div style="width:0;height:0;border-left:${borderW}px solid transparent;border-right:${borderW}px solid transparent;border-top:${tipH}px solid ${color};margin-top:-1.5px;"></div>`;

const createDriverIcon = () =>
  L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="width:32px;height:32px;border-radius:50%;background:${colors.purple};border:2px solid ${colors.yellow};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.25);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
      ${pinTip(colors.purple)}
    </div>`,
    iconAnchor: [16, 41],
    iconSize: [32, 41],
    className: '',
  });

const createPassengerIcon = () =>
  L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="width:28px;height:28px;border-radius:50%;background:${colors.yellow};border:2px solid ${colors.purple};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.25);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${colors.purple}">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      ${pinTip(colors.yellow, 4, 6)}
    </div>`,
    iconAnchor: [14, 36],
    iconSize: [28, 36],
    className: '',
  });

export const MapMarker = ({ location: { coordinates }, type, name, totalStops }: MapMarkerProps) => {
  if (type === RideEntityType.STOP)
    return <StopMarker coordinates={coordinates} title={name} totalStops={totalStops} />;

  const [longitude, latitude] = coordinates;

  return (
    <Marker
      position={[latitude, longitude]}
      icon={(type === RideEntityType.DRIVER ? createDriverIcon : createPassengerIcon)()}
    >
      <Popup>{name}</Popup>
    </Marker>
  );
};
