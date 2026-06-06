import { Suspense, lazy } from 'react';

const LeafletMap = lazy(() => import('./LeafletMap.web').then((m) => ({ default: m.LeafletMap })));

export default function MapScreen() {
  return (
    <Suspense fallback={null}>
      <LeafletMap />
    </Suspense>
  );
}
