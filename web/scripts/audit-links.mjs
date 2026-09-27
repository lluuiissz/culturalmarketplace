// One-off link audit: verify every static internal href resolves to a real page route.
import fs from 'node:fs';
import path from 'node:path';

function walk(dir, matcher, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, matcher, out);
    else if (matcher(f)) out.push(p.replace(/\\/g, '/'));
  }
  return out;
}

const pageFiles = walk('src/app', (f) => f === 'page.tsx');
const routes = pageFiles
  .map((p) => p.replace(/^src\/app/, '').replace(/\/page\.tsx$/, ''))
  .map((r) => r.replace(/\[[^\]]+\]/g, 'X'));
routes.push('/');

const tsxFiles = walk('src', (f) => f.endsWith('.tsx'));
const hrefs = new Set();
for (const f of tsxFiles) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/href="(\/[^"]*)"/g)) hrefs.add(m[1]);
}

const dead = [];
for (const h of hrefs) {
  const clean = h.split('?')[0].split('#')[0].replace(/\[[^\]]+\]/g, 'X');
  const ok = routes.some((r) => r === clean || clean.startsWith(r + '/') || (r === '/' && clean === ''));
  if (!ok) dead.push(h);
}
console.log('page routes:', routes.length, '| static hrefs:', hrefs.size);
console.log('DEAD LINKS:', dead.length ? dead : 'none');
