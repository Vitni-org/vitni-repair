function isShareCancellation(error) {
  return error?.name === 'AbortError';
}

function selectManualLink(input, status) {
  input.focus({ preventScroll: true });
  input.select();
  status.textContent = 'Select and copy the direct link above.';
}

async function shareLink(button) {
  const panel = button.closest('.share-panel') || document;
  const status = panel.querySelector('[data-share-status]');
  const input = panel.querySelector('[data-share-url]');
  const canonical = document.querySelector('link[rel="canonical"]');
  const url = canonical?.href || input?.value;
  const title = document.title;

  if (!status || !input || !url) return;
  status.textContent = '';

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url });
      status.textContent = 'Link shared.';
      return;
    } catch (error) {
      if (isShareCancellation(error)) return;
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = 'Link copied to your clipboard.';
      return;
    } catch {
      // Continue to the visible, manual-copy fallback below.
    }
  }

  selectManualLink(input, status);
}

document.querySelectorAll('[data-share-button]').forEach(button => {
  button.addEventListener('click', () => { shareLink(button); });
});
