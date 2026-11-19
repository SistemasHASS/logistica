# -*- coding: utf-8 -*-
"""Extrae catalogo de archivos TS y CS: clase, tipo, metodos, deps, rutas."""
import os, re, json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

FRONT = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica\src\app'
BACK  = r'C:\Users\jonathan.marquina\Documents\Proyectos\api_logistica'
OUT   = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica'

def kind_ts(path, src):
    low = path.lower()
    if '.guard.' in low or '/guard' in low or '/guards' in low: return 'guard'
    if '.service.' in low or '/services/' in low: return 'service'
    if '.component.' in low or 'pages/' in low or 'components/' in low or 'tabs/' in low: return 'component'
    if '.interceptor' in low or '/interceptors/' in low: return 'interceptor'
    if '.model.' in low or '/models/' in low or '/interfaces/' in low or '.interface' in low: return 'modelo'
    if '.pipe.' in low or '/pipes/' in low: return 'pipe'
    if '.directive' in low or '/directives/' in low: return 'directive'
    if '.route' in low or 'routes' in low: return 'routing'
    if 'dixiedb' in low or 'dexie' in low: return 'bd-local'
    return 'util'

def kind_cs(path, src):
    low = path.lower().replace('\\','/')
    if '/controllers/' in low or '/controller/' in low or re.search(r'controller.*\.cs$', low): return 'controller'
    if 'usecaseimpl' in low: return 'usecase-impl'
    if '/domain/usecase/' in low: return 'usecase'
    if 'repositoryimpl' in low: return 'repository-impl'
    if '/domain/repository/' in low: return 'repository'
    if '/domain/service/' in low: return 'service-domain'
    if 'serviceimpl' in low: return 'service-impl'
    if '/domain/models/' in low or '/models/' in low: return 'modelo'
    if 'middleware' in low: return 'middleware'
    if 'persistence' in low: return 'persistence'
    if 'exceptions' in low: return 'exception'
    if 'program.cs' in low or 'startup' in low: return 'bootstrap'
    return 'otro'

def parse_ts(path, src):
    d = {'file': os.path.relpath(path, FRONT).replace('\\','/'), 'kind': kind_ts(path, src)}
    m = re.search(r'export\s+(?:abstract\s+)?class\s+(\w+)', src)
    d['clase'] = m.group(1) if m else os.path.basename(path)
    sel = re.search(r"selector:\s*'([^']+)'", src)
    if sel: d['selector'] = sel.group(1)
    deps = re.search(r'constructor\s*\(([^)]*)\)', src, re.S)
    if deps:
        d['deps'] = re.findall(r'private\s+(\w+):\s*([A-Z]\w+)', deps.group(1)) or re.findall(r'(\w+):\s*([A-Z]\w+)', deps.group(1))
        d['deps'] = [b for a,b in d['deps']]
    meths = re.findall(r'(?:public\s+|async\s+)?(\w+)\s*\([^)]*\)\s*[:\w\s<>|]*\{', src)
    d['metodos'] = [m for m in meths if m not in ('if','for','while','switch','return','catch','constructor','subscribe','map','filter','new','then','else','do','try','ngOnInit','ngOnDestroy','ngAfterViewInit')][:30]
    if re.search(r'ngOnInit', src): d['lifecycle'] = 'ngOnInit'
    return d

def parse_cs(path, src):
    d = {'file': os.path.relpath(path, BACK).replace('\\','/'), 'kind': kind_cs(path, src)}
    m = re.search(r'public\s+(?:sealed\s+|abstract\s+)?(?:class|interface|record|enum)\s+(\w+)', src)
    d['clase'] = m.group(1) if m else os.path.basename(path).replace('.cs','')
    route = re.search(r'\[Route\("([^"]+)"\)\]', src)
    if route: d['route'] = route.group(1)
    d['endpoints'] = re.findall(r'\[(HttpGet|HttpPost|HttpPut|HttpDelete|HttpPatch)(?:\("([^"]*)"\))?\]', src)
    deps = re.search(r'public\s+\w+\s*\(\s*([^)]*)\)', src)
    if deps:
        d['deps'] = re.findall(r'(?:readonly\s+)?[I?]?([A-Z]\w+)\s+\w+', deps.group(1))
    sp = re.findall(r'(?:CommandText\s*=\s*"|Execute(?:Async)?(?:<[^>]+>)?\s*\(\s*"|StoredProcedure\s*\(\s*")([A-Za-z_][A-Za-z0-9_]*)', src)
    d['sps'] = sorted(set(s for s in sp if not s.startswith('sp_')))[:20]
    meths = re.findall(r'public\s+(?:async\s+)?(?:Task<[^>]+>|Task|[\w<>\[\]]+)\s+(\w+)\s*\(', src)
    d['metodos'] = [m for m in meths if m != d['clase']][:30]
    return d

front, back = [], []
for root, dirs, files in os.walk(FRONT):
    dirs[:] = [x for x in dirs if x not in ('node_modules','dist','.angular')]
    for f in files:
        if f.endswith('.ts') and not f.endswith(('.spec.ts','.d.ts')):
            p = os.path.join(root, f)
            try:
                src = open(p, encoding='utf-8', errors='replace').read()
                if len(src) > 20:
                    front.append(parse_ts(p, src))
            except Exception:
                pass
for root, dirs, files in os.walk(BACK):
    dirs[:] = [x for x in dirs if x not in ('bin','obj','.vs','SQL')]
    for f in files:
        if f.endswith('.cs'):
            p = os.path.join(root, f)
            try:
                src = open(p, encoding='utf-8', errors='replace').read()
                if len(src) > 20:
                    back.append(parse_cs(p, src))
            except Exception:
                pass

front.sort(key=lambda x: x['file']); back.sort(key=lambda x: x['file'])
json.dump({'front': front, 'back': back}, open(os.path.join(OUT,'catalogo_codigo.json'),'w',encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'TS: {len(front)} | CS: {len(back)}')
ctrl = sum(1 for b in back if b['kind']=='controller')
print('controllers:', ctrl, '| endpoints:', sum(len(b["endpoints"]) for b in back))
