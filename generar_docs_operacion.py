# -*- coding: utf-8 -*-
"""
Genera documentacion final:
  1. RUNBOOK_SOPORTE.docx
  2. DOCUMENTO_ALCANCE_ETAPA1.docx
  3. CASOS_PRUEBA.docx
  4. CATALOGO_STORED_PROCEDURES.docx
  5. DOCUMENTACION_CODIGO_FRONTEND.docx
  6. DOCUMENTACION_CODIGO_BACKEND.docx
"""
import os, re, json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica'
SQLDIR = r'C:\Users\jonathan.marquina\Documents\Proyectos\api_logistica\SQL'
CAT = json.load(open(os.path.join(BASE, 'catalogo_codigo.json'), encoding='utf-8'))

def new_doc():
    d = Document()
    s = d.styles['Normal']; s.font.name = 'Calibri'; s.font.size = Pt(10.5)
    for i, (sz, col) in enumerate([(22,'1F4E79'),(15,'1F4E79'),(12,'2E74B5'),(11,'2E74B5')], start=1):
        h = d.styles[f'Heading {i}']
        h.font.name='Calibri'; h.font.size=Pt(sz); h.font.bold=True
        h.font.color.rgb=RGBColor.from_string(col)
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
    return h1,h2,h3,h4,p,bullets,numbered,code,table,portada

# ---------- mapa SP -> archivo SQL ----------
sp_file = {}
for root,_,files in os.walk(SQLDIR):
    for f in files:
        if not f.lower().endswith('.sql'): continue
        try: src=open(os.path.join(root,f),encoding='utf-8',errors='replace').read()
        except Exception: continue
        for m in re.finditer(r'CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+(?:\[?dbo\]?\.)?\[?([A-Za-z_0-9]+)\]?', src, re.I):
            sp_file.setdefault(m.group(1).lower(), f)
# mapa SP -> repositorios que lo llaman
sp_repo = {}
for b in CAT['back']:
    for sp in b.get('sps',[]):
        sp_repo.setdefault(sp.lower(), set()).add(b['clase'])

def sp_grupo(n):
    l=n.lower()
    for k,g in [('spring','SPRING / ERP'),('sync','Sincronización'),('aprob','Aprobaciones'),
                ('requerim','Requerimientos'),('consolid','Consolidación'),('cotiz','Cotizaciones'),
                ('orden','Órdenes OC/OS'),('compra','Compras'),('servicio','Servicios'),
                ('recepc','Recepción'),('despach','Despachos'),('salida','Despachos'),
                ('kardex','Kardex'),('stock','Stock'),('inventar','Inventario'),
                ('transfer','Transferencias'),('devoluc','Devoluciones'),('reingres','Reingresos'),
                ('conformid','Conformidades'),('admin','Administración'),('usuario','Usuarios'),
                ('perfil','Perfiles'),('area','Áreas'),('flujo','Flujos'),('menu','Menús'),
                ('notif','Notificaciones'),('correo','Correos'),('report','Reportes'),
                ('dashboard','Dashboards'),('maestro','Maestras'),('item','Ítems'),
                ('proveedor','Proveedores'),('login','Autenticación'),('auditor','Auditoría'),
                ('adjunto','Adjuntos'),('config','Configuración'),('param','Parámetros'),
                ('plantilla','Plantillas'),('version','Versionado'),('deploy','Versionado'),
                ('seguim','Seguimiento'),('saldo','Saldos'),('empresa','Empresas'),
                ('limpieza','Mantenimiento'),('backup','Mantenimiento')]:
        if k in l: return g
    return 'Otros'

# =====================================================================
# DOC A — RUNBOOK DE SOPORTE
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,portada=helpers(d)
portada('RUNBOOK DE SOPORTE','Operación N1/N2 — Suite de Logística')

h1('1. Propósito y niveles de soporte')
p('Guía para el equipo de soporte: diagnóstico y resolución de incidentes comunes, '
  'procedimientos de reproceso y criterios de escalación a desarrollo.')
table(['Nivel','Quién','Qué resuelve'],[
    ['N1 — Mesa de ayuda','Soporte usuarios','Acceso, navegación, configuración de parámetros, consultas de estado.'],
    ['N2 — Soporte funcional/TI','Administrador logística','Permisos, usuarios, flujos, reintentos de sincronización, correos.'],
    ['N3 — Desarrollo/DBA','Equipo TI','Errores de SP, linked server SPRING, bugs, despliegues.'],
])

