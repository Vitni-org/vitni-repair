import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { guides, stories } from '../site-data.js';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = join(sourceRoot, 'dist');
const publicExtensions = new Set(['.html', '.js', '.css', '.svg', '.webmanifest']);
const storyGuideIds = { bike: 'bike-chain', denim: 'seam', window: 'window-hinge' };
const defaultSocialImage = '/images/og/repairlens-share.png';
const defaultSocialAlt = 'RepairLens social card with Vitni holding a repair tool and the words Keep good things going.';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function escapeXml(value) {
  return escapeHtml(value);
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

async function readPublicSiteUrl() {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL;
  try {
    const envFile = await readFile(join(sourceRoot, '.env'), 'utf8');
    const match = envFile.match(/^\s*(?:export\s+)?PUBLIC_SITE_URL\s*=\s*(.*?)\s*$/m);
    if (!match) return undefined;
    const value = match[1];
    return (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
      ? value.slice(1, -1)
      : value;
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function normalizeOrigin(value) {
  try { return new URL(value || 'https://vitni.cc').origin; }
  catch { throw new Error('PUBLIC_SITE_URL must be a valid absolute URL.'); }
}

function absoluteUrl(path, origin) {
  return new URL(path, `${origin}/`).href;
}

function socialImageFor(image) {
  return /\.(?:png|jpe?g)$/i.test(image) ? { path: image, width: 720, height: 720 } : { path: defaultSocialImage, width: 1200, height: 630 };
}

function renderMetadata({ title, description, path, image = defaultSocialImage, imageWidth = 1200, imageHeight = 630, imageAlt = defaultSocialAlt, type = 'website', jsonLd }, origin) {
  const canonical = absoluteUrl(path, origin);
  const socialImage = absoluteUrl(image, origin);
  const attributes = value => escapeHtml(value);
  return `<title>${attributes(title)}</title>
  <meta name="description" content="${attributes(description)}" />
  <link rel="canonical" href="${attributes(canonical)}" />
  <meta property="og:type" content="${attributes(type)}" />
  <meta property="og:title" content="${attributes(title)}" />
  <meta property="og:description" content="${attributes(description)}" />
  <meta property="og:url" content="${attributes(canonical)}" />
  <meta property="og:image" content="${attributes(socialImage)}" />
  <meta property="og:image:width" content="${imageWidth}" />
  <meta property="og:image:height" content="${imageHeight}" />
  <meta property="og:image:alt" content="${attributes(imageAlt)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${attributes(title)}" />
  <meta name="twitter:description" content="${attributes(description)}" />
  <meta name="twitter:image" content="${attributes(socialImage)}" />
  <script type="application/ld+json">${safeJson(jsonLd)}</script>`;
}

function renderShareControls(canonical) {
  const fieldId = `share-url-${canonical.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'page'}`;
  return `<section class="share-panel" aria-labelledby="share-title">
    <h2 id="share-title">Share this repair path</h2>
    <p>Copy the direct link to return to these steps later.</p>
    <div class="share-panel__actions">
      <label for="${fieldId}">Direct link<input id="${fieldId}" data-share-url type="text" value="${escapeHtml(canonical)}" readonly /></label>
      <button type="button" data-share-button><span aria-hidden="true">↗</span> Share or copy link</button>
    </div>
    <p data-share-status role="status" aria-live="polite"></p>
  </section>`;
}

function guideJsonLd(guide, path, origin) {
  const totalTime = /^(\d+) min$/.exec(guide.time);
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: guide.desc,
    url: absoluteUrl(path, origin),
    image: absoluteUrl(guide.image, origin),
    ...(totalTime ? { totalTime: `PT${totalTime[1]}M` } : {}),
    tool: guide.tools.map(name => ({ '@type': 'HowToTool', name })),
    supply: guide.parts.map(name => ({ '@type': 'HowToSupply', name })),
    step: guide.steps.map((text, index) => ({ '@type': 'HowToStep', name: `Step ${index + 1}`, text }))
  };
}

function storyJsonLd(story, path, origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: story.title,
    description: `Simulated RepairLens demo story. ${story.situation}`,
    url: absoluteUrl(path, origin),
    image: absoluteUrl(story.image, origin),
    about: 'Everyday repair'
  };
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
  const path = canonicalPath('guide', guide.id);
  const related = guides.find(item => item.area === guide.area && item.id !== guide.id);
  const content = `<main class="page-shell" id="guidePage" data-guide-id="${escapeHtml(guide.id)}">
    <nav class="page-back" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/guides.html">Guides</a> / ${escapeHtml(guide.title)}</nav>
    <section class="case-hero"><div><div class="case-meta"><span>${escapeHtml(guide.area.toUpperCase())}</span><span>${escapeHtml(guide.level.toUpperCase())}</span><span>${escapeHtml(guide.time)}</span></div><h1>${escapeHtml(guide.title)}</h1><p>${escapeHtml(guide.desc)}</p><p id="guideImageStatus" aria-live="polite">Written steps are ready. Illustrations may load below.</p></div><img src="${escapeHtml(guide.image)}" alt="${escapeHtml(guide.alt)}" /></section>
    <section class="case-layout"><div><h2>Repair steps</h2><ol class="case-steps">${guide.steps.map((step, index) => `<li class="repair-step" data-guide-step="${escapeHtml(step)}"><figure class="repair-step__visual" data-visual="${index}"><div class="step-visual-loading" aria-hidden="true"><span></span></div><figcaption>Drawing this step…</figcaption></figure><div class="repair-step__copy"><p>${escapeHtml(step)}</p></div></li>`).join('')}</ol></div><aside class="case-aside"><h2>Before you begin</h2><div class="safety-card"><strong>Safety note</strong><p>${escapeHtml(guide.safety)}</p></div><h2>Tools</h2>${renderList(guide.tools)}<h2>Parts</h2>${renderList(guide.parts)}<p><a href="/guides.html">Browse all repair guides</a></p>${related ? `<p><a href="${canonicalPath('guide', related.id)}">Related guide: ${escapeHtml(related.title)}</a></p>` : ''}<p><a href="/">Return home</a></p></aside></section>
    ${renderShareControls(absoluteUrl(path, origin))}
  </main>`;
  const socialImage = socialImageFor(guide.image);
  const meta = renderMetadata({ title: `${guide.title} — RepairLens`, description: guide.desc, path, image: socialImage.path, imageWidth: socialImage.width, imageHeight: socialImage.height, imageAlt: socialImage.path === defaultSocialImage ? defaultSocialAlt : guide.alt, type: 'article', jsonLd: guideJsonLd(guide, path, origin) }, origin);
  return applyTemplate('guide-detail.html', meta, content);
}

export function renderStoryPage(story, origin) {
  const id = Object.entries(stories).find(([, item]) => item === story)?.[0];
  if (!id) throw new Error('Story must come from the shared story data.');
  const path = canonicalPath('story', id);
  const relatedGuide = storyGuideIds[id] ? guides.find(guide => guide.id === storyGuideIds[id]) : null;
  const content = `<main class="page-shell" id="casePage" data-story-id="${escapeHtml(id)}">
    <nav class="page-back" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/#stories">Stories</a> / ${escapeHtml(story.title)}</nav>
    <section class="case-hero"><div><div class="case-meta"><span>${escapeHtml(story.tag)}</span><span>${escapeHtml(story.time)}</span></div><h1>${escapeHtml(story.title)}</h1><p>${escapeHtml(story.situation)}</p><p>This is a simulated RepairLens demo story.</p></div><img src="${escapeHtml(story.image)}" alt="${escapeHtml(`Repair story: ${story.title}`)}" /></section>
    <section class="case-layout"><div><h2>The repair path</h2><ol class="case-steps">${story.steps.map(([title, copy]) => `<li><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p></div></li>`).join('')}</ol></div><aside class="case-aside"><h2>Safety note</h2><div class="safety-card"><p>${escapeHtml(story.safety)}</p></div><h2>Tools and support</h2>${renderList(story.tools)}<div class="outcome-card">${escapeHtml(story.outcome)}</div><p><a href="/guides.html">Browse repair guides</a></p>${relatedGuide ? `<p><a href="${canonicalPath('guide', relatedGuide.id)}">Related guide: ${escapeHtml(relatedGuide.title)}</a></p>` : ''}</aside></section>
    ${renderShareControls(absoluteUrl(path, origin))}
  </main>`;
  const socialImage = socialImageFor(story.image);
  const meta = renderMetadata({ title: `${story.title} — RepairLens`, description: `Simulated RepairLens demo story. ${story.situation}`, path, image: socialImage.path, imageWidth: socialImage.width, imageHeight: socialImage.height, imageAlt: `Repair story: ${story.title}`, type: 'article', jsonLd: storyJsonLd(story, path, origin) }, origin);
  return applyTemplate('story-detail.html', meta, content);
}

function renderHomeMetadata(origin) {
  const path = canonicalPath('home');
  const title = 'RepairLens — Fix, wear, ride.';
  const description = 'A practical repair guide for the things you use every day.';
  const websiteUrl = absoluteUrl(path, origin);
  const brandImage = absoluteUrl('/images/vitni.svg', origin);
  return renderMetadata({ title, description, path, jsonLd: { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebSite', name: 'RepairLens', url: websiteUrl, description },
    { '@type': 'Organization', name: 'RepairLens', url: websiteUrl, image: brandImage }
  ] } }, origin);
}

function renderGuidesMetadata(origin) {
  const path = canonicalPath('guides');
  const title = 'Repair guides — RepairLens';
  const description = 'Practical repair guides for everyday bikes, home items, and clothes.';
  return renderMetadata({ title, description, path, jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: absoluteUrl(path, origin) } }, origin);
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

function canonicalRoutes() {
  return [canonicalPath('home'), canonicalPath('guides'), ...guides.map(guide => canonicalPath('guide', guide.id)), ...Object.keys(stories).map(id => canonicalPath('story', id))];
}

function renderLlmsIndex(origin) {
  const inventory = [
    ['Home', canonicalPath('home')],
    ['Repair guides', canonicalPath('guides')],
    ...guides.map(guide => [guide.title, canonicalPath('guide', guide.id)]),
    ...Object.entries(stories).map(([id, story]) => [story.title, canonicalPath('story', id)])
  ];
  return `# RepairLens\n\n> Practical, safety-first repair guidance for everyday bikes, clothes, and household items.\n\n## Pages\n\n${inventory.map(([label, path]) => `- [${label}](${absoluteUrl(path, origin)})`).join('\n')}\n`;
}

function renderLlmsFull(origin) {
  const guideMarkdown = guides.map(guide => `## ${guide.title}\n\n- Canonical URL: ${absoluteUrl(canonicalPath('guide', guide.id), origin)}\n- Area: ${guide.area}\n- Time: ${guide.time}\n- Summary: ${guide.desc}\n- Safety note: ${guide.safety}\n- Tools: ${guide.tools.join(', ') || 'None listed'}\n- Parts: ${guide.parts.join(', ') || 'No additional parts needed'}\n\n### Steps\n\n${guide.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`).join('\n\n');
  const storyMarkdown = Object.entries(stories).map(([id, story]) => `## ${story.title}\n\n- Canonical URL: ${absoluteUrl(canonicalPath('story', id), origin)}\n- Type: Simulated RepairLens demo story\n- Summary: ${story.situation}\n- Safety note: ${story.safety}\n- Tools and support: ${story.tools.join(', ')}\n- Outcome: ${story.outcome}\n\n### Repair path\n\n${story.steps.map(([title, copy], index) => `${index + 1}. **${title}:** ${copy}`).join('\n')}`).join('\n\n');
  return `# RepairLens full guide and story reference\n\nRepairLens provides practical repair guidance for everyday items. Follow safety notes and seek qualified help when a guide says to stop.\n\n# Guides\n\n${guideMarkdown}\n\n# Simulated demo stories\n\n${storyMarkdown}\n`;
}

async function writeDiscoveryFiles(origin) {
  const sitemapUrls = canonicalRoutes().map(path => `  <url><loc>${escapeXml(absoluteUrl(path, origin))}</loc></url>`).join('\n');
  await Promise.all([
    writeFile(join(outputRoot, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl('/sitemap.xml', origin)}\n`),
    writeFile(join(outputRoot, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`),
    writeFile(join(outputRoot, 'llms.txt'), renderLlmsIndex(origin)),
    writeFile(join(outputRoot, 'llms-full.txt'), renderLlmsFull(origin))
  ]);
}

async function replaceMetadataMarker(file, metadata) {
  const page = await readFile(file, 'utf8');
  if (!page.includes('<!--REPAIRLENS_PAGE_META-->')) throw new Error(`Metadata marker missing from ${file}.`);
  await writeFile(file, page.replace('<!--REPAIRLENS_PAGE_META-->', metadata));
}

export async function buildSite() {
  const origin = normalizeOrigin(await readPublicSiteUrl());
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  templates = new Map(await Promise.all(['guide-detail.html', 'story-detail.html'].map(async name => [name, await readFile(join(sourceRoot, 'templates', name), 'utf8')])));
  await copyPublicFiles();
  const guidesPath = join(outputRoot, 'guides.html');
  const guideLibrary = await readFile(guidesPath, 'utf8');
  await writeFile(guidesPath, guideLibrary.replace('<!--REPAIRLENS_GUIDE_CARDS-->', guides.map(renderGuideCard).join('')));
  await Promise.all([
    replaceMetadataMarker(join(outputRoot, 'index.html'), renderHomeMetadata(origin)),
    replaceMetadataMarker(guidesPath, renderGuidesMetadata(origin)),
    ...guides.map(async guide => {
      const destination = join(outputRoot, canonicalPath('guide', guide.id), 'index.html');
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, renderGuidePage(guide, origin));
    }),
    ...Object.entries(stories).map(async ([id, story]) => {
      const destination = join(outputRoot, canonicalPath('story', id), 'index.html');
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, renderStoryPage(story, origin));
    }),
    writeDiscoveryFiles(origin)
  ]);
  return { origin, guides: guides.length, stories: Object.keys(stories).length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildSite().then(result => console.log(`Built ${result.guides} guides and ${result.stories} stories for ${result.origin}.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
