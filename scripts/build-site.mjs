import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { guides, stories } from '../site-data.js';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = join(sourceRoot, 'dist');
const publicExtensions = new Set(['.html', '.js', '.css', '.svg', '.webmanifest']);
const storyGuideIds = { bike: 'bike-chain', denim: 'seam', window: 'window-hinge' };

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function normalizeOrigin(value = process.env.PUBLIC_SITE_URL || 'https://vitni.cc') {
  try { return new URL(value).origin; }
  catch { throw new Error('PUBLIC_SITE_URL must be a valid absolute URL.'); }
}

export function canonicalPath(type, id) {
  if (type === 'guide') return `/guides/${encodeURIComponent(id)}/`;
  if (type === 'story') return `/stories/${encodeURIComponent(id)}/`;
  if (type === 'home') return '/';
  if (type === 'guides') return '/guides.html';
  throw new Error(`Unknown canonical page type: ${type}`);
}

function renderList(items) {
  return items.length ? `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p>No additional parts are needed for this repair.</p>';
}

function renderGuideCard(guide) {
  return `<article class="guide-card"><a class="guide-card__link" href="${canonicalPath('guide', guide.id)}"><img src="${escapeHtml(guide.image)}" alt="${escapeHtml(guide.alt)}" loading="lazy" decoding="async" /><div class="guide-card__body"><span class="guide-card__area">${escapeHtml(guide.area.toUpperCase())} · ${escapeHtml(guide.level.toUpperCase())}</span><h3>${escapeHtml(guide.title)}</h3><p>${escapeHtml(guide.desc)}</p><span class="guide-card__action">Open illustrated guide <span aria-hidden="true">→</span></span></div></a></article>`;
}

export function renderGuidePage(guide, origin) {
  const related = guides.find(item => item.area === guide.area && item.id !== guide.id);
  const content = `<main class="page-shell" id="guidePage" data-guide-id="${escapeHtml(guide.id)}">
    <nav class="page-back" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/guides.html">Guides</a> / ${escapeHtml(guide.title)}</nav>
    <section class="case-hero"><div><div class="case-meta"><span>${escapeHtml(guide.area.toUpperCase())}</span><span>${escapeHtml(guide.level.toUpperCase())}</span><span>${escapeHtml(guide.time)}</span></div><h1>${escapeHtml(guide.title)}</h1><p>${escapeHtml(guide.desc)}</p><p id="guideImageStatus" aria-live="polite">Written steps are ready. Illustrations may load below.</p></div><img src="${escapeHtml(guide.image)}" alt="${escapeHtml(guide.alt)}" /></section>
    <section class="case-layout"><div><h2>Repair steps</h2><ol class="case-steps">${guide.steps.map((step, index) => `<li class="repair-step" data-guide-step="${escapeHtml(step)}"><figure class="repair-step__visual" data-visual="${index}"><div class="step-visual-loading" aria-hidden="true"><span></span></div><figcaption>Drawing this step…</figcaption></figure><div class="repair-step__copy"><p>${escapeHtml(step)}</p></div></li>`).join('')}</ol></div><aside class="case-aside"><h2>Before you begin</h2><div class="safety-card"><strong>Safety note</strong><p>${escapeHtml(guide.safety)}</p></div><h2>Tools</h2>${renderList(guide.tools)}<h2>Parts</h2>${renderList(guide.parts)}<p><a href="/guides.html">Browse all repair guides</a></p>${related ? `<p><a href="${canonicalPath('guide', related.id)}">Related guide: ${escapeHtml(related.title)}</a></p>` : ''}<p><a href="/">Return home</a></p></aside></section>
  </main>`;
  return applyTemplate('guide-detail.html', `<title>${escapeHtml(`${guide.title} — RepairLens`)}</title>`, content, origin);
}

export function renderStoryPage(story, origin) {
  const id = Object.entries(stories).find(([, item]) => item === story)?.[0];
  if (!id) throw new Error('Story must come from the shared story data.');
  const relatedGuide = storyGuideIds[id] ? guides.find(guide => guide.id === storyGuideIds[id]) : null;
  const content = `<main class="page-shell" id="casePage" data-story-id="${escapeHtml(id)}">
    <nav class="page-back" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/#stories">Stories</a> / ${escapeHtml(story.title)}</nav>
    <section class="case-hero"><div><div class="case-meta"><span>${escapeHtml(story.tag)}</span><span>${escapeHtml(story.time)}</span></div><h1>${escapeHtml(story.title)}</h1><p>${escapeHtml(story.situation)}</p></div><img src="${escapeHtml(story.image)}" alt="${escapeHtml(`Repair story: ${story.title}`)}" /></section>
    <section class="case-layout"><div><h2>The repair path</h2><ol class="case-steps">${story.steps.map(([title, copy]) => `<li><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p></div></li>`).join('')}</ol></div><aside class="case-aside"><h2>Safety note</h2><div class="safety-card"><p>${escapeHtml(story.safety)}</p></div><h2>Tools and support</h2>${renderList(story.tools)}<div class="outcome-card">${escapeHtml(story.outcome)}</div><p><a href="/guides.html">Browse repair guides</a></p>${relatedGuide ? `<p><a href="${canonicalPath('guide', relatedGuide.id)}">Related guide: ${escapeHtml(relatedGuide.title)}</a></p>` : ''}</aside></section>
  </main>`;
  return applyTemplate('story-detail.html', `<title>${escapeHtml(`${story.title} — RepairLens`)}</title>`, content, origin);
}

let templates = new Map();
function applyTemplate(name, pageMeta, pageContent) {
  const template = templates.get(name);
  if (!template) throw new Error(`Template not loaded: ${name}`);
  return template.replace('{{PAGE_META}}', pageMeta).replace('{{PAGE_CONTENT}}', pageContent);
}

async function copyPublicFiles() {
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  await Promise.all(entries.filter(entry => entry.isFile() && publicExtensions.has(extname(entry.name))).map(entry => cp(join(sourceRoot, entry.name), join(outputRoot, entry.name))));
  await Promise.all(['images', 'animations'].map(directory => cp(join(sourceRoot, directory), join(outputRoot, directory), { recursive: true })));
}

export async function buildSite() {
  const origin = normalizeOrigin();
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  templates = new Map(await Promise.all(['guide-detail.html', 'story-detail.html'].map(async name => [name, await readFile(join(sourceRoot, 'templates', name), 'utf8')])));
  await copyPublicFiles();
  const guidesPath = join(outputRoot, 'guides.html');
  const guideLibrary = await readFile(guidesPath, 'utf8');
  await writeFile(guidesPath, guideLibrary.replace('<!--REPAIRLENS_GUIDE_CARDS-->', guides.map(renderGuideCard).join('')));
  await Promise.all(guides.map(async guide => {
    const destination = join(outputRoot, canonicalPath('guide', guide.id), 'index.html');
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, renderGuidePage(guide, origin));
  }));
  await Promise.all(Object.entries(stories).map(async ([id, story]) => {
    const destination = join(outputRoot, canonicalPath('story', id), 'index.html');
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, renderStoryPage(story, origin));
  }));
  return { origin, guides: guides.length, stories: Object.keys(stories).length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildSite().then(result => console.log(`Built ${result.guides} guides and ${result.stories} stories for ${result.origin}.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
