import { stories } from './site-data.js';

const storyPage = document.querySelector('[data-story-id]');
if (storyPage) {
  // Keep legacy query URLs usable on static hosts that do not provide redirects.
  if (!storyPage.dataset.storyId) {
    storyPage.dataset.storyId = new URLSearchParams(location.search).get('story') || '';
  }
  const story = stories[storyPage.dataset.storyId];
  if (new URLSearchParams(location.search).has('story')) {
    location.replace(story ? `/stories/${storyPage.dataset.storyId}/` : '/');
  }
  const shareButton = document.querySelector('[data-share-button]');
  const shareStatus = document.querySelector('[data-share-status]');

  if (story && shareButton) {
    shareButton.addEventListener('click', async () => {
      const shareData = { title: `${story.title} — RepairLens`, url: location.href };
      try {
        if (navigator.share) await navigator.share(shareData);
        else {
          await navigator.clipboard.writeText(shareData.url);
          if (shareStatus) shareStatus.textContent = 'Story link copied.';
        }
      } catch (error) {
        if (error.name !== 'AbortError' && shareStatus) shareStatus.textContent = 'Could not share this story right now.';
      }
    });
  }
}
