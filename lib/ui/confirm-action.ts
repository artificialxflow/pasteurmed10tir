/** تأیید مرورگر قبل از عملیات برگشت‌ناپذیر یا تغییر وضعیت. */
export function confirmAction(message: string): boolean {
  if (typeof window === "undefined") return false;
  return window.confirm(message);
}
