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
}
