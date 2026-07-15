/**
 * App Shell components — پاستور پلاس
 */
const APP_VIEW_KEY = 'pasteur_app_view';
const APP_BOTTOM_NAV = [
  { id: 'home', label: 'خانه', icon: '🏠', href: 'index.html' },
  { id: 'dental', label: 'رزرو', icon: '🦷', href: 'dental/general.html' },
  { id: 'shop', label: 'تجهیزات', icon: '🛒', href: 'shop.html' },
  { id: 'club', label: 'باشگاه', icon: '🎁', href: 'club.html' },
  { id: 'consultation', label: 'مشاوره', icon: '💬', href: 'consultation.html' },
];

function getAppFolderDepth() {
  const path = window.location.pathname.replace(/\\/g, '/');
  const appIndex = path.indexOf('/app/');
  if (appIndex === -1) return 0;
  const after = path.slice(appIndex + 5);
  const parts = after.split('/').filter(Boolean);
  return parts.filter((p) => !p.endsWith('.html')).length;
}

function siteBase() {
  return getAppFolderDepth() >= 1 ? '../../' : '../';
}

function appBase() {
  return getAppFolderDepth() >= 1 ? '../' : '';
}

function appHref(relativePath) {
  return `${appBase()}${relativePath}`;
}

function renderAppBar(title, options = {}) {
  const { backHref, actionHref, actionLabel } = options;
  const back = backHref
    ? `<a href="${backHref}" class="app-bar-back" aria-label="بازگشت">→</a>`
    : `<span class="app-bar-back">🏥</span>`;
  const action = actionHref && actionLabel ? `<a href="${actionHref}" class="text-xs font-bold text-cyan-700 px-2 py-1 rounded-full bg-cyan-50">${actionLabel}</a>` : '';
  return `<header class="app-bar">${back}<h1 class="app-bar-title">${title}</h1>${action}</header>`;
}

function renderAppBottomNav(activePage) {
  return `<nav class="app-bottom-nav">${APP_BOTTOM_NAV.map((item) => `
    <a href="${appHref(item.href)}" class="${activePage === item.id ? 'active' : ''}">
      <span>${item.icon}</span><span>${item.label}</span>
    </a>`).join('')}</nav>`;
}

function renderAppTile({ emoji, title, desc, href }) {
  return `<a href="${href}" class="app-tile"><span style="font-size:1.75rem">${emoji}</span><p style="font-weight:800;margin:.4rem 0 0">${title}</p>${desc ? `<p style="font-size:.72rem;color:#64748b;margin:.25rem 0 0">${desc}</p>` : ''}</a>`;
}

function mountAppLayout(options = {}) {
  const { page = '', title = 'پاستور پلاس', backHref = null, actionHref = null, actionLabel = null, showNav = true } = options;
  document.documentElement.classList.add('app-html');
  const chrome = document.getElementById('app-chrome');
  if (chrome) chrome.innerHTML = renderAppBar(title, { backHref, actionHref, actionLabel });
  const navHost = document.getElementById('app-nav');
  if (navHost) navHost.innerHTML = showNav ? renderAppBottomNav(page) : '';
}

function showAppSnackbar(message, durationMs = 2800) {
  const el = document.getElementById('app-snackbar');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(showAppSnackbar._t);
  showAppSnackbar._t = setTimeout(() => el.classList.remove('is-visible'), durationMs);
}

function setAppViewPreference(enabled = true) {
  try { localStorage.setItem(APP_VIEW_KEY, enabled ? '1' : '0'); } catch (_) {}
}

function shouldAutoOpenAppView() {
  try { return localStorage.getItem(APP_VIEW_KEY) === '1'; } catch (_) { return false; }
}

function maybeRedirectToAppView() {
  const path = window.location.pathname.replace(/\\/g, '/');
  if (path.includes('/app/') || path.includes('/admin/')) return;
  if (window.matchMedia('(max-width: 767px)').matches && shouldAutoOpenAppView()) {
    window.location.replace('app/index.html');
  }
}

function initAppLandingEntry() {
  document.getElementById('enter-app-view')?.addEventListener('click', () => setAppViewPreference(true));
  document.getElementById('app-mockup-link')?.addEventListener('click', () => setAppViewPreference(true));
  maybeRedirectToAppView();
}

function appWebVersionLink() {
  const href = getAppFolderDepth() >= 1 ? '../../index.html' : '../index.html';
  return `<a href="${href}" class="app-link-web" style="display:block;text-align:center;margin-top:1rem;font-size:.78rem;color:#64748b">نسخه وب کامل</a>`;
}
