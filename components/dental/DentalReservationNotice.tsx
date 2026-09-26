import { DENTAL_RESERVATION_DEFAULT_NOTICE } from '@/lib/content/dental-reservation-note';

export function DentalReservationNotice({
  adminNote,
  variant = 'teal',
}: {
  adminNote?: string;
  variant?: 'teal' | 'amber';
}) {
  const note = (adminNote || '').trim();
  const box =
    variant === 'amber'
      ? 'rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800'
      : 'rounded-lg border border-teal-100 bg-white p-3 text-xs leading-6 text-teal-900';

  return (
    <div className={box}>
      <p>{DENTAL_RESERVATION_DEFAULT_NOTICE.main}</p>
      <p className="mt-1 text-slate-600">{DENTAL_RESERVATION_DEFAULT_NOTICE.sub}</p>
      {variant === 'amber' ? (
        <p className="mt-2">{DENTAL_RESERVATION_DEFAULT_NOTICE.cancel}</p>
      ) : null}
      {note ? (
        <p className="mt-3 whitespace-pre-wrap border-t border-slate-200/80 pt-3 font-medium text-slate-800">
          {note}
        </p>
      ) : null}
    </div>
  );
}
