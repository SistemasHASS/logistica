# -*- coding: utf-8 -*-
"""
Genera 3 documentos finales:
  1. MANUAL_USUARIO_ILUSTRADO.docx  (manual de usuario con capturas reales)
  2. DICCIONARIO_BASE_DATOS.docx    (diccionario de datos columna por columna)
  3. MANUAL_INSTALACION_DESPLIEGUE.docx
"""
import os, json, re
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica'
CAPS = os.path.join(BASE, 'docs', 'capturas_manual')
TABLAS_JSON = os.path.join(BASE, 'tablas_diccionario.json')


def new_doc():
    d = Document()
    s = d.styles['Normal']
    s.font.name = 'Calibri'
    s.font.size = Pt(10.5)
    for i, (sz, col) in enumerate([(22, '1F4E79'), (15, '1F4E79'), (12, '2E74B5'), (11, '2E74B5')], start=1):
        h = d.styles[f'Heading {i}']
        h.font.name = 'Calibri'; h.font.size = Pt(sz); h.font.bold = True
        h.font.color.rgb = RGBColor.from_string(col)
    return d


def helpers(d):
    def h1(t): d.add_heading(t, level=1)
    def h2(t): d.add_heading(t, level=2)
    def h3(t): d.add_heading(t, level=3)
    def h4(t): d.add_heading(t, level=4)

    def p(text='', bold=False, italic=False):
        par = d.add_paragraph()
        r = par.add_run(text); r.bold = bold; r.italic = italic
        return par

    def bullets(items):
        for it in items:
            d.add_paragraph(it, style='List Bullet')

    def numbered(items):
        for it in items:
            d.add_paragraph(it, style='List Number')

    def code(text):
        par = d.add_paragraph()
        r = par.add_run(text)
        r.font.name = 'Consolas'; r.font.size = Pt(8.5)
        par.paragraph_format.left_indent = Inches(0.25)
        return par

    def table(headers, rows, widths=None, fsize=9):
        t = d.add_table(rows=1, cols=len(headers))
        t.style = 'Table Grid'
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, htxt in enumerate(headers):
            r = t.rows[0].cells[i].paragraphs[0].add_run(htxt)
            r.bold = True; r.font.size = Pt(fsize)
        for row in rows:
            cells = t.add_row().cells
            for i, val in enumerate(row):
                r = cells[i].paragraphs[0].add_run(str(val))
                r.font.size = Pt(fsize)
        if widths:
            for i, w in enumerate(widths):
                for row in t.rows:
                    row.cells[i].width = Inches(w)
        d.add_paragraph()
        return t

    def img(fname, caption=''):
        path = os.path.join(CAPS, fname)
        if not os.path.exists(path):
            p(f'[captura no disponible: {fname}]', italic=True)
            return
        par = d.add_paragraph(); par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        par.add_run().add_picture(path, width=Inches(6.3))
        if caption:
            c = d.add_paragraph(); c.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = c.add_run(caption); r.font.size = Pt(8.5); r.italic = True
            r.font.color.rgb = RGBColor.from_string('595959')

    def toc():
        par = d.add_paragraph()
        run = par.add_run()
        f1 = OxmlElement('w:fldChar'); f1.set(qn('w:fldCharType'), 'begin')
        it = OxmlElement('w:instrText'); it.set(qn('xml:space'), 'preserve')
        it.text = 'TOC \\o "1-3" \\h \\z \\u'
        f2 = OxmlElement('w:fldChar'); f2.set(qn('w:fldCharType'), 'separate')
        t2 = OxmlElement('w:t'); t2.text = "Clic derecho -> 'Actualizar campos' para generar el índice."
        f3 = OxmlElement('w:fldChar'); f3.set(qn('w:fldCharType'), 'end')
        run._r.append(f1); run._r.append(it); run._r.append(f2); run._r.append(t2); run._r.append(f3)

    def portada(titulo, subtitulo):
        for _ in range(6):
            d.add_paragraph()
        t = d.add_paragraph(); t.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = t.add_run(titulo); r.bold = True; r.font.size = Pt(30); r.font.color.rgb = RGBColor.from_string('1F4E79')
        s = d.add_paragraph(); s.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = s.add_run(subtitulo); r.font.size = Pt(15); r.font.color.rgb = RGBColor.from_string('2E74B5')
        d.add_paragraph()
        f = d.add_paragraph(); f.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = f.add_run('Suite de Logística — Etapa 1 (Producción)\nFecha: Noviembre 2026  |  Versión app: 7.0.1')
        r.font.size = Pt(10); r.italic = True
        d.add_page_break()
        d.add_heading('Índice', level=1)
        toc()
        d.add_page_break()

    return h1, h2, h3, h4, p, bullets, numbered, code, table, img, portada


