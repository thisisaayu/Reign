#!/usr/bin/env node
// Builds app.bundled.js from src/js/main.js by inlining all relative imports.
// No npm deps — plain Node fs. Regenerates on each build/install.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(ROOT, 'src/js/main.js');
const OUT = path.join(ROOT, 'app.bundled.js');

function collect(entryPath, seen) {
  if (seen.has(entryPath)) return '';
  seen.add(entryPath);
  let text = fs.readFileSync(entryPath, 'utf-8');
  const imports = [...text.matchAll(/^\s*import\s.*?from\s+['"]([^'"]+)['"]/gm)].map(m=>m[1])
    .concat([...text.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)].map(m=>m[1]));
  let pre = '';
  for (const imp of imports) {
    if (imp.startsWith('.')) {
      const resolved = path.resolve(path.dirname(entryPath), imp);
      if (fs.existsSync(resolved)) pre += collect(resolved, seen);
      else console.warn(`missing import ${imp} from ${entryPath}`);
    }
  }
  text = text.replace(/^\s*import\s.*?from\s+['"][^'"]+['"]\s*;?\s*\n/gm, '');
  text = text.replace(/^\s*import\s+['"][^'"]+['"]\s*;?\s*\n/gm, '');
  text = text.replace(/^\s*export\s+(const|let|var|function|class|async function)/gm, '$1');
  text = text.replace(/^\s*export\s+\{[^}]+\}\s*;?\s*\n/gm, '');
  text = text.replace(/^\s*export\s+default\s+/gm, '');
  const rel = path.relative(ROOT, entryPath);
  return pre + `\n/* === ${rel} === */\n` + text + '\n';
}
const seen = new Set();
const bundled = collect(path.resolve(ENTRY), seen);
fs.writeFileSync(OUT, bundled);
console.log(`bundled ${seen.size} files → ${OUT} (${(bundled.length/1024).toFixed(1)} KB)`);
