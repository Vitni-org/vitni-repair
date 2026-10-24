import { guides } from './site-data.js';

const guidePage = document.querySelector('[data-guide-id]');
if (guidePage) {
  // Keep legacy query URLs usable on static hosts that do not provide redirects.
  if (!guidePage.dataset.guideId) {
    guidePage.dataset.guideId = new URLSearchParams(location.search).get('guide') || '';
  }
  const guide = guides.find(item => item.id === guidePage.dataset.guideId);
  if (new URLSearchParams(location.search).has('guide')) {
    location.replace(guide ? `/guides/${guide.id}/` : '/guides.html');
  }
  const status = document.querySelector('#guideImageStatus');
  const stepNodes = [...document.querySelectorAll('[data-guide-step], .repair-step')];
  const steps = stepNodes.map((node, index) => ({
    node,
    instruction: node.dataset.guideStep || node.querySelector('.repair-step__copy p')?.textContent.trim() || '',
    figure: node.querySelector('[data-visual]')
  })).filter(step => step.instruction);

  async function loadGuideIllustrations() {
    if (!guide || !status || !steps.length) return;
    document.dispatchEvent(new CustomEvent('repairlens:guide-loading', { detail: { active: true } }));
    try {
      const response = await fetch('/api/illustrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: guide.title,
          category: guide.area,
          steps: steps.map(({ instruction }, index) => ({ title: `Step ${index + 1}`, instruction })),
          cacheKey: guide.id
        })
      });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || 'Illustrations are unavailable right now.');
      payload.visuals.forEach((src, index) => {
        const figure = steps[index]?.figure;
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
      document.querySelectorAll('.step-visual-loading').forEach(placeholder => {
        placeholder.classList.remove('step-visual-loading');
        placeholder.classList.add('step-visual-fallback');
        placeholder.textContent = 'Illustration unavailable';
      });
    } finally {
      document.dispatchEvent(new CustomEvent('repairlens:guide-loading', { detail: { active: false } }));
    }
  }

  loadGuideIllustrations();
}
