// One-off calibration probe: run the exact sidecar label set against real and
// synthetic images, print the full score distribution + craft rank.
// NOTE: no explicit sharp here — RawImage decodes AFTER the ONNX runtime has
// initialized (the only stable order on this Windows box; see clip-sidecar).
// Usage (from web/): node scripts/calibrate-clip.mjs
import { pipeline, RawImage, env } from '@xenova/transformers';
import fs from 'node:fs';
import path from 'node:path';

env.cacheDir = path.resolve(process.cwd(), '.transformers-cache') + path.sep;

const LABELS = [
  'a photo of a handcrafted basket, textile, pottery or woodcraft product',
  'a random snapshot of a car, machine, vehicle or building',
  'a screenshot of a computer screen or document',
  'a selfie or portrait photo of a person',
  'a photo of food, a meal or a drink',
  'a pornographic photo of explicit nudity',
  'a sexual or erotic photo',
];

const clip = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');

async function score(name, url) {
  const rim = await RawImage.fromURL(url);
  const r = await clip(rim, LABELS);
  const rank = r.findIndex((o) => o.label === LABELS[0]) + 1;
  console.log('--- ' + name + '   (craft rank: #' + rank + ')');
  for (const o of r) console.log('   ' + (o.score * 100).toFixed(1).padStart(5) + '%  ' + o.label.slice(0, 52));
}

const SUPABASE = 'https://kxbyzlpndmmjihicqucq.supabase.co/storage/v1/object/public/product-media';
await score('USER product #1 (real handicraft)', SUPABASE + '/products/10/23/1790413964773-7ff9330c-7220f2b4-c3a3-4803-be41-cc3142ef6c3a.jfif');
await score('USER product #2 (real handicraft)', SUPABASE + '/products/10/23/1790414009526-9b4d5faf-69029eee-d6ca-452e-989d-4327352e22f5.jfif');

for (const id of [1084, 292]) {
  await score('real photo id/' + id + ' (non-craft)', 'https://picsum.photos/id/' + id + '/800/600');
}

// Fake screenshot: white background with gray "text" lines.
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><rect width="1000" height="700" fill="white"/>'
  + Array.from({ length: 18 }, (_, i) => '<rect x="60" y="' + (50 + i * 34) + '" width="' + (300 + ((i * 97) % 500)) + '" height="14" fill="#999"/>').join('')
  + '</svg>';
fs.writeFileSync('calib-shot.svg', svg);
await score('fake screenshot (non-craft)', 'file://' + path.resolve('calib-shot.svg').replace(/\\/g, '/'));

process.exit(0);