h1('2. Incidentes frecuentes por módulo')
h2('2.1 Acceso y autenticación')
table(['Síntoma','Causa probable','Acción'],[
    ['"Usuario o clave incorrecta"','Credenciales ERP inválidas','Verificar en el ERP; la clave es la corporativa.'],
    ['Login ok pero "sin permisos"','Usuario sin rol/perfil de logística','N2: asignar rol o perfil en /administracion → Usuarios/Perfiles.'],
    ['Sesión se cierra sola','Token expirado (JWT 8h)','Reingresar; si persiste, limpiar localStorage e IndexedDB.'],
    ['Pantalla en blanco tras update','Cache PWA corrupto','Ctrl+F5; si no, indexedDB.deleteDatabase("LogisticaDB") y reloguear.'],
    ['admin-login no ingresa','Usuario no registrado en LOGISTICA_AdminUsuarios','N2: dar de alta en el panel o por SP.'],
])
h2('2.2 Requerimientos')
table(['Síntoma','Causa probable','Acción'],[
    ['"Falta configurar parámetros"','Parámetros no guardados','Ir a Parámetros → completar → Guardar configuración.'],
    ['No aparecen ítems/CECOs','Maestras no sincronizadas','Botón Sincronizar en Parámetros; verificar conectividad a SPRING.'],
    ['Error "ítem sin stock"','Validación en línea','El ítem no tiene saldo en ese almacén; revisar almacén o crear requerimiento de compra.'],
    ['Adjunto no sube','Tamaño/tipo de archivo','Revisar límite configurado; reintentar; si persiste revisar LOGISTICA_RequerimientoAdjuntos.'],
])
h2('2.3 Aprobaciones')
table(['Síntoma','Causa probable','Acción'],[
    ['Aprobador no ve el requerimiento','Sin área asignada / fila no en su ámbito','N2: verificar Usuarios por Área y reglas de ámbitos.'],
    ['Error al aprobar: SPRING','CECO/AFE/ítem inexistente en ERP','Verificar en SPRING; corregir y reintentar.'],
    ['Requerimiento "duplicado" en bandeja','Reintento doble','Es idempotente por id; refrescar bandeja.'],
    ['No puede anular','Ya despachado o consolidado','Solo anulable en estado APROBADO sin despacho; ver historial de anulaciones.'],
])
h2('2.4 Compras / OC')
table(['Síntoma','Causa probable','Acción'],[
    ['OC no avanza de nivel','Falta aprobador del siguiente nivel','N2: revisar FlujoAprobacionOC y UsuariosAprobadoresOC.'],
    ['Correo no llega al proveedor','SMTP o correo proveedor','Probar SMTP en configuración; revisar LOGISTICA_CorreoLog y correo del proveedor.'],
    ['OC en ERROR_SYNC','Falla insertando en WH_OrdenCompra','Ver sección SPRING; reintentar con LOGISTICA_reintentarSyncSpring.'],
    ['PDF sale sin logo/datos','Config PDF/empresa incompleta','N2: completar ConfigEmpresa y plantilla PDF.'],
])
h2('2.5 Almacén / despachos / kardex')
table(['Síntoma','Causa probable','Acción'],[
    ['No genera salida NS','Stock insuficiente o ítem sin lote','Verificar stock/kardex; si el ERP devuelve error, revisar el mensaje del SP.'],
    ['Despacho registrado pero stock no cuadra','Kardex desincronizado','Revisar SPRING_Kardex y LOGISTICA_SincronizacionSpringLog; ejecutar sync kardex.'],
    ['Recepción duplicada','Reintento','El SP valida recepciones por línea; revisar LOGISTICA_RecepcionOCLog.'],
    ['Transferencia no visible','Almacén virtual/destino no configurado','Revisar plantillas de almacén y almacén destino.'],
])
h2('2.6 Sincronización SPRING (transversal)')
table(['Síntoma','Diagnóstico','Acción'],[
    ['Documentos en PENDIENTE_SYNC','SELECT en tabla con estadoSpring','Puede ser cola normal; si no avanza, revisar cola.'],
    ['Documentos en ERROR_SYNC','Mensaje en LOGISTICA_SincronizacionLog / SincronizacionSpringLog','Corregir causa (dato maestro) y reintentar.'],
    ['Cola detenida','LOGISTICA_ColaMigracionSpring con pendientes viejos','Ejecutar procesar-cola-spring desde el API o el SP.'],
    ['Linked server no responde','Timeout en SPs SPRING','N3: verificar linked server a HASS-DB1 en SQL Server.'],
])
h2('2.7 PWA / versión')
table(['Síntoma','Acción'],[
    ['Usuarios ven versión vieja','Confirmar registro en AppDeployments del ambiente y updateMode=AUTO.'],
    ['"Nueva versión disponible" no actualiza','Forzar Ctrl+F5 una vez; el SW toma el control en el siguiente arranque.'],
    ['App no carga offline','Esperado: solo persisten datos locales ya sincronizados; la autenticación requiere red.'],
])

h1('3. Procedimientos de reproceso')
h2('3.1 Reintentar sincronización SPRING')
numbered([
    'Identificar el documento y su estadoSpring (OC, despacho, recepción, requisición).',
    'Revisar el mensaje de error en LOGISTICA_SincronizacionLog / LOGISTICA_SincronizacionSpringLog.',
    'Corregir el dato (maestro, CECO, correlativo, etc.).',
    'Ejecutar LOGISTICA_reintentarSyncSpring o usar el endpoint de reintento del API.',
    'Confirmar que pasa a SYNCHRONIZED.',
])
h2('3.2 Procesar cola de migración')
numbered([
    'Consultar LOGISTICA_ColaMigracionSpring por pendientes con error.',
    'Llamar al endpoint procesar-cola-spring (api/logistica) o ejecutar el SP correspondiente.',
    'Monitorear hasta vaciar la cola.',
])
h2('3.3 Migración de adjuntos')
p('Desde admin-logistica → Migrar Adjuntos se reprocesan adjuntos pendientes hacia SPRING. '
  'Usar tras incidentes de almacenamiento o errores de adjuntos.')
h2('3.4 Anulación controlada')
p('Las anulaciones de requerimientos quedan en LOGISTICA_HistorialAnulaciones con usuario y motivo. '
  'Para anular documentos ya integrados al ERP se requiere proceso manual en SPRING (N3).')

