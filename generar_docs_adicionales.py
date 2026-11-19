# -*- coding: utf-8 -*-
"""
Genera 3 documentos adicionales de la Suite de Logística:
  1. MANUAL_USUARIO_SUITE_LOGISTICA.docx
  2. DOCUMENTACION_TECNICA_API_SP.docx
  3. DOCUMENTACION_BASE_DATOS.docx
"""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica'


def new_doc():
    d = Document()
    s = d.styles['Normal']
    s.font.name = 'Calibri'
    s.font.size = Pt(10.5)
    for i, (sz, col) in enumerate([(22, '1F4E79'), (15, '1F4E79'), (12, '2E74B5'), (11, '2E74B5')], start=1):
        h = d.styles[f'Heading {i}']
        h.font.name = 'Calibri'
        h.font.size = Pt(sz)
        h.font.bold = True
        h.font.color.rgb = RGBColor.from_string(col)
    return d


def helpers(d):
    def h1(t): d.add_heading(t, level=1)
    def h2(t): d.add_heading(t, level=2)
    def h3(t): d.add_heading(t, level=3)
    def h4(t): d.add_heading(t, level=4)

    def p(text='', bold=False, italic=False):
        par = d.add_paragraph()
        r = par.add_run(text)
        r.bold = bold
        r.italic = italic
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
        r.font.name = 'Consolas'
        r.font.size = Pt(8.5)
        par.paragraph_format.left_indent = Inches(0.25)
        return par

    def table(headers, rows, widths=None):
        t = d.add_table(rows=1, cols=len(headers))
        t.style = 'Table Grid'
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, htxt in enumerate(headers):
            r = t.rows[0].cells[i].paragraphs[0].add_run(htxt)
            r.bold = True
            r.font.size = Pt(9)
        for row in rows:
            cells = t.add_row().cells
            for i, val in enumerate(row):
                r = cells[i].paragraphs[0].add_run(str(val))
                r.font.size = Pt(9)
        if widths:
            for i, w in enumerate(widths):
                for row in t.rows:
                    row.cells[i].width = Inches(w)
        d.add_paragraph()
        return t

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

    return h1, h2, h3, h4, p, bullets, numbered, code, table, portada


# #############################################################################
# DOC 1 — MANUAL DE USUARIO
# #############################################################################
d = new_doc()
h1, h2, h3, h4, p, bullets, numbered, code, table, portada = helpers(d)
portada('MANUAL DE USUARIO', 'Guía de uso de la aplicación por rol — Suite de Logística')

h1('1. Introducción')
p('Este manual explica cómo usar la aplicación web de Logística en su primera etapa productiva. '
  'Está organizado por rol: cada usuario verá únicamente las pantallas y opciones permitidas para su perfil. '
  'La aplicación funciona como PWA (se puede instalar en el navegador y mantiene datos offline en IndexedDB), '
  'y se actualiza automáticamente cuando hay una nueva versión.')
h2('1.1 Acceso a la aplicación')
numbered([
    'Ingresar a la URL del portal (producción/QAS según ambiente) con navegador Chrome o Edge.',
    'En la pantalla de login ingresar usuario y contraseña corporativa (las mismas del ERP).',
    'El sistema valida las credenciales en la API Maestra y carga el rol del usuario.',
    'Según el rol, la aplicación abre directamente la pantalla principal correspondiente.',
])
h2('1.2 Accesos administrativos')
table(['Acceso', 'URL', 'Quién entra', 'Para qué'], [
    ['Portal principal', '/#/auth/login', 'Todos los usuarios con rol LOGISTICA', 'Operación diaria'],
    ['admin-login', '/#/admin-login', 'Administrador TI del sistema', 'Panel global /administracion (roles, perfiles, SMTP, branding, menús)'],
    ['admin-logistica', '/#/admin-logistica/login', 'TILOGIST, ADLOGIST, JLOLOGIST', 'Panel administrativo de logística (usuarios, áreas, flujos, plantillas, auditoría)'],
])

h1('2. Rol Operativo de Campo (OPLOGIST) y Empaque (EMLOGIST)')
p('Es el usuario que solicita materiales o servicios desde campo. Su pantalla inicial es el dashboard operativo.')
h2('2.1 Configurar parámetros (obligatorio la primera vez)')
numbered([
    'Ir a Parámetros en el menú.',
    'Seleccionar en cascada: Empresa → Fundo → Cultivo → Área → Almacén.',
    'Seleccionar CECO, Turno, Labor y Proyecto (AFE) por defecto.',
    'Elegir el tipo de ítem: CONSUMO (habitual). TRANSFERENCIA solo aparece para rol logístico.',
    'Presionar Sincronizar para descargar las maestras (ítems, proveedores, cecos, labores).',
    'Guardar configuración. Sin este paso no se pueden crear requerimientos.',
])
h2('2.2 Crear un requerimiento')
numbered([
    'Ir a Requerimientos. Cargar la configuración guardada.',
    'Elegir la pestaña según el tipo: ÍTEM (materiales), COMMODITY (servicios), ACTIVO FIJO o ACTIVO MENOR.',
    'Escribir la glosa (descripción/justificación) y la prioridad.',
    'Agregar líneas: buscar el ítem por código o descripción, indicar cantidad, proyecto, CECO y labor.',
    'Para ítems de consumo el sistema valida el stock disponible en el almacén.',
    'Si el ítem no existe, usar la opción "Solicitar creación de ítem".',
    'Guardar. El requerimiento queda en PENDIENTE y se sincroniza al servidor.',
    'Se pueden adjuntar archivos al requerimiento (opción de adjuntos).',
])
h2('2.3 Consultas del operativo')
bullets([
    'Notificaciones: avisos de stock disponible, atención de saldos y mensajes del almacén.',
    'Mis saldos / Saldo requerimiento: qué cantidades quedaron pendientes por falta de stock y su atención.',
    'Reporte de requerimientos y Seguimiento de consumos: estado de cada solicitud.',
    'Dashboard operativo (dashboard-oplogist): contadores y despachos por mes.',
])

h1('3. Rol Aprobador de Área (APLOGIST)')
h2('3.1 Aprobar o rechazar requerimientos')
numbered([
    'Al ingresar, el sistema abre Aprobaciones (o Aprobaciones por Área si el usuario tiene área asignada).',
    'Presionar Sincronizar para traer los requerimientos pendientes de su ámbito.',
    'Abrir el detalle para revisar líneas, cantidades, CECO, proyecto y stock disponible por ítem.',
    'Aprobar individualmente o seleccionar varios y aprobar en masivo. Al aprobar, el sistema genera la Requisición en SPRING automáticamente.',
    'Para rechazar, escribir el motivo (obligatorio). El solicitante puede ver la observación.',
])
h2('3.2 Anular un requerimiento ya aprobado')
numbered([
    'En la bandeja de aprobados elegir el requerimiento anulable (solo si aún no fue despachado/consolidado).',
    'Ejecutar anular con motivo; queda registrado en el historial de anulaciones.',
])
h2('3.3 Consultas del aprobador')
bullets([
    'Historial de aprobaciones del área y Reporte de aprobaciones (aprobados/rechazados).',
    'Dashboard de aprobaciones por área con indicadores de pendientes y tiempos.',
])

h1('4. Rol Gerencia (GERENTE) — Aprobación nivel 2')
numbered([
    'Ingresa directo a Aprobaciones Gerencia.',
    'Revisa los requerimientos que ya pasaron la aprobación de área y requieren segundo nivel (según configuración del flujo por ámbitos o cadena de aprobadores N2).',
    'Aprueba o rechaza; también puede aprobar OC/OS cuando el flujo por montos lo asigna a gerencia.',
    'Dispone del Dashboard de Gerencia con indicadores.',
])

h1('5. Rol Almacén (ALLOGIST)')
h2('5.1 Despachar requerimientos (salida NS)')
numbered([
    'Ir a Despachos. Se listan los requerimientos APROBADOS de consumo.',
    'Abrir el requerimiento: el sistema calcula por línea pendiente = solicitada − atendida y propone "Atender" = mínimo entre pendiente y stock.',
    'Ajustar cantidades si es necesario. El sistema indica por línea: COMPLETO, PARCIAL o SIN STOCK.',
    'Presionar Registrar Atención: se genera la salida NS en SPRING y se descuenta el stock/kardex.',
    'Lo no atendido por falta de stock queda como saldo pendiente; cuando llegue stock se notifica al solicitante.',
])
h2('5.2 Recepción de mercadería (OC)')
numbered([
    'Ir a Recepción Mercadería: se listan las OC enviadas/aprobadas recepcionables.',
    'Abrir la OC, verificar cantidades recibidas por línea y registrar la recepción (parcial o total).',
    'Validar la recepción e ingresar a kardex (aumenta stock en el almacén destino).',
    'Registrar la Conformidad de Almacén: conforme o no conforme. Las recepciones no conformes alimentan Devoluciones a Proveedores.',
])
h2('5.3 Otras funciones de almacén')
bullets([
    'Kardex: consulta de movimientos por ítem, stock actual, reporte valorizado (promedio ponderado), dashboard de inventario y sincronización con SPRING.',
    'Gestión de inventario: ajustes (crear/aprobar) y conteos físicos (crear, registrar conteo, finalizar).',
    'Listas de stock: armar listas de control con stock mínimo/máximo y generar alertas de quiebre.',
    'Transferencias de almacén: atender requerimientos tipo transferencia entre almacenes.',
    'Devoluciones de consumo: registrar/aprobar devoluciones de material entregado.',
    'Devoluciones a proveedores: registrar devoluciones desde recepciones no conformes.',
    'Reingresos: reincorporar ítems devueltos al stock.',
    'Maestro de proveedores y evaluación de proveedores.',
    'Reportes: despachos, saldos por lote, reporte logístico.',
    'Dashboard de despacho como pantalla inicial.',
])

