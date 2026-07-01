/**
 * کامپوننت‌های UI — موسسه پزشکی و سلامت پاستور
 */

const STATUS_LABELS = {
  available: { text: 'آزاد', class: 'badge-available' },
  busy: { text: 'مشغول', class: 'badge-busy' },
  inactive: { text: 'غیرفعال', class: 'badge-inactive' },
};

function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/pages/') || path.includes('/admin/')) {
    return path.includes('/pages/dental/') ? '../../' : '../';
  }
  return '';
}

function renderHeader(activePage = '') {
  const base = getBasePath();
  const navItems = [
    { href: `${base}index.html`, label: 'صفحه اصلی', id: 'home' },
    { href: `${base}pages/dental/index.html`, label: 'دندانپزشکی', id: 'dental' },
    { href: `${base}pages/medical.html`, label: 'پزشکی', id: 'medical' },
    { href: `${base}pages/shop.html`, label: 'فروشگاه', id: 'shop' },
    { href: `${base}admin/login.html`, label: 'پنل ادمین', id: 'admin' },
  ];

  const navLinks = navItems
    .map(
      (item) => `
      <a href="${item.href}"
         class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activePage === item.id ? 'bg-teal-100 text-teal-800 border-2 border-teal-300' : 'text-slate-700 hover:bg-slate-100 hover:text-teal-700'}">
        ${item.label}
      </a>`
    )
    .join('');

  return `
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b-2 border-slate-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 sm:h-18 gap-4">
          <a href="${base}index.html" class="flex items-center gap-3 min-w-0">
            <div class="logo-placeholder" aria-hidden="true">🏥</div>
            <div class="min-w-0">
              <p class="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                ${PASTEUR_DATA.institute.nameFa}
              </p>
              <p class="text-xs text-slate-500 hidden sm:block truncate">
                ${PASTEUR_DATA.institute.nameEn}
              </p>
            </div>
          </a>

          <nav class="hidden md:flex items-center gap-1" aria-label="منوی اصلی">
            ${navLinks}
          </nav>

          <a href="${base}pages/dental/general.html" class="btn-primary text-sm hidden sm:inline-flex shrink-0">
            رزرو نوبت
          </a>

          <button id="mobile-menu-btn"
                  class="md:hidden p-2 rounded-lg border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                  aria-label="باز کردن منو"
                  aria-expanded="false">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>

        <nav id="mobile-menu" class="hidden md:hidden pb-4 flex flex-col gap-1" aria-label="منوی موبایل">
          ${navLinks}
          <a href="${base}pages/dental/general.html" class="btn-primary text-sm mt-2 text-center">
            رزرو نوبت
          </a>
        </nav>
      </div>
    </header>`;
}

function renderFooter() {
  const base = getBasePath();
  const { institute } = PASTEUR_DATA;

  return `
    <footer class="bg-white border-t-2 border-slate-200 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="logo-placeholder text-lg">🏥</div>
              <div>
                <p class="font-bold text-slate-900">${institute.nameFa}</p>
                <p class="text-xs text-slate-500">${institute.nameEn}</p>
              </div>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed">
              ارائه‌دهنده خدمات جامع پزشکی، دندانپزشکی و سلامت در تبریز
            </p>
          </div>

          <div>
            <h3 class="font-bold text-slate-900 mb-3 text-sm">دسترسی سریع</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="${base}pages/dental/index.html" class="text-slate-600 hover:text-teal-700 transition-colors">دندانپزشکی</a></li>
              <li><a href="${base}pages/medical.html" class="text-slate-600 hover:text-teal-700 transition-colors">پزشکی</a></li>
              <li><a href="${base}pages/dental/membership.html" class="text-slate-600 hover:text-teal-700 transition-colors">طرح‌های عضویت</a></li>
              <li><a href="${base}pages/shop.html" class="text-slate-600 hover:text-teal-700 transition-colors">فروشگاه</a></li>
            </ul>
          </div>

          <div>
            <h3 class="font-bold text-slate-900 mb-3 text-sm">اطلاعات تماس</h3>
            <ul class="space-y-2 text-sm text-slate-600">
              <li class="flex items-center gap-2">
                <span aria-hidden="true">📞</span>
                <a href="tel:${institute.phone.replace(/[^\d]/g, '')}" class="hover:text-teal-700">${institute.phone}</a>
              </li>
              <li class="flex items-start gap-2">
                <span aria-hidden="true">📍</span>
                <span>${institute.address}</span>
              </li>
              <li class="flex items-center gap-2">
                <span aria-hidden="true">🗺️</span>
                <span>محدوده خدمات: ${institute.serviceArea}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          © ${new Date().getFullYear()} ${institute.shortNameFa} — ${institute.shortNameEn}. تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>`;
}

