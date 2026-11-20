// Minimal Chrome DevTools Protocol driver over --remote-debugging-pipe: real (trusted) mouse/keyboard input for checks
// that synthetic DOM events cannot do (opening a native <select>, popover light dismiss). No TCP port, no network.
'use strict';
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const sleep = ms => new Promise(r => setTimeout(r, ms));

exports.launch = async function (chrome, width, height) {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cfo-cdp-'));
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--hide-scrollbars',
    '--remote-debugging-pipe', '--user-data-dir=' + prof, `--window-size=${Math.max(width, 500)},${height}`, 'about:blank'],
    { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  const wr = proc.stdio[3], rd = proc.stdio[4], pend = {}; let id = 0, buf = '';
  rd.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\0')) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } } });
  const raw = (method, params, sessionId) => new Promise((res, rej) => { const i = ++id; pend[i] = m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result); wr.write(JSON.stringify({ id: i, method, params: params || {}, sessionId }) + '\0'); });
  const page = (await raw('Target.getTargets')).targetInfos.find(t => t.type === 'page');
  const sid = (await raw('Target.attachToTarget', { targetId: page.targetId, flatten: true })).sessionId;
  const send = (m, p) => raw(m, p, sid);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  const api = {
    async ev(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; },
    async goto(url) {
      await send('Page.navigate', { url });
      for (let i = 0; i < 80; i++) { await sleep(250); if (await api.ev("document.readyState==='complete'&&!!document.getElementById('main')").catch(() => false)) break; }
      await sleep(1000);
    },
    async click(x, y) { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 }); await sleep(250); },
    async move(x, y) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await sleep(200); },
    async key(key, code, vk, modifiers) { const k = { key, code, windowsVirtualKeyCode: vk, modifiers: modifiers || 0 }; await send('Input.dispatchKeyEvent', Object.assign({ type: 'rawKeyDown' }, k)); await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, k)); await sleep(200); },
    close() { try { proc.kill(); } catch (e) { } }
  };
  return api;
};
