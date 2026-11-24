// Render a frame-exact video clip of the SLP-5 3D viewer.
//
// The scene advances by requestAnimationFrame timestamps, so a screen recording
// stutters. Here the page runs on a virtual clock: each step advances exactly
// 1/FPS seconds and the viewer is screenshotted (labels and beam key included).
// Frames are then encoded with ffmpeg.
//
// Usage (site built and served, e.g. `python3 -m http.server 4329` in dist/):
//   node scripts/video/render_slp_clip.mjs --out exports/slp-5/slp-5-deck-split.mp4
// Options: --url, --width, --height (output px), --scale (CSS->output px),
//          --fps, --start, --end (scene seconds), --frames-dir, --test
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';

// Playwright may be installed globally rather than in this project.
const { chromium } = createRequire(import.meta.url)('playwright');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? 'true' : all[i + 1]]);
    return acc;
  }, [])
);
const URL = args.url ?? 'http://localhost:4329/projects/debris-remediation/';
const OUT_W = Number(args.width ?? 1920);
const OUT_H = Number(args.height ?? 1080);
const SCALE = Number(args.scale ?? 1.5); // CSS px -> output px; also the WebGL pixel ratio
const FPS = Number(args.fps ?? 60);
const START = Number(args.start ?? 10); // scene seconds; decks separate at 13 s, rejoin at 23.5 s
const END = Number(args.end ?? 26.5);
const OUT = args.out ?? 'exports/slp-5/slp-5-deck-split.mp4';
const FRAMES = args['frames-dir'] ?? path.join(path.dirname(OUT), '.frames');
const TEST = args.test === 'true';

const vw = Math.round(OUT_W / SCALE);
const vh = Math.round(OUT_H / SCALE);

// Virtual clock: performance.now / Date.now / rAF only move when __step() is called.
const clockScript = () => {
  let now = 1000;
  const epoch = Date.now();
  let queue = [];
  let id = 0;
  performance.now = () => now;
  Date.now = () => epoch + now;
  window.requestAnimationFrame = cb => {
    queue.push({ id: ++id, cb });
    return id;
  };
  window.cancelAnimationFrame = h => {
    queue = queue.filter(q => q.id !== h);
  };
  // Labels fade in CSS on wall-clock time; replace that with a fade on the virtual clock.
  const FADE = 0.35;
  const fade = new WeakMap();
  window.__step = ms => {
    now += ms;
    const run = queue;
    queue = [];
    for (const q of run) q.cb(now);
    for (const el of document.querySelectorAll('.slp-label')) {
      const target = el.style.opacity === '1' ? 1 : 0;
      const cur = fade.has(el) ? fade.get(el) : target;
      const next = cur + Math.sign(target - cur) * Math.min(Math.abs(target - cur), ms / 1000 / FADE);
      fade.set(el, next);
      el.style.opacity = String(next);
    }
    return run.length;
  };
};

const css = `
  html, body { overflow: hidden !important; }
  [data-slp-viewer] { position: fixed !important; inset: 0 !important; z-index: 2147483647 !important;
    border: 0 !important; margin: 0 !important; }
  [data-slp-viewer] .slp-stage { width: 100vw !important; height: 100vh !important; max-height: none !important;
    aspect-ratio: auto !important; }
  [data-slp-viewer] figcaption, [data-slp-controls], [data-slp-hint], .slp-poster { display: none !important; }
  [data-slp-viewer] .slp-canvas { opacity: 1 !important; transition: none !important; }
  .slp-label { transition: none !important; }
`;

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: SCALE });
page.on('pageerror', e => console.error('page error:', e.message));
await page.addInitScript(clockScript);
await page.goto(URL, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: css });
await page.evaluate(() => document.fonts.ready);

// Kick the lazy loader (IntersectionObserver) and wait for the scene module.
await page.evaluate(() => document.querySelector('[data-slp-viewer]').scrollIntoView());
for (let i = 0; i < 400; i++) {
  const live = await page.evaluate(() => {
    window.__step(16);
    return document.querySelector('[data-slp-viewer]')?.classList.contains('is-live');
  });
  if (live) break;
  await page.waitForTimeout(50);
}
const live = await page.evaluate(() => document.querySelector('[data-slp-viewer]').classList.contains('is-live'));
if (!live) throw new Error('3D viewer never started (no WebGL?)');

// The first rAF after start sets t=0. Fast-forward to START in 50 ms steps (the scene caps dt at 50 ms).
const dtMs = 1000 / FPS;
let t = 0;
const t0 = Date.now();
while (t < START - 1e-9) {
  const step = Math.min(50, (START - t) * 1000);
  await page.evaluate(s => window.__step(s), step);
  t += step / 1000;
}
console.log(`fast-forwarded to ${START}s in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

const stage = page.locator('[data-slp-viewer] .slp-stage');
const total = TEST ? 3 : Math.round((END - START) * FPS);
if (existsSync(FRAMES)) rmSync(FRAMES, { recursive: true });
mkdirSync(FRAMES, { recursive: true });
const t1 = Date.now();
for (let i = 0; i < total; i++) {
  await page.evaluate(s => window.__step(s), dtMs);
  await stage.screenshot({ path: path.join(FRAMES, `f${String(i).padStart(5, '0')}.png`), animations: 'disabled' });
  if (i % 60 === 0) {
    const per = (Date.now() - t1) / (i + 1) / 1000;
    console.log(`frame ${i}/${total}  ${per.toFixed(2)} s/frame  eta ${((total - i) * per / 60).toFixed(1)} min`);
  }
}
await browser.close();

if (TEST) {
  console.log(`test frames in ${FRAMES}`);
  process.exit(0);
}

mkdirSync(path.dirname(OUT), { recursive: true });
const ff = spawnSync(
  'ffmpeg',
  [
    '-y', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.png'),
    '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos,format=yuv420p`,
    '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.2', '-preset', 'slow', '-crf', '17',
    '-movflags', '+faststart', '-an', OUT,
  ],
  { stdio: 'inherit' }
);
if (ff.status !== 0) throw new Error('ffmpeg failed');
console.log(`wrote ${OUT}`);
