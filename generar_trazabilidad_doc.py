# -*- coding: utf-8 -*-
"""Genera TRAZABILIDAD_SP_FRONTEND.docx: cadena completa SP <-> frontend por cada SP."""
import os, json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica'
T = json.load(open(os.path.join(BASE,'trazabilidad_sp.json'),encoding='utf-8'))['traza']

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

# portada
for _ in range(6): d.add_paragraph()
t=d.add_paragraph(); t.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=t.add_run('TRAZABILIDAD SP ↔ FRONTEND'); r.bold=True; r.font.size=Pt(28); r.font.color.rgb=RGBColor.from_string('1F4E79')
s2=d.add_paragraph(); s2.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=s2.add_run('Cadena completa: pantalla → servicio → endpoint → use case → repositorio → SP → tablas'); r.font.size=Pt(13); r.font.color.rgb=RGBColor.from_string('2E74B5')
f=d.add_paragraph(); f.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=f.add_run('Suite de Logística — Etapa 1  |  Noviembre 2026'); r.font.size=Pt(10); r.italic=True
d.add_page_break()
d.add_heading('Indice',level=1)
par=d.add_paragraph(); run=par.add_run()
f1=OxmlElement('w:fldChar'); f1.set(qn('w:fldCharType'),'begin')
it=OxmlElement('w:instrText'); it.set(qn('xml:space'),'preserve'); it.text='TOC \\o "1-3" \\h \\z \\u'
f2=OxmlElement('w:fldChar'); f2.set(qn('w:fldCharType'),'separate')
t2=OxmlElement('w:t'); t2.text="Clic derecho -> 'Actualizar campos'."
f3=OxmlElement('w:fldChar'); f3.set(qn('w:fldCharType'),'end')
for e in (f1,it,f2,t2,f3): run._r.append(e)
d.add_page_break()

h1('1. Cómo leer este documento')
p('Para cada stored procedure se muestra la cadena de ejecución de extremo a extremo. '
  'Cuando una celda está vacía significa que el SP se invoca desde otro SP o desde un '
  'proceso interno (cola, job) y no llega directamente al frontend.')
bullets(['Servicio Angular: archivo .service.ts del frontend que llama a la ruta del controller.',
         'Endpoint: verbo y ruta del controller que invoca el use case.',
         'Repo / UC: repositorio que ejecuta el SP y use case que lo orquesta.',
         'Escribe / Lee: tablas que el SP inserta/actualiza/elimina (Escribe) y consulta (Lee), detectadas del cuerpo del SP.'])
n=len(T)
p(f'SPs documentados: {n}.')

# agrupar por modulo
def grupo(n):
    l=n.lower()
    for k,g in [('admin_','Administración (ADMIN_*)'),('spring','SPRING / sincronización'),
                ('aprob','Aprobaciones'),('requerim','Requerimientos'),('consolid','Consolidación'),
                ('cotiz','Cotizaciones'),('ordencompra','OC'),('ordenservicio','OS'),('oc','OC'),('os','OS'),
                ('solicitud','Solicitudes'),('compra','Compras'),('servicio','Servicios'),
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
for sp in T: grp.setdefault(grupo(sp),[]).append(sp)

sec=2
for g in sorted(grp, key=lambda x:(x=='Otros',x)):
    h1(f'{sec}. {g} ({len(grp[g])})'); sec+=1
    for sp in sorted(grp[g]):
        t=T[sp]
        h3(sp)
        info=[]
        if t['svc']:   info.append(['Servicio Angular', ', '.join(t['svc'])])
        if t['route']: info.append(['Ruta API', t['route']])
        if t['ctrl']:  info.append(['Controller', t['ctrl']])
        if t['uc']:    info.append(['Use case', t['uc']])
        if t['repo']:  info.append(['Repositorio', t['repo']])
        info.append(['Script', t['file']])
        if t['w']:     info.append(['Escribe', ', '.join(t['w'])])
        if t['r']:     info.append(['Lee', ', '.join(t['r'])])
        table(['Nivel','Valor'],info,widths=[1.5,5.3],fsize=8)
        if t['endpoints']:
            p('Endpoints: '+', '.join(t['endpoints']),italic=True)
p('— Fin de la Trazabilidad —',italic=True)
d.save(os.path.join(BASE,'TRAZABILIDAD_SP_FRONTEND.docx'))
print('OK trazabilidad doc')
