const guides = [
  { id: 'bike-flat', area: 'Bike', title: 'Patch a flat tyre', desc: 'Find a puncture, patch the tube, and avoid pinching it on refit.', image: '/images/guides/bike-flat.webp', alt: 'A bicycle wheel with a flat tyre, levers, and patch kit', level: 'Easy', time: '15 min', steps: ['Remove the wheel and fully deflate the tyre.', 'Lift one tyre edge with levers and take out the tube.', 'Find the puncture, check the tyre for debris, and patch or replace the tube.', 'Refit carefully and inflate gradually.'], safety: 'Check the tyre for glass or sharp debris before reaching inside. Keep your hands clear of exposed sharp objects.', tools: ['Tyre levers', 'Pump', 'Patch kit or compatible inner tube'], parts: ['bike inner tube matching tyre size', 'bicycle puncture patch kit'] },
  { id: 'bike-chain', area: 'Bike', title: 'Reseat a slipped chain', desc: 'A clean reset for an intact chain that has dropped off the ring.', image: '/images/generated/bike-chain-story.jpg', alt: 'A person repairing a slipped bicycle chain', level: 'Easy', time: '5 min', steps: ['Pull the derailleur arm forward to make slack.', 'Place the chain on the front ring and rear cog.', 'Turn the pedal backwards by hand.', 'Stop if it skips or appears bent.'], safety: 'Keep fingers away from the chainring teeth and stop if the chain is bent, jammed, or repeatedly slips.', tools: ['Work gloves or cloth', 'Bike stand (optional)'], parts: [] },
  { id: 'window-hinge', area: 'Home', title: 'Tighten a loose window hinge', desc: 'Align a light, sound window before a small draught gets worse.', image: '/images/generated/window-hinge-story.jpg', alt: 'A window hinge being carefully adjusted', level: 'Easy', time: '15 min', steps: ['Support the sash before touching the hinge.', 'Tighten screws evenly.', 'Replace stripped fasteners if appropriate.', 'Test the latch and seal slowly.'], safety: 'Support the window throughout. Stop if the glass is cracked, frame is damaged, or the sash feels heavy or unstable.', tools: ['Correctly sized screwdriver', 'Helper to support a heavy sash'], parts: ['window hinge screws matching frame and hinge'] },
  { id: 'door-hinge', area: 'Home', title: 'Silence a squeaky door', desc: 'A quick lubrication and fastener check for a healthy door hinge.', image: '/images/guides/door-hinge.webp', alt: 'A door hinge being lubricated with a small oil applicator', level: 'Easy', time: '10 min', steps: ['Open the door and identify the noisy hinge.', 'Tighten loose screws without overtightening.', 'Apply a small amount of suitable lubricant to the pin.', 'Open and close slowly to distribute it.'], safety: 'Do not remove hinge pins from a heavy door unless it is safely supported.', tools: ['Screwdriver', 'Hinge lubricant', 'Cloth'], parts: ['door hinge lubricant'] },
  { id: 'kitchen-handle', area: 'Home', title: 'Secure a cabinet handle', desc: 'Stop a loose kitchen handle before it damages the door front.', image: '/images/guides/kitchen-handle.webp', alt: 'A cabinet handle tightened from inside with a screwdriver', level: 'Easy', time: '10 min', steps: ['Hold the handle in its final position.', 'Tighten the rear screws evenly.', 'Add a washer only if it fits safely.', 'Open and close the door to test it.'], safety: 'Use the correctly sized driver and avoid overtightening, which can crack the cabinet front.', tools: ['Correctly sized screwdriver', 'Helper to hold the handle'], parts: ['cabinet handle screws matching existing hole spacing'] },
  { id: 'wall-hole', area: 'Home', title: 'Fill a small wall hole', desc: 'Repair a small, non-structural screw hole ready for touch-up paint.', image: '/images/guides/wall-hole.webp', alt: 'A small hole in a wall being filled with a putty knife', level: 'Easy', time: '30 min + drying', steps: ['Remove loose material and dust from the hole.', 'Press filler in with a small scraper.', 'Let it dry fully, then sand lightly.', 'Touch up with matching paint.'], safety: 'Only fill a small, known, non-structural hole. Stop if you suspect wiring, plumbing, or a larger crack behind the wall.', tools: ['Ready-mixed wall filler', 'Small scraper', 'Fine sandpaper', 'Matching paint'], parts: ['interior wall filler'] },
  { id: 'zipper', area: 'Clothes', title: 'Free a stuck zipper', desc: 'Release trapped fabric without forcing or damaging the teeth.', image: '/images/guides/zipper.webp', alt: 'Fabric gently freed from a jacket zipper with tweezers', level: 'Easy', time: '10 min', steps: ['Lay the garment flat and relieve tension around the zip.', 'Use tweezers to free caught thread or fabric.', 'Apply a little graphite or dry soap to the teeth.', 'Move the slider in tiny motions.'], safety: 'Never force the pull. Stop if teeth are missing or the slider is split.', tools: ['Tweezers', 'Pencil graphite or dry soap'], parts: [] },
  { id: 'seam', area: 'Clothes', title: 'Mend a torn seam', desc: 'Reinforce a short tear on a non-stretch garment seam.', image: '/images/generated/denim-seam-story.jpg', alt: 'A denim seam being stitched by hand', level: 'Easy', time: '20 min', steps: ['Turn the garment inside out and align the edges.', 'Pin or clip the seam in place.', 'Use small backstitches along the old seam line.', 'Knot, trim, and gently test the repair.'], safety: 'Best for a short tear where the surrounding fabric is still strong. Ask a tailor about large or high-stress rips.', tools: ['Needle', 'Matching thread', 'Pins or clips', 'Small scissors'], parts: ['matching sewing thread'] },
  { id: 'button', area: 'Clothes', title: 'Reattach a button', desc: 'A simple, durable button fix with matching thread.', image: '/images/guides/button.webp', alt: 'A button being sewn onto a shirt', level: 'Easy', time: '15 min', steps: ['Mark the original button position.', 'Anchor thread on the reverse side.', 'Sew through the button holes several times.', 'Wrap thread under the button shank and knot securely.'], safety: 'Keep the needle pointed away from your fingers and use a thimble if needed.', tools: ['Needle', 'Matching thread', 'Replacement button if missing'], parts: ['replacement clothing button matching size and shank'] }
];

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
  document.querySelector('#guideGrid').innerHTML = visible.map(guide => `<article class="guide-card"><a class="guide-card__link" href="/guide.html?guide=${guide.id}"><img src="${guide.image}" alt="${guide.alt}" loading="lazy" decoding="async" /><div class="guide-card__body"><span class="guide-card__area">${guide.area.toUpperCase()} · ${guide.level.toUpperCase()}</span><h3>${guide.title}</h3><p>${guide.desc}</p><span class="guide-card__action">Open illustrated guide <span aria-hidden="true">→</span></span></div></a></article>`).join('');
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