h1('4. Consultas SQL de diagnóstico')
code("""-- Documentos con error de sincronización
SELECT * FROM LOGISTICA_SincronizacionLog ORDER BY fechaRegistro DESC;
SELECT * FROM LOGISTICA_SincronizacionSpringLog WHERE estado='ERROR' ORDER BY fechaRegistro DESC;

-- Cola pendiente
SELECT * FROM LOGISTICA_ColaMigracionSpring ORDER BY fechaRegistro;

-- Auditoría del panel admin
SELECT TOP 100 * FROM LOGISTICA_Auditoria ORDER BY fechaRegistro DESC;

-- Log de aprobaciones
SELECT TOP 100 * FROM LOGISTICA_LogAprobaciones ORDER BY fechaRegistro DESC;
SELECT TOP 100 * FROM LOGISTICA_LogAprobacionesOC ORDER BY fechaRegistro DESC;""")

h1('5. Criterios de escalación')
table(['Escalar a N3 cuando…','Ejemplos'],[
    ['Error persiste tras reintento y dato corregido','SP devuelve excepción SQL, linked server, violación PK en WH_*.'],
    ['Comportamiento no documentado','Pantalla no guarda, cálculo de stock incorrecto.'],
    ['Requiere cambio de datos masivo','Update manual de tablas, corrección de correlativos.'],
    ['Infraestructura','API caída, certificado vencido, sitio IIS detenido.'],
])
h2('5.1 Qué adjuntar al escalar')
bullets(['Usuario, rol y empresa/área.','Pantalla y acción exacta.','Número de documento (req/SC/OC/NS).',
         'Hora del error y mensaje completo (consola del navegador si aplica).',
         'Resultado de las consultas de diagnóstico de la sección 4.'])
p(); p('— Fin del Runbook —',italic=True)
d.save(os.path.join(BASE,'RUNBOOK_SOPORTE.docx')); print('OK runbook')

# =====================================================================
# DOC B — ALCANCE / ENTREGA / RACI / CAPACITACION
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,portada=helpers(d)
portada('DOCUMENTO DE ALCANCE Y ENTREGA','Etapa 1 — Suite de Logística')

h1('1. Alcance de la Etapa 1')
h2('1.1 Dentro del alcance (entregado y en producción)')
bullets([
    'Autenticación por roles (11 roles) integrada con API Maestra y perfiles efectivos.',
    'Parámetros por usuario (empresa/fundo/cultivo/área/almacén/CECO/proyecto).',
    'Requerimientos: ítems, commodities, activos fijos, activos menores; consumo/compra/transferencia; adjuntos; solicitud de creación de ítem.',
    'Aprobación nivel 1 por área, nivel 2 gerencia y motor de aprobación por ámbitos/niveles con auto-aprobación configurable.',
    'Ciclo de compras: solicitud de compra → aprobación SC → consolidación → cotización → OC → aprobación por niveles → PDF/correo → sincronización SPRING → recepción → conformidad de almacén.',
    'Ciclo de servicios: solicitud de servicio → aprobación SS → cotización → OS → aprobación → sincronización → conformidad de servicio.',
    'Almacén: despachos con salida NS en SPRING, transferencias, devoluciones a proveedor, devoluciones de consumo, reingresos.',
    'Inventario: kardex, stock, ajustes, conteos físicos, listas de stock con alertas.',
    'Notificaciones, reportes y dashboards por rol.',
    'Administración: panel global /administracion (admin-login) y panel admin-logistica con 17 configuraciones.',
    'PWA con actualización automática versionada y portal de documentación.',
])
h2('1.2 Fuera del alcance de la Etapa 1')
bullets([
    'Etapa 2 y siguientes de la suite (por definir en roadmap).',
    'Integraciones adicionales distintas de SPRING y API Maestra.',
    'Aplicación móvil nativa (la PWA cubre uso en campo).',
])

h1('2. Acta de entrega a producción')
table(['Concepto','Detalle'],[
    ['Versión entregada','appVersion 7.0.1 (front) / API .NET 8'],
    ['Componentes','Portal Angular PWA, API REST ASP.NET Core, BD SQL Server, SPs de integración SPRING, subsitio /documentacion'],
    ['Ambientes','QAS (apiqaslogistica:7641, logisticaqas:7642) y Producción (apilogistica:7018, logistica:7019)'],
    ['Base de datos','169 tablas LOGISTICA_* + administración + espejo SPRING; ~600 SPs'],
    ['Integraciones','SPRING (linked server HASS-DB1), API Maestra (login y versionado), SMTP por empresa'],
    ['Documentación entregada','13 documentos Word (ver sección 5)'],
])
p('Responsables: ____________________ (TI)    ____________________ (Logística)    Fecha: ____/____/______', italic=True)

