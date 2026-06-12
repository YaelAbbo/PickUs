import type { Point } from 'geojson';
import {
  minutesToTimeString,
  rollingAverageCoordinate,
  rollingAverageTime,
  timeToMinutes,
} from './aggregation.util';

describe('aggregation.util', () => {
  describe('timeToMinutes', () => {
    it('should convert HH:MM format to minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('01:00')).toBe(60);
      expect(timeToMinutes('12:30')).toBe(750);
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('should handle HH:MM:SS format', () => {
      expect(timeToMinutes('08:30:00')).toBe(510);
      expect(timeToMinutes('14:45:30')).toBe(885); // seconds are ignored
    });
  });

  describe('minutesToTimeString', () => {
    it('should convert minutes to HH:MM:SS format', () => {
      expect(minutesToTimeString(0)).toBe('00:00:00');
      expect(minutesToTimeString(60)).toBe('01:00:00');
      expect(minutesToTimeString(750)).toBe('12:30:00');
      expect(minutesToTimeString(1439)).toBe('23:59:00');
    });

    it('should handle overflow (>1440 minutes)', () => {
      expect(minutesToTimeString(1500)).toBe('01:00:00'); // 25 hours → 01:00
      expect(minutesToTimeString(2880)).toBe('00:00:00'); // 48 hours → 00:00
    });

    it('should handle negative minutes (wraps around)', () => {
      expect(minutesToTimeString(-60)).toBe('23:00:00');
      expect(minutesToTimeString(-1)).toBe('23:59:00');
    });
  });

  describe('rollingAverageCoordinate', () => {
    const createPoint = (lng: number, lat: number): Point => ({
      type: 'Point',
      coordinates: [lng, lat],
    });

    it('should return the new value when currentAvg is null', () => {
      const newValue = createPoint(34.8, 31.0);
      const result = rollingAverageCoordinate(null, newValue, 1);

      expect(result.coordinates).toEqual([34.8, 31.0]);
    });

    it('should return the new value when totalCount is 1', () => {
      const currentAvg = createPoint(34.0, 30.0);
      const newValue = createPoint(35.0, 32.0);
      const result = rollingAverageCoordinate(currentAvg, newValue, 1);

      expect(result.coordinates).toEqual([35.0, 32.0]);
    });

    it('should calculate rolling average for 2 values', () => {
      // First value was [34.0, 30.0], second is [36.0, 32.0]
      // After 2nd value: avg = currentAvg + (newValue - currentAvg) / count
      // lng: 34.0 + (36.0 - 34.0) / 2 = 35.0
      // lat: 30.0 + (32.0 - 30.0) / 2 = 31.0
      const currentAvg = createPoint(34.0, 30.0);
      const newValue = createPoint(36.0, 32.0);
      const result = rollingAverageCoordinate(currentAvg, newValue, 2);

      expect(result.coordinates[0]).toBeCloseTo(35.0, 6);
      expect(result.coordinates[1]).toBeCloseTo(31.0, 6);
    });

    it('should calculate rolling average for multiple values', () => {
      // Simulating 3rd value: avg was [35.0, 31.0], new is [38.0, 34.0]
      // lng: 35.0 + (38.0 - 35.0) / 3 = 36.0
      // lat: 31.0 + (34.0 - 31.0) / 3 = 32.0
      const currentAvg = createPoint(35.0, 31.0);
      const newValue = createPoint(38.0, 34.0);
      const result = rollingAverageCoordinate(currentAvg, newValue, 3);

      expect(result.coordinates[0]).toBeCloseTo(36.0, 6);
      expect(result.coordinates[1]).toBeCloseTo(32.0, 6);
    });

    it('should maintain Point type structure', () => {
      const currentAvg = createPoint(34.0, 30.0);
      const newValue = createPoint(36.0, 32.0);
      const result = rollingAverageCoordinate(currentAvg, newValue, 2);

      expect(result.type).toBe('Point');
      expect(result.coordinates).toHaveLength(2);
    });
  });

  describe('rollingAverageTime', () => {
    it('should return new time in minutes when currentAvgMinutes is null', () => {
      const result = rollingAverageTime(null, '08:30:00', 1);
      expect(result).toBe(510); // 8*60 + 30 = 510
    });

    it('should return new time when totalCount is 1', () => {
      const result = rollingAverageTime(480, '09:00:00', 1);
      expect(result).toBe(540); // 9*60 = 540
    });

    it('should calculate rolling average for 2 time values', () => {
      // First: 08:00 (480 min), second: 10:00 (600 min)
      // avg = 480 + (600 - 480) / 2 = 540 (09:00)
      const result = rollingAverageTime(480, '10:00:00', 2);
      expect(result).toBeCloseTo(540, 2);
    });

    it('should handle fractional minutes', () => {
      // avg=500, new=530, count=3 → 500 + (530-500)/3 = 510
      const result = rollingAverageTime(500, '08:50:00', 3);
      expect(result).toBeCloseTo(510, 2);
    });
  });
});
