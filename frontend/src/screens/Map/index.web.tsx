import { Suspense, lazy } from 'react';

const LeafletMap = lazy(() => import('./LeafletMap.web').then((m) => ({ default: m.LeafletMap })));

export const MapScreen = () => {
  return (
    <Suspense fallback={null}>
      <LeafletMap />
    </Suspense>
  );
};
