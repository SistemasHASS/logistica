# -*- coding: utf-8 -*-
"""Extrae: parametros de cada SP (nombre/tipo), uso OPENJSON/FOR JSON, y DTOs del API."""
import os, re, json, glob, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE  = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica'
BACK  = r'C:\Users\jonathan.marquina\Documents\Proyectos\api_logistica'
SQLD  = os.path.join(BACK,'SQL')
OUT   = {}

cre = re.compile(r'CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_0-9]+)\]?\s*(.*?)(?=\bAS\b)', re.I|re.S)
param_re = re.compile(r'@([A-Za-z_0-9]+)\s+([A-Za-z]+(?:\(\s*(?:\d+|max)\s*(?:,\s*\d+)?\s*\))?)', re.I)

for root,_,files in os.walk(SQLD):
    for f in files:
        if not f.lower().endswith('.sql'): continue
        try: src=open(os.path.join(root,f),encoding='utf-8',errors='replace').read()
        except Exception: continue
        pos=[m for m in re.finditer(r'CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_0-9]+)\]?',src,re.I)]
        for i,m in enumerate(pos):
            sp=m.group(1).lower()
            end=pos[i+1].start() if i+1<len(pos) else len(src)
            body=src[m.end():end]
            hdr=body[:body.upper().find('\nAS') if '\nAS' in body.upper() else 1500]
            params=param_re.findall(hdr)
            cur=OUT.setdefault(sp,{'params':[],'openjson':False,'forjson':False,'json_in':False,'file':f})
            for pname,ptype in params:
                if [pname,ptype] not in cur['params']: cur['params'].append([pname,ptype])
            if re.search(r'OPENJSON|JSON_VALUE|JSON_QUERY|ISJSON',body,re.I): cur['openjson']=True
            if re.search(r'FOR\s+JSON',body,re.I): cur['forjson']=True
            if any('json' in p[0].lower() or 'NVARCHAR(MAX)' in p[1].upper() for p in cur['params']): cur['json_in']=True

# DTOs del API: clases *Request/*Dto/*Body en Models y controllers
dtos={}
for f in glob.glob(os.path.join(BACK,'**','*.cs'),recursive=True):
    if 'obj' in f.replace('\\','/') or 'bin' in f.replace('\\','/'): continue
    src=open(f,encoding='utf-8',errors='replace').read()
    for m in re.finditer(r'public\s+(?:class|record)\s+(\w*(?:Request|Dto|Body|Model)\w*)\s*(?:\([^)]*\))?\s*\{?((?:[^{}]|\{[^{}]*\}){0,3000})',src):
        cls=m.group(1); body=m.group(2)
        props=re.findall(r'public\s+([\w<>\[\]?]+)\s+(\w+)\s*\{',body)
        if props: dtos[cls]=[[t,n] for t,n in props]

json.dump({'sps':OUT,'dtos':dtos},open(os.path.join(BASE,'contrato_json.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
jin=sum(1 for v in OUT.values() if v['json_in']); oj=sum(1 for v in OUT.values() if v['openjson']); fj=sum(1 for v in OUT.values() if v['forjson'])
print(f'SPs:{len(OUT)} json-in:{jin} openjson:{oj} forjson:{fj} dtos:{len(dtos)}')
