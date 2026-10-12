// Local preview: expose only site/ on this computer, never the project or Git files.
import http from 'node:http';
import { readFile, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, extname, sep } from 'node:path';

const root = fileURLToPath(new URL('../site/', import.meta.url));
const port = Number(process.argv[2] || 4187);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Choose a port between 1024 and 65535.');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow:'GET, HEAD' }).end(); return; }
  try {
    let name = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    if (name === '/') name = '/index.html';
    const parts = name.split(/[\\/]/).filter(Boolean);
    if (parts.some(part => part.startsWith('.') || part.includes(':'))) throw new Error('private path');
    let file = root;
    let info = await lstat(root);
    if (info.isSymbolicLink()) throw new Error('linked root');
    for (const part of parts) {
      file = resolve(file, part);
      info = await lstat(file);
      if (info.isSymbolicLink()) throw new Error('linked file');
    }
    const rel = relative(root, file);
    if (rel.startsWith(`..${sep}`) || rel === '..' || !types[extname(file).toLowerCase()] || !info.isFile()) throw new Error('not public');
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type':types[extname(file).toLowerCase()], 'Content-Length':content.length, 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }).end('Pagina nu a fost găsită.'); }
}).listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port} (Ctrl+C to stop)`));
