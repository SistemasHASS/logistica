# -*- coding: utf-8 -*-
"""Genera CONTRATO_JSON_API.docx: como viaja el JSON frontend -> API -> SP y de vuelta."""
import os, json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica'
T  = json.load(open(os.path.join(BASE,'trazabilidad_sp.json'),encoding='utf-8'))['traza']
CJ = json.load(open(os.path.join(BASE,'contrato_json.json'),encoding='utf-8'))
SPS, DTOS = CJ['sps'], CJ['dtos']

d = Document()
s=d.styles['Normal']; s.font.name='Calibri'; s.font.size=Pt(10.5)
for i,(sz,col) in enumerate([(22,'1F4E79'),(15,'1F4E79'),(12,'2E74B5'),(11,'2E74B5')],start=1):
    h=d.styles[f'Heading {i}']; h.font.name='Calibri'; h.font.size=Pt(sz)
    h.font.bold=True; h.font.color.rgb=RGBColor.from_string(col)
h1=lambda t:d.add_heading(t,level=1); h2=lambda t:d.add_heading(t,level=2); h3=lambda t:d.add_heading(t,level=3)
def p(text='',bold=False,italic=False):
    par=d.add_paragraph(); r=par.add_run(text); r.bold=bold; r.italic=italic; return par
def bullets(items):
    for it in items: d.add_paragraph(it,style='List Bullet')
def numbered(items):
    for it in items: d.add_paragraph(it,style='List Number')
def code(text):
    par=d.add_paragraph(); r=par.add_run(text); r.font.name='Consolas'; r.font.size=Pt(8)
    par.paragraph_format.left_indent=Inches(0.25); return par
def table(headers,rows,widths=None,fsize=8):
    t=d.add_table(rows=1,cols=len(headers)); t.style='Table Grid'
    t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for i,htxt in enumerate(headers):
        r=t.rows[0].cells[i].paragraphs[0].add_run(htxt); r.bold=True; r.font.size=Pt(fsize)
    for row in rows:
        cells=t.add_row().cells
        for i,val in enumerate(row):
            r=cells[i].paragraphs[0].add_run(str(val)); r.font.size=Pt(fsize)
    if widths:
        for i,w in enumerate(widths):
            for row in t.rows: row.cells[i].width=Inches(w)
    d.add_paragraph(); return t
def toc():
    par=d.add_paragraph(); run=par.add_run()
    f1=OxmlElement('w:fldChar'); f1.set(qn('w:fldCharType'),'begin')
    it=OxmlElement('w:instrText'); it.set(qn('xml:space'),'preserve'); it.text='TOC \\o "1-3" \\h \\z \\u'
    f2=OxmlElement('w:fldChar'); f2.set(qn('w:fldCharType'),'separate')
    t2=OxmlElement('w:t'); t2.text="Clic derecho -> 'Actualizar campos'."
    f3=OxmlElement('w:fldChar'); f3.set(qn('w:fldCharType'),'end')
    for e in (f1,it,f2,t2,f3): run._r.append(e)

for _ in range(6): d.add_paragraph()
t=d.add_paragraph(); t.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=t.add_run('CONTRATO JSON: FRONTEND ↔ API ↔ SP'); r.bold=True; r.font.size=Pt(26); r.font.color.rgb=RGBColor.from_string('1F4E79')
s2=d.add_paragraph(); s2.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=s2.add_run('Cómo viajan los JSON de ida y vuelta en cada stored procedure'); r.font.size=Pt(13); r.font.color.rgb=RGBColor.from_string('2E74B5')
f=d.add_paragraph(); f.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=f.add_run('Suite de Logística — Etapa 1  |  Noviembre 2026'); r.font.size=Pt(10); r.italic=True
d.add_page_break(); d.add_heading('Indice',level=1); toc(); d.add_page_break()

h1('1. El patrón JSON de extremo a extremo')
p('La Suite usa JSON como contrato único entre las tres capas. Los SPs no reciben parámetros '
  'sueltos salvo excepciones: reciben UN string JSON (NVARCHAR(MAX)), lo desarman con '
  'OPENJSON/JSON_VALUE y devuelven el resultado con FOR JSON.')
numbered([
 'FRONTEND: el componente arma un objeto TS; el servicio hace http.post(url, objeto). El interceptor agrega el Bearer.',
 'CONTROLLER: recibe el body (tipado [FromBody] Dto o JsonElement/string crudo) y lo pasa al use case.',
 'USE CASE: arma/valida y serializa el payload a un string json.',
 'REPOSITORY: ejecuta el SP con ese string como parámetro (Dapper/SqlCommand, CommandType.StoredProcedure).',
 'SP: lee el JSON con OPENJSON (tablas) y JSON_VALUE/JSON_QUERY (escalares/objetos).',
 'SP devuelve SELECT ... FOR JSON PATH → el repository recibe el string y lo retorna como JsonElement.',
 'El controller lo devuelve tal cual al frontend (passthrough de JSON).',
])
code('''// FRONTEND (servicio)
this.http.post(`${api}/api/logistica/despachos/registrar`, {
  idRequerimiento, lineas: [{ idItem, cantidad, lote }], usuario
});

// CONTROLLER -> USE CASE -> REPOSITORY
public async Task<JsonElement> RegistrarDespacho(string json)
  => await _repo.EjecutarSpJson("LOGISTICA_registrarDespacho", json);
   // Dapper: Command("LOGISTICA_registrarDespacho", json, CommandType.StoredProcedure)

-- SP
CREATE PROCEDURE LOGISTICA_registrarDespacho @json NVARCHAR(MAX) AS
  INSERT INTO ... SELECT * FROM OPENJSON(@json,'$.lineas')
        WITH (idItem INT '$.idItem', cantidad DECIMAL '$.cantidad', lote NVARCHAR '$.lote');
  SELECT ... FOR JSON PATH;   -- respuesta al frontend''')

