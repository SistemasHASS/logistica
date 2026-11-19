# -*- coding: utf-8 -*-
"""
Genera la documentacion complementaria:
  GUIA_DESARROLLO.docx, MATRIZ_PERMISOS.docx, DIAGRAMAS_ARQUITECTURA.docx,
  GLOSARIO.docx, DOCUMENTO_SEGURIDAD.docx, PLAN_CONTINGENCIA.docx,
  CONTRATO_API.docx, HISTORIAL_VERSIONES.docx, ESPECIFICACION_REQUERIMIENTOS.docx,
  SLA_SOPORTE.docx
"""
import os, re, json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mp
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica'
IMG  = os.path.join(BASE, 'docs', 'diagramas_gen')
os.makedirs(IMG, exist_ok=True)
CAT = json.load(open(os.path.join(BASE, 'catalogo_codigo.json'), encoding='utf-8'))

def new_doc():
    d = Document()
    s = d.styles['Normal']; s.font.name='Calibri'; s.font.size=Pt(10.5)
    for i,(sz,col) in enumerate([(22,'1F4E79'),(15,'1F4E79'),(12,'2E74B5'),(11,'2E74B5')],start=1):
        h=d.styles[f'Heading {i}']; h.font.name='Calibri'; h.font.size=Pt(sz)
        h.font.bold=True; h.font.color.rgb=RGBColor.from_string(col)
    return d

def helpers(d):
    h1=lambda t:d.add_heading(t,level=1); h2=lambda t:d.add_heading(t,level=2)
    h3=lambda t:d.add_heading(t,level=3); h4=lambda t:d.add_heading(t,level=4)
    def p(text='',bold=False,italic=False):
        par=d.add_paragraph(); r=par.add_run(text); r.bold=bold; r.italic=italic; return par
    def bullets(items):
        for it in items: d.add_paragraph(it,style='List Bullet')
    def numbered(items):
        for it in items: d.add_paragraph(it,style='List Number')
    def code(text):
        par=d.add_paragraph(); r=par.add_run(text)
        r.font.name='Consolas'; r.font.size=Pt(8.5)
        par.paragraph_format.left_indent=Inches(0.25); return par
    def table(headers,rows,widths=None,fsize=9):
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
    def img(path,caption=''):
        par=d.add_paragraph(); par.alignment=WD_ALIGN_PARAGRAPH.CENTER
        par.add_run().add_picture(path,width=Inches(6.4))
        if caption:
            c=d.add_paragraph(); c.alignment=WD_ALIGN_PARAGRAPH.CENTER
            r=c.add_run(caption); r.font.size=Pt(8.5); r.italic=True
            r.font.color.rgb=RGBColor.from_string('595959')
    def toc():
        par=d.add_paragraph(); run=par.add_run()
        f1=OxmlElement('w:fldChar'); f1.set(qn('w:fldCharType'),'begin')
        it=OxmlElement('w:instrText'); it.set(qn('xml:space'),'preserve')
        it.text='TOC \\o "1-3" \\h \\z \\u'
        f2=OxmlElement('w:fldChar'); f2.set(qn('w:fldCharType'),'separate')
        t2=OxmlElement('w:t'); t2.text="Clic derecho -> 'Actualizar campos' para generar el indice."
        f3=OxmlElement('w:fldChar'); f3.set(qn('w:fldCharType'),'end')
        for e in (f1,it,f2,t2,f3): run._r.append(e)
    def portada(titulo,subtitulo):
        for _ in range(6): d.add_paragraph()
        t=d.add_paragraph(); t.alignment=WD_ALIGN_PARAGRAPH.CENTER
        r=t.add_run(titulo); r.bold=True; r.font.size=Pt(28); r.font.color.rgb=RGBColor.from_string('1F4E79')
        s=d.add_paragraph(); s.alignment=WD_ALIGN_PARAGRAPH.CENTER
        r=s.add_run(subtitulo); r.font.size=Pt(14); r.font.color.rgb=RGBColor.from_string('2E74B5')
        f=d.add_paragraph(); f.alignment=WD_ALIGN_PARAGRAPH.CENTER
        r=f.add_run('Suite de Logistica — Etapa 1  |  Noviembre 2026'); r.font.size=Pt(10); r.italic=True
        d.add_page_break(); d.add_heading('Indice',level=1); toc(); d.add_page_break()
    return h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada

