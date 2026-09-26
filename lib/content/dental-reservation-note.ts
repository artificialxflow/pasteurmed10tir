/** متن ثابت بیعانه — همیشه نمایش داده می‌شود؛ توضیح ادمین جداگانه اضافه می‌شود */
export const DENTAL_RESERVATION_DEFAULT_NOTICE = {
  main: 'مبلغ بیعانه رزرو از مبلغ صورتحسابتان کسر خواهد شد.',
  sub: 'مبلغ رزرو وقت ثابت است و قابل ویرایش نیست.',
  cancel:
    'بیعانه رزرو در صورت لغو قابل استرداد نیست. اگر استعلام بیمه تأیید شود و کاربری بیمار تأیید شده باشد، مبلغ قابل پرداخت برابر درصد فرانشیز از هزینه ویزیت خواهد بود.',
} as const;

export function normalizeDentalReservationNote(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : '';
}
