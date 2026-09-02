export type AppOverviewMetric = {
  key: string;
  label: string;
  value: number;
  group: 'users' | 'operations' | 'commerce' | 'engagement';
};

export type AppOverviewStats = {
  generatedAt: string;
  metrics: AppOverviewMetric[];
  users: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    withNationalId: number;
  };
  operations: {
    bookingsTotal: number;
    bookingsConfirmed: number;
    bookingsToday: number;
    consultationsTotal: number;
    insurancePending: number;
    complaintsNew: number;
    supportOpen: number;
  };
  commerce: {
    membersPaid: number;
    loanApplicationsPending: number;
    facilityPending: number;
    installmentsActive: number;
    commissionsPending: number;
  };
  engagement: {
    clubProfiles: number;
    visitors: number;
    reviewsPending: number;
  };
};

export const APP_REPORT_HEADERS = ['گروه', 'شاخص', 'مقدار'] as const;

export type AppReportRow = {
  group: string;
  label: string;
  value: number;
};

const GROUP_LABEL: Record<AppOverviewMetric['group'], string> = {
  users: 'کاربران',
  operations: 'عملیات',
  commerce: 'تجاری',
  engagement: 'تعامل',
};

export function buildAppOverviewMetrics(stats: Omit<AppOverviewStats, 'generatedAt' | 'metrics'>): AppOverviewMetric[] {
  return [
    { key: 'users.total', label: 'کل کاربران', value: stats.users.total, group: 'users' },
    { key: 'users.approved', label: 'کاربران تأییدشده', value: stats.users.approved, group: 'users' },
    { key: 'users.pending', label: 'کاربران در بررسی', value: stats.users.pending, group: 'users' },
    { key: 'users.rejected', label: 'کاربران ردشده', value: stats.users.rejected, group: 'users' },
    {
      key: 'users.withNationalId',
      label: 'کاربران با کد ملی',
      value: stats.users.withNationalId,
      group: 'users',
    },
    {
      key: 'operations.bookingsTotal',
      label: 'کل رزروها',
      value: stats.operations.bookingsTotal,
      group: 'operations',
    },
    {
      key: 'operations.bookingsConfirmed',
      label: 'رزروهای تأییدشده',
      value: stats.operations.bookingsConfirmed,
      group: 'operations',
    },
    {
      key: 'operations.bookingsToday',
      label: 'رزرو امروز',
      value: stats.operations.bookingsToday,
      group: 'operations',
    },
    {
      key: 'operations.consultationsTotal',
      label: 'مشاوره‌ها',
      value: stats.operations.consultationsTotal,
      group: 'operations',
    },
    {
      key: 'operations.insurancePending',
      label: 'استعلام بیمه در انتظار',
      value: stats.operations.insurancePending,
      group: 'operations',
    },
    {
      key: 'operations.complaintsNew',
      label: 'شکایات جدید',
      value: stats.operations.complaintsNew,
      group: 'operations',
    },
    {
      key: 'operations.supportOpen',
      label: 'تیکت پشتیبانی باز',
      value: stats.operations.supportOpen,
      group: 'operations',
    },
    {
      key: 'commerce.membersPaid',
      label: 'عضویت پرداخت‌شده',
      value: stats.commerce.membersPaid,
      group: 'commerce',
    },
    {
      key: 'commerce.loanApplicationsPending',
      label: 'درخواست وام در انتظار',
      value: stats.commerce.loanApplicationsPending,
      group: 'commerce',
    },
    {
      key: 'commerce.facilityPending',
      label: 'تسهیلات در انتظار',
      value: stats.commerce.facilityPending,
      group: 'commerce',
    },
    {
      key: 'commerce.installmentsActive',
      label: 'طرح اقساط فعال',
      value: stats.commerce.installmentsActive,
      group: 'commerce',
    },
    {
      key: 'commerce.commissionsPending',
      label: 'پورسانت در انتظار',
      value: stats.commerce.commissionsPending,
      group: 'commerce',
    },
    {
      key: 'engagement.clubProfiles',
      label: 'پروفایل باشگاه',
      value: stats.engagement.clubProfiles,
      group: 'engagement',
    },
    {
      key: 'engagement.visitors',
      label: 'ویزیتورها',
      value: stats.engagement.visitors,
      group: 'engagement',
    },
    {
      key: 'engagement.reviewsPending',
      label: 'نظرات در انتظار',
      value: stats.engagement.reviewsPending,
      group: 'engagement',
    },
  ];
}

export function buildAppReportRows(stats: AppOverviewStats): AppReportRow[] {
  return stats.metrics.map((metric) => ({
    group: GROUP_LABEL[metric.group],
    label: metric.label,
    value: metric.value,
  }));
}
