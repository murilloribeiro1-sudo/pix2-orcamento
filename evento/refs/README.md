# Referências do personagem (Piá do Paraná)

Coloque aqui os PNGs. Os nomes são fixos (o backend procura exatamente estes):

| Arquivo | Uso | O que deve conter |
|---|---|---|
| `pia-personagem.png` | Vídeo (Seedance 2.5) | Character sheet: corpo inteiro, frente + 3/4, fundo neutro, roupa com "PARANÁ" no peito. Se tiver mais de uma vista, pode juntar numa imagem só. |
| `pia-rosto.png` | Selfie (Nano Banana) | Close do rosto do Piá mostrando o traço 3D (olhos, pele, cabelo). É a referência de ESTILO, não de identidade. |
| `pia-roupa.png` | Selfie (Nano Banana) | A camiseta/roupa vista de frente, nítida, com o "PARANÁ" legível. |

Regras práticas:
- PNG ou JPG, entre 1024 e 2048 px no lado maior, fundo limpo.
- Sem texto solto, sem marca d'água, sem várias poses misturadas com legendas (o modelo copia o que vê).
- Para o vídeo, é possível usar mais de uma imagem do personagem: defina `REF_CHARACTER_URLS` (URLs separadas por vírgula) nas variáveis da Vercel.