h1('2. Cobertura del patrón (medida sobre el código)')
bullets([f'{sum(1 for v in SPS.values() if v["json_in"])} de 600 SPs reciben JSON como entrada (parámetro NVARCHAR(MAX) y/o @*json*).',
         f'{sum(1 for v in SPS.values() if v["openjson"])} usan OPENJSON/JSON_VALUE/JSON_QUERY para leer el payload.',
         f'{sum(1 for v in SPS.values() if v["forjson"])} devuelven su resultado con FOR JSON.',
         'Esto explica por qué la API hace passthrough: el SP ya devuelve el JSON final para el frontend.'])

h1('3. Ejemplo real: registrar despacho (salida NS)')
code('''-- Firma (SQL/335_ALTER_SP_REGISTRAR_DESPACHO.sql / 334_...)
@json NVARCHAR(MAX)
-- El JSON trae: cabecera del despacho + array de lineas
{
  "idRequerimiento": 123,
  "usuario": "JPEREZ",
  "lineas": [ { "idItem": "A001", "cantidad": 5, "lote": "L-01" } ]
}
-- Internamente: valida stock -> inserta NS en SPRING -> kardex/stock
-- Devuelve FOR JSON con numero de documento y resultado por linea''')

h1('4. DTOs tipados del API ([FromBody])')
p('La mayoría de endpoints pasan JSON crudo al SP; los siguientes usan modelos tipados.')
for cls,props in sorted(DTOS.items()):
    h3(cls)
    table(['Propiedad','Tipo'],[[n,tp] for tp,n in props],widths=[3.0,2.0],fsize=8.5)

h1('5. Contrato por SP')
p('Para cada SP: si recibe JSON (entrada), si lo desarma (OPENJSON), si devuelve FOR JSON (salida), '
  'parámetros declarados, y la cadena servicio → endpoint → repositorio.')
def grupo(n):
    l=n.lower()
    for k,g in [('admin_','Administración'),('spring','SPRING/sync'),('aprob','Aprobaciones'),
                ('requerim','Requerimientos'),('consolid','Consolidación'),('cotiz','Cotizaciones'),
                ('orden','Órdenes'),('solicitud','Solicitudes'),('compra','Compras'),('servicio','Servicios'),
                ('recepc','Recepción'),('despach','Despachos'),('salida','Despachos'),
                ('kardex','Kardex'),('stock','Stock'),('inventar','Inventario'),
                ('transfer','Transferencias'),('devoluc','Devoluciones'),('reingres','Reingresos'),
                ('conformid','Conformidades'),('usuario','Usuarios'),('perfil','Perfiles'),
                ('area','Áreas'),('flujo','Flujos'),('menu','Menús'),('notif','Notificaciones'),
                ('correo','Correos'),('report','Reportes'),('dashboard','Dashboards'),
                ('maestro','Maestras'),('item','Ítems'),('proveedor','Proveedores'),
                ('login','Autenticación'),('auditor','Auditoría'),('adjunto','Adjuntos'),
                ('config','Configuración'),('param','Parámetros'),('plantilla','Plantillas'),
                ('version','Versionado'),('deploy','Versionado'),('seguim','Seguimiento'),
                ('saldo','Saldos'),('empresa','Empresas'),('limpieza','Mantenimiento'),('backup','Mantenimiento')]:
        if k in l: return g
    return 'Otros'
grp={}
for sp in SPS: grp.setdefault(grupo(sp),[]).append(sp)
sec=6
for g in sorted(grp,key=lambda x:(x=='Otros',x)):
    h1(f'{sec}. {g} ({len(grp[g])})'); sec+=1
    for sp in sorted(grp[g]):
        spc=SPS[sp]; tr=T.get(sp,{})
        h3(sp)
        flags=[]
        flags.append('Entrada JSON' if spc['json_in'] else 'params sueltos')
        flags.append('OPENJSON' if spc['openjson'] else 'sin OPENJSON')
        flags.append('FOR JSON' if spc['forjson'] else 'result set')
        rows=[['Contrato', ' | '.join(flags)]]
        if spc['params']:
            rows.append(['Parámetros', ', '.join(f'@{n} {tp}' for n,tp in spc['params'][:14])])
        if tr.get('svc'):   rows.append(['Servicio Angular',', '.join(tr['svc'])])
        if tr.get('route'): rows.append(['Endpoint',f"{tr['route']}  [{', '.join(tr['endpoints'][:6])}]" if tr.get('endpoints') else tr['route']])
        if tr.get('repo'):  rows.append(['Repo → SP',f"{tr.get('uc','')} → {tr['repo']} → {sp}"])
        if tr.get('w'):     rows.append(['Escribe',', '.join(tr['w'])])
        if tr.get('r'):     rows.append(['Lee',', '.join(tr['r'])])
        table(['Aspecto','Detalle'],rows,widths=[1.4,5.4],fsize=7.5)
p('— Fin del Contrato JSON —',italic=True)
d.save(os.path.join(BASE,'CONTRATO_JSON_API.docx'))
print('OK contrato json')
