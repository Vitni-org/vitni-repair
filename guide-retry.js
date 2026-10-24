document.addEventListener('click', async event => {
  const button = event.target.closest('[data-retry-guide][data-retry-step]');
  if (!button || button.disabled) return;
  const { retryGuide: slug, retryStep: ordinal } = button.dataset;
  const figure = button.closest('.repair-step__visual');
  button.disabled = true;
  button.textContent = 'Drawing…';
  try {
    const response = await fetch(`/api/guides/${encodeURIComponent(slug)}/steps/${encodeURIComponent(ordinal)}/retry`, { method: 'POST' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Could not retry this illustration.');
    const image = document.createElement('img');
    image.src = payload.image;
    image.alt = `Repair illustration for ${slug}, step ${ordinal}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    const caption = document.createElement('figcaption');
    caption.textContent = 'Illustrative drawing · verify parts and fit';
    image.addEventListener('error', () => {
      image.remove();
      caption.textContent = 'The drawing could not load. Try again later.';
      button.disabled = false;
      button.textContent = 'Retry illustration';
      figure.append(caption, button);
    }, { once: true });
    figure.replaceChildren(image, caption);
  } catch (error) {
    button.disabled = false;
    button.textContent = error.message.includes('wait a minute') ? 'Try again in a minute' : 'Retry illustration';
    button.title = error.message;
  }
});
