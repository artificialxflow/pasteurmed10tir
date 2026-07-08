/**
 * کامپوننت‌های UI — پاستور پلاس
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
    { href: `${base}pages/shop.html`, label: 'تجهیزات', id: 'shop' },
    { href: `${base}pages/gallery.html`, label: 'گالری', id: 'gallery' },
    { href: `${base}pages/club.html`, label: 'باشگاه', id: 'club' },
    { href: `${base}pages/dental/index.html`, label: 'دندانپزشکی', id: 'dental' },
    { href: `${base}pages/consultation.html`, label: 'مشاوره و ویزیت', id: 'consultation' },
    { href: `${base}pages/contact.html`, label: 'تماس با ما', id: 'contact' },
    { href: `${base}pages/partners.html`, label: 'همکاری', id: 'partners' },
    { href: `${base}admin/login.html`, label: 'پنل ادمین', id: 'admin' },
  ];
  const bottomNavItems = [
    { href: `${base}index.html`, label: 'خانه', icon: '🏠', id: 'home' },
    { href: `${base}pages/dental/general.html`, label: 'رزرو', icon: '🦷', id: 'dental' },
    { href: `${base}pages/shop.html`, label: 'تجهیزات', icon: '🛒', id: 'shop' },
    { href: `${base}pages/club.html`, label: 'باشگاه', icon: '🎁', id: 'club' },
    { href: `${base}pages/consultation.html`, label: 'مشاوره', icon: '💬', id: 'consultation' },
  ];

  const navLinks = navItems
    .map(
      (item) => `
      <a href="${item.href}"
         class="px-3 py-2 rounded-full text-xs lg:text-sm font-bold transition-colors
                ${activePage === item.id ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'text-slate-600 hover:bg-white hover:text-cyan-700'}">
        ${item.label}
      </a>`
    )
    .join('');
  const bottomLinks = bottomNavItems
    .map(
      (item) => `
      <a href="${item.href}" class="${activePage === item.id ? 'active' : ''}">
        <span class="text-lg" aria-hidden="true">${item.icon}</span>
        <span>${item.label}</span>
      </a>`
    )
    .join('');

  return `
    <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-cyan-100 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 sm:h-20 gap-4">
          <a href="${base}index.html" class="flex items-center gap-3 min-w-0">
            <img src="${base}assets/logo/logo.png" alt="پاستور پلاس" class="logo-image" />
            <div class="min-w-0">
              <p class="font-extrabold text-slate-900 text-base sm:text-lg leading-tight truncate">
                ${PASTEUR_DATA.institute.nameFa}
              </p>
              <p class="text-xs text-slate-500 hidden sm:block truncate">
                سامانه خدمات مرکز پاستور
              </p>
            </div>
          </a>

          <nav class="hidden md:flex items-center gap-1 rounded-full bg-slate-50/80 border border-slate-100 p-1" aria-label="منوی اصلی">
            ${navLinks}
          </nav>

          <a href="${base}pages/shop.html" class="btn-accent text-sm hidden sm:inline-flex shrink-0">
            💎 VIP تجهیزات
          </a>

          <button id="mobile-menu-btn"
                  class="md:hidden p-2 rounded-xl border border-cyan-200 bg-white/80 text-slate-700 hover:bg-cyan-50 transition-colors"
                  aria-label="باز کردن منو"
                  aria-expanded="false">
            <svg id="mobile-menu-icon-open" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg id="mobile-menu-icon-close" class="hidden w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <nav id="mobile-menu" class="mobile-menu-panel md:hidden" aria-label="منوی موبایل">
          ${navLinks}
        </nav>
      </div>
    </header>
    <nav class="mobile-bottom-nav" aria-label="ناوبری موبایل">
      ${bottomLinks}
    </nav>`;
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
              <img src="${base}assets/logo/logo.png" alt="پاستور پلاس" class="logo-image" />
              <div>
                <p class="font-bold text-slate-900">${institute.nameFa}</p>
                <p class="text-xs text-slate-500">${institute.nameEn}</p>
              </div>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed">
              سامانه خدمات مرکز پاستور برای دندانپزشکی، پزشکی، پرستاری و تجهیزات پزشکی
            </p>
          </div>

          <div>
            <h3 class="font-bold text-slate-900 mb-3 text-sm">دسترسی سریع</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="${base}pages/consultation.html" class="text-slate-600 hover:text-teal-700 transition-colors">مشاوره و ویزیت</a></li>
              <li><a href="${base}pages/gallery.html" class="text-slate-600 hover:text-teal-700 transition-colors">گالری نتایج</a></li>
              <li><a href="${base}pages/club.html" class="text-slate-600 hover:text-teal-700 transition-colors">باشگاه مشتریان</a></li>
              <li><a href="${base}pages/reminders.html" class="text-slate-600 hover:text-teal-700 transition-colors">یادآور هوشمند</a></li>
              <li><a href="${base}pages/dental/index.html" class="text-slate-600 hover:text-teal-700 transition-colors">دندانپزشکی</a></li>
              <li><a href="${base}pages/dental/membership.html" class="text-slate-600 hover:text-teal-700 transition-colors">طرح‌های عضویت</a></li>
              <li><a href="${base}pages/shop.html" class="text-slate-600 hover:text-teal-700 transition-colors">فروشگاه</a></li>
              <li><a href="${base}pages/contact.html" class="text-slate-600 hover:text-teal-700 transition-colors">تماس با ما</a></li>
              <li><a href="${base}pages/partners.html" class="text-slate-600 hover:text-teal-700 transition-colors">درخواست همکاری</a></li>
              <li><a href="${base}pages/privacy.html" class="text-slate-600 hover:text-teal-700 transition-colors">حریم خصوصی</a></li>
            </ul>
          </div>

          <div>
            <h3 class="font-bold text-slate-900 mb-3 text-sm">اطلاعات تماس</h3>
            <ul class="space-y-2 text-sm text-slate-600">
              <li class="flex items-center gap-2">
                <span aria-hidden="true">📞</span>
                <a href="tel:${institute.phoneDigits}" class="hover:text-teal-700">${institute.phone}</a>
              </li>
              <li class="flex items-center gap-2">
                <span aria-hidden="true">📞</span>
                <a href="tel:${institute.phoneAltDigits}" class="hover:text-teal-700">${institute.phoneAlt}</a>
              </li>
              <li class="flex items-center gap-2">
                <span aria-hidden="true">💬</span>
                <a href="https://wa.me/${institute.whatsappDigits}" target="_blank" rel="noopener" class="hover:text-teal-700">واتساپ: ${institute.whatsapp}</a>
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
       class="group card-bordered overflow-hidden block animate-fade-in relative"
       style="animation-delay: ${index * 0.08}s">
      <div class="absolute top-3 left-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 border border-white shadow-sm">
        پاستور پلاس
      </div>
      <div class="relative h-40 sm:h-48 overflow-hidden">
        <img src="${service.image}"
             alt="${service.title}"
             class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
             loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <span class="absolute bottom-3 right-3 text-3xl" aria-hidden="true">${service.emoji}</span>
      </div>
      <div class="p-4 sm:p-5 border-t ${borderClass} transition-colors">
        <h3 class="font-bold text-lg text-slate-900 mb-1">${service.title}</h3>
        <p class="text-sm text-slate-600">${service.description}</p>
        <span class="inline-flex items-center gap-1 mt-4 text-sm font-bold text-cyan-700 group-hover:gap-2 transition-all">
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
           class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-sm shrink-0"
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
  const openIcon = document.getElementById('mobile-menu-icon-open');
  const closeIcon = document.getElementById('mobile-menu-icon-close');

  if (menuBtn && mobileMenu) {
    const setMenuOpen = (isOpen) => {
      mobileMenu.classList.toggle('is-open', isOpen);
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menuBtn.setAttribute('aria-label', isOpen ? 'بستن منو' : 'باز کردن منو');
      openIcon?.classList.toggle('hidden', isOpen);
      closeIcon?.classList.toggle('hidden', !isOpen);
    };

    menuBtn.addEventListener('click', () => {
      setMenuOpen(!mobileMenu.classList.contains('is-open'));
    });

    mobileMenu.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        setMenuOpen(false);
      }
    });

    document.addEventListener('click', (event) => {
      if (!mobileMenu.classList.contains('is-open')) return;
      const clickedInsideHeader = event.target.closest('header');
      if (!clickedInsideHeader) {
        setMenuOpen(false);
      }
    });
  }
}
