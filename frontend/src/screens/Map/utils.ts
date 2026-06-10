import { i18n } from '@/i18n';
import type { RideEntityType } from '@/services/ride/rideService';

export const MARKER_CONFIG: Record<RideEntityType, { iconPath: string; pinColor: string }> = {
  DRIVER: { iconPath: 'TODO [KAN-54]', pinColor: '#1A73E8' },
  PASSENGER: { iconPath: 'TODO [KAN-54]', pinColor: '#279846' },
  STOP: { iconPath: 'TODO [KAN-54]', pinColor: '#EA4335' },
};

export const DEFAULT_ZOOM = 15;

export const getStopNumber = (title?: string): string => {
  if (!title) return '?';

  const regex = new RegExp(`${i18n.rideForm.ride_stop} (\\d+)`);
  const match = title.match(regex);

  return (match && match[1]) || '?';
};
