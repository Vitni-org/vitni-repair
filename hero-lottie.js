import { DotLottie } from '/node_modules/@lottiefiles/dotlottie-web/dist/index.js';

const canvas = document.querySelector('#heroLottie');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (canvas && !reducedMotion.matches) {
  DotLottie.setWasmUrl('/node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm');
  new DotLottie({ canvas, src: '/animations/repair-orbit.json', autoplay: true, loop: true, renderConfig: { autoResize: true, devicePixelRatio: 1.5 } });
} else if (canvas) {
  canvas.hidden = true;
}
