/**
 * اسکریپت اصلی — موسسه پزشکی و سلامت پاستور
 */

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || 'home';
  mountLayout(page);

  if (page === 'home') {
    initLandingPage();
  }
});

function initLandingPage() {
  const servicesGrid = document.getElementById('services-grid');
  if (servicesGrid && typeof PASTEUR_DATA !== 'undefined') {
    servicesGrid.innerHTML = PASTEUR_DATA.services
      .map((service, i) => renderServiceCard(service, i))
      .join('');
  }

  const statsGrid = document.getElementById('stats-grid');
  if (statsGrid && typeof PASTEUR_DATA !== 'undefined') {
    statsGrid.innerHTML = PASTEUR_DATA.stats
      .map(
        (stat) => `
        <div class="text-center p-4 card-bordered">
          <p class="text-2xl sm:text-3xl font-bold text-teal-700">${stat.value}</p>
          <p class="text-sm text-slate-600 mt-1">${stat.label}</p>
        </div>`
      )
      .join('');
  }
}
