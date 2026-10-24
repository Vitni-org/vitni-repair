import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
try {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* Local environment files are optional. */ }
const port = Number(process.env.PORT || 4174);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.wasm': 'application/wasm' };
const schema = { type: 'object', additionalProperties: false, required: ['likely_issue', 'confidence', 'safety', 'summary', 'steps', 'parts'], properties: { likely_issue: { type: 'string' }, confidence: { type: 'integer', minimum: 0, maximum: 100 }, safety: { type: 'string', enum: ['safe_diy', 'get_help', 'do_not_attempt'] }, summary: { type: 'string' }, steps: { type: 'array', minItems: 2, maxItems: 7, items: { type: 'object', additionalProperties: false, required: ['title', 'instruction'], properties: { title: { type: 'string' }, instruction: { type: 'string' } } } }, parts: { type: 'array', maxItems: 6, items: { type: 'object', additionalProperties: false, required: ['name', 'details'], properties: { name: { type: 'string' }, details: { type: 'string' } } } } } };
function send(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(body)); }
async function readBody(req) { const chunks = []; let size = 0; for await (const chunk of req) { size += chunk.length; if (size > 8 * 1024 * 1024) throw Error('The image is too large. Choose a file under 6 MB.'); chunks.push(chunk); } return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
async function analyse(req, res) {
  if (!process.env.OPENAI_API_KEY) return send(res, 503, { error: 'AI analysis is not configured. Set OPENAI_API_KEY on the server, then restart it.' });
  try {
    const { image, description, category } = await readBody(req);
    if (!image?.startsWith('data:image/') || !description?.trim()) return send(res, 400, { error: 'Add both a photo and a short description.' });
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4.1-mini', input: [{ role: 'user', content: [{ type: 'input_text', text: `You are RepairLens, a cautious repair triage assistant. Analyse this ${category || 'unknown'} item photo and the user's description: "${description}". Identify the most likely repair issue, but never claim certainty. Prioritize safety: electrical, gas, structural, pressure, sharp, or battery hazards must be do_not_attempt or get_help. Give concise, reversible instructions only. If the photo is unclear, say get_help and explain why.` }, { type: 'input_image', image_url: image, detail: 'high' }] }], text: { format: { type: 'json_schema', name: 'repair_assessment', strict: true, schema } } }) });
    const payload = await response.json();
    if (!response.ok) throw Error(payload?.error?.message || 'OpenAI could not analyse this photo.');
    const outputText = payload.output_text || payload.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
    if (!outputText) throw Error('OpenAI returned no repair assessment.');
    return send(res, 200, JSON.parse(outputText));
  } catch (error) { return send(res, 500, { error: error.message || 'Analysis failed. Please try again.' }); }
}
createServer(async (req, res) => {
  const requestedPath = req.url.split('?')[0];
  if (req.method === 'POST' && requestedPath === '/api/analyze') return analyse(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
  const pathname = requestedPath === '/' ? '/index.html' : requestedPath;
  const file = normalize(join(root, pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try { const info = await stat(file); if (!info.isFile()) throw Error(); const body = req.method === 'HEAD' ? undefined : await readFile(file); res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end('Not found'); }
}).listen(port, () => console.log(`RepairLens is running at http://localhost:${port}`));
