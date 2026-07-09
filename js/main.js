/**
 * اسکریپت اصلی — پاستور پلاس
 */

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || 'home';
  mountLayout(page);

  if (page === 'home') {
    initLandingPage();
  }
});

function initLandingPage() {
  const services = typeof PasteurStorage !== 'undefined'
    ? PasteurStorage.getServices().filter((service) => service.active !== false)
    : PASTEUR_DATA.services;

  const quickServicesGrid = document.getElementById('quick-services-grid');
  if (quickServicesGrid) {
    const quickIds = ['dental', 'medical', 'nursing', 'shop'];
    const quickServices = quickIds
      .map((id) => services.find((service) => service.id === id))
      .filter(Boolean);
    quickServicesGrid.innerHTML = quickServices.map((service) => `
      <a href="${service.href}" class="card-bordered p-3 text-center block hover:border-teal-500">
        <p class="text-xl font-extrabold text-cyan-700">${service.emoji || '•'}</p>
        <p class="text-xs text-slate-600 font-bold">${service.title}</p>
      </a>
    `).join('');
  }

  const servicesGrid = document.getElementById('services-grid');
  if (servicesGrid && typeof PASTEUR_DATA !== 'undefined') {
    servicesGrid.innerHTML = services
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
