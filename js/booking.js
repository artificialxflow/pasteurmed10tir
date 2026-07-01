/**
 * جریان نوبت‌دهی — موسسه پاستور
 */

const BookingFlow = {
  state: {
    type: null,
    doctorId: null,
    day: null,
    timeValue: null,
    timeLabel: null,
    patientName: '',
    patientPhone: '',
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
    document.querySelectorAll('.booking-step').forEach((el) => el.classList.add('hidden'));
    const target = document.getElementById(`step-${stepName}`);
    if (target) target.classList.remove('hidden');

    const idx = this.steps.indexOf(stepName);
    this.updateProgress(idx);
    this.saveDraft(stepName);

    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');
    if (btnNext && btnSubmit) {
      const isLast = stepName === 'info';
      btnNext.classList.toggle('hidden', isLast);
      btnSubmit.classList.toggle('hidden', !isLast);
    }
  },

  saveDraft(stepName) {
    PasteurStorage.setPendingBooking({ step: stepName, data: { ...this.state } });
  },

  renderStepType() {
    const container = document.getElementById('type-options');
    if (!container) return;

    container.innerHTML = `
      <button type="button" data-type="visit"
              class="type-option card-bordered p-6 text-center w-full hover:border-teal-500 transition-all
                     ${this.state.type === 'visit' ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50' : ''}">
        <span class="text-4xl block mb-3">🩺</span>
        <h3 class="font-bold text-lg">ویزیت</h3>
        <p class="text-sm text-slate-600 mt-2">انتخاب ساعت کلی — ویزیت هر زمان قابل انتخاب است</p>
      </button>
      <button type="button" data-type="treatment"
              class="type-option card-bordered p-6 text-center w-full hover:border-blue-500 transition-all
                     ${this.state.type === 'treatment' ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : ''}">
        <span class="text-4xl block mb-3">💉</span>
        <h3 class="font-bold text-lg">شروع یا ادامه درمان</h3>
        <p class="text-sm text-slate-600 mt-2">بازه‌های یک‌ساعته — هر خدمت دقیقاً یک ساعت</p>
      </button>`;
  },

  renderStepDoctor() {
    const container = document.getElementById('doctor-list');
    if (!container) return;

    container.innerHTML = PASTEUR_DATA.dentists
      .map((d) => {
        const status = STATUS_LABELS[d.status] || STATUS_LABELS.inactive;
        const selected = this.state.doctorId === d.id;
        return `
        <button type="button" data-doctor="${d.id}"
                class="doctor-option card-bordered p-4 flex items-center gap-4 w-full text-right
                       ${selected ? 'border-teal-500 ring-2 ring-teal-200' : ''}
                       ${d.status === 'inactive' ? 'opacity-50 cursor-not-allowed' : ''}">
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

    const days = Object.keys(doctor.schedule || {});
    container.innerHTML = days.length
      ? days
          .map(
            (day) => `
          <button type="button" data-day="${day}"
                  class="day-option card-bordered px-5 py-4 font-semibold text-center min-w-[100px]
                         ${this.state.day === day ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' : ''}">
            📅 ${day}
          </button>`
          )
          .join('')
      : '<p class="text-slate-500 col-span-full text-center py-6">روزی برای این پزشک ثبت نشده است.</p>';
  },

  renderStepTime() {
    const container = document.getElementById('time-options');
    const hint = document.getElementById('time-hint');
    const doctor = this.getDoctor();
    if (!container || !doctor || !this.state.day || !this.state.type) return;

    const daySchedule = doctor.schedule[this.state.day];
    if (!daySchedule) {
      container.innerHTML = '<p class="text-slate-500 text-center py-6 col-span-full">برنامه‌ای برای این روز وجود ندارد.</p>';
      return;
    }

    if (this.state.type === 'visit') {
      if (hint) hint.textContent = 'ویزیت: یک ساعت کلی انتخاب کنید (مثلاً ساعت ۱۴)';
      const hours = daySchedule.visitHours || [];
      container.innerHTML = hours
        .map((h) => {
          const booked = PasteurStorage.isSlotBooked(doctor.id, this.state.day, 'visit', h);
          const selected = this.state.timeValue === h;
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
    if (nameInput) nameInput.value = this.state.patientName || '';
    if (phoneInput) phoneInput.value = this.state.patientPhone || '';
    this.renderSummary();
  },

  renderSummary() {
    const el = document.getElementById('booking-summary');
    const doctor = this.getDoctor();
    if (!el || !doctor) return;

    const typeLabel = this.state.type === 'visit' ? 'ویزیت' : 'شروع یا ادامه درمان';
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
      el.innerHTML = `
        <div class="flex items-center gap-3 card-bordered p-3 mb-6 bg-teal-50 border-teal-200">
          <img src="${doctor.image}" class="w-12 h-12 rounded-lg object-cover" alt="" />
          <div>
            <p class="font-bold">${doctor.name}</p>
            <p class="text-sm text-teal-700">${doctor.specialty}</p>
          </div>
        </div>`;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
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
    if (err) { err.classList.add('hidden'); err.textContent = ''; }

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
      err.classList.remove('hidden');
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
    });

    PasteurStorage.clearPendingBooking();
    window.location.href = 'confirm.html';
  },
};
