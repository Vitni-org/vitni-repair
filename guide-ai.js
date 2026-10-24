const guideSearchForm = document.querySelector('#guideSearchForm');
const escapeAiText = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const guideSearchStatus = document.querySelector('#guideSearchStatus');
const guideSearchButton = document.querySelector('#guideSearchSubmit');
const guideSearchResult = document.querySelector('#generatedGuide');
const guideSearchPhoto = document.querySelector('#guideSearchPhoto');
const guideSearchDescription = document.querySelector('#guideSearchDescription');
const guideSearchError = document.querySelector('#guideSearchError');

function setGuideSearchError(message = '') {
  guideSearchError.textContent = message;
  guideSearchError.hidden = !message;
  guideSearchDescription.setAttribute('aria-invalid', String(Boolean(message)));
}

function renderGeneratedGuide(assessment) {
  guideSearchResult.innerHTML = `<div class="generated-guide__heading"><div><p class="overline">REPAIRLENS FIELD GUIDE</p><h2>${escapeAiText(assessment.likely_issue)}</h2><p>${escapeAiText(assessment.summary)}</p></div><span class="guide-confidence">${assessment.confidence}% match</span></div><div class="generated-guide__body"><div><p class="overline">STEP-BY-STEP PLAN</p><ol class="repair-steps">${assessment.steps.map((step, index) => `<li class="repair-step"><figure class="repair-step__visual" data-ai-visual="${index}"><div class="step-visual-loading" aria-hidden="true"><span></span></div><figcaption>Drawing this step…</figcaption></figure><div class="repair-step__copy"><span>STEP ${String(index + 1).padStart(2, '0')}</span><p><strong>${escapeAiText(step.title)}</strong><br>${escapeAiText(step.instruction)}</p></div></li>`).join('')}</ol></div><aside class="generated-guide__aside"><p class="overline">SAFETY · ${escapeAiText(assessment.safety.replaceAll('_', ' ').toUpperCase())}</p><p>${escapeAiText(assessment.summary)}</p><h3>Parts & tools</h3><ul>${assessment.parts.length ? assessment.parts.map(part => `<li><strong>${escapeAiText(part.name)}</strong><br><small>${escapeAiText(part.details)}</small></li>`).join('') : '<li>No replacement part identified yet.</li>'}</ul>${assessment.parts.length ? `<a class="parts-search-link" href="https://www.google.com/search?tbm=shop&q=${encodeURIComponent(assessment.parts.map(part => `${part.name} ${part.details}`).join(' '))}" target="_blank" rel="noreferrer">Compare replacement parts ↗</a>` : ''}<a class="button secondary" href="/#help">Find nearby repair help</a><p class="illustration-note">AI illustrations are visual hints, not technical specifications. Verify dimensions and fit before buying.</p></aside></div>`;
  guideSearchResult.hidden = false;
}

async function illustrateGeneratedGuide(assessment) {
  const response = await fetch('/api/illustrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: assessment.likely_issue, steps: assessment.steps }) });
  const payload = await response.json();
  if (!response.ok) throw Error(payload.error || 'Illustrations are unavailable right now.');
  payload.visuals.forEach((src, index) => {
    const figure = document.querySelector(`[data-ai-visual="${index}"]`);
    if (!figure || !src) return;
    const image = document.createElement('img');
    image.src = src;
    image.alt = `AI-generated illustrative drawing for step ${index + 1}: ${assessment.steps[index].title}`;
    image.loading = 'lazy';
    const caption = document.createElement('figcaption');
    caption.textContent = 'Illustrative drawing · verify parts and fit';
    figure.replaceChildren(image, caption);
  });
  if (payload.visuals.every(src => !src)) throw Error('The written guide is ready, but its illustrations could not be generated.');
}

guideSearchForm.addEventListener('submit', async event => {
  event.preventDefault();
  const description = guideSearchDescription.value.trim();
  const file = guideSearchPhoto.files?.[0];
  if (!description) { setGuideSearchError('Describe what happened in a few words so the repair guide has context.'); guideSearchDescription.focus({ preventScroll: true }); return; }
  setGuideSearchError();
  if (file && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { guideSearchStatus.textContent = 'Choose a PNG, JPEG, or WebP photo.'; return; }
  if (file && file.size > 8 * 1024 * 1024) { guideSearchStatus.textContent = 'This photo is over 8 MB. Choose a smaller one.'; return; }
  guideSearchButton.disabled = true;
  guideSearchButton.textContent = 'Building your guide…';
  guideSearchStatus.textContent = file ? 'Checking your photo and description…' : 'Finding a safe route from your description…';
  document.dispatchEvent(new CustomEvent('repairlens:guide-loading', { detail: { active: true } }));
  try {
    const image = file ? await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }) : undefined;
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description, image }) });
    const assessment = await response.json();
    if (!response.ok) throw Error(assessment.error || 'Could not build this guide.');
    renderGeneratedGuide(assessment);
    guideSearchStatus.textContent = `Your repair plan is ready. Drawing ${assessment.steps.length} visual steps…`;
    guideSearchResult.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    await illustrateGeneratedGuide(assessment);
    guideSearchStatus.textContent = 'Guide ready. Check the written instructions and safety notes before you start.';
  } catch (error) {
    setGuideSearchError(`${error.message} Check your connection and try again.`);
    guideSearchDescription.focus({ preventScroll: true });
    guideSearchStatus.textContent = error.message;
    document.querySelectorAll('.step-visual-loading').forEach(placeholder => { placeholder.classList.remove('step-visual-loading'); placeholder.textContent = 'Illustration unavailable'; });
  } finally {
    guideSearchButton.disabled = false;
    guideSearchButton.innerHTML = 'Get my repair steps <span aria-hidden="true">→</span>';
    document.dispatchEvent(new CustomEvent('repairlens:guide-loading', { detail: { active: false } }));
  }
});

const guideSearchPhotoName = document.querySelector('#guideSearchPhotoName');
guideSearchPhoto.addEventListener('change', () => { guideSearchPhotoName.textContent = guideSearchPhoto.files?.[0]?.name || 'A clear close-up helps us spot the details.'; });
guideSearchDescription.addEventListener('input', () => { if (guideSearchDescription.value.trim()) setGuideSearchError(); });
