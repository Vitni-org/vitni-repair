import { DotLottie } from '/node_modules/@lottiefiles/dotlottie-web/dist/index.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const specs = [
  ['#heroLottie', '/animations/vitni-repair.json'],
  ['#guideHeroLottie', '/animations/vitni-repair.json'],
  ['#repairFlowLottie', '/animations/repair-route.json']
];
DotLottie.setWasmUrl('/node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm');
const players = [];
let guideLoadingPlayer = null;
let playing = !reducedMotion.matches;
const motionToggle = document.querySelector('#motionToggle');
function updateMotion() {
  players.forEach(player => playing ? player.play() : player.pause());
  if (!motionToggle) return;
  motionToggle.textContent = playing ? 'Pause animation' : 'Play animation';
  motionToggle.setAttribute('aria-pressed', String(playing));
  document.body.classList.toggle('animations-paused', !playing);
}
if (motionToggle) motionToggle.addEventListener('click', () => { playing = !playing; updateMotion(); });
document.addEventListener('repairlens:guide-loading', event => {
  if (!guideLoadingPlayer) return;
  if (event.detail?.active && playing) guideLoadingPlayer.play();
  else guideLoadingPlayer.pause();
});

for (const [selector, src] of specs) {
  const canvas = document.querySelector(selector);
  if (!canvas) continue;
  const player = new DotLottie({ canvas, src, autoplay: playing, loop: true, renderConfig: { autoResize: true, devicePixelRatio: 1.25 } });
  player.addEventListener('loadError', event => console.error('Lottie load error:', src, event.error));
  player.addEventListener('renderError', event => console.error('Lottie render error:', src, event.error));
  players.push(player);
}
const guideLoadingCanvas = document.querySelector('#guideLoadingLottie');
guideLoadingPlayer = guideLoadingCanvas ? new DotLottie({ canvas: guideLoadingCanvas, src: '/animations/repair-route.json', autoplay: false, loop: true, renderConfig: { autoResize: true, devicePixelRatio: 1.25 } }) : null;
if (guideLoadingPlayer) players.push(guideLoadingPlayer);
updateMotion();
