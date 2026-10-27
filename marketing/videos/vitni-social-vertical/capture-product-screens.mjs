import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputDirectory = resolve("assets/screenshots");
await mkdir(outputDirectory, { recursive: true });
const targets = await (await fetch("http://127.0.0.1:9222/json")).json();
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("No Chrome page is available on the capture port.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolveOpen, reject) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveResult, reject) => pending.set(id, { resolve: resolveResult, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 432,
  height: 912,
  deviceScaleFactor: 3,
  mobile: true,
  screenWidth: 432,
  screenHeight: 912,
});

async function navigate(url, screenshotName, scrollSelector = null, waitForSelector = null) {
  await send("Page.navigate", { url });
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
    ready = await evaluate("document.readyState === 'complete'").catch(() => false);
    if (ready) break;
  }
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 900));
  await evaluate(`(() => {
    const reject = [...document.querySelectorAll('button')].find((button) => /reject analytics|decline analytics/i.test(button.innerText || ''));
    reject?.click();
  })()`);
  if (screenshotName === "05-community.png") {
    // Google Maps blocks headless capture; keep Vitni's real Paris venue cards clean and readable.
    await evaluate("document.querySelector('.community-map iframe')?.remove()");
  }
  if (scrollSelector) {
    const scrollResult = await evaluate(`(() => {
      const target = document.querySelector(${JSON.stringify(scrollSelector)});
      if (!target) return { found: false, scrollY: window.scrollY };
      const offset = ${screenshotName === "03-guide.png" ? 180 : 60};
      window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset), behavior: "instant" });
      return { found: true, scrollY: window.scrollY };
    })()`);
    console.log(`${screenshotName} scroll: ${JSON.stringify(scrollResult)}`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 450));
  }
  if (waitForSelector) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const found = await evaluate(`Boolean(document.querySelector(${JSON.stringify(waitForSelector)}))`);
      if (found) break;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
    }
  }
  const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  await writeFile(resolve(outputDirectory, screenshotName), Buffer.from(image.data, "base64"));
  console.log(`Saved ${screenshotName}`);
}

await navigate("https://vitni.cc/", "01-home.png");
await navigate("https://vitni.cc/", "02-repair.png", "#diagnose", "form.repair-tool");
await navigate("https://vitni.cc/guides/bike-flat/", "03-guide.png", ".guide-step", ".guide-step");
await navigate("https://vitni.cc/guides/", "04-library.png", "#library-title");
await navigate("https://vitni.cc/", "05-community.png", ".community-venues");
await navigate("https://vitni.cc/guides/bike-flat/", "06-pwa.png");

socket.close();