h1('6. Rol Operador Logístico (LOLOGIST) — Compras')
h2('6.1 Solicitudes de compra (SC)')
numbered([
    'Ir a Solicitudes de Compra: ver requerimientos de compra aprobados.',
    'Crear la SC agrupando requerimientos o ítems; adjuntar archivos si aplica.',
    'La SC pasa por el flujo de aprobación configurado (aprobadores SC).',
])
h2('6.2 Consolidación de requerimientos')
numbered([
    'Ir a Consolidación (requerimientos, compras o corporativa).',
    'Listar ítems pendientes por tipo: ítems, commodities, activos fijos, activos menores.',
    'Seleccionar líneas y crear la consolidación (cabecera + detalle).',
    'Generar la Solicitud de Cotización desde la consolidación.',
    'Gestionar: anular consolidación completa, anular una línea, migrar saldos aprobados.',
])
h2('6.3 Cotizaciones')
numbered([
    'Ir a Cotizaciones: bandeja de solicitudes de cotización (compra y servicio).',
    'Registrar la cotización de cada proveedor con precios y condiciones.',
    'Abrir el cuadro comparativo y seleccionar el proveedor ganador.',
])
h2('6.4 Órdenes de compra (OC)')
numbered([
    'Desde la cotización ganadora o desde la consolidación, crear la OC borrador.',
    'Completar datos: proveedor, forma de pago, incoterm, fecha prometida, moneda; adjuntar documentos.',
    'Enviar a aprobación: entra al flujo por niveles según el monto (JLOLOGIST → JEMLOGIST → FINANZAS → GERENTE).',
    'Aprobada la OC, confirmar envío: se genera el PDF y se envía correo al proveedor (correo configurado en Proveedores Email y SMTP).',
    'Sincronizar a SPRING: la OC se crea en el ERP con número correlativo. Si falla, usar reintento de sincronización.',
    'Dar seguimiento en la pantalla de seguimiento de OC.',
])
h2('6.5 Órdenes y solicitudes de servicio')
numbered([
    'Crear Solicitud de Servicio (SS), enviarla a aprobación SS.',
    'Cotización de servicio: registrar y seleccionar proveedor.',
    'Generar la OS (desde consolidación de servicios o individual desde un requerimiento de servicio).',
    'Tras aprobación, sincronizar a SPRING y luego registrar la conformidad del servicio ejecutado.',
])
h2('6.6 Consultas logísticas')
bullets([
    'Dashboard logística (pantalla inicial): KPIs, requerimientos por mes/estado, órdenes, entregas, estado de almacén, gastos y reportes (compras, inventario, proveedores, tiempos, gastos, consolidado).',
    'Dashboard de compras: KPIs de SC, tendencia, top ítems.',
    'Reportes de compras: por período, ítems solicitados, eficiencia de aprobaciones, por usuario, análisis de rechazos, comparativo de almacenes.',
    'Seguimiento de requerimientos de compra y análisis de requerimientos.',
    'Transferencias de almacén (LOLOGIST puede crear requerimientos de transferencia).',
    'Catálogo de ítems para consulta.',
])

h1('7. Roles de aprobación de OC/OS (JLOLOGIST, JEMLOGIST, FINANZAS)')
numbered([
    'Ingresar a Aprobaciones OC u OS (o la bandeja del panel admin-logistica).',
    'Ver pendientes del nivel que le corresponde según el monto de la orden.',
    'Revisar el detalle (líneas, proveedor, montos, adjuntos) y aprobar o rechazar con observación.',
    'Al aprobar el último nivel requerido, la orden queda APROBADA y habilita envío/sincronización.',
    'FINANZAS dispone del dashboard de finanzas; JLOLOGIST de su dashboard con KPIs, req y OC recientes.',
])

h1('8. Rol Administrador de Logística (ADLOGIST) y TI (TILOGIST)')
p('Además de las funciones operativas, administran la configuración funcional del sistema desde el portal y '
  'desde los dos paneles administrativos. Ver secciones 9 y 10.')

h1('9. Panel admin-logistica — guía de uso')
p('Acceso: /admin-logistica/login. Disponible para TILOGIST, ADLOGIST y JLOLOGIST '
  '(JLOLOGIST solo gestiona roles operativos y no ve Aprobar SC/SS).')
h2('9.1 Operación')
table(['Opción del menú', 'Uso paso a paso'], [
    ['Dashboard', 'Indicadores del panel: pendientes por aprobar, actividad reciente.'],
    ['Bandeja Aprobaciones', 'Bandeja unificada de todos los pendientes por decidir.'],
    ['Aprobar Consumo', 'Decidir requerimientos de consumo pendientes.'],
    ['Aprobar Solicitud Compra / Servicio', 'Decidir SC y SS pendientes (según flujo de aprobadores configurado).'],
    ['Aprobar Gerencia', 'Decidir aprobaciones de nivel gerencia.'],
    ['Maestros', 'Mantenimiento de ítems, commodities y unidades de medida (crear, editar, correlativos).'],
    ['Gestión Proveedores', 'Alta y edición de proveedores (documento, tipo pago, moneda, detracción).'],
    ['Usuarios', 'Crear usuarios de logística: buscar en ERP por DNI/nombre, asignar rol y estado. JLOLOGIST solo puede asignar roles operativos.'],
], widths=[2.2, 5.0])
h2('9.2 Configuración (solo administradores)')
table(['Opción', 'Qué se configura'], [
    ['Áreas', 'CRUD de áreas y subáreas; botón sincronizar catálogo desde el ERP.'],
    ['Usuarios por Área', 'Asignación usuario↔área (quién es jefe de cada área); sincronización de usuarios desde el ERP.'],
    ['Flujo Aprobación Área', 'Definir la ruta de aprobación por área: qué aprobador corresponde a cada área.'],
    ['Flujo por Niveles', 'Configuración del flujo por niveles/ámbitos: reglas por monto/tipo, aprobadores N2, orden, disponibilidad, auto-aprobación y simulación de ruta.'],
    ['Formato PDF', 'Configuración del PDF de la OC: logo, colores, textos y campos visibles.'],
    ['Empresa', 'Datos de la empresa (RUC, razón social, carpeta de adjuntos).'],
    ['Parámetros', 'Parámetros generales clave-valor del sistema.'],
    ['Incremento Cantidad OC', 'Reglas para permitir aumentar cantidades en OCs ya emitidas; con historial y auditoría de cambios.'],
    ['Aprobadores', 'Mantenedor general de aprobadores por flujo/nivel/monto.'],
    ['Auditoría', 'Consulta del log de acciones del panel filtrando por fecha, tipo y usuario.'],
    ['Plantillas Almacén', 'Formatos de documentos de almacén por tipo y empresa; responsable almacenero por RUC.'],
    ['Conformidad Servicio', 'Plantilla del documento de conformidad de servicio por empresa y responsable.'],
    ['Permisos por Rol', 'Matriz de permisos: qué menú/función puede usar cada rol.'],
    ['Migrar Adjuntos', 'Reproceso de adjuntos pendientes hacia SPRING.'],
    ['Accesos Reportes', 'Qué usuarios/áreas pueden ver cada reporte.'],
    ['Mantenimiento', 'Utilidades de datos: limpieza controlada, backups y restauración. Usar con cuidado.'],
], widths=[2.2, 5.0])

h1('10. Panel /administracion (vía admin-login) — guía de uso')
p('Acceso exclusivo TI. Configura la capa global del sistema.')
table(['Pantalla', 'Uso'], [
    ['Dashboard', 'Indicadores del panel administrativo.'],
    ['Usuarios', 'Configurar usuarios logística: área, perfil, si es aprobador, nivel, monto máximo, permisos de crear/aprobar, notificaciones por correo, estado.'],
    ['Roles', 'Permisos por rol y módulo: crear, editar, eliminar, aprobar, ver reportes, administrar.'],
    ['Áreas', 'CRUD de áreas organizacionales.'],
    ['Perfiles', 'Crear perfiles y asignarles roles; asignar perfiles a usuarios (suma de roles efectivos).'],
    ['Flujos', 'Flujos de aprobación por área/tipo/monto/orden.'],
    ['Aprobadores', 'Aprobadores por flujo: nivel, monto máximo, delegación, aprobador final.'],
    ['Usuarios por Área', 'Matriz usuario↔área.'],
    ['Versión API', 'Control de versiones desplegadas (AppDeployments) para la PWA.'],
    ['Proveedores Email', 'Correos de contacto por proveedor para el envío de OC.'],
    ['Config SMTP', 'Servidor de correo por empresa (host, puerto, usuario, SSL) y prueba de conexión.'],
    ['Plantillas Correo / PDF', 'Diseño de correos y plantillas PDF del sistema.'],
    ['Colores / Branding', 'Paleta de colores y branding por empresa (logo, nombre).'],
    ['Permisos por Rol', 'Matriz rol↔función.'],
    ['Menús (layout, dinámicos, permisos, plantillas)', 'Sistema de menús dinámicos por rol: define qué opciones ve cada rol en el portal.'],
    ['Empresas', 'Empresas multi-RUC y su configuración.'],
    ['Plantilla Almacén', 'Formatos de documentos de almacén.'],
    ['Sincronización', 'Ejecutar sincronización de maestras y ver log.'],
    ['Notificaciones Config', 'Tipos de notificación, destinatarios y parámetros.'],
], widths=[2.6, 4.6])

