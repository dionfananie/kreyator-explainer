// Rustwright helper: launch Chrome, open a page at a fixed viewport.
// The alpha Node binding has no viewport option, so we set it over a raw CDP session on the same browser.
import { chromium } from 'rustwright';

const CHROME = process.env.RUSTWRIGHT_CHROMIUM || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

export async function openPage(url, width, height, extraArgs = []) {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--hide-scrollbars', `--window-size=${width},${height}`, ...extraArgs] });
  const page = await browser.newPage();
  const ws = new WebSocket(browser.wsEndpoint());
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      const { ok, bad } = pending.get(d.id);
      pending.delete(d.id);
      d.error ? bad(new Error(JSON.stringify(d.error))) : ok(d.result);
    }
  };
  const send = (method, params = {}, sessionId) => new Promise((ok, bad) => {
    const i = ++id;
    pending.set(i, { ok, bad });
    ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  await page.goto(url);
  const { targetInfos } = await send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page' && t.url === url);
  if (process.env.RW_DEBUG) console.log(JSON.stringify(targetInfos.map((t) => [t.type, t.url, t.targetId])));
  let pageSession = null;
  for (const tgt of pages) {
    const { sessionId } = await send('Target.attachToTarget', { targetId: tgt.targetId, flatten: true });
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
    pageSession = sessionId;
  }
  // Raw CDP on the page session, for the few things the alpha binding lacks (clip screenshots, transparent background).
  const cdp = (method, params = {}) => send(method, params, pageSession);
  await page.evaluate(async () => {
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  });
  const close = async () => { ws.close(); await browser.close(); };
  return { browser, page, close, cdp };
}
