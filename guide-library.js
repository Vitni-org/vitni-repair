import { guides } from './site-data.js';

const params = new URLSearchParams(location.search);
const filters = ['All', 'Bike', 'Home', 'Clothes'];
const pageSize = 6;
let activeArea = filters.includes(params.get('area')) ? params.get('area') : 'All';
let currentPage = Math.max(1, Number(params.get('page')) || 1);

function updateLibraryUrl() {
  const next = new URL(location.href);
  if (activeArea === 'All') next.searchParams.delete('area');
  else next.searchParams.set('area', activeArea);
  if (currentPage === 1) next.searchParams.delete('page');
  else next.searchParams.set('page', String(currentPage));
  history.replaceState({}, '', next);
}

function renderGuideLibrary() {
  if (!document.querySelector('#guideFilters, #guideGrid, #guidePagination')) return;
  const filtered = guides.filter(guide => activeArea === 'All' || guide.area === activeArea);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  currentPage = Math.min(currentPage, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  document.querySelector('#guideFilters').innerHTML = filters.map(name => `<button class="guide-filter" type="button" data-area="${name}" aria-pressed="${name === activeArea}">${name}</button>`).join('');
  document.querySelector('#guideGrid').innerHTML = visible.map(guide => `<article class="guide-card"><a class="guide-card__link" href="/guides/${guide.id}/"><img src="${guide.image}" alt="${guide.alt}" loading="lazy" decoding="async" /><div class="guide-card__body"><span class="guide-card__area">${guide.area.toUpperCase()} · ${guide.level.toUpperCase()}</span><h3>${guide.title}</h3><p>${guide.desc}</p><span class="guide-card__action">Open illustrated guide <span aria-hidden="true">→</span></span></div></a></article>`).join('');
  const firstItem = filtered.length ? ((currentPage - 1) * pageSize) + 1 : 0;
  const lastItem = Math.min(currentPage * pageSize, filtered.length);
  document.querySelector('#guidePagination').innerHTML = pageCount > 1 ? `<button type="button" data-page="previous" ${currentPage === 1 ? 'disabled' : ''}>← Previous</button><span>Showing ${firstItem}–${lastItem} of ${filtered.length}</span><button type="button" data-page="next" ${currentPage === pageCount ? 'disabled' : ''}>Next →</button>` : `<span>${filtered.length} ${filtered.length === 1 ? 'guide' : 'guides'}</span>`;
  document.querySelectorAll('.guide-filter').forEach(button => button.addEventListener('click', () => {
    activeArea = button.dataset.area;
    currentPage = 1;
    updateLibraryUrl();
    renderGuideLibrary();
  }));
}
document.querySelector('#guidePagination')?.addEventListener('click', event => {
  const button = event.target.closest('button[data-page]');
  if (!button || button.disabled) return;
  currentPage += button.dataset.page === 'next' ? 1 : -1;
  updateLibraryUrl();
  renderGuideLibrary();
  document.querySelector('#guideLibraryTitle')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
});
renderGuideLibrary();