h1('11. Preguntas frecuentes y errores comunes')
table(['Situación', 'Causa / solución'], [
    ['No puedo entrar a Requerimientos', 'Falta guardar la configuración en Parámetros (mensaje "Falta configurar").'],
    ['No sincroniza el requerimiento', 'Sin conexión, API caída o token expirado: verificar red y volver a iniciar sesión.'],
    ['Error al aprobar en SPRING', 'CECO, AFE o ítem no existe en el ERP: validar el dato con TI y reintentar.'],
    ['No se genera la salida NS', 'Stock insuficiente o lote/ítem sin registrar en el almacén: verificar stock real.'],
    ['No veo una opción del menú', 'El rol no tiene permiso o falta perfil: revisar con el administrador (Permisos por Rol / Perfiles).'],
    ['La app quedó desactualizada', 'El sistema actualiza solo; si no, limpiar caché del navegador y recargar.'],
    ['Datos locales corruptos', 'En consola del navegador: indexedDB.deleteDatabase("LogisticaDB") y reconfigurar.'],
], widths=[2.8, 4.4])

p(); p('— Fin del Manual de Usuario —', italic=True)
d.save(BASE + r'\MANUAL_USUARIO_SUITE_LOGISTICA.docx')
print('OK manual')

# #############################################################################
# DOC 2 — DOCUMENTACIÓN TÉCNICA API/SP
# #############################################################################
d = new_doc()
h1, h2, h3, h4, p, bullets, numbered, code, table, portada = helpers(d)
portada('DOCUMENTACIÓN TÉCNICA', 'Integración Frontend → API → Stored Procedures')

h1('1. Cómo funciona la integración')
h2('1.1 Cadena de llamada')
code('''Componente Angular
      │  usa
      ▼
Service Angular (HttpClient)  ── authInterceptor agrega contexto de usuario
      │  POST /api/...  (body JSON)
      ▼
Controller ASP.NET            ── recibe JsonElement, valida, delega
      │
      ▼
UseCase (lógica aplicación)
      │
      ▼
Repository (Dapper/ADO)       ── EXEC LOGISTICA_<nombre> @json
      │
      ▼
Stored Procedure SQL Server   ── procesa y devuelve FOR JSON PATH''')
h2('1.2 Patrón de los Stored Procedures')
bullets([
    'Convención de nombre: LOGISTICA_<accion><Entidad> (p.ej. LOGISTICA_registrarRecepcionOC).',
    'Entrada: un parámetro @json NVARCHAR(MAX) con el payload completo; dentro se hace OPENJSON para leer cabecera y detalles.',
    'Salida: SELECT ... FOR JSON PATH que el backend retorna como JsonElement al frontend.',
    'Los SPs manejan transacciones (BEGIN TRAN / COMMIT / ROLLBACK) y retornan campos como errorgeneral y mensaje.',
    'Los SPs de sincronización escriben tanto en LOGISTICA como en las bases del ERP SPRING (linked server HASS-DB1).',
])
h2('1.3 Flujo HTTP en el frontend')
bullets([
    'environment.baseUrl apunta a la API logística; environment.apiMaestra a la API corporativa (login y maestras).',
    'authInterceptor intercepta las llamadas a /api/ y adjunta el contexto del usuario logueado.',
    'Los servicios se agrupan por dominio y viven en src/app/services y src/app/modules/main/services.',
    'Offline: Dexie (IndexedDB) guarda maestras y requerimientos; los servicios sync suben los pendientes.',
])

