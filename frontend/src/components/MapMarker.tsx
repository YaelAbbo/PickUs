import type { RideEntityType } from '@/services/ride/rideService';
import type { Coordinates } from '@types';
import type { FC } from 'react';
import { Marker } from 'react-native-maps';

const MARKER_CONFIG: Record<RideEntityType, { iconPath: string; pinColor: string }> = {
  DRIVER: { iconPath: 'TODO [KAN-54]', pinColor: '#1A73E8' },
  PASSENGER: { iconPath: 'TODO [KAN-54]', pinColor: '#279846' },
  STOP: { iconPath: 'TODO [KAN-54]', pinColor: '#EA4335' },
};

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