function renderServiceCard(service, index = 0) {
  const colorMap = {
    teal: 'border-teal-300 hover:border-teal-500 group-hover:bg-teal-50',
    blue: 'border-blue-300 hover:border-blue-500 group-hover:bg-blue-50',
    rose: 'border-rose-300 hover:border-rose-500 group-hover:bg-rose-50',
    purple: 'border-purple-300 hover:border-purple-500 group-hover:bg-purple-50',
    amber: 'border-amber-300 hover:border-amber-500 group-hover:bg-amber-50',
  };
  const borderClass = colorMap[service.color] || colorMap.teal;

  return `
    <a href="${service.href}"
       class="group card-bordered overflow-hidden block animate-fade-in"
       style="animation-delay: ${index * 0.08}s">
      <div class="relative h-40 sm:h-44 overflow-hidden">
        <img src="${service.image}"
             alt="${service.title}"
             class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
             loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <span class="absolute bottom-3 right-3 text-3xl" aria-hidden="true">${service.emoji}</span>
      </div>
      <div class="p-4 sm:p-5 border-t-2 ${borderClass} transition-colors">
        <h3 class="font-bold text-lg text-slate-900 mb-1">${service.title}</h3>
        <p class="text-sm text-slate-600">${service.description}</p>
        <span class="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-teal-700 group-hover:gap-2 transition-all">
          مشاهده و رزرو
          <svg class="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </a>`;
}

function renderDoctorCard(doctor, basePath = '') {
  const status = STATUS_LABELS[doctor.status] || STATUS_LABELS.inactive;
  const bookingHref = `${basePath}pages/dental/booking.html?doctor=${doctor.id}`;

  return `
    <article class="card-bordered p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <img src="${doctor.image}"
           alt="${doctor.name}"
           class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-slate-200 shrink-0"
           loading="lazy" />
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <h3 class="font-bold text-slate-900">${doctor.name}</h3>
          <span class="badge ${status.class}">${status.text}</span>
        </div>
        <p class="text-sm text-teal-700 font-medium mb-2">${doctor.specialty}</p>
        <div class="flex flex-wrap gap-3 text-xs text-slate-600">
          <span class="flex items-center gap-1">
            <span aria-hidden="true">📅</span>
            ${doctor.days.join('، ')}
          </span>
          <span class="flex items-center gap-1">
            <span aria-hidden="true">🕐</span>
            ${doctor.hours}
          </span>
        </div>
      </div>
      <a href="${bookingHref}" class="btn-primary text-sm shrink-0 w-full sm:w-auto text-center">
        انتخاب و رزرو
      </a>
    </article>`;
}

function renderStatusBadge(status) {
  const info = STATUS_LABELS[status] || STATUS_LABELS.inactive;
  return `<span class="badge ${info.class}">${info.text}</span>`;
}

function mountLayout(activePage = '') {
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');

  if (headerEl) headerEl.innerHTML = renderHeader(activePage);
  if (footerEl) footerEl.innerHTML = renderFooter();

  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('hidden') === false;
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });
  }
}