h1('2. Mapa Servicio Angular → Endpoints')
p('Cada servicio del frontend y los endpoints REST que consume.')
svc = [
    ('auth.service.ts', 'Autenticación del portal', 'api/Maestros/get-usuarios; api/logistica/auth/login-rol; api/logistica/es-admin-sistema/{u}; api/logistica/listar-roles-efectivos'),
    ('auth-admin.service.ts / admin-context.service.ts', 'Login admin global', 'api/logistica/admin-login; api/logistica/admin-contexto-empresa'),
    ('admin-logistica-auth.service.ts', 'Login panel logística', 'api/logistica/admin-logistica/auth/login'),
    ('requerimientos.service.ts', 'Requerimientos', 'listar-requerimientos(-aprobados/-consumo), registrar-requerimiento-consumo, aprobar-requerimientos, listar-detalle-requerimiento, listar-almacen, listar-saldos, saldos-lote-item, validar-stock-items, eliminar-requerimiento, cerrar-requerimiento, registrar-despacho, listar-despachos, reporte-requerimientos-aprobados, listar-numero-requision, registra-requerimientos-aprobados, requerimiento-correlativo-nuevo, registrar-requerimiento-commodity-aprobado, listar-requerimientos-usuario-dashboard'),
    ('aprobaciones-area.service.ts', 'Aprobación por área / gerencia / anulaciones', 'requerimientos-pendientes-area(-detalle), aprobar-requerimiento-area, aprobar-requerimiento-gerencia, obtener-pendientes/aprobados-gerencia, dashboard-gerencia, consultar-stock-detalle-aprobacion, historial-aprobaciones-area, reporte-aprobaciones-area, obtener-area-usuario, obtener-aprobador-por-area, obtener-flujo-completo-aprobacion, asignar-aprobadores-requerimiento, procesar-aprobacion-requerimiento, obtener-requerimientos-(pendientes-aprobacion|con-aprobacion|anulables), validar-anulacion-requerimiento, anular-requerimiento(-v2), listar-historial-anulaciones, registrar-requerimiento, obtener-dashboard-aprobaciones/{dni}'),
    ('aprobaciones.service.ts / aprobaciones-ambitos.service.ts', 'Aprobaciones y motor por ámbitos', 'obtener-requerimientos-con-aprobacion, obtener-dashboard-aprobaciones/{dni}; aprobacion-ambitos/{contexto,enviar,pendientes,decidir,reasignar,invalidar,historial,marcar-efecto}; simular-ruta-aprobacion-ambito'),
    ('aprobador-nivel2.service.ts / aprobadores.service.ts', 'Aprobadores N2 y mantenedor', 'api/logistica (aprobadores N2); listar-aprobadores, crear-aprobador, registrar-aprobadores'),
    ('solicitud-compra.service.ts', 'Solicitudes de compra', 'solicitud-compra/{listar,crear,actualizar-estado,eliminar,contadores,listar-por-empresa,guardar-adjunto}; listar-requerimientos-compra-aprobados; actualizar-estado-requerimiento'),
    ('aprobacion-sc.service.ts', 'Aprobación de SC', 'aprobacion-sc/{listar-pendientes,aprobar,rechazar,asignar-aprobadores,historial,contadores,roles,flujos/*,usuarios/*}'),
    ('consolidacion.service.ts', 'Consolidación', 'consolidacion/{listar-*-pendientes-consolidacion,crear-consolidacion,obtener-consolidacion,listar-historial-consolidaciones,generar-solicitud-cotizacion,actualizar-estado-solicitud-cotizacion,anular-consolidacion,anular-linea-consolidacion,anular-item-pendiente,obtener-detalle-requerimiento,listar-saldos-pendientes-aprobacion,listar-mis-notificaciones}; logistica/{registrar-saldo-pendiente-aprobacion,aprobar-rechazar-saldo-pendiente,migrar-saldo-directo-consolidacion,registrar-notificacion-stock,notificar-stock-disponible,listar-solicitudes-cotizacion}'),
    ('cotizaciones.service.ts', 'Cotizaciones', 'listar-solicitudes-cotizacion(-servicio), registrar-cotizacion(-servicio), listar-cotizaciones(-por-solicitud), comparar-cotizaciones, seleccionar-proveedor-ganador'),
    ('orden-compra.service.ts / orden-pdf.service.ts', 'Órdenes de compra', 'orden-compra/{generar-desde-solicitud,listar,obtener-por-id,actualizar-estado,anular,contadores,sincronizar,sincronizar-consolidacion}; guardar-oc-directa, listar-incoterms, enviar-orden-pdf-proveedor, listar-empresas, aprobacion-oc/asignar-aprobadores'),
    ('aprobacion-oc.service.ts', 'Aprobación OC', 'aprobacion-oc/{listar-pendientes,aprobar-rechazar,historial,contadores,asignar-aprobadores,flujos/*,usuarios/*}'),
    ('aprobacion-orden.service.ts', 'Aprobación OC/OS flujo nuevo', 'api/consolidacion/* (enviar, pendientes, aprobar/rechazar/anular orden, historial, por rol); actualizar-adjunto-oc, obtener-adjunto-oc'),
    ('solicitud-servicio.service.ts (+local/remote)', 'Solicitudes de servicio', 'solicitud-servicio/{guardar,listar,obtener-por-id,enviar,anular,contadores}; orden-servicio/aprobacion-ss/*; orden-servicio/cotizacion/*'),
    ('orden-servicio.service.ts / seguimiento-os.service.ts', 'Órdenes de servicio y seguimiento', 'orden-servicio/{generar,listar,obtener-por-id,asignar-aprobadores,aprobar-rechazar,listar-pendientes-aprobacion,registrar-conformidad,sincronizar}; crear-os-individual, listar-requerimientos-servicio-para-os; seguimiento-os/{obtener,listar,crear,actualizar,actualizar-hito,registrar-conformidad}'),
    ('aprobacion-os.service.ts', 'Aprobación OS', 'aprobacion-os/{listar-pendientes,aprobar-rechazar,anular,historial,historial-os,obtener-detalle,contadores,listar-usuarios-aprobadores,crear/actualizar/eliminar-usuario-aprobador,listar-flujos,crear/actualizar/eliminar-flujo}'),
    ('recepcion-oc.service.ts', 'Recepción de OC', 'recepcion-oc/{registrar,listar,obtener-por-id,validar,ingresar-kardex,contadores,actualizar-cantidad}'),
    ('conformidad-almacen.service.ts / conformidad-servicios.service.ts', 'Conformidades', 'api/logistica/conformidad-almacen/*; api/logistica/orden-servicio (conformidad)'),
    ('despachos.service.ts', 'Despachos', 'generar-salida-ns, registrar-despacho, listar-despachos, validar-stock-items, saldos-lote-item, actualizar-estado-requerimiento, dashboard-contadores, dashboard-despachos-por-mes'),
    ('kardex.service.ts', 'Kardex', 'api/kardex/* (transacciones, kardex, stock, valorización, sincronización SPRING)'),
    ('gestion-inventario.service.ts / listas-stock.service.ts', 'Inventario y listas', 'gestion-inventario/*; listas-stock/*'),
    ('transferencia.service.ts', 'Transferencias', 'crear-requerimiento-transferencia, listar-transferencias-pendientes, detalle-requerimiento-transferencia, ejecutar-transferencia, listar-historial-transferencias'),
    ('devolucion-proveedor.service.ts / devolucion-consumo.service.ts / reingreso.service.ts', 'Devoluciones y reingresos', 'devolucion-proveedor/*; devolucion-consumo/*; reingreso/*'),
    ('saldo-requerimiento.service.ts', 'Saldos', 'listar-mis-saldos, confirmar-atencion-saldo, cerrar-saldo, validar-ids-detalles'),
    ('items.service.ts / commoditys.service.ts / unidades-medida.service.ts', 'Maestras', 'listar-item(-slim/-version), registrar-item, item-correlativo(-nuevo), update-item; listar-commodity, listar-subcommodity, registrar-commodity, update-commodity; maestros/unidades-medida*'),
    ('maestras.service.ts / parametros.service.ts / empresas.service.ts', 'Maestras ERP (API Maestra)', 'api/Maestros/{get_empresas,get-fundos,get-almacen,get-areas,get-cultivos,get-cecos,get-labores,get-turnos,get-proyectos,get-items-cmmdty,get-clas-rq,get-partidas,obtener-provee,obtener-actfijo,obtener-gastos,importar-forma-pago,save-comodity,delete-subclasificacion}; logistica/get-tipos-pago'),
    ('dashboard-logistica.service.ts / dashboard-compras.service.ts / dashboard-jlologist.service.ts', 'Dashboards', 'dashboard-logistica/* (18 endpoints); dashboard-compras/*; dashboard-jlologist/*'),
    ('reportes-compras.service.ts / reporte.service.ts / reporte-menu.service.ts', 'Reportes', 'reportes-compras/*; listar-requerimiento-consumo/-transferencia; config de menú de reportes'),
    ('seguimiento-oc.service.ts', 'Seguimiento OC', 'obtener-seguimiento-oc, crear-seguimiento-oc, actualizar-seguimiento-oc'),
    ('adjuntos.service.ts', 'Adjuntos requerimiento', 'guardar/listar/eliminar-adjunto-requerimiento'),
    ('admin-*.service.ts (administración global)', 'Panel /administracion', 'listar/configurar-usuario-logistica, listar-usuarios-maestros, listar/configurar-rol-logistica, listar-roles-maestros, áreas CRUD, perfiles CRUD + asignaciones, flujos CRUD, aprobadores CRUD, config-smtp, plantillas correo/pdf, proveedores-email, branding, empresas, ejecutar-sincronizacion-items, ver-log-sincronizacion, notificacion-config'),
    ('Servicios admin-logistica (usuarios/areas/usuario-area/parametros/pdf/incremento-oc/auditoria/bandeja/plantillas/permisos-rol)', 'Panel admin-logistica', 'admin-logistica/{usuarios*, areas*, subareas*, usuarios-por-area*, usuarios/sincronizar-erp, parametros, pdf-config, incremento-oc*, auditoria*, dashboard*, bandeja/*, plantilla-almacen, plantilla-conformidad-servicio}; ConfiguracionPermiso/*; listar/guardar-config-flujo; asignar-usuario-area; listar-usuarios-locales; listar/crear/actualizar-catalogo-area(s)'),
    ('deployment-tracking.service.ts / version*.service.ts', 'Versionado PWA', 'api/app-deployments/current|history'),
]
table(['Servicio Angular', 'Dominio', 'Endpoints consumidos'], svc, widths=[2.2, 1.6, 3.4])

