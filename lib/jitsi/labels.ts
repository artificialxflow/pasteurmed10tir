export function videoStatusLabel(status: string | null | undefined): string {
  if (status === 'scheduled') return 'آماده ویزیت تصویری';
  if (status === 'in_call') return 'در حال تماس';
  if (status === 'completed') return 'ویدیو پایان یافت';
  return 'بدون ویدیو';
}

export function canJoinConsultationVideoStatus(status: string | null | undefined): boolean {
  return status === 'scheduled' || status === 'in_call';
}
