const descriptionInput = document.querySelector('#description');
const detectionNote = document.querySelector('#detectionNote');
const photoInput = document.querySelector('#photoInput');
const photoPreview = document.querySelector('#photoPreview');
const photoStatus = document.querySelector('#photoStatus');
const removePhoto = document.querySelector('#removePhoto');
const photoDropZone = document.querySelector('#photoDropZone');
let photoName = '';
let suggestedParts = [];

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function setPhoto(file) {
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    photoStatus.textContent = 'Choose a PNG, JPEG, or WebP photo.';
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    photoStatus.textContent = 'This photo is over 8 MB. Choose a smaller one.';
    return;
  }
  if (photoPreview.src.startsWith('blob:')) URL.revokeObjectURL(photoPreview.src);
  photoName = file.name;
  photoPreview.src = URL.createObjectURL(file);
  photoPreview.hidden = false;
  photoStatus.textContent = `Photo ready: ${photoName}`;
  removePhoto.hidden = false;
  photoDropZone.classList.add('has-photo');
}

photoInput.addEventListener('change', () => setPhoto(photoInput.files?.[0]));
removePhoto.addEventListener('click', () => {
  if (photoPreview.src.startsWith('blob:')) URL.revokeObjectURL(photoPreview.src);
  photoInput.value = '';
  photoName = '';
  photoPreview.hidden = true;
  photoPreview.removeAttribute('src');
  photoStatus.textContent = 'Add a clear photo if you have one.';
  removePhoto.hidden = true;
  photoDropZone.classList.remove('has-photo');
});
['dragenter', 'dragover'].forEach(type => photoDropZone.addEventListener(type, event => {
  event.preventDefault();
  photoDropZone.classList.add('is-dragging');
}));
['dragleave', 'drop'].forEach(type => photoDropZone.addEventListener(type, event => {
  event.preventDefault();
  photoDropZone.classList.remove('is-dragging');
}));
photoDropZone.addEventListener('drop', event => setPhoto(event.dataTransfer.files?.[0]));
document.querySelector('#heroPhotoCta').addEventListener('click', () => {
  document.querySelector('#diagnose').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
  descriptionInput.focus({ preventScroll: true });
});
document.querySelector('#useTestPhoto').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const response = await fetch('/images/test/chain-off-test.jpg');
    const blob = await response.blob();
    const file = new File([blob], 'repairlens-chain-test.jpg', { type: 'image/jpeg' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    photoInput.files = transfer.files;
    setPhoto(file);
    descriptionInput.value = 'My bike chain has slipped off the front chainring and I cannot pedal.';
  } catch {
    photoStatus.textContent = 'Could not load the sample photo. Try adding your own image.';
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#helpButton').addEventListener('click', event => {
  if (!suggestedParts.length) {
    document.querySelector('#help').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
    return;
  }
  event.preventDefault();
  const card = document.querySelector('.help-card');
  const query = encodeURIComponent(`Leroy Merlin ${suggestedParts.map(part => part.name).join(' ')}`);
  const online = encodeURIComponent(suggestedParts.map(part => part.name).join(' '));
  const renderLinks = (lat, lng) => {
    const nearby = `https://www.google.com/maps/search/?api=1&query=${query}${lat ? `&center=${lat},${lng}` : ''}`;
    card.innerHTML = `<div><strong>Find the exact part before buying</strong><p>${suggestedParts.map(part => escapeHtml(part.name)).join(' · ')}</p><span>Measure thread, length, diameter, and compatibility against the item before purchasing.</span></div><div class="part-actions"><a class="button primary" target="_blank" rel="noreferrer" href="${nearby}">Nearest Leroy Merlin</a><a class="button secondary" target="_blank" rel="noreferrer" href="https://www.leroymerlin.fr/recherche?q=${online}">Search online</a></div>`;
    document.querySelector('#help').hidden = false;
    document.querySelector('#help').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
  };
  if (!navigator.geolocation) return renderLinks();
  navigator.geolocation.getCurrentPosition(position => renderLinks(position.coords.latitude, position.coords.longitude), () => renderLinks(), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
});
document.querySelector('#saveHelp').addEventListener('click', event => {
  event.currentTarget.textContent = 'Links saved';
  event.currentTarget.disabled = true;
});

const menuButton = document.querySelector('#menuButton');
const siteMenu = document.querySelector('#siteMenu');
function setMenuOpen(open) {
  siteMenu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('menu-open', open);
}
menuButton.addEventListener('click', () => setMenuOpen(siteMenu.hidden));
siteMenu.addEventListener('click', event => { if (event.target.closest('a')) setMenuOpen(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !siteMenu.hidden) {
    setMenuOpen(false);
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!siteMenu.hidden && !siteMenu.contains(event.target) && !menuButton.contains(event.target)) setMenuOpen(false);
});

let installEvent;
const installButton = document.querySelector('#installButton');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installEvent = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installButton.hidden = true;
  installEvent = null;
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');

const stories = {
  bike: { tag: 'BIKE · SAFE DIY', title: 'Back on the road', situation: 'A chain slipped off while cycling to work. The frame and chain were intact, so it was safe to try a quick reset.', safety: 'Stop if the chain is bent, badly rusted, or keeps skipping.', steps: [['Make space', 'Shift to the smallest front gear, then pull the rear derailleur arm forward.'], ['Reseat the chain', 'Place it on the front chainring and guide it onto the rear cog.'], ['Turn slowly', 'Rotate the pedal backwards by hand until the chain runs smoothly.'], ['Check the ride', 'Spin the wheel and test a gentle gear change before setting off.']], outcome: 'Outcome: €0 spent, a short walk avoided, and a bike kept in daily use.' },
  denim: { tag: 'CLOTHES · SAFE DIY', title: 'Favourite jeans, repaired', situation: 'A short inner-seam tear appeared on a well-loved pair of jeans. The fabric around it was still strong enough to stitch.', safety: 'Choose a repair café or tailor if the denim is thin, stretched, or torn across a large area.', steps: [['Prepare the seam', 'Turn the jeans inside out and align the original seam edges.'], ['Hold it steady', 'Use pins or clips so the edges do not shift as you sew.'], ['Backstitch', 'Make short, strong backstitches along the old seam line.'], ['Finish neatly', 'Knot the thread, trim it, and check the seam with a gentle stretch.']], outcome: 'Outcome: €3 of supplies, one favourite garment kept out of the discard pile.' },
  lamp: { tag: 'HOME · REPAIR CAFÉ', title: 'A lamp gets a second life', situation: 'A family lamp stopped working. Because electrical faults can be dangerous, the owner brought it to a repair café instead of opening it at home.', safety: 'Electrical faults are not a DIY task. Unplug it and seek qualified or supervised help.', steps: [['Make it safe', 'Unplug the lamp and note any heat, smell, or visible damage.'], ['Get the right help', 'Bring it to a repair café or qualified technician for inspection.'], ['Inspect and replace', 'A volunteer checks the cord, plug, switch, and bulb holder with proper tools.'], ['Test safely', 'The repaired lamp is tested before it returns home.']], outcome: 'Outcome: a sentimental item restored safely, without replacing a working-quality lamp.' },
  window: { tag: 'HOME · SAFE DIY', title: 'Window sitting right again', situation: 'A loose hinge made a window sit unevenly and let in a draught. The glass and frame were sound.', safety: 'Stop if the glass is cracked, the frame is rotten, or the window feels too heavy to support.', steps: [['Support the window', 'Keep the sash supported so it cannot drop or twist.'], ['Find the loose point', 'Check hinge screws and look for stripped holes or missing hardware.'], ['Tighten and align', 'Tighten evenly, then make small alignment adjustments.'], ['Test the close', 'Open and close slowly, checking that the latch and seal meet cleanly.']], outcome: 'Outcome: €5 of hardware, improved fit, and a small draught reduced.' }
};
const storyButtons = [...document.querySelectorAll('.story-switch')];
function renderStory(key) {
  const story = stories[key];
  document.querySelector('#playbookTag').textContent = story.tag;
  document.querySelector('#playbookTitle').textContent = story.title;
  document.querySelector('#playbookSituation').textContent = story.situation;
  document.querySelector('#playbookSafety').textContent = story.safety;
  document.querySelector('#playbookSteps').innerHTML = story.steps.map(([title, copy]) => `<li><div><strong>${title}</strong><span>${copy}</span></div></li>`).join('');
  document.querySelector('#playbookOutcome').textContent = story.outcome;
  storyButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.story === key)));
}
storyButtons.forEach(button => button.addEventListener('click', () => renderStory(button.dataset.story)));
renderStory('bike');

