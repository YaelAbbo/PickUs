import type { RideEntityType } from '@/services/ride/rideService';

export const MARKER_CONFIG: Record<RideEntityType, { iconPath: string; pinColor: string }> = {
  DRIVER: { iconPath: 'TODO [KAN-54]', pinColor: '#1A73E8' },
  PASSENGER: { iconPath: 'TODO [KAN-54]', pinColor: '#279846' },
  STOP: { iconPath: 'TODO [KAN-54]', pinColor: '#EA4335' },
};

export const DEFAULT_ZOOM = 15;
