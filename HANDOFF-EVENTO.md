# HANDOFF — Evento Piá do Paraná (palestra do Murillo)

Resumo para continuar o trabalho em outra sessão. Última atualização: 13/09/2026.

## O que o Murillo quer

Palestra em evento com duas dinâmicas separadas:

1. **Comercial ao vivo (no palco).** Ele pergunta à plateia um lugar, um serviço, o que o personagem fala e ações. Dita isso por voz para o Claude ("JARVIS, vamos criar um comercial…"). O Claude gera, pelas ferramentas do Higgsfield conectadas na sessão, a imagem do LUGAR com Nano Banana Pro e o comercial animado com Seedance 2.5 usando o personagem como referência. Mostra o vídeo no fim e aponta os erros como parte da fala.
2. **Selfie da plateia (online).** Todos escaneiam um QR Code, tiram selfie e viram o personagem "Piá do Paraná" (3D estilo Pixar, camiseta preta oficial). Roda pelo Nano Banana Pro direto na API do Google (Gemini).

São coisas separadas. Nada de vídeo no site; nada de site no comercial.

## Estado atual (tudo commitado na `main`)

### Comercial ao vivo → `.claude/skills/comercial-ao-vivo/SKILL.md`
- Personagem no Higgsfield: Element **Pia-do-Parana**, id `fa2d1dc6-e7ae-48f4-9f65-b1899d6da04b`; character sheet media_id `a1413f08-2918-44c4-b780-ae5b142dea6d`.
- Fluxo: extrair campos do comando → repetir em uma linha → `generate_image` (`nano_banana_pro`, 16:9, só o lugar) → `generate_video` (`seedance_2_5`, `omni_reference`, **15 s**, 16:9, 720p, áudio nativo, medias = sheet + cenário como `image_references`, `<<<element>>>` no prompt) → `jobs_wait` → `show_generation_by_ids`.
- Regras já gravadas: sem confirmação; fala TRAVADA (as únicas palavras faladas são a frase ditada; URL vai para o cartão final, não para a fala); câmera ousada (FPV drone, crash zoom, whip pan, low angle); recusar `preset_recommendation` com `declined_preset_id`; nunca trocar modelo.
- Ensaio 1 (30 s, Itália/Poupatempo Paraná): cenário 40 s, vídeo **10 min**, 197 créditos. Saldo Higgsfield após: ~1.620. Resultado: https://d8j0ntlcm91z4.cloudfront.net/user_2xKLFC0yECj0rUVoD5bBwLhVMbl/hf_20260913_134014_ca950e2b-5599-4367-9e5f-d547105deb39.mp4
- Cenário da Itália já gerado (job `aee22c2c-e574-47e9-985b-e2d1c4d71a7f`), pode ser reutilizado num novo vídeo.
- Feedback do Murillo após o ensaio: encher de detalhe, travar a fala (o modelo falou coisas a mais), **15 s em vez de 30**, cenas mais ousadas. Tudo isso já está na skill. **Ainda não foi regerado em 15 s.**
- Custo estimado por rodada de 15 s: ~100 créditos (cenário 2 + vídeo ~98).

### Selfie da plateia → `evento/`
- `pia.html` (público), `qr.html` (telão), `api/submit.js` + `api/_gemini.js` (Nano Banana Pro via Google, modelo `gemini-3-pro-image-preview`), `api/config.js` (diagnóstico), `server.js` (roda local sem dependências: `node server.js`).
- Referências já dentro de `evento/refs/`: `pia-rosto.png`, `pia-roupa.png`, `pia-personagem.png` (recortadas do character sheet oficial). Camiseta preta com "PRODUÇÃO BOLD / PIX2 / tif", confirmada pelo Murillo.
- Variáveis (`.env` local ou Vercel): `GEMINI_API_KEY`, `EVENT_CODE`, `ADMIN_PASS`. Guia em `evento/README.md`.
- Deploy: Vercel, projeto novo, Root Directory = `evento`. Ou repo próprio via `git subtree` (instruções no README). Não foi feito deploy ainda.
- Não testado com chave real ainda (Murillo não configurou).

### Descartado
- fal.ai como backend (removido; Murillo quer Gemini para imagem e Higgsfield para vídeo).
- Console web de vídeo `/show` (removido; o comercial é por voz).

## Pendências (na ordem)

1. **Skill "human cinematic"**: existe no PC do Murillo, não no repo. Ele quer usar no comercial. Copiar a pasta para `.claude/skills/human-cinematic/` e integrar ao template de vídeo da `comercial-ao-vivo` (ler a skill e decidir: substitui o template ou só o vocabulário de câmera/luz).
2. **Regerar o comercial em 15 s** com a skill integrada, reaproveitando o cenário da Itália. Fala: "Acesse o app Poupatempo Paraná de qualquer lugar do mundo!" Cartão: POUPATEMPO.GOV.BR.
3. **Avaliação do Murillo** dos vídeos: rosto igual em todos os planos, fala em português sincronizada, texto do cartão correto, marco do lugar presente.
4. **Ensaio por voz no desktop**: "JARVIS, vamos criar um comercial…" para validar microfone + Higgsfield conectado no app.
5. **App de selfie**: Murillo cria chave no Google AI Studio, preenche `.env`, roda `node server.js`, testa uma selfie. Depois deploy na Vercel e QR no telão.
6. Guardar um vídeo bom como **plano B** para o palco.

## Avisos que o Murillo já recebeu
- Vídeo leva minutos: disparar no início do bloco e seguir a palestra.
- Não fazer mais de 5 ensaios para não ficar sem créditos no dia.
- Higgsfield registrou o cenário como `nano_banana_2` mesmo pedindo `nano_banana_pro` (redirecionamento do serviço). No app de selfie o Google usa Pro de verdade.
- Sessão web não tem microfone; a voz é no app desktop/celular, com o Higgsfield conectado lá.
