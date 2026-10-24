import { DotLottie } from '/node_modules/@lottiefiles/dotlottie-web/dist/index.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const animations = [
  ['#heroLottie', '/animations/repair-orbit.json'],
  ['#repairFlowLottie', '/animations/repair-route.json']
];
DotLottie.setWasmUrl('/node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm');
const players = animations.flatMap(([selector, src]) => {
  const canvas = document.querySelector(selector);
  if (!canvas) return [];
  return [new DotLottie({ canvas, src, autoplay: !reducedMotion.matches, loop: true, renderConfig: { autoResize: true, devicePixelRatio: 1.5 } })];
});
const motionToggle = document.querySelector('#motionToggle');
if (motionToggle) {
  let playing = !reducedMotion.matches;
  const updateMotionControl = () => {
    motionToggle.textContent = playing ? 'Pause animation' : 'Play animation';
    motionToggle.setAttribute('aria-pressed', String(playing));
    document.body.classList.toggle('animations-paused', !playing);
  };
  updateMotionControl();
  motionToggle.addEventListener('click', () => {
    playing = !playing;
    players.forEach(player => playing ? player.play() : player.pause());
    updateMotionControl();
  });
}