h1('3. Matriz RACI')
p('R = ejecuta, A = aprueba/rinde cuenta, C = consultado, I = informado.')
table(['Proceso','OPLOGIST','APLOGIST','GERENTE','LOLOGIST','ALLOGIST','JLOLOGIST','JEMLOGIST','FINANZAS','ADLOGIST','TILOGIST'],[
    ['Crear requerimiento','R','C','I','I','I','I','I','I','I','I'],
    ['Aprobar N1 (área)','C','R/A','I','I','I','I','I','I','I','I'],
    ['Aprobar N2 (gerencia)','I','C','R/A','I','I','I','I','I','I','I'],
    ['Despachar (salida NS)','I','I','I','I','R/A','I','I','I','I','I'],
    ['Solicitud de compra','C','C','I','R','I','A','I','I','I','I'],
    ['Consolidación / cotización','I','I','I','R/A','I','C','C','I','I','I'],
    ['Emitir OC','I','I','I','R','I','A','I','C','I','I'],
    ['Aprobar OC por niveles','I','I','A','C','I','R','R','R','I','I'],
    ['Emitir/aprobar OS','I','I','A','R','I','R','R','C','I','I'],
    ['Recepción de mercadería','I','I','I','C','R/A','I','I','I','I','I'],
    ['Conformidad almacén/servicio','I','I','I','C','R','R','I','I','I','I'],
    ['Inventario/kardex/transferencias','I','I','I','C','R/A','I','I','I','I','I'],
    ['Devoluciones / reingresos','I','I','I','C','R','I','I','I','I','I'],
    ['Maestros (ítems/proveedores)','I','I','I','C','C','C','I','I','R/A','A'],
    ['Usuarios/roles/perfiles','I','I','I','I','I','C','I','I','R','A'],
    ['Configuración de flujos/SMTP/PDF','I','I','I','I','I','I','I','I','R','A'],
    ['Soporte y mantenimiento','I','I','I','I','I','I','I','I','C','R/A'],
])

h1('4. Plan de capacitación')
table(['Audiencia','Contenido','Material','Duración sugerida'],[
    ['Operativos (OPLOGIST/EMLOGIST)','Parámetros, requerimientos (4 tipos), saldos, notificaciones','Manual ilustrado secc. 2','2 h'],
    ['Aprobadores (APLOGIST/GERENTE)','Bandejas, aprobar/anular, reportes','Manual ilustrado secc. 3–4','1.5 h'],
    ['Almacén (ALLOGIST)','Despachos, recepción, conformidad, kardex, transferencias, devoluciones','Manual ilustrado secc. 5','3 h'],
    ['Logística (LOLOGIST)','SC→consolidación→cotización→OC; SS→OS; reportes','Manual ilustrado secc. 6','3 h'],
    ['Aprobadores OC/OS (JLOLOGIST/JEMLOGIST/FINANZAS)','Aprobaciones OC/OS por nivel, dashboards','Manual ilustrado secc. 7','1.5 h'],
    ['Administradores (ADLOGIST/TILOGIST)','Ambos paneles de administración completos','Manual ilustrado secc. 8–10 + doc maestro','4 h'],
    ['Soporte TI','Runbook, reprocesos SPRING, consultas de diagnóstico','RUNBOOK_SOPORTE','3 h'],
])

h1('5. Paquete documental entregado')
table(['Documento','Propósito'],[
    ['DOCUMENTACION_SUITE_LOGISTICA_ETAPA1','Documento maestro: arquitectura, roles, flujos, administración, API, BD'],
    ['MANUAL_USUARIO_SUITE_LOGISTICA','Manual de usuario por rol (texto)'],
    ['MANUAL_USUARIO_ILUSTRADO','Manual visual con 53 capturas'],
    ['DOCUMENTACION_TECNICA_API_SP','Cadena frontend→API→SP, endpoints y SPs clave'],
    ['DOCUMENTACION_BASE_DATOS','Inventario y contexto de base de datos'],
    ['DICCIONARIO_BASE_DATOS','Estructura columna por columna de 169 tablas'],
    ['MANUAL_INSTALACION_DESPLIEGUE','Instalación, despliegue, checklist y rollback'],
    ['RUNBOOK_SOPORTE','Operación, incidentes y reprocesos'],
    ['DOCUMENTO_ALCANCE_ETAPA1','Alcance, acta de entrega, RACI, capacitación'],
    ['CASOS_PRUEBA','Casos de prueba por rol y flujo'],
    ['CATALOGO_STORED_PROCEDURES','Catálogo de SPs por módulo'],
    ['DOCUMENTACION_CODIGO_FRONTEND','Explicación del código Angular'],
    ['DOCUMENTACION_CODIGO_BACKEND','Explicación del código .NET'],
])
p(); p('— Fin —',italic=True)
d.save(os.path.join(BASE,'DOCUMENTO_ALCANCE_ETAPA1.docx')); print('OK alcance')

# =====================================================================
# DOC C — CASOS DE PRUEBA
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,portada=helpers(d)
portada('PLAN DE CASOS DE PRUEBA','Suite de Logística — Etapa 1')
h1('1. Convenciones')
bullets(['ID: CP-<módulo>-<n>. Prioridad: Alta (flujo principal) / Media / Baja.',
         'Precondición común: usuario logueado con el rol indicado y parámetros configurados.',
         'Cada caso indica pasos y resultado esperado. Marcar Pasó/Falló y evidencia.'])

def casos(mod, rows):
    h2(mod)
    table(['ID','Caso / pasos resumidos','Resultado esperado','Prioridad'],rows,widths=[1.0,3.4,2.4,0.7],fsize=8)

