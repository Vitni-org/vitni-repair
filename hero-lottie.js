import { DotLottie } from '/node_modules/@lottiefiles/dotlottie-web/dist/index.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const specs = [
  ['#heroLottie', '/animations/vitni-repair-v3.json'],
  ['#guideHeroLottie', '/animations/vitni-repair-v3.json']
];
DotLottie.setWasmUrl('/node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm');
let guideLoadingPlayer = null;
const autoplay = !reducedMotion.matches;
document.addEventListener('repairlens:guide-loading', event => {
  if (!guideLoadingPlayer) return;
  if (event.detail?.active && autoplay) guideLoadingPlayer.play();
  else guideLoadingPlayer.pause();
});

for (const [selector, src] of specs) {
  const canvas = document.querySelector(selector);
  if (!canvas) continue;
  const player = new DotLottie({ canvas, src, autoplay, loop: true, renderConfig: { autoResize: true, devicePixelRatio: 1.25 } });
  player.addEventListener('loadError', event => console.error('Lottie load error:', src, event.error));
  player.addEventListener('renderError', event => console.error('Lottie render error:', src, event.error));
}
const guideLoadingCanvas = document.querySelector('#guideLoadingLottie');
guideLoadingPlayer = guideLoadingCanvas ? new DotLottie({ canvas: guideLoadingCanvas, src: '/animations/repair-route.json', autoplay: false, loop: true, renderConfig: { autoResize: true, devicePixelRatio: 1.25 } }) : null;