function addPresentationFlow() {
  const diagnose = document.querySelector('#diagnose');
  if (!diagnose || document.querySelector('.presentation-flow')) return;
  const section = document.createElement('section');
  section.className = 'presentation-flow';
  section.setAttribute('aria-labelledby', 'flow-title');
  section.innerHTML = `<div class="presentation-flow__inner"><div class="presentation-flow__lead"><div><p class="overline">ONE CLEAR PATH</p><h2 id="flow-title">From a problem in your hand to the next right move.</h2></div><div><p>RepairLens turns a photo and a few words into a practical repair plan—then helps you source what you need nearby.</p><canvas class="presentation-flow__route" id="repairFlowLottie" aria-hidden="true"></canvas></div></div><div class="presentation-flow__steps"><article class="flow-step"><span class="flow-step__icon" aria-hidden="true"><img src="/images/icons/scan-search.svg" alt="" /></span><span class="flow-step__number">01 · SEE</span><h3>Show the issue</h3><p>Take a clear photo and describe what changed, snapped, slipped, or stopped working.</p></article><article class="flow-step"><span class="flow-step__icon" aria-hidden="true"><img src="/images/icons/sparkles.svg" alt="" /></span><span class="flow-step__number">02 · UNDERSTAND</span><h3>Get a safe route</h3><p>See likely causes, suitable tools, and clear stop signs before you take anything apart.</p></article><article class="flow-step"><span class="flow-step__icon" aria-hidden="true"><img src="/images/icons/map-pin.svg" alt="" /></span><span class="flow-step__number">03 · ACT</span><h3>Find the right help</h3><p>Locate parts and nearby repair support when the repair needs more than a home toolkit.</p></article></div></div>`;
  diagnose.before(section);
}
addPresentationFlow();

