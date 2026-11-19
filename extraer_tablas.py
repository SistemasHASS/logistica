# -*- coding: utf-8 -*-
"""Extrae las columnas de los CREATE TABLE de los scripts SQL de api_logistica."""
import os, re, json

SQL_DIR = r'C:\Users\jonathan.marquina\Documents\Proyectos\api_logistica\SQL'
OUT = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica\tablas_diccionario.json'

ct_re = re.compile(r'CREATE\s+TABLE\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_0-9]+)\]?\s*\((.*?)\n\s*\)', re.I | re.S)
col_skip = re.compile(r'^\s*(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|INDEX|CHECK|GO|--|\)|$)', re.I)

tables = {}
for root, _, files in os.walk(SQL_DIR):
    for fn in files:
        if not fn.lower().endswith('.sql'):
            continue
        try:
            txt = open(os.path.join(root, fn), encoding='utf-8', errors='replace').read()
        except Exception:
            continue
        for m in ct_re.finditer(txt):
            name = m.group(1)
            body = m.group(2)
            cols = []
            for line in body.split('\n'):
                line = line.strip().rstrip(',')
                if not line or col_skip.match(line):
                    continue
                mm = re.match(r'\[?([A-Za-z_0-9]+)\]?\s+(.*)', line)
                if not mm:
                    continue
                cname, rest = mm.group(1), mm.group(2)
                if cname.upper() in ('CONSTRAINT', 'PRIMARY', 'FOREIGN', 'UNIQUE', 'INDEX', 'CHECK'):
                    continue
                rest = re.sub(r'\s+', ' ', rest).strip()
                mnull = re.search(r'\b(NOT NULL|NULL)\b', rest)
                nullable = ''
                if mnull:
                    nullable = 'NOT NULL' if mnull.group(1) == 'NOT NULL' else 'NULL'
                    typ = rest[:mnull.start()].strip()
                    extra = rest[mnull.end():].strip()
                else:
                    typ, extra = rest, ''
                ident = 'IDENTITY' in rest.upper()
                pk = 'PRIMARY KEY' in rest.upper()
                defmatch = re.search(r'DEFAULT\s*\(?([^)\s]+)\)?', rest, re.I)
                dft = defmatch.group(1) if defmatch else ''
                cols.append({'col': cname, 'tipo': typ, 'null': nullable, 'pk': pk,
                             'id': ident, 'default': dft})
            if not cols:
                continue
            # guardar la definición con más columnas (la más completa)
            if name not in tables or len(cols) > len(tables[name]['cols']):
                tables[name] = {'cols': cols, 'file': fn}

json.dump(tables, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('tablas extraidas:', len(tables))
for k in sorted(tables):
    print(f"{k}: {len(tables[k]['cols'])} cols  ({tables[k]['file']})")
