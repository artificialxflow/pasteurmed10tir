import { ROUTES } from '@/lib/routes';
import { getSiteUrl } from '@/lib/zibal/config';

/** لینک صفحه پیگیری بیمار — با اکانت لاگین‌شده وارد ویزیت می‌شود */
export function consultationPatientTrackUrl(consultationId: string): string {
  return `${getSiteUrl()}${ROUTES.web.consultationTrack}/${encodeURIComponent(consultationId)}`;
}