function addDiscoveryLinks() {
  const storyKeys = ['bike', 'denim', 'lamp', 'window'];
  document.querySelectorAll('.story').forEach((story, index) => {
    if (story.querySelector('.story-link')) return;
    const link = document.createElement('a');
    link.className = 'story-link';
    link.href = `/story.html?story=${storyKeys[index]}`;
    link.textContent = 'See the repair path';
    story.append(link);
  });
  const photoCopy = document.querySelector('.photo-copy');
  if (photoCopy && !photoCopy.querySelector('.photo-actions')) {
    const actions = document.createElement('div');
    actions.className = 'photo-actions';
    actions.innerHTML = '<a href="/images/test/chain-off-test.jpg" target="_blank" rel="noreferrer">Open test photo ↗</a><a href="/guides.html">Browse common guides →</a>';
    photoCopy.append(actions);
    const tip = document.createElement('p');
    tip.className = 'photo-tips';
    tip.innerHTML = '<strong>For a better match</strong>Take one close photo in good light. Include the damaged part and one wider view for context.';
    photoCopy.after(tip);
  }
  const playbook = document.querySelector('.playbook');
  if (playbook && !document.querySelector('.guide-promo')) {
    const promo = document.createElement('section');
    promo.className = 'guide-promo';
    promo.innerHTML = '<div class="guide-promo__inner"><div><p class="overline">COMMON FIXES</p><h2>Find a guide before you reach for a tool.</h2><p>Browse clear starting points for bikes, windows, doors, kitchens, walls, and clothes.</p></div><a class="button" href="/guides.html">Explore guides →</a></div>';
    playbook.after(promo);
  }
}
addDiscoveryLinks();

const storyPhotos = {
  'bike-chain.svg': ['/images/generated/bike-chain-story.jpg', 'Generated photo of a bicycle chain being repaired'],
  'denim-seam.svg': ['/images/generated/denim-seam-story.jpg', 'Generated photo of a denim seam being repaired'],
  'lamp-repair.svg': ['/images/generated/lamp-repair-story.jpg', 'Generated photo of a table lamp at a repair cafe'],
  'window-hinge.svg': ['/images/generated/window-hinge-story.jpg', 'Generated photo of a window hinge being adjusted']
};
document.querySelectorAll('.story img').forEach(image => {
  const key = Object.keys(storyPhotos).find(name => image.src.includes(name));
  if (key) [image.src, image.alt] = storyPhotos[key];
});

