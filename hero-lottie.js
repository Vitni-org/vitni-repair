import { DotLottie } from '/node_modules/@lottiefiles/dotlottie-web/dist/index.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const animations = [
  ['#heroLottie', '/animations/repair-orbit.json'],
  ['#repairFlowLottie', '/animations/repair-route.json']
];
if (!reducedMotion.matches) {
  DotLottie.setWasmUrl('/node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm');
  animations.forEach(([selector, src]) => {
    const canvas = document.querySelector(selector);
    if (canvas) new DotLottie({ canvas, src, autoplay: true, loop: true, renderConfig: { autoResize: true, devicePixelRatio: 1.5 } });
  });
} else {
  animations.forEach(([selector]) => { const canvas = document.querySelector(selector); if (canvas) canvas.hidden = true; });
}
