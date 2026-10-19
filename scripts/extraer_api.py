# -*- coding: utf-8 -*-
"""
Extrae de api_logistica:
 - Endpoints de los controllers (verbo, ruta completa, metodo, usecase llamado)
 - Mapeo UseCase impl -> llamada a repository
 - Mapeo Repository impl -> nombre del SP ejecutado
 - Para cada SP: campos JSON leidos (JSON_VALUE / OPENJSON WITH) desde los .sql
Guarda: doc_output/api_map.json
"""
import os, re, json

API = r"C:\Users\jonathan.marquina\Documents\Jonathan Marquina\proyectos\backup\10.02.26\api_logistica"
OUT = os.path.join(os.path.dirname(__file__), "..", "doc_output")
os.makedirs(OUT, exist_ok=True)

# ---------- 1. Controllers ----------
ctrl_dir = os.path.join(API, "Infraestructure", "Controller")
controllers = []
for fn in sorted(os.listdir(ctrl_dir)):
    if not fn.endswith(".cs"):
        continue
    path = os.path.join(ctrl_dir, fn)
    src = open(path, encoding="utf-8", errors="ignore").read()
    m = re.search(r'\[Route\("([^"]+)"\)\]', src)
    base = m.group(1) if m else ""
    cls = re.search(r'class\s+(\w+Controller)', src)
    cname = cls.group(1) if cls else fn[:-3]
    endpoints = []
    # capturar [HttpX("sub")] ... public async Task<...> Method( ... ) { body }
    pat = re.compile(
        r'\[Http(Get|Post|Put|Delete|Patch)\s*(?:\("([^"]*)"\))?\]'
        r'(?:\s*\[[^\]]*\])*'
        r'\s*public\s+(?:async\s+)?[\w<>,\?\.\s\[\]]+?\s+(\w+)\s*\([^)]*\)\s*\{',
        re.S)
    for mm in pat.finditer(src):
        verb, sub, method = mm.group(1).upper(), mm.group(2) or "", mm.group(3)
        # cuerpo del metodo: desde { hasta el siguiente [Http o fin
        start = mm.end()
        nxt = re.search(r'\[Http|\n\s*\}\s*\n', src[start:start+4000])
        body = src[start:start + (nxt.start() if nxt else 2000)]
        # llamadas internas _campo.Metodo( excluyendo logger/utilidades
        calls = [c for c in re.findall(r'(?:this\.|_)(\w+)\.(\w+)\s*\(', body)
                 if c[0].lower() not in ("logger", "mapper", "env", "config")]
        metodos_llamados = [c[1] for c in calls]
        # SPs invocados directamente: SqlCommand("X") / EXEC X @json / CommandText="X"
        sp_directos = re.findall(r'SqlCommand\(\s*"([A-Za-z_]\w*)"', body)
        sp_directos += [x for x in re.findall(r'EXEC(?:UTE)?\s+(?:\[[\w\.]+\]\.dbo\.)?\[?([A-Za-z_]\w*)\]?', body) if x.upper() != 'SP_EXECUTESQL']
        endpoints.append({
            "verbo": verb,
            "ruta": ("/" + base + ("/" + sub if sub else "")).replace("[controller]", cname.replace("Controller","").lower()),
            "metodo": method,
            "usecase": metodos_llamados[-1] if metodos_llamados else "",
            "usecase_calls": metodos_llamados,
            "sp_directos": sp_directos,
        })
    controllers.append({"controlador": cname, "archivo": fn, "base": base, "endpoints": endpoints})