# --------------------------------------------------------------------------
# utilidades para dibujar diagramas
# --------------------------------------------------------------------------
def box(ax,x,y,w,h,text,fc='#DDEBF7',ec='#1F4E79',fs=8):
    ax.add_patch(mp.FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.02,rounding_size=0.08',fc=fc,ec=ec,lw=1.2))
    ax.text(x+w/2,y+h/2,text,ha='center',va='center',fontsize=fs,wrap=True)

def arrow(ax,x1,y1,x2,y2,text='',fs=7):
    ax.annotate('',xy=(x2,y2),xytext=(x1,y1),
                arrowprops=dict(arrowstyle='-|>',color='#2E74B5',lw=1.4))
    if text:
        ax.text((x1+x2)/2,(y1+y2)/2+0.12,text,ha='center',fontsize=fs,color='#1F4E79',style='italic')

def newfig(w=11,h=7):
    fig,ax=plt.subplots(figsize=(w,h)); ax.set_xlim(0,10); ax.set_ylim(0,10); ax.axis('off')
    return fig,ax

def save(fig,name):
    p=os.path.join(IMG,name); fig.savefig(p,dpi=150,bbox_inches='tight',facecolor='white'); plt.close(fig)
    return p

# --- DIAG 1: arquitectura ---
fig,ax=newfig()
box(ax,0.3,6.8,2.2,1.6,'USUARIOS\n(11 roles)',fc='#FCE4D6')
box(ax,0.3,4.0,2.4,1.8,'Portal Angular PWA\n(logistica)\nIndexedDB + SW',fc='#DDEBF7')
box(ax,3.6,4.0,2.4,1.8,'API REST .NET 8\n(api_logistica)\nSwagger + JWT',fc='#DDEBF7')
box(ax,7.0,6.4,2.4,1.5,'SQL Server\nLOGISTICA_*\n(~169 tablas / 600 SPs)',fc='#E2EFDA')
box(ax,7.0,4.0,2.4,1.5,'ERP SPRING\nWH_* / AP_*\n(linked server)',fc='#E2EFDA')
box(ax,3.6,7.2,2.4,1.2,'API MAESTRA\nautenticacion /\nversionado',fc='#FFF2CC')
box(ax,7.0,1.8,2.4,1.2,'SMTP / correo\nproveedores',fc='#FFF2CC')
box(ax,0.3,1.8,2.4,1.2,'admin-login →\n/administracion',fc='#FCE4D6')
box(ax,3.6,1.8,2.4,1.2,'admin-logistica\n(panel propio)',fc='#FCE4D6')
arrow(ax,1.5,6.8,1.5,5.8)
arrow(ax,2.7,4.9,3.6,4.9,'HTTPS/JSON')
arrow(ax,6.0,4.9,7.0,4.9,'SPs → WH_*')
arrow(ax,6.0,5.4,7.0,7.0,'SPs → LOGISTICA_*')
arrow(ax,4.8,5.8,4.8,7.2,'login')
arrow(ax,6.0,4.4,7.0,2.4,'MailKit')
arrow(ax,1.5,4.0,1.5,3.0)
arrow(ax,2.7,2.4,3.6,2.4)
arrow(ax,4.8,3.0,4.8,4.0)
DIAG_ARQ=save(fig,'arquitectura.png')

# --- DIAG 2: flujo compras ---
fig,ax=newfig(12,5)
steps=[('Requerimiento\n(compra)',0),('Aprobacion\nN1/N2',1),('Solicitud de\nCompra',2),
       ('Consolidacion',3),('Cotizacion',4),('OC borrador',5),
       ('Aprobacion OC\npor niveles',6),('PDF + correo\nproveedor',7),('Sync SPRING\nWHPO',8)]
x=0.2
for t,i in steps:
    box(ax,x,5.5,0.95,1.4,t,fc='#DDEBF7',fs=7)
    if i>0: arrow(ax,x-0.15,6.2,x,6.2)
    x+=1.08
box(ax,0.2,2.8,2.6,1.3,'Recepcion OC\n(kardex NI + stock)',fc='#E2EFDA')
box(ax,3.4,2.8,2.6,1.3,'Conformidad\nalmacen',fc='#E2EFDA')
box(ax,6.6,2.8,2.6,1.3,'Devolucion a\nproveedor',fc='#FCE4D6')
arrow(ax,8.6,5.5,1.5,4.1,'')
arrow(ax,2.8,3.45,3.4,3.45)
arrow(ax,3.4,3.2,6.6,3.2,'no conforme')
DIAG_COMPRA=save(fig,'flujo_compras.png')

# --- DIAG 3: aprobacion por niveles ---
fig,ax=newfig(10,5.5)
box(ax,0.3,4.4,1.8,1.3,'OC emitida\nEN_APROBACION',fc='#DDEBF7')
box(ax,2.8,4.4,1.8,1.3,'Nivel 1\nJLOLOGIST',fc='#FFF2CC')
box(ax,5.3,4.4,1.8,1.3,'Nivel 2\nJEMLOGIST',fc='#FFF2CC')
box(ax,7.8,4.4,1.8,1.3,'Nivel 3\nFINANZAS',fc='#FFF2CC')
box(ax,7.8,2.2,1.8,1.3,'Nivel 4\nGERENTE',fc='#FCE4D6')
box(ax,2.8,2.2,1.8,1.3,'APROBADA\n→ envio + sync',fc='#E2EFDA')
box(ax,0.3,2.2,1.8,1.3,'RECHAZADA\n(log + motivo)',fc='#F8CBAD')
arrow(ax,2.1,5.05,2.8,5.05); arrow(ax,4.6,5.05,5.3,5.05)
arrow(ax,7.1,5.05,7.8,5.05); arrow(ax,8.7,4.4,8.7,3.5,'monto alto')
arrow(ax,7.8,2.85,4.6,2.85,'ultimo nivel aprueba')
arrow(ax,0.3,4.4,1.2,3.5,'rechazo en cualquier nivel')
DIAG_NIVELES=save(fig,'aprobacion_niveles.png')

# --- DIAG 4: ER simplificado ---
fig,ax=newfig(11,8)
ents=[('LOGISTICA_\nRequerimientos',0.3,7.8),('LOGISTICA_\nReqCommodity',0.3,5.9),('LOGISTICA_\nSolicitudCompra(Det)',2.9,7.8),
      ('LOGISTICA_\nConsolidacion(Cab/Det)',5.5,7.8),('LOGISTICA_\nCotizacion(Det)',8.1,7.8),
      ('LOGISTICA_\nOrdenCompra(Det)',8.1,5.9),('LOGISTICA_\nRecepcionOC(Det)',5.5,5.9),
      ('LOGISTICA_\nDespachos/Detalle',2.9,5.9),('SPRING_Kardex',5.5,4.0),('SPRING_Stock',8.1,4.0),
      ('LOGISTICA_\nUsuarios/Roles/Areas',0.3,4.0),('WH_OrdenCompra\nWH_OrdenServicio',8.1,1.9)]
for t,x,y in ents: box(ax,x,y,1.9,1.2,t,fc='#DDEBF7',fs=7)
arrow(ax,2.2,8.4,2.9,8.4); arrow(ax,4.8,8.4,5.5,8.4); arrow(ax,7.4,8.4,8.1,8.4)
arrow(ax,9.05,7.8,9.05,7.1); arrow(ax,8.1,6.5,7.4,6.5); arrow(ax,5.5,6.5,4.8,6.5)
arrow(ax,3.85,5.9,5.9,4.9); arrow(ax,7.4,6.0,8.35,5.2); arrow(ax,2.2,4.6,2.9,6.0,'aprobacion')
arrow(ax,9.05,5.9,9.05,3.1,'sync')
DIAG_ER=save(fig,'modelo_er.png')

print('diagramas OK')

# =====================================================================
# 1. GUIA DE DESARROLLO
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada=helpers(d)
portada('GUÍA DE DESARROLLO','Onboarding y convenciones — Suite de Logística')
h1('1. Levantar el proyecto en local')
h2('1.1 Requisitos')
bullets(['Node.js LTS + npm; Angular CLI (npm i -g @angular/cli).',
         '.NET SDK 8; SQL Server accesible (o LOGISTICA_QAS).','VS Code / Visual Studio.'])
h2('1.2 Frontend (carpeta logistica/)')
code("""npm install
ng serve            # http://localhost:4200  (environment.ts apunta a la API local/qas)
ng build            # build de desarrollo
ng build --configuration production   # dist/logistica (PWA)""")
p('El ruteo usa hash (/#/...). El API base se define en src/environments/environment*.ts '
  '(baseUrl, apiMaestra, deployEnvironment, appVersion).')
h2('1.3 Backend (carpeta api_logistica/)')
code("""dotnet restore
dotnet run          # https://localhost:7140 / http://localhost:5213
dotnet publish -c Release -o <salida>""")
bullets(['Cadena de conexión en appsettings.json → ConnectionStrings:DefaultConnection.',
         'Swagger disponible en /swagger.',
         'La lógica vive en SPs: cambios de negocio suelen ser solo SQL (carpeta SQL/).'])
h2('1.4 Estructura de carpetas')
code("""logistica/src/app/
  modules/auth            login, guards, AuthService
  modules/admin-login     login global → /administracion
  modules/admin-logistica panel propio con auth y tabs
  modules/main            layout, pages/* (todas las pantallas), services, guards
  shared/                 Dexie (IndexedDB), componentes comunes, utils
api_logistica/
  Controllers + Infraestructure/Controller
  Domain/{UseCase,Repository,Service,Models}
  Application/UseCaseImpl     Infraestructure/RepositoryImpl|ServiceImpl
  SQL/                      todos los scripts de BD""")
h1('2. Convenciones')
bullets(['Componentes standalone; un componente por carpeta con .component.ts/.html/.scss.',
         'Servicios *.service.ts con inject()/constructor; guards funcionales o clases en guard/|guards/.',
         'Backend: interfaz I<X>UseCase + <X>UseCaseImpl; I<X>Repository + <X>RepositoryImpl; registro Scoped en Program.cs.',
         'SPs: prefijo LOGISTICA_ (o ADMIN_); scripts SQL con prefijo numérico de bloque.',
         'Roles: comparación exacta sobre idrol separado por comas (multi-rol).',
         'Fechas/estados: usar los estados documentados (PENDIENTE/APROBADO/RECHAZADO/ANULADO, estadoSpring).'])
h1('3. Cómo agregar una funcionalidad (checklist)')
numbered(['SQL: crear/alterar tabla y/o SP en SQL/ (seguir numeración).',
          'Backend: Repository + UseCase + Controller + registrar en Program.cs.',
          'Frontend: service con endpoints, page/component, ruta en app.routes.ts con guard.',
          'Menú: alta en menú dinámico/permisos si aplica.',
          'Documentación y casos de prueba.'])
h1('4. Puntos delicados')
bullets(['NO subir credenciales: la cadena de conexión real debe vivir en el servidor (ver DOCUMENTO_SEGURIDAD).',
         'Cambiar la lógica de sync SPRING solo con pruebas en QAS (linked server).',
         'Subir appVersion solo al publicar (controla la actualización de la PWA).'])
p('— Fin Guía de Desarrollo —',italic=True)
d.save(os.path.join(BASE,'GUIA_DESARROLLO.docx')); print('OK guia desarrollo')

# =====================================================================
# 2. MATRIZ DE PERMISOS
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada=helpers(d)
portada('MATRIZ DE PERMISOS','Pantalla × Guard × Rol — Suite de Logística')
h1('1. Guards y roles que habilitan')
p('Extraído del código (role.guard.ts, auth/guard/*.ts, auth.service.ts). '
  'Los roles pueden ser multi-rol separados por comas en idrol.')
table(['Guard','Roles permitidos'],[
 ['AuthGuard','Cualquier usuario con sesión válida'],
 ['ConfigGuard','Exige parámetros configurados (no es de rol)'],
 ['OperativoGuard','OPLOGIST'],
 ['EmpaqueGuard','EMLOGIST'],
 ['OperativoEmpaqueGuard','OPLOGIST, EMLOGIST, ALLOGIST, LOLOGIST'],
 ['OperativoLogisticoGuard','OPLOGIST, LOLOGIST, EMLOGIST, JEMLOGIST, JLOLOGIST, APLOGIST, ADLOGIST, ALLOGIST'],
 ['AlmacenGuard','ALLOGIST, LOLOGIST'],
 ['LogisticoGuard','LOLOGIST, TILOGIST, ADLOGIST, JLOLOGIST'],
 ['AprobadorGuard','APLOGIST, ADLOGIST, JLOLOGIST, GERENTE (+ ámbito/área)'],
 ['AprobadorNivel2Guard','Aprobador de nivel 2 según ámbito (GERENTE u otro N2)'],
 ['AprobadorOCGuard','TILOGIST, ADLOGIST, JLOLOGIST, JEMLOGIST, FINANZAS, GERENTE'],
 ['ConformidadServiciosGuard','TILOGIST, ADLOGIST, JLOLOGIST, JEMLOGIST, LOLOGIST, ALLOGIST, APLOGIST, OPLOGIST, EMLOGIST'],
 ['DevolucionConsumoGuard','TILOGIST, ADLOGIST, JLOLOGIST, ALLOGIST, OPLOGIST, EMLOGIST, LOLOGIST, APLOGIST'],
 ['ReingresoGuard','APLOGIST, ALLOGIST, ADLOGIST, OPLOGIST, EMLOGIST, LOLOGIST'],
 ['AdministradorGuard','TILOGIST, ADLOGIST'],
 ['AdministradorOAlmacenGuard','TILOGIST, ADLOGIST, ALLOGIST, LOLOGIST'],
 ['SistemasGuard','TILOGIST'],
 ['AdminGuard','Sesión de admin-login (ADMIN_TOKEN)'],
 ['AdminLogisticaAuthGuard','Sesión admin-logistica (TILOGIST/ADLOGIST/JLOLOGIST)'],
],widths=[2.2,4.8],fsize=8.5)

h1('2. Matriz pantalla × rol')
p('V = acceso permitido por guard. Un usuario multi-rol suma accesos.')
ROLES=['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','LOLOGIST','EMLOGIST','ALLOGIST','OPLOGIST','APLOGIST','FINANZAS','GERENTE']
G_ROLES={
 'OperativoEmpaqueGuard':{'OPLOGIST','EMLOGIST','ALLOGIST','LOLOGIST'},
 'OperativoLogisticoGuard':{'OPLOGIST','LOLOGIST','EMLOGIST','JEMLOGIST','JLOLOGIST','APLOGIST','ADLOGIST','ALLOGIST'},
 'AlmacenGuard':{'ALLOGIST','LOLOGIST'},
 'LogisticoGuard':{'LOLOGIST','TILOGIST','ADLOGIST','JLOLOGIST'},
 'AprobadorGuard':{'APLOGIST','ADLOGIST','JLOLOGIST','GERENTE'},
 'AprobadorNivel2Guard':{'GERENTE'},
 'AprobadorOCGuard':{'TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','FINANZAS','GERENTE'},
 'ConformidadServiciosGuard':{'TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','LOLOGIST','ALLOGIST','APLOGIST','OPLOGIST','EMLOGIST'},
 'DevolucionConsumoGuard':{'TILOGIST','ADLOGIST','JLOLOGIST','ALLOGIST','OPLOGIST','EMLOGIST','LOLOGIST','APLOGIST'},
 'ReingresoGuard':{'APLOGIST','ALLOGIST','ADLOGIST','OPLOGIST','EMLOGIST','LOLOGIST'},
 'AdministradorGuard':{'TILOGIST','ADLOGIST'},
 'AdministradorOAlmacenGuard':{'TILOGIST','ADLOGIST','ALLOGIST','LOLOGIST'},
 'AuthGuard':set(ROLES),
}
RUTAS=[
 ('parametros','OperativoEmpaqueGuard'),('requerimientos','OperativoEmpaqueGuard'),
 ('notificaciones','OperativoEmpaqueGuard'),('dashboard-oplogist','OperativoLogisticoGuard'),
 ('seguimiento-req-compra','OperativoLogisticoGuard'),('analisis-req-compra','OperativoLogisticoGuard'),
 ('seguimiento-req-consumo','OperativoLogisticoGuard'),
 ('solicitudes-compra','LogisticoGuard'),('consolidacion-requerimientos','LogisticoGuard'),
 ('consolidacion-compras','LogisticoGuard'),('consolidacion-compra','LogisticoGuard'),
 ('consolidacion-corporativa','LogisticoGuard'),('cotizaciones','LogisticoGuard'),
 ('ordenes-compra','LogisticoGuard'),('solicitudes-servicio','LogisticoGuard'),
 ('ordenes-servicio','LogisticoGuard'),('consolidacion-servicios','LogisticoGuard'),
 ('reportes-compras','LogisticoGuard'),('dashboard-logistica','LogisticoGuard'),
 ('dashboard-compras','LogisticoGuard'),('dashboard-jlologist','LogisticoGuard'),
 ('dashboard-jemlogist','LogisticoGuard'),
 ('despachos','AlmacenGuard'),('despachos-original','AlmacenGuard'),
 ('recepcion-mercaderia','AlmacenGuard'),('devoluciones-proveedores','AlmacenGuard'),
 ('gestion-inventario','AlmacenGuard'),('kardex','AlmacenGuard'),('listas-stock','AlmacenGuard'),
 ('transferencias-almacen','AlmacenGuard'),('reporte-saldos','AlmacenGuard'),
 ('reporte-despachos','AlmacenGuard'),('dashboard-despacho','AlmacenGuard'),
 ('evaluacion-proveedores','AlmacenGuard'),
 ('devoluciones-consumo','DevolucionConsumoGuard'),('conformidad-almacen','DevolucionConsumoGuard'),
 ('reingresos','ReingresoGuard'),
 ('aprobaciones','AprobadorGuard'),('aprobaciones-area','AprobadorGuard'),
 ('dashboard-aprobaciones-area','AprobadorGuard'),('dashboard-gerencia','AprobadorGuard'),
 ('reporte-aprobaciones-area','AprobadorGuard'),('reporte-aprobados','AprobadorGuard'),
 ('aprobaciones-gerencia','AprobadorNivel2Guard'),
 ('aprobaciones-oc','AprobadorOCGuard'),('aprobaciones-os','AprobadorOCGuard'),
 ('dashboard-finanzas','AprobadorOCGuard'),
 ('conformidad-servicios','ConformidadServiciosGuard'),
 ('maestros (items/comodities/UM)','AdministradorGuard'),('aprobadores','AdministradorGuard'),
 ('dashboard-adlogist','AdministradorGuard'),('dashboard-tilogist','AdministradorGuard'),
 ('maestro-proveedores','AdministradorOAlmacenGuard'),
 ('reporte_logistico','AuthGuard'),('reporte-requerimientos','AuthGuard'),('catalogo-items','AuthGuard'),
]
hdr=['Pantalla (/main/…)']+ROLES
rows=[]
for ruta,g in RUTAS:
    perm=G_ROLES[g]
    rows.append([ruta]+['V' if r in perm else '—' for r in ROLES])
table(hdr,rows,fsize=7)
h1('3. Paneles de administración')
table(['Panel','Acceso'],[
 ['/administracion (admin-login)','Solo con ADMIN_TOKEN (TILOGIST)'],
 ['/admin-logistica','TILOGIST, ADLOGIST, JLOLOGIST (menú filtrado por permisos por rol)'],
],widths=[2.5,4.5])
p('— Fin de la Matriz de Permisos —',italic=True)
d.save(os.path.join(BASE,'MATRIZ_PERMISOS.docx')); print('OK matriz')

# =====================================================================
# 3. DIAGRAMAS
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada=helpers(d)
portada('DIAGRAMAS DE ARQUITECTURA Y FLUJOS','Suite de Logística — Etapa 1')
h1('1. Arquitectura de componentes')
img(DIAG_ARQ,'Usuarios → PWA → API .NET → SQL Server/SPRING; API Maestra, SMTP y paneles admin.')
bullets(['El frontend es una PWA Angular; toda la lógica de negocio vive en SPs.',
         'La API Maestra autentica y controla versionado; SPRING recibe la integración por linked server.',
         'Dos paneles admin: /administracion (admin-login) y /admin-logistica (login propio).'])
h1('2. Flujo del ciclo de compras')
img(DIAG_COMPRA,'De requerimiento aprobado a OC en SPRING, recepción y conformidad.')
h1('3. Aprobación de OC por niveles')
img(DIAG_NIVELES,'La OC avanza por niveles según monto; un rechazo en cualquier nivel la cierra.')
h1('4. Modelo de datos (simplificado)')
img(DIAG_ER,'Tablas principales del flujo requerimiento→compra→recepción→kardex.')
h1('5. Secuencia: despacho con salida NS')
numbered(['ALLOGIST abre el requerimiento APROBADO en Despachos.',
          'API: controller → use case → repository → SP LOGISTICA_generarSalidaNSWH_JSON.',
          'El SP inserta la transacción NS en SPRING, descuenta stock y registra kardex.',
          'Lo no atendido queda en saldo pendiente; al llegar stock se notifica al solicitante.'])
h1('6. Secuencia: login')
numbered(['Login → API Maestra (valida credencial ERP).',
          'Fallback /auth/login-rol para usuarios de lista blanca.',
          'listar-roles-efectivos suma roles del perfil al rol ERP.',
          'Sesión en IndexedDB; interceptor adjunta Bearer; redirect por rol.'])
p('— Fin de Diagramas —',italic=True)
d.save(os.path.join(BASE,'DIAGRAMAS_ARQUITECTURA.docx')); print('OK diagramas')

# =====================================================================
# 4. GLOSARIO
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada=helpers(d)
portada('GLOSARIO','Términos del negocio y del sistema')
h1('1. Documentos y procesos')
table(['Término','Significado'],[
 ['Requerimiento','Pedido interno de bienes/servicios; tipos de línea: ítem, commodity, activo fijo, activo menor.'],
 ['SC (Solicitud de Compra)','Documento que agrupa requerimientos de compra aprobados para iniciar el proceso.'],
 ['SS (Solicitud de Servicio)','Equivalente para servicios.'],
 ['Consolidación','Agrupar líneas aprobadas de varios requerimientos para comprar en conjunto.'],
 ['Cotización','Precio/condiciones registrados por proveedor para una solicitud.'],
 ['OC (Orden de Compra)','Pedido formal a proveedor; aprobación por niveles según monto; se envía por PDF/correo y sincroniza a SPRING.'],
 ['OS (Orden de Servicio)','Pedido formal de servicio; individual o consolidada.'],
 ['Recepción OC','Ingreso de mercadería contra una OC; suma stock y registra kardex.'],
 ['Conformidad (almacén/servicio)','Aceptación/calificación de lo recibido o ejecutado; no conforme habilita devolución.'],
 ['Despacho / Salida NS','Entrega de ítems aprobados; genera transacción NS en SPRING y descuenta stock.'],
 ['Saldo pendiente','Parte de un requerimiento no atendida por falta de stock; se notifica al llegar stock.'],
 ['Reingreso','Devolución de un ítem al stock (retorno de consumo, reingreso).'],
 ['Transferencia','Movimiento de stock entre almacenes (incluye almacén virtual).'],
 ['Kardex','Historial de movimientos de entrada/salida por ítem/almacén.'],
 ['Lista de stock','Control de niveles con límites y alertas de stock mínimo.'],
 ['AFE','Autorización de gasto / proyecto al que se imputa la compra.'],
 ['CECO','Centro de costo.'],
],widths=[1.9,5.1])
h1('2. Organización y configuración')
table(['Término','Significado'],[
 ['Rol','Código de función del usuario (idrol); puede ser multi-rol separado por comas.'],
 ['Perfil','Conjunto de roles que se suman como "roles efectivos".'],
 ['Ámbito organizacional','Regla que define qué documentos ve/aprueba un usuario (área, subárea, monto).'],
 ['Aprobador N1 / N2','Nivel 1: jefe de área. Nivel 2: gerencia u otro nivel superior.'],
 ['Flujo por niveles','Cadena de aprobación de OC/OS según rangos de monto (JLOLOGIST→JEMLOGIST→FINANZAS→GERENTE).'],
 ['Auto-aprobación','Regla configurada para aprobar automáticamente bajo condiciones.'],
 ['Área / Subárea','Estructura organizativa para enrutar aprobaciones y reportes.'],
 ['Almacén virtual','Almacén lógico para transferencias o control especial.'],
 ['Commodity','Bien/servicio no catalogado como ítem (compra por descripción).'],
],widths=[1.9,5.1])
h1('3. Técnico')
table(['Término','Significado'],[
 ['SPRING','ERP corporativo; recibe requisiciones, OCs, OSs, NSs, recepciones (tablas WH_*/AP_*).'],
 ['API Maestra','Servicio corporativo de autenticación y versionado.'],
 ['PWA','La app web instalable; funciona parcialmente offline con datos locales.'],
 ['IndexedDB / Dexie','Base local del navegador para maestras, parámetros y sesión.'],
 ['Service Worker (ngsw)','Cacheo y actualización automática de la app.'],
 ['estadoSpring','Estado de sincronización: PENDIENTE_SYNC / SYNCHRONIZED / ERROR_SYNC.'],
 ['Guard','Control de acceso por rol en una ruta Angular.'],
 ['SP','Stored Procedure — la lógica de negocio reside en ~600 SPs.'],
 ['ADMIN_TOKEN / admin_logistica_token','Tokens de sesión de los paneles de administración.'],
],widths=[1.9,5.1])
h1('4. Roles')
table(['Código','Rol'],[
 ['TILOGIST','TI / Admin Sistema'], ['ADLOGIST','Admin Logística'], ['JLOLOGIST','Jefe Logística'],
 ['JEMLOGIST','Jefe Licitaciones'], ['LOLOGIST','Operador Logística'], ['EMLOGIST','Operador Licitaciones/Empaque'],
 ['ALLOGIST','Almacén'], ['OPLOGIST','Operativo de campo'], ['APLOGIST','Aprobador de área'],
 ['FINANZAS','Finanzas'], ['GERENTE','Gerencia (N2)'],
],widths=[1.5,5.5])
p('— Fin del Glosario —',italic=True)
d.save(os.path.join(BASE,'GLOSARIO.docx')); print('OK glosario')

# =====================================================================
# 5. SEGURIDAD
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada=helpers(d)
portada('DOCUMENTO DE SEGURIDAD','Suite de Logística — Etapa 1')
h1('1. Autenticación y sesiones')
table(['Aspecto','Implementación'],[
 ['Login principal','API Maestra; fallback /api/logistica/auth/login-rol para lista blanca.'],
 ['Roles','idrol multi-rol (coma); roles efectivos desde perfiles.'],
 ['Token','JWT/sesión; interceptor HTTP agrega Bearer; expiración ~8h.'],
 ['Almacenamiento','Sesión principal en IndexedDB (LogisticaDB); admin-login y admin-logistica en localStorage.'],
 ['admin-login','/api/logistica/admin-login → ADMIN_TOKEN.'],
 ['admin-logistica','/admin-logistica/auth/login → admin_logistica_token.'],
],widths=[2.0,5.0])
h1('2. Autorización')
bullets(['Frontend: guards por rol en cada ruta + menú dinámico por permisos.',
         'Backend: endpoints bajo /api/logistica/*; control por rol/ámbito en lógica.',
         'Ámbitos organizacionales restringen visibilidad de documentos (aprobaciones/reportes).',
         'Permisos por rol del panel admin-logistica (LOGISTICA_ConfigPermisos).'])
h1('3. Comunicaciones')
bullets(['Todo el tráfico por HTTPS (puertos dedicados).','CORS AllowAll habilitado — evaluar restringir a dominios conocidos.',
         'API detrás de IIS; swagger habilitado — considerar restringirlo en producción.'])
h1('4. Datos sensibles y secretos')
table(['Elemento','Estado actual','Recomendación'],[
 ['Connection string SQL','En appsettings.json del proyecto','Sacar a variables de entorno / IIS settings o user-secrets; rotar la clave expuesta.'],
 ['ADMIN_TOKEN / tokens','localStorage/IndexedDB','Cerrar sesión al terminar; revisar expiración.'],
 ['Correos SMTP','ConfigSmtp por empresa','Usar cuenta de servicio con mínimos permisos.'],
 ['Logs/auditoría','LOGISTICA_Auditoria, logs de aprobaciones','Revisión periódica; no loguear claves.'],
],widths=[1.8,2.6,2.6],fsize=8.5)
h1('5. Auditoría')
bullets(['LOGISTICA_Auditoria: acciones del panel admin-logistica.',
         'LOGISTICA_LogAprobaciones(+OC/OS/PorArea/SC): decisiones con usuario y fecha.',
         'LOGISTICA_HistorialAnulaciones: anulaciones con motivo.',
         'LOGISTICA_OCIncrementoLog y ConfigIncrementoOCAuditoria: cambios de cantidad en OC emitidas.'])
h1('6. Recomendaciones')
numbered(['Rotar la contraseña SQL expuesta en el repo y mover secretos fuera del código.',
          'Restringir CORS a los dominios del portal.',
          'Evaluar deshabilitar Swagger en producción o protegerlo.',
          'Política de contraseñas heredada del ERP corporativo.',
          'Revisar permisos por rol periódicamente (matriz de permisos).'])
p('— Fin del Documento de Seguridad —',italic=True)
d.save(os.path.join(BASE,'DOCUMENTO_SEGURIDAD.docx')); print('OK seguridad')

# =====================================================================
# 6. PLAN DE CONTINGENCIA
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada=helpers(d)
portada('PLAN DE CONTINGENCIA','Continuidad operativa — Suite de Logística')
h1('1. Escenarios y respuesta')
table(['Escenario','Impacto','Respuesta'],[
 ['API logística caída','No se puede operar','Revisar sitio IIS/app pool, eventos; levantar; si persiste rollback al build anterior.'],
 ['Portal web caído','Usuarios sin acceso','Verificar sitio IIS, web.config, certificado; servir build anterior.'],
 ['BD LOGISTICA caída','Sistema detenido','DBA restaura desde backup; comunicar ventana.'],
 ['Linked server SPRING caído','No sincroniza pero se opera en diferido','Documentos quedan PENDIENTE_SYNC; al volver, procesar cola y reintentos.'],
 ['API Maestra caída','No hay login nuevo','Sesiones vigentes siguen; activar contingencia de login-rol si aplica.'],
 ['SMTP caído','OC no llega por correo','Reenviar manualmente; corregir config; revisar CorreoLog.'],
 ['Error masivo tras despliegue','Regresión','Rollback frontend+API; registrar versión previa en AppDeployments.'],
],widths=[1.8,1.6,3.6],fsize=8.5)
h1('2. Operación degradada (SPRING no disponible)')
bullets(['Requerimientos y aprobaciones siguen funcionando (se encolan).',
         'Despachos/recepciones generan pendientes; al restaurar, ejecutar procesar-cola-spring y LOGISTICA_reintentarSyncSpring.',
         'Comunicar a usuarios que los documentos pueden demorar en reflejarse en el ERP.'])
h1('3. Respaldos')
bullets(['BD: backup programado de LOGISTICA (diario recomendado).',
         'Frontend: conservar dist/ por versión. API: conservar carpeta publish por versión.',
         'SQL: versionar scripts ejecutados por release (ver HISTORIAL_VERSIONES).',
         'Limpieza de respaldos de datos: LOGISTICA_LimpiezaBackups / mantenimiento.'])
h1('4. Contactos y escalación')
table(['Nivel','Responsable','Cuándo'],[
 ['N1 soporte usuarios','Mesa de ayuda','Acceso, navegación, consultas.'],
 ['N2 funcional/admin','Admin logística / TI','Permisos, flujos, reintentos, correos.'],
 ['N3 infra/desarrollo','DBA / desarrollo','SPs, linked server, bugs, despliegues.'],
],widths=[2.0,2.2,2.8])
p('— Fin del Plan de Contingencia —',italic=True)
d.save(os.path.join(BASE,'PLAN_CONTINGENCIA.docx')); print('OK contingencia')

# =====================================================================
# 7. CONTRATO DE API
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada=helpers(d)
portada('CONTRATO DE API','Endpoints REST — api_logistica')
h1('1. Convenciones')
bullets(['Base: https://<host-api>/api/logistica/…  (ver controllers por ruta).',
         'Autenticación Bearer (excepto login).','JSON request/response.',
         'Manejo de errores: 400 validación, 401 sin sesión, 500 error SP/servidor.',
         'Las operaciones mutantes son idempotentes por id de documento.'])
h1('2. Endpoints por controlador')
for b in [x for x in CAT['back'] if x['kind']=='controller']:
    h3(b['clase'].replace('Controller',''))
    route=b.get('route','')
    p(f"Ruta base: {route or 'api/…'}",italic=True)
    rows=[[m[0].replace('Http',''), m[1] or '(acción del método)'] for m in b['endpoints']] or [['—','(sin rutas explícitas)']]
    table(['Verbo','Ruta'],rows,widths=[1.0,5.6],fsize=8)
h1('3. Autenticación')
table(['Endpoint','Descripción'],[
 ['POST /api/logistica/auth/login-rol','Login por rol (fallback a API Maestra).'],
 ['POST /api/logistica/admin-login','Login del panel /administracion (body: array usuario/clave).'],
 ['POST /api/logistica/admin-logistica/auth/login','Login del panel admin-logistica.'],
 ['GET /api/logistica/listar-roles-efectivos','Roles efectivos por perfil.'],
],widths=[3.2,3.8])
p('— Fin del Contrato de API —',italic=True)
d.save(os.path.join(BASE,'CONTRATO_API.docx')); print('OK contrato')

# =====================================================================
# 8. HISTORIAL DE VERSIONES
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada=helpers(d)
portada('HISTORIAL DE VERSIONES','Release notes — Suite de Logística')
h1('1. Convención')
bullets(['appVersion controla la actualización de la PWA (AppDeployments por ambiente).',
         'Cada release: versión, fecha, ambiente, cambios, scripts SQL ejecutados, responsable.'])
h1('2. Registro de releases')
table(['Versión','Fecha','Ambiente','Cambios','Scripts SQL','Responsable'],[
 ['7.0.1','—','Producción','Etapa 1 — salida a producción','Scripts etapa 1','—'],
 ['7.0.2','__/__/____','—','','',''],
 ['7.0.3','__/__/____','—','','',''],
 ['7.1.0','__/__/____','—','','',''],
],widths=[0.8,0.9,1.0,2.4,1.4,0.9],fsize=8.5)
h1('3. Plantilla de nota de release')
code("""Versión: X.Y.Z        Fecha: __/__/____        Ambiente: QAS / PROD
Cambios funcionales:   - …
Correcciones:          - …
Scripts SQL ejecutados: - <archivo>.sql
Tablas/SPs afectados:  - …
Rollback: build/carpeta previa + versión anterior en AppDeployments
Responsable: ___________""")
p('— Fin del Historial de Versiones —',italic=True)
d.save(os.path.join(BASE,'HISTORIAL_VERSIONES.docx')); print('OK versiones')

# =====================================================================
# 9. ESPECIFICACION DE REQUERIMIENTOS (trazabilidad)
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada=helpers(d)
portada('ESPECIFICACIÓN DE REQUERIMIENTOS','Trazabilidad requerimiento → implementación')
h1('1. Alcance')
p('Trazabilidad de la Etapa 1: cada requerimiento funcional y dónde se implementó. '
  'IDs RF-## (funcional), RNF-## (no funcional).')
RF=[
 ('RF-01','Autenticación por rol con API Maestra y roles efectivos','auth.service, AuthGuard, /auth/*'),
 ('RF-02','Parámetros por usuario','parametros.page, IndexedDB'),
 ('RF-03','Requerimientos ítem/commodity/AF/AM con adjuntos','requerimientos/*, api/logistica (req*), SPs req'),
 ('RF-04','Validación de stock en línea','modal-stock-validacion, SPs stock'),
 ('RF-05','Aprobación N1 área y N2 gerencia + anulación','aprobaciones*, SPs aprobar*, HistorialAnulaciones'),
 ('RF-06','Motor de aprobación por ámbitos/niveles y autoaprobación','config-flujo-aprobacion, SPs *Ambito*'),
 ('RF-07','Solicitud de compra y aprobación SC','solicitudes-compra, aprobaciones-sc, SPs SC'),
 ('RF-08','Consolidación (reqs, compras, servicios, corporativa)','consolidacion-*, SPs consolid*'),
 ('RF-09','Cotizaciones multi-proveedor','cotizaciones, SPs cotiz*'),
 ('RF-10','OC: emisión, aprobación por niveles, PDF+correo, sync SPRING','ordenes-compra, aprobaciones-oc, SPs OC + MailKit'),
 ('RF-11','Incremento de cantidad en OC emitida','incremento-oc, OCIncrementoLog'),
 ('RF-12','SS/OS y conformidad de servicio','solicitudes/ordenes-servicio, conformidad-servicios'),
 ('RF-13','Despachos con salida NS y saldos','despachos, SPs generarSalidaNSWH'),
 ('RF-14','Recepción OC y conformidad almacén','recepcion-mercaderia, conformidad-almacen'),
 ('RF-15','Kardex, stock, inventario, listas de stock','kardex, gestion-inventario, listas-stock'),
 ('RF-16','Transferencias, devoluciones, reingresos','transferencias, devoluciones-*, reingresos'),
 ('RF-17','Maestros (ítems, commodities, UM, proveedores)','maestros/*, maestro-proveedores'),
 ('RF-18','Notificaciones y dashboards por rol','notificaciones, dashboard-*'),
 ('RF-19','Reportes','reporte*, reportes-*'),
 ('RF-20','Admin global /administracion','administracion/pages/*'),
 ('RF-21','Panel admin-logistica con 17 configuraciones','admin-logistica/*'),
 ('RNF-01','PWA offline + actualización automática','ngsw, AppDeployments'),
 ('RNF-02','Multiempresa (RUC) y branding','ConfigEmpresa, branding'),
 ('RNF-03','Auditoría de acciones','LOGISTICA_Auditoria + logs'),
 ('RNF-04','Integración SPRING idempotente con reintentos','estadoSpring, cola, reintentarSyncSpring'),
 ('RNF-05','Seguridad por rol/ámbito','guards, ConfigPermisos, ámbitos'),
]
table(['ID','Requerimiento','Implementado en'],RF,widths=[0.7,3.3,3.0],fsize=8.5)
p('— Fin de la Especificación —',italic=True)
d.save(os.path.join(BASE,'ESPECIFICACION_REQUERIMIENTOS.docx')); print('OK SRS')

# =====================================================================
# 10. SLA DE SOPORTE
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,img,portada=helpers(d)
portada('ACUERDO DE NIVEL DE SERVICIO','SLA de soporte — Suite de Logística')
h1('1. Severidades')
table(['Severidad','Definición','Ejemplos'],[
 ['S1 — Crítica','Sistema inoperativo o proceso clave detenido','API caída, no se puede despachar ni aprobar, BD caída.'],
 ['S2 — Alta','Función importante degradada con workaround','Sync SPRING falla pero se puede operar en diferido; correos no salen.'],
 ['S3 — Media','Función afectada con alternativa','Reporte no carga, permiso mal asignado a un usuario.'],
 ['S4 — Baja','Consulta, configuración o mejora','Dudas de uso, alta de usuario, cambio de plantilla.'],
],widths=[1.3,2.4,3.3])
h1('2. Tiempos objetivo')
table(['Severidad','Respuesta','Atención/Workaround','Resolución objetivo'],[
 ['S1','≤ 30 min','≤ 2 h','≤ 8 h hábiles'],
 ['S2','≤ 2 h','≤ 8 h','≤ 2 días'],
 ['S3','≤ 8 h','—','≤ 5 días'],
 ['S4','≤ 1 día','—','Planificado'],
],widths=[1.0,1.2,1.6,1.6])
h1('3. Alcance y horario')
bullets(['Horario de soporte: días hábiles 8:00–18:00 (ajustar según operación).',
         'Cobertura: portal, API, BD de logística e integración SPRING dentro del alcance.',
         'Excluye: problemas del ERP SPRING en sí, red del usuario, credenciales corporativas.'])
h1('4. Canales y escalación')
table(['Nivel','Responsable','Medio'],[
 ['N1','Mesa de ayuda','Ticket/correo'],
 ['N2','Admin logística / TI','Escalación de ticket'],
 ['N3','DBA / desarrollo','Escalación interna'],
],widths=[1.0,2.4,2.6])
h1('5. Indicadores')
bullets(['% incidentes resueltos dentro del SLA por severidad.',
         'Tiempo medio de resolución (MTTR).',
         'Incidencias recurrentes → problema raíz documentado en el runbook.'])
p('— Fin del SLA —',italic=True)
d.save(os.path.join(BASE,'SLA_SOPORTE.docx')); print('OK SLA')
