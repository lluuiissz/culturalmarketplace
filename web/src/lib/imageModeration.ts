// Image moderation pipeline for artisan uploads.
// Layer 1: hard rules (resolution floor, duplicate images)
// Layer 2: NSFW classifier — DEDICATED trained model (nsfwjs MobileNetV2),
//          calibrated thresholds → drives reject/flag decisions.
// Layer 3: craft relevance via CLIP zero-shot — ADVISORY ONLY (calibration on
//          real artisan photos, see scripts/calibrate-clip.mjs, showed
//          base-patch32 zero-shot ranks genuine handicrafts below random
//          photos, so the score is surfaced to admins as a weak signal; it
//          NEVER auto-flags).
//
// Verdicts:
//   reject — hard rule failed (too small, duplicate) or NSFW with high confidence.
//            Upload is refused; nothing is stored.
//   flag   — NSFW borderline. Upload proceeds BUT the product goes to
//            pending_review until an admin approves (/admin/moderation),
//            where the advisory craft score is displayed.
//   pass   — clean; product visibility unchanged.
//
// ALL heavy AI (NSFW + CLIP) runs in the sidecar process
// (scripts/clip-sidecar.mjs): (a) ONNX + libvips in one process aborts on
// Windows; (b) pure-JS tfjs pegs the event loop for seconds per image and
// would stall the whole web server. This module keeps only cheap native work
// (sharp decode/resize, dHash) and talks to the sidecar over HTTP. Sidecar
// down = fail OPEN to manual review — never block an honest artisan on
// infrastructure problems.
import * as tf from '@tensorflow/tfjs';
import { imageSize } from 'image-size';

const MIN_DIMENSION = 300;
const DUP_HAMMING = 6;
const NSFW_REJECT = 0.8;   // porn/hentai at this confidence = hard reject (trained model)
const NSFW_FLAG = 0.35;    // borderline = manual review
// Craft relevance is advisory (see header): surfaced to admins, never auto-flags.

export type ModerationVerdict =
  | { kind: 'pass' }
  | { kind: 'flag'; reasons: string[] }
  | { kind: 'reject'; reasons: string[] };

// Sharp decodes ANY format to raw RGB pixels; tfjs wraps them in a tensor for
// the dHash + the sidecar payload. (tf.node.decodeImage needs the native
// tfjs-node backend, which is not available on Vercel — sharp has prebuilt
// binaries and is.)

// ---- Native library note ---------------------------------------------------
// The ONNX/CLIP runtime lives in a SEPARATE sidecar process
// (scripts/clip-sidecar.mjs, same pattern as the face-api sidecar) because
// having ONNX and libvips/sharp in one Node process is unstable on Windows —
// libvips aborts and takes the server down. This module only uses sharp, and
// talks to CLIP over HTTP. If the sidecar isn't running, the relevance layer
// is skipped (fail-open) and nothing crashes.

import type { Sharp } from 'sharp';
type SharpFactory = (input: Buffer, options?: object) => Sharp;
let sharpLib: SharpFactory | null = null;

async function ensureSharp(): Promise<SharpFactory> {
  if (sharpLib) return sharpLib;
  const mod: unknown = await import('sharp');
  sharpLib = (typeof mod === 'function' ? mod : (mod as { default: SharpFactory }).default) as SharpFactory;
  return sharpLib;
}

// ---- Sidecar client ---------------------------------------------------------
const SIDECAR_URL = process.env.IMAGE_SIDECAR_URL ?? 'http://127.0.0.1:8091';