# #############################################################################
# DOC 1 — MANUAL DE USUARIO ILUSTRADO
# #############################################################################
d = new_doc()
h1, h2, h3, h4, p, bullets, numbered, code, table, img, portada = helpers(d)
portada('MANUAL DE USUARIO ILUSTRADO', 'Guía visual paso a paso — Suite de Logística')

h1('1. Introducción y acceso')
p('La aplicación es una PWA (se puede instalar y funciona offline con datos locales). '
  'Cada usuario ve únicamente las opciones permitidas por su rol. Al actualizarse el sistema, '
  'la aplicación avisa y se actualiza automáticamente.')
img('01_login.png', 'Pantalla de login del portal')
numbered([
    'Abrir la URL del portal en Chrome o Edge.',
    'Ingresar usuario y contraseña corporativa (la misma del ERP).',
    'El sistema valida contra la API Maestra y carga el rol; según éste, abre la pantalla inicial correspondiente.',
])
table(['Acceso', 'URL', 'Quién entra'], [
    ['Portal principal', '/#/auth/login', 'Todos los usuarios con rol de logística'],
    ['admin-login', '/#/admin-login', 'TI — panel global /administracion'],
    ['admin-logistica', '/#/admin-logistica/login', 'TILOGIST, ADLOGIST, JLOLOGIST'],
])

h1('2. Rol Operativo (OPLOGIST / EMLOGIST)')
h2('2.1 Configurar parámetros')
numbered([
    'Ir a Parámetros. Seleccionar en cascada Empresa → Fundo → Cultivo → Área → Almacén.',
    'Definir CECO, Turno, Labor y Proyecto (AFE) por defecto; tipo de ítem CONSUMO.',
    'Presionar Sincronizar para descargar maestras y Guardar configuración.',
])
img('05_parametros.png', 'Pantalla Parámetros: configuración obligatoria antes de crear requerimientos')
h2('2.2 Crear un requerimiento')
numbered([
    'Ir a Requerimientos. Elegir la pestaña: ÍTEM, COMMODITY, ACTIVO FIJO o ACTIVO MENOR.',
    'Completar glosa y prioridad. Agregar líneas: buscar el ítem, indicar cantidad, proyecto, CECO y labor.',
    'El sistema valida stock en línea para ítems. Guardar: queda PENDIENTE y se sincroniza.',
    'Opcional: adjuntar archivos y/o solicitar creación de ítem nuevo.',
])
img('13_requerimientos.png', 'Pantalla Requerimientos con tabs por tipo de solicitud')
h2('2.3 Consultas del operativo')
img('12_dashboard_operativo.png', 'Dashboard operativo: contadores y despachos por mes')
img('14_notificaciones.png', 'Bandeja de notificaciones (stock disponible, avisos de almacén)')
img('48_saldo_requerimiento.png', 'Saldos pendientes por falta de stock')
img('49_reporte_requerimientos.png', 'Reporte de requerimientos con filtros y exportación')

h1('3. Rol Aprobador de Área (APLOGIST)')
numbered([
    'La pantalla inicial es Aprobaciones (o Aprobaciones por Área si tiene área asignada).',
    'Sincronizar pendientes, abrir el detalle (líneas, CECO, proyecto, stock).',
    'Aprobar individual o en masa — genera la Requisición en SPRING; o rechazar con motivo.',
    'Puede anular un aprobado si aún no fue despachado/consolidado (queda en historial).',
])
img('17_aprobaciones.png', 'Bandeja de aprobaciones con selección múltiple')
img('16_aprobaciones_area.png', 'Aprobaciones por área con detalle y stock por línea')
img('15_dashboard_aprobaciones_area.png', 'Dashboard de aprobaciones por área')
img('20_reporte_aprobaciones_area.png', 'Reporte de aprobaciones del área')
img('21_reporte_aprobados.png', 'Reporte de aprobados / rechazados')

