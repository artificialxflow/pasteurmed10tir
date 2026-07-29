/**
 * برچسب مبنای پورسانت — تا قفل نهایی کارفرما: درصد از مبلغ همان تراکنش
 */
export function commissionBasisLabel(sourceType?: string | null): string {
  switch (sourceType) {
    case 'booking':
      return 'مبلغ پرداخت رزرو (بیعانه/درگاه)';
    case 'membership':
      return 'حق عضویت پرداخت‌شده';
    case 'shop-vip':
      return 'حق عضویت VIP تجهیزات';
    default:
      return 'مبلغ تراکنش معرف‌شده';
  }
}

export function commissionSourceTypeLabel(sourceType?: string | null): string {
  switch (sourceType) {
    case 'booking':
      return 'رزرو';
    case 'membership':
      return 'عضویت';
    case 'shop-vip':
      return 'VIP تجهیزات';
    default:
      return sourceType || '—';
  }
}
