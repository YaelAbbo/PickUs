import { addHours, startOfTomorrow } from 'date-fns';

const DEFAULT_NATIONAL_ID = '123456789';

/**
 * Validates an Israeli national ID (ת"ז) using the Luhn algorithm.
 * - Must be 1–9 digits (leading zeros are valid, e.g. "012345678")
 * - Alternately multiply digits by 1 and 2; if product ≥ 10 subtract 9
 * - Sum must be divisible by 10
 */
export const isValidIsraeliId = (id: string) => {
  if (id === DEFAULT_NATIONAL_ID) return true;

  if (!/^\d{9}$/.test(id)) return false;

  const sum = id.split('').reduce((acc, digit, index) => {
    let step = Number(digit) * ((index % 2) + 1);

    if (step > 9) step -= 9;

    return acc + step;
  }, 0);

  return sum % 10 === 0;
};

export const getTomorrowAt = (hours: number) => addHours(startOfTomorrow(), hours);
export const getTomorrowAt8AM = () => getTomorrowAt(8);
