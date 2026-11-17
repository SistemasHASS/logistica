# -*- coding: utf-8 -*-
"""
Genera la documentación completa de la Suite de Logística - Etapa 1 (Producción).
Salida: DOCUMENTACION_SUITE_LOGISTICA_ETAPA1.docx
"""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

# ---------------------------------------------------------------- estilos base
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(10.5)

for i, (sz, col) in enumerate([(22, '1F4E79'), (15, '1F4E79'), (12, '2E74B5'), (11, '2E74B5')], start=1):
    h = doc.styles[f'Heading {i}']
    h.font.name = 'Calibri'
    h.font.size = Pt(sz)
    h.font.bold = True
    h.font.color.rgb = RGBColor.from_string(col)


def h1(t): doc.add_heading(t, level=1)
def h2(t): doc.add_heading(t, level=2)
def h3(t): doc.add_heading(t, level=3)
def h4(t): doc.add_heading(t, level=4)


def p(text='', bold=False, italic=False, size=None):
    par = doc.add_paragraph()
    run = par.add_run(text)
    run.bold = bold
    run.italic = italic
    if size:
        run.font.size = Pt(size)
    return par


def bullets(items, style_name='List Bullet'):
    for it in items:
        doc.add_paragraph(it, style=style_name)


def numbered(items):
    for it in items:
        doc.add_paragraph(it, style='List Number')


def code(text):
    par = doc.add_paragraph()
    run = par.add_run(text)
    run.font.name = 'Consolas'
    run.font.size = Pt(8.5)
    par.paragraph_format.left_indent = Inches(0.25)
    par.paragraph_format.space_after = Pt(4)
    return par