# tambien controlador en carpeta Controllers (AdminLogisticaController)
extra_dir = os.path.join(API, "Controllers")
if os.path.isdir(extra_dir):
    for fn in sorted(os.listdir(extra_dir)):
        if not fn.endswith(".cs"):
            continue
        path = os.path.join(extra_dir, fn)
        src = open(path, encoding="utf-8", errors="ignore").read()
        m = re.search(r'\[Route\("([^"]+)"\)\]', src)
        base = m.group(1) if m else ""
        cls = re.search(r'class\s+(\w+Controller)', src)
        cname = cls.group(1) if cls else fn[:-3]
        endpoints = []
        pat = re.compile(
            r'\[Http(Get|Post|Put|Delete|Patch)\s*(?:\("([^"]*)"\))?\]'
            r'(?:\s*\[[^\]]*\])*'
            r'\s*public\s+(?:async\s+)?[\w<>,\?\.\s\[\]]+?\s+(\w+)\s*\([^)]*\)\s*\{',
            re.S)
        for mm in pat.finditer(src):
            verb, sub, method = mm.group(1).upper(), mm.group(2) or "", mm.group(3)
            start = mm.end()
            nxt = re.search(r'\[Http|\n\s*\}\s*\n', src[start:start+4000])
            body = src[start:start + (nxt.start() if nxt else 2000)]
            calls = [c for c in re.findall(r'(?:this\.|_)(\w+)\.(\w+)\s*\(', body)
                     if c[0].lower() not in ("logger", "mapper", "env", "config")]
            metodos_llamados = [c[1] for c in calls]
            sp_directos = re.findall(r'SqlCommand\(\s*"([A-Za-z_]\w*)"', body)
            sp_directos += [x for x in re.findall(r'EXEC(?:UTE)?\s+(?:\[[\w\.]+\]\.dbo\.)?\[?([A-Za-z_]\w*)\]?', body) if x.upper() != 'SP_EXECUTESQL']
            endpoints.append({
                "verbo": verb,
                "ruta": ("/" + base + ("/" + sub if sub else "")).replace("[controller]", cname.replace("Controller","").lower()),
                "metodo": method,
                "usecase": metodos_llamados[-1] if metodos_llamados else "",
                "usecase_calls": metodos_llamados,
                "sp_directos": sp_directos,
            })
        controllers.append({"controlador": cname, "archivo": fn, "base": base, "endpoints": endpoints})

# ---------- 2. UseCase impl: metodo -> repo call ----------
uc_dirs = [os.path.join(API, "Application", "UseCaseImpl"),
           os.path.join(API, "Infraestructure", "UseCase"),
           os.path.join(API, "Infraestructure", "UseCaseImpl")]
uc_map = {}  # metodo usecase -> metodo repo
uc_file = {}
for uc_dir in uc_dirs:
    if not os.path.isdir(uc_dir):
        continue
    for fn in sorted(os.listdir(uc_dir)):
        if not fn.endswith(".cs"):
            continue
        src = open(os.path.join(uc_dir, fn), encoding="utf-8", errors="ignore").read()
        for mm in re.finditer(
                r'public\s+(?:async\s+)?[\w<>,\?\.\s]+?\s+(\w+)\s*\([^)]*\)\s*\{(.*?)\n\s*\}',
                src, re.S):
            name, body = mm.group(1), mm.group(2)
            rc = [c[1] for c in re.findall(r'(?:this\.|_)(\w+)\.(\w+)\s*\(', body)
                  if c[0].lower() not in ("logger", "mapper") and not c[1].startswith("Log")]
            uc_map[name] = rc[0] if rc else ""
            uc_file[name] = fn

# ---------- 3. Repository impl: metodo -> SP ----------
repo_dir = os.path.join(API, "Infraestructure", "RepositoryImpl")
sp_map = {}   # metodo repo -> nombre SP
for fn in sorted(os.listdir(repo_dir)):
    if not fn.endswith(".cs"):
        continue
    src = open(os.path.join(repo_dir, fn), encoding="utf-8", errors="ignore").read()
    # metodos con cuerpo { ... }
    for mm in re.finditer(
            r'public\s+(?:async\s+)?[\w<>,\?\.\s]+?\s+(\w+)\s*\([^)]*\)\s*\{(.*?)\n\s*\}',
            src, re.S):
        name, body = mm.group(1), mm.group(2)
        sp = re.search(r'E(?:xe|je)cut\w*(?:Stored)?Procedure\w*Async(?:<[^>]+>)?\s*\(\s*"([^"]+)"', body)
        if not sp:
            sp = re.search(r'"(LOGISTICA_\w+|SPRING_\w+|WH_\w+|sp_\w+|SP_\w+)"', body)
        if sp:
            sp_map[name] = sp.group(1)
    # metodos con cuerpo de expresion => Execute...("SP", json);
    for mm in re.finditer(
            r'public\s+(?:async\s+)?[\w<>,\?\.\s]+?\s+(\w+)\s*\([^)]*\)\s*=>\s*(.*?);',
            src, re.S):
        name, body = mm.group(1), mm.group(2)
        sp = re.search(r'E(?:xe|je)cut\w*(?:Stored)?Procedure\w*Async(?:<[^>]+>)?\s*\(\s*"([^"]+)"', body)
        if not sp:
            sp = re.search(r'"(LOGISTICA_\w+|SPRING_\w+|WH_\w+|sp_\w+|SP_\w+)"', body)
        if sp:
            sp_map.setdefault(name, sp.group(1))

# tambien SPs referenciados en cualquier parte del repo (algunos metodos inline)
for fn in sorted(os.listdir(repo_dir)):
    if not fn.endswith(".cs"):
        continue
    src = open(os.path.join(repo_dir, fn), encoding="utf-8", errors="ignore").read()
    for mm in re.finditer(r'ExecuteStoredProcedure\w*Async\(\s*"([^"]+)"', src):
        pass  # ya cubierto

