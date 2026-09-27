// Image-analysis sidecar — keeps ALL heavy AI (NSFW classifier + CLIP craft
// probe) OUT of the Next.js server process (same pattern as face-api).
//
// WHY a sidecar: (a) on Windows, ONNX in the same process as libvips (sharp)
// aborts libvips and takes the server down; (b) the pure-JS tfjs NSFW
// classifier pegs the event loop ~5s per image — in the web process it would
// stall every other request during uploads. Here, /classify latency is
// invisible to users (the upload API is async/job-based).
//
// Two models, two jobs, DIFFERENT trust levels (calibrated 2026-09-27 against
// real marketplace photos — see scripts/calibrate-clip.mjs):
//   1. nsfwjs (MobileNetV2, dedicated trained NSFW model) — RELIABLE. Drives
//      hard reject / flag decisions in the web app.
//   2. CLIP zero-shot "handicraft relevance" — ADVISORY ONLY. Measured on real
//      artisan photos it ranks genuine handicrafts BELOW random photos
//      (base-patch32 zero-shot is not discriminative for this domain), so its
//      score is surfaced to admins as a weak signal, never used to auto-flag.
//
// The sidecar does NO image decoding: the web app sends the already-resized
// 224x224 RGB pixels (base64), so no native image library is needed here.
//
// Run (from web/):  node scripts/clip-sidecar.mjs
//   PORT       default 8091
// Models download once into web/.transformers-cache and are reused.
//
// Endpoints:
//   GET  /health    → { ok, models: 'loaded' | 'loading' | 'unloaded' }
//   POST /warm      → kicks off model loads, returns immediately
//   POST /classify  { width, height, dataBase64 }  (224x224 RGB bytes)
//                   → { nsfw: { porn, hentai, sexy, ... }, craft: 0..1 | null }

import http from 'node:http';
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';
import { RawImage, env, pipeline } from '@xenova/transformers';

const PORT = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 8091;
env.cacheDir = new URL('../.transformers-cache/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const CRAFT_LABEL = 'a photo of a handcrafted basket, textile, pottery or woodcraft product';
const CRAFT_LABELS = [
  CRAFT_LABEL,
  'a random snapshot of a car, machine, vehicle or building',
  'a screenshot of a computer screen or document',
  'a selfie or portrait photo of a person',
  'a photo of food, a meal or a drink',
];

let clipPromise = null;
let nsfwPromise = null;
let modelsReady = false;

function load() {
  clipPromise ??= pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32')
    .then((p) => { console.log('[image-api] CLIP ready'); return p; })
    .catch((e) => { clipPromise = null; console.error('[image-api] CLIP load failed:', e.message); throw e; });
  nsfwPromise ??= nsfwjs.load()
    .then((m) => { console.log('[image-api] NSFW model ready'); return m; })
    .catch((e) => { nsfwPromise = null; console.error('[image-api] NSFW load failed:', e.message); throw e; });
  return Promise.allSettled([clipPromise, nsfwPromise]).then(([c, n]) => {
    if (c.status === 'fulfilled' && n.status === 'fulfilled') modelsReady = true;
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, models: modelsReady ? 'loaded' : clipPromise || nsfwPromise ? 'loading' : 'unloaded' }));
      return;
    }
    if (req.method === 'POST' && req.url === '/warm') {
      void load().catch(() => {});
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'warming' }));
      return;
    }
    if (req.method === 'POST' && req.url === '/classify') {
      const body = JSON.parse((await readBody(req)).toString('utf8'));
      const width = Number(body.width), height = Number(body.height);
      const pixels = Buffer.from(String(body.dataBase64 ?? ''), 'base64');
      if (!width || !height || pixels.length < width * height * 3) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'width, height and dataBase64 (RGB bytes) required' }));
        return;
      }
      // 3-CHANNEL RGB for both models (nsfwjs requires [h,w,3]; CLIP gets a
      // 3-channel RawImage straight from the same bytes).
      const rgbView = new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.length);
      const tensor = tf.tensor3d(rgbView, [height, width, 3], 'int32');
      const out = { nsfw: {}, craft: null };
      try {
        const nsfw = await nsfwPromise;
        if (nsfw) {
          const preds = await nsfw.classify(tensor);
          out.nsfw = Object.fromEntries(preds.map((p) => [p.className, p.probability]));
        }
      } catch (e) { console.error('[image-api] nsfw classify failed:', e.message); }
      try {
        const clip = await clipPromise;
        if (clip) {
          const img = new RawImage(new Uint8ClampedArray(rgbView), width, height, 3);
          const scores = await clip(img, CRAFT_LABELS);
          out.craft = scores.find((o) => o.label === CRAFT_LABEL)?.score ?? null;
        }
      } catch (e) { console.error('[image-api] clip classify failed:', e.message); }
      tensor.dispose();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'sidecar error' }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[clip-api] listening on http://127.0.0.1:${PORT} — warming model…`);
  void load().catch(() => {});
});
