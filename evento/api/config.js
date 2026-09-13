import { MODELS, characterRefs, json, readBody, isAdmin } from './_lib.js';
import { geminiEnabled, GEMINI_MODELS } from './_gemini.js';

// POST {admin} → confirma senha e devolve configuração (modelos, referências, código do evento).
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST apenas' });
  let body = {};
  try { body = await readBody(req); } catch {}
  if (!isAdmin(body, req)) return json(res, 401, { error: 'Senha do apresentador inválida.' });
  const refs = characterRefs(req);
  const checks = {};
  for (const [k, u] of Object.entries({ face: refs.face, outfit: refs.outfit, character0: refs.character[0] })) {
    if (u.startsWith('data:')) { checks[k] = true; continue; }
    if (u.startsWith('missing:')) { checks[k] = false; continue; }
    try { const r = await fetch(u, { method: 'HEAD' }); checks[k] = r.ok; } catch { checks[k] = false; }
  }
  return json(res, 200, {
    models: geminiEnabled() ? { ...MODELS, location: 'gemini:' + GEMINI_MODELS.location, selfie: 'gemini:' + GEMINI_MODELS.selfie } : MODELS,
    image_provider: geminiEnabled() ? 'gemini' : 'fal',
    gemini_key_set: geminiEnabled(),
    refs: Object.fromEntries(Object.entries(refs).map(([k,v]) => [k, Array.isArray(v) ? v.map(short) : short(v)])),
    refs_ok: checks,
    event_code: process.env.EVENT_CODE || null,
    fal_key_set: Boolean(process.env.FAL_KEY),
  });
}

function short(u) { return u.startsWith('data:') ? `(embutida local, ${Math.round(u.length/1365)} KB)` : u; }
