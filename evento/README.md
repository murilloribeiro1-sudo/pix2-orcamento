# PIX2 · Evento — Comercial ao vivo + Selfie "Piá do Paraná"

Sistema independente do orçamento. Vive na pasta `evento/` só por enquanto; não compartilha nada com o `index.html` da raiz.

## 0. Deploy como projeto separado

**Opção A (hoje, sem criar repo):** na Vercel, *Add New Project* → importar este repositório → em **Root Directory** escolher `evento` → deploy. Vira um projeto e um domínio próprios (ex.: `pix2-evento.vercel.app`).

**Opção B (repositório próprio):** crie um repo vazio `pix2-evento` no GitHub e rode na raiz deste repositório:

```bash
git subtree split --prefix=evento -b evento-only
git push git@github.com:murilloribeiro1-sudo/pix2-evento.git evento-only:main
```

Depois aponte o projeto da Vercel para o novo repo (Root Directory vazio).

Duas ferramentas no mesmo deploy (Vercel):

| URL | Quem usa | O que faz |
|---|---|---|
| `/show` | Apresentador (senha) | Coleta os comandos da plateia, gera o cenário com Nano Banana e o comercial de 30s com Seedance 2.5 |
| `/pia?c=CODIGO` | Público (via QR Code) | Selfie → personagem 3D com a roupa do Paraná (Nano Banana Pro, edição com referências) |
| `/qr?c=CODIGO` | Telão | Gera o QR Code que aponta para `/pia` |

Backend: funções serverless em `api/` que falam com a **fal.ai** (fila assíncrona). A chave nunca vai para o navegador.

## 1. Configurar (uma vez)

1. Criar chave em fal.ai (Dashboard → Keys) e colocar crédito.
2. Na Vercel → Project → Settings → Environment Variables:

| Variável | Valor |
|---|---|
| `FAL_KEY` | chave da fal.ai |
| `ADMIN_PASS` | senha do `/show` |
| `EVENT_CODE` | código que vai no QR (ex.: `parana2026`) |
| `PUBLIC_URL` | URL do deploy (ex.: `https://pix2-orcamento.vercel.app`) |

3. Subir as 3 referências do personagem em `refs/` com os nomes exatos (ver `refs/README.md`) e fazer deploy.
4. Abrir `/show`, entrar com a senha. As "pílulas" no topo mostram se a chave e as 3 referências foram encontradas. Tudo verde = pronto.

Modelos podem ser trocados por env sem mexer em código: `IMAGE_MODEL_LOCATION`, `IMAGE_MODEL_SELFIE`, `VIDEO_MODEL`.

## 2. Ensaio obrigatório (não pule)

Rode o fluxo completo pelo menos 3 vezes antes do evento, com inputs bobos, e anote:

- tempo real do cenário (esperado: 10 a 40 s);
- tempo real do comercial de 30 s em 720p (esperado: 3 a 8 min, depende da fila da fal);
- se o Piá saiu parecido com a referência. Se não saiu, melhore `refs/pia-personagem.png` (character sheet limpo, sem legendas) antes de mexer em prompt.

Salve um dos vídeos do ensaio como **plano B** no seu notebook. Se ao vivo der erro ou passar do tempo, você mostra esse e usa o log de erro como parte da fala.

## 3. Roteiro na palestra

1. Abra `/show` já logado, com o log limpo, projetado no telão.
2. Pergunte "um lugar" → digite em **Local**. "Um serviço" → **Serviço**. "O que ele fala" → **Fala**. Mais pedidos → **Ações**, um por linha.
3. Clique **Gerar cenário**. Enquanto renderiza, mostre o prompt que apareceu no log: é o momento de explicar que o Nano Banana só faz o lugar, não a cena.
4. Cenário pronto → o prompt do vídeo é montado sozinho. Leia em voz alta, edite se a plateia pedir, clique **Gerar comercial**.
5. **Continue a palestra.** O vídeo leva minutos. O cronômetro no topo mostra o tempo real. Volte quando o status ficar "Comercial pronto".
6. Dê play em tela cheia. Depois volte ao log e aponte os erros: onde o personagem mudou, onde o lip-sync falhou, onde o texto final saiu errado. O log tem o prompt exato, os IDs de job e o tempo de cada etapa.

Dicas que mudam o resultado:
- Fala curta (uma frase). Fala longa em 30 s vira lip-sync ruim.
- Lugar reconhecível ("Torre Eiffel" funciona melhor que "França").
- Poucas ações extras. Cada pedido a mais é uma chance a mais de erro. Isso é bom para a palestra, ruim para o vídeo.

## 4. Selfie do público

- Projete `/qr?c=SEU_CODIGO`. O QR leva para `/pia?c=SEU_CODIGO`.
- A pessoa tira a selfie, marca o consentimento, espera 30 s a 2 min e baixa/compartilha.
- A foto é reduzida no celular (1280 px) e enviada direto para a fal; não fica salva no servidor da Vercel. A fal guarda os arquivos de saída temporariamente (dias) nos links gerados.
- Sem o código no link, a página não funciona. Troque `EVENT_CODE` depois do evento para o link morrer.

Custo estimado (fal, set/2026, confira no painel): Nano Banana Pro edit ≈ US$ 0,15 por selfie; Nano Banana simples ≈ US$ 0,04; Seedance 2.5 30 s 720p na faixa de alguns dólares por vídeo. Para baratear as selfies, defina `IMAGE_MODEL_SELFIE=fal-ai/nano-banana/edit` (perde um pouco de semelhança).

## 5. O que pode dar errado

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Pílula "FAL_KEY AUSENTE" | env não configurada ou deploy antigo | conferir Vercel e redeploy |
| "ref personagem faltando" | arquivo não está em `refs/` com o nome exato | subir e redeploy |
| Cenário vem com gente/texto | prompt editado | usar o padrão, ele já proíbe pessoas e texto |
| Vídeo demora > 10 min | fila da fal | continuar a palestra; plano B |
| Erro 422 da fal no vídeo | parâmetro inválido (ex.: 1080p indisponível na sua conta) | trocar resolução para 720p |
| Muita gente ao mesmo tempo no `/pia` | fila da fal cresce | normal; a página mostra a posição na fila |
