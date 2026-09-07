export const TABRIZ_CENTER = { lat: 38.066516, lng: 46.269864 };

export type LatLng = { lat: number; lng: number };

export function parseOptionalCoord(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseLatLng(lat: unknown, lng: unknown): LatLng | null {
  const latitude = parseOptionalCoord(lat);
  const longitude = parseOptionalCoord(lng);
  if (latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { lat: latitude, lng: longitude };
}

export function haversineKm(from: LatLng, to: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function formatApproxKm(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return '—';
  if (km < 1) {
    const tenths = Math.max(1, Math.round(km * 10));
    return `حدود ${(tenths / 10).toLocaleString('fa-IR')} کیلومتر`;
  }
  return `حدود ${Math.round(km).toLocaleString('fa-IR')} کیلومتر`;
}

export function compareByDistance(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}