h1('3. Mapa Endpoint → Stored Procedure')
p('Qué SP ejecuta cada repositorio (el controller enruta al caso de uso, y éste al repositorio que hace EXEC del SP).')
repos = [
    ('LogisticaRepositoryImpl (api/logistica)', 'LOGISTICA_listarRequerimiento(-Aprobacion/-Consumo/-Transferencia), LOGISTICA_sincronizarRequerimientos, LOGISTICA_registrarRequerimientoTransferencia, LOGISTICA_reporteRequerimientos, LOGISTICA_listarMaestroItem(Local/Slim/Version), LOGISTICA_listarMaestroCommodity/-SubCommodity, LOGISTICA_registrarMaestroItem/-Commodity, LOGISTICA_reporteSaldosLote, LOGISTICA_aprobarRequerimiento(-Area/-Gerencia), LOGISTICA_rechazarRequerimiento, LOGISTICA_aprobarRechazarRequerimiento/-Servicio, LOGISTICA_reporteAprobacionRequerimientos, LOGISTICA_correlativoItem(-genera), LOGISTICA_correlativoRequisicion, LOGISTICA_insertarRequisicionesWH, LOGISTICA_actualizarRequisicionSPRING, LOGISTICA_loginAdmin, LOGISTICA_validaUsuario/-Token, LOGISTICA_creaUsuario, LOGISTICA_obtenerUsuario, LOGISTICA_cambiar/-recuperarContrasena, LOGISTICA_generarSalidaNSWH_JSON, LOGISTICA_actualizarEstadoRequerimiento, LOGISTICA_SaldosLote_Item, LOGISTICA_ListarDespachos/-DetalleRequerimiento, LOGISTICA_RegistrarDespacho, LOGISTICA_ValidarStockItems, LOGISTICA_EliminarRequerimiento, LOGISTICA_listarMisSaldos/-PendientesAprobacion, LOGISTICA_confirmarAtencionSaldo, LOGISTICA_cerrarSaldo/-Requerimiento, LOGISTICA_registrarSaldoPendienteAprobacion, LOGISTICA_aprobarRechazarSaldoPendiente, LOGISTICA_migrarSaldoDirectoConsolidacion, LOGISTICA_registrarNotificacion(Stock/Almacen/Solicitante), LOGISTICA_listarMisNotificaciones(-Directas/-Stock), LOGISTICA_notificarStockDisponible, LOGISTICA_validarIdsDetalles, LOGISTICA_procesarColaSpring, LOGISTICA_estadoColaMigracion, LOGISTICA_registrarCotizacion(-Servicio), LOGISTICA_compararCotizaciones, LOGISTICA_listarCotizaciones(PorSolicitud/Simple), LOGISTICA_listarSolicitudesCotizacion(-Servicio), LOGISTICA_seleccionarProveedorGanador, LOGISTICA_listarProveedoresSPRING, LOGISTICA_registrarProveedorSPRING, LOGISTICA_dashboardContadores/-DespachosPorMes, LOGISTICA_listarRequerimientosUsuarioDashboard, LOGISTICA_reporteSeguimiento(ReqCompra/-CompraAnalisis/-ReqConsumo), LOGISTICA_guardar/-listar(AccesoReporte/-AreaAccesoReporte/-ConfigReporteMenu), LOGISTICA_verificarMenuReporte, LOGISTICA_buscarUsuarioPorDni, LOGISTICA_crear/-ejecutar/-detalle/-listarHistorialTransferencias, LOGISTICA_crearRequerimientoTransferencia, LOGISTICA_listarTransferenciasPendientes, LOGISTICA_registrarRequerimientoCommodityAprobado, LOGISTICA_crearRequerimiento(Commodity/ActivoFijo/ActivoFijoMenor), LOGISTICA_actualizarRequerimientoCommodity, LOGISTICA_listarRequerimientos(Servicio/PendientesAprobacion/CompraAprobados), LOGISTICA_obtenerRequerimientosPendientes/-HistorialAprobaciones'),
    ('AprobacionesRepositoryImpl (área/ámbitos)', 'LOGISTICA_aprobarRequerimiento(Area/Gerencia), LOGISTICA_obtenerRequerimientosPendientes(Area/-Detalle/Gerencia/Aprobacion/ConAprobacion/AprobadosGerencia), LOGISTICA_procesarAprobacionRequerimiento, LOGISTICA_consultarStockDetalleAprobacion, LOGISTICA_obtener(HistorialAprobacionesArea/ReporteAprobacionesArea/DashboardAprobaciones/AreaUsuario/AprobadorPorArea/FlujoCompletoAprobacion), LOGISTICA_asignarAprobadoresRequerimiento/-UsuarioArea, LOGISTICA_listarUsuariosPorArea/-Areas, LOGISTICA_crearArea/-editarArea/-anularArea/-eliminarUsuarioArea, LOGISTICA_guardar/-listar/-eliminarFlujoAprobacionPorArea, LOGISTICA_configurarFlujoAprobacion, LOGISTICA_obtenerConfiguracionFlujo, LOGISTICA_guardar/-listarConfigFlujoRequerimiento, LOGISTICA_listar/-guardar/-eliminar/-reordenarAprobadorNivel2, LOGISTICA_esAprobadorNivel2, LOGISTICA_toggleDisponibleAprobadorN2, LOGISTICA_dashboardGerencia, LOGISTICA_registrarRequerimiento — Ámbitos: LOGISTICA_contextoSolicitanteAmbito, registrarRutaAmbito, pendientesRutaAmbito, decidirRutaAmbito, reasignarPasoRutaAmbito, invalidarRutaAmbito, historialRutaAmbito, requerimientosRutaAmbitoVigente, marcarEfectoFinalAmbito, listarEstructuraAprobacionAmbito, simularRutaAmbito, guardarAmbitoOrganizacional, guardarAreaAmbito, guardarAsignacionAmbito, guardarReglaAmbito, cambiarEstadoReglaAmbito, cambiarDespliegueAmbito, listar/guardar/eliminarConfigAutoaprobacion, obtenerMantenedoresAmbito'),
    ('ConsolidacionRepositoryImpl (api/consolidacion)', 'LOGISTICA_listar(Items/ActivosFijos/ActivosMenores/Commodities)PendientesConsolidacion, LOGISTICA_crearConsolidacion, LOGISTICA_obtenerConsolidacionPorId, LOGISTICA_listarHistorialConsolidaciones, LOGISTICA_generarSolicitudCotizacion, LOGISTICA_listarSolicitudesCotizacion, LOGISTICA_actualizarEstadoSolicitudCotizacion, LOGISTICA_anularConsolidacion/-LineaConsolidacion/-ItemPendienteConsolidacion, LOGISTICA_verRequerimientoCompletoPorDetalle, LOGISTICA_registrar/-listar/-aprobarRechazarSaldoPendiente, LOGISTICA_migrarSaldoDirectoConsolidacion, LOGISTICA_insertarNotificacionStock, LOGISTICA_listarMisNotificaciones, LOGISTICA_marcarNotificacionLeida, LOGISTICA_crear/-obtener/-guardarPrecios/-listar/-anular/-cerrarCotizacionOC'),
    ('AprobacionOrdenRepositoryImpl (api/consolidacion)', 'LOGISTICA_enviarAprobacionOrden, LOGISTICA_listarPendientesAprobacion(-Detallado), LOGISTICA_aprobarOrden, LOGISTICA_rechazarOrden, LOGISTICA_anularOrden, LOGISTICA_listarHistorialAprobacion, LOGISTICA_listarAprobacionesPorRol, LOGISTICA_listarOCPendientesUnificado, LOGISTICA_crearOCDesdeConsolidacion/-crearOSDesdeConsolidacion, LOGISTICA_obtenerOCDesdeConsolidacion/-obtenerOSDesdeConsolidacion, LOGISTICA_reintentarSyncSpring'),
    ('GestionOCOSRepositoryImpl (api/logistica)', 'LOGISTICA_listarRequerimientosParaOC/-ParaOS/-ServicioParaOS/-Completos, LOGISTICA_crearOCBorrador/-OSBorrador/-OSIndividual, LOGISTICA_enviarOCAprobacion/-OSAprobacion, LOGISTICA_confirmarEnvioOC, LOGISTICA_aprobarOCConsolidacionSpring, LOGISTICA_restaurarEstadoOC, LOGISTICA_listarOCsPorEstado/-OSsPorEstado/-OSIndividuales, LOGISTICA_obtenerDetalleOC/-OCParaSincronizar/-OCrearGDGrupoNivel6, LOGISTICA_actualizarOCBorrador, LOGISTICA_guardarOCDirectaAprobacion, LOGISTICA_guardarAprobadorOC, LOGISTICA_guardar/-listar/-obtener/-actualizarAdjuntoOC, LOGISTICA_guardar/-actualizarAdjuntoSpring, LOGISTICA_actualizarConsolAdjunto, LOGISTICA_registrarGDArchivo, LOGISTICA_obtener/-guardarConfigEmpresa, LOGISTICA_listarEmpresas(-ConCarpeta), LOGISTICA_obtenerSeguimientoOrdenes, LOGISTICA_listarTiposPago/-Incoterms, LOGISTICA_listar/-guardarConfigPermisos, LOGISTICA_verificarPermiso, LOGISTICA_obtenerPrecioReferencialServicio, LOGISTICA_registrarConfirmacionServicio/-ConformidadOS'),
    ('SolicitudCompraRepositoryImpl', 'LOGISTICA_listarSolicitudesCompra, LOGISTICA_crearSolicitudCompra, LOGISTICA_actualizarEstadoSolicitudCompra, LOGISTICA_eliminarSolicitudCompra, LOGISTICA_obtenerSolicitudCompraPorId, LOGISTICA_obtenerContadoresSolicitudes, LOGISTICA_guardarAdjuntoSolicitudCompra'),
    ('AprobacionSCRepositoryImpl', 'LOGISTICA_listarSolicitudesPendientesAprobacionSC, LOGISTICA_aprobarSolicitudCompra, LOGISTICA_rechazarSolicitudCompra, LOGISTICA_asignarAprobadoresSC, LOGISTICA_obtenerHistorialAprobacionesSC, LOGISTICA_obtenerContadoresAprobacionesSC, LOGISTICA_obtenerRolesAprobacionSC, LOGISTICA_listar/-guardar/-eliminarFlujoAprobacionSC, LOGISTICA_listar/-guardar/-eliminarUsuarioAprobadorSC'),
    ('AprobacionSSRepositoryImpl', 'LOGISTICA_listarSSPendientesAprobacion, LOGISTICA_aprobarRechazarSS, LOGISTICA_asignarAprobadoresSS'),
    ('OrdenCompraRepositoryImpl', 'LOGISTICA_generarOrdenDesdeSolicitud, LOGISTICA_listarOrdenesCompra, LOGISTICA_obtenerOrdenCompraPorId, LOGISTICA_actualizarEstadoOrdenCompra, LOGISTICA_anularOrdenCompra, LOGISTICA_obtenerContadoresOrdenesCompra, LOGISTICA_sincronizarOrdenCompra, LOGISTICA_sincronizarOCConsolidacion'),
    ('OrdenServicioRepositoryImpl', 'LOGISTICA_generarOrdenServicio, LOGISTICA_listarOrdenesServicio, LOGISTICA_obtenerOrdenServicioPorId, LOGISTICA_asignarAprobadoresOS, LOGISTICA_aprobarRechazarOS, LOGISTICA_listarOSPendientesAprobacion, LOGISTICA_registrarConformidadServicio, LOGISTICA_sincronizarOrdenServicio, LOGISTICA_ingresarServicioTransporte, LOGISTICA_listarOSParaConformidad, LOGISTICA_obtenerDetalleOSConformidad'),
    ('AprobacionOCRepositoryImpl', 'LOGISTICA_listarOCPendientesAprobacion, LOGISTICA_aprobarRechazarOC, LOGISTICA_obtenerHistorialAprobacionOC, LOGISTICA_obtenerContadoresAprobacionOC, LOGISTICA_asignarAprobadoresOC, LOGISTICA_listar/-guardar/-eliminarUsuarioAprobadorOC, LOGISTICA_listar/-guardar/-eliminarFlujoAprobacionOC'),
    ('AprobacionOSRepositoryImpl', 'LOGISTICA_listarOSPendientesAprobacion, LOGISTICA_aprobarRechazarOS, LOGISTICA_anularOS, LOGISTICA_obtenerOSDetalleAprobacion, LOGISTICA_obtenerHistorialAprobacionesOS/-HistorialOS, LOGISTICA_obtenerContadoresAprobacionOS, LOGISTICA_listar/-guardar/-eliminarUsuarioAprobadorOS, LOGISTICA_listar/-guardar/-eliminarFlujoAprobacionOS'),
    ('RecepcionOCRepositoryImpl', 'LOGISTICA_listarOCsParaRecepcion, LOGISTICA_registrarRecepcionOC, LOGISTICA_listarRecepciones, LOGISTICA_obtenerRecepcionPorId, LOGISTICA_validarRecepcion, LOGISTICA_ingresarRecepcionKardex, LOGISTICA_obtenerContadoresRecepciones'),
    ('ConformidadAlmacenRepositoryImpl', 'LOGISTICA_listarNotasConformidad, LOGISTICA_registrarConformidad, LOGISTICA_obtenerDetalleNota'),
    ('KardexRepositoryImpl (api/kardex)', 'LOGISTICA_registrarTransaccionKardex, LOGISTICA_procesarTransaccionKardex, LOGISTICA_listarTransaccionesKardex, LOGISTICA_obtenerDetalleTransaccionKardex, LOGISTICA_consultarKardex, LOGISTICA_consultarStock, LOGISTICA_reporteValorizacion, LOGISTICA_dashboardInventario, LOGISTICA_anularTransaccionKardex, LOGISTICA_probarFlujoCompleto, LOGISTICA_ejecutarRecepcionOC, LOGISTICA_sincronizarSpring, LOGISTICA_ejecutarSincronizacionSpring, LOGISTICA_verificarEstadoSincronizacion'),
    ('GestionInventarioRepositoryImpl', 'LOGISTICA_listar/-crear/-aprobarAjusteInventario, LOGISTICA_listar/-crearConteosInventario, LOGISTICA_registrarConteoFisico, LOGISTICA_finalizarConteoInventario, LOGISTICA_obtenerDetalleConteo'),
    ('ListasStockRepositoryImpl', 'LOGISTICA_listar/-crear/-actualizar/-eliminarListaStock, LOGISTICA_verificarStockVsLimites, LOGISTICA_generarAlertasStock, LOGISTICA_listarAlertasStock, LOGISTICA_atenderAlertaStock'),
    ('DevolucionProveedorRepositoryImpl', 'LOGISTICA_registrar/-listar/-obtener/-cambiarEstado/-resolver/-anularDevolucionProveedor, LOGISTICA_listarRecepcionesNoConformes, LOGISTICA_generarDevolucionDesdeRecepcion'),
    ('DevolucionConsumoRepositoryImpl', 'LOGISTICA_registrar/-listar/-obtener/-aprobar/-rechazar/-anular/-cambiarEstado/-resolverDevolucionConsumo, LOGISTICA_listarDespachosConsumo, LOGISTICA_listarItemsDevolucionConsumo, LOGISTICA_generarDevolucionDesdeConsumo'),
    ('ReingresoRepositoryImpl', 'LOGISTICA_registrar/-listar/-obtener/-aprobar/-rechazar/-anular/-cerrar/-editarReingreso, LOGISTICA_listarSaldosPendientes, LOGISTICA_generarReingresoDesdeSaldo, LOGISTICA_listarItemsDisponiblesReingreso, LOGISTICA_generarReporteReingreso'),
    ('SolicitudServicioRepositoryImpl / SeguimientoOSRepositoryImpl', 'LOGISTICA_guardar/-listar/-obtener/-enviar/-anularSolicitudServicio, LOGISTICA_obtenerContadoresSS; LOGISTICA_obtenerSeguimientoOS'),
    ('CotizacionServicioRepositoryImpl', 'LOGISTICA_guardar/-listar/-seleccionarCotizacionServicio'),
    ('DashboardComprasRepositoryImpl / DashboardJlologistRepositoryImpl / DashboardLogisticaRepositoryImpl', 'LOGISTICA_obtenerKPIsDashboardCompras/-SolicitudesPorEstado/-TendenciaSolicitudes/-TopItemsSolicitados/-SolicitudesRecientes/-EstadisticasPorAlmacen; LOGISTICA_obtenerKPIsDashboardJLOLOGIST, LOGISTICA_listar(Reqs/OCs)RecientesDashboardJLOLOGIST, LOGISTICA_listarItemsDetalleDashboardJLOLOGIST; LOGISTICA_obtener(KPIsRequerimientos/RequerimientosPorMes/-PorEstado/SeguimientoOrdenes/EntregasHoy/EstadoAlmacen/ResumenCompras/GastosMensuales/OrdenesCompra/OrdenesServicio/SolicitudesCompra/Proveedores), LOGISTICA_reporte(Compras/Inventario/Proveedores/Tiempos/Gastos/Consolidado)'),
    ('ReportesComprasRepositoryImpl', 'LOGISTICA_reporteSolicitudesPorPeriodo/-ItemsSolicitados/-EficienciaAprobaciones/-SolicitudesPorUsuario/-AnalisisRechazos/-ComparativoAlmacenes'),
    ('Configuración y administración', 'BrandingRepositoryImpl: LOGISTICA_obtener/-guardarConfigBranding. ConfigSmtpRepositoryImpl: LOGISTICA_listar/-guardar/-eliminarConfigSmtp, LOGISTICA_probarConexionSmtp. ConfigMenuRepository: LOGISTICA_listar/-guardar/-obtener/-eliminarConfigMenu(-PorId). ConfiguracionPermisoRepository: LOGISTICA_listar/-guardar/-obtener/-eliminarConfigPermiso, LOGISTICA_listarRolesConMenuConfig. NotificacionConfigRepositoryImpl: LOGISTICA_listar/-guardar/-eliminarNotificacionTipo, LOGISTICA_listar/-guardarNotificacionConfig, LOGISTICA_listar/-guardarNotificacionParam. PlantillaCorreoRepositoryImpl / PlantillaPdfRepositoryImpl / ProveedorEmailRepositoryImpl: LOGISTICA_listar/-guardar/-eliminar(PlantillasCorreo/PlantillasPdf/ProveedoresEmail + crear/actualizar). TipoCambioRepositoryImpl: LOGISTICA_obtenerTipoCambio. UnidadMedidaRepositoryImpl: LOGISTICA_listarUnidadesMedida, LOGISTICA_guardar/-eliminarUnidadMedida. AuthRepositoryImpl: LOGISTICA_loginUsuarioRol'),
    ('AdminLogisticaController (panel)', 'Tablas directas LOGISTICA_Usuarios/LOGISTICA_AdminUsuarios + SPs: LOGISTICA_obtener/-guardarConfigIncrementoOC, LOGISTICA_listarHistorial/-AuditoriaConfigIncrementoOC, LOGISTICA_solicitarCreacionItem, LOGISTICA_limpiarDataFlujo, LOGISTICA_listarBackupsLimpieza, LOGISTICA_previewTabla, LOGISTICA_restaurarDataFlujo'),
]
table(['Repositorio / Controller', 'Stored Procedures que ejecuta'], repos, widths=[2.1, 5.1])