def table(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t.rows[0].cells
    for i, htxt in enumerate(headers):
        hdr[i].text = ''
        run = hdr[i].paragraphs[0].add_run(htxt)
        run.bold = True
        run.font.size = Pt(9)
    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = ''
            run = cells[i].paragraphs[0].add_run(str(val))
            run.font.size = Pt(9)
    if widths:
        for i, w in enumerate(widths):
            for row in t.rows:
                row.cells[i].width = Inches(w)
    doc.add_paragraph()
    return t


def toc():
    par = doc.add_paragraph()
    run = par.add_run()
    fldChar = OxmlElement('w:fldChar'); fldChar.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText'); instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'TOC \\o "1-3" \\h \\z \\u'
    fldChar2 = OxmlElement('w:fldChar'); fldChar2.set(qn('w:fldCharType'), 'separate')
    t2 = OxmlElement('w:t'); t2.text = "Clic derecho -> 'Actualizar campos' para generar el índice."
    fldChar3 = OxmlElement('w:fldChar'); fldChar3.set(qn('w:fldCharType'), 'end')
    run._r.append(fldChar); run._r.append(instrText); run._r.append(fldChar2); run._r.append(t2); run._r.append(fldChar3)


# ================================================================ PORTADA
for _ in range(6):
    doc.add_paragraph()
title = doc.add_paragraph(); title.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = title.add_run('SUITE DE LOGÍSTICA'); r.bold = True; r.font.size = Pt(32); r.font.color.rgb = RGBColor.from_string('1F4E79')
sub = doc.add_paragraph(); sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = sub.add_run('Documentación Funcional y Técnica — Etapa 1 (Producción)'); r.font.size = Pt(16); r.font.color.rgb = RGBColor.from_string('2E74B5')
doc.add_paragraph()
meta = doc.add_paragraph(); meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = meta.add_run('Alcance: Portal web (Angular), API REST (.NET), Base de datos SQL Server,\nIntegración ERP SPRING, Panel admin-login y Panel admin-logistica')
r.font.size = Pt(11); r.italic = True
doc.add_paragraph()
f = doc.add_paragraph(); f.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = f.add_run('Fecha: Noviembre 2026   |   Versión del documento: 1.0   |   Versión app: 7.0.1')
r.font.size = Pt(10)
doc.add_page_break()

# ================================================================ TOC
h1('Índice')
toc()
doc.add_page_break()

# ================================================================ 1. INTRODUCCIÓN
h1('1. Introducción')
h2('1.1 Propósito del documento')
p('Este documento consolida la documentación completa de la primera etapa de la Suite de Logística, '
  'actualmente en producción. Describe cada rol del sistema, todos los flujos funcionales de negocio '
  '(requerimientos, aprobaciones, compras, servicios, almacén e inventario), y la totalidad de las '
  'configuraciones disponibles en los módulos administrativos admin-login / administración y admin-logistica, '
  'así como la arquitectura técnica del frontend Angular, la API .NET y la base de datos SQL Server con '
  'integración al ERP SPRING.')
h2('1.2 Alcance de la Etapa 1')
bullets([
    'Ciclo completo de requerimientos: consumo, compra, transferencia, servicios, activos fijos y activos menores.',
    'Aprobaciones multinivel: por área (N1), por gerencia (N2) y por ámbitos configurables.',
    'Ciclo de compras: solicitud de compra, consolidación, cotizaciones, orden de compra, aprobación por niveles, envío a proveedor y sincronización a SPRING.',
    'Ciclo de servicios: solicitud de servicio, cotización, orden de servicio y conformidad de servicio.',
    'Almacén e inventario: despachos (salidas NS), recepción de OC, conformidad de almacén, kardex, stock, listas de stock, transferencias, ajustes y conteos.',
    'Devoluciones a proveedores, devoluciones de consumo y reingresos.',
    'Dashboards por rol, reportes operativos y de compras.',
    'Notificaciones en pantalla y por correo (SMTP configurable por empresa).',
    'Administración: usuarios, roles, perfiles, áreas, flujos, aprobadores, menús dinámicos, branding, plantillas PDF/correo, SMTP, parámetros, auditoría y mantenimiento.',
])
h2('1.3 Componentes de la solución')
table(['Componente', 'Tecnología', 'Ubicación / repositorio'], [
    ['Portal web (SPA + PWA)', 'Angular 17+ (standalone), PrimeNG, Bootstrap 5, Dexie.js (IndexedDB), Service Worker', 'logistica/'],
    ['API REST', '.NET / ASP.NET Core, Entity Framework Core, capas Domain–Application–Infrastructure', 'api_logistica/'],
    ['Base de datos', 'SQL Server — base LOGISTICA (QAS: LOGISTICA_QAS)', 'api_logistica/SQL (745 scripts)'],
    ['ERP integrado', 'SPRING (HASS) — tablas WH_* y AP_* vía linked server', 'HASS_SPRING_PRUEBA / producción'],
    ['API Maestra', 'Servicio corporativo de autenticación y maestras', 'https://apimaestra.agroapps.net:7003'],
])
h2('1.4 Arquitectura general')
code('''┌─────────────────────────── NAVEGADOR (Angular PWA) ───────────────────────────┐
│  Portal principal (/main/*)  │  admin-login → /administracion (AdminModule)   │
│  admin-logistica (panel)     │  IndexedDB (Dexie) offline + Service Worker    │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                     │ HTTPS / JSON
              ┌──────────────────────┼───────────────────────┐
              ▼                      ▼                       ▼
   API Logística (.NET)      API Maestra (auth)      Portal documentación
   apiqaslogistica:7641      apimaestra:7003         (subsitio IIS)
              │
              ▼
   SQL Server LOGISTICA_QAS (SPs LOGISTICA_*)
              │
              ▼
   ERP SPRING — WH_OrdenCompra, WH_Requisicion, WH_Transaccion*,
   WH_Kardex, WH_ItemAlmacenLote, AP_Documentos''')
doc.add_page_break()

# ================================================================ 2. ROLES
h1('2. Roles del sistema')
p('Los roles se almacenan en el campo idrol del usuario (puede contener varios roles concatenados por coma). '
  'Además del rol directo que otorga el ERP, el sistema permite definir perfiles que agregan roles efectivos '
  '(endpoint listar-roles-efectivos). La redirección tras el login sigue el orden de prioridad indicado.')
table(['Rol', 'Nombre funcional', 'Descripción y permisos principales', 'Pantalla inicial'], [
    ['TILOGIST', 'Administrador de Sistema (TI)', 'Acceso total: todas las configuraciones, administración, menús dinámicos, branding, SMTP, mantenimiento, todos los roles en admin-logistica.', '/main/parametros'],
    ['ADLOGIST', 'Administrador de Logística', 'Administración funcional: maestros, áreas, flujos, aprobadores, dashboards admin y TI.', '/main/maestros'],
    ['JLOLOGIST', 'Jefe / Coordinador de Logística', 'Aprueba requerimientos y OC nivel 1; accede a admin-logistica; dashboard propio; en admin-logistica puede crear usuarios con roles operativos.', '/main/dashboard-jlologist'],
    ['JEMLOGIST', 'Jefe de Licitaciones / Compras', 'Nivel 2 de aprobación de OC/OS (montos medios); conformidad de servicios.', '—'],
    ['LOLOGIST', 'Operador Logístico', 'Ciclo de compras completo: solicitudes, consolidaciones, cotizaciones, OC/OS, seguimiento; transferencias de almacén.', '/main/dashboard-logistica'],
    ['EMLOGIST', 'Operador de Licitaciones (Empaque)', 'Crea requerimientos de consumo; parámetros; conformidad de servicios.', '/main/parametros'],
    ['ALLOGIST', 'Almacén', 'Despachos (salida NS), recepción de mercadería, conformidad de almacén, kardex, listas de stock, gestión de inventario, devoluciones, transferencias.', '/main/dashboard-despacho'],
    ['OPLOGIST', 'Operativo de Campo', 'Crea requerimientos de consumo; consulta notificaciones y saldos; dashboard operativo.', '/main/dashboard-oplogist'],
    ['APLOGIST', 'Aprobador de Consumo / Área', 'Aprueba o rechaza requerimientos nivel 1. Si tiene área asignada → /main/aprobaciones-area; si no → /main/aprobaciones.', '/main/aprobaciones(-area)'],
    ['FINANZAS', 'Finanzas', 'Aprobación de OC/OS en niveles altos de monto; dashboard de finanzas.', '/main/dashboard-finanzas'],
    ['GERENTE', 'Gerencia', 'Aprobación nivel final (gerencia) de requerimientos y OC/OS; dashboard de gerencia.', '/main/aprobaciones-gerencia'],
], widths=[0.9, 1.6, 3.4, 1.3])

h2('2.1 Guards de rutas (control de acceso en frontend)')
table(['Guard', 'Roles / condición permitida', 'Protege principalmente'], [
    ['AuthGuard', 'Sesión iniciada (usuario en IndexedDB)', 'Todo /main/*'],
    ['AdminGuard', 'ADMIN_TOKEN en localStorage (login admin)', '/administracion/*'],
    ['AdminLogisticaAuthGuard', 'admin_logistica_token (login del panel)', '/admin-logistica/*'],
    ['AdministradorGuard', 'ADLOGIST, TILOGIST', 'maestros, aprobadores, dashboards admin'],
    ['AlmacenGuard', 'ALLOGIST, LOLOGIST', 'despachos, recepción, kardex, inventario, transferencias, devoluciones-proveedores'],
    ['AdministradorOAlmacenGuard', 'Administrador o Almacén', 'maestro-proveedores'],
    ['AprobadorGuard', 'APLOGIST, ADLOGIST, JLOLOGIST, GERENTE o permiso N1/N2 vigente por ámbitos', 'aprobaciones, aprobaciones-area, dashboards/reportes de aprobación'],
    ['AprobadorNivel2Guard', 'Aprobador legado, cadena nivel 2 o permiso N2 por ámbitos', 'aprobaciones-gerencia'],
    ['AprobadorOCGuard', 'TILOGIST, ADLOGIST, JLOLOGIST, JEMLOGIST, FINANZAS, GERENTE', 'aprobaciones-oc, aprobaciones-os, dashboard-finanzas'],
    ['LogisticoGuard', 'LOLOGIST, TILOGIST, ADLOGIST, JLOLOGIST', 'solicitudes-compra/servicio, cotizaciones, OC/OS, consolidaciones, reportes-compras'],
    ['OperativoLogisticoGuard', 'OPLOGIST, LOLOGIST, EMLOGIST, JEMLOGIST, JLOLOGIST, APLOGIST, ADLOGIST, ALLOGIST', 'dashboard-oplogist, seguimiento req. compra/consumo, análisis'],
    ['OperativoEmpaqueGuard', 'OPLOGIST, EMLOGIST, LOLOGIST, ALLOGIST', 'parametros, requerimientos, notificaciones'],
    ['OperativoGuard / EmpaqueGuard', 'OPLOGIST / EMLOGIST', 'parametros (versión previa)'],
    ['ConfigGuard', 'Configuración guardada en IndexedDB', 'requerimientos (exige parametrización previa)'],
    ['ConformidadServiciosGuard', 'LOLOGIST, TILOGIST, ADLOGIST, OPLOGIST, EMLOGIST, JEMLOGIST, JLOLOGIST', 'conformidad-servicios'],
    ['DevolucionConsumoGuard / ReingresoGuard', 'Roles con permiso del módulo', 'devoluciones-consumo, conformidad-almacen, reingresos'],
    ['AdminSistemaGuard', 'Validación en API: es-admin-sistema/{usuario}', 'funciones de sistema'],
], widths=[1.7, 2.9, 2.6])
doc.add_page_break()

# ================================================================ 3. AUTENTICACIÓN
h1('3. Autenticación y accesos')
h2('3.1 Login del portal principal (/auth/login)')
numbered([
    'El usuario ingresa usuario y clave. Se llama a la API Maestra POST /api/Maestros/get-usuarios con {usuario, clave, aplicacion:"LOGISTICA"}.',
    'Si la respuesta viene vacía, se hace fallback a POST api/logistica/auth/login-rol (roles whitelist GERENTE/FINANZAS con estado=0 en maestro).',
    'Se enriquece el idrol con los roles efectivos de perfiles: POST api/logistica/listar-roles-efectivos (roles directos + roles otorgados por perfiles).',
    'El usuario se guarda en IndexedDB (Dexie, tabla usuario). Se consulta el área del usuario (obtener-area-usuario) y se persiste idarea, nombreArea, esJefeArea, rolArea.',
    'Redirección por rol con prioridad: TILOGIST→parametros, ADLOGIST→maestros, APLOGIST→aprobaciones(-area), ALLOGIST→dashboard-despacho, OPLOGIST→dashboard-oplogist, EMLOGIST→parametros, LOLOGIST→dashboard-logistica, JLOLOGIST→dashboard-jlologist, FINANZAS→dashboard-finanzas, GERENTE→aprobaciones-gerencia; otro→reporte_logistico.',
])
h2('3.2 admin-login (/admin-login) — acceso al panel de administración global')
bullets([
    'Componente: src/app/modules/admin-login/admin-login.component.ts (standalone).',
    'Servicio: AuthAdminService → POST api/logistica/admin-login con [{usuario, clave}] → SP LOGISTICA_loginAdmin.',
    'La respuesta es un array; se toma el primer registro y se valida admin.token.',
    'Persistencia: localStorage ADMIN_TOKEN y ADMIN_USER (no IndexedDB).',
    'Guard: AdminGuard — sin token redirige a /admin-login.',
    'Destino tras login: /administracion/dashboard (AdminModule).',
    'Servicio complementario AdminContextService → POST api/logistica/admin-contexto-empresa {idPerfil} para resolver la empresa del perfil.',
])
h2('3.3 admin-logistica (/admin-logistica/login) — panel administrativo de logística')
bullets([
    'Login propio: AdminLogisticaAuthService → POST api/logistica/admin-logistica/auth/login (AdminLogisticaController).',
    'Persistencia: localStorage admin_logistica_token y admin_logistica_user; estado en signals (currentUser, isLoggedIn).',
    'Guard: AdminLogisticaAuthGuard (funcional) — sin token redirige a /admin-logistica/login.',
    'Roles habilitados del panel: TILOGIST, ADLOGIST, JLOLOGIST (AdminLogisticaGuard).',
    'Control de creación de usuarios (canCreateUsers): TILOGIST ve los 11 roles; JLOLOGIST solo roles operativos (LOLOGIST, EMLOGIST, ALLOGIST, OPLOGIST, APLOGIST); ADLOGIST puede crear usuarios.',
    'El menú del layout usa claves de permiso ADMINLG_MENU_* parametrizables; cada opción tiene un fallback por rol (p.ej. solo admins ven opciones de configuración; JLOLOGIST no ve Aprobar SC/SS).',
])
h2('3.4 Interceptor HTTP')
bullets([
    'authInterceptor (funcional) registrado en app.config.ts; solo procesa URLs que contienen /api/ o localhost:5213.',
    'Adjunta contexto del usuario logueado (UserService.getUsuario()) y mapea roles del frontend a los esperados por el backend.',
])
h2('3.5 Versionado y actualización (PWA)')
bullets([
    'environment.appVersion = 7.0.1; versionControlApi = MAESTRA; updateMode = AUTO; showUpdateModal = true.',
    'Service Worker (ngsw) habilitado en producción; version-check.service + deployment-tracking.service consultan api/app-deployments/current e history para forzar actualización cuando cambia la versión.',
    'docsUrl apunta al portal de documentación publicado como subsitio IIS (botón Ayuda).',
])
doc.add_page_break()

# ================================================================ 4. MÓDULOS FUNCIONALES
h1('4. Flujos funcionales del portal principal (/main/*)')
p('Mapa de rutas con el rol/guard que las protege y la función de cada pantalla.')

h2('4.1 Parámetros (configuración de trabajo del usuario)')
bullets([
    'Ruta /main/parametros (OperativoEmpaqueGuard).',
    'Selección en cascada: Empresa → Fundo → Cultivo → Área → Almacén → CECO → Turno → Labor → Proyecto.',
    'Tipo de item: CONSUMO (todos) / TRANSFERENCIA (solo LOLOGIST).',
    'Sincroniza maestras a IndexedDB (empresas, fundos, almacenes, áreas, proyectos/AFE, cultivos, turnos, cecos, labores, items, commodities, proveedores).',
    'Persiste en tabla configuracion de IndexedDB. ConfigGuard exige esta configuración antes de crear requerimientos.',
])

h2('4.2 Requerimientos (creación de solicitudes)')
bullets([
    'Ruta /main/requerimientos (OperativoEmpaqueGuard + ConfigGuard).',
    'Tipos de requerimiento: CONSUMO, COMPRA, TRANSFERENCIA. Tipos de línea: ITEM, COMMODITY (servicio), ACTIVOFIJO, ACTIVOFIJOMENOR — cada uno con su tab, modal de detalle y servicio.',
    'Campos de cabecera: glosa, prioridad, tipo; el ID se genera como RUC+ALMACÉN+DNI+TIMESTAMP.',
    'Líneas: código, producto/descripción, cantidad, proyecto (AFE), CECO, turno, labor, distribución contable.',
    'Validación de stock en línea solo para ITEM (modal-stock-validacion); soporta carga masiva (modal-carga-masiva) y solicitud de creación de item nuevo (SP LOGISTICA_solicitarCreacionItem).',
    'Registro: IndexedDB (estado=0, estados=PENDIENTE) → sincronización a API → estado=1. SPs: LOGISTICA_sincronizarRequerimientos / registrar-requerimiento-consumo / registrar-requerimiento-transferencia / crear-requerimiento-commodity / crear-requerimiento-activo-fijo(-menor).',
    'Adjuntos por requerimiento: guardar/listar/eliminar-adjunto-requerimiento.',
])
h3('Estados del requerimiento')
code('PENDIENTE → (aprobación N1 área → opcional N2 gerencia) → APROBADO / RECHAZADO / ANULADO\n'
     'APROBADO → CONSOLIDADO / EN_SC / DESPACHADO (según tipo COMPRA o CONSUMO)\n'
     'Saldos pendientes → SALDO_PENDIENTE → aprobación de saldo → consolidación o cierre')

h2('4.3 Aprobaciones')
h3('4.3.1 Aprobación de consumo por área — nivel 1 (/main/aprobaciones y /main/aprobaciones-area)')
bullets([
    'AprobadorGuard. El aprobador sincroniza pendientes filtrados por su rol/área.',
    'Si el usuario tiene área asignada, ve requerimientos de su área (requerimientos-pendientes-area-detalle); consulta stock por línea (consultar-stock-detalle-aprobacion).',
    'Aprobar: registra en SPRING la Requisición (SP LOGISTICA_registrarRequisicion_JSON / insertarRequisicionesWH) y devuelve RequisicionNumero; estados=APROBADO.',
    'Rechazar: exige motivo; estados=RECHAZADO. Soporta aprobación/rechazo individual y masivo (aprobar-rechazar-requerimiento).',
    'Anulación posterior: validar-anulacion-requerimiento + anular-requerimiento(-v2), con historial (listar-historial-anulaciones) y lista de anulables (obtener-requerimientos-anulables).',
    'Endpoints clave: aprobar-requerimiento-area, procesar-aprobacion-requerimiento, historial-aprobaciones-area, reporte-aprobaciones-area.',
])
h3('4.3.2 Aprobación de gerencia — nivel 2 (/main/aprobaciones-gerencia)')
bullets([
    'AprobadorNivel2Guard (rol aprobador, cadena nivel 2 legada o permiso N2 por ámbitos).',
    'Bandeja: obtener-requerimientos-pendientes-gerencia; decisión: aprobar-requerimiento-gerencia; consulta: obtener-requerimientos-aprobados-gerencia y dashboard-gerencia.',
    'Aprobadores N2 se administran con guardar/eliminar/reordenar/toggle-disponible-aprobador-nivel2.',
])
h3('4.3.3 Flujo de aprobación por ámbitos (motor configurable)')
bullets([
    'Endpoints api/logistica/aprobacion-ambitos: contexto, enviar, pendientes, decidir, reasignar, invalidar, historial, ruta-vigente, marcar-efecto.',
    'Configuración (aprobacion-ambitos/configuracion + CRUD de ámbito/área/asignación/regla): define rutas de aprobación por ámbito organizacional con reglas por monto/tipo.',
    'Simulación: listar-estructura-aprobacion-ambito y simular-ruta-aprobacion-ambito.',
    'Auto-aprobación: config-autoaprobacion / guardar-autoaprobacion / eliminar-autoaprobacion.',
    'Despliegue gradual: cambiar-despliegue y estado-regla controlan qué áreas migran al nuevo motor.',
])

h2('4.4 Ciclo de compras')
h3('4.4.1 Solicitudes de compra (/main/solicitudes-compra)')
bullets([
    'LogisticoGuard. Bandeja de SC: listar, crear, actualizar-estado, eliminar, contadores, listar-por-empresa, obtener-por-id, guardar-adjunto (api/logistica/solicitud-compra).',
    'Las SC nacen de requerimientos de compra aprobados (listar-requerimientos-compra-aprobados) o de consolidación.',
])
h3('4.4.2 Aprobación de SC (/main/aprobaciones-sc y admin-logistica/aprobar-sc)')
bullets([
    'api/logistica/aprobacion-sc: listar-pendientes, aprobar, rechazar, historial, contadores.',
    'Configuración: flujos/listar|guardar|eliminar y usuarios/listar|guardar|eliminar (aprobadores del flujo SC), roles disponibles vía GET roles.',
    'asignar-aprobadores define la ruta de aprobación por solicitud.',
])
h3('4.4.3 Consolidación de requerimientos (/main/consolidacion-requerimientos, -compras, -compra, -corporativa)')
bullets([
    'Agrupa líneas aprobadas de varios requerimientos en una consolidación de compra: listar-items/activos-fijos/activos-menores/commodities-pendientes-consolidacion → crear-consolidacion.',
    'Gestión: obtener-consolidacion, listar-historial-consolidaciones, anular-consolidacion, anular-linea-consolidacion, anular-item-pendiente.',
    'Solicitud de cotización: generar-solicitud-cotizacion, listar-solicitudes-cotizacion, actualizar-estado-solicitud-cotizacion.',
    'Saldos: registrar-saldo-pendiente-aprobacion → aprobación → migrar-saldo-directo-consolidacion; notificaciones de stock asociadas.',
    'Consolidación corporativa (/main/consolidacion-corporativa): consolidación multiempresa.',
    'Consolidación de servicios (/main/consolidacion-servicios): equivalente para SS/OS.',
])
h3('4.4.4 Cotizaciones (/main/cotizaciones)')
bullets([
    'Bandeja de solicitudes de cotización (compra y servicio): listar-solicitudes-cotizacion(-servicio).',
    'Registrar cotización por proveedor: registrar-cotizacion(-servicio); listar-cotizaciones(-por-solicitud).',
    'Cuadro comparativo: comparar-cotizaciones; adjudicación: seleccionar-proveedor-ganador.',
    'Cotización directa a OC: crear-cotizacion-oc, obtener/guardar-precios/anular/cerrar-cotizacion-oc.',
])
h3('4.4.5 Órdenes de compra (/main/ordenes-compra)')
bullets([
    'api/logistica/orden-compra: generar-desde-solicitud, listar, obtener-por-id, actualizar-estado, anular, contadores.',
    'Flujo nuevo (consolidación): crear-oc-borrador → guardar-adjunto-oc → enviar-oc-aprobacion → aprobación por niveles → confirmar-envio-oc (PDF + correo al proveedor) → sincronizar a SPRING.',
    'Flujo antiguo (compatibilidad): OC directa desde solicitud con aprobación propia.',
    'Gestión OC/OS (api/logistica, GestionOCOSController): listar-ocs-por-estado, obtener-detalle-oc, actualizar-oc-borrador, revertir-oc-a-pendiente, guardar-oc-directa, enviar-orden-pdf-proveedor, get-tipos-pago, listar-incoterms, obtener-seguimiento-oc.',
    'Adjuntos: guardar/listar/obtener/actualizar-adjunto-oc, recuperar-b64-adjunto, actualizar-consol-adjunto; reprocesar-adjuntos-spring (migración).',
    'Incremento OC: configuración vigente/historial/auditoría (admin-logistica) permite aumentar cantidades de una OC emitida.',
])
h3('4.4.6 Aprobación de OC/OS por niveles (/main/aprobaciones-oc, /main/aprobaciones-os)')
bullets([
    'AprobadorOCGuard (JLOLOGIST→JEMLOGIST→FINANZAS→GERENTE según monto; tabla LOGISTICA_FlujoAprobacionOC / LOGISTICA_AprobacionOrdenDetalle).',
    'api/logistica/aprobacion-oc: listar-pendientes, aprobar-rechazar, historial, contadores, asignar-aprobadores; configuración usuarios/flujos de aprobadores OC.',
    'api/logistica/aprobacion-os: equivalente para servicios + anular y obtener-detalle.',
    'api/consolidacion (AprobacionOrdenController, flujo nuevo): enviar-aprobacion-orden, listar-pendientes-aprobacion(-detallado), aprobar-orden, rechazar-orden, anular-orden, listar-historial-aprobacion, listar-aprobaciones-por-rol, listar-oc-pendientes-unificado.',
    'SP unificado LOGISTICA_aprobarRechazarOC soporta ambos flujos; al aprobar el último nivel la OC queda APROBADA.',
])
h3('4.4.7 Sincronización a SPRING')
bullets([
    'SP LOGISTICA_sincronizarordencompra / orden-compra/sincronizar y orden-servicio/sincronizar: genera NumeroOrden correlativo por serie (WHPO), inserta WH_OrdenCompra(+Detalle+Distribucion).',
    'Trunca campos CHAR del ERP (Observaciones 255, ProyectoDft 15, CentroCostoDft 10, CecoDestino 6, CampoReferencia 12, UltimoUsuario 20) — fix error 8152.',
    'estadoSpring en LOGISTICA_ConsolOC: PENDIENTE_SYNC → SYNCHRONIZED / ERROR_SYNC.',
    'Reintento: LOGISTICA_reintentarSyncSpring y endpoint reintentar-sync-spring (una o todas las fallidas); monitor: procesar-cola-spring y GET estado-cola-migracion.',
])
h3('4.4.8 Recepción de mercadería (/main/recepcion-mercaderia) y conformidad')
bullets([
    'AlmacenGuard. api/logistica/recepcion-oc: listar-ocs-para-recepcion, registrar (parcial/total), listar, obtener-por-id, validar, contadores.',
    'Ingreso a kardex: ingresar-kardex (también api/kardex/ejecutar-recepcion-oc).',
    'Conformidad de almacén (/main/conformidad-almacen, DevolucionConsumoGuard): api/logistica/conformidad-almacen listar/registrar/detalle — califica la recepción; recepciones no conformes alimentan devoluciones a proveedor.',
])
h3('4.4.9 Seguimiento y reportes de compras')
bullets([
    '/main/seguimiento-req-compra, /main/analisis-req-compra, /main/seguimiento-req-consumo (OperativoLogisticoGuard): trazabilidad req→SC→OC→recepción.',
    '/main/reportes-compras (LogisticoGuard): solicitudes-periodo, items-solicitados, eficiencia-aprobaciones, por-usuario, analisis-rechazos, comparativo-almacenes.',
    '/main/seguimiento de OS: api/logistica/seguimiento-os obtener.',
])

h2('4.5 Ciclo de servicios')
bullets([
    '/main/solicitudes-servicio (LogisticoGuard): api/logistica/solicitud-servicio guardar/listar/obtener-por-id/enviar/anular/contadores.',
    'Aprobación SS: aprobacion-ss/asignar-aprobadores, aprobacion-ss/aprobar-rechazar, aprobacion-ss/listar-pendientes (en OrdenServicioController) y tab aprobar-ss del panel admin-logistica.',
    'Cotización de servicio: cotizacion/guardar|listar|seleccionar.',
    'Órdenes de servicio (/main/ordenes-servicio): generar, listar, obtener-por-id, aprobar-rechazar, listar-pendientes-aprobacion, sincronizar (SPRING), ingresar-transporte.',
    'OS individuales desde requerimientos de servicio: listar-requerimientos-servicio-para-os, crear-os-individual, listar-os-individuales, obtener-precio-referencial-servicio.',
    'Conformidad de servicio (/main/conformidad-servicios, ConformidadServiciosGuard): registrar-conformidad-os / registrar-confirmacion-servicio; listar-para-conformidad y obtener-detalle-conformidad; plantilla configurable en admin-logistica.',
])

h2('4.6 Almacén e inventario')
h3('4.6.1 Despachos — salida NS (/main/despachos)')
bullets([
    'AlmacenGuard. Lista requerimientos APROBADOS de consumo.',
    'Cálculo de atención por línea: pendiente = solicitada − atendida; atender = min(pendiente, stock); compra = pendiente − stock. Estados: SIN STOCK / PARCIAL / COMPLETO.',
    'Registrar atención → POST api/logistica/generar-salida-ns → SP LOGISTICA_generarSalidaNSWH_JSON crea la salida NS en SPRING (WH_TransaccionHeader/Detalle + kardex + stock).',
    'Actualiza cantidades atendidas; al completar, estados=DESPACHADO; registro local en logistica_despachos (registrar-despacho, listar-despachos).',
    'Saldos: cuando no hay stock total, se genera saldo pendiente (listar-mis-saldos, confirmar-atencion-saldo, cerrar-saldo, cerrar-requerimiento) con notificación al solicitante cuando llega stock.',
    'Pantallas relacionadas: /main/despachos-original, reporte-despachos, reporte-saldos, saldo-requerimiento.',
])
h3('4.6.2 Transferencias de almacén (/main/transferencias-almacen)')
bullets([
    'AlmacenGuard; solo requerimientos tipo TRANSFERENCIA (creados por LOLOGIST).',
    'Endpoints: crear-requerimiento-transferencia, listar-transferencias-pendientes, detalle-requerimiento-transferencia, ejecutar-transferencia, listar-historial-transferencias.',
])
h3('4.6.3 Kardex y stock (/main/kardex)')
bullets([
    'AlmacenGuard. api/kardex: registrar/procesar-transaccion, listar-transacciones, obtener-detalle-transaccion, consultar-kardex, consultar-stock, reporte-valorizacion (promedio ponderado), dashboard-inventario, anular-transaccion.',
    'Sincronización SPRING: sincronizar-spring, ejecutar-sincronizacion-spring, verificar-estado-sincronizacion (LOGISTICA_SincronizacionSpringLog).',
    'Tablas: LOGISTICA_TransaccionInventario, LOGISTICA_DetalleTransaccionInventario, LOGISTICA_Kardex, LOGISTICA_Stock, LOGISTICA_Item, LOGISTICA_Almacen.',
])
h3('4.6.4 Gestión de inventario (/main/gestion-inventario)')
bullets([
    'AlmacenGuard. api/logistica/gestion-inventario: ajustes listar/crear/aprobar; conteos listar/crear/registrar-fisico/finalizar/detalle.',
])
h3('4.6.5 Listas de stock (/main/listas-stock)')
bullets([
    'AlmacenGuard. api/logistica/listas-stock: listar/crear/actualizar/eliminar listas; verificar-stock; generar-alertas, listar-alertas, atender-alerta (notificaciones de quiebre de stock).',
])
h3('4.6.6 Devoluciones y reingresos')
bullets([
    '/main/devoluciones-proveedores (AlmacenGuard): api/logistica/devolucion-proveedor registrar/listar/obtener-por-id/cambiar-estado/resolver/anular; generar-desde-recepcion desde listar-recepciones-no-conformes.',
    '/main/devoluciones-consumo (DevolucionConsumoGuard): api/logistica/devolucion-consumo registrar/listar/obtener-por-id/aprobar/rechazar/anular/listar-despachos-consumo.',
    '/main/reingresos (ReingresoGuard): api/logistica/reingreso registrar/listar/obtener-por-id/aprobar/rechazar/anular/listar-saldos-pendientes/generar-desde-saldo.',
])

h2('4.7 Maestros y catálogos')
bullets([
    '/main/maestros (AdministradorGuard): tabs items y comodities — listar-item(-slim/-version), listar-commodity, listar-subcommodity, registrar-item, registrar-commodity, item-correlativo(-nuevo).',
    '/main/maestro-proveedores (AdministradorOAlmacenGuard): listar-proveedores, registrar-proveedor.',
    '/main/evaluacion-proveedores (AlmacenGuard): evaluación de desempeño.',
    '/main/catalogo-items: catálogo consultable.',
    '/main/aprobadores (AdministradorGuard): mantenedor de aprobadores.',
    'Unidades de medida: api/logistica/maestros unidades-medida (GET) + guardar/eliminar.',
    'Tipo de cambio: api/logistica/tipo-cambio obtener.',
])
h2('4.8 Notificaciones y reportes operativos')
bullets([
    '/main/notificaciones: bandeja de notificaciones del usuario (stock disponible, directas, almacén, solicitante): listar-mis-notificaciones(-directas/-stock), marcar-notificacion-leida, registrar-notificacion-*, notificar-stock-disponible.',
    '/main/reporte-requerimientos, /main/reporte_logistico, /main/reporte-aprobados, /main/reporte-aprobaciones-area, /main/reporte-despachos, /main/reporte-saldos: filtros, detalle modal, exportación a Excel.',
    'Acceso a reportes configurable por usuario/área: listar/guardar-acceso-reporte, listar/guardar-area-acceso-reporte, listar/guardar-config-reporte-menu, verificar-menu-reporte.',
])
h2('4.9 Dashboards por rol')
table(['Ruta', 'Rol destino', 'Contenido'], [
    ['/main/dashboard-logistica', 'LOLOGIST', 'KPIs requerimientos, por mes/estado, seguimiento órdenes, entregas del día, estado almacén, resumen/gastos compras, OC/OS, SC, proveedores, reportes (compras, inventario, proveedores, tiempos, gastos, consolidado)'],
    ['/main/dashboard-oplogist', 'Operativo (OPLOGIST y afines)', 'Requerimientos propios, contadores, despachos por mes'],
    ['/main/dashboard-jlologist', 'JLOLOGIST', 'KPIs, requerimientos y OC recientes, detalle de items'],
    ['/main/dashboard-jemlogist', 'JEMLOGIST', 'Indicadores de licitaciones/compras'],
    ['/main/dashboard-adlogist', 'ADLOGIST', 'Dashboard administrativo'],
    ['/main/dashboard-tilogist', 'TILOGIST', 'Dashboard TI'],
    ['/main/dashboard-despacho', 'ALLOGIST', 'Indicadores de despacho/almacén'],
    ['/main/dashboard-finanzas', 'FINANZAS', 'Aprobaciones OC y gastos'],
    ['/main/dashboard-gerencia', 'Aprobador/gerencia', 'Indicadores de aprobación gerencia'],
    ['/main/dashboard-aprobaciones-area', 'APLOGIST', 'Indicadores de aprobaciones por área'],
    ['/main/dashboard-compras', 'LOLOGIST', 'KPIs SC, por estado, tendencia, top items, recientes, estadísticas almacén'],
], widths=[1.9, 1.6, 3.7])
doc.add_page_break()

# ================================================================ 5. ADMIN-LOGIN / ADMINISTRACION
h1('5. Módulo admin-login → /administracion (Administración global)')
p('Panel de administración de nivel sistema (TI). Se accede por /admin-login con credenciales validadas por el '
  'SP LOGISTICA_loginAdmin. Protegido por AdminGuard (ADMIN_TOKEN). Layout: AdminLayoutComponent con menú propio.')
h2('5.1 Pantallas y configuraciones')
table(['Ruta /administracion/…', 'Pantalla', 'Qué configura / hace'], [
    ['dashboard', 'Dashboard', 'KPIs del panel administrativo (usuarios, flujos, actividad).'],
    ['admin-usuarios', 'Usuarios', 'Configuración de usuarios logística: documento, área, perfil, es_aprobador, nivel_aprobacion, monto_maximo_aprobacion, puede_crear/aprobar_requerimientos, notificaciones_email, estado. SPs: LOGISTICA_listarUsuariosLogistica / configurarUsuarioLogistica.'],
    ['admin-roles', 'Roles', 'Permisos por rol y módulo (REQUERIMIENTOS/APROBACIONES/REPORTES/ADMINISTRACION): crear, editar, eliminar, aprobar, ver reportes, administrar, estado. SPs: listarRolesLogistica / configurarRolLogistica.'],
    ['admin-areas', 'Áreas', 'CRUD de áreas organizacionales (listar/crear/actualizar/eliminar-area).'],
    ['admin-perfiles', 'Perfiles', 'CRUD de perfiles y asignación de roles a perfil; asignar/quitar perfil a usuario; los roles del perfil se suman como roles efectivos (listar-roles-efectivos).'],
    ['admin-flujos', 'Flujos', 'Flujos de aprobación: nombre, código, área, tipo requerimiento (COMPRA/CONSUMO/TRANSFERENCIA), monto_minimo/maximo, orden, estado.'],
    ['admin-aprobadores', 'Aprobadores', 'Asignación de aprobadores por flujo: documento, flujo, área, nivel_aprobacion, monto_maximo, puede_delegar, es_aprobador_final, estado.'],
    ['usuarios-por-area', 'Usuarios por área', 'Matriz usuario↔área para aprobaciones por área.'],
    ['admin-version-api', 'Versión API / Despliegues', 'Control de versiones desplegadas (api/app-deployments current/history) para la PWA.'],
    ['admin-proveedores-email', 'Correos de proveedores', 'Correos por proveedor para envío de OC: listar/crear/actualizar/eliminar-proveedor-email.'],
    ['admin-config-smtp', 'Configuración SMTP', 'Servidor SMTP por empresa: listar/guardar/probar-conexion/eliminar-config-smtp.'],
    ['admin-plantilla-correo', 'Plantillas de correo', 'Plantillas HTML de correos del sistema: listar/guardar/eliminar-plantilla-correo.'],
    ['admin-plantilla-pdf', 'Plantillas PDF', 'Plantillas PDF (OC, guías, formatos): listar/guardar/eliminar-plantilla-pdf.'],
    ['configuracion-colores', 'Colores', 'Paleta de colores de la aplicación.'],
    ['admin-permisos-roles', 'Permisos por rol', 'Matriz de permisos rol↔funcionalidad.'],
    ['admin-menus-layout', 'Menús layout', 'Estructura del menú lateral del layout.'],
    ['admin-menus-dinamicos', 'Menús dinámicos', 'Definición de opciones de menú dinámico (api/configmenu listar/guardar/eliminar).'],
    ['admin-permisos-menu-dinamico', 'Permisos menú dinámico', 'Asignación rol↔opción de menú dinámico.'],
    ['admin-plantillas-menu', 'Plantillas de menú', 'Plantillas reutilizables de menús por perfil.'],
    ['admin-plantilla-almacen', 'Plantilla almacén', 'Formatos de impresión/documentos de almacén.'],
    ['admin-empresas', 'Empresas', 'Administración de empresas (multi-RUC): listar-empresas, obtener/guardar-config-empresa, listar-empresas-con-carpeta.'],
    ['admin-config-branding', 'Branding', 'Marca por empresa: obtener/guardar-config-branding (logo, colores, nombre comercial).'],
    ['admin-sincronizacion', 'Sincronización', 'Sincronización de tablas maestras con el ERP/API Maestra; ejecutar-sincronizacion-items, ver-log-sincronizacion.'],
    ['admin-notificaciones-config', 'Notificaciones', 'Tipos de notificación, configuraciones y parámetros (api/logistica/notificacion-config).'],
], widths=[1.6, 1.7, 3.9])
doc.add_page_break()

# ================================================================ 6. ADMIN-LOGISTICA
h1('6. Módulo admin-logistica (panel administrativo de logística)')
p('Panel independiente con login propio (/admin-logistica/login → api/logistica/admin-logistica/auth/login). '
  'Roles habilitados: TILOGIST, ADLOGIST, JLOLOGIST. El menú se controla por claves ADMINLG_MENU_* configurables '
  'con fallback por rol. Todas las opciones de configuración las consume el AdminLogisticaController '
  '(api/logistica/admin-logistica/*).')
h2('6.1 Menú y pantallas operativas')
table(['Ruta', 'Pantalla', 'Descripción', 'Visibilidad'], [
    ['dashboard', 'Dashboard', 'KPIs del panel (GET dashboard): pendientes, aprobaciones, actividad.', 'Todos'],
    ['bandeja', 'Bandeja Aprobaciones', 'Bandeja unificada de pendientes por aprobar.', 'Todos'],
    ['aprobar-consumo', 'Aprobar Consumo', 'Aprobación de requerimientos de consumo.', 'Todos'],
    ['aprobar-sc', 'Aprobar Solicitud Compra', 'Aprobación de SC (flujo aprobacion-sc).', 'No JLOLOGIST'],
    ['aprobar-ss', 'Aprobar Solicitud Servicio', 'Aprobación de SS.', 'No JLOLOGIST'],
    ['aprobar-gerencia', 'Aprobar Gerencia', 'Bandeja de aprobación nivel gerencia.', 'Todos'],
    ['maestros', 'Maestros', 'Mantenimiento de maestras (items, commodities, unidades de medida).', 'Todos'],
    ['proveedores', 'Gestión Proveedores', 'Proveedores: listar/registrar, datos de pago, moneda, detracción.', 'Todos'],
    ['usuarios', 'Usuarios', 'Gestión de usuarios de logística: búsqueda en ERP, creación, edición, estado, rol. JLOLOGIST solo roles operativos.', 'canCreateUsers()'],
], widths=[1.3, 1.7, 3.4, 1.0])

h2('6.2 Configuraciones del panel')
table(['Ruta', 'Pantalla', 'Configuración / endpoints'], [
    ['areas', 'Áreas', 'CRUD áreas y subáreas + sincronizar catálogo desde ERP: areas/listar|crear|actualizar|eliminar|sincronizar-catalogo, subareas/*.'],
    ['usuario-area', 'Usuarios por Área', 'Asignación usuario↔área (jefes de área): usuarios-por-area/listar|crear|actualizar|eliminar; sincronizar usuarios desde ERP (usuarios/sincronizar-erp).'],
    ['flujo-aprobacion-area', 'Flujo Aprobación Área', 'Ruta de aprobación por área: listar/guardar/eliminar-flujo-aprobacion-area, listar-areas-flujo.'],
    ['config-flujo-aprobacion', 'Flujo por Niveles', 'Configuración del flujo por niveles/ámbitos: listar/guardar-config-flujo, aprobadores N2, estructura y simulación de ruta.'],
    ['pdf', 'Formato PDF', 'Configuración del PDF de OC/OTros: GET/POST pdf-config (logo, colores, textos, campos visibles).'],
    ['empresa', 'Empresa', 'Datos y configuración de la empresa: obtener/guardar-config-empresa, listar-empresas(-con-carpeta).'],
    ['parametros', 'Parámetros', 'Parámetros clave-valor del sistema: GET/POST parametros.'],
    ['incremento-oc', 'Incremento Cantidad OC', 'Reglas de incremento de cantidad en OC emitidas: incremento-oc/vigente, guardar, historial, auditoria.'],
    ['aprobadores', 'Aprobadores', 'Mantenedor de aprobadores por flujo/nivel/monto.'],
    ['auditoria', 'Auditoría', 'Log de acciones del panel: GET auditoria con filtros fechaInicio/fechaFin/tipo/usuario.'],
    ['almacen', 'Plantillas Almacén', 'Plantillas de documentos de almacén por tipo/RUC: GET/POST plantilla-almacen; búsqueda de almacenero por RUC.'],
    ['conformidad-servicio', 'Conformidad Servicio', 'Plantilla de conformidad de servicio por RUC: GET/POST plantilla-conformidad-servicio; búsqueda de responsable (lologist-por-ruc).'],
    ['permisos-rol', 'Permisos por Rol', 'Matriz de permisos por rol (ConfiguracionPermisoController): listar/guardar/obtener-config-permiso, listar-config-permisos(-legacy), obtener-menu-config, listar-roles-con-menu, eliminar.'],
    ['migracion-adjuntos', 'Migrar Adjuntos', 'Reproceso/migración de adjuntos hacia SPRING: reprocesar-adjuntos-spring.'],
    ['accesos-reportes', 'Accesos Reportes', 'Control de acceso a reportes por usuario y por área: listar/guardar-acceso-reporte, listar/guardar-area-acceso-reporte, config-reporte-menu, verificar-menu-reporte, buscar-usuario-por-dni.'],
    ['mantenimiento', 'Mantenimiento', 'Utilidades de datos: mantenimiento/limpiar-data, detalle-tabla, backups, restaurar-data (acciones destructivas controladas).'],
    ['solicitudes-item', 'Solicitudes de ítem', 'Solicitudes de creación de ítem nuevo: solicitar-creacion-item, GET solicitudes-item.'],
    ['logistica-usuarios', 'Usuarios logística (v2)', 'CRUD extendido: GET/POST/PUT logistica-usuarios + cambio de estado.'],
], widths=[1.5, 1.7, 4.0])
doc.add_page_break()

# ================================================================ 7. API .NET
h1('7. API REST (api_logistica — ASP.NET Core)')
h2('7.1 Arquitectura y configuración')
bullets([
    'Capas: Domain (Models, Repository, Service, UseCase) → Application (UseCaseImpl) → Infraestructure (Controller, Middleware, Persistence, RepositoryImpl, ServiceImpl, Shared, UseCase).',
    'Patrón Controller → UseCase → Repository → Stored Procedure. Repositorios y casos de uso registrados por DI (AddScoped) en Program.cs.',
    'Persistencia: ApplicationDbContext (EF Core, AddDbContextPool) con cadena DefaultConnection; la lógica vive en SPs LOGISTICA_*.',
    'Middleware: Infraestructure/Middleware + Shared/Exceptions (manejo centralizado de errores).',
    'CORS AllowAll; compresión de respuesta Brotli + Gzip (Fastest, también HTTPS); Swagger habilitado.',
    'ConnectionStrings: Server=172.16.20.25; Database=LOGISTICA_QAS (entorno QAS documentado; producción usa su propia cadena).',
])
h2('7.2 Controladores y endpoints')
p('Resumen por controlador (ruta base → endpoints). Los detalles de request/response están en los repositorios; '
  'la convención general es POST con body JSON (JsonElement) que se envía al SP correspondiente.')
api = [
    ('LogisticaController', 'api/logistica', 'Requerimientos, maestras, saldos, despachos, notificaciones, administración, reportes, accesos a reportes, admin-login, transferencias, cola SPRING'),
    ('RequerimientosController', 'api/logistica', 'crear/listar/actualizar requerimiento commodity, activo fijo, activo fijo menor'),
    ('AprobacionesController', 'api/logistica', 'requerimientos-pendientes, aprobar-requerimiento, historial, pendientes por tipo (items/servicios/activos), aprobar-rechazar'),
    ('AprobacionesPorAreaController', 'api/logistica', 'aprobación por área: pendientes, detalle, stock, aprobar, historial, reporte, flujo por área, adjuntos, anulación, ámbitos N2, gerencia, dashboard'),
    ('AprobacionAmbitosController + Config', 'api/logistica/aprobacion-ambitos', 'motor configurable: contexto, enviar, pendientes, decidir, reasignar, invalidar, historial, ruta-vigente; configuración de ámbitos/áreas/reglas/autoaprobación/despliegue'),
    ('ConsolidacionController', 'api/consolidacion', 'pendientes por tipo, crear/obtener/historial/anular consolidación, solicitudes de cotización, saldos pendientes, notificaciones, cotización→OC'),
    ('SolicitudCompraController', 'api/logistica/solicitud-compra', 'CRUD SC, estados, adjuntos, contadores, por empresa'),
    ('AprobacionSCController', 'api/logistica/aprobacion-sc', 'pendientes, aprobar/rechazar, historial, contadores, flujos y usuarios aprobadores, roles'),
    ('CotizacionController', 'api/logistica', 'solicitudes de cotización (compra/servicio), registrar, listar, comparar, seleccionar ganador'),
    ('OrdenCompraController', 'api/logistica/orden-compra', 'generar desde solicitud, listar, obtener, estados, anular, contadores, sincronizar(-consolidacion)'),
    ('OrdenServicioController', 'api/logistica/orden-servicio', 'generar, listar, obtener, aprobación OS y SS, cotización, sincronizar, transporte, conformidad'),
    ('AprobacionOCController', 'api/logistica/aprobacion-oc', 'pendientes, aprobar/rechazar, historial, contadores, usuarios/flujos aprobadores'),
    ('AprobacionOSController', 'api/logistica/aprobacion-os', 'pendientes, historial(-os), aprobar/rechazar, anular, detalle, usuarios/flujos'),
    ('AprobacionOrdenController', 'api/consolidacion', 'flujo nuevo: enviar, pendientes(-detallado), aprobar/rechazar/anular orden, historial, por rol, crear OC/OS desde consolidación, reintentar sync'),
    ('GestionOCOSController', 'api/logistica', 'gestión OC/OS: borradores, adjuntos, estados, seguimiento, PDF proveedor, empresa config, permisos, OS individuales, confirmación servicio'),
    ('RecepcionOCController', 'api/logistica/recepcion-oc', 'registrar recepción, listar, detalle, validar, ingresar-kardex, contadores, OCs recepcionables'),
    ('ConformidadAlmacenController', 'api/logistica/conformidad-almacen', 'listar/registrar/detalle conformidad de recepciones'),
    ('KardexController', 'api/kardex', 'transacciones, kardex, stock, valorización, dashboard, anulación, recepción OC, sincronización SPRING'),
    ('GestionInventarioController', 'api/logistica/gestion-inventario', 'ajustes (listar/crear/aprobar) y conteos físicos (crear/registrar/finalizar)'),
    ('ListasStockController', 'api/logistica/listas-stock', 'listas de stock CRUD, verificar stock, alertas'),
    ('DevolucionProveedorController', 'api/logistica/devolucion-proveedor', 'registrar, listar, detalle, estados, resolver, anular, desde recepción no conforme'),
    ('DevolucionConsumoController', 'api/logistica/devolucion-consumo', 'registrar, listar, detalle, aprobar/rechazar/anular, despachos de consumo'),
    ('ReingresoController', 'api/logistica/reingreso', 'registrar, listar, detalle, aprobar/rechazar/anular, desde saldos pendientes'),
    ('DashboardLogisticaController', 'api/logistica/dashboard-logistica', '18 endpoints de KPIs y reportes (compras, inventario, proveedores, tiempos, gastos, consolidado)'),
    ('DashboardComprasController', 'api/logistica/dashboard-compras', 'KPIs SC, estados, tendencia, top items, recientes, estadísticas almacén'),
    ('DashboardJlologistController', 'api/logistica/dashboard-jlologist', 'KPIs, req/OC recientes, items detalle'),
    ('ReportesComprasController', 'api/logistica/reportes-compras', 'solicitudes por período, items, eficiencia, por usuario, rechazos, comparativo almacenes'),
    ('SolicitudServicioController', 'api/logistica/solicitud-servicio', 'guardar, listar, detalle, enviar, anular, contadores'),
    ('SeguimientoOSController', 'api/logistica/seguimiento-os', 'seguimiento de OS'),
    ('AuthController', 'api/logistica/auth', 'login-rol (fallback roles whitelist)'),
    ('AdminLogisticaController', 'api/logistica/admin-logistica', 'login del panel, usuarios, parámetros, incremento OC, pdf-config, plantillas almacén/conformidad, auditoría, dashboard, áreas/subáreas, usuarios-por-área, usuarios ERP, mantenimiento/backups'),
    ('AppDeploymentsController', 'api/app-deployments', 'current / history — control de versiones PWA'),
    ('BrandingController', 'api/logistica', 'obtener/guardar-config-branding'),
    ('ConfigMenuController', 'api/configmenu', 'listar/guardar/eliminar menús dinámicos'),
    ('ConfigSmtpController', 'api/logistica', 'listar/guardar/probar/eliminar-config-smtp'),
    ('ConfiguracionPermisoController', 'api/ConfiguracionPermiso', 'permisos por rol (nuevo + legacy), menú config, roles con menú'),
    ('NotificacionConfigController', 'api/logistica/notificacion-config', 'tipos, configuraciones y parámetros de notificaciones'),
    ('PlantillaCorreoController', 'api/logistica', 'CRUD plantillas de correo'),
    ('PlantillaPdfController', 'api/logistica', 'CRUD plantillas PDF'),
    ('ProveedorEmailController', 'api/logistica', 'CRUD correos de proveedores'),
    ('TipoCambioController', 'api/logistica/tipo-cambio', 'tipo de cambio'),
    ('UnidadMedidaController', 'api/logistica/maestros', 'unidades de medida CRUD'),
]
table(['Controlador', 'Ruta base', 'Responsabilidad'], api, widths=[1.9, 1.9, 3.4])
h3('Listado completo de endpoints por controlador')
p('Convención: todos los endpoints funcionales son POST con body JSON salvo los GET indicados. '
  'Ver sección de código fuente para el detalle de parámetros.', italic=True)
endpoints = {
 'AppDeploymentsController (api/app-deployments)': 'GET current, GET history',
 'AuthController (api/logistica/auth)': 'login-rol',
 'LogisticaController (api/logistica)': ('listar-requerimientos, listar-requerimientos-aprobados, listar-requerimientos-compra-aprobados, '
   'listar-requerimiento-consumo, listar-requerimiento-transferencia, registrar-requerimiento-consumo, registrar-requerimiento-transferencia, '
   'reporte-requerimientos, listar-item, listar-item-slim, listar-item-version, ver-log-sincronizacion, ejecutar-sincronizacion-items, '
   'listar-commodity, listar-subcommodity, registrar-item, registrar-commodity, listar-saldos, aprobar-requerimientos, '
   'reporte-requerimientos-aprobados, item-correlativo, item-correlativo-nuevo, requerimiento-correlativo-nuevo, lista-empresa, '
   'registra-requerimientos-aprobados, listar-almacen, listar-numero-requision, generar-reporte-requerimientos, '
   'reporte-seguimiento-compras, reporte-seguimiento-compras-analisis, reporte-seguimiento-consumos, '
   'listar-acceso-reporte, guardar-acceso-reporte, listar-config-reporte-menu, guardar-config-reporte-menu, verificar-menu-reporte, '
   'buscar-usuario-por-dni, listar-areas-acceso-reporte, guardar-area-acceso-reporte, admin-login, '
   'listar-areas, crear-area, actualizar-area, eliminar-area, listar-usuarios-logistica, configurar-usuario-logistica, '
   'listar-roles-logistica, configurar-rol-logistica, listar-perfiles, crear-perfil, asignar-roles-perfil, actualizar-perfil, '
   'eliminar-perfil, obtener-perfil, asignar-perfil-usuario, quitar-perfil-usuario, listar-perfiles-usuario, listar-roles-efectivos, '
   'listar-flujos, crear-flujo, actualizar-flujo, eliminar-flujo, listar-aprobadores, crear-aprobador, listar-proveedores, registrar-proveedor, '
   'generar-salida-ns, actualizar-estado-requerimiento, saldos-lote-item, listar-despachos, registrar-despacho, procesar-cola-spring, '
   'GET estado-cola-migracion, listar-detalle-requerimiento, validar-stock-items, eliminar-requerimiento, listar-mis-saldos, '
   'confirmar-atencion-saldo, cerrar-saldo, validar-ids-detalles, cerrar-requerimiento, registrar-saldo-pendiente-aprobacion, '
   'listar-saldos-pendientes-aprobacion, aprobar-rechazar-saldo-pendiente, migrar-saldo-directo-consolidacion, '
   'registrar-notificacion-stock, registrar-notificacion-almacen, registrar-notificacion-solicitante, listar-mis-notificaciones, '
   'listar-mis-notificaciones-directas, listar-mis-notificaciones-stock, notificar-stock-disponible, registrar-requerimiento-commodity-aprobado, '
   'listar-requerimientos-usuario-dashboard, dashboard-contadores, dashboard-despachos-por-mes, crear-requerimiento-transferencia, '
   'listar-transferencias-pendientes, detalle-requerimiento-transferencia, ejecutar-transferencia, listar-historial-transferencias'),
 'RequerimientosController (api/logistica)': 'crear-requerimiento-commodity, listar-requerimientos-commodity, actualizar-requerimiento-commodity, crear-requerimiento-activo-fijo, crear-requerimiento-activo-fijo-menor',
 'AprobacionesController (api/logistica)': 'requerimientos-pendientes, aprobar-requerimiento, historial-aprobaciones, listar-requerimientos-pendientes-aprobacion, listar-servicios-pendientes-aprobacion, listar-activos-fijos-pendientes-aprobacion, aprobar-rechazar-requerimiento, aprobar-rechazar-servicio',
 'AprobacionesPorAreaController (api/logistica)': ('obtener-usuarios-por-area, obtener-aprobador-por-area, obtener-flujo-completo-aprobacion, asignar-aprobadores-requerimiento, '
   'registrar-requerimiento, obtener-requerimientos-pendientes-aprobacion, procesar-aprobacion-requerimiento, obtener-requerimientos-con-aprobacion, '
   'GET obtener-dashboard-aprobaciones/{documentoidentidad}, requerimientos-pendientes-area, requerimientos-pendientes-area-detalle, '
   'consultar-stock-detalle-aprobacion, aprobar-requerimiento-area, historial-aprobaciones-area, obtener-area-usuario, reporte-aprobaciones-area, '
   'listar-flujo-aprobacion-area, guardar-flujo-aprobacion-area, eliminar-flujo-aprobacion-area, listar-areas-flujo, '
   'guardar-adjunto-requerimiento, listar-adjuntos-requerimiento, eliminar-adjunto-requerimiento, validar-anulacion-requerimiento, '
   'anular-requerimiento, anular-requerimiento-v2, listar-historial-anulaciones, obtener-requerimientos-anulables, '
   'listar-estructura-aprobacion-ambito, simular-ruta-aprobacion-ambito, listar-config-flujo, guardar-config-flujo, '
   'listar-aprobadores-nivel2, guardar-aprobador-nivel2, eliminar-aprobador-nivel2, reordenar-aprobador-nivel2, toggle-disponible-aprobador-n2, '
   'es-aprobador-nivel2, obtener-requerimientos-pendientes-gerencia, aprobar-requerimiento-gerencia, obtener-requerimientos-aprobados-gerencia, dashboard-gerencia'),
 'AprobacionAmbitosController (api/logistica/aprobacion-ambitos)': 'contexto, enviar, pendientes, decidir, reasignar, invalidar, historial, ruta-vigente, marcar-efecto',
 'AprobacionAmbitosConfigController (api/logistica/aprobacion-ambitos)': 'configuracion, guardar-ambito, guardar-area, guardar-asignacion, guardar-regla, estado-regla, cambiar-despliegue, config-autoaprobacion, guardar-autoaprobacion, eliminar-autoaprobacion',
 'ConsolidacionController (api/consolidacion)': ('listar-items/activos-fijos/activos-menores/commodities-pendientes-consolidacion, crear-consolidacion, obtener-consolidacion, '
   'listar-historial-consolidaciones, generar-solicitud-cotizacion, listar-solicitudes-cotizacion, actualizar-estado-solicitud-cotizacion, '
   'anular-consolidacion, obtener-detalle-requerimiento, anular-linea-consolidacion, anular-item-pendiente, registrar-saldo-pendiente-aprobacion, '
   'listar-saldos-pendientes-aprobacion, aprobar-rechazar-saldo-pendiente, migrar-saldo-directo-consolidacion, listar-mis-notificaciones, '
   'insertar-notificacion-stock, marcar-notificacion-leida, crear-cotizacion-oc, obtener-cotizacion-oc, guardar-precios-cotizacion-oc, '
   'listar-cotizaciones-oc, anular-cotizacion-oc, cerrar-cotizacion-oc'),
 'AprobacionOrdenController (api/consolidacion)': 'enviar-aprobacion-orden, listar-pendientes-aprobacion(-detallado), aprobar-orden, rechazar-orden, anular-orden, listar-historial-aprobacion, crear-oc-desde-consolidacion, crear-os-desde-consolidacion, obtener-oc-desde-consolidacion, obtener-os-desde-consolidacion, listar-aprobaciones-por-rol, reintentar-sync-spring, listar-oc-pendientes-unificado',
 'SolicitudCompraController (api/logistica/solicitud-compra)': 'listar, crear, actualizar-estado, eliminar, contadores, listar-por-empresa, obtener-por-id, guardar-adjunto',
 'AprobacionSCController (api/logistica/aprobacion-sc)': 'listar-pendientes, aprobar, rechazar, asignar-aprobadores, historial, contadores, flujos/listar|guardar|eliminar, usuarios/listar|guardar|eliminar, GET roles',
 'CotizacionController (api/logistica)': 'listar-solicitudes-cotizacion, listar-solicitudes-cotizacion-servicio, registrar-cotizacion, registrar-cotizacion-servicio, listar-cotizaciones, listar-cotizaciones-por-solicitud, comparar-cotizaciones, seleccionar-proveedor-ganador',
 'OrdenCompraController (api/logistica/orden-compra)': 'generar-desde-solicitud, listar, obtener-por-id, actualizar-estado, anular, contadores, sincronizar, sincronizar-consolidacion',
 'OrdenServicioController (api/logistica/orden-servicio)': 'generar, listar, obtener-por-id, asignar-aprobadores, aprobar-rechazar, listar-pendientes-aprobacion, registrar-conformidad, aprobacion-ss/{asignar-aprobadores,aprobar-rechazar,listar-pendientes}, cotizacion/{guardar,listar,seleccionar}, sincronizar, ingresar-transporte, listar-para-conformidad, obtener-detalle-conformidad',
 'AprobacionOCController (api/logistica/aprobacion-oc)': 'asignar-aprobadores, aprobar-rechazar, listar-pendientes, historial, contadores, usuarios/{guardar,listar,eliminar}, flujos/{listar,guardar,eliminar}',
 'AprobacionOSController (api/logistica/aprobacion-os)': 'contadores, listar-pendientes, historial, historial-os, aprobar-rechazar, anular, obtener-detalle, listar-usuarios-aprobadores, listar-flujos, crear/actualizar/eliminar-usuario-aprobador, crear/actualizar/eliminar-flujo',
 'GestionOCOSController (api/logistica)': ('listar-requerimientos-para-oc, listar-requerimientos-para-os, crear-oc-borrador, enviar-oc-aprobacion, aprobar-oc-spring, '
   'revertir-oc-a-pendiente, confirmar-envio-oc, listar-ocs-por-estado, guardar-adjunto-oc, listar-adjuntos-oc, obtener-adjunto-oc, '
   'actualizar-adjunto-oc, actualizar-consol-adjunto, recuperar-b64-adjunto, crear-os-borrador, enviar-os-aprobacion, listar-oss-por-estado, '
   'registrar-conformidad-os, obtener-config-empresa, listar-empresas, listar-empresas-con-carpeta, guardar-config-empresa, '
   'obtener-seguimiento-oc, listar-requerimientos-completos, obtener-oc-para-sincronizar, get-tipos-pago, listar-incoterms, '
   'enviar-orden-pdf-proveedor, guardar-oc-directa, obtener-detalle-oc, actualizar-oc-borrador, guardar-aprobador-oc, '
   'listar-config-permisos, verificar-permiso, guardar-config-permiso, listar-requerimientos-servicio-para-os, crear-os-individual, '
   'obtener-precio-referencial-servicio, registrar-confirmacion-servicio, listar-os-individuales'),
 'RecepcionOCController (api/logistica/recepcion-oc)': 'registrar, listar, obtener-por-id, validar, ingresar-kardex, contadores, listar-ocs-para-recepcion',
 'ConformidadAlmacenController (api/logistica/conformidad-almacen)': 'listar, registrar, detalle',
 'KardexController (api/kardex)': 'registrar-transaccion, procesar-transaccion, listar-transacciones, obtener-detalle-transaccion, consultar-kardex, consultar-stock, reporte-valorizacion, dashboard-inventario, anular-transaccion, probar-flujo-completo, ejecutar-recepcion-oc, sincronizar-spring, ejecutar-sincronizacion-spring, verificar-estado-sincronizacion',
 'GestionInventarioController (api/logistica/gestion-inventario)': 'ajustes/{listar,crear,aprobar}, conteos/{listar,crear,registrar-fisico,finalizar,detalle}',
 'ListasStockController (api/logistica/listas-stock)': 'listar, crear, actualizar, eliminar, verificar-stock, generar-alertas, listar-alertas, atender-alerta',
 'DevolucionProveedorController (api/logistica/devolucion-proveedor)': 'registrar, listar, obtener-por-id, cambiar-estado, resolver, anular, listar-recepciones-no-conformes, generar-desde-recepcion',
 'DevolucionConsumoController (api/logistica/devolucion-consumo)': 'registrar, listar, obtener-por-id, aprobar, rechazar, anular, listar-despachos-consumo',
 'ReingresoController (api/logistica/reingreso)': 'registrar, listar, obtener-por-id, aprobar, rechazar, anular, listar-saldos-pendientes, generar-desde-saldo',
 'DashboardLogisticaController (api/logistica/dashboard-logistica)': 'kpis-requerimientos, requerimientos-por-mes, seguimiento-ordenes, entregas-hoy, estado-almacen, resumen-compras, gastos-mensuales, ordenes-compra, ordenes-servicio, solicitudes-compra, proveedores, requerimientos-por-estado, reporte-{compras,inventario,proveedores,tiempos,gastos,consolidado}',
 'DashboardComprasController (api/logistica/dashboard-compras)': 'kpis, solicitudes-por-estado, tendencia, top-items, solicitudes-recientes, estadisticas-almacen',
 'DashboardJlologistController (api/logistica/dashboard-jlologist)': 'kpis, reqs-recientes, ocs-recientes, items-detalle',
 'ReportesComprasController (api/logistica/reportes-compras)': 'solicitudes-periodo, items-solicitados, eficiencia-aprobaciones, por-usuario, analisis-rechazos, comparativo-almacenes',
 'SolicitudServicioController (api/logistica/solicitud-servicio)': 'guardar, listar, obtener-por-id, enviar, anular, contadores',
 'SeguimientoOSController (api/logistica/seguimiento-os)': 'obtener',
 'BrandingController (api/logistica)': 'obtener-config-branding, guardar-config-branding',
 'ConfigMenuController (api/configmenu)': 'listar, guardar, eliminar',
 'ConfigSmtpController (api/logistica)': 'listar-config-smtp, guardar-config-smtp, probar-conexion-smtp, eliminar-config-smtp',
 'ConfiguracionPermisoController (api/ConfiguracionPermiso)': 'listar-config-permisos, diagnostico-listar-config-permisos, guardar-config-permiso, obtener-config-permiso, listar-config-permisos-legacy, guardar-config-permiso-legacy, obtener-menu-config, listar-roles-con-menu, eliminar-config-permiso',
 'NotificacionConfigController (api/logistica/notificacion-config)': 'listar-tipos, guardar-tipo, eliminar-tipo, listar-config, guardar-config, listar-params, guardar-param',
 'PlantillaCorreoController / PlantillaPdfController / ProveedorEmailController (api/logistica)': 'CRUD de plantillas de correo, plantillas PDF y correos de proveedores (listar/guardar/crear/actualizar/eliminar-*)',
 'TipoCambioController (api/logistica/tipo-cambio)': 'obtener',
 'UnidadMedidaController (api/logistica/maestros)': 'GET unidades-medida, unidades-medida/guardar, unidades-medida/eliminar',
 'AdminLogisticaController (api/logistica/admin-logistica)': ('POST auth/login; GET/POST/PUT usuarios(+buscar-erp, cambiar estado); GET/POST parametros; '
   'incremento-oc/vigente|guardar|historial|auditoria; GET/POST pdf-config; GET/POST plantilla-almacen; almacenero-por-ruc; '
   'GET/POST plantilla-conformidad-servicio; lologist-por-ruc; GET auditoria; GET dashboard; areas/subareas CRUD + sincronizar-catalogo; '
   'usuarios-por-area CRUD; usuarios/sincronizar-erp; logistica-usuarios CRUD; solicitar-creacion-item; GET solicitudes-item; '
   'reprocesar-adjuntos-spring; mantenimiento/{limpiar-data, detalle-tabla, backups, restaurar-data}'),
}
for ctrl, eps in endpoints.items():
    h4(ctrl)
    p(eps)
doc.add_page_break()

# ================================================================ 8. BASE DE DATOS
h1('8. Base de datos e integración SPRING')
h2('8.1 Tablas principales por módulo (LOGISTICA)')
table(['Módulo', 'Tablas principales'], [
    ['Requerimientos', 'logistica_requerimientos, logistica_detalle_requerimientos (+ commodity, activo fijo, activo menor), adjuntos'],
    ['Aprobaciones', 'logistica_aprobaciones, LOGISTICA_AprobacionArea, LOGISTICA_AprobacionOrden(+Detalle), LOGISTICA_AprobacionOC, LOGISTICA_FlujoAprobacionOC, tablas de ámbitos/reglas/autoaprobación'],
    ['Consolidación', 'LOGISTICA_RequerimientoConsolidadoCab/Det, LOGISTICA_ConsolOC/ConsolOCDet, solicitudes y detalle de cotización'],
    ['Compras', 'LOGISTICA_SolicitudCompra, LOGISTICA_DetalleSolicitudCompra, adjuntos SC, cotizaciones, LOGISTICA_ordencompra(+detalle+distribucion), LOGISTICA_OCAdjunto'],
    ['Servicios', 'SolicitudServicio(+adjuntos), OrdenServicio, cotizaciones de servicio, conformidad de servicio'],
    ['Despachos', 'logistica_despachos, logistica_detalle_despachos, saldos pendientes'],
    ['Inventario/Kardex', 'LOGISTICA_Item, LOGISTICA_Almacen, LOGISTICA_TransaccionInventario, LOGISTICA_DetalleTransaccionInventario, LOGISTICA_Kardex, LOGISTICA_Stock, LOGISTICA_SincronizacionSpringLog'],
    ['Devoluciones/Reingresos', 'devolución proveedor, devolución consumo, reingresos (+detalles)'],
    ['Administración', 'áreas/subáreas, usuarios-logística, roles-logística, LOGISTICA_Perfiles/PerfilesUsuarios, flujos, aprobadores, config menú dinámico, config permisos, config SMTP, branding, plantillas correo/PDF/almacén/conformidad, notificación-config, accesos-reporte, auditoría, AppDeployments'],
], widths=[1.6, 5.6])
h2('8.2 Stored procedures relevantes')
table(['Grupo', 'SPs destacados'], [
    ['Login / usuarios', 'LOGISTICA_loginAdmin, LOGISTICA_validaUsuario, LOGISTICA_creaUsuario, LOGISTICA_cambiarContrasena, LOGISTICA_recuperarContrasena, LOGISTICA_validarToken, LOGISTICA_obtenerUsuario'],
    ['Requerimientos', 'LOGISTICA_listarRequerimiento(-Aprobacion/-Consumo/-Transferencia), LOGISTICA_sincronizarRequerimientos, LOGISTICA_registrarRequerimientoTransferencia, LOGISTICA_reporteRequerimientos'],
    ['Maestras', 'LOGISTICA_listarMaestroItem/-Commodity/-SubCommodity, LOGISTICA_registrarMaestroItem/-Commodity, LOGISTICA_correlativoItem(-genera), LOGISTICA_correlativoRequisicion'],
    ['Aprobación/SPRING req.', 'LOGISTICA_aprobarRequerimiento(-Area), LOGISTICA_insertarRequisicionesWH, LOGISTICA_actualizarRequisicionSPRING, LOGISTICA_reporteAprobacionRequerimientos'],
    ['Despachos', 'LOGISTICA_generarSalidaNSWH_JSON, LOGISTICA_actualizarEstadoRequerimiento, LOGISTICA_SaldosLote_Item, LOGISTICA_ListarDespachos, LOGISTICA_RegistrarDespacho, LOGISTICA_ValidarStockItems, LOGISTICA_EliminarRequerimiento'],
    ['Saldos', 'LOGISTICA_listarMisSaldos, LOGISTICA_confirmarAtencionSaldo, LOGISTICA_cerrarSaldo, LOGISTICA_reporteSaldosLote, LOGISTICA_registrarSaldoPendienteAprobacion(-listar/-aprobar/-migrar)'],
    ['Consolidación', 'LOGISTICA_listarItemsPendientesConsolidacion, LOGISTICA_crearConsolidacion, LOGISTICA_obtenerConsolidacionPorId, LOGISTICA_listarHistorialConsolidaciones, LOGISTICA_generarSolicitudCotizacion, LOGISTICA_anularConsolidacion, LOGISTICA_anularLineaConsolidacion, LOGISTICA_consolidarRequerimientos'],
    ['OC/OS → SPRING', 'LOGISTICA_crearOCBorrador, LOGISTICA_enviarOCAprobacion, LOGISTICA_confirmarEnvioOC, LOGISTICA_aprobarRechazarOC (unificado), LOGISTICA_sincronizarordencompra, LOGISTICA_reintentarSyncSpring, LOGISTICA_obtenerOCParaSincronizar'],
    ['Kardex', 'LOGISTICA_registrarTransaccionInventario, LOGISTICA_procesarTransaccionInventario, LOGISTICA_registrarMovimientoKardex, LOGISTICA_actualizarStock, LOGISTICA_sincronizarKardexSpring, LOGISTICA_ejecutarSincronizacionSpring'],
    ['Notificaciones', 'LOGISTICA_insertarNotificacionStock, LOGISTICA_registrarNotificacion(Directa/Almacen/Solicitante), LOGISTICA_listarMisNotificaciones(-directas/-stock)'],
    ['Administración', 'LOGISTICA_listarAreas/crearArea/actualizarArea/eliminarArea, listarUsuariosLogistica, configurarUsuarioLogistica, listarRolesLogistica, configurarRolLogistica, listarPerfiles/crearPerfil/asignarRolesPerfil, listarFlujos/crearFlujo, listarAprobadores/crearAprobador'],
], widths=[1.7, 5.5])
h2('8.3 Mapeo LOGISTICA → SPRING (ERP)')
bullets([
    'Requisición (aprobación consumo): WH_Requisicion + detalle + distribución (Clasificacion MAT, ComprasAlmacenFlag A, PrioridadCodigo, DefaultPrime=CECO, DefaultAfe=proyecto).',
    'Salida NS (despacho): WH_TransaccionHeader/Detalle tipo NS + actualización de kardex y WH_ItemAlmacenLote.',
    'Orden de compra: WH_OrdenCompra (+Detalle +Distribucion) con serie WHPO y correlativo; estados PE/AP/EN/AN.',
    'Recepción OC en SPRING: WH_TransaccionHeader tipo NI (ROC), WH_Kardex, WH_ItemAlmacenLote, documentos AP (AP_Documentos + Detalle, clasificación RCD).',
    'Item: WH_ItemMast — código a 6 dígitos, CuentaInventario 25111001, UnidadCodigo UNI.',
    'Reglas de truncado de campos CHAR del ERP y deduplicación con NOT EXISTS documentadas en MAPEO_COMPLETO_LOGISTICA_SPRING.md.',
])
h2('8.4 IndexedDB (Dexie — offline del frontend)')
p('Base LogisticaDB con tablas: usuario, configuracion, empresas, fundos, almacenes(+Destino), areas, proyectos, '
  'cultivos, turnos, acopios, cecos, labores, itemComoditys, clasificaciones, detalles, requerimientos, items, '
  'comodities, subClasificaciones, proveedores, tipoGastos, commoditys, activosFijos, detalles/requerimientos por '
  'tipo (Commodity, ActivoFijo, ActivoFijoMenor), maestroCommoditys, maestroItems, maestroSubCommoditys, '
  'solicitudesCompra(+detalle+adjuntos), solicitudesServicio(+adjuntos), cotizaciones(+detalle), ordenesCompra(+detalle), stock.')
doc.add_page_break()

# ================================================================ 9. AMBIENTES
h1('9. Ambientes, despliegue y operación')
h2('9.1 Ambientes')
table(['Recurso', 'QAS (documentado)', 'Producción'], [
    ['API Logística', 'https://apiqaslogistica.agroapps.net:7641', 'https://apilogistica.agroapps.net:7018'],
    ['Portal web', 'https://logisticaqas.agroapps.net:7642', 'Sitio IIS propio + subsitio /documentacion'],
    ['API Maestra', 'https://apimaestra.agroapps.net:7003', 'Misma'],
    ['Base de datos', 'LOGISTICA_QAS en 172.16.20.25', 'LOGISTICA'],
    ['deployEnvironment', 'qas', 'production'],
], widths=[1.7, 2.8, 2.6])
h2('9.2 Frontend — build y PWA')
bullets([
    'Angular standalone + routes con hash location; Service Worker habilitado en prod (registerWhenStable:30000).',
    'environment.ts / environment.prod.ts / environment.dev.ts / environment.prod-api.ts conmutan baseUrl y deployEnvironment.',
    'Actualización controlada por AppDeployments (admin-version-api) + updateMode AUTO.',
])
h2('9.3 Monitoreo y soporte')
bullets([
    'Auditoría del panel admin-logistica (GET auditoria) y auditoría de incremento OC.',
    'Logs de sincronización: ver-log-sincronizacion, estado-cola-migracion, LOGISTICA_SincronizacionSpringLog.',
    'Reintentos SPRING: reintentar-sync-spring y procesar-cola-spring.',
    'Troubleshooting habitual: token expirado (re-login), falta de configuración en Parámetros (IndexedDB), stock insuficiente/lote, CECO/AFE/ítem inexistente en SPRING, campos truncados (fix LEFT aplicado).',
    'Limpieza IndexedDB en consola: indexedDB.deleteDatabase("LogisticaDB").',
])
h2('9.4 Seguridad')
bullets([
    'Tres esquemas de sesión: sesión de portal (IndexedDB + API Maestra), ADMIN_TOKEN (administración global) y admin_logistica_token (panel logística).',
    'Autorización por guards en frontend y validaciones en backend (es-admin-sistema, permisos por rol, ámbitos de aprobación).',
    'El flujo por ámbitos incorpora despliegue gradual, simulación de ruta y auto-aprobación configurable.',
])
doc.add_page_break()

# ================================================================ 10. ANEXO
h1('10. Anexo — Estructura de carpetas')
h2('10.1 Frontend (logistica/)')
code('''src/app/
├── app.routes.ts                  # rutas raíz: admin-login, administracion, admin-logistica, auth, main/*
├── app.config.ts                  # providers, interceptor, PWA, PrimeNG
├── modules/
│   ├── admin-login/               # login del panel global (ADMIN_TOKEN)
│   ├── admin-logistica/           # panel logística: auth, layout, dashboard, tabs/*, configuracion/*
│   ├── auth/                      # login portal, guards, AuthService
│   ├── main/                      # layout + ~70 páginas operativas + guards de rol
│   └── (interceptors, services, interfaces, models, shared/)
├── shared/                        # dixiedb (Dexie), alertas, components, services, pipes, utils
└── environments/                  # environment.ts/.prod/.dev/.prod-api + version.ts''')
h2('10.2 Backend (api_logistica/)')
code('''Program.cs                      # DI, CORS, DbContextPool, compresión, Swagger
Controllers/AdminLogisticaController.cs   # panel admin-logistica
Infraestructure/
├── Controller/                   # ~40 controllers REST
├── Middleware/, Persistence/     # ApplicationDbContext, filtros
├── RepositoryImpl/, ServiceImpl/ # llamadas a SPs
└── Shared/                       # exceptions, helpers
Domain/                           # Models, Repository (interfaces), Service, UseCase
Application/UseCaseImpl/          # lógica de aplicación
SQL/                              # 745 scripts (tablas, SPs, fixes)''')
h2('10.3 Documentos fuente del repositorio')
bullets([
    'INFORME_SISTEMA_LOGISTICA_SOPORTE_TI.md — manual de soporte TI.',
    'INFORME_FLUJOS_OC_SPRING.md — flujos de generación de OC y migración a SPRING.',
    'MAPEO_COMPLETO_LOGISTICA_SPRING.md — mapeo tabla a tabla LOGISTICA→SPRING.',
    'FLUJO_KARDEX_COMPLETO.md — flujo de kardex e inventario.',
    'IMPLEMENTACION_DESPACHOS.md / IMPLEMENTACION_FRONTEND_ADMIN.md / IMPLEMENTACION_COMPLETA.md.',
    'ANALISIS_FLUJO_DATOS_DASHBOARD.md / DASHBOARD_LOGISTICA_IMPLEMENTACION.md.',
    'SQL/STORED_PROCEDURES_STATUS.md — estado de SPs.',
])
p()
p('— Fin del documento —', italic=True)

out = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica\DOCUMENTACION_SUITE_LOGISTICA_ETAPA1.docx'
doc.save(out)
print('OK:', out)
