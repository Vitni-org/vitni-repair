import { DotLottie } from '/node_modules/@lottiefiles/dotlottie-web/dist/index.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const specs = [
  ['#heroLottie', '/animations/lottiefiles-happy-mechanic.lottie'],
  ['#guideHeroLottie', '/animations/lottiefiles-happy-mechanic.lottie'],
  ['#repairFlowLottie', '/animations/repair-route.json']
];
DotLottie.setWasmUrl('/node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm');
const players = specs.flatMap(([selector, src]) => {
  const canvas = document.querySelector(selector);
  if (!canvas) return [];
  return [new DotLottie({ canvas, src, autoplay: !reducedMotion.matches, loop: true, renderConfig: { autoResize: true, devicePixelRatio: 1.25 } })];
});
const guideLoadingCanvas = document.querySelector('#guideLoadingLottie');
const guideLoadingPlayer = guideLoadingCanvas ? new DotLottie({ canvas: guideLoadingCanvas, src: '/animations/repair-route.json', autoplay: false, loop: true, renderConfig: { autoResize: true, devicePixelRatio: 1.25 } }) : null;
if (guideLoadingPlayer) players.push(guideLoadingPlayer);
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
