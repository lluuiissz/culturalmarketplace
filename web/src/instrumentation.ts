// Next.js instrumentation hook — runs once when the server boots.
//
// WHY: on Windows, loading the ONNX runtime (@xenova/transformers, used for
// the CLIP craft-relevance check) AFTER libvips (sharp) corrupts libvips'
// global state — the next sharp call aborts the whole process (vips VObject
// assertion). ONNX-first is stable. The node-only boot work therefore lives
// in instrumentation-node.ts, imported under the NEXT_RUNTIME guard (the
// documented pattern — NEXT_RUNTIME is inlined at build time, so the edge
// bundle never includes the node-only module graph).
//
// Cost: the 90MB CLIP model warms at boot in the background; until it
// finishes, craftRelevance() returns null (layer skipped, fail-open), so
// uploads never wait on it.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerNode } = await import('./instrumentation-node');
    await registerNode();
  }
}
