// Helpers compartilhados pelas funções serverless (Vercel) e pelo server.js local.
import fs from 'node:fs';

export function publicUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// Referências do personagem, lidas de refs/ e embutidas como data URI (o Gemini recebe inline).
export function characterRefs() {
  return {
    face: process.env.REF_FACE_URL || inlineRef('pia-rosto.png'),
    outfit: process.env.REF_OUTFIT_URL || inlineRef('pia-roupa.png'),
  };
}

function inlineRef(file) {
  try {
    const buf = fs.readFileSync(new URL(`../refs/${file}`, import.meta.url));
    const mime = /\.jpe?g$/i.test(file) ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return `missing:${file}`;
  }
}

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
