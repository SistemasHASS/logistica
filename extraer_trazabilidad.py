# -*- coding: utf-8 -*-
"""Construye trazabilidad SP -> repo -> usecase -> controller -> endpoint -> servicio Angular -> tablas."""
import os, re, json, glob, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE  = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica'
FRONT = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica\src\app'
BACK  = r'C:\Users\jonathan.marquina\Documents\Proyectos\api_logistica'
SQLD  = os.path.join(BACK, 'SQL')
CAT   = json.load(open(os.path.join(BASE,'catalogo_codigo.json'),encoding='utf-8'))

# ---- 1. SP -> tablas lee/escribe + archivo fuente ----
sp_tablas, sp_file = {}, {}
cre = re.compile(r'CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_0-9]+)\]?', re.I)
wr  = re.compile(r'(?:INSERT\s+INTO|UPDATE|MERGE\s+INTO|DELETE\s+FROM|DELETE)\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_0-9]+)\]?', re.I)
rd  = re.compile(r'(?:FROM|JOIN)\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_0-9]+)\]?', re.I)
skip = {'SELECT','WHERE','SET','DECLARE','EXEC','VALUES','INTO','OUTPUT','GETDATE'}
for root,_,files in os.walk(SQLD):
    for f in files:
        if not f.lower().endswith('.sql'): continue
        try: src=open(os.path.join(root,f),encoding='utf-8',errors='replace').read()
        except Exception: continue
        pos=[m for m in cre.finditer(src)]
        for i,m in enumerate(pos):
            sp=m.group(1).lower(); sp_file.setdefault(sp,f)
            body=src[m.end():pos[i+1].start() if i+1<len(pos) else len(src)]
            W={t for t in wr.findall(body) if t.upper() not in skip and not t.startswith('@')}
            R={t for t in rd.findall(body) if t.upper() not in skip and not t.startswith('@')}
            cur=sp_tablas.setdefault(sp,{'w':set(),'r':set()})
            cur['w']|=W; cur['r']|=R

# ---- 2. interfaces/clases del backend ----
by_class={}
for b in CAT['back']:
    by_class[b['clase']]=b

# repo-impl -> sps : literales "LOGISTICA_xxx"/"ADMIN_xxx"/etc. que coinciden con SPs reales
repo_sps={}
lit=re.compile(r'"((?:LOGISTICA|ADMIN|WH|SPRING)_[A-Za-z0-9_]+)"')
for b in CAT['back']:
    if b['kind']=='repository-impl':
        fpath=os.path.join(BACK,b['file'])
        try: src=open(fpath,encoding='utf-8',errors='replace').read()
        except Exception: continue
        for m in lit.finditer(src):
            name=m.group(1).lower()
            if name in sp_file:
                repo_sps.setdefault(name,b['clase'])

# nombres de interfaces conocidas
repo_ifaces={b['clase'] for b in CAT['back'] if b['kind']=='repository'}
uc_ifaces={b['clase'] for b in CAT['back'] if b['kind']=='usecase'}
impl_repo={b['clase']:b['clase'].replace('Impl','').replace('Implementation','I').lstrip() for b in CAT['back'] if b['kind']=='repository-impl'}
impl_uc={b['clase']:b['clase'].replace('Impl','I') for b in CAT['back'] if b['kind']=='usecase-impl'}

def deps_in_file(relpath):
    """Interfaces inyectadas: busca nombres IXxxRepository / IXxxUseCase en el fuente."""
    try: src=open(os.path.join(BACK,relpath),encoding='utf-8',errors='replace').read()
    except Exception: return set()
    found=set(re.findall(r'\b(I[A-Z]\w+)\b',src))
    return found

# mapa IRepo -> usecase-impl que lo inyecta
uci_por_repo={}
for b in CAT['back']:
    if b['kind']=='usecase-impl':
        for dep in deps_in_file(b['file']):
            if dep in repo_ifaces:
                uci_por_repo.setdefault(dep.lower(),b['clase'])

# mapa IUseCase -> controller que lo inyecta
ctrl_por_uc={}
for b in CAT['back']:
    if b['kind']=='controller':
        for dep in deps_in_file(b['file']):
            if dep in uc_ifaces:
                ctrl_por_uc.setdefault(dep.lower(),b)

