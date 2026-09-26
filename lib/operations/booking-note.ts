const MAX_BOOKING_STAFF_NOTE = 2000;

export function normalizeBookingStaffNote(raw: unknown): string | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  return text.length > MAX_BOOKING_STAFF_NOTE
    ? text.slice(0, MAX_BOOKING_STAFF_NOTE)
    : text;
}
