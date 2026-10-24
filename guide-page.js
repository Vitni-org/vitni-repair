const guideId = new URLSearchParams(location.search).get('guide');
const guide = guides.find(item => item.id === guideId) || guides[0];
const escapeGuideText = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
document.title = `${guide.title} — RepairLens`;
const guidePage = document.querySelector('#guidePage');
guidePage.innerHTML = `
  <section class="guide-detail-hero">
    <div><p class="overline">${escapeGuideText(guide.area.toUpperCase())} · ${escapeGuideText(guide.level.toUpperCase())}</p><h1>${escapeGuideText(guide.title)}</h1><p>${escapeGuideText(guide.desc)}</p><div class="case-meta"><span>${escapeGuideText(guide.time)}</span><span>COMMON REPAIR GUIDE</span></div></div>
    <div class="guide-detail-motion"><canvas id="guideHeroLottie" aria-hidden="true"></canvas><span>Motion by <a href="https://lottiefiles.com/free-animation/happy-mechanic-n0qDVVhbfA" target="_blank" rel="noreferrer">Rishabh Goel / LottieFiles ↗</a></span></div>
  </section>
  <section class="repair-guide-layout" aria-labelledby="repairStepsTitle">
    <div class="repair-guide-main"><div class="repair-guide-heading"><div><p class="overline">REPAIR PATH</p><h2 id="repairStepsTitle">One clear step at a time.</h2></div><p class="illustration-note">AI-generated illustrations are visual hints. Check the fit and follow the written instructions.</p></div>
      <p class="guide-image-status" id="guideImageStatus" aria-live="polite">Drawing a visual for each step…</p>
      <ol class="repair-steps" id="guideSteps">${guide.steps.map((step, index) => `<li class="repair-step"><figure class="repair-step__visual" data-visual="${index}"><div class="step-visual-loading" aria-hidden="true"><span></span></div><figcaption>Drawing this step…</figcaption></figure><div class="repair-step__copy"><span>STEP ${String(index + 1).padStart(2, '0')}</span><p>${escapeGuideText(step)}</p></div></li>`).join('')}</ol>
    </div>
    <aside class="repair-guide-aside"><p class="overline">BEFORE YOU START</p><h2>Stay safe, take it slowly.</h2><p>${escapeGuideText(guide.safety || 'Stop if the repair feels unsafe, the part is damaged, or you cannot identify how it fits.')}</p><h3>What you need</h3><ul>${(guide.tools || []).map(tool => `<li>${escapeGuideText(tool)}</li>`).join('')}</ul>${guide.parts?.length ? `<a class="parts-search-link" href="https://www.google.com/search?tbm=shop&q=${encodeURIComponent(guide.parts.join(' '))}" target="_blank" rel="noreferrer">Compare replacement parts ↗</a>` : ''}<a class="button secondary" href="/#help">Find a repair café</a></aside>
  </section>
  <section class="guide-prompt-link"><div><p class="overline">A DIFFERENT PROBLEM?</p><h2>Describe it and get a guide made for your item.</h2></div><a class="button primary" href="/guides.html#askRepair">Ask RepairLens <span aria-hidden="true">→</span></a></section>`;

async function loadGuideIllustrations() {
  const status = document.querySelector('#guideImageStatus');
  document.dispatchEvent(new CustomEvent('repairlens:guide-loading', { detail: { active: true } }));
  try {
    const response = await fetch('/api/illustrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: guide.title, category: guide.area, steps: guide.steps.map((instruction, index) => ({ title: `Step ${index + 1}`, instruction })), cacheKey: guide.id }) });
    const payload = await response.json();
    if (!response.ok) throw Error(payload.error || 'Illustrations are unavailable right now.');
    payload.visuals.forEach((src, index) => {
      const figure = document.querySelector(`[data-visual="${index}"]`);
      if (!figure || !src) return;
      const image = document.createElement('img');
      image.src = src;
      image.alt = `AI-generated illustrative drawing for step ${index + 1} of ${guide.title}`;
      image.loading = 'lazy';
      const caption = document.createElement('figcaption');
      caption.textContent = 'Illustrative drawing · verify parts and fit';
      figure.replaceChildren(image, caption);
    });
    if (payload.visuals.every(src => !src)) throw Error('The guide is ready, but the illustrations could not be generated.');
    status.textContent = 'Illustrations are ready. Use the written steps as your source of truth.';
  } catch (error) {
    status.textContent = `${error.message} The written guide is still available below.`;
    document.querySelectorAll('.step-visual-loading').forEach(placeholder => { placeholder.classList.remove('step-visual-loading'); placeholder.classList.add('step-visual-fallback'); placeholder.textContent = 'Illustration unavailable'; });
  } finally {
    document.dispatchEvent(new CustomEvent('repairlens:guide-loading', { detail: { active: false } }));
  }
}
loadGuideIllustrations();
