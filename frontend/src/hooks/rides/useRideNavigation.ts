import { useRouter, type Href } from 'expo-router';

export function useRideNavigation() {
  const router = useRouter();

  const navigateToMap = (rideId: string) => {
    const destination: Href = { pathname: '/map', params: { rideId } };
    router.push(destination);
  };

  const navigateToRideDetail = (rideId: string) => {
    const destination: Href = { pathname: '/rideDetailModal', params: { rideId } };
    router.push(destination);
  };

  const navigateToEditRide = (rideId: string) => {
    const destination: Href = { pathname: '/editRideFormModal', params: { rideId } };
    router.push(destination);
  };

  return {
    navigateToMap,
    navigateToRideDetail,
    navigateToEditRide,
  };
}
