// Nano Banana direto na API do Google (Gemini). Síncrono: devolve a imagem na mesma chamada.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const GEMINI_MODELS = {
  selfie: process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview',
};

export function geminiEnabled() { return Boolean(process.env.GEMINI_API_KEY); }

async function toInline(ref) {
  if (ref.startsWith('data:')) {
    const m = ref.match(/^data:([^;]+);base64,(.*)$/s);
    if (!m) throw new Error('data URI inválida');
    return { inline_data: { mime_type: m[1], data: m[2] } };
  }
  const r = await fetch(ref);
  if (!r.ok) throw new Error(`não consegui baixar referência ${ref} (${r.status})`);
  const mime = r.headers.get('content-type')?.split(';')[0] || 'image/png';
  const data = Buffer.from(await r.arrayBuffer()).toString('base64');
  return { inline_data: { mime_type: mime, data } };
}

// Gera imagem(ns). Retorna no mesmo formato da fal: { images: [{ url }] } com data URIs.
export async function geminiImage(model, { prompt, image_urls = [], aspect_ratio = '1:1', num_images = 1 }) {
  const parts = [];
  for (const u of image_urls) parts.push(await toInline(u));
  parts.push({ text: prompt });
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect_ratio } },
  };
  const images = [];
  for (let i = 0; i < num_images; i++) {
    const r = await fetch(`${BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!r.ok) {
      const err = new Error(`Gemini ${r.status} (${model}): ${data?.error?.message || text.slice(0, 400)}`);
      err.status = r.status; throw err;
    }
    const cand = data.candidates?.[0];
    const img = cand?.content?.parts?.find((p) => p.inlineData || p.inline_data);
    if (!img) {
      const why = cand?.finishReason || data.promptFeedback?.blockReason || 'sem imagem na resposta';
      throw new Error(`Gemini não devolveu imagem (${why}). ${cand?.content?.parts?.map((p) => p.text).filter(Boolean).join(' ').slice(0, 300) || ''}`);
    }
    const d = img.inlineData || img.inline_data;
    images.push({ url: `data:${d.mimeType || d.mime_type};base64,${d.data}` });
  }
  return { images };
}
