// Multi-tier face verification client for the OpenCV YuNet + SFace pipeline.
//
// Tier 1: High-speed HTTP to the FastAPI microservice (http://127.0.0.1:8001)
// Tier 2: Direct Python CLI execution via face-api/verify_cli.py
// Tier 3: Auto-supervises background daemon so port 8001 is brought up automatically
//
// If neither HTTP nor Python is available, degrades cleanly to 'skipped'.

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const BASE = (process.env.FACE_API_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

export type FaceOutcome<T> =
  | { status: 'ok'; data: T }
  | { status: 'skipped' }
  | { status: 'error'; message: string };

export interface VerifyResult {
  match: boolean;
  distance: number;
  confidence: number;
  selfie_embedding: number[];
}

export interface DuplicateResult {
  is_duplicate: boolean;
  matched_artisan_id: number | null;
  distance: number | null;
}

// ---------------------------------------------------------------------------
// Python Environment & Script Discovery
// ---------------------------------------------------------------------------
let cachedPythonCmd: string | null = null;

function findPython(): string | null {
  if (cachedPythonCmd) return cachedPythonCmd;
  const candidates = [
    'py',
    'python',
    'python3',
    'C:\\Users\\Admin\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
  ];
  for (const cmd of candidates) {
    try {
      const res = spawnSync(cmd, ['--version'], { encoding: 'utf8', timeout: 2000, windowsHide: true });
      if (res.status === 0 || (res.stdout && res.stdout.includes('Python'))) {
        cachedPythonCmd = cmd;
        return cmd;
      }
    } catch {
      // try next
    }
  }
  return null;
}

function findFaceCli(): { scriptPath: string; dirPath: string } | null {
  const possiblePaths = [
    path.resolve(process.cwd(), '..', 'face-api', 'verify_cli.py'),
    path.resolve(process.cwd(), 'face-api', 'verify_cli.py'),
    path.resolve(__dirname, '..', '..', '..', 'face-api', 'verify_cli.py'),
  ];
  for (const p of possiblePaths) {
    if (fsSync.existsSync(p)) {
      return { scriptPath: p, dirPath: path.dirname(p) };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Background Microservice Supervisor
// ---------------------------------------------------------------------------
let daemonAttempted = false;

export function ensureFaceDaemon(): void {
  if (daemonAttempted) return;
  daemonAttempted = true;

  const python = findPython();
  const cli = findFaceCli();
  if (!python || !cli) return;

  try {
    fetch('http://127.0.0.1:8001/health', { signal: AbortSignal.timeout(1500) })
      .then((r) => {
        if (!r.ok) spawnDaemon();
      })
      .catch(() => {
        spawnDaemon();
      });
  } catch {
    spawnDaemon();
  }

  function spawnDaemon() {
    try {
      const child = spawn(
        python!,
        ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8001'],
        {
          cwd: cli!.dirPath,
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        }
      );
      child.unref();
    } catch {
      // Non-fatal, CLI runner takes over
    }
  }
}

// ---------------------------------------------------------------------------
// Tier 1: HTTP Client
// ---------------------------------------------------------------------------
async function callHttp<T>(pathUrl: string, form: FormData): Promise<FaceOutcome<T>> {
  if (!BASE) return { status: 'skipped' };
  try {
    const res = await fetch(`${BASE}${pathUrl}`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      let detail = `face-api returned ${res.status}`;
      try {
        const body = await res.json();
        detail = body.detail?.error ?? body.detail ?? detail;
      } catch {
        /* keep default */
      }
      return { status: 'error', message: detail };
    }
    return { status: 'ok', data: (await res.json()) as T };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'face-api unreachable' };
  }
}

// ---------------------------------------------------------------------------
// Tier 2: Direct CLI Fallback Execution
// ---------------------------------------------------------------------------
async function runPythonCliVerify(idImage: ArrayBuffer, selfie: ArrayBuffer): Promise<FaceOutcome<VerifyResult>> {
  const python = findPython();
  const cli = findFaceCli();
  if (!python || !cli) {
    return { status: 'skipped' };
  }

  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tmpId = path.join(os.tmpdir(), `id_${nonce}.jpg`);
  const tmpSelfie = path.join(os.tmpdir(), `selfie_${nonce}.jpg`);

  try {
    await fs.writeFile(tmpId, Buffer.from(idImage));
    await fs.writeFile(tmpSelfie, Buffer.from(selfie));

    const res = spawnSync(python, [cli.scriptPath, 'verify', tmpId, tmpSelfie], {
      cwd: cli.dirPath,
      encoding: 'utf8',
      timeout: 25_000,
      windowsHide: true,
    });

    if (res.error) {
      return { status: 'error', message: res.error.message };
    }

    const stdout = (res.stdout || '').trim();
    if (!stdout) {
      return { status: 'error', message: (res.stderr || 'No response from face verification model.').trim() };
    }

    const parsed = JSON.parse(stdout);
    if (parsed.status === 'ok') {
      return {
        status: 'ok',
        data: {
          match: Boolean(parsed.match),
          distance: Number(parsed.distance),
          confidence: Number(parsed.confidence),
          selfie_embedding: parsed.selfie_embedding || [],
        },
      };
    }
    return { status: 'error', message: parsed.message || 'Face verification failed.' };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Face verification error' };
  } finally {
    void fs.unlink(tmpId).catch(() => {});
    void fs.unlink(tmpSelfie).catch(() => {});
  }
}

async function runPythonCliDuplicate(
  selfie: ArrayBuffer,
  stored: Array<{ artisan_id: number; embedding: number[] }>
): Promise<FaceOutcome<DuplicateResult>> {
  const python = findPython();
  const cli = findFaceCli();
  if (!python || !cli) {
    return { status: 'skipped' };
  }

  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tmpSelfie = path.join(os.tmpdir(), `selfie_${nonce}.jpg`);
  const tmpEmbeddings = path.join(os.tmpdir(), `embeddings_${nonce}.json`);

  try {
    await fs.writeFile(tmpSelfie, Buffer.from(selfie));
    await fs.writeFile(tmpEmbeddings, JSON.stringify(stored), 'utf8');

    const res = spawnSync(python, [cli.scriptPath, 'check-duplicate', tmpSelfie, tmpEmbeddings], {
      cwd: cli.dirPath,
      encoding: 'utf8',
      timeout: 25_000,
      windowsHide: true,
    });

    if (res.error) {
      return { status: 'error', message: res.error.message };
    }

    const stdout = (res.stdout || '').trim();
    if (!stdout) {
      return { status: 'error', message: (res.stderr || 'No response from duplicate face check.').trim() };
    }

    const parsed = JSON.parse(stdout);
    if (parsed.status === 'ok') {
      return {
        status: 'ok',
        data: {
          is_duplicate: Boolean(parsed.is_duplicate),
          matched_artisan_id: parsed.matched_artisan_id ?? null,
          distance: parsed.distance != null ? Number(parsed.distance) : null,
        },
      };
    }
    return { status: 'error', message: parsed.message || 'Duplicate check failed.' };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Duplicate face check error' };
  } finally {
    void fs.unlink(tmpSelfie).catch(() => {});
    void fs.unlink(tmpEmbeddings).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Compare selfie vs ID photo. Tries HTTP service first, falls back to Python CLI runner. */
export async function verifyFace(idImage: ArrayBuffer, selfie: ArrayBuffer): Promise<FaceOutcome<VerifyResult>> {
  // 1. Try HTTP microservice if configured
  if (BASE) {
    const form = new FormData();
    form.append('id_image', new Blob([idImage], { type: 'image/jpeg' }), 'id.jpg');
    form.append('selfie', new Blob([selfie], { type: 'image/jpeg' }), 'selfie.jpg');

    const httpRes = await callHttp<VerifyResult>('/verify', form);
    if (httpRes.status === 'ok') return httpRes;

    // If HTTP returned a specific face recognition error (e.g. no face detected), return it
    if (
      httpRes.status === 'error' &&
      (httpRes.message.toLowerCase().includes('no face') ||
        httpRes.message.toLowerCase().includes('too small') ||
        httpRes.message.toLowerCase().includes('could not be decoded'))
    ) {
      return httpRes;
    }
  }

  // 2. HTTP was offline or unreachable -> seamless Python CLI fallback
  ensureFaceDaemon();
  return runPythonCliVerify(idImage, selfie);
}

/** Duplicate-face check against stored 128-d artisan embeddings. */
export async function checkDuplicateFace(
  selfie: ArrayBuffer,
  stored: Array<{ artisan_id: number; embedding: number[] }>
): Promise<FaceOutcome<DuplicateResult>> {
  if (BASE) {
    const form = new FormData();
    form.append('selfie', new Blob([selfie], { type: 'image/jpeg' }), 'selfie.jpg');
    form.append('embeddings', JSON.stringify(stored));

    const httpRes = await callHttp<DuplicateResult>('/check-duplicate', form);
    if (httpRes.status === 'ok') return httpRes;

    if (
      httpRes.status === 'error' &&
      (httpRes.message.toLowerCase().includes('no face') ||
        httpRes.message.toLowerCase().includes('too small') ||
        httpRes.message.toLowerCase().includes('could not be decoded'))
    ) {
      return httpRes;
    }
  }

  ensureFaceDaemon();
  return runPythonCliDuplicate(selfie, stored);
}
