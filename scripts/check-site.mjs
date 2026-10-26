// Dependency-free checks for the primary static site: links, tag syntax, empty text, CSS imports,
// minimum text size and the shared header/footer. Not a full HTML validator or browser test.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const errors = [];
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(resolve(dir, e.name)) : [resolve(dir, e.name)]);
for (const name of ['index.html', 'cafea.html', 'contact.html', 'despre.html', 'evenimente.html']) {
  if (!existsSync(resolve(root, name))) errors.push(`Missing page: ${name}`);
}
// Header and footer are copied into every page; they must stay identical apart from the current page.
const shared = {};
for (const name of ['index.html', 'cafea.html', 'contact.html', 'despre.html', 'evenimente.html']) {
  if (!existsSync(resolve(root, name))) continue;
  const source = readFileSync(resolve(root, name), 'utf8');
  for (const [part, pattern] of [['header', /<header class="nav">[\s\S]*?<\/header>/], ['footer', /<footer class="footer">[\s\S]*?<\/footer>/]]) {
    const block = source.match(pattern)?.[0];
    if (!block) { errors.push(`${name}: missing shared ${part}`); continue; }
    if (part === 'header') {
      const current = [...block.matchAll(/<a href="([^"]+)" aria-current="page">/g)].map(m => m[1]);
      if (current.join() !== name) errors.push(`${name}: header must mark only ${name} as the current page`);
    }
    const normal = block.replace(/ aria-current="page"/g, '').replace(/href="#/g, 'href="contact.html#').replace(/\s+/g, ' ').replace(/> </g, '><');
    shared[part] ??= { name, normal };
    if (shared[part].normal !== normal) errors.push(`${name}: ${part} differs from ${shared[part].name}`);
  }
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
  const name = relative(root, file);
  const line = index => source.slice(0, index).split('\n').length;
  if (extension === '.html') {
    // Every start tag must close cleanly: catches `<span</span>` and `data-reveal">`.
    const tag = /<[a-zA-Z][\w-]*(?:\s+[^\s"'=<>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>/y;
    for (const match of source.matchAll(/<[a-zA-Z]/g)) {
      tag.lastIndex = match.index;
      if (!tag.test(source)) errors.push(`${name}:${line(match.index)}: malformed tag ${source.slice(match.index, match.index + 40).split('\n')[0]}`);
    }
    // Visible text containers must not be left empty; live regions are filled by scripts.
    for (const match of source.matchAll(/<(p|h[1-6]|a|li|legend|figcaption|dt|dd|label|button)\b([^>]*)>\s*<\/\1>/g)) {
      if (!/\b(?:role="status"|aria-live)/.test(match[2])) errors.push(`${name}:${line(match.index)}: empty <${match[1]}>`);
    }
  } else {
    const firstRule = source.indexOf('{');
    for (const match of source.matchAll(/@import\b/g)) {
      if (firstRule !== -1 && match.index > firstRule) errors.push(`${name}:${line(match.index)}: @import after the first rule is ignored by browsers`);
    }
    // Readability floor shared by every page: px, rem/em (at 16px), clamp() minimums and the font shorthand.
    const size = /font(?:-size)?\s*:\s*(?:(?:italic|oblique|normal|small-caps|bold|bolder|lighter|\d{3})\s+)*(?:clamp\(\s*)?(\d*\.?\d+)(px|rem|em)\b/g;
    for (const match of source.matchAll(size)) {
      const px = Number(match[1]) * (match[2] === 'px' ? 1 : 16);
      if (px < 12) errors.push(`${name}:${line(match.index)}: text smaller than 12px (${match[1]}${match[2]})`);
    }
  }
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
else console.log(`PASS: primary site local links, fragments, CSS assets, tag syntax, empty text, 12px minimum, shared header/footer and JavaScript syntax (${files.length} files).`);