h1('4. Rol Gerencia (GERENTE)')
p('Bandeja de aprobación de segundo nivel: revisa requerimientos aprobados por área que requieren '
  'aprobación de gerencia (según el flujo por ámbitos o la cadena de aprobadores N2). '
  'También puede ser nivel final en la aprobación de OC/OS de montos altos.')

h1('5. Rol Almacén (ALLOGIST)')
img('22_dashboard_despacho.png', 'Dashboard de despacho — pantalla inicial de almacén')
h2('5.1 Despachar requerimientos (salida NS)')
numbered([
    'Ir a Despachos: se listan los requerimientos APROBADOS de consumo.',
    'Abrir el requerimiento: "Atender" se autocalcula con min(pendiente, stock); ajustar si hace falta.',
    'Registrar Atención: genera la salida NS en SPRING y descuenta stock/kardex.',
    'Lo no atendido queda como saldo pendiente y se notifica al solicitante cuando llegue stock.',
])
img('23_despachos.png', 'Despachos: lista de aprobados y modal de atención con stock')
h2('5.2 Recepción de mercadería y conformidad')
numbered([
    'Recepción Mercadería: listar OCs recepcionables, registrar cantidades recibidas (parcial/total).',
    'Validar e ingresar a kardex (suma stock al almacén destino).',
    'Conformidad de Almacén: calificar conforme / no conforme; las no conformes alimentan devoluciones a proveedor.',
])
img('24_recepcion_mercaderia.png', 'Recepción de mercadería por OC')
img('25_conformidad_almacen.png', 'Registro de conformidad de almacén')
h2('5.3 Inventario, kardex y almacén')
img('26_kardex.png', 'Kardex: stock actual, movimientos, transacciones, dashboard, sync SPRING')
img('27_gestion_inventario.png', 'Gestión de inventario: ajustes y conteos físicos')
img('28_listas_stock.png', 'Listas de stock con límites y alertas')
img('32_transferencias_almacen.png', 'Transferencias entre almacenes')
img('29_devoluciones_proveedores.png', 'Devoluciones a proveedores')
img('30_devoluciones_consumo.png', 'Devoluciones de consumo')
img('31_reingresos.png', 'Reingresos de ítems al stock')
img('33_reporte_saldos.png', 'Reporte de saldos por ítem/almacén')
img('34_reporte_despachos.png', 'Reporte de despachos')
img('08_maestro_proveedores.png', 'Maestro de proveedores')
img('07_evaluacion_proveedores.png', 'Evaluación de proveedores')
img('11_reporte_logistico.png', 'Reporte logístico')

