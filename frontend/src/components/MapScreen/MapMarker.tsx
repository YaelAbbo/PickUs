import type { RideEntityType } from '@/services/ride/rideService';
import type { Coordinates } from '@types';
import type { FC } from 'react';
import { Marker } from 'react-native-maps';
import { MARKER_CONFIG } from './constants';

export type MapMarkerProps = { type: RideEntityType; coordinates: Coordinates; title: string };

export const MapMarker: FC<MapMarkerProps> = ({ type, coordinates: [longitude, latitude], title }) => {
  const { pinColor } = MARKER_CONFIG[type];

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      title={title}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={100}
      pinColor={pinColor}
    />
  );
};
