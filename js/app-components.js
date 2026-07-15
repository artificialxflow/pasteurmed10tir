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
  const logoSrc = `${siteBase()}assets/logo/logo.png`;
  const backButton = backHref
    ? `<a href="${backHref}" class="app-bar-back" aria-label="بازگشت">→</a>`
    : `<img src="${logoSrc}" alt="" class="app-bar-logo" />`;
  const action = actionHref && actionLabel
    ? `<a href="${actionHref}" class="app-bar-action">${actionLabel}</a>`
    : '';

  return `
    <div class="app-status-bar" aria-hidden="true"><span></span></div>
    <header class="app-bar">
      ${backButton}
      <h1 class="app-bar-title">${title}</h1>
      ${action}
    </header>`;
}

function renderAppBottomNav(activePage) {
  return `<nav class="app-bottom-nav" aria-label="ناوبری اپ">${APP_BOTTOM_NAV.map((item) => `
    <a href="${appHref(item.href)}" class="${activePage === item.id ? 'active' : ''}">
      <span aria-hidden="true">${item.icon}</span>
      <span>${item.label}</span>
    </a>`).join('')}</nav>`;
}

function renderAppTile({ emoji, title, desc, href }) {
  return `
    <a href="${href}" class="app-tile">
      <span class="app-tile-emoji">${emoji}</span>
      <p class="app-tile-title">${title}</p>
      ${desc ? `<p class="app-tile-desc">${desc}</p>` : ''}
    </a>`;
}

function mountAppLayout(options = {}) {
  const {
    page = '',
    title = 'پاستور پلاس',
    backHref = null,
    actionHref = null,
    actionLabel = null,
    showNav = true,
  } = options;

  document.documentElement.classList.add('app-html');

  const chrome = document.getElementById('app-chrome');
  if (chrome) chrome.innerHTML = renderAppBar(title, { backHref, actionHref, actionLabel });

  const navHost = document.getElementById('app-nav');
  const mainEl = document.getElementById('app-main') || document.querySelector('.app-main');
  const snackbar = document.getElementById('app-snackbar');

  if (navHost) navHost.innerHTML = showNav ? renderAppBottomNav(page) : '';
  if (mainEl) mainEl.classList.toggle('app-main--no-nav', !showNav);
  if (snackbar) snackbar.classList.toggle('app-snackbar--no-nav', !showNav);
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

function appWebVersionLink(label = 'نسخه وب کامل') {
  const href = getAppFolderDepth() >= 1 ? '../../index.html' : '../index.html';
  return `<a href="${href}" class="app-link-web">${label}</a>`;
}
