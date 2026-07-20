/**
 * جریان نوبت‌دهی — پاستور پلاس
 */

const BookingFlow = {
  setVisible(el, visible) {
    if (!el) return;
    el.classList.toggle('hidden', !visible);
    el.classList.toggle('app-hidden', !visible);
  },

  state: {
    type: null,
    doctorId: null,
    day: null,
    timeValue: null,
    timeLabel: null,
    patientName: '',
    patientPhone: '',
    referralCode: '',
  },

  currentStepName: 'type',
  steps: ['type', 'doctor', 'day', 'time', 'info'],

  init() {
    const params = new URLSearchParams(window.location.search);
    const doctorId = params.get('doctor');
    if (doctorId) {
      this.state.doctorId = parseInt(doctorId, 10);
      this.steps = ['type', 'day', 'time', 'info'];
    }

    const saved = PasteurStorage.getPendingBooking();
    if (saved && saved.step) {
      this.state = { ...this.state, ...saved.data };
    }

    this.render();
    this.bindEvents();
  },

  currentStepIndex() {
    return this.steps.indexOf(this.currentStepName);
  },

  getDoctor() {
    return PASTEUR_DATA.dentists.find((d) => d.id === this.state.doctorId);
  },

  render() {
    this.renderProgress();
    this.renderStepType();
    this.renderStepDoctor();
    this.renderStepDay();
    this.renderStepTime();
    this.renderStepInfo();
    this.updateDoctorSummary();
  },

  isAppContext() {
    return window.location.pathname.replace(/\\/g, '/').includes('/app/');
  },

  renderProgress() {
    const labels = this.steps.map((s) => ({
      type: 'نوع خدمت',
      doctor: 'انتخاب پزشک',
      day: 'روز حضور',
      time: 'انتخاب زمان',
      info: 'اطلاعات مراجع',
    }[s]));

    const container = document.getElementById('booking-progress');
    if (!container) return;

    if (this.isAppContext()) {
      container.className = 'app-booking-progress app-mb-4';
      container.innerHTML = labels
        .map(
          (label, i) => `
          <div class="app-progress-step">
            <div class="app-progress-dot is-pending progress-dot" data-index="${i}">${i + 1}</div>
            <span class="app-progress-label">${label}</span>
            ${i < labels.length - 1 ? '<div class="app-progress-line progress-line"></div>' : ''}
          </div>`
        )
        .join('');
      return;
    }

    container.innerHTML = labels
      .map(
        (label, i) => `
        <div class="flex items-center gap-2 ${i < labels.length - 1 ? 'flex-1' : ''}">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
                      progress-dot border-teal-500 bg-teal-500 text-white" data-index="${i}">
            ${i + 1}
          </div>
          <span class="text-xs sm:text-sm font-medium text-slate-600 hidden sm:inline">${label}</span>
          ${i < labels.length - 1 ? '<div class="flex-1 h-0.5 bg-slate-200 mx-1 progress-line"></div>' : ''}
        </div>`
      )
      .join('');
  },

  updateProgress(activeIndex) {
    if (this.isAppContext()) {
      document.querySelectorAll('.progress-dot').forEach((dot, i) => {
        dot.classList.remove('is-active', 'is-done', 'is-pending');
        if (i < activeIndex) {
          dot.classList.add('is-done');
          dot.innerHTML = '✓';
        } else if (i === activeIndex) {
          dot.classList.add('is-active');
          dot.textContent = i + 1;
        } else {
          dot.classList.add('is-pending');
          dot.textContent = i + 1;
        }
      });
      document.querySelectorAll('.progress-line').forEach((line, i) => {
        line.classList.toggle('is-done', i < activeIndex);
      });
      return;
    }

    document.querySelectorAll('.progress-dot').forEach((dot, i) => {
      dot.classList.remove('bg-teal-500', 'text-white', 'bg-white', 'text-teal-700');
      if (i < activeIndex) {
        dot.classList.add('bg-teal-500', 'text-white');
        dot.innerHTML = '✓';
      } else if (i === activeIndex) {
        dot.classList.add('bg-teal-500', 'text-white');
        dot.textContent = i + 1;
      } else {
        dot.classList.add('bg-white', 'text-teal-700');
        dot.textContent = i + 1;
      }
    });
    document.querySelectorAll('.progress-line').forEach((line, i) => {
      line.classList.toggle('bg-teal-500', i < activeIndex);
      line.classList.toggle('bg-slate-200', i >= activeIndex);
    });
  },

  showStep(stepName) {
    this.currentStepName = stepName;
    document.querySelectorAll('.booking-step').forEach((el) => this.setVisible(el, false));
    const target = document.getElementById(`step-${stepName}`);
    this.setVisible(target, true);

    const idx = this.steps.indexOf(stepName);
    this.updateProgress(idx);
    this.saveDraft(stepName);

    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');
    if (btnNext && btnSubmit) {
      const isLast = stepName === 'info';
      this.setVisible(btnNext, !isLast);
      this.setVisible(btnSubmit, isLast);
    }
  },

  saveDraft(stepName) {
    PasteurStorage.setPendingBooking({ step: stepName, data: { ...this.state } });
  },

  renderStepType() {
    const container = document.getElementById('type-options');
    if (!container) return;
    const app = this.isAppContext();

    if (app) {
      container.innerHTML = `
        <button type="button" data-type="visit"
                class="type-option app-option app-option--center ${this.state.type === 'visit' ? 'is-selected' : ''}">
          <span class="app-option-emoji">🦷</span>
          <h3 class="app-option-title">ویزیت</h3>
          <p class="app-option-desc">انتخاب ساعت کلی — ویزیت هر زمان قابل انتخاب است</p>
        </button>
        <button type="button" data-type="treatment"
                class="type-option app-option app-option--center ${this.state.type === 'treatment' ? 'is-selected is-selected--blue' : ''}">
          <span class="app-option-emoji">🪥</span>
          <h3 class="app-option-title">شروع یا ادامه درمان</h3>
          <p class="app-option-desc">بازه‌های یک‌ساعته — هر خدمت دقیقاً یک ساعت</p>
        </button>`;
      return;
    }

    container.innerHTML = `
      <button type="button" data-type="visit"
              class="type-option card-bordered p-6 text-center w-full hover:border-teal-500 transition-all
                     ${this.state.type === 'visit' ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50' : ''}">
        <span class="text-4xl block mb-3">🦷</span>
        <h3 class="font-bold text-lg">ویزیت</h3>
        <p class="text-sm text-slate-600 mt-2">انتخاب ساعت کلی — ویزیت هر زمان قابل انتخاب است</p>
      </button>
      <button type="button" data-type="treatment"
              class="type-option card-bordered p-6 text-center w-full hover:border-blue-500 transition-all
                     ${this.state.type === 'treatment' ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : ''}">
        <span class="text-4xl block mb-3">🪥</span>
        <h3 class="font-bold text-lg">شروع یا ادامه درمان</h3>
        <p class="text-sm text-slate-600 mt-2">بازه‌های یک‌ساعته — هر خدمت دقیقاً یک ساعت</p>
      </button>`;
  },

  renderStepDoctor() {
    const container = document.getElementById('doctor-list');
    if (!container) return;
    const app = this.isAppContext();

    container.innerHTML = PASTEUR_DATA.dentists
      .map((d) => {
        const status = STATUS_LABELS[d.status] || STATUS_LABELS.inactive;
        const selected = this.state.doctorId === d.id;
        const inactive = d.status === 'inactive';
        if (app) {
          return `
          <button type="button" data-doctor="${d.id}"
                  class="doctor-option app-option app-option--row ${selected ? 'is-selected' : ''} ${inactive ? 'is-disabled cursor-not-allowed' : ''}">
            <img src="${d.image}" alt="" class="app-doctor-thumb" />
            <div class="app-flex-1">
              <div class="app-flex app-items-center app-gap-2" style="flex-wrap:wrap">
                <span class="app-font-bold">${d.name}</span>
                <span class="badge ${status.class}">${status.text}</span>
              </div>
              <p class="app-text-sm app-text-teal">${d.specialty}</p>
            </div>
          </button>`;
        }
        return `
        <button type="button" data-doctor="${d.id}"
                class="doctor-option card-bordered p-4 flex items-center gap-4 w-full text-right
                       ${selected ? 'border-teal-500 ring-2 ring-teal-200' : ''}
                       ${inactive ? 'opacity-50 cursor-not-allowed' : ''}">
          <img src="${d.image}" alt="" class="w-14 h-14 rounded-lg object-cover border-2 border-slate-200" />
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-bold">${d.name}</span>
              <span class="badge ${status.class}">${status.text}</span>
            </div>
            <p class="text-sm text-teal-700">${d.specialty}</p>
          </div>
        </button>`;
      })
      .join('');
  },

  renderStepDay() {
    const container = document.getElementById('day-options');
    const doctor = this.getDoctor();
    if (!container || !doctor) return;
    const app = this.isAppContext();

    const days = Object.keys(doctor.schedule || {});
    if (!days.length) {
      container.innerHTML = app
        ? '<p class="app-empty">روزی برای این پزشک ثبت نشده است.</p>'
        : '<p class="text-slate-500 col-span-full text-center py-6">روزی برای این پزشک ثبت نشده است.</p>';
      return;
    }

    container.innerHTML = days
      .map((day) => {
        const selected = this.state.day === day;
        if (app) {
          return `
          <button type="button" data-day="${day}"
                  class="day-option app-option app-option--chip ${selected ? 'is-selected' : ''}">
            📅 ${day}
          </button>`;
        }
        return `
          <button type="button" data-day="${day}"
                  class="day-option card-bordered px-5 py-4 font-semibold text-center min-w-[100px]
                         ${selected ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' : ''}">
            📅 ${day}
          </button>`;
      })
      .join('');
  },

  renderStepTime() {
    const container = document.getElementById('time-options');
    const hint = document.getElementById('time-hint');
    const doctor = this.getDoctor();
    if (!container || !doctor || !this.state.day || !this.state.type) return;
    const app = this.isAppContext();

    const daySchedule = doctor.schedule[this.state.day];
    if (!daySchedule) {
      container.innerHTML = app
        ? '<p class="app-empty">برنامه‌ای برای این روز وجود ندارد.</p>'
        : '<p class="text-slate-500 text-center py-6 col-span-full">برنامه‌ای برای این روز وجود ندارد.</p>';
      return;
    }

    if (this.state.type === 'visit') {
      if (hint) hint.textContent = 'ویزیت: یک ساعت کلی انتخاب کنید (مثلاً ساعت ۱۴)';
      const hours = daySchedule.visitHours || [];
      container.innerHTML = hours
        .map((h) => {
          const booked = PasteurStorage.isSlotBooked(doctor.id, this.state.day, 'visit', h);
          const selected = this.state.timeValue === h;
          if (app) {
            return `
            <label class="time-slot app-option app-option--chip ${booked ? 'is-disabled cursor-not-allowed' : ''} ${selected ? 'is-selected' : ''}">
              <input type="radio" name="visit-time" value="${h}" class="sr-only"
                     ${booked ? 'disabled' : ''} ${selected ? 'checked' : ''} />
              ${PasteurStorage.formatHour(h)}
              ${booked ? '<span class="app-slot-full">پر</span>' : ''}
            </label>`;
          }
          return `
          <label class="time-slot ${booked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        card-bordered px-4 py-3 text-center font-semibold
                        ${selected ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' : ''}">
            <input type="radio" name="visit-time" value="${h}" class="sr-only"
                   ${booked ? 'disabled' : ''} ${selected ? 'checked' : ''} />
            ${PasteurStorage.formatHour(h)}
            ${booked ? '<span class="block text-xs text-red-600 mt-1">پر</span>' : ''}
          </label>`;
        })
        .join('');
    } else {
      if (hint) hint.textContent = 'درمان: یک بازه یک‌ساعته انتخاب کنید (مثلاً ۱۴ تا ۱۵)';
      const slots = daySchedule.treatmentSlots || [];
      container.innerHTML = slots
        .map((slot) => {
          const booked = slot.booked || PasteurStorage.isSlotBooked(doctor.id, this.state.day, 'treatment', slot.start);
          const selected = this.state.timeValue === slot.start;
          if (app) {
            return `
            <label class="time-slot app-option app-option--chip ${booked ? 'is-disabled cursor-not-allowed' : ''} ${selected ? 'is-selected is-selected--blue' : ''}">
              <input type="radio" name="treatment-time" value="${slot.start}" data-label="${slot.label}"
                     class="sr-only" ${booked ? 'disabled' : ''} ${selected ? 'checked' : ''} />
              ${slot.label}
              ${booked ? '<span class="app-slot-full">رزرو شده</span>' : ''}
            </label>`;
          }
          return `
          <label class="time-slot ${booked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        card-bordered px-4 py-3 text-center font-semibold
                        ${selected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : ''}">
            <input type="radio" name="treatment-time" value="${slot.start}" data-label="${slot.label}"
                   class="sr-only" ${booked ? 'disabled' : ''} ${selected ? 'checked' : ''} />
            ${slot.label}
            ${booked ? '<span class="block text-xs text-red-600 mt-1">رزرو شده</span>' : ''}
          </label>`;
        })
        .join('');
    }
  },

  renderStepInfo() {
    const nameInput = document.getElementById('patient-name');
    const phoneInput = document.getElementById('patient-phone');
    const referralInput = document.getElementById('referral-code');
    if (nameInput) nameInput.value = this.state.patientName || '';
    if (phoneInput) phoneInput.value = this.state.patientPhone || '';
    if (referralInput) referralInput.value = this.state.referralCode || '';
    this.renderSummary();
  },

  renderSummary() {
    const el = document.getElementById('booking-summary');
    const doctor = this.getDoctor();
    if (!el || !doctor) return;

    const typeLabel = this.state.type === 'visit' ? 'ویزیت' : 'شروع یا ادامه درمان';
    if (this.isAppContext()) {
      el.innerHTML = `
        <div class="app-card app-summary">
          <div class="app-summary-row"><span class="app-text-muted">پزشک:</span><span class="app-font-bold">${doctor.name}</span></div>
          <div class="app-summary-row"><span class="app-text-muted">نوع:</span><span class="app-font-bold">${typeLabel}</span></div>
          <div class="app-summary-row"><span class="app-text-muted">روز:</span><span class="app-font-bold">${this.state.day || '—'}</span></div>
          <div class="app-summary-row"><span class="app-text-muted">زمان:</span><span class="app-font-bold">${this.state.timeLabel || '—'}</span></div>
        </div>`;
      return;
    }
    el.innerHTML = `
      <div class="card-bordered p-4 bg-slate-50 space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-slate-500">پزشک:</span><span class="font-semibold">${doctor.name}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">نوع:</span><span class="font-semibold">${typeLabel}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">روز:</span><span class="font-semibold">${this.state.day || '—'}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">زمان:</span><span class="font-semibold">${this.state.timeLabel || '—'}</span></div>
      </div>`;
  },

  updateDoctorSummary() {
    const el = document.getElementById('selected-doctor-info');
    const doctor = this.getDoctor();
    if (!el) return;
    if (doctor) {
      if (this.isAppContext()) {
        el.innerHTML = `
          <div class="app-card app-doctor-banner">
            <img src="${doctor.image}" class="app-doctor-thumb" alt="" />
            <div>
              <p class="app-font-bold" style="margin:0">${doctor.name}</p>
              <p class="app-text-sm app-text-teal">${doctor.specialty}</p>
            </div>
          </div>`;
      } else {
        el.innerHTML = `
          <div class="flex items-center gap-3 card-bordered p-3 mb-6 bg-teal-50 border-teal-200">
            <img src="${doctor.image}" class="w-12 h-12 rounded-lg object-cover" alt="" />
            <div>
              <p class="font-bold">${doctor.name}</p>
              <p class="text-sm text-teal-700">${doctor.specialty}</p>
            </div>
          </div>`;
      }
      this.setVisible(el, true);
    } else {
      this.setVisible(el, false);
    }
  },

  bindEvents() {
    document.getElementById('booking-app')?.addEventListener('click', (e) => {
      const typeBtn = e.target.closest('.type-option');
      if (typeBtn) {
        this.state.type = typeBtn.dataset.type;
        this.renderStepType();
        return;
      }

      const doctorBtn = e.target.closest('.doctor-option');
      if (doctorBtn && !doctorBtn.classList.contains('cursor-not-allowed')) {
        this.state.doctorId = parseInt(doctorBtn.dataset.doctor, 10);
        this.state.day = null;
        this.state.timeValue = null;
        this.renderStepDoctor();
        return;
      }

      const dayBtn = e.target.closest('.day-option');
      if (dayBtn) {
        this.state.day = dayBtn.dataset.day;
        this.state.timeValue = null;
        this.renderStepDay();
        this.renderStepTime();
        return;
      }

      const timeSlot = e.target.closest('.time-slot');
      if (timeSlot && !timeSlot.classList.contains('cursor-not-allowed')) {
        const input = timeSlot.querySelector('input');
        if (input && !input.disabled) {
          this.state.timeValue = parseInt(input.value, 10);
          this.state.timeLabel =
            this.state.type === 'visit'
              ? PasteurStorage.formatHour(this.state.timeValue)
              : input.dataset.label || `${this.state.timeValue} تا ${this.state.timeValue + 1}`;
          this.renderStepTime();
        }
      }
    });

    document.getElementById('btn-next')?.addEventListener('click', () => this.next());
    document.getElementById('btn-back')?.addEventListener('click', () => this.back());

    document.getElementById('patient-name')?.addEventListener('input', (e) => {
      this.state.patientName = e.target.value.trim();
    });
    document.getElementById('patient-phone')?.addEventListener('input', (e) => {
      this.state.patientPhone = e.target.value.trim();
    });
    document.getElementById('referral-code')?.addEventListener('input', (e) => {
      this.state.referralCode = e.target.value.trim().toUpperCase();
    });

    document.getElementById('booking-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitBooking();
    });

    const startStep = this.state.doctorId ? 'type' : 'type';
    this.showStep(startStep);
  },

  next() {
    const current = this.steps[this.currentStepIndex()];
    const err = document.getElementById('booking-error');
    if (err) { this.setVisible(err, false); err.textContent = ''; }

    if (current === 'type' && !this.state.type) {
      this.showError('لطفاً نوع خدمت را انتخاب کنید.');
      return;
    }
    if (current === 'doctor' && !this.state.doctorId) {
      this.showError('لطفاً پزشک را انتخاب کنید.');
      return;
    }
    if (current === 'day' && !this.state.day) {
      this.showError('لطفاً روز حضور را انتخاب کنید.');
      return;
    }
    if (current === 'time' && this.state.timeValue == null) {
      this.showError('لطفاً زمان را انتخاب کنید.');
      return;
    }

    const idx = this.currentStepIndex();
      if (idx < this.steps.length - 1) {
      const nextStep = this.steps[idx + 1];
      this.showStep(nextStep);
      if (nextStep === 'day') this.renderStepDay();
      if (nextStep === 'time') this.renderStepTime();
      if (nextStep === 'info') this.renderStepInfo();
    }
  },

  back() {
    const idx = this.currentStepIndex();
    if (idx > 0) this.showStep(this.steps[idx - 1]);
    else window.location.href = 'general.html';
  },

  showError(msg) {
    const err = document.getElementById('booking-error');
    if (err) {
      err.textContent = msg;
      this.setVisible(err, true);
    }
  },

  submitBooking() {
    if (!this.state.patientName || this.state.patientName.length < 2) {
      this.showError('نام و نام خانوادگی را وارد کنید.');
      return;
    }
    const phoneDigits = this.state.patientPhone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 10) {
      this.showError('شماره موبایل معتبر وارد کنید.');
      return;
    }

    const doctor = this.getDoctor();
    const amount = this.state.type === 'visit' ? 350000 : 850000;

    PasteurStorage.setPendingPayment({
      kind: 'booking',
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      type: this.state.type,
      typeLabel: this.state.type === 'visit' ? 'ویزیت' : 'شروع یا ادامه درمان',
      day: this.state.day,
      timeValue: this.state.timeValue,
      timeLabel: this.state.timeLabel,
      patientName: this.state.patientName,
      patientPhone: this.state.patientPhone,
      amount,
      referralCode: this.state.referralCode,
    });

    PasteurStorage.clearPendingBooking();
    window.location.href = 'confirm.html';
  },
};