h1('4. SPs clave explicados')
h2('4.1 LOGISTICA_generarSalidaNSWH_JSON (despacho)')
bullets([
    'Recibe JSON con CompaniaSocio, RequisicionNumero, AlmacenCodigo, Periodo, FechaDocumento y detalle (Secuencia, Item, Cantidad, Lote, CentroCosto, Actividad).',
    'Genera el número de documento NS correlativo, inserta WH_TransaccionHeader/Detalle en SPRING, actualiza WH_Kardex y descuenta WH_ItemAlmacenLote.',
    'Devuelve NumeroDocumento y errorgeneral; el frontend marca líneas como atendidas y estados=DESPACHADO.',
])
h2('4.2 LOGISTICA_insertarRequisicionesWH / actualizarRequisicionSPRING (aprobación consumo)')
bullets([
    'Recibe la requisición completa (cabecera + detalle + distribución contable) y la inserta en SPRING devolviendo RequisicionNumero.',
    'Campos clave: Clasificacion MAT, ComprasAlmacenFlag A, PrioridadCodigo, DefaultPrime (CECO), DefaultAfe (proyecto), origen=app_logistica.',
])
h2('4.3 LOGISTICA_sincronizarordencompra (OC → SPRING)')
bullets([
    'Genera NumeroOrden correlativo por serie WHPO y compañía (primeros 8 dígitos del RUC).',
    'Inserta/actualiza en LOGISTICA (ordencompra + detalle + distribucion) y en SPRING WH_OrdenCompra(+Detalle+Distribucion).',
    'Trunca campos CHAR del ERP (fix error 8152): Observaciones 255, ProyectoDft 15, CentroCostoDft 10, CecoDestino 6, CampoReferencia 12, UltimoUsuario 20.',
])
h2('4.4 LOGISTICA_aprobarRechazarOC (aprobación unificada)')
bullets([
    'Detecta el origen de la OC (flujo nuevo LOGISTICA_AprobacionOrden o antiguo LOGISTICA_AprobacionOC).',
    'APROBAR: avanza NivelActual; al llegar a NivelRequerido marca APROBADA en la aprobación y en LOGISTICA_ConsolOC.',
    'RECHAZAR: marca RECHAZADA y rechaza los niveles pendientes.',
    'Parámetros: idAprobacion o numeroOrden, accion, usuarioAprueba, nombreUsuario, observaciones.',
])
h2('4.5 Motor de aprobación por ámbitos')
bullets([
    'registrarRutaAmbito crea la ruta de un requerimiento según las reglas (LOGISTICA_ReglaAprobacionAmbito) evaluando monto/tipo/área.',
    'decidirRutaAmbito registra la decisión del paso actual y calcula el siguiente paso; marcarEfectoFinalAmbito aplica el efecto final (aprobado/rechazado).',
    'simularRutaAmbito permite probar la ruta sin afectar datos; config de auto-aprobación puede saltar niveles.',
    'cambiarDespliegueAmbito controla el rollout gradual por área entre flujo legado y flujo por ámbitos.',
])
h2('4.6 Kardex')
bullets([
    'registrarTransaccionKardex crea la transacción (INGRESO/SALIDA/AJUSTE); procesarTransaccionKardex actualiza LOGISTICA_Kardex y LOGISTICA_Stock con costo promedio ponderado.',
    'ejecutarRecepcionOC registra en SPRING la recepción (NI/ROC), kardex, stock y documentos AP.',
    'sincronizarSpring/ejecutarSincronizacionSpring envían pendientes al ERP y registran LOGISTICA_SincronizacionSpringLog; verificarEstadoSincronizacion reporta el estado.',
])
p(); p('— Fin de la Documentación Técnica —', italic=True)
d.save(BASE + r'\DOCUMENTACION_TECNICA_API_SP.docx')
print('OK tecnica')