h1('6. Rol Operador Logístico (LOLOGIST) — Compras')
img('35_dashboard_logistica.png', 'Dashboard logística — pantalla inicial')
h2('6.1 Solicitudes de compra (SC)')
numbered([
    'Solicitudes de Compra: ver requerimientos de compra aprobados.',
    'Crear la SC (consolidada, directa o urgente), adjuntar documentos.',
    'La SC sigue el flujo de aprobadores configurado.',
])
img('36_solicitudes_compra.png', 'Bandeja de solicitudes de compra')
h2('6.2 Consolidación')
numbered([
    'Listar pendientes por tipo (ítems, commodities, activos fijos, activos menores).',
    'Seleccionar líneas y crear la consolidación; generar solicitud de cotización.',
    'Gestionar anulaciones (total o por línea) y migración de saldos aprobados.',
])
img('37_consolidacion_requerimientos.png', 'Consolidación de requerimientos')
img('38_consolidacion_compras.png', 'Consolidación de compras')
img('39_consolidacion_compra.png', 'Detalle de consolidación')
img('40_consolidacion_corporativa.png', 'Consolidación corporativa multiempresa')
h2('6.3 Cotizaciones')
numbered([
    'Bandeja de solicitudes de cotización (compra y servicio).',
    'Registrar la cotización de cada proveedor con precios y condiciones.',
    'Cuadro comparativo y selección del ganador.',
])
img('41_cotizaciones.png', 'Cotizaciones y cuadro comparativo')
h2('6.4 Órdenes de compra (OC)')
numbered([
    'Crear OC borrador desde la consolidación/cotización; completar proveedor, pago, incoterm, fecha prometida; adjuntar documentos.',
    'Enviar a aprobación por niveles según monto (JLOLOGIST → JEMLOGIST → FINANZAS → GERENTE).',
    'Aprobada: confirmar envío — se genera PDF y correo al proveedor; luego sincronizar a SPRING.',
    'Si la sincronización falla, reintentar desde la bandeja (estadoSpring ERROR_SYNC).',
])
img('42_ordenes_compra.png', 'Órdenes de compra')
h2('6.5 Servicios')
numbered([
    'Solicitud de Servicio → aprobación SS → cotización de servicio → OS (individual o consolidada) → aprobación → sincronización → conformidad de servicio.',
])
img('43_solicitudes_servicio.png', 'Solicitudes de servicio')
img('44_ordenes_servicio.png', 'Órdenes de servicio')
img('45_consolidacion_servicios.png', 'Consolidación de servicios')
img('46_conformidad_servicios.png', 'Conformidad de servicios')
h2('6.6 Consultas')
img('47_reportes_compras.png', 'Reportes de compras')
img('50_catalogo_items.png', 'Catálogo de ítems')

h1('7. Aprobadores de OC/OS (JLOLOGIST / JEMLOGIST / FINANZAS)')
numbered([
    'Aprobaciones OC / OS: ver pendientes del nivel propio según el monto.',
    'Revisar detalle, adjuntos y montos; aprobar o rechazar con observación.',
    'El último nivel deja la orden APROBADA para envío y sincronización.',
])
img('18_aprobaciones_oc.png', 'Bandeja de aprobación de OC')
img('19_aprobaciones_os.png', 'Bandeja de aprobación de OS')
img('51_dashboard_jlologist.png', 'Dashboard JLOLOGIST')
img('52_dashboard_jemlogist.png', 'Dashboard JEMLOGIST')
img('53_dashboard_finanzas.png', 'Dashboard Finanzas')

h1('8. Rol Administrador (ADLOGIST / TILOGIST)')
img('02_dashboard_admin.png', 'Dashboard administrativo')
img('03_maestros_items.png', 'Maestro de ítems')
img('04_maestros_comodities.png', 'Maestro de commodities')
img('06_aprobadores.png', 'Mantenedor de aprobadores')

h1('9. Panel admin-logistica')
p('Acceso propio en /admin-logistica/login para TILOGIST, ADLOGIST y JLOLOGIST.')
img('09_admin_logistica.png', 'Panel admin-logistica: menú con permisos por rol')
table(['Opción', 'Uso'], [
    ['Dashboard / Bandeja', 'KPIs del panel y bandeja unificada de pendientes.'],
    ['Aprobar Consumo / SC / SS / Gerencia', 'Bandejas de decisión por tipo.'],
    ['Maestros / Proveedores', 'Mantenimiento de ítems, commodities, UM y proveedores.'],
    ['Usuarios', 'Alta de usuarios desde el ERP, rol y estado (JLOLOGIST solo roles operativos).'],
    ['Áreas / Usuarios por Área', 'Áreas y subáreas + catálogo ERP; asignación usuario↔área y jefes.'],
    ['Flujo Aprobación Área / Flujo por Niveles', 'Rutas de aprobación por área y motor de niveles/ámbitos (reglas, N2, auto-aprobación, simulación).'],
    ['Formato PDF / Empresa / Parámetros', 'PDF de OC, datos de empresa y parámetros clave-valor.'],
    ['Incremento OC', 'Reglas para incrementar cantidades en OCs emitidas (historial y auditoría).'],
    ['Aprobadores / Auditoría', 'Mantenedor de aprobadores y log de acciones del panel.'],
    ['Plantillas Almacén / Conformidad Servicio', 'Formatos de impresión por empresa y responsables.'],
    ['Permisos por Rol / Accesos Reportes', 'Matriz de permisos por rol y acceso a reportes por usuario/área.'],
    ['Migrar Adjuntos / Mantenimiento', 'Reproceso de adjuntos a SPRING; limpieza/backups (uso controlado).'],
], widths=[2.6, 4.6])

