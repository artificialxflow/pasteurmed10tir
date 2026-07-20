import { PASTEUR_DATA } from "@/lib/data";
import { PasteurStorage, type Booking } from "@/lib/storage";

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
  async requestPermission(): Promise<NotificationPermission | "unsupported"> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return Notification.requestPermission();
  },

  createFromBooking(booking: Booking, optionId: string): ReminderItem | null {
    const option = PASTEUR_DATA.reminderOptions.find((o) => o.id === optionId);
    if (!option || !booking) return null;

    const reminder: ReminderItem = {
      id: PasteurStorage.generateId(),
      bookingId: booking.id,
      patientName: booking.patientName,
      patientPhone: booking.patientPhone,
      doctorName: booking.doctorName,
      day: booking.day,
      timeLabel: booking.timeLabel,
      typeLabel: booking.typeLabel,
      optionId: option.id,
      optionLabel: option.label,
      status: "active",
      notified: false,
      createdAt: new Date().toISOString(),
    };

    PasteurStorage.saveReminder(reminder);
    return reminder;
  },

  checkAndNotify(): void {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const reminders = PasteurStorage.getReminders().filter(
      (r) => r.status === "active" && !r.notified
    ) as ReminderItem[];

    reminders.forEach((r) => {
      new Notification("یادآور نوبت — پاستور پلاس", {
        body: `${r.patientName || "مراجع"} عزیز، نوبت ${r.typeLabel || ""} با ${r.doctorName || ""} — ${r.day || ""} ${r.timeLabel || ""}`,
        tag: r.id,
      });
      PasteurStorage.updateReminder(r.id, { notified: true });
    });
  },
};
