import { guides as curatedGuides } from './site-data.js';

const filters = ['All', 'Bike', 'Home', 'Clothes'];
const pageSize = 6;
const params = new URLSearchParams(location.search);
let activeArea = filters.includes(params.get('area')) ? params.get('area') : 'All';
let searchQuery = params.get('q') || '';
let currentPage = Math.max(1, Number(params.get('page')) || 1);
let cursor = params.get('cursor') || null;
let nextCursor = null;
let previousCursor = null;
let requestSequence = 0;
const filterNav = document.querySelector('#guideFilters');
const grid = document.querySelector('#guideGrid');
const pagination = document.querySelector('#guidePagination');
const status = document.querySelector('#guideLibraryStatus');
const search = document.querySelector('#guideLibraryQuery');
if (search) search.value = searchQuery;

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function localPage() {
  const words = searchQuery.trim().toLowerCase();
  const matches = curatedGuides.filter(guide => (activeArea === 'All' || guide.area === activeArea)
    && (!words || [guide.title, guide.desc, guide.area, ...guide.tools, ...guide.steps].join(' ').toLowerCase().includes(words)));
  let offset = 0;
  if (cursor) {
    try { offset = JSON.parse(atob(cursor.replaceAll('-', '+').replaceAll('_', '/'))).offset || 0; } catch { offset = 0; }
  }
  const items = matches.slice(offset, offset + pageSize).map(guide => ({
    ...guide,
    slug: guide.id,
    status: 'published',
    visibility: 'public',
    steps: guide.steps.map((instruction, index) => ({ title: `Step ${index + 1}`, instruction, image: '' }))
  }));
  const makeCursor = offsetValue => btoa(JSON.stringify({ offset: offsetValue })).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return {
    items,
    total: matches.length,
    nextCursor: offset + pageSize < matches.length ? makeCursor(offset + pageSize) : null,
    previousCursor: offset > 0 ? makeCursor(Math.max(0, offset - pageSize)) : null,
    persistent: false
  };
}

function updateUrl() {
  const next = new URL(location.href);
  if (activeArea === 'All') next.searchParams.delete('area');
  else next.searchParams.set('area', activeArea);
  if (searchQuery) next.searchParams.set('q', searchQuery);
  else next.searchParams.delete('q');
  if (currentPage > 1) next.searchParams.set('page', String(currentPage));
  else next.searchParams.delete('page');
  if (cursor) next.searchParams.set('cursor', cursor);
  else next.searchParams.delete('cursor');
  history.replaceState({}, '', next);
}

function renderCards(items) {
  if (!items.length) {
    grid.innerHTML = '<p class="guide-library-empty">No saved guides match that search yet. Try a shorter description or another category.</p>';
    return;
  }
  grid.innerHTML = items.map(guide => {
    const slug = guide.slug || guide.id;
    const image = guide.image || '/images/og/repairlens-share.png';
    const imageAlt = guide.alt || `Repair illustration for ${guide.title}`;
    return `<article class="guide-card"><a class="guide-card__link" href="/guides/${encodeURIComponent(slug)}/"><img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}" width="720" height="720" loading="lazy" decoding="async" /><div class="guide-card__body"><span class="guide-card__area">${escapeHtml(String(guide.area).toUpperCase())} · ${escapeHtml(String(guide.level || 'Guide').toUpperCase())}</span><h3>${escapeHtml(guide.title)}</h3><p>${escapeHtml(guide.desc)}</p><span class="guide-card__action">Open illustrated guide <span aria-hidden="true">→</span></span></div></a></article>`;
  }).join('');
}

function renderPagination(data) {
  nextCursor = data.nextCursor;
  previousCursor = data.previousCursor;
  pagination.innerHTML = `<button type="button" data-page="previous" ${!previousCursor ? 'disabled' : ''}>← Previous</button><span>Page ${currentPage} · ${(data.items || []).length} guides</span><button type="button" data-page="next" ${!nextCursor ? 'disabled' : ''}>Next →</button>`;
}

async function renderGuideLibrary() {
  if (!filterNav || !grid || !pagination || !status) return;
  const sequence = ++requestSequence;
  filterNav.innerHTML = filters.map(name => `<button class="guide-filter" type="button" data-area="${name}" aria-pressed="${name === activeArea}">${name}</button>`).join('');
  status.textContent = 'Searching saved repair guides…';
  grid.setAttribute('aria-busy', 'true');
  let data;
  let usingFallback = false;
  try {
    const query = new URLSearchParams({ q: searchQuery, area: activeArea, limit: String(pageSize) });
    if (cursor) query.set('cursor', cursor);
    const response = await fetch(`/api/guides?${query}`);
    if (!response.ok) throw new Error('The shared guide library is unavailable.');
    data = await response.json();
  } catch {
    data = localPage();
    usingFallback = true;
  }
  if (sequence !== requestSequence) return;
  grid.setAttribute('aria-busy', 'false');
  renderCards(data.items || []);
  renderPagination(data);
  const onPage = (data.items || []).length;
  const categoryLabel = activeArea === 'All' ? '' : `${activeArea.toLowerCase()} `;
  status.textContent = usingFallback
    ? `Shared library unavailable. Showing ${onPage} local starter ${categoryLabel}guides on page ${currentPage}.`
    : `Showing ${onPage} ${categoryLabel}guides on page ${currentPage}${data.persistent ? ' from the shared library' : ''}.`;
}

filterNav?.addEventListener('click', event => {
  const button = event.target.closest('button[data-area]');
  if (!button) return;
  activeArea = filters.includes(button.dataset.area) ? button.dataset.area : 'All';
  currentPage = 1;
  cursor = null;
  updateUrl();
  renderGuideLibrary().then(() => filterNav.querySelector(`[data-area="${CSS.escape(activeArea)}"]`)?.focus({ preventScroll: true }));
});

pagination?.addEventListener('click', event => {
  const button = event.target.closest('button[data-page]');
  if (!button || button.disabled) return;
  if (button.dataset.page === 'next' && nextCursor) { cursor = nextCursor; currentPage += 1; }
  else if (button.dataset.page === 'previous' && previousCursor) { cursor = previousCursor; currentPage = Math.max(1, currentPage - 1); }
  updateUrl();
  renderGuideLibrary().then(() => {
    document.querySelector('#guideLibraryTitle')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    pagination.querySelector(`[data-page="${button.dataset.page}"]`)?.focus({ preventScroll: true });
  });
});

let searchTimer;
search?.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = search.value.trim();
    currentPage = 1;
    cursor = null;
    updateUrl();
    renderGuideLibrary();
  }, 240);
});
search?.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  clearTimeout(searchTimer);
  searchQuery = search.value.trim();
  currentPage = 1;
  cursor = null;
  updateUrl();
  renderGuideLibrary();
});

renderGuideLibrary();