h1('10. Panel /administracion (admin-login)')
img('10_administracion.png', 'Panel de administración global')
table(['Pantalla', 'Uso'], [
    ['Usuarios / Roles / Perfiles', 'Configuración de usuarios logística, permisos por rol y perfiles (suma de roles efectivos).'],
    ['Áreas / Flujos / Aprobadores / Usuarios por área', 'Estructura de aprobación: áreas, flujos por monto/tipo, aprobadores por nivel.'],
    ['Versión API', 'Versiones desplegadas (control de actualización de la PWA).'],
    ['Proveedores Email / SMTP / Plantillas correo y PDF', 'Correo de proveedores, servidor SMTP por empresa, plantillas.'],
    ['Colores / Branding / Empresas', 'Identidad visual y empresas multi-RUC.'],
    ['Menús (layout, dinámicos, permisos, plantillas)', 'Qué opciones de menú ve cada rol.'],
    ['Sincronización / Notificaciones config', 'Sincronización de maestras y configuración de notificaciones.'],
], widths=[2.6, 4.6])

h1('11. Errores comunes')
table(['Situación', 'Solución'], [
    ['"Falta configurar" al entrar a Requerimientos', 'Guardar la configuración en Parámetros.'],
    ['No sincroniza', 'Verificar conexión/API; si el token expiró, reingresar.'],
    ['Error al aprobar en SPRING', 'CECO/AFE/ítem inexistente en el ERP — validar con TI.'],
    ['No genera salida NS', 'Stock insuficiente o ítem sin lote en el almacén.'],
    ['No veo una opción del menú', 'Permisos por rol/perfil — revisar con el administrador.'],
    ['Datos locales corruptos', 'indexedDB.deleteDatabase("LogisticaDB") y reconfigurar.'],
], widths=[3.0, 4.2])
p(); p('— Fin del Manual Ilustrado —', italic=True)
d.save(BASE + r'\MANUAL_USUARIO_ILUSTRADO.docx')
print('OK manual ilustrado')

# #############################################################################
# DOC 2 — DICCIONARIO DE BASE DE DATOS
# #############################################################################
tables = json.load(open(TABLAS_JSON, encoding='utf-8'))

GRUPOS = [
    ('Requerimientos y adjuntos', lambda n: 'requerimiento' in n.lower() or n.lower().startswith('logistica_requerimientos') or 'adjunto' in n.lower() and 'oc' not in n.lower()),
    ('Aprobaciones y flujos', lambda n: any(k in n.lower() for k in ['aprobacion', 'flujo', 'ambito', 'aprobadores', 'logaprobaciones', 'historialanulaciones'])),
    ('Solicitudes (SC/SS) y cotizaciones', lambda n: any(k in n.lower() for k in ['solicitud', 'cotizacion'])),
    ('Consolidación y órdenes OC/OS', lambda n: any(k in n.lower() for k in ['consol', 'ordencompra', 'ordenservicio', 'adjuntosorden', 'ocadjunto', 'ocincremento', 'seguimiento', 'flujosaprobacionoc'])),
    ('Recepción, conformidad y despachos', lambda n: any(k in n.lower() for k in ['recepcion', 'conformidad', 'despacho', 'entrega', 'confirmacion'])),
    ('Inventario, kardex y stock', lambda n: any(k in n.lower() for k in ['kardex', 'stock', 'inventario', 'item', 'almacen', 'transaccion'])),
    ('Devoluciones, reingresos y transferencias', lambda n: any(k in n.lower() for k in ['devolucion', 'reingreso', 'transferencia'])),
    ('Usuarios, roles y administración', lambda n: any(k in n.lower() for k in ['usuario', 'rol', 'perfil', 'area', 'auditoria', 'correlativo', 'correolog', 'limpieza', 'cola', 'sincronizacion', 'proveedor', 'categoria'])),
    ('Configuración', lambda n: any(k in n.lower() for k in ['config', 'parametro', 'param', 'notificacion', 'plantilla', 'smtp', 'branding', 'menu', 'unidadmedida', 'acceso'])),
    ('SPRING / deployments / otros', lambda n: True),
]

