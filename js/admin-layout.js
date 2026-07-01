/**
 * Layout پنل ادمین — موسسه پاستور
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
    { href: 'club.html', label: 'باشگاه', icon: '🏆', id: 'club' },
    { href: 'gallery.html', label: 'گالری', icon: '🖼️', id: 'gallery' },
    { href: 'doctors.html', label: 'پزشکان', icon: '👨‍⚕️', id: 'doctors' },
    { href: 'memberships.html', label: 'عضویت‌ها', icon: '💎', id: 'memberships' },
    { href: 'shop.html', label: 'فروشگاه', icon: '🛒', id: 'shop' },
  ];
}

function mountAdminLayout(activeId = 'dashboard') {
  if (!requireAdmin()) return;

  const sidebar = document.getElementById('admin-sidebar');
  const header = document.getElementById('admin-header');

  if (sidebar) {
    sidebar.innerHTML = `
      <div class="p-4 border-b-2 border-slate-700">
        <div class="flex items-center gap-3">
          <div class="logo-placeholder text-lg">🏥</div>
          <div>
            <p class="font-bold text-sm">پنل مدیریت</p>
            <p class="text-xs text-slate-400">موسسه پاستور</p>
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