# #############################################################################
# DOC 3 — BASE DE DATOS
# #############################################################################
d = new_doc()
h1, h2, h3, h4, p, bullets, numbered, code, table, portada = helpers(d)
portada('DOCUMENTACIÓN DE BASE DE DATOS', 'Tablas, configuración e integración — Suite de Logística')

h1('1. Visión general')
bullets([
    'Motor: SQL Server. Base QAS: LOGISTICA_QAS (172.16.20.25); producción: LOGISTICA.',
    'Toda la lógica de negocio reside en stored procedures LOGISTICA_*; la API solo los ejecuta.',
    'Integración con el ERP SPRING (HASS) vía linked server: tablas WH_* y AP_*.',
    'El frontend además persiste en IndexedDB (Dexie) para operación offline.',
    'Los scripts de creación/migración están en api_logistica/SQL (~745 archivos).',
])

h1('2. Inventario de tablas por dominio')
h2('2.1 Núcleo de requerimientos')
table(['Tabla', 'Descripción'], [
    ['logistica_requerimientos', 'Cabecera: idrequerimiento (RUC+almacén+DNI+timestamp), ruc, idfundo, idarea, idalmacen, tipo (CONSUMO/COMPRA/TRANSFERENCIA), itemtipo, estados (PENDIENTE/APROBADO/RECHAZADO/DESPACHADO/ANULADO), estado (0/1 sincronizado), prioridad, glosa, fecha, RequisicionNumero, eliminado.'],
    ['logistica_detalle_requerimientos', 'Líneas: codigo, producto, cantidad, proyecto, ceco, turno, labor, atendida.'],
    ['LOGISTICA_ReqCommodity / LOGISTICA_DReqCommodity', 'Requerimientos tipo commodity/servicio.'],
    ['LOGISTICA_RequerimientoTransferencia', 'Requerimientos de transferencia entre almacenes.'],
    ['Adjuntos de requerimiento', 'Archivos adjuntos por requerimiento (guardar/listar/eliminar).'],
], widths=[2.6, 4.6])
h2('2.2 Aprobaciones')
table(['Tabla', 'Descripción'], [
    ['logistica_aprobaciones', 'Aprobaciones legadas: nivel, estado, dniAprobador, fecha, observación.'],
    ['LOGISTICA_AprobacionOrden / Detalle', 'Flujo nuevo OC/OS: NivelActual, NivelRequerido, Estado; detalle por nivel con RolAprobador, DniAprobador, Observacion, FechaAccion.'],
    ['LOGISTICA_AprobacionOC / LOGISTICA_AprobacionOS', 'Flujo antiguo de aprobación de órdenes.'],
    ['LOGISTICA_FlujoAprobacionOC', 'Reglas de niveles por rango de monto y rol aprobador.'],
    ['LOGISTICA_AmbitoOrganizacional / AreaAmbito / AsignacionAmbitoUsuario', 'Motor por ámbitos: ámbitos, áreas cubiertas y asignaciones de responsables.'],
    ['LOGISTICA_ReglaAprobacionAmbito / ResponsableReglaAmbito', 'Reglas de ruteo por condiciones (monto, tipo) y sus responsables.'],
    ['LOGISTICA_RutaRequerimientoAmbito / PasoRutaAmbito / EventoRutaAmbito', 'Ruta instanciada por requerimiento, pasos y eventos (decisiones).'],
    ['LOGISTICA_EfectoFinalRutaAmbito / DespliegueAprobacionAmbito / AuditoriaConfigAmbito', 'Efecto final de la ruta, control de despliegue gradual y auditoría de configuración.'],
    ['LOGISTICA_ConfigAutoaprobacion', 'Reglas de auto-aprobación.'],
    ['Aprobadores N2 / flujo por área', 'Cadena de aprobadores nivel 2 y flujo por área (guardar/listar/reordenar).'],
], widths=[2.9, 4.3])
h2('2.3 Compras: SC, consolidación, cotizaciones, OC')
table(['Tabla', 'Descripción'], [
    ['LOGISTICA_SolicitudCompra / Detalle(+adjuntos)', 'Solicitudes de compra con estados, prioridad, montos, moneda, fecha requerida.'],
    ['LOGISTICA_ConsolidacionCab / Det / Origen', 'Consolidaciones: cabecera, líneas consolidadas y trazabilidad al requerimiento origen.'],
    ['LOGISTICA_ItemPendienteConsolidacion', 'Ítems aprobados pendientes de consolidar.'],
    ['LOGISTICA_SolicitudCotizacion / Det', 'Solicitudes de cotización generadas desde consolidación.'],
    ['LOGISTICA_Cotizacion / Det', 'Cotizaciones de proveedores.'],
    ['LOGISTICA_CotizacionOC / Detalle', 'Cotización directa ligada a OC con precios.'],
    ['LOGISTICA_ConsolOC / ConsolOCDet', 'OC del flujo nuevo (borrador → aprobación → enviada → SPRING); estado, estadoSpring, montos, proveedor.'],
    ['LOGISTICA_ConsolOS / ConsolOSDet / ConsolOSConformidad', 'OS del flujo de consolidación de servicios y su conformidad.'],
    ['LOGISTICA_OrdenCompra / Det', 'Órdenes de compra (flujo por solicitud).'],
    ['LOGISTICA_OrdenServicio / Detalle', 'Órdenes de servicio.'],
    ['LOGISTICA_OCAdjunto / LOGISTICA_ConsolAdjunto', 'Adjuntos de OC y de consolidación (con B64/metadatos para migración a SPRING).'],
    ['LOGISTICA_OCIncrementoLog', 'Log de incrementos de cantidad aplicados a OCs.'],
    ['LOGISTICA_RecepcionOC / Det', 'Recepciones de mercadería por OC (parciales/totales, cantidades recibidas).'],
    ['LOGISTICA_ConformidadAlmacen', 'Notas de conformidad de almacén por recepción.'],
    ['LOGISTICA_OSConformidad / ConfirmacionServicioRealizado', 'Conformidad de servicios.'],
    ['LOGISTICA_HistorialPrecioServicio', 'Precios referenciales históricos de servicios.'],
], widths=[3.0, 4.2])
h2('2.4 Inventario, kardex y despachos')
table(['Tabla', 'Descripción'], [
    ['logistica_despachos / detalle', 'Despachos realizados: numeroNS, numeroRequisicion, almacén, usuario; líneas solicitado/despachado.'],
    ['LOGISTICA_SaldoPendienteAprobacion / Det', 'Saldos pendientes de aprobación por falta de stock.'],
    ['LOGISTICA_Item', 'Maestro de ítems: codigoItem, descripcionItem, unidadMedida, costoPromedio, stockMinimo/Maximo.'],
    ['LOGISTICA_Almacen', 'Maestro de almacenes.'],
    ['LOGISTICA_TransaccionInventario / Detalle', 'Transacciones INGRESO/SALIDA/AJUSTE con documento origen, almacenes, valor total.'],
    ['LOGISTICA_Kardex', 'Movimientos: tipoMovimiento, cantidadEntrada/Salida, saldo, costoUnitario/Total, metodoValorizacion=PROMEDIO, documento, idTransaccionOrigen.'],
    ['LOGISTICA_Stock', 'Stock actual por ítem/almacén con costoPromedio y valorInventario.'],
    ['LOGISTICA_SincronizacionLog / (SpringLog)', 'Log de sincronizaciones al ERP.'],
    ['LOGISTICA_NotificacionesStock', 'Notificaciones de stock disponible/alertas.'],
    ['Listas de stock', 'Listas de control con límites y alertas generadas.'],
    ['Devoluciones / Reingresos', 'Tablas de devolución a proveedor, devolución de consumo y reingresos con estados de aprobación.'],
], widths=[3.0, 4.2])
h2('2.5 Administración y configuración')
table(['Tabla', 'Descripción'], [
    ['LOGISTICA_Usuarios / LOGISTICA_AdminUsuarios', 'Usuarios del sistema y del panel admin.'],
    ['LOGISTICA_Roles / LOGISTICA_UsuariosRoles', 'Roles y asignación usuario↔rol.'],
    ['LOGISTICA_Perfiles / PerfilesRoles / PerfilesUsuarios', 'Perfiles que agrupan roles y su asignación a usuarios (roles efectivos).'],
    ['LOGISTICA_Areas (+subáreas) / usuarios por área', 'Estructura organizacional y jefes de área.'],
    ['Flujos y aprobadores', 'Flujos de aprobación y aprobadores por nivel/monto.'],
    ['LOGISTICA_ConfigMenu', 'Menús dinámicos por rol.'],
    ['LOGISTICA_ConfigPermisos / LOGISTICA_ConfiguracionPermiso', 'Matriz de permisos rol↔función (nuevo y legacy).'],
    ['ConfigSmtp', 'Configuración SMTP por empresa.'],
    ['LOGISTICA_ConfigBranding / ConfigEmpresa / ConsolConfigEmpresa', 'Branding y datos de empresa multi-RUC.'],
    ['LOGISTICA_ConfigPDF', 'Configuración del formato PDF de OC.'],
    ['LOGISTICA_PlantillaAlmacen / PlantillaConformidadServicio', 'Plantillas de documentos de almacén y conformidad de servicio.'],
    ['PlantillasCorreo / PlantillasPdf / ProveedoresEmail', 'Plantillas de correo, plantillas PDF y correos de proveedores.'],
    ['LOGISTICA_NotificacionTipo / Config / Param', 'Tipos de notificación, configuración y parámetros.'],
    ['LOGISTICA_ConfigAccesoReporte / Area / ConfigReporteMenu', 'Acceso a reportes por usuario/área y menú de reportes.'],
    ['LOGISTICA_Parametros', 'Parámetros clave-valor del sistema.'],
    ['LOGISTICA_ConfigIncrementoOC / Auditoria', 'Config vigente de incremento de cantidad OC y su auditoría.'],
    ['LOGISTICA_Correlativo', 'Correlativos de documentos (ítems, requisiciones, órdenes).'],
    ['LOGISTICA_Auditoria', 'Log de auditoría de acciones del panel admin-logistica.'],
    ['LOGISTICA_CorreoLog / ConsolCorreoLog', 'Log de correos enviados.'],
    ['LOGISTICA_UnidadMedida', 'Unidades de medida.'],
    ['LOGISTICA_Proveedor', 'Proveedores registrados.'],
    ['LOGISTICA_MaestroItemCache / MaestroItemSync', 'Caché y control de sincronización de la maestra de ítems.'],
    ['LOGISTICA_LimpiezaBackups', 'Backups previos a limpiezas de mantenimiento.'],
    ['AppDeployments', 'Versiones desplegadas por ambiente (control de actualización PWA).'],
], widths=[3.0, 4.2])