def grupo_de(n):
    for g, f in GRUPOS[:-1]:
        if f(n):
            return g
    return GRUPOS[-1][0]

por_grupo = {}
for name in sorted(tables):
    por_grupo.setdefault(grupo_de(name), []).append(name)

d = new_doc()
h1, h2, h3, h4, p, bullets, numbered, code, table, img, portada = helpers(d)
portada('DICCIONARIO DE BASE DE DATOS', 'Estructura de tablas columna por columna — Suite de Logística')
h1('1. Alcance')
p(f'Diccionario generado desde los scripts CREATE TABLE del repositorio api_logistica/SQL. '
  f'Se documentan {len(tables)} tablas. Para cada columna se indica tipo de dato, nulabilidad, '
  f'clave primaria, identidad y valor por defecto declarados en el script más completo encontrado.')
p('Convenciones: prefijo LOGISTICA_ en tablas propias; campos de auditoría habituales '
  '(usuarioRegistro, fechaRegistro, ultimaFechaModif, ultimoUsuario); PK = clave primaria, '
  'ID = columna IDENTITY, DF = valor por defecto.', italic=True)

sec = 2
for g, _ in GRUPOS:
    names = por_grupo.get(g, [])
    if not names:
        continue
    h1(f'{sec}. {g}')
    sec += 1
    for name in names:
        info = tables[name]
        h3(name)
        p(f"Script fuente: {info['file']}", italic=True)
        rows = []
        for c in info['cols']:
            flags = []
            if c['pk']: flags.append('PK')
            if c['id']: flags.append('ID')
            if c['default']: flags.append('DF ' + c['default'])
            rows.append([c['col'], c['tipo'], c['null'] or '—', ', '.join(flags) or '—'])
        table(['Columna', 'Tipo', 'Nulable', 'Clave / Default'], rows, widths=[2.3, 1.9, 0.9, 2.1], fsize=8)

p('— Fin del Diccionario de Datos —', italic=True)
d.save(BASE + r'\DICCIONARIO_BASE_DATOS.docx')
print('OK diccionario')

# #############################################################################
# DOC 3 — MANUAL DE INSTALACIÓN Y DESPLIEGUE
# #############################################################################
d = new_doc()
h1, h2, h3, h4, p, bullets, numbered, code, table, img, portada = helpers(d)
portada('MANUAL DE INSTALACIÓN Y DESPLIEGUE', 'Puesta en producción — Suite de Logística')

h1('1. Componentes a desplegar')
table(['Componente', 'Tecnología', 'Destino'], [
    ['Portal web (SPA/PWA)', 'Angular build (dist/logistica)', 'Sitio IIS — https://logistica... (ej. :7642 / :7019)'],
    ['API REST', 'ASP.NET Core .NET 8 (publish)', 'Sitio/App IIS — https://apilogistica... (ej. :7641 / :7018)'],
    ['Portal de documentación', 'Carpeta docs/ publicada como subsitio', 'Subsitio IIS /documentacion'],
    ['Base de datos', 'SQL Server + scripts SQL', 'LOGISTICA (prod) / LOGISTICA_QAS'],
    ['Integración SPRING', 'SPs que escriben en WH_*/AP_*', 'Linked server a HASS-DB1'],
], widths=[2.0, 2.4, 2.8])

h1('2. Prerequisitos')
h2('2.1 Servidor')
bullets([
    'Windows Server + IIS con: sitio web, certificado HTTPS y bindings por puerto/dominio.',
    '.NET 8 (ASP.NET Core Hosting Bundle) para alojar la API en IIS.',
    'SQL Server accesible desde el servidor (cadena de conexión con usuario con permisos de EXEC en SPs y DDL según scripts).',
    'Linked server al ERP SPRING (HASS-DB1) configurado si los SPs de sincronización lo requieren.',
    'SMTP accesible (para correos de OC) — se configura por empresa en la app.',
])
h2('2.2 Estación de build')
bullets([
    'Node.js + npm (build Angular), Angular CLI.',
    '.NET SDK 8 (publish del API) o Visual Studio con perfil FolderProfile.',
    'Acceso a los repositorios: logistica/ (frontend) y api_logistica/ (backend + SQL).',
])

