/**
 * یادآور هوشمند — پاستور پلاس
 */
const ReminderService = {
  requestPermission() {
    if (!('Notification' in window)) return Promise.resolve('unsupported');
    if (Notification.permission === 'granted') return Promise.resolve('granted');
    if (Notification.permission === 'denied') return Promise.resolve('denied');
    return Notification.requestPermission();
  },

  createFromBooking(booking, optionId) {
    const option = PASTEUR_DATA.reminderOptions.find((o) => o.id === optionId);
    if (!option || !booking) return null;

    const reminder = {
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
      status: 'active',
      notified: false,
      createdAt: new Date().toISOString(),
    };

    PasteurStorage.saveReminder(reminder);
    return reminder;
  },

  checkAndNotify() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const reminders = PasteurStorage.getReminders().filter((r) => r.status === 'active' && !r.notified);
    reminders.forEach((r) => {
      new Notification('یادآور نوبت — پاستور پلاس', {
        body: `${r.patientName} عزیز، نوبت ${r.typeLabel} با ${r.doctorName} — ${r.day} ${r.timeLabel}`,
        icon: '/assets/logo/.gitkeep',
        tag: r.id,
      });
      PasteurStorage.updateReminder(r.id, { notified: true });
    });
  },

  renderReminderCard(r) {
    const statusClass = r.status === 'active' ? 'badge-available' : 'badge-inactive';
    const statusText = r.status === 'active' ? 'فعال' : 'غیرفعال';
    return `
      <article class="card-bordered p-4 flex flex-col sm:flex-row sm:items-center gap-4" data-id="${r.id}">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xl">🔔</span>
            <h3 class="font-bold">${r.doctorName}</h3>
            <span class="badge ${statusClass}">${statusText}</span>
          </div>
          <p class="text-sm text-slate-600">${r.typeLabel} — ${r.day} — ${r.timeLabel}</p>
          <p class="text-xs text-teal-700 mt-1">یادآور: ${r.optionLabel}</p>
        </div>
        <button type="button" class="delete-reminder text-red-600 text-sm font-semibold px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50" data-id="${r.id}">
          حذف
        </button>
      </article>`;
  },
};

// بررسی یادآورها هنگام بارگذاری صفحات
document.addEventListener('DOMContentLoaded', () => {
  if (typeof PasteurStorage !== 'undefined') {
    setTimeout(() => ReminderService.checkAndNotify(), 2000);
  }
});
