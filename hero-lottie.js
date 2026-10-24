import { DotLottie } from '/node_modules/@lottiefiles/dotlottie-web/dist/index.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const specs = [
  ['#heroLottie', '/animations/vitni-repair-v4.json'],
  ['#guideHeroLottie', '/animations/vitni-repair-v4.json']
];

DotLottie.setWasmUrl('/node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm');

const players = [];
let startPromise = null;

const getCanvas = selector => document.querySelector(selector);
const staticFallback = canvas => {
  const wrapper = canvas?.parentElement;
  wrapper?.classList.remove('vitni-loading');
  wrapper?.classList.add('show-static-vitni');
};
const prepareAnimation = canvas => {
  const wrapper = canvas?.parentElement;
  wrapper?.classList.remove('show-static-vitni');
  wrapper?.classList.add('vitni-loading');
};
const showAnimation = canvas => {
  if (!reducedMotion.matches) {
    canvas?.parentElement?.classList.remove('show-static-vitni', 'vitni-loading');
  }
};

function startVitniPlayers() {
  if (reducedMotion.matches) {
    specs.forEach(([selector]) => staticFallback(getCanvas(selector)));
    return Promise.resolve();
  }

  if (players.length) {
    specs.forEach(([selector]) => prepareAnimation(getCanvas(selector)));
    players.forEach(player => player.play());
    return Promise.resolve();
  }
  if (startPromise) return startPromise;

  // Keep the canvas laid out while its first frame renders. Hiding it with
  // display:none prevents DotLottie from ever producing that first frame.
  specs.forEach(([selector]) => prepareAnimation(getCanvas(selector)));
  startPromise = Promise.resolve().then(() => {
    for (const [selector, src] of specs) {
      const canvas = getCanvas(selector);
      if (!canvas || reducedMotion.matches) continue;

      const player = new DotLottie({
        canvas,
        src,
        autoplay: true,
        loop: true,
        renderConfig: { autoResize: true, devicePixelRatio: 1.25 }
      });
      players.push(player);
      player.addEventListener('render', () => showAnimation(canvas));
      player.addEventListener('loadError', event => {
        staticFallback(canvas);
        console.error('Vitni Lottie load error:', src, event.error);
      });
      player.addEventListener('renderError', event => {
        staticFallback(canvas);
        console.error('Vitni Lottie render error:', src, event.error);
      });
    }
  }).catch(error => {
    specs.forEach(([selector]) => staticFallback(getCanvas(selector)));
    console.error('Vitni animation unavailable:', error);
  });
  return startPromise;
}

const guideLoadingCanvas = getCanvas('#guideLoadingLottie');
const guideLoadingPlayer = guideLoadingCanvas && !reducedMotion.matches
  ? new DotLottie({ canvas: guideLoadingCanvas, src: '/animations/repair-route.json', autoplay: false, loop: true, renderConfig: { autoResize: true, devicePixelRatio: 1.25 } })
  : null;

document.addEventListener('repairlens:guide-loading', event => {
  if (!guideLoadingPlayer) return;
  if (event.detail?.active && !reducedMotion.matches) guideLoadingPlayer.play();
  else guideLoadingPlayer.pause();
});

void startVitniPlayers();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) players.forEach(player => player.pause());
  else if (!reducedMotion.matches) players.forEach(player => player.play());
});
reducedMotion.addEventListener('change', event => {
  if (event.matches) {
    players.forEach(player => player.pause());
    guideLoadingPlayer?.pause();
    specs.forEach(([selector]) => staticFallback(getCanvas(selector)));
  } else {
    specs.forEach(([selector]) => prepareAnimation(getCanvas(selector)));
    void startVitniPlayers();
  }
});
