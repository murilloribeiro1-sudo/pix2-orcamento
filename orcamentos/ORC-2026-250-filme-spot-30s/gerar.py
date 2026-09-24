import pathlib, sys
S = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2])
logo = (S/'logo.txt').read_text().strip()
css = (S/'css.txt').read_text()
ORC="ORC-2026-250"; DATA="24/09/2026"
EMP="PIX2 Produção de Conteúdo LTDA"; CNPJ="20.067.159/0001-30"; CID="Campina Grande do Sul/PR"
def tags(xs): return ''.join(f'<span class="prop-tag">{x}</span>' for x in xs)
filme=["Filme publicitário 30\"","Produção audiovisual completa","Janela de Libras","Legenda","Condecine","Cópias e liberação para emissora","Veiculação TV e redes sociais","Todas as mídias"]
spot=["Spot de rádio 30\"","Trilha composta (original)","Veiculação rádio e eventos"]
abr=["Praça: Paraná","Período: 3 meses","Direitos de uso: Paraná, 3 meses"]
escopo=("Produção de um filme publicitário de 30 segundos para TV e redes sociais, com veiculação em todas as mídias, "
"entregue com janela de Libras, legenda, Condecine, cópias e liberação para emissora. "
"Produção de um spot de 30 segundos com trilha composta, para veiculação em rádio e eventos. "
"Abrangência de ambas as peças: Paraná, pelo período de 3 meses.")
html=f"""<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>{ORC}</title><style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
@page{{size:A4;margin:0}}
{css}
html,body{{height:100%}} body{{min-height:1123px;display:flex;flex-direction:column}}
</style></head><body>
<div class="prop-header"><img src="{logo}" style="height:30px" alt="PIX2">
<div class="prop-meta"><div class="orc-num">{ORC}</div><div>Direção · Murillo Ribeiro</div><div>{DATA}</div></div></div>
<div class="prop-grid">
<div class="prop-grid-item"><div class="g-label">Projeto</div><div class="g-val">Filme 30" + Spot 30"</div></div>
<div class="prop-grid-item"><div class="g-label">Captação</div><div class="g-val">A definir</div></div>
<div class="prop-grid-item"><div class="g-label">Formatos</div><div class="g-val">Filme 30" · Spot 30"</div></div>
<div class="prop-grid-item"><div class="g-label">Praça</div><div class="g-val">Paraná</div></div>
<div class="prop-grid-item"><div class="g-label">Veiculação</div><div class="g-val">3 meses</div></div>
<div class="prop-grid-item"><div class="g-label">Mídias</div><div class="g-val">TV · Redes · Rádio · Eventos</div></div>
</div>
<div class="prop-escopo"><div class="prop-escopo-title">Escopo de Trabalho</div>{escopo}</div>
<div class="prop-card" style="margin:0;border:none;border-bottom:1px solid #22263a;flex:1">
<div class="prop-card-title">O que está incluído</div>
<div class="prop-tag-group">Filme de 30 segundos</div><div class="prop-tags">{tags(filme)}</div>
<div class="prop-tag-group">Spot de 30 segundos</div><div class="prop-tags">{tags(spot)}</div>
<div class="prop-tag-group">Abrangência</div><div class="prop-tags">{tags(abr)}</div>
</div>
<div class="prop-total-card"><div class="prop-total-label">Investimento Total</div><div class="prop-total-valor">R$ 238.350,00</div></div>
<div class="prop-assinatura"><div><div class="ass-label">Contratado</div><div class="ass-nome">Murillo Ribeiro</div>
<div class="ass-sub">{EMP}<br>{CNPJ}</div>
<div class="ass-linha-dupla"><div class="ass-linha-item">Assinatura</div><div class="ass-linha-item">Carimbo</div></div></div></div>
<div class="prop-footer"><span>{EMP} · {CNPJ}</span><span>{CID} · {ORC} · {DATA}</span></div>
</body></html>"""
h=OUT/f"{ORC}-proposta-FECHADA.html"; h.write_text(html)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(viewport={"width":794,"height":1123})
    pg.goto(f"file://{h.resolve()}", wait_until="networkidle", timeout=20000); pg.wait_for_timeout(2000)
    pg.pdf(path=str(OUT/f"{ORC}-proposta-FECHADA.pdf"), format="A4", margin={k:'0' for k in ('top','bottom','left','right')}, print_background=True, prefer_css_page_size=True)
    pg.screenshot(path=str(S/"preview.png"), full_page=True); b.close()
print("ok")