// One round-trip to the sidecar: NSFW class probabilities + craft relevance.
// Returns null when the sidecar is unreachable (caller fails open to manual
// review — infrastructure problems never block an honest artisan).
async function classifyViaSidecar(
  tfImg: tf.Tensor3D,
): Promise<{ nsfw: Record<string, number>; craft: number | null } | null> {
  try {
    const { data, width, height } = await tfImgToRaw(tfImg);
    const rgb = Buffer.alloc(width * height * 3);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      rgb[j] = data[i]; rgb[j + 1] = data[i + 1]; rgb[j + 2] = data[i + 2];
    }
    const res = await fetch(`${SIDECAR_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ width, height, dataBase64: rgb.toString('base64') }),
      signal: AbortSignal.timeout(45_000), // pure-JS tfjs can take a while cold
    });
    if (!res.ok) return null;
    return (await res.json()) as { nsfw: Record<string, number>; craft: number | null };
  } catch {
    return null;
  }
}

// RGBA Uint8ClampedArray view of the tensor (sidecar re-packs to RGB).
async function tfImgToRaw(tfImg: tf.Tensor3D): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  const [h, w] = tfImg.shape;
  const rgba = new Uint8ClampedArray(h * w * 4);
  const rgb = tfImg.dataSync(); // Int32Array of channel values 0..255
  for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
    rgba[j] = rgb[i]; rgba[j + 1] = rgb[i + 1]; rgba[j + 2] = rgb[i + 2]; rgba[j + 3] = 255;
  }
  return { data: rgba, width: w, height: h };
}

// 64-bit dHash as 16-hex-char string, computed from the decoded tensor.
function dHash(tensor: tf.Tensor3D): string {
  const small = tf.image.resizeBilinear(tensor, [9, 8]).mean(2); // 8 rows x 9 cols, grayscale
  const data = Array.from(small.dataSync());
  small.dispose();
  let bits = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits += data[y * 9 + x] < data[y * 9 + x + 1] ? '1' : '0';
    }
  }
  return BigInt('0b' + bits).toString(16).padStart(16, '0');
}

export function hamming(a: string, b: string): number {
  let x = BigInt('0x' + a) ^ BigInt('0x' + b);
  let count = 0;
  while (x) { count += Number(x & 1n); x >>= 1n; }
  return count;
}

export interface ModerationResult {
  kind: ModerationVerdict['kind'];
  reasons: string[];
  hash: string;
  dimensions: { width: number; height: number };
  craft: number | null;
}

export async function moderateUpload(file: { arrayBuffer: () => Promise<ArrayBuffer | Buffer>; type: string }): Promise<ModerationResult> {
  const raw = await file.arrayBuffer();
  const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);

  // Layer 1a: resolution floor — screenshots/thumbnails are junk on a craft store.
  const dim = imageSize(buffer);
  const dimensions = { width: dim.width ?? 0, height: dim.height ?? 0 };
  if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
    return { kind: 'reject', reasons: [`Image is too small (${dimensions.width}×${dimensions.height}). Use at least ${MIN_DIMENSION}×${MIN_DIMENSION} pixels — buyers zoom in on craft photos.`], hash: '', dimensions, craft: null };
  }
  // Decode with sharp (loaded lazily, after the CLIP warm-up gate), pre-resize
  // to the model's 224x224 input natively (fast), then wrap in a tensor for the
  // classifier. dHash comes from the same tensor — the slow JS backend only
  // runs the 224x224 network forward pass and nothing else.
  const sharp = await ensureSharp();
  const small = await sharp(buffer).resize(224, 224).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const tfImg = tf.tensor3d(new Uint8Array(small.data), [224, 224, 4], 'int32').slice([0, 0, 0], [224, 224, 3]) as tf.Tensor3D;
  const hash = dHash(tfImg);

  try {
    // Both classifiers run in the sidecar process (see header note).
    const cls = await classifyViaSidecar(tfImg);
    if (!cls) {
      return { kind: 'flag', reasons: ['Automatic image check unavailable — queued for manual review.'], hash, dimensions, craft: null };
    }
    const explicit = (cls.nsfw.porn ?? 0) + (cls.nsfw.hentai ?? 0) + (cls.nsfw.sexy ?? 0) * 0.5;

    // Layer 1b: duplicate image across products.
    const dup = await findDuplicateHash(hash);

    // Layer 3 (advisory): does this look like a handcrafted product at all?
    // NEVER auto-flags — the admin queue displays it as a weak signal.
    const craftScore = cls.craft;

    // Layer 2 (decision): NSFW from the dedicated trained model.
    const reasons: string[] = [];
    if (explicit >= NSFW_REJECT) reasons.push('This image looks inappropriate for a craft marketplace. Product photos must show your handicraft.');
    if (dup) reasons.push('This exact image is already used on another product. Each product needs its own photo.');
    if (reasons.length > 0) {
      return { kind: 'reject', reasons, hash, dimensions, craft: craftScore };
    }

    if (explicit >= NSFW_FLAG) {
      return { kind: 'flag', reasons: ['Image needs a quick manual check before going live.'], hash, dimensions, craft: craftScore };
    }
    return { kind: 'pass', reasons: [], hash, dimensions, craft: craftScore };
  } catch (e) {
    console.error('imageModeration: classifier failed, failing open:', e);
    return { kind: 'flag', reasons: ['Automatic image check unavailable — queued for manual review.'], hash: '', dimensions, craft: null };
  } finally {
    tfImg.dispose();
  }
}

async function findDuplicateHash(hash: string): Promise<string | null> {
  // Imported lazily so the module can load in tests without DB env.
  const { isDuplicateMediaHash, saveMediaHash } = await import('./mediaHashDb');
  const dup = await isDuplicateMediaHash(hash, DUP_HAMMING);
  return dup;
}

export { NSFW_REJECT, NSFW_FLAG, MIN_DIMENSION, DUP_HAMMING };

// Called from instrumentation at server boot: tells the sidecar to start
// loading its model (fire-and-forget). If the sidecar isn't up, this is a
// harmless no-op — the relevance layer just stays skipped until it is.
export async function warmUpClip(): Promise<boolean> {
  try {
    const res = await fetch(`${SIDECAR_URL}/warm`, { method: 'POST', signal: AbortSignal.timeout(3_000) });
    return res.ok;
  } catch {
    return false;
  }
}
export function saveMediaHashRef(productId: number, hash: string) {
  return import('./mediaHashDb').then((m) => m.saveMediaHash(productId, hash));
}
