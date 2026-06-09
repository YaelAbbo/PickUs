import { colors } from '@theme';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import type { StopMarkerProps } from './StopMarker';
import { getStopNumber } from './utils';

const pinTip = (color: string, borderW = 4, tipH = 6) =>
  `<div style="width:0;height:0;border-left:${borderW}px solid transparent;border-right:${borderW}px solid transparent;border-top:${tipH}px solid ${color};margin-top:-1.5px;"></div>`;

const createStopMiddleIcon = (stopNumber: string) =>
  L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="width:22px;height:22px;border-radius:50%;background:${colors.purple};border:1.5px solid ${colors.yellow};display:flex;align-items:center;justify-content:center;">
        <span style="color:#fff;font-size:10px;font-weight:bold;line-height:1;">${stopNumber}</span>
      </div>
      ${pinTip(colors.purple)}
    </div>`,
    iconAnchor: [11, 30],
    iconSize: [22, 30],
    className: '',
  });

const createStopEndIcon = () =>
  L.divIcon({
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${colors.yellow};border:1.5px solid ${colors.purple};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.2);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="${colors.purple}">
        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
      </svg>
    </div>`,
    iconAnchor: [11, 11],
    iconSize: [22, 22],
    className: '',
  });

export const StopMarker = ({ coordinates: [longitude, latitude], title, totalStops }: StopMarkerProps) => {
  const stopNumber = getStopNumber(title);

  // 1. The first stop is the car (no need for another icon)
  if (stopNumber === '1') return null;

  // 2. The last stop: have another icon representing it's the end
  const isLast = totalStops && stopNumber === String(totalStops);
  if (isLast) {
    return (
      <Marker position={[latitude, longitude]} icon={createStopEndIcon()} title={title}>
        <Popup>{title}</Popup>
      </Marker>
    );
  }

  // 3. Middle stops: location-like icon with the number
  return (
    <Marker position={[latitude, longitude]} icon={createStopMiddleIcon(stopNumber)} title={title}>
      <Popup>{title}</Popup>
    </Marker>
  );
};
