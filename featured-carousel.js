const card = document.querySelector('#featuredRepairCard');
if (card) {
  const image = document.querySelector('#featuredRepairImage');
  const tag = document.querySelector('#featuredRepairTag');
  const title = document.querySelector('#featuredRepairTitle');
  const meta = document.querySelector('#featuredRepairMeta');
  const link = document.querySelector('#featuredRepairLink');
  const previous = document.querySelector('#featuredRepairPrevious');
  const next = document.querySelector('#featuredRepairNext');
  const pause = document.querySelector('#featuredRepairPause');
  const controls = card.querySelector('.hero-feature-controls');
  const announcement = document.querySelector('#featuredRepairAnnouncement');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let items = [];
  let active = 0;
  let timer = 0;
  let manualPause = reducedMotion.matches;
  let hovered = false;
  let focused = false;
  let transitionTimer = 0;

  const clearTimer = () => { clearTimeout(timer); timer = 0; };
  const canRotate = () => items.length > 1 && !manualPause && !hovered && !focused && !reducedMotion.matches && !document.hidden;
  function updatePauseControl() {
    if (!pause) return;
    pause.textContent = manualPause ? 'Play' : 'Pause';
    pause.setAttribute('aria-label', manualPause ? 'Resume featured repairs' : 'Pause featured repairs');
    pause.setAttribute('aria-pressed', String(manualPause));
    pause.disabled = reducedMotion.matches;
    if (reducedMotion.matches) {
      pause.textContent = 'Autoplay off';
      pause.setAttribute('aria-label', 'Autoplay is disabled by reduced motion preference');
    }
  }
  function render(announce = false) {
    const item = items[active];
    if (!item) return;
    clearTimeout(transitionTimer);
    card.classList.add('is-switching');
    transitionTimer = setTimeout(() => {
      const safeImage = /^https?:\/\//i.test(item.image || '') || String(item.image || '').startsWith('/') ? item.image : '/images/og/repairlens-share.png';
      const safeHref = String(item.href || '').startsWith('/') && !String(item.href).startsWith('//') ? item.href : '/guides.html';
      image.src = safeImage || '/images/og/repairlens-share.png';
      image.alt = item.alt || `Repair example: ${item.title}`;
      tag.textContent = item.tag || 'REPAIR GUIDE';
      title.textContent = item.title || 'Everyday repair';
      meta.textContent = item.kind === 'guide' ? `${item.stepCount} illustrated steps` : (item.outcome || `${item.stepCount} repair steps`);
      link.href = safeHref;
      link.innerHTML = item.kind === 'guide' ? 'Open saved guide <span aria-hidden="true">→</span>' : 'See the repair path <span aria-hidden="true">→</span>';
      if (announce && announcement) announcement.textContent = `${item.title}, ${active + 1} of ${items.length}`;
      requestAnimationFrame(() => card.classList.remove('is-switching'));
    }, 150);
  }
  function schedule() {
    clearTimer();
    if (!canRotate()) return;
    timer = setTimeout(() => {
      active = (active + 1) % items.length;
      render(false);
      schedule();
    }, 3000);
  }
  function move(delta) {
    if (items.length < 2) return;
    active = (active + delta + items.length) % items.length;
    render(true);
    schedule();
  }

  previous?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));
  pause?.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    manualPause = !manualPause;
    updatePauseControl();
    schedule();
  });
  card.addEventListener('mouseenter', () => { hovered = true; clearTimer(); });
  card.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  card.addEventListener('focusin', () => { focused = true; clearTimer(); });
  card.addEventListener('focusout', event => {
    if (!card.contains(event.relatedTarget)) { focused = false; schedule(); }
  });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener?.('change', event => {
    if (event.matches) manualPause = true;
    updatePauseControl();
    schedule();
  });

  updatePauseControl();
  fetch('/api/featured-repairs')
    .then(response => response.ok ? response.json() : Promise.reject(new Error('Featured repairs unavailable')))
    .then(payload => {
      items = Array.isArray(payload.items) ? payload.items : [];
      if (items.length < 2) { if (controls) controls.hidden = true; return; }
      controls.hidden = false;
      active = 0;
      render(false);
      schedule();
    })
    .catch(() => { if (controls) controls.hidden = true; });
}