h1('3. Despliegue de la API (.NET)')
h2('3.1 Compilar y publicar')
numbered([
    'Abrir api_logistica.sln o usar CLI.',
    'Configurar la cadena de conexión en appsettings.json → ConnectionStrings:DefaultConnection (Server, Database, credenciales).',
    'Publicar con el perfil existente (FolderProfile.pubxml → FileSystem):',
])
code('dotnet publish api_logistica.csproj -c Release -o <carpeta_salida>')
bullets([
    'Perfiles configurados: FolderProfile → C:\\proyectos\\apps\\app_logistica\\compilado_api; FolderProfile1 → Documents\\publicaciones de apis\\api_logistica.',
    'Dependencias clave: Dapper, EF Core + SqlServer, Swashbuckle (Swagger), MailKit (correos).',
])
h2('3.2 Configurar el sitio IIS')
numbered([
    'Crear sitio/aplicación IIS apuntando a la carpeta publicada.',
    'Application Pool: "No Managed Code" (.NET Core in-process), identidad con acceso a SQL Server.',
    'Binding HTTPS con el certificado (ej. apiqaslogistica.agroapps.net:7641 en QAS / apilogistica.agroapps.net:7018 en prod).',
    'Verificar swagger: https://<host>/swagger para confirmar que la API responde.',
])
h2('3.3 Notas de configuración')
bullets([
    'CORS: AllowAll habilitado en Program.cs (AllowAnyOrigin/Method/Header).',
    'Compresión Brotli + Gzip activa también para HTTPS.',
    'La lógica vive en SPs: tras cambios de BD, no hace falta republicar la API.',
    'Logs: revisar visor de eventos / stdout si el sitio no levanta.',
])

h1('4. Despliegue del Frontend (Angular)')
h2('4.1 Build')
numbered([
    'Instalar dependencias: npm install (solo la primera vez o tras actualizar).',
    'Elegir el environment correcto: environment.ts (dev), environment.prod.ts (prod). Claves a revisar:',
])
code('''baseUrl          = 'https://apilogistica...'   (API logística)
apiMaestra       = 'https://apimaestra.agroapps.net:7003'
deployEnvironment= 'production' | 'qas' | 'development'
appVersion       = versión a desplegar (p.ej. '7.0.1')
updateMode       = 'AUTO'  (AUTO | MANUAL | DISABLED)
docsUrl          = 'https://<portal>/documentacion\'''')
numbered([
    'Compilar: ng build --configuration production  →  salida en dist/logistica.',
])
h2('4.2 Publicar en IIS')
numbered([
    'Copiar dist/logistica/browser al directorio del sitio web.',
    'Incluir src/web.config en la raíz del sitio: ya configura MIME types (.json, .woff, .webmanifest), fallback 404 → /index.html, headers no-cache y compresión.',
    'Binding HTTPS del portal (ej. logisticaqas.agroapps.net:7642 / logistica.agroapps.net:7019).',
    'Verificar manifest.webmanifest y ngsw-worker.js accesibles (PWA).',
])
h2('4.3 PWA y versionado')
bullets([
    'Service Worker (ngsw) se registra en producción; ngsw-config define prefetch de app y lazy de assets.',
    'Control de versiones: la app consulta api/app-deployments/current (versión por ambiente) y, con updateMode=AUTO, fuerza recarga cuando hay nueva versión; version-control via API Maestra.',
    'Para publicar una nueva versión: subir appVersion, compilar, desplegar y registrar el deployment en AppDeployments (pantalla admin-version-api).',
    'La carpeta docs/ del repo se copia al build como /documentacion/docs — es el portal de ayuda accesible vía docsUrl.',
])

