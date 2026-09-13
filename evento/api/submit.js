import { MODELS, characterRefs, json, readBody, isAdmin, hasEventCode, falSubmit } from './_lib.js';
import { geminiEnabled, geminiImage, GEMINI_MODELS } from './_gemini.js';

// Imagem: Gemini (Nano Banana direto no Google) se houver GEMINI_API_KEY; senão fal.ai (fila).
async function image(kind, input) {
  if (geminiEnabled()) {
    const output = await geminiImage(GEMINI_MODELS[kind], input);
    return { status: 'COMPLETED', provider: 'gemini', model: GEMINI_MODELS[kind], output };
  }
  return { provider: 'fal', ...(await falSubmit(MODELS[kind], input)) };
}

const MAX_DATAURI = 6 * 1024 * 1024; // ~4.5MB de imagem em base64

function clean(s, max = 2000) {
  return String(s ?? '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST apenas' });
  let body;
  try { body = await readBody(req); } catch { return json(res, 400, { error: 'JSON inválido' }); }

  const task = body.task;
  try {
    // ---------- Público: selfie → personagem ----------
    if (task === 'selfie') {
      if (!hasEventCode(body, req)) return json(res, 401, { error: 'Código do evento inválido.' });
      const img = String(body.image || '');
      if (!img.startsWith('data:image/') || img.length > MAX_DATAURI) {
        return json(res, 400, { error: 'Envie uma selfie válida (JPEG/PNG até ~4MB).' });
      }
      const refs = characterRefs(req);
      const miss = [refs.face, refs.outfit].filter((u) => u.startsWith('missing:'));
      if (miss.length) return json(res, 500, { error: `Referência não encontrada em refs/: ${miss.map((m) => m.slice(8)).join(', ')}` });
      // Ordem importa: [Image1]=selfie, [Image2]=rosto do Piá (traço), [Image3]=roupa.
      const image_urls = [img, refs.face, refs.outfit];
      const prompt = body.prompt_override && isAdmin(body, req)
        ? clean(body.prompt_override, 4000)
        : selfiePrompt();
      const out = await image('selfie', {
        prompt,
        image_urls,
        num_images: 1,
        output_format: 'png',
        aspect_ratio: '3:4',
      });
      return json(res, 200, out);
    }

    // ---------- Apresentador ----------
    if (!isAdmin(body, req)) return json(res, 401, { error: 'Senha do apresentador inválida.' });

    if (task === 'location') {
      const local = clean(body.local, 200);
      if (!local) return json(res, 400, { error: 'Informe o local.' });
      const prompt = clean(body.prompt, 3000) || locationPrompt(local, clean(body.assunto, 200));
      const out = await image('location', {
        prompt,
        num_images: Number(body.num_images) === 2 ? 2 : 1,
        aspect_ratio: '16:9',
        output_format: 'jpeg',
      });
      return json(res, 200, { ...out, prompt });
    }

    if (task === 'video') {
      const prompt = clean(body.prompt, 9000);
      const locationUrl = clean(body.location_url, MAX_DATAURI);
      if (!prompt) return json(res, 400, { error: 'Prompt vazio.' });
      if (!/^(https:\/\/|data:image\/)/.test(locationUrl)) return json(res, 400, { error: 'Gere a imagem do local antes.' });
      const refs = characterRefs(req);
      const missing = refs.character.filter((u) => u.startsWith('missing:'));
      if (missing.length) return json(res, 500, { error: `Referência não encontrada em refs/: ${missing.map((m) => m.slice(8)).join(', ')}` });
      // [Image1..n] = personagem, depois o local.
      const image_urls = [...refs.character, locationUrl].slice(0, 9);
      const duration = Math.min(30, Math.max(4, Number(body.duration) || 30));
      const resolution = ['480p', '720p', '1080p'].includes(body.resolution) ? body.resolution : '720p';
      const out = await falSubmit(MODELS.video, {
        prompt,
        image_urls,
        duration: String(duration),
        resolution,
        aspect_ratio: body.aspect_ratio === '9:16' ? '9:16' : '16:9',
        generate_audio: body.generate_audio !== false,
      });
      return json(res, 200, { ...out, image_urls });
    }

    return json(res, 400, { error: 'task desconhecida' });
  } catch (e) {
    return json(res, e.status && e.status < 500 ? 422 : 500, { error: e.message || String(e) });
  }
}

function locationPrompt(local, assunto) {
  return [
    `Wide establishing shot of ${local}, the most iconic and instantly recognizable landmark or landscape of this place.`,
    `Stylized 3D animated look in the style of a Pixar feature film: soft global illumination, warm golden-hour light, rich saturated colors, clean detailed environment, depth of field.`,
    assunto ? `The setting subtly suggests the theme: ${assunto}.` : '',
    `No people, no characters, no text, no logos, no watermark. Cinematic 16:9 composition, empty foreground space where a character could stand.`,
  ].filter(Boolean).join(' ');
}

function selfiePrompt() {
  return [
    `Transform the person in [Image1] into a 3D animated character in the exact same art style as the character in [Image2] (Pixar-like stylized 3D, big expressive eyes, soft rounded shapes, smooth skin shading, clean studio lighting).`,
    `Preserve the person's real identity from [Image1]: face shape, skin tone, hair style and color, eye color, facial hair, glasses if present, and their expression. The result must be clearly recognizable as this person.`,
    `Dress the character in the exact outfit shown in [Image3]: same shirt design, colors and the word "PARANÁ" written on the chest, exactly as in the reference.`,
    `Portrait framing from the chest up, 3:4, character centered, friendly smile, plain soft gradient background matching the reference style. No text other than what is on the shirt, no watermark.`,
  ].join(' ');
}
