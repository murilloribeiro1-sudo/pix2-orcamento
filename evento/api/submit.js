import { characterRefs, json, readBody, isAdmin, hasEventCode } from './_lib.js';
import { geminiEnabled, geminiImage, GEMINI_MODELS } from './_gemini.js';

const MAX_DATAURI = 6 * 1024 * 1024; // ~4.5MB de imagem em base64

function clean(s, max = 2000) {
  return String(s ?? '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').trim().slice(0, max);
}

// POST { code, image } → { status:'COMPLETED', output:{ images:[{url}] } }
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST apenas' });
  let body;
  try { body = await readBody(req); } catch { return json(res, 400, { error: 'JSON inválido' }); }

  if (!hasEventCode(body, req)) return json(res, 401, { error: 'Código do evento inválido.' });
  if (!geminiEnabled()) return json(res, 500, { error: 'GEMINI_API_KEY não configurada.' });
  const img = String(body.image || '');
  if (!img.startsWith('data:image/') || img.length > MAX_DATAURI) {
    return json(res, 400, { error: 'Envie uma selfie válida (JPEG/PNG até ~4MB).' });
  }
  const refs = characterRefs();
  const miss = [refs.face, refs.outfit].filter((u) => u.startsWith('missing:'));
  if (miss.length) return json(res, 500, { error: `Referência não encontrada em refs/: ${miss.map((m) => m.slice(8)).join(', ')}` });

  // Ordem importa: [Image1]=selfie, [Image2]=rosto do Piá (traço), [Image3]=roupa.
  const image_urls = [img, refs.face, refs.outfit];
  const prompt = body.prompt_override && isAdmin(body, req) ? clean(body.prompt_override, 4000) : selfiePrompt();
  try {
    const output = await geminiImage(GEMINI_MODELS.selfie, { prompt, image_urls, aspect_ratio: '3:4', num_images: 1 });
    return json(res, 200, { status: 'COMPLETED', provider: 'gemini', model: GEMINI_MODELS.selfie, output });
  } catch (e) {
    return json(res, e.status && e.status < 500 ? 422 : 500, { error: e.message || String(e) });
  }
}

function selfiePrompt() {
  return [
    `Transform the person in the first image into a 3D animated character in the exact same art style as the character in the second image (Pixar-like stylized 3D, big expressive eyes, soft rounded shapes, smooth skin shading, clean studio lighting).`,
    `Preserve the person's real identity from the first image: face shape, skin tone, hair style and color, eye color, facial hair, glasses if present, and their expression. The result must be clearly recognizable as this person.`,
    `Dress the character in the exact outfit shown in the third image: same black t-shirt, same fit, and reproduce the printed logos and text on the chest exactly as they appear in the reference, legible and unchanged.`,
    `Portrait framing from the chest up, 3:4, character centered, friendly smile, plain soft gradient background matching the reference style. No text other than what is on the shirt, no watermark.`,
  ].join(' ');
}