casos('2. Autenticación y acceso',[
 ['CP-AUT-01','Login con credenciales ERP válidas por cada rol','Ingresa y redirige a la pantalla inicial del rol','Alta'],
 ['CP-AUT-02','Login con clave inválida','Mensaje de error, sin acceso','Alta'],
 ['CP-AUT-03','Usuario ERP sin rol de logística','Deniega acceso / sin opciones','Alta'],
 ['CP-AUT-04','Usuario con perfil que suma roles','Roles efectivos combinados visibles en menú','Media'],
 ['CP-AUT-05','Expiración de sesión (token vencido)','Redirige a login','Media'],
 ['CP-AUT-06','admin-login con usuario admin válido','Accede a /administracion/dashboard','Alta'],
 ['CP-AUT-07','admin-logistica con TILOGIST/ADLOGIST/JLOLOGIST','Accede al panel con menú según rol','Alta'],
 ['CP-AUT-08','Intento de acceso a ruta sin guard correspondiente','Redirige / bloquea (guards)','Alta'],
])
casos('3. Parámetros',[
 ['CP-PAR-01','Guardar configuración completa','Persiste y habilita Requerimientos','Alta'],
 ['CP-PAR-02','Sincronizar maestras','Descarga ítems/CECOs/labores a IndexedDB','Alta'],
 ['CP-PAR-03','Cambio de almacén','Recalcula stock/disponibles','Media'],
 ['CP-PAR-04','Entrar a Requerimientos sin configurar','Mensaje "falta configurar"','Alta'],
])
casos('4. Requerimientos (OPLOGIST/EMLOGIST)',[
 ['CP-REQ-01','Crear requerimiento de consumo con ítems con stock','Guarda PENDIENTE y sincroniza','Alta'],
 ['CP-REQ-02','Crear requerimiento de compra','Guarda tipo COMPRA','Alta'],
 ['CP-REQ-03','Línea commodity','Guarda con descripción/monto','Alta'],
 ['CP-REQ-04','Línea activo fijo y activo menor','Valida campos obligatorios (AFE, clase)','Alta'],
 ['CP-REQ-05','Ítem sin stock en validación','Alerta / opción de compra según config','Alta'],
 ['CP-REQ-06','Adjuntar archivo','Adjunto visible en detalle','Media'],
 ['CP-REQ-07','Solicitar creación de ítem nuevo','Registra solicitud','Media'],
 ['CP-REQ-08','Requerimiento de transferencia de almacén','Genera tipo transferencia con almacén destino','Media'],
 ['CP-REQ-09','Consultar saldo pendiente','Lista ítems sin despachar','Media'],
])
casos('5. Aprobaciones (APLOGIST/GERENTE)',[
 ['CP-APR-01','Aprobar requerimiento individual','Estado APROBADO + requisición en SPRING','Alta'],
 ['CP-APR-02','Aprobación masiva','Todos aprobados o detalle de errores','Alta'],
 ['CP-APR-03','Rechazar con motivo','Estado RECHAZADO + motivo registrado','Alta'],
 ['CP-APR-04','Anular aprobado sin despachar','Estado ANULADO + historial','Alta'],
 ['CP-APR-05','Anular ya despachado','Bloqueado','Alta'],
 ['CP-APR-06','Aprobación N2 gerencia','Flujo avanza solo tras N1','Alta'],
 ['CP-APR-07','Aprobador de área solo ve su área','Filtro por ámbito/área','Alta'],
 ['CP-APR-08','Auto-aprobación por regla configurada','Aprueba solo según configuración','Media'],
])
casos('6. Compras (LOLOGIST)',[
 ['CP-COM-01','Crear SC desde requerimientos aprobados','SC registrada con detalle','Alta'],
 ['CP-COM-02','Aprobación de SC por flujo','Estado avanza por niveles','Alta'],
 ['CP-COM-03','Consolidar líneas de varios requerimientos','Consolidación con origen trazable','Alta'],
 ['CP-COM-04','Anular consolidación total/parcial','Libera líneas','Media'],
 ['CP-COM-05','Registrar cotizaciones de 2+ proveedores','Cuadro comparativo correcto','Alta'],
 ['CP-COM-06','Generar OC borrador','OC con detalle y distribución','Alta'],
 ['CP-COM-07','Enviar OC a aprobación','Estado EN_APROBACION, nivel 1','Alta'],
 ['CP-COM-08','Aprobación OC por niveles (montos)','Avanza JLOLOGIST→JEMLOGIST→FINANZAS→GERENTE según monto','Alta'],
 ['CP-COM-09','Rechazo OC en un nivel','Estado rechazado + log','Alta'],
 ['CP-COM-10','Confirmar envío OC: PDF + correo','Genera PDF y envía al proveedor (verificar CorreoLog)','Alta'],
 ['CP-COM-11','Sincronizar OC a SPRING','WH_OrdenCompra creada serie WHPO, estadoSpring SYNCHRONIZED','Alta'],
 ['CP-COM-12','Reintento tras ERROR_SYNC','Tras corregir dato, sincroniza','Alta'],
 ['CP-COM-13','Incrementar cantidad de OC emitida (regla habilitada)','Registra en OCIncrementoLog','Media'],
])
casos('7. Servicios',[
 ['CP-SER-01','Crear solicitud de servicio','SS registrada','Alta'],
 ['CP-SER-02','Flujo aprobación SS','Aprobada según flujo','Alta'],
 ['CP-SER-03','Cotización y OS individual','OS generada','Alta'],
 ['CP-SER-04','Consolidación de servicios','OS consolidada','Media'],
 ['CP-SER-05','Aprobación OS y sync SPRING','WH_OrdenServicio creada','Alta'],
 ['CP-SER-06','Conformidad de servicio','Registra conformidad + responsable','Alta'],
])
casos('8. Almacén e inventario (ALLOGIST)',[
 ['CP-ALM-01','Despachar requerimiento aprobado total','Salida NS en SPRING, stock descuenta, kardex registra','Alta'],
 ['CP-ALM-02','Despacho parcial','Saldo pendiente generado + notificación','Alta'],
 ['CP-ALM-03','Atender saldo cuando llega stock','Notificado y despachable','Alta'],
 ['CP-ALM-04','Recepción OC total','Kardex NI, stock suma, AP_Documentos','Alta'],
 ['CP-ALM-05','Recepción parcial','Pendiente recepcionable restante','Alta'],
 ['CP-ALM-06','Conformidad de almacén no conforme','Alimenta devolución a proveedor','Alta'],
 ['CP-ALM-07','Devolución a proveedor','Salida registrada + kardex','Alta'],
 ['CP-ALM-08','Devolución de consumo','Reingresa stock','Media'],
 ['CP-ALM-09','Reingreso de ítem','Stock suma','Media'],
 ['CP-ALM-10','Transferencia entre almacenes','Sale de origen, entra en destino','Alta'],
 ['CP-ALM-11','Ajuste de inventario','Movimiento con motivo','Media'],
 ['CP-ALM-12','Conteo físico y diferencias','Registra conteo/diferencias','Media'],
 ['CP-ALM-13','Lista de stock con límite → alerta','Notificación de stock mínimo','Media'],
])
casos('9. Administración',[
 ['CP-ADM-01','Alta usuario logística con rol','Accede con el rol asignado','Alta'],
 ['CP-ADM-02','Perfil con varios roles','Roles efectivos sumados','Alta'],
 ['CP-ADM-03','Configurar SMTP y probar','Correo de prueba enviado','Alta'],
 ['CP-ADM-04','Plantilla de correo OC','OC envía correo con plantilla','Media'],
 ['CP-ADM-05','Branding/colores/empresa','PDF refleja configuración','Media'],
 ['CP-ADM-06','Menú dinámico por rol','Menú cambia según permiso','Alta'],
 ['CP-ADM-07','Permisos por rol en admin-logistica','Tabs visibles según permiso','Alta'],
 ['CP-ADM-08','Flujo de aprobación por ámbitos: crear regla y simular','Simulación muestra ruta correcta','Alta'],
 ['CP-ADM-09','Registrar versión en AppDeployments','PWA detecta nueva versión','Alta'],
])
casos('10. Regresión / transversal',[
 ['CP-REG-01','F5 en cualquier pantalla (hash routing + fallback IIS)','No 404','Alta'],
 ['CP-REG-02','Sin conexión: consultar datos ya sincronizados','Vista offline limitada funciona','Media'],
 ['CP-REG-03','Idempotencia: doble clic en aprobar/despachar','Un solo documento en ERP','Alta'],
 ['CP-REG-04','Fecha/hora del servidor en documentos','Registro correcto','Baja'],
 ['CP-REG-05','Exportaciones a Excel de reportes principales','Descarga correcta','Media'],
])
h2('11. Matriz de resultado')
table(['Resultado','Criterio'],[
 ['Pasó','Resultado observado = esperado'],
 ['Falló','Se registra con evidencia, ambiente, usuario y documento afectado'],
 ['Bloqueado','No ejecutable por dependencia (dato, permiso, ambiente)'],
])
p(); p('— Fin del Plan de Casos de Prueba —',italic=True)
d.save(os.path.join(BASE,'CASOS_PRUEBA.docx')); print('OK casos')

