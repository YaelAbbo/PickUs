import type { RideEntityLocationPayloadWithDetails, RideEntityType } from '@/services/ride/rideService';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { MARKER_CONFIG } from './constants';

const MARKER_ICONS = Object.fromEntries(
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
      iconAnchor: [8, 8],
    }),
  ]),
) as Record<RideEntityType, L.DivIcon>;

export const MapMarker = ({ location: { coordinates }, type, name }: RideEntityLocationPayloadWithDetails) => {
  const [longitude, latitude] = coordinates;

  return (
    <Marker position={[latitude, longitude]} icon={MARKER_ICONS[type]}>
      <Popup>{name}</Popup>
    </Marker>
  );
};
