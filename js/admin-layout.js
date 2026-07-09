/**
 * Layout پنل ادمین — پاستور پلاس
 */

function requireAdmin() {
  if (!PasteurStorage.isAdminLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function getAdminNavItems() {
  return [
    { href: 'dashboard.html', label: 'داشبورد', icon: '📊', id: 'dashboard' },
    { href: 'bookings.html', label: 'رزروها', icon: '📅', id: 'bookings' },
    { href: 'consultations.html', label: 'مشاوره‌ها', icon: '💬', id: 'consultations' },
    { href: 'reminders.html', label: 'یادآورها', icon: '🔔', id: 'reminders' },
    { href: 'services.html', label: 'سرویس‌ها', icon: '🧩', id: 'services' },
    { href: 'club.html', label: 'باشگاه', icon: '🎁', id: 'club' },
    { href: 'gallery.html', label: 'گالری', icon: '🖼️', id: 'gallery' },
    { href: 'visitors.html', label: 'ویزیتورها', icon: '👤', id: 'visitors' },
    { href: 'commissions.html', label: 'پورسانت‌ها', icon: '💰', id: 'commissions' },
    { href: 'facilities.html', label: 'تسهیلات', icon: '🤝', id: 'facilities' },
    { href: 'partners.html', label: 'همکاری‌ها', icon: '🧑‍⚕️', id: 'partners' },
    { href: 'doctors.html', label: 'پزشکان', icon: '🩺', id: 'doctors' },
    { href: 'memberships.html', label: 'عضویت‌ها', icon: '💎', id: 'memberships' },
    { href: 'shop.html', label: 'فروشگاه', icon: '🛒', id: 'shop' },
  ];
}

function getAdminPageInfo(activeId) {
  const pages = {
    dashboard: {
      icon: '📊',
      title: 'نمای کلی عملکرد پاستور پلاس',
      description: 'آمار رزروها، درآمد، عضویت‌ها و پورسانت معرف‌ها را از همین صفحه پیگیری کنید.',
      points: ['فیلتر روز، هفته و ماه', 'رزروهای اخیر', 'خلاصه درآمد و پورسانت'],
    },
    bookings: {
      icon: '📅',
      title: 'مدیریت رزروهای دندانپزشکی',
      description: 'رزروهای ویزیت و درمان در این بخش دیده می‌شوند و امکان لغو رزروهای فعال وجود دارد.',
      points: ['فیلتر ویزیت و درمان', 'نمایش وضعیت پرداخت', 'لغو رزروهای فعال'],
    },
    consultations: {
      icon: '💬',
      title: 'درخواست‌های مشاوره و ویزیت',
      description: 'درخواست‌های ثبت‌شده از فرم مشاوره و ویزیت، شامل دسته خدمت، توضیح بیمار و تخمین هزینه اینجا نمایش داده می‌شود.',
      points: ['متنی، تصویری، ویدیویی یا تلفنی', 'وضعیت پاسخ‌گویی', 'ثبت امتیاز باشگاه'],
    },
    reminders: {
      icon: '🔔',
      title: 'یادآورهای هوشمند بیماران',
      description: 'یادآورها بعد از رزرو موفق ساخته می‌شوند تا پیگیری نوبت و اطلاع‌رسانی ساده‌تر باشد.',
      points: ['زمان نوبت', 'نوع یادآور', 'وضعیت فعال یا غیرفعال'],
    },
    services: {
      icon: '🧩',
      title: 'مدیریت سرویس‌های صفحه اصلی',
      description: 'کارت‌های مسیرهای اصلی سایت از این بخش قابل افزودن، ویرایش، حذف و فعال یا غیرفعال کردن هستند.',
      points: ['افزودن مسیر جدید', 'ویرایش لینک و تصویر', 'کنترل نمایش در صفحه اصلی'],
    },
    club: {
      icon: '🎁',
      title: 'باشگاه مشتریان',
      description: 'امتیازها، تعداد مراجعه، معرفی بیمار جدید و پاداش‌های دریافت‌شده بیماران در این بخش مدیریت می‌شود.',
      points: ['سطح‌بندی مشتریان', 'امتیاز مراجعات', 'امتیاز معرفی بیمار'],
    },
    gallery: {
      icon: '🖼️',
      title: 'مدیریت گالری نتایج',
      description: 'نمونه‌کارهای قبل و بعد خدمات دندانپزشکی، لیزر و زیبایی را برای نمایش در سایت مدیریت کنید.',
      points: ['افزودن نمونه‌کار', 'تصاویر قبل و بعد', 'حذف موارد قدیمی'],
    },
    visitors: {
      icon: '👤',
      title: 'مدیریت ویزیتورها و کد معرف',
      description: 'کدهای معرف، درصد پورسانت و وضعیت فعال بودن هر ویزیتور از این منو کنترل می‌شود.',
      points: ['ثبت کد معرف', 'درصد پورسانت', 'فعال یا غیرفعال کردن ویزیتور'],
    },
    commissions: {
      icon: '💰',
      title: 'گزارش پورسانت‌ها',
      description: 'پورسانت‌های ایجادشده از رزرو، عضویت و VIP تجهیزات در این صفحه قابل بررسی و تسویه هستند.',
      points: ['کل پورسانت', 'پرداخت‌شده', 'در انتظار تسویه'],
    },
    facilities: {
      icon: '🤝',
      title: 'درخواست‌های تسهیلات تجهیزات',
      description: 'درخواست‌های خرید اقساطی یا تسهیلات تجهیزات پزشکی برای مشتریان VIP در این بخش دیده می‌شود.',
      points: ['نام و موبایل مشتری', 'مبلغ تقریبی', 'وضعیت بررسی'],
    },
    partners: {
      icon: '🧑‍⚕️',
      title: 'درخواست‌های همکاری متخصصان',
      description: 'درخواست همکاری پرستاران، دندانپزشکان، پزشکان و روانشناسان از این صفحه بررسی و وضعیت‌دهی می‌شود.',
      points: ['نوع همکاری', 'تخصص و شهر', 'وضعیت بررسی'],
    },
    doctors: {
      icon: '🩺',
      title: 'مدیریت پزشکان مرکز',
      description: 'لیست پزشکان، تخصص‌ها، روزهای حضور و وضعیت پذیرش از این بخش قابل مشاهده است.',
      points: ['روزها و ساعات حضور', 'وضعیت آزاد یا مشغول', 'افزودن نمایشی پزشک'],
    },
    memberships: {
      icon: '💎',
      title: 'مدیریت عضویت‌های دندانپزشکی',
      description: 'پرداخت‌ها، فرم‌های پیشنهاد صدور عضویت و پلن‌های عادی/VIP در این بخش مدیریت می‌شوند.',
      points: ['عضویت عادی و VIP', 'فرم‌های رسمی عضویت', 'کد معرف و مبلغ پرداختی'],
    },
    shop: {
      icon: '🛒',
      title: 'مدیریت فروشگاه تجهیزات',
      description: 'محصولات، موجودی، سفارش‌های ثبت‌شده و قیمت تجهیزات پزشکی و دندانپزشکی از این منو مدیریت می‌شود.',
      points: ['مدیریت سفارش‌ها', 'کنترل موجودی', 'افزودن محصول حرفه‌ای'],
    },
  };
  return pages[activeId];
}

function mountAdminPageIntro(activeId) {
  const main = document.querySelector('.admin-main main');
  const page = getAdminPageInfo(activeId);
  if (!main || !page || main.querySelector('.admin-page-intro')) return;

  main.insertAdjacentHTML('afterbegin', `
    <section class="admin-page-intro card-bordered p-5 sm:p-6 mb-6 bg-white">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div class="flex items-start gap-4">
          <span class="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-2xl shrink-0">${page.icon}</span>
          <div>
            <h2 class="font-extrabold text-slate-900 text-lg">${page.title}</h2>
            <p class="text-sm text-slate-600 leading-7 mt-1">${page.description}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:min-w-[420px]">
          ${page.points.map((point) => `<div class="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">${point}</div>`).join('')}
        </div>
      </div>
    </section>
  `);
}

function mountAdminLayout(activeId = 'dashboard') {
  if (!requireAdmin()) return;

  const sidebar = document.getElementById('admin-sidebar');
  const header = document.getElementById('admin-header');

  if (sidebar) {
    sidebar.innerHTML = `
      <div class="p-4 border-b-2 border-slate-700">
        <div class="flex items-center gap-3">
          <img src="../assets/logo/logo.png" alt="پاستور پلاس" class="logo-image" />
          <div>
            <p class="font-bold text-sm">پنل مدیریت</p>
            <p class="text-xs text-slate-400">پاستور پلاس</p>
          </div>
        </div>
      </div>
      <nav class="p-3 space-y-1 flex-1">
        ${getAdminNavItems()
          .map(
            (item) => `
          <a href="${item.href}"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${activeId === item.id ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}">
            <span>${item.icon}</span>
            ${item.label}
          </a>`
          )
          .join('')}
      </nav>
      <div class="p-3 border-t border-slate-700">
        <a href="../index.html" class="block text-center text-xs text-slate-400 hover:text-white mb-2">مشاهده سایت</a>
        <button id="admin-logout" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700">
          خروج
        </button>
      </div>`;
  }

  if (header) {
    header.innerHTML = `
      <div class="flex items-center justify-between">
        <button id="admin-menu-toggle" class="lg:hidden p-2 rounded-lg border border-slate-200">☰</button>
        <h1 class="font-bold text-slate-900 text-lg" id="admin-page-title"></h1>
        <span class="text-sm text-slate-500">${new Date().toLocaleDateString('fa-IR')}</span>
      </div>`;
  }

  mountAdminPageIntro(activeId);

  document.getElementById('admin-logout')?.addEventListener('click', () => {
    PasteurStorage.adminLogout();
    window.location.href = 'login.html';
  });

  document.getElementById('admin-menu-toggle')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar')?.classList.toggle('-translate-x-full');
  });
}

function setAdminTitle(title) {
  const el = document.getElementById('admin-page-title');
  if (el) el.textContent = title;
}

function renderDataTable(headers, rows, emptyMessage = 'داده‌ای یافت نشد.') {
  if (!rows.length) {
    return `<p class="text-slate-500 text-center py-8 card-bordered">${emptyMessage}</p>`;
  }
  return `
    <div class="overflow-x-auto card-bordered">
      <table class="w-full text-sm text-right">
        <thead class="bg-slate-50 border-b-2 border-slate-200">
          <tr>${headers.map((h) => `<th class="px-4 py-3 font-semibold text-slate-700">${h}</th>`).join('')}</tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${rows.join('')}
        </tbody>
      </table>
    </div>`;
}