# =====================================================================
# DOC D — CATALOGO DE SPs
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,portada=helpers(d)
portada('CATÁLOGO DE STORED PROCEDURES','Suite de Logística — SQL Server')
h1('1. Alcance')
n_sp=len(sp_file)
p(f'Catálogo de los {n_sp} stored procedures definidos en los scripts del repositorio '
  f'(api_logistica/SQL), agrupados por módulo. Para cada SP se indica el script fuente y '
  f'los repositorios .NET que lo invocan (cuando se pudo detectar).')
p('La lógica de negocio reside principalmente en los SPs; el backend actúa como capa '
  'de orquestación. Prefijos: LOGISTICA_ (suite), ADMIN_ (administración), alquiler_ (módulo hermano).',italic=True)

# agrupar
grupos={}
for sp in sorted(sp_file):
    grupos.setdefault(sp_grupo(sp),[]).append(sp)
sec=2
for g in sorted(grupos, key=lambda x:(x=='Otros',x)):
    h1(f'{sec}. {g} ({len(grupos[g])} SPs)'); sec+=1
    rows=[]
    for sp in sorted(grupos[g]):
        repos=', '.join(sorted(sp_repo.get(sp,[]))) or '—'
        rows.append([sp, sp_file[sp], repos])
    table(['Stored Procedure','Script fuente','Invocado por'],rows,widths=[2.3,2.2,2.0],fsize=7.5)
p('— Fin del Catálogo de SPs —',italic=True)
d.save(os.path.join(BASE,'CATALOGO_STORED_PROCEDURES.docx')); print('OK catalogo SPs:',n_sp)

# =====================================================================
# DOC E — DOCUMENTACION CODIGO FRONTEND
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,portada=helpers(d)
portada('DOCUMENTACIÓN DEL CÓDIGO — FRONTEND','Angular 17+ standalone — Suite de Logística')

