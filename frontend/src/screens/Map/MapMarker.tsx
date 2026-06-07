import type { RideEntityLocationPayloadWithDetails } from '@/services/ride/rideService';
import type { FC } from 'react';
import { Marker } from 'react-native-maps';
import { MARKER_CONFIG } from './constants';

export type MapMarkerProps = RideEntityLocationPayloadWithDetails;

export const MapMarker: FC<MapMarkerProps> = ({ type, location: { coordinates }, name }) => {
  const { pinColor } = MARKER_CONFIG[type];

  const [longitude, latitude] = coordinates;

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      title={name}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={100}
      pinColor={pinColor}
    />
  );
};
