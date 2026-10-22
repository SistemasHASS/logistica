# -*- coding: utf-8 -*-
"""
Convierte los manuales Markdown de manuales-roles/ a Word (.docx).

Uso:  python convertir_a_docx.py
Requiere: pip install pypandoc-binary
"""

import os
import pypandoc

BASE = os.path.dirname(os.path.abspath(__file__))   # .../manuales-roles/docx
RAIZ = os.path.dirname(BASE)                         # .../manuales-roles

FUENTES = [
    os.path.join(RAIZ, f)
    for f in sorted(os.listdir(RAIZ))
    if f.endswith(".md") and f != "README.md"
]
FUENTES += [
    os.path.join(RAIZ, "roles", f)
    for f in sorted(os.listdir(os.path.join(RAIZ, "roles")))
    if f.endswith(".md")
]

for src in FUENTES:
    nombre = os.path.splitext(os.path.basename(src))[0] + ".docx"
    destino = os.path.join(BASE, nombre)
    try:
        pypandoc.convert_file(
            src, "docx", outputfile=destino,
            extra_args=["--resource-path=" + os.path.dirname(src),
                        "--standalone",
                        "--metadata", "lang=es"],
        )
        print(f"  OK {nombre}")
    except Exception as e:
        print(f"  ERROR {nombre}: {e}")

print("Listo. Archivos en:", BASE)
