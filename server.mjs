import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/manifest+json', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT || 4174);
createServer(async (req, res) => {
  const pathname = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const file = normalize(join(root, pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try { const info = await stat(file); if (!info.isFile()) throw Error(); const body = await readFile(file); res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end('Not found'); }
}).listen(port, () => console.log(`RepairLens is running at http://localhost:${port}`));