function renderVisionAnalysis(assessment) {
  const safetyLabels = { safe_diy: 'Safe to try yourself', get_help: 'Get local repair help', do_not_attempt: 'Do not attempt this repair' };
  document.querySelector('#resultTitle').textContent = assessment.likely_issue;
  document.querySelector('#safetyTitle').textContent = safetyLabels[assessment.safety] || 'Repair assessment';
  document.querySelector('#safetyCopy').textContent = assessment.summary;
  document.querySelector('#facts').innerHTML = `<div><small>CONFIDENCE</small><strong>${assessment.confidence}%</strong></div><div><small>SAFETY</small><strong>${escapeHtml(assessment.safety.replaceAll('_', ' '))}</strong></div><div><small>PARTS</small><strong>${assessment.parts.length}</strong></div>`;
  document.querySelector('#steps').innerHTML = assessment.steps.map((step, index) => `<li class="repair-step"><figure class="repair-step__visual" data-visual="${index}"><div class="step-visual-loading" aria-hidden="true"><span></span></div><figcaption>Drawing this step…</figcaption></figure><div class="repair-step__copy"><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.instruction)}</p></div></li>`).join('');
  suggestedParts = assessment.parts;
  document.querySelector('#tools').innerHTML = assessment.parts.length ? assessment.parts.map(part => `<li><strong>${escapeHtml(part.name)}</strong><br><small>${escapeHtml(part.details)}</small></li>`).join('') : '<li>No replacement parts identified. Ask a repair café to confirm.</li>';
  const partQuery = encodeURIComponent(assessment.parts.map(part => `${part.name} ${part.details}`).join(' '));
  document.querySelector('#partsLinks').innerHTML = assessment.parts.length ? `<a class="parts-search-link" href="https://www.google.com/search?tbm=shop&q=${partQuery}" target="_blank" rel="noreferrer">Compare replacement parts ↗</a>` : '';
  document.querySelector('#impact').innerHTML = '<strong>Your item, kept in use.</strong><p>Check dimensions and compatibility before buying. AI illustrations are visual hints; follow the written instructions and safety notes.</p>';
  detectionNote.hidden = false;
  detectionNote.textContent = `AI-assisted starting point from your description${photoInput.files?.[0] ? ' and photo' : ''}. Confirm the item and measurements before you begin.`;
  const result = document.querySelector('#result');
  result.hidden = false;
  result.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
}

async function addStepIllustrations(assessment) {
  const response = await fetch('/api/illustrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: assessment.likely_issue, steps: assessment.steps }) });
  const payload = await response.json();
  if (!response.ok) throw Error(payload.error || 'The written plan is ready, but its illustrations could not be generated.');
  payload.visuals.forEach((src, index) => {
    const figure = document.querySelector(`[data-visual="${index}"]`);
    if (!figure) return;
    if (!src) {
      figure.innerHTML = '<div class="step-visual-fallback" aria-hidden="true">Visual unavailable</div><figcaption>Use the written instructions for this step.</figcaption>';
      return;
    }
    const image = document.createElement('img');
    image.src = src;
    image.alt = `AI-generated illustrative drawing for step ${index + 1}: ${assessment.steps[index].title}`;
    image.loading = 'lazy';
    figure.replaceChildren(image, Object.assign(document.createElement('figcaption'), { textContent: 'Illustrative drawing · verify parts and fit' }));
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.querySelector('#diagnoseButton').addEventListener('click', async event => {
  event.preventDefault();
  const file = photoInput.files?.[0];
  const description = descriptionInput.value.trim();
  const result = document.querySelector('#result');
  const loading = document.querySelector('#guideLoading');
  const loadingText = document.querySelector('#guideLoadingText');
  const button = event.currentTarget;
  if (!description) {
    detectionNote.hidden = false;
    detectionNote.textContent = 'Describe what happened in a few words so the repair guide has context.';
    descriptionInput.focus();
    return;
  }
  let planRendered = false;
  button.disabled = true;
  button.textContent = 'Building your guide…';
  result.hidden = false;
  loading.hidden = false;
  loadingText.textContent = file ? 'Looking closely at your photo and description…' : 'Finding a safe repair route from your description…';
  document.dispatchEvent(new CustomEvent('repairlens:guide-loading', { detail: { active: true } }));
  try {
    const image = file ? await fileToDataUrl(file) : undefined;
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, description }) });
    const payload = await response.json();
    if (!response.ok) throw Error(payload.error || 'Guide generation failed.');
    renderVisionAnalysis(payload);
    planRendered = true;
    loading.hidden = false;
    loadingText.textContent = `Your plan is ready. Drawing ${payload.steps.length} step illustrations…`;
    await addStepIllustrations(payload);
  } catch (error) {
    if (planRendered) {
      loadingText.textContent = 'The repair plan is ready, but some illustrations could not be generated. Follow the written steps and try again later.';
      document.querySelectorAll('.repair-step__visual').forEach(figure => {
        if (!figure.querySelector('img')) figure.innerHTML = '<div class="step-visual-fallback" aria-hidden="true">Illustration unavailable</div><figcaption>Follow the written step above.</figcaption>';
      });
    } else {
      detectionNote.hidden = false;
      detectionNote.textContent = `Could not build the repair guide: ${error.message}. Check your connection and try again.`;
    }
  } finally {
    loading.hidden = true;
    document.dispatchEvent(new CustomEvent('repairlens:guide-loading', { detail: { active: false } }));
    button.disabled = false;
    button.innerHTML = 'Get my repair steps <svg aria-hidden="true"><use href="#arrow" /></svg>';
  }
});