h1('1. Arquitectura general')
bullets([
 'Angular 17+ con componentes standalone (sin NgModules), TypeScript, PrimeNG + Bootstrap 5.',
 'Ruteo con hash (provideRouter + withHashLocation) → todas las rutas son /#/...',
 'Guards funcionales por rol protegen cada ruta.',
 'Un interceptor HTTP funcional agrega el Bearer token y maneja 401.',
 'Persistencia offline con IndexedDB vía Dexie.js (LogisticaDB): maestras, parámetros, usuario, notificaciones.',
 'PWA: service worker (ngsw) + versionado por api/app-deployments.',
 'Comunicación con el API exclusivamente por servicios HTTP → endpoints REST.',
])
h2('1.1 Flujo de una pantalla (patrón común)')
numbered([
 'La ruta carga el componente standalone si el guard del rol lo permite.',
 'ngOnInit: lee usuario/parámetros de IndexedDB (Dexie), invoca servicios.',
 'El servicio hace HTTP al endpoint; el interceptor agrega el token.',
 'Respuesta → tabla/diálogo PrimeNG; acciones disparan POST/PUT al API.',
 'Errores: toast/alerta y, si es 401, logout.',
])

h1('2. Lógica por módulo')
h2('2.1 Autenticación (modules/auth)')
numbered([
 'login.component: formulario usuario/clave → AuthService.login.',
 'AuthService: intenta login en API Maestra; si el usuario está en la lista blanca de roles, hace fallback a /api/logistica/auth/login-rol.',
 'Tras login consulta listar-roles-efectivos (perfil) y los combina con el rol ERP.',
 'Persiste sesión en IndexedDB; decide la ruta inicial según el rol principal.',
 'AuthGuard valida sesión activa en las rutas.',
])
h2('2.2 admin-login (modules/admin-login)')
p('Panel global independiente. Formulario reactivo usuario/clave → POST /api/logistica/admin-login '
  '(array con credenciales) → guarda ADMIN_TOKEN y ADMIN_USER en localStorage → redirige a '
  '/administracion/dashboard. Interceptor propio adjunta ADMIN_TOKEN.')
h2('2.3 admin-logistica (modules/admin-logistica)')
numbered([
 'Login propio: AdminLogisticaAuthService → /api/logistica/admin-logistica/auth/login.',
 'Token y usuario en localStorage (admin_logistica_token/user) + Angular signals.',
 'AdminLogisticaAuthGuard protege /admin-logistica/*.',
 'Layout con menú por claves ADMINLG_MENU_* filtrado por permisos del rol.',
 'Tabs: aprobaciones (consumo/SC/SS/gerencia), bandeja, maestros, proveedores, usuarios y 17 configuraciones.',
])
h2('2.4 administracion (main/pages/administracion)')
p('Subrutas bajo /administracion protegidas por guard de administración. Cada página admin-* es un CRUD '
  'sobre su endpoint: usuarios, roles, perfiles, áreas, flujos, aprobadores, usuarios-por-área, versión API, '
  'SMTP, correos de proveedores, plantillas correo/PDF, colores, empresas, menús dinámicos y permisos, '
  'sincronización y notificaciones.')
h2('2.5 Operación principal (main/pages)')
bullets([
 'parametros: cascada empresa→fundo→cultivo→área→almacén + CECO/labor/proyecto; guarda en IndexedDB.',
 'requerimientos: tabs ítem/commodity/AF/AM con modales de detalle, validación de stock en línea, carga masiva y solicitud de ítem.',
 'aprobaciones(-area/-gerencia): bandejas con selección múltiple, detalle con stock, aprobar/rechazar/anular.',
 'solicitudes-compra, consolidacion-*, cotizaciones, ordenes-compra: flujo de compras end-to-end.',
 'solicitudes-servicio, ordenes-servicio, conformidad-servicios: flujo de servicios.',
 'despachos, recepcion-mercaderia, conformidad-almacen, kardex, gestion-inventario, listas-stock, transferencias, devoluciones, reingresos: módulo almacén.',
 'dashboards por rol y reportes (requerimientos, compras, despachos, saldos, seguimiento).',
 'menu-dinamico / layout/dynamic-menu: render del menú según permisos.',
 'shared/: adjuntos-modal, modal, notification-container, Dexie (dixiedb), pipes y utilidades.',
])

h1('3. Catálogo de archivos')
for kind,titulo,desc in [('service','3.1 Servicios (acceso a API y lógica de datos)','Servicios HTTP y de negocio.'),
                          ('guard','3.2 Guards (control de acceso por rol)',''),
                          ('interceptor','3.3 Interceptores',''),
                          ('component','3.4 Componentes y páginas',''),
                          ('modelo','3.5 Modelos e interfaces',''),
                          ('pipe','3.6 Pipes',''),
                          ('directive','3.7 Directivas',''),
                          ('routing','3.8 Archivos de rutas',''),
                          ('bd-local','3.9 Base de datos local (Dexie/IndexedDB)',''),
                          ('util','3.10 Utilidades y otros','')]:
    items=[x for x in CAT['front'] if x['kind']==kind]
    if not items: continue
    h1(titulo)
    rows=[]
    for x in items:
        dep=', '.join(x.get('deps',[])[:6])
        met=', '.join(x.get('metodos',[])[:10])
        rows.append([x['file'], x['clase'], dep or '—', met or '—'])
    table(['Archivo','Clase','Inyecta','Métodos'],rows,widths=[2.2,1.7,1.7,1.8],fsize=7.5)