h1('3. Tablas del ERP SPRING (destino)')
table(['Tabla SPRING', 'Qué escribe el sistema'], [
    ['WH_Requisicion (+detalle/distribución)', 'Requisición al aprobar un requerimiento de consumo (vía LOGISTICA_insertarRequisicionesWH).'],
    ['WH_OrdenCompra / Detalle / Distribucion', 'OC sincronizada: cabecera con CompaniaSocio, NumeroOrden (serie WHPO), Proveedor, MonedaCodigo, FechaPrometida, MontoTotal, FormadePago, Estado PE/AP/EN/AN; detalle con Item (6 dígitos), CantidadPedida, PrecioUnitario, CentroCosto; distribución con Account/Afe/Monto.'],
    ['WH_TransaccionHeader / Detalle', 'Documentos de almacén: NI (ingreso por recepción OC, código ROC), NS (salida por despacho), AJ (ajustes).'],
    ['WH_Kardex', 'Movimientos de inventario en el ERP.'],
    ['WH_ItemAlmacenLote', 'Stock por ítem/almacén/lote en el ERP.'],
    ['WH_ItemMast', 'Maestro de ítems (alta desde logística, código a 6 dígitos, CuentaInventario 25111001).'],
    ['AP_Documentos / Detalle', 'Documentos de cuentas por pagar generados por recepciones (clasificación RCD).'],
], widths=[2.6, 4.6])
h3('Reglas de integración')
bullets([
    'Item siempre con formato de 6 dígitos con ceros a la izquierda; lote por defecto "00".',
    'Truncado a la longitud CHAR del ERP en campos texto (Observaciones 255, ProyectoDft 15, CentroCostoDft 10, CecoDestino 6, CampoRef 12, UltimoUsuario 20).',
    'Deduplicación con NOT EXISTS en inserts a SPRING.',
    'CompaniaSocio = primeros 8 dígitos del RUC; período en formato yyyyMM.',
])

h1('4. IndexedDB (Dexie) en el frontend')
p('Base "LogisticaDB". Tablas y propósito:')
table(['Grupo', 'Tablas'], [
    ['Sesión/config', 'usuario, configuracion'],
    ['Maestras sincronizadas', 'empresas, fundos, almacenes(+Destino), areas, proyectos(AFE+CECO+labor), cultivos, turnos, acopios, cecos, labores, itemComoditys, items, comodities/commoditys, subClasificaciones, clasificaciones, proveedores, tipoGastos, activosFijos, maestroItems, maestroCommoditys, maestroSubCommoditys'],
    ['Requerimientos offline', 'requerimientos(+detalles), requerimientosCommodity/ActivoFijo/ActivoFijoMenor(+detalles por tipo)'],
    ['Ciclo de compras offline', 'solicitudesCompra(+detalleSolicitudCompra+solicitudCompraAdjuntos), solicitudesServicio(+solicitudServicioAdjuntos), cotizaciones(+detalleCotizacion), ordenesCompra(+detalleOrdenCompra)'],
    ['Stock local', 'stock (por companiaSocio+codigo+almacen)'],
], widths=[1.8, 5.4])

h1('5. Estados de los documentos')
table(['Documento', 'Estados'], [
    ['Requerimiento', 'PENDIENTE → APROBADO / RECHAZADO / ANULADO → CONSOLIDADO / EN_SC / DESPACHADO; campo estado 0=no sincronizado, 1=sincronizado'],
    ['Solicitud de compra', 'BORRADOR/PENDIENTE → ENVIADA → APROBADA / RECHAZADA'],
    ['OC (ConsolOC)', 'PENDIENTE → PENDIENTE_APROBACION → APROBADA / RECHAZADA / ANULADA → ENVIADA'],
    ['estadoSpring', 'PENDIENTE_SYNC → SYNCHRONIZED / ERROR_SYNC (reintento disponible)'],
    ['OC en SPRING', 'PE (pendiente) / AP (aprobada) / EN (enviada) / AN (anulada)'],
    ['Recepción', 'PENDIENTE → REGISTRADA → VALIDADA → INGRESADA A KARDEX'],
    ['Devolución / Reingreso', 'PENDIENTE → APROBADA / RECHAZADA / ANULADA / RESUELTA'],
    ['Transacción inventario', 'PENDIENTE → PROCESADO'],
    ['Ruta por ámbitos', 'Pendiente por paso → decide cada paso → efecto final'],
], widths=[2.2, 5.0])

h1('6. Scripts SQL del repositorio')
p('api_logistica/SQL contiene ~745 scripts organizados por número de funcionalidad:')
bullets([
    '01–09: tablas base, SPs de requerimientos, consolidación, saldos, aprobaciones, login admin, notificaciones stock, cotizaciones y administración.',
    '27–31: kardex (tablas, SPs principales, sincronización SPRING corregida, SPs faltantes).',
    '240–244: solicitudes de compra, adjuntos, dashboard y reportes de compras.',
    '310–326: flujo completo OC/OS, aprobación y migración a SPRING, SP unificado aprobar/rechazar, fixes de sincronización (truncado, FOR JSON, idorigen).',
    'STEP/SYNCRONIZE: pasos de sincronización de OC con consolidación.',
    'STORED_PROCEDURES_STATUS.md: inventario de SPs referenciados por el backend y su archivo.',
])
h2('6.1 Convenciones')
bullets([
    'Prefijo LOGISTICA_ en tablas y SPs propios; tablas legadas en minúscula (logistica_requerimientos, etc.).',
    'Auditoría estándar: usuarioRegistro, fechaRegistro, ultimaFechaModif, ultimoUsuario, estado/eliminado.',
    'Muchos scripts son versiones corregidas del mismo SP (sufijos _FINAL/_CORREGIDO/_v2); el archivo más reciente es el vigente.',
])
p(); p('— Fin de la Documentación de Base de Datos —', italic=True)
d.save(BASE + r'\DOCUMENTACION_BASE_DATOS.docx')
print('OK bd')
