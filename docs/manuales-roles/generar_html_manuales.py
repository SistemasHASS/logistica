# -*- coding: utf-8 -*-
"""
Genera versiones HTML navegables de todos los manuales .md
en manuales-roles/html-manuales/ (misma estructura: raiz + roles/).

Cada HTML incluye barra de navegacion: volver al portal, ver/descargar
el .docx equivalente (si existe) y abrir el .md fuente.

Uso:  python generar_html_manuales.py
Req:  pandoc (pypandoc-binary)
"""
import os, re, posixpath
from urllib.parse import quote

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, 'html-manuales')

CSS = """
  body { font-family:'Segoe UI',system-ui,sans-serif; background:#0f172a; color:#1e293b; margin:0; }
  nav.top { position:sticky; top:0; z-index:10; display:flex; align-items:center; gap:14px; flex-wrap:wrap;
            padding:12px 24px; background:#0f172a; border-bottom:1px solid #1e293b; }
  nav.top a.volver { color:#60a5fa; text-decoration:none; font-size:14px; white-space:nowrap; }
  nav.top a.volver:hover { text-decoration:underline; }
  nav.top .t { font-size:15px; font-weight:600; color:#e2e8f0; flex:1; min-width:200px;
               overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  nav.top a.btn { font-size:12px; color:#cbd5e1; text-decoration:none; background:#1e293b;
                  border:1px solid #334155; border-radius:6px; padding:6px 12px; white-space:nowrap; }
  nav.top a.btn:hover { border-color:#60a5fa; color:#93c5fd; }
  article { max-width:900px; margin:0 auto; padding:32px 24px 60px; background:#fff; min-height:100vh; }
  h1,h2,h3,h4 { margin:1.4em 0 .5em; line-height:1.3; color:#0f172a; }
  h1 { font-size:26px; border-bottom:2px solid #e2e8f0; padding-bottom:8px; }
  h2 { font-size:21px; border-bottom:1px solid #e2e8f0; padding-bottom:6px; }
  h3 { font-size:17px; }
  p, li { line-height:1.65; font-size:15px; }
  ul, ol { padding-left:26px; margin:.6em 0; }
  a { color:#2563eb; }
  code { background:#f1f5f9; border-radius:4px; padding:1px 6px; font-size:13px; color:#be185d; }
  pre { background:#0f172a; color:#e2e8f0; border-radius:8px; padding:14px 16px; overflow:auto; margin:.8em 0; }
  pre code { background:none; color:inherit; padding:0; }
  table { border-collapse:collapse; margin:.9em 0; width:100%; font-size:14px; }
  th, td { border:1px solid #cbd5e1; padding:7px 10px; text-align:left; }
  th { background:#f1f5f9; }
  tr:nth-child(even) td { background:#f8fafc; }
  img { max-width:100%; border:1px solid #e2e8f0; border-radius:6px; margin:.6em 0; }
  blockquote { border-left:4px solid #cbd5e1; padding:4px 16px; color:#475569; margin:.8em 0; }
  hr { border:none; border-top:1px solid #e2e8f0; margin:1.6em 0; }
  @media (max-width:700px) {
    nav.top { padding:10px 12px; gap:8px; }
    nav.top .t { font-size:13px; min-width:120px; }
    article { padding:22px 14px 50px; }
    table { display:block; overflow-x:auto; }
    pre { font-size:12px; }
  }
"""

TPL = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Sistema Logistica</title>
<style>{css}</style>
<script src="{up}solo-rol.js"></script>
</head>
<body>
<nav class="top">
  <a class="volver" href="{up}index.html">&#8592; Portal</a>
  <span class="t">{title}</span>
  {word_btns}
  <a class="btn" href="{up}{src_md}">Fuente .md</a>
</nav>
<article>
{body}
</article>
</body>
</html>
"""


def fix_attrs(body, base_rel, up):
    """Ajusta src/href relativos para la nueva profundidad (+1 nivel)."""
    def fix_src(m):
        s = m.group(2)
        if re.match(r'^(https?:|data:|/)', s, re.I):
            return m.group(0)
        return m.group(1) + '../' + s + m.group(3)

    def fix_href(m):
        h = m.group(2)
        if re.match(r'^(https?:|#|mailto:|/)', h, re.I):
            return m.group(0)
        # .md -> .html en la estructura espejo
        if re.search(r'\.md$', h, re.I):
            return m.group(1) + h[:-3] + '.html' + m.group(3)
        # .docx -> visor word
        if re.search(r'\.docx$', h, re.I):
            param = posixpath.normpath(posixpath.join(base_rel, h))
            return m.group(1) + up + 'visor-docx.html?doc=' + quote(param) + m.group(3)
        return m.group(1) + '../' + h + m.group(3)

    body = re.sub(r'(src=")([^"]+)(")', fix_src, body)
    body = re.sub(r'(href=")([^"]+)(")', fix_href, body)
    return body


def convert(md_path, out_path, base_rel, up, src_md, title):
    try:
        import pypandoc
        body = pypandoc.convert_file(md_path, 'html5', format='gfm',
                                     extra_args=['--wrap=none'])
    except Exception as e:
        print('ERROR', md_path, str(e)[:200])
        return False
    body = fix_attrs(body, base_rel, up)

    stem = os.path.splitext(os.path.basename(md_path))[0]
    docx_rel = 'docx/' + stem + '.docx'
    word_btns = ''
    if os.path.exists(os.path.join(BASE, docx_rel)):
        word_btns = ('<a class="btn" href="{0}visor-docx.html?doc={1}">Ver Word</a>'
                     '<a class="btn" href="{0}{1}">&#11015; .docx</a>'
                     ).format(up, quote(docx_rel))
    html = TPL.format(title=title, css=CSS, up=up, src_md=src_md,
                      word_btns=word_btns, body=body)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)
    return True


def main():
    targets = []
    for f in sorted(os.listdir(BASE)):
        if f.endswith('.md') and f != 'README.md':
            targets.append((os.path.join(BASE, f), ''))
    roles_dir = os.path.join(BASE, 'roles')
    for f in sorted(os.listdir(roles_dir)):
        if f.endswith('.md'):
            targets.append((os.path.join(roles_dir, f), 'roles'))

    ok = 0
    for md_path, base_rel in targets:
        name = os.path.basename(md_path)
        rel_out = (base_rel + '/' if base_rel else '') + name[:-3] + '.html'
        out_path = os.path.join(OUT, rel_out.replace('/', os.sep))
        up = '../' * (2 if base_rel else 1)
        src_md = (base_rel + '/' if base_rel else '') + name
        title = name[:-3].replace('_', ' ')
        if convert(md_path, out_path, base_rel, up, src_md, title):
            ok += 1
            print('OK', rel_out)
    print('Generados:', ok, 'de', len(targets))


if __name__ == '__main__':
    main()
