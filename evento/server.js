// Servidor local, sem dependências: `node server.js` dentro da pasta evento/.
// Lê o arquivo .env, serve as páginas e as funções de api/ igual à Vercel.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

// .env → process.env
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} else {
  console.log('Aviso: não achei o arquivo .env. Copie .env.example para .env e preencha.');
}

const PORT = Number(process.env.PORT) || 3000;
const handlers = {};
for (const f of fs.readdirSync(path.join(root, 'api'))) {
  if (f.endsWith('.js') && !f.startsWith('_')) handlers['/api/' + f.replace(/\.js$/, '')] = (await import(path.join(root, 'api', f))).default;
}

const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.js': 'text/javascript', '.css': 'text/css', '.md': 'text/plain; charset=utf-8' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const fn = handlers[url.pathname];
  if (fn) { try { await fn(req, res); } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); } return; }

  let p = url.pathname === '/' ? '/qr' : url.pathname;
  let file = path.join(root, p);
  if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; res.end('não encontrado'); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  if (!process.env.PUBLIC_URL && ips[0]) process.env.PUBLIC_URL = `http://${ips[0]}:${PORT}`;
  console.log(`\nPIX2 Evento rodando.\n  QR para telão: http://localhost:${PORT}/qr?c=${process.env.EVENT_CODE || 'CODIGO'}`);
  for (const ip of ips) console.log(`  Celulares (mesma rede Wi-Fi): http://${ip}:${PORT}/pia?c=${process.env.EVENT_CODE || 'CODIGO'}`);
  console.log(`\n  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'ok' : 'FALTANDO'} · EVENT_CODE: ${process.env.EVENT_CODE || 'FALTANDO'}`);
  console.log(`  Referências em refs/: ${['pia-rosto.png','pia-roupa.png'].map(f => f + (fs.existsSync(path.join(root,'refs',f)) ? ' ok' : ' FALTANDO')).join(' · ')}\n`);
});
