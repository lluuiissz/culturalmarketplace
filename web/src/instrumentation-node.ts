// Node-only boot sequence (imported exclusively from instrumentation.ts under
// the NEXT_RUNTIME === 'nodejs' guard — never compiled into the edge bundle).
//
// Order matters on Windows: initialize the ONNX runtime BEFORE anything
// touches libvips/sharp. warmUpClip() kicks off the CLIP model load in the
// background; until it resolves, craftRelevance() returns null (layer
// skipped, fail-open) and uploads are unaffected.

export async function registerNode(): Promise<void> {
  const { warmUpClip } = await import('./lib/imageModeration');
  void warmUpClip().catch(() => {
    // Model download/load failure is non-fatal — the moderation pipeline
    // already fails open per-upload.
  });

  // Keep the Supabase connection pool warm (LCP): open the first connection
  // at boot so the first user navigation doesn't pay the ~650ms TCP+TLS+auth
  // handshake to Supabase, then ping every 30s (unref'd — never blocks
  // shutdown) so long-idle connections aren't reaped server-side. No-op in
  // demo mode (no DATABASE_URL).
  try {
    const { sql, usingPg } = await import('./lib/dbPg');
    if (usingPg) {
      void sql`select 1`.catch(() => {});
      const timer = setInterval(() => { void sql`select 1`.catch(() => {}); }, 30_000);
      timer.unref?.();
    }
  } catch {
    // demo store mode
  }
}
