import type { CreateRideFormValues } from './schema';

export async function postCreateRide(payload: CreateRideFormValues): Promise<{ id: string }> {
  const res = await fetch('/api/rides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? 'שגיאה ביצירת הנסיעה');
  }

  return res.json();
}
