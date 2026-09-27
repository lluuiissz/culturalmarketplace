// One-off audit: every fetch('/api/...') must resolve to a real route file.
import fs from 'node:fs';
import path from 'node:path';

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p.replace(/\\/g, '/'));
  }
  return out;
}

const apiRoutes = walk('src/app/api')
  .filter((f) => f.endsWith('route.ts'))
  .map((p) => p.replace(/^src\/app\/api/, '').replace(/\/route\.ts$/, '').replace(/\[[^\]]+\]/g, 'X'));

const files = walk('src').filter((f) => /\.(tsx|ts)$/.test(f));
const missing = new Set();
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/fetch\(\s*`?\/api(\/[^`"]*)/g)) {
    const route = m[1].replace(/\$\{[^}]*\}/g, 'X').split('?')[0];
    const ok = apiRoutes.some((r) => route === r || route.startsWith(r + '/'));
    if (!ok) missing.add(`/api${route}  (from ${f})`);
  }
}
console.log('api routes:', apiRoutes.length);
console.log('MISSING API TARGETS:', missing.size ? [...missing].join('\n') : 'none');
