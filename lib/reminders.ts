import { PASTEUR_DATA } from '@/lib/data';
import {
  fetchPatientOps,
  patchPatientOps,
  postPatientOps,
} from '@/lib/operations/client';
import type { Booking } from '@/lib/storage';

export type ReminderItem = {
  id: string;
  bookingId?: string;
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  day?: string;
  timeLabel?: string;
  typeLabel?: string;
  optionId?: string;
  optionLabel?: string;
  status?: string;
  notified?: boolean;
  createdAt?: string;
  [key: string]: unknown;
};

export const ReminderService = {
  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return Notification.requestPermission();
  },

  async listReminders(): Promise<ReminderItem[]> {
    try {
      const data = await fetchPatientOps<{ items: ReminderItem[] }>(
        '/api/operations/reminders',
      );
      return data.items.filter((r) => r.status === 'active');
    } catch {
      return [];
    }
  },

  async createFromBooking(booking: Booking, optionId: string): Promise<ReminderItem | null> {
    const option = PASTEUR_DATA.reminderOptions.find((o) => o.id === optionId);
    if (!option || !booking) return null;

    try {
      const data = await postPatientOps<{ item: ReminderItem }>(
        '/api/operations/reminders',
        {
          bookingId: booking.id,
          patientName: booking.patientName,
          patientPhone: booking.patientPhone,
          doctorName: booking.doctorName,
          day: booking.day,
          timeLabel: booking.timeLabel,
          typeLabel: booking.typeLabel,
          optionId: option.id,
          optionLabel: option.label,
        },
      );
      return data.item;
    } catch {
      return null;
    }
  },

  async checkAndNotify(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const reminders = (await this.listReminders()).filter(
      (r) => r.status === 'active' && !r.notified,
    );

    for (const r of reminders) {
      new Notification('یادآور نوبت — پاستور پلاس', {
        body: `${r.patientName || 'مراجع'} عزیز، نوبت ${r.typeLabel || ''} با ${r.doctorName || ''} — ${r.day || ''} ${r.timeLabel || ''}`,
        tag: r.id,
      });
      try {
        await patchPatientOps(`/api/operations/reminders/${encodeURIComponent(r.id)}`, {
          notified: true,
        });
      } catch {
        /* ignore */
      }
    }
  },

  async deleteReminder(id: string): Promise<boolean> {
    try {
      await fetchPatientOps(`/api/operations/reminders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return true;
    } catch {
      return false;
    }
  },
};
