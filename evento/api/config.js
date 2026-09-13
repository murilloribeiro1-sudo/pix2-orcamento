import { characterRefs, json, readBody, isAdmin } from './_lib.js';
import { geminiEnabled, GEMINI_MODELS } from './_gemini.js';

// POST {admin} → diagnóstico: chave, referências, código.
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST apenas' });
  let body = {};
  try { body = await readBody(req); } catch {}
  if (!isAdmin(body, req)) return json(res, 401, { error: 'Senha inválida.' });
  const refs = characterRefs();
  return json(res, 200, {
    model: GEMINI_MODELS.selfie,
    gemini_key_set: geminiEnabled(),
    event_code: process.env.EVENT_CODE || null,
    refs_ok: { face: !refs.face.startsWith('missing:'), outfit: !refs.outfit.startsWith('missing:') },
  });
}