# ---- 3. URLs llamadas por servicios Angular ----
Q="['\"`]"
svc_urls={}
pat=re.compile(r'\.(get|post|put|delete|patch)\w*\s*(?:<[^>]*>)?\(\s*'+Q+r'([^\'"`]{3,140})')
pat_tpl=re.compile(r'\.(get|post|put|delete|patch)\w*\s*(?:<[^>]*>)?\(\s*`([^`]{3,140})`')
for f in glob.glob(os.path.join(FRONT,'**','*.ts'),recursive=True):
    rel=os.path.relpath(f,FRONT).replace('\\','/')
    src=open(f,encoding='utf-8',errors='replace').read()
    for m in list(pat.finditer(src))+list(pat_tpl.finditer(src)):
        u=m.group(2)
        if '/' in u:
            svc_urls.setdefault(rel,set()).add(re.sub(r'\$\{[^}]+\}','{x}',u))

# unir urls de todos los servicios -> indice url -> servicios
url_svc={}
for s,us in svc_urls.items():
    for u in us: url_svc.setdefault(u,set()).add(s)

def servicio_para(route):
    """Encuentra servicios Angular cuyas URLs contienen el path del endpoint."""
    hits=[]
    base=route.lower().lstrip('/')
    for u,svcs in url_svc.items():
        ul=u.lower()
        # normalizar: quitar variables {x}
        un=re.sub(r'\{x\}','',ul)
        bn=re.sub(r'\{[^}]*\}','',base)
        if bn and bn in un or (len(bn)>6 and bn.split('/')[-1] and bn.split('/')[-1] in un and bn.split('/')[0] in un):
            hits+=list(svcs)
    return sorted(set(hits))[:4]

# ---- 4. ensamblar trazabilidad por SP ----
traza={}
for sp in sorted(set(list(sp_file.keys())+list(repo_sps.keys()))):
    t={'sp':sp,'file':sp_file.get(sp,'(no encontrado en scripts)'),
       'repo':repo_sps.get(sp,''),'uc':'','ctrl':'','route':'',
       'endpoints':[],'svc':[],'w':sorted(sp_tablas.get(sp,{}).get('w',[])),
       'r':sorted(sp_tablas.get(sp,{}).get('r',[]))[:10]}
    repo=t['repo']
    if repo:
        # repo impl -> interfaz (FooRepositoryImpl -> ifoorepository)
        irepo=repo.replace('Impl','').replace('ImplRepository','Repository')
        irepo='i'+irepo
        uc=uci_por_repo.get(irepo.lower())
        if not uc:  # fallback por nombre de modulo
            mod=irepo.lower().lstrip('i').replace('repository','')
            for k,v in uci_por_repo.items():
                if mod and mod in k: uc=v; break
        t['uc']=uc or ''
        if uc:
            iuc='i'+uc  # DespachoUseCase -> idespachousecase
            c=ctrl_por_uc.get(iuc.lower())
            if c:
                t['ctrl']=c['clase']; t['route']=c.get('route','')
                t['endpoints']=[f"{v[0].replace('Http','')} {v[1] or ''}" for v in c.get('endpoints',[])][:15]
        # fallback: matching por nombre de modulo hacia controllers
        if not t['ctrl']:
            mod=irepo.lower().lstrip('i').replace('repository','')
            for k,c in ctrl_por_uc.items():
                if mod and (mod in k or mod in c['clase'].lower()):
                    t['ctrl']=c['clase']; t['route']=c.get('route','')
                    t['endpoints']=[f"{v[0].replace('Http','')} {v[1] or ''}" for v in c.get('endpoints',[])][:15]
                    break
            if not t['ctrl']:
                for b2 in CAT['back']:
                    if b2['kind']=='controller' and mod and mod in b2['clase'].lower():
                        t['ctrl']=b2['clase']; t['route']=b2.get('route','')
                        t['endpoints']=[f"{v[0].replace('Http','')} {v[1] or ''}" for v in b2.get('endpoints',[])][:15]
                        break
    if t['route']:
        t['svc']=servicio_para(t['route'])
    traza[sp]=t

json.dump({'traza':traza}, open(os.path.join(BASE,'trazabilidad_sp.json'),'w',encoding='utf-8'), ensure_ascii=False, indent=1)
con_repo=sum(1 for t in traza.values() if t['repo'])
con_uc=sum(1 for t in traza.values() if t['uc'])
con_ctrl=sum(1 for t in traza.values() if t['ctrl'])
con_svc=sum(1 for t in traza.values() if t['svc'])
con_tab=sum(1 for t in traza.values() if t['w'] or t['r'])
print(f'SPs: {len(traza)} | repo:{con_repo} uc:{con_uc} ctrl:{con_ctrl} svc:{con_svc} tablas:{con_tab}')