p('— Fin Documentación Frontend —',italic=True)
d.save(os.path.join(BASE,'DOCUMENTACION_CODIGO_FRONTEND.docx')); print('OK front doc')

# =====================================================================
# DOC F — DOCUMENTACION CODIGO BACKEND
# =====================================================================
d=new_doc(); h1,h2,h3,h4,p,bullets,numbered,code,table,portada=helpers(d)
portada('DOCUMENTACIÓN DEL CÓDIGO — BACKEND','ASP.NET Core .NET 8 — api_logistica')

h1('1. Arquitectura en capas')
code("""Controller (Infraestructure/Controller)
   → UseCase (Domain/UseCase) implementado en Application/UseCaseImpl
      → Repository (Domain/Repository) implementado en Infraestructure/RepositoryImpl
         → Stored Procedure (Dapper / SqlCommand)
            → SQL Server (LOGISTICA_*) y SPRING (WH_*/AP_*)""")
bullets([
 'Program.cs registra todo por DI (AddScoped): ~200 interfaces e implementaciones.',
 'DbContext EF Core existe pero la persistencia real es vía SPs con Dapper/SqlClient.',
 'CORS AllowAll; compresión Brotli/Gzip; Swagger habilitado.',
 'MailKit para correos (OC al proveedor).',
])
h2('1.1 Flujo de una llamada (ejemplo: aprobar OC)')
numbered([
 'Angular → PUT /api/logistica/aprobacion-oc/{id}/aprobar.',
 'Controller valida entrada y delega al UseCase.',
 'UseCase aplica reglas (nivel, monto, estado) y llama al Repository.',
 'Repository ejecuta el SP LOGISTICA_aprobarOrdenCompra* vía Dapper.',
 'El SP actualiza estado, escribe log y, si es el último nivel, deja lista para sync a SPRING.',
 'Si requiere correo, ServiceImpl (MailKit) envía usando ConfigSmtp/plantilla.',
])

h1('2. Controladores y endpoints')
p('43 controladores, ~529 acciones. Listado por controlador con su ruta base.')
for b in [x for x in CAT['back'] if x['kind']=='controller']:
    h3(b['clase'])
    meta=f"Archivo: {b['file']}"
    if b.get('route'): meta+=f"   |   Ruta: {b['route']}"
    if b.get('deps'): meta+=f"   |   Inyecta: {', '.join(b['deps'][:8])}"
    p(meta,italic=True)
    if b['endpoints']:
        rows=[[m[0].replace('Http',''), m[1] or ''] for m in b['endpoints']]
        table(['Verbo','Ruta'],rows,widths=[1.0,5.5],fsize=8)
    else:
        p('(acciones sin atributo HTTP explícito detectado)',italic=True)

h1('3. Casos de uso (lógica de negocio)')
h2('3.1 Interfaces (Domain/UseCase)')
rows=[[x['file'].split('/')[-1],x['clase'],', '.join(x.get('metodos',[])[:12]) or '—'] for x in CAT['back'] if x['kind']=='usecase']
table(['Interfaz','Nombre','Métodos'],rows,widths=[2.2,1.6,3.4],fsize=8)
h2('3.2 Implementaciones (Application/UseCaseImpl)')
rows=[[x['file'].split('/')[-1],x['clase'],', '.join(x.get('metodos',[])[:12]) or '—'] for x in CAT['back'] if x['kind']=='usecase-impl']
table(['Clase','Nombre','Métodos'],rows,widths=[2.2,1.6,3.4],fsize=8)

h1('4. Repositorios (acceso a datos → SPs)')
h2('4.1 Interfaces (Domain/Repository)')
rows=[[x['file'].split('/')[-1],x['clase'],', '.join(x.get('metodos',[])[:12]) or '—'] for x in CAT['back'] if x['kind']=='repository']
table(['Interfaz','Nombre','Métodos'],rows,widths=[2.2,1.6,3.4],fsize=8)
h2('4.2 Implementaciones (Infraestructure/RepositoryImpl)')
rows=[]
for x in [y for y in CAT['back'] if y['kind']=='repository-impl']:
    sps=', '.join(x.get('sps',[])[:8])
    rows.append([x['file'].split('/')[-1],x['clase'],sps or '—'])
table(['Clase','Nombre','SPs detectados'],rows,widths=[2.0,1.8,3.4],fsize=8)

h1('5. Otros componentes')
for kind,titulo in [('modelo','5.1 Modelos de dominio'),('service-impl','5.2 Servicios de infraestructura (correo, etc.)'),
                     ('middleware','5.3 Middleware'),('persistence','5.4 Persistencia'),('exception','5.5 Excepciones'),
                     ('bootstrap','5.6 Bootstrap (Program.cs)'),('service-domain','5.7 Servicios de dominio'),('otro','5.8 Otros')]:
    items=[x for x in CAT['back'] if x['kind']==kind]
    if not items: continue
    h2(titulo)
    rows=[[x['file'],x['clase'],', '.join(x.get('metodos',[])[:10]) or '—'] for x in items]
    table(['Archivo','Clase','Métodos'],rows,widths=[2.6,1.8,2.8],fsize=8)
p('— Fin Documentación Backend —',italic=True)
d.save(os.path.join(BASE,'DOCUMENTACION_CODIGO_BACKEND.docx')); print('OK back doc')
