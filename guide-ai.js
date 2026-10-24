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

function renderGeneratedGuide(assessment, output = {}) {
  const steps = Array.isArray(assessment.steps) ? assessment.steps : [];
  const parts = Array.isArray(assessment.parts) ? assessment.parts : [];
  const tools = Array.isArray(assessment.tools) ? assessment.tools : [];
  const isUnlisted = output.guide?.visibility === 'unlisted';
  const saveMarkup = output.saved && output.href
    ? `<p class="generated-guide__saved">${output.reused ? 'Found a saved guide. ' : 'Saved to the shared guide library. '}<a href="${escapeAiText(output.href)}">${isUnlisted ? 'Open your unlisted guide' : 'Open full repair guide'} →</a>${isUnlisted ? '<small>Anyone with this link can view it.</small>' : ''}</p>`
    : '<p class="generated-guide__saved">This is a one-time guide and was not saved. Configure Supabase on the server to enable shared saving.</p>';
  const stepMarkup = steps.map((step, index) => {
    const stored = output.guide?.steps?.[index];
    const visualMarkup = stored?.image
      ? `<img src="${escapeAiText(stored.image)}" alt="${escapeAiText(stored.imageAlt || `Illustration for step ${index + 1}`)}" loading="lazy" decoding="async" /><figcaption>Illustrative drawing · verify parts and fit</figcaption>`
      : '<div class="step-visual-loading" aria-hidden="true"><span></span></div><figcaption>Drawing this step…</figcaption>';
    const retryMarkup = stored && !stored.image && output.guide?.visibility === 'public' ? `<button type="button" class="repair-step__retry" data-retry-guide="${escapeAiText(output.guide.slug)}" data-retry-step="${index + 1}">Retry illustration</button>` : '';
    return `<li class="repair-step"><figure class="repair-step__visual" data-ai-visual="${index}">${visualMarkup}${retryMarkup}</figure><div class="repair-step__copy"><span>STEP ${String(index + 1).padStart(2, '0')}</span><p><strong>${escapeAiText(step.title)}</strong><br>${escapeAiText(step.instruction)}</p></div></li>`;
  }).join('');
  const supplies = [...tools.map(tool => `<li><strong>${escapeAiText(tool)}</strong><br><small>Tool</small></li>`), ...parts.map(part => `<li><strong>${escapeAiText(part.name)}</strong><br><small>${escapeAiText(part.details || 'Check dimensions and compatibility before buying.')}</small></li>`)];
  guideSearchResult.innerHTML = `<div class="generated-guide__heading"><div><p class="overline">REPAIRLENS FIELD GUIDE · ${escapeAiText(assessment.area || 'REPAIR')}</p><h2>${escapeAiText(assessment.likely_issue)}</h2><p>${escapeAiText(assessment.summary)}</p></div><span class="guide-confidence">${assessment.confidence}% match</span></div>${saveMarkup}<div class="generated-guide__body">${steps.length ? `<div><p class="overline">STEP-BY-STEP PLAN</p><ol class="repair-steps">${stepMarkup}</ol></div>` : `<div class="safety-card"><strong>Do not attempt this repair</strong><p>${escapeAiText(assessment.summary)}</p><p>Stop here and seek qualified repair help.</p></div>`}<aside class="generated-guide__aside"><p class="overline">SAFETY · ${escapeAiText(assessment.safety.replaceAll('_', ' ').toUpperCase())}</p><p>${escapeAiText(assessment.summary)}</p>${supplies.length ? `<h3>Parts & tools</h3><ul>${supplies.join('')}</ul>` : ''}${parts.length ? `<a class="parts-search-link" href="https://www.google.com/search?tbm=shop&q=${encodeURIComponent(parts.map(part => `${part.name} ${part.details || ''}`).join(' '))}" target="_blank" rel="noreferrer noopener">Compare replacement parts ↗</a>` : ''}<a class="button secondary" href="/#help">Find nearby repair help</a><p class="illustration-note">AI illustrations are visual hints, not technical specifications. Verify dimensions and fit before buying.</p></aside></div>`;
  guideSearchResult.hidden = false;
}

function illustrateGeneratedGuide(output) {
  const assessment = output.assessment;
  const visuals = output.guide?.steps ? output.guide.steps.map(step => step.image || null) : (output.visuals || []);
  visuals.forEach((src, index) => {
    const figure = document.querySelector(`[data-ai-visual="${index}"]`);
    if (!figure || !src) return;
    const image = document.createElement('img');
    image.src = src;
    image.alt = output.guide?.steps?.[index]?.imageAlt || `AI-generated illustrative drawing for step ${index + 1}: ${assessment.steps[index].title}`;
    image.loading = 'lazy';
    const caption = document.createElement('figcaption');
    caption.textContent = 'Illustrative drawing · verify parts and fit';
    figure.replaceChildren(image, caption);
  });
  if (assessment.steps.length && visuals.every(src => !src)) throw Error('The written guide is ready, but its illustrations could not be generated.');
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
    const response = await fetch('/api/repair-guide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description, image }) });
    const output = await response.json();
    if (!response.ok) throw Error(output.error || 'Could not build this guide.');
    renderGeneratedGuide(output.assessment, output);
    guideSearchStatus.textContent = output.assessment.steps.length ? `Your repair plan is ready with ${output.assessment.steps.length} visual steps.` : 'This repair needs qualified help. Do not attempt it yourself.';
    guideSearchResult.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    illustrateGeneratedGuide(output);
    guideSearchStatus.textContent = output.saved ? (output.reused ? 'Saved guide found. Check its safety notes before you start.' : 'Guide saved. Check its safety notes before you start.') : 'This guide is shown as a one-time result and was not saved.';
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
