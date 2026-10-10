// Dependency-free checks for the primary static site. Not an HTML validator or browser test.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'com-site-2');
const errors = [];
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(resolve(dir, e.name)) : [resolve(dir, e.name)]);
for (const name of ['index.html', 'cafea.html', 'contact.html', 'despre.html', 'evenimente.html']) {
  if (!existsSync(resolve(root, name))) errors.push(`Missing page: ${name}`);
}
const files = existsSync(root) ? walk(root) : [];
for (const file of files) {
  const extension = extname(file);
  if (extension === '.js') {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) errors.push(result.stderr || String(result.error));
  }
  if (!['.html', '.css'].includes(extension)) continue;
  const source = readFileSync(file, 'utf8');
  const pattern = extension === '.html' ? /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi : /url\(\s*["']?([^\s"')]+)["']?\s*\)/gi;
  for (const match of source.matchAll(pattern)) {
    const link = match[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(link)) continue;
    let pathPart;
    try { pathPart = decodeURIComponent(link.split(/[?#]/)[0]); }
    catch { errors.push(`${relative(root, file)}: malformed URL ${link}`); continue; }
    const target = pathPart ? resolve(pathPart.startsWith('/') ? root : dirname(file), pathPart.replace(/^\/+/, '')) : file;
    const rel = relative(root, target);
    if (rel === '..' || rel.startsWith(`..${sep}`)) {
      errors.push(`${relative(root, file)}: link leaves primary site: ${link}`); continue;
    }
    if (!existsSync(target)) { errors.push(`${relative(root, file)}: missing local target ${link}`); continue; }
    if (link.includes('#') && extname(target) === '.html' && statSync(target).isFile()) {
      let fragment;
      try { fragment = decodeURIComponent(link.slice(link.indexOf('#') + 1)); }
      catch { errors.push(`Malformed fragment: ${link}`); continue; }
      const ids = [...readFileSync(target, 'utf8').matchAll(/\b(?:id|name)\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
      if (fragment && !ids.includes(fragment)) errors.push(`${relative(root, file)}: missing fragment ${link}`);
    }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`PASS: primary site local links, fragments, CSS assets, and JavaScript syntax (${files.length} files).`);
