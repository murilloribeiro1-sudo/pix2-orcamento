import { MODELS, characterRefs, json, readBody, isAdmin } from './_lib.js';

// POST {admin} → confirma senha e devolve configuração (modelos, referências, código do evento).
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST apenas' });
  let body = {};
  try { body = await readBody(req); } catch {}
  if (!isAdmin(body, req)) return json(res, 401, { error: 'Senha do apresentador inválida.' });
  const refs = characterRefs(req);
  const checks = {};
  for (const [k, u] of Object.entries({ face: refs.face, outfit: refs.outfit, character0: refs.character[0] })) {
    try { const r = await fetch(u, { method: 'HEAD' }); checks[k] = r.ok; } catch { checks[k] = false; }
  }
  return json(res, 200, {
    models: MODELS,
    refs,
    refs_ok: checks,
    event_code: process.env.EVENT_CODE || null,
    fal_key_set: Boolean(process.env.FAL_KEY),
  });
}
