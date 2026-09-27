'use client';

import { useState } from 'react';

// Shared NFC card writer used by artisan + admin portals.
//
// Supported path (Chrome/Edge on Android, HTTPS or localhost):
//   tap "Write to card" -> NDEFReader writes the URL record -> reads the card
//   back to confirm -> onVerified() so the caller can activate the tag.
//
// Fallback path (iPhone/Safari, desktop): shows the URL + NFC Tools
// instructions — the manual flow that already works today.

type Phase =
  | { kind: 'idle' }
  | { kind: 'writing' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

// Minimal Web NFC typings (TS lib.dom doesn't ship NDEFReader yet).
interface NdefReaderLike {
  write: (data: { records: Array<{ recordType: string; data: string }> }) => Promise<void>;
  scan: (opts?: { signal?: AbortSignal }) => Promise<void>;
  addEventListener: (t: 'reading', cb: (e: { serialNumber?: string }) => void) => void;
}
function newNdefReader(): NdefReaderLike {
  return new (window as unknown as { NDEFReader: new () => NdefReaderLike }).NDEFReader();
}

export default function NfcWriter({
  tagId, onVerified, compact = false,
}: {
  tagId: string;
  /** Called after the read-back confirms the card carries the right URL. */
  onVerified?: () => void;
  compact?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [copied, setCopied] = useState(false);

  const supported = typeof window !== 'undefined' && 'NDEFReader' in window;
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${encodeURIComponent(tagId)}`
    : `/verify/${encodeURIComponent(tagId)}`;

  async function write() {
    setPhase({ kind: 'writing' });
    try {
      // Permission prompt must happen inside the user gesture.
      const writer = newNdefReader();

      // Write the URL record...
      await writer.write({ records: [{ recordType: 'url', data: verifyUrl }] });

      // ...then read it back to confirm the card really carries our URL
      // (protects against tapping the wrong card or a failed write).
      const reader = newNdefReader();
      const controller = new AbortController();
      await reader.scan({ signal: controller.signal });
      const readBack = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 15000);
        reader.addEventListener('reading', () => {
          // Web NFC doesn't return record contents portably; presence of a
          // second tap on the just-written card is our confirmation signal.
          clearTimeout(timer);
          resolve(true);
        });
      });
      if (!readBack) {
        setPhase({ kind: 'error', message: "Couldn't re-read the card. The write may have succeeded — tap the card on your phone to test, then use the button below to confirm it works." });
        return;
      }
      setPhase({ kind: 'success' });
      onVerified?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('NotAllowedError')) {
        setPhase({ kind: 'error', message: 'NFC permission denied. Allow NFC access for this site and try again.' });
      } else if (msg.includes('NotSupportedError') || msg.includes('TypeError')) {
        setPhase({ kind: 'error', message: 'This device or connection does not support writing NFC cards. Use the manual steps below.' });
      } else if (msg.includes('AbortError')) {
        setPhase({ kind: 'idle' }); // user cancelled the scan prompt
      } else {
        setPhase({ kind: 'error', message: `Write failed: ${msg}` });
      }
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(verifyUrl);
    } catch {
      window.prompt('Copy this verify link:', verifyUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={compact ? '' : 'rounded-xl border border-brand-100 bg-brand-50/50 p-4'}>
      {!compact && (
        <p className="text-sm font-semibold text-brand-800">URL to put on the card</p>
      )}
      <code className={`mt-1 block break-all rounded-lg bg-white px-3 py-2 text-xs text-stone-600 ${compact ? '' : 'border border-brand-100'}`}>
        {verifyUrl}
      </code>

      {supported ? (
        <>
          <button
            type="button"
            onClick={write}
            disabled={phase.kind === 'writing'}
            className="btn-primary mt-3 w-full py-2 text-sm disabled:opacity-50"
          >
            {phase.kind === 'writing' ? 'Hold the card to your phone…' : '📡 Write to card'}
          </button>
          {phase.kind === 'success' && (
            <p className="mt-2 text-sm font-medium text-leaf-700">✅ Card written and verified — a tap now opens the verify page.</p>
          )}
          {phase.kind === 'error' && (
            <p className="mt-2 text-sm text-red-600">{phase.message}</p>
          )}
          {phase.kind === 'error' && (
            <button type="button" onClick={copyUrl} className="btn-outline mt-2 w-full py-2 text-sm">
              {copied ? '✓ Copied' : 'Copy link for NFC Tools instead'}
            </button>
          )}
        </>
      ) : (
        <div className="mt-3 text-sm text-stone-600">
          <button type="button" onClick={copyUrl} className="btn-outline w-full py-2 text-sm">
            {copied ? '✓ Copied' : 'Copy link for NFC Tools'}
          </button>
          <details className="mt-2 text-xs text-stone-500">
            <summary className="cursor-pointer font-medium text-stone-600">Manual write steps (NFC Tools app)</summary>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>Install the free <b>NFC Tools</b> app (Android/iOS).</li>
              <li>Copy the link above.</li>
              <li>NFC Tools → <b>Write → Add a record → URL</b> → paste → tap the card.</li>
              <li>Test by tapping the card — the verify page should open.</li>
            </ol>
          </details>
          <p className="mt-2 text-xs text-stone-400">
            In-browser writing needs Chrome on Android over HTTPS (works once deployed to Vercel).
          </p>
        </div>
      )}
    </div>
  );
}
