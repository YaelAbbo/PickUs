import type { Point } from 'geojson';

export function rollingAverageCoordinate(
  currentAvg: Point | null,
  newValue: Point,
  totalCount: number,
): Point {
  if (!currentAvg || totalCount <= 1) {
    return { type: 'Point', coordinates: [...newValue.coordinates] };
  }

  const [newLng, newLat] = newValue.coordinates as [number, number];
  const [avgLng, avgLat] = currentAvg.coordinates as [number, number];

  const updatedLng = avgLng + (newLng - avgLng) / totalCount;
  const updatedLat = avgLat + (newLat - avgLat) / totalCount;

  return { type: 'Point', coordinates: [updatedLng, updatedLat] };
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function minutesToTimeString(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const rawHours = Math.floor(normalized / 60);
  const rawMins = Math.round(normalized % 60);

  const finalHours = (rawHours + Math.floor(rawMins / 60)) % 24;
  const finalMins = rawMins % 60;

  return `${String(finalHours).padStart(2, '0')}:${String(finalMins).padStart(2, '0')}:00`;
}

export function rollingAverageTime(
  currentAvgMinutes: number | null,
  newTimeString: string,
  totalCount: number,
): number {
  const newMinutes = timeToMinutes(newTimeString);

  if (currentAvgMinutes === null || totalCount <= 1) {
    return newMinutes;
  }

  return currentAvgMinutes + (newMinutes - currentAvgMinutes) / totalCount;
}
