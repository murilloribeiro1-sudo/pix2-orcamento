# PIX2 · Evento — Selfie "Piá do Paraná"

App para o público do evento: escaneia o QR Code, tira uma selfie, e o Nano Banana Pro (Gemini) devolve a pessoa como personagem 3D com a camiseta preta oficial (PRODUÇÃO BOLD / PIX2 / tif).

Projeto independente do orçamento. Vive na pasta `evento/` deste repositório.

O **comercial ao vivo** (Seedance 2.5) NÃO é este app: é feito por voz, na sessão do Claude com o Higgsfield conectado. Ver `.claude/skills/comercial-ao-vivo/SKILL.md` na raiz do repositório.

| URL | Quem usa | O que faz |
|---|---|---|
| `/pia?c=CODIGO` | Público (via QR) | Selfie → personagem |
| `/qr?c=CODIGO` | Telão | Gera o QR Code que aponta para `/pia` |

## 1. Rodar no seu computador

Precisa só do Node.js (nodejs.org, versão LTS). Sem instalar mais nada.

1. GitHub → **Code → Download ZIP** → descompacte.
2. Na pasta `evento`, copie `.env.example` para `.env` e preencha:
   - `GEMINI_API_KEY`: aistudio.google.com/apikey
   - `EVENT_CODE`: o código que vai no QR (você inventa)
   - `ADMIN_PASS`: qualquer senha (só para o diagnóstico)
3. Coloque `pia-rosto.png` e `pia-roupa.png` em `refs/` (ver `refs/README.md`).
4. Terminal na pasta `evento`:

```bash
node server.js
```

5. O terminal mostra se a chave e as imagens foram encontradas, e os endereços. Abra `http://localhost:3000/qr?c=SEU_CODIGO`. Celulares na mesma rede Wi-Fi usam o endereço da linha "Celulares".

A geração acontece no Google; local é só a página e o servidor.

## 2. Subir na rede (Vercel)

1. vercel.com → **Add New → Project** → importar `pix2-orcamento`.
2. **Root Directory**: `evento`.
3. Environment Variables: `GEMINI_API_KEY`, `EVENT_CODE`, `ADMIN_PASS`.
4. Deploy. Projete `https://SEU-DOMINIO/qr?c=SEU_CODIGO` no telão.

Alternativa com repositório próprio: crie `pix2-evento` vazio no GitHub e rode na raiz deste repo:

```bash
git subtree split --prefix=evento -b evento-only
git push git@github.com:murilloribeiro1-sudo/pix2-evento.git evento-only:main
```

## 3. Diagnóstico

`POST /api/config` com `{"admin":"SUA_SENHA"}` devolve se a chave e as referências foram encontradas. No terminal:

```bash
curl -X POST -H "content-type: application/json" -d "{\"admin\":\"SUA_SENHA\"}" http://localhost:3000/api/config
```

## 4. O que esperar no evento

- Nano Banana Pro leva 30 s a 1 min 30 por selfie. Com muita gente ao mesmo tempo o Google pode limitar a taxa; a página mostra o erro e pede para tentar de novo.
- Custo: confira o preço por imagem no painel do Google AI Studio antes do evento e multiplique pelo público esperado. Para baratear, `GEMINI_IMAGE_MODEL=gemini-2.5-flash-image` (menos semelhança).
- A selfie é reduzida no celular (1280 px) e vai direto para o Google. Nada fica salvo no servidor.
- Troque `EVENT_CODE` depois do evento para o link morrer.
- Semelhança depende da referência de rosto e da roupa. Teste com 5 pessoas diferentes antes; se o traço não bater, troque `refs/pia-rosto.png` antes de mexer em prompt.