# ---------- 4. SPs: campos JSON ----------
sql_dir = os.path.join(API, "SQL")
sp_info = {}  # nombre sp -> {archivo, params[], json_fields[], openjson[]}
# ordenar archivos para que el ultimo FIX sobrescriba? mejor mergear: guardar todos los archivos
for fn in sorted(os.listdir(sql_dir)):
    if not fn.lower().endswith(".sql"):
        continue
    src = open(os.path.join(sql_dir, fn), encoding="utf-8", errors="ignore").read()
    # bloques CREATE PROCEDURE
    for pm in re.finditer(
            r'CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+(?:\[?dbo\]?\.)?\[?(\w+)\]?(.*?)(?=CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE|\Z)',
            src, re.S | re.I):
        spname, body = pm.group(1), pm.group(2)
        info = sp_info.setdefault(spname, {"archivos": [], "params": set(), "json_fields": {}, "openjson": set(), "json_doc_fields": {}})
        info["archivos"].append(fn)
        # parametros @x tipo
        for p in re.finditer(r'@(\w+)\s+(NVARCHAR\(MAX\)|NVARCHAR\(\d+\)|VARCHAR\(\d+\)|INT|DECIMAL\([^)]*\)|BIT|DATETIME2?|DATE|FLOAT|UNIQUEIDENTIFIER)\b', body[:2500], re.I):
            info["params"].add(f"@{p.group(1)} {p.group(2)}")
        # JSON_VALUE(@json, '$.campo')  -> campo + tipo declarado
        for jm in re.finditer(
                r'@(\w+)\s+([\w\(\),]+)\s*=\s*JSON_VALUE\(\s*@json\s*,\s*\'\$\.([\w\.\[\]\']+)',
                body, re.I):
            var, typ, field = jm.group(1), jm.group(2), jm.group(3)
            field = field.rstrip("'").replace("'", "")
            info["json_fields"][field] = typ
        # JSON_VALUE anidados sin variable: JSON_VALUE(@json, '$.x')
        for jm in re.finditer(r'JSON_VALUE\(\s*@json\s*,\s*\'\$\.([\w\.]+)', body, re.I):
            info["json_fields"].setdefault(jm.group(1), "")
        # OPENJSON(@json) WITH (campo tipo '$.ruta', ...)
        for om in re.finditer(r'OPENJSON\s*\(\s*@json(?:\s*,\s*\'([^\']+)\')?\s*\)\s*WITH\s*\((.*?)\)', body, re.S | re.I):
            root = om.group(1) or ""
            cols = om.group(2)
            for cm in re.finditer(r'(\w+)\s+([\w\(\),]+)\s*(?:\'\$\.([^\']+)\')?', cols):
                f = cm.group(3) or cm.group(1)
                f = f.lstrip(".")
                full = (root.strip("$.") + "." + f) if root else f
                info["openjson"].add(full)
        # OPENJSON(@json, '$.items')  seguido de JSON_VALUE(x.value, ...)
        for om in re.finditer(r'OPENJSON\s*\(\s*@json\s*,\s*\'\$\.(\w+)\'\s*\)', body, re.I):
            info["openjson"].add(om.group(1) + "[]")

# normalizar sets a listas
for k, v in sp_info.items():
    v["params"] = sorted(v["params"])
    v["openjson"] = sorted(v["openjson"])
    v["json_fields"] = dict(sorted(v["json_fields"].items()))

# ---------- 5. Servicios Angular ----------
fe_dir = r"C:\Users\jonathan.marquina\Documents\Jonathan Marquina\proyectos\backup\10.02.26\logistica\src\app"
servicios = []
for root, _, files in os.walk(fe_dir):
    for fn in files:
        if fn.endswith(".service.ts"):
            p = os.path.join(root, fn)
            src = open(p, encoding="utf-8", errors="ignore").read()
            for mm in re.finditer(r'`\$\{this\.baseUrl\}([^`]+)`', src):
                servicios.append({"servicio": fn, "url": mm.group(1)})

result = {
    "controllers": controllers,
    "uc_map": uc_map,
    "uc_file": uc_file,
    "sp_map": sp_map,
    "sp_info": sp_info,
    "servicios": servicios,
}
out = os.path.join(OUT, "api_map.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=1, default=str)

n_ep = sum(len(c["endpoints"]) for c in controllers)
print(f"controllers: {len(controllers)}  endpoints: {n_ep}")
print(f"usecase methods: {len(uc_map)}  repo->SP: {len(sp_map)}  SPs en SQL: {len(sp_info)}")
print("OK", out)
