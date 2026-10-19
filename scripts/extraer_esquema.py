# -*- coding: utf-8 -*-
"""Extrae tablas, columnas y FKs de los scripts SQL del proyecto."""
import os, re, json

SQL_DIRS = [
    r"C:\Users\jonathan.marquina\Documents\Jonathan Marquina\proyectos\backup\10.02.26\api_logistica\SQL",
    r"C:\Users\jonathan.marquina\Documents\Jonathan Marquina\proyectos\backup\10.02.26\logistica\database",
]

TBL_RE = re.compile(
    r"CREATE\s+TABLE\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_][\w]*)\]?\s*\(", re.I)
COL_RE = re.compile(
    r"^\s*\[?([A-Za-z_][\w]*)\]?\s+\[?([A-Za-z]+)\]?\s*(\([^)]*\))?(?:\s+(IDENTITY\s*\([^)]*\)))?",
    re.I)
FK_INLINE_RE = re.compile(
    r"FOREIGN\s+KEY\s*\(([^)]*)\)\s*REFERENCES\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_][\w]*)\]?\s*\(([^)]*)\)",
    re.I)
ALTER_FK_RE = re.compile(
    r"ALTER\s+TABLE\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_][\w]*)\]?.*?FOREIGN\s+KEY\s*\(([^)]*)\)\s*"
    r"REFERENCES\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_][\w]*)\]?\s*\(([^)]*)\)",
    re.I | re.S)
ALTER_ADD_RE = re.compile(
    r"ALTER\s+TABLE\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_][\w]*)\]?\s+ADD\s+([^;]+);",
    re.I | re.S)
STOP_WORDS = {"CONSTRAINT", "PRIMARY", "FOREIGN", "UNIQUE", "CHECK", "INDEX", "GO",
              "CREATE", "ALTER", "WITH", "ON", "ASC", "CLUSTERED", "NONCLUSTERED"}


def file_order(fname):
    m = re.match(r"(\d+)", os.path.basename(fname))
    return int(m.group(1)) if m else 9999


def collect_files():
    files = []
    for d in SQL_DIRS:
        for root, _, fns in os.walk(d):
            for fn in fns:
                if fn.lower().endswith(".sql"):
                    files.append(os.path.join(root, fn))
    return sorted(files, key=file_order)


def parse_columns(block):
    cols = []
    for line in block.split("\n"):
        raw = line
        line = line.strip().rstrip(",")
        if not line or line.startswith("--"):
            continue
        first = line.split()[0].strip("[]").upper() if line.split() else ""
        if first in STOP_WORDS or line.startswith(")"):
            continue
        m = COL_RE.match(line)
        if not m:
            continue
        name = m.group(1)
        if name.upper() in STOP_WORDS:
            continue
        ctype = m.group(2) + (m.group(3) or "")
        if m.group(4):
            ctype += " " + m.group(4)
        flags = []
        if re.search(r"PRIMARY\s+KEY", line, re.I): flags.append("PK")
        if re.search(r"\bIDENTITY\b", line, re.I): flags.append("ID")
        if re.search(r"NOT\s+NULL", line, re.I): flags.append("NOT NULL")
        elif re.search(r"\bNULL\b", line, re.I): flags.append("NULL")
        dm = re.search(r"DEFAULT\s+(\([^)]*\)|'[^']*'|[\w.()-]+)", line, re.I)
        if dm: flags.append("DEFAULT " + dm.group(1))
        cm = re.search(r"--\s*(.+)$", raw)
        note = cm.group(1).strip() if cm else ""
        cols.append({"name": name, "type": ctype, "flags": " ".join(flags), "note": note})
    return cols


def extract_block(text, start_paren):
    depth = 0
    for i in range(start_paren, len(text)):
        if text[i] == "(":
            depth += 1
        elif text[i] == ")":
            depth -= 1
            if depth == 0:
                return text[start_paren + 1:i]
    return text[start_paren + 1:]


def main():
    defs = {}  # tname -> list of (file_order, cols, fks)
    alter_fks = {}  # tname -> list of fk dicts
    for path in collect_files():
        fo = file_order(path)
        try:
            text = open(path, encoding="utf-8", errors="ignore").read()
        except Exception:
            continue
        for m in TBL_RE.finditer(text):
            tname = m.group(1)
            if tname.startswith("#") or tname.upper().endswith("_TEMP"):
                continue
            open_paren = text.find("(", m.end() - 1)
            block = extract_block(text, open_paren)
            cols = parse_columns(block)
            fks = [{"cols": fm.group(1).strip(), "ref": fm.group(2),
                    "refcols": fm.group(3).strip()} for fm in FK_INLINE_RE.finditer(block)]
            defs.setdefault(tname, []).append((fo, cols, fks, os.path.basename(path)))
        for m in ALTER_FK_RE.finditer(text):
            tname = m.group(1)
            alter_fks.setdefault(tname, []).append(
                {"cols": m.group(2).strip(), "ref": m.group(3), "refcols": m.group(4).strip()})

    tables = {}
    for tname, occ in defs.items():
        # mejor definicion = la que tiene mas columnas
        best = max(occ, key=lambda o: len(o[1]))
        cols = list(best[1])
        seen = {c["name"].lower() for c in cols}
        # agregar columnas de otras definiciones que falten
        for fo, ocols, _, _ in sorted(occ, key=lambda o: o[0]):
            for c in ocols:
                if c["name"].lower() not in seen:
                    cols.append(c); seen.add(c["name"].lower())
        fks = list(best[2])
        seen_fk = {(f["cols"], f["ref"]) for f in fks}
        for _, _, ofks, _ in occ:
            for f in ofks:
                if (f["cols"], f["ref"]) not in seen_fk:
                    fks.append(f); seen_fk.add((f["cols"], f["ref"]))
        for f in alter_fks.get(tname, []):
            if (f["cols"], f["ref"]) not in seen_fk:
                fks.append(f); seen_fk.add((f["cols"], f["ref"]))
        tables[tname] = {"cols": cols, "fks": fks, "src": best[3]}
    return tables


if __name__ == "__main__":
    tables = main()
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "doc_output", "schema.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(tables, f, ensure_ascii=False, indent=1)
    empty = [n for n, t in tables.items() if len(t["cols"]) == 0]
    print("tablas:", len(tables))
    print("sin columnas:", len(empty))
    for n in empty:
        print("  -", n)
