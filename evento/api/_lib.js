// Helpers compartilhados pelas funções serverless (Vercel).
const FAL_QUEUE = 'https://queue.fal.run';

export const MODELS = {
  location: process.env.IMAGE_MODEL_LOCATION || 'fal-ai/nano-banana',
  selfie: process.env.IMAGE_MODEL_SELFIE || 'fal-ai/nano-banana-pro/edit',
  video: process.env.VIDEO_MODEL || 'bytedance/seedance-2.5/reference-to-video',
};

export function publicUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// Referências do personagem. Podem vir de env (URLs absolutas) ou dos arquivos em /refs.
// Rodando local (URL não pública), as imagens são embutidas como data URI, porque a fal.ai
// não consegue baixar de http://192.168.x.x.
export function characterRefs(req) {
  const base = publicUrl(req);
  const split = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);
  const character = split(process.env.REF_CHARACTER_URLS);
  const local = !/^https:\/\//.test(base) || /localhost|127\.0\.0\.1/.test(base);
  const ref = (file) => (local ? inlineRef(file) : `${base}/refs/${file}`);
  return {
    character: character.length ? character : [ref('pia-personagem.png')],
    face: process.env.REF_FACE_URL || ref('pia-rosto.png'),
    outfit: process.env.REF_OUTFIT_URL || ref('pia-roupa.png'),
  };
}

function inlineRef(file) {
  try {
    const fs = require_fs();
    const p = new URL(`../refs/${file}`, import.meta.url);
    const buf = fs.readFileSync(p);
    const mime = file.endsWith('.jpg') || file.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return `missing:${file}`;
  }
}
import fs from 'node:fs';
function require_fs() { return fs; }

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function isAdmin(body, req) {
  const pass = process.env.ADMIN_PASS;
  const given = body?.admin || req.headers['x-admin-pass'];
  return Boolean(pass) && given === pass;
}

export function hasEventCode(body, req) {
  const code = process.env.EVENT_CODE;
  const given = body?.code || req.headers['x-event-code'];
  return Boolean(code) && given === code;
}

export function falHeaders() {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY não configurada nas variáveis de ambiente da Vercel.');
  return { Authorization: `Key ${key}`, 'Content-Type': 'application/json' };
}

export async function falSubmit(model, input) {
  const r = await fetch(`${FAL_QUEUE}/${model}`, {
    method: 'POST',
    headers: falHeaders(),
    body: JSON.stringify(input),
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) {
    const err = new Error(`fal.ai ${r.status} ao enviar ${model}: ${data?.detail ? JSON.stringify(data.detail) : text.slice(0, 500)}`);
    err.status = r.status;
    throw err;
  }
  return { request_id: data.request_id, status_url: data.status_url, response_url: data.response_url, model };
}

export function isFalUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && x.hostname === 'queue.fal.run';
  } catch { return false; }
}

export async function falGet(url) {
  const r = await fetch(url, { headers: falHeaders() });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: r.ok, status: r.status, data };
}