h1('5. Base de datos')
numbered([
    'Crear/restaurar la base LOGISTICA en el servidor destino.',
    'Ejecutar los scripts de api_logistica/SQL según el módulo a habilitar. El archivo SQL/STORED_PROCEDURES_STATUS.md lista los SPs que el backend invoca.',
    'Orden sugerido por bloques: 01–09 (tablas base, requerimientos, consolidación, saldos, aprobaciones, login admin, notificaciones, cotizaciones, administración) → 26–31 (kardex, despachos, devoluciones, reingresos) → 240–267 (SC, dashboards, reportes, aprobación SC, OC, AppDeployments) → 280–307 (recepción OC, servicios, aprobaciones OC/OS, conformidad) → 310–350 (flujo completo OC/OS, consolidación OC/OS, correo, adjuntos, conformidad servicio, seguimiento) → 400+ (seguimiento, permisos, menús, branding, plantillas) → 700+ (menú dinámico, transferencia virtual, branding, conformidad servicio, incremento OC, ámbitos, perfiles, autoaprobación, reportes/seguridad).',
    'Otorgar EXEC sobre los SPs al usuario de la cadena de conexión.',
    'Verificar la configuración del linked server al ERP (HASS-DB1) y probar un SP de sincronización en modo simulación.',
])
h2('5.1 Datos iniciales mínimos')
bullets([
    'Empresas (multi-RUC), áreas, usuarios y roles (TILOGIST inicial).',
    'ConfigSmtp por empresa, correos de proveedores.',
    'ConfigMenu / menús dinámicos y ConfigPermisos por rol.',
    'FlujoAprobacionOC / aprobadores por nivel, flujos por área y reglas de ámbitos si aplica.',
    'Parámetros del sistema y plantillas (PDF OC, correo, almacén, conformidad servicio).',
    'Correlativos de documentos.',
    'AppDeployments con la versión inicial por ambiente.',
])

h1('6. Integración con SPRING (ERP)')
bullets([
    'Aprobación de consumo → WH_Requisicion. Despacho → WH_Transaccion* (NS) + kardex + stock.',
    'OC aprobada → WH_OrdenCompra(+Detalle+Distribucion) serie WHPO; OS → WH_OrdenServicio.',
    'Recepción OC → transacción NI/ROC + WH_Kardex + WH_ItemAlmacenLote + AP_Documentos.',
    'Compatibilidad de campos: truncado a longitudes CHAR del ERP ya aplicado en los SPs.',
    'estadoSpring controla sincronizaciones (PENDIENTE_SYNC/SYNCHRONIZED/ERROR_SYNC); reintentos con LOGISTICA_reintentarSyncSpring y procesar-cola-spring (LOGISTICA_ColaMigracionSpring).',
])

h1('7. Checklist de salida a producción')
numbered([
    'Cadena de conexión apunta a la base de producción.',
    'Sitios IIS con HTTPS válido: API (:7018) y Portal (:7019) + subsitio /documentacion.',
    'environment.prod.ts: baseUrl prod, deployEnvironment=production, appVersion correcta.',
    'SPs ejecutados en producción (incluidos los FIX 310–326 y módulos en uso).',
    'Usuarios/roles iniciales y admin TILOGIST creados.',
    'SMTP probado (botón "probar conexión" en Config SMTP).',
    'AppDeployments registrado para que la PWA detecte la versión.',
    'Prueba end-to-end: login → parámetros → requerimiento → aprobación → despacho → salida NS en SPRING.',
    'Prueba ciclo compra: SC → consolidación → cotización → OC → aprobación → PDF/correo → SPRING → recepción → kardex.',
])
h2('7.1 Rollback')
bullets([
    'Frontend: conservar el build anterior y republicarlo; registrar la versión previa en AppDeployments.',
    'API: conservar la carpeta publicada anterior y reapuntar el sitio.',
    'BD: los scripts son aditivos; usar backups (LOGISTICA_LimpiezaBackups para mantenimiento) y respaldos programados.',
])
p(); p('— Fin del Manual de Instalación y Despliegue —', italic=True)
d.save(BASE + r'\MANUAL_INSTALACION_DESPLIEGUE.docx')
print('OK despliegue')
