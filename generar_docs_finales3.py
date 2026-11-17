# -*- coding: utf-8 -*-
"""
Genera los ultimos 5 documentos:
  PROCEDIMIENTO_USUARIOS.docx, CHECKLIST_OPERACION_DIARIA.docx,
  CATALOGO_ERRORES.docx, DECISIONES_ARQUITECTURA.docx, ACTA_ENTREGA.docx
"""
import os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = r'C:\Users\jonathan.marquina\Documents\Proyectos\logistica'

def new_doc():
    d = Document()
    s = d.styles['Normal']; s.font.name='Calibri'; s.font.size=Pt(10.5)
    for i,(sz,col) in enumerate([(22,'1F4E79'),(15,'1F4E79'),(12,'2E74B5'),(11,'2E74B5')],start=1):
        h=d.styles[f'Heading {i}']; h.font.name='Calibri'; h.font.size=Pt(sz)
        h.font.bold=True; h.font.color.rgb=RGBColor.from_string(col)
    return d

def helpers(d):
    h1=lambda t:d.add_heading(t,level=1); h2=lambda t:d.add_heading(t,level=2)
    h3=lambda t:d.add_heading(t,level=3)
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
    def portada(titulo,subtitulo,indice=True):
        for _ in range(6): d.add_paragraph()
        t=d.add_paragraph(); t.alignment=WD_ALIGN_PARAGRAPH.CENTER
        r=t.add_run(titulo); r.bold=True; r.font.size=Pt(28); r.font.color.rgb=RGBColor.from_string('1F4E79')
        s=d.add_paragraph(); s.alignment=WD_ALIGN_PARAGRAPH.CENTER
        r=s.add_run(subtitulo); r.font.size=Pt(14); r.font.color.rgb=RGBColor.from_string('2E74B5')
        f=d.add_paragraph(); f.alignment=WD_ALIGN_PARAGRAPH.CENTER
        r=f.add_run('Suite de Logistica — Etapa 1  |  Noviembre 2026'); r.font.size=Pt(10); r.italic=True
        d.add_page_break()
        if indice:
            d.add_heading('Indice',level=1); toc(); d.add_page_break()
    return h1,h2,h3,p,bullets,numbered,code,table,portada

# =====================================================================
# 1. PROCEDIMIENTO DE USUARIOS (altas/bajas/cambios)
# =====================================================================
d=new_doc(); h1,h2,h3,p,bullets,numbered,code,table,portada=helpers(d)
portada('PROCEDIMIENTO DE GESTIÓN DE USUARIOS','Altas, bajas y cambios — Suite de Logística')

h1('1. Alcance y responsables')
p('Procedimiento para dar de alta, modificar y dar de baja usuarios de la Suite de Logística. '
  'Responsable: ADLOGIST o TILOGIST. JLOLOGIST solo puede crear usuarios con roles operativos.')
h2('1.1 Roles disponibles')
table(['Rol','Para quién'],[
 ['OPLOGIST','Personal de campo/área que crea requerimientos'],
 ['EMLOGIST','Operador de empaque/licitaciones'],
 ['APLOGIST','Jefe/aprobador de área'],
 ['GERENTE','Aprobación nivel 2 / gerencia'],
 ['ALLOGIST','Personal de almacén'],
 ['LOLOGIST','Operador de logística/compras'],
 ['JLOLOGIST','Jefe de logística'],
 ['JEMLOGIST','Jefe de licitaciones'],
 ['FINANZAS','Finanzas (nivel de aprobación OC)'],
 ['ADLOGIST','Administrador funcional'],
 ['TILOGIST','TI / administrador del sistema'],
],widths=[1.4,5.6])

h1('2. Alta de usuario')
h2('2.1 Datos previos a confirmar')
bullets(['El usuario existe en el ERP (SPRING) con credenciales activas.',
         'Rol(es) a asignar — puede ser multi-rol (separado por comas).',
         'Área/subárea a la que pertenece (si es aprobador u operativo por área).',
         'Perfil si corresponde (grupo de roles efectivos).'])
h2('2.2 Pasos (opción A — panel admin-logistica)')
numbered(['Ingresar a /admin-logistica/login con TILOGIST, ADLOGIST o JLOLOGIST.',
          'Ir a Usuarios: buscar el usuario en el catálogo ERP.',
          'Asignar rol(es) y estado activo; guardar.',
          'Si es aprobador: ir a Usuarios por Área y asignar área/subárea; marcar si es jefe.',
          'Si usa perfil: en /administracion → Perfiles → asignar perfil al usuario.',
          'Pedir al usuario que ingrese al portal y confirme que ve su pantalla inicial y menú.'])
h2('2.3 Pasos (opción B — panel /administracion)')
numbered(['Ingresar con admin-login (TILOGIST).',
          'Usuarios: registrar/configurar el usuario y rol.',
          'Roles/Perfiles según corresponda; Usuarios por Área para aprobadores.',
          'Verificar acceso con el usuario.'])
h2('2.4 Configuración adicional según rol')
table(['Si el rol es…','Configurar además'],[
 ['APLOGIST','Área/subárea y jefatura en Usuarios por Área; regla de ámbito si aplica.'],
 ['GERENTE / N2','Incluir en Aprobadores Nivel 2 o flujo de ámbitos.'],
 ['JLOLOGIST / JEMLOGIST / FINANZAS','Incluir en el flujo de aprobación de OC/OS por nivel.'],
 ['ALLOGIST','Almacén por defecto en parámetros del usuario.'],
 ['ADLOGIST / TILOGIST','Permisos del menú admin-logistica (Permisos por Rol).'],
],widths=[2.2,4.8])

h1('3. Modificación de usuario')
table(['Cambio','Dónde'],[
 ['Cambiar rol','Usuarios (admin-logistica) o /administracion → Usuarios/Roles'],
 ['Cambiar área','Usuarios por Área'],
 ['Cambiar perfil','/administracion → Perfiles → asignar/quitar perfil'],
 ['Cambiar permisos de menú','Permisos por Rol / Menú dinámico'],
 ['Cambiar aprobador de flujo OC','Aprobadores / Flujo OC'],
],widths=[2.4,4.6])

h1('4. Baja de usuario')
numbered(['Solicitud formal del jefe del área (correo/ticket).',
          'En Usuarios: desactivar el usuario (estado inactivo). No borrar (auditoría).',
          'Quitar asignaciones de área y de flujos de aprobación.',
          'Verificar que no quedan documentos pendientes de su aprobación (reasignar si hay).',
          'Registrar la baja; queda en auditoría.'])
h1('5. Verificación')
bullets(['El usuario ingresa con su clave ERP y ve solo su menú.',
         'La pantalla inicial corresponde a su rol.',
         'Si es aprobador, ve los documentos de su ámbito.',
         'Toda acción queda en LOGISTICA_Auditoria.'])
h1('6. Problemas frecuentes')
table(['Situación','Acción'],[
 ['"Sin permisos" tras el alta','Revisar rol exacto (multi-rol sin espacios) o asignar perfil.'],
 ['No ve documentos de su área','Asignar Usuarios por Área / revisar ámbito.'],
 ['Ve opciones de otro rol','idrol con más de un rol — revisar el valor exacto.'],
 ['No ingresa al panel admin','Solo TILOGIST/ADLOGIST/JLOLOGIST pueden entrar a admin-logistica.'],
],widths=[3.0,4.0])
p('— Fin del Procedimiento —',italic=True)
d.save(os.path.join(BASE,'PROCEDIMIENTO_USUARIOS.docx')); print('OK usuarios')

# =====================================================================
# 2. CHECKLIST OPERACIÓN DIARIA
# =====================================================================
d=new_doc(); h1,h2,h3,p,bullets,numbered,code,table,portada=helpers(d)
portada('CHECKLIST DE OPERACIÓN DIARIA','Health check — Suite de Logística')
h1('1. Checklist (ejecutar cada mañana)')
table(['N','Verificación','Cómo / dónde','OK'],[
 ['1','API responde','Abrir https://<api>/swagger — debe cargar','☐'],
 ['2','Portal carga','Abrir la URL del portal y hacer login de prueba','☐'],
 ['3','Sin documentos en ERROR_SYNC','Consulta SQL (sección 2) → 0 filas o revisar','☐'],
 ['4','Cola SPRING sin atraso','LOGISTICA_ColaMigracionSpring sin pendientes viejos','☐'],
 ['5','Aprobaciones fluyen','Bandejas con pendientes recientes procesándose','☐'],
 ['6','Correos saliendo','LOGISTICA_CorreoLog últimas 24h sin errores','☐'],
 ['7','Versión desplegada correcta','AppDeployments coincide con lo publicado','☐'],
 ['8','BD accesible','Consulta rápida en LOGISTICA_Parametros','☐'],
 ['9','Linked server SPRING','SELECT de prueba a tabla WH_*','☐'],
 ['10','Backups al día','Último backup de LOGISTICA generado','☐'],
],widths=[0.4,2.6,3.4,0.4],fsize=8.5)
h1('2. Consultas rápidas')
code("""-- Errores de sincronización (debe ser 0)
SELECT COUNT(*) FROM LOGISTICA_SincronizacionSpringLog WHERE estado='ERROR';
-- Cola pendiente
SELECT COUNT(*) FROM LOGISTICA_ColaMigracionSpring;
-- Correos con error últimas 24h
SELECT * FROM LOGISTICA_CorreoLog WHERE estado='ERROR' AND fechaRegistro>=DATEADD(day,-1,GETDATE());
-- Versión activa por ambiente
SELECT * FROM AppDeployments ORDER BY fechaRegistro DESC;""")
h1('3. Si algo falla')
bullets(['ERROR_SYNC o cola detenida → RUNBOOK sección SPRING / reintentar.',
         'API/portal caído → PLAN_CONTINGENCIA escenario correspondiente.',
         'Correos → revisar ConfigSmtp y CorreoLog.',
         'Documento el hallazgo y escala a N3 si no se resuelve.'])
h1('4. Registro semanal')
table(['Semana','Responsable','Hallazgos','Acciones'],[
 ['__/__ - __/__','________','________','________'],
 ['__/__ - __/__','________','________','________'],
 ['__/__ - __/__','________','________','________'],
],widths=[1.4,1.6,2.0,2.0])
p('— Fin del Checklist —',italic=True)
d.save(os.path.join(BASE,'CHECKLIST_OPERACION_DIARIA.docx')); print('OK checklist')

# =====================================================================
# 3. CATALOGO DE ERRORES
# =====================================================================
d=new_doc(); h1,h2,h3,p,bullets,numbered,code,table,portada=helpers(d)
portada('CATÁLOGO DE ERRORES','Mensaje → causa → acción — Suite de Logística')
h1('1. Cómo usar')
bullets(['Los mensajes con ":" llevan el detalle técnico del API/SP después del prefijo.',
         'Errores "Error al …" sin detalle suelen ser de red o del SP; revisar consola y logs.',
         'Los mensajes del SP de SPRING vienen del ERP (CECO, ítem, correlativo, linked server).'])

def seccion(tit,rows):
    h2(tit); table(['Mensaje','Causa probable','Acción'],rows,widths=[2.4,2.0,2.6],fsize=8)

seccion('2. Acceso y configuración',[
 ['"Falta configurar" / Campos faltantes','Parámetros no guardados','Completar Parámetros y Guardar configuración'],
 ['"Acceso denegado"','Sin rol o sin ámbito','Revisar rol/área del usuario'],
 ['"Debe seleccionar un rol/usuario/empresa"','Campo obligatorio','Completar el formulario'],
 ['Sesión expira / vuelve al login','Token vencido (8h)','Reingresar'],
])
seccion('3. Requerimientos y aprobaciones',[
 ['"Error Guardando Activo Fijo/Commodity"','Dato obligatorio inválido (AFE/clase)','Revisar campos de la línea'],
 ['"ítem sin stock"','Validación en línea','Cambiar almacén o hacer requerimiento de compra'],
 ['"Error al aprobar requerimiento:" + detalle SP','Dato inexistente en SPRING','Verificar CECO/AFE/ítem en ERP'],
 ['"Debe seleccionar al menos un ítem para aprobar"','Sin selección','Marcar filas'],
 ['"Error al anular requerimiento/consolidación"','Documento ya avanzó (despachado/integrado)','Solo anulable según estado; escalar'],
 ['"Error al actualizar estado del requerimiento"','SP de estado','Ver detalle; reintentar'],
])
seccion('4. Compras / OC / servicios',[
 ['"Error al actualizar orden de compra"','Validación de flujo/estado','Revisar nivel de aprobación y estado'],
 ['"Error al anular orden"','OC ya sincronizada/aprobada','Requiere proceso manual en ERP'],
 ['"Error al abrir comparación"','Falta cotización/datos','Registrar cotizaciones antes'],
 ['Error de correo al proveedor','SMTP/plantilla/proveedor sin email','Revisar ConfigSmtp, plantilla y correo del proveedor'],
 ['"Error al aprobar/rechazar OS"','Flujo OS','Revisar nivel y permisos'],
])
seccion('5. Almacén, kardex e inventario',[
 ['"Error SPRING TRANSFERENCIA:"','SP de transferencia al ERP','Revisar almacén destino e ítem; detalle en el mensaje'],
 ['"Error actualizando stock:"','Kardex/stock','Verificar ítem/almacén; reintentar'],
 ['"Error al anular transacción/devolución/reingreso"','Movimiento ya aplicado','Solo según estado; revisar kardex'],
 ['"Error al aprobar ajuste/devolución/reingreso"','Flujo de almacén','Revisar permisos/estado'],
 ['No genera salida NS','Ítem sin lote/stock en almacén','Verificar lote del ítem en SPRING'],
])
seccion('6. SPRING / sincronización',[
 ['estadoSpring = ERROR_SYNC','Fallo insertando en WH_*','Ver log, corregir dato, LOGISTICA_reintentarSyncSpring'],
 ['Documentos en PENDIENTE_SYNC que no avanzan','Cola detenida','procesar-cola-spring'],
 ['Timeout/linked server','SPRING inaccesible','Verificar linked server HASS-DB1'],
 ['"Error actualizando estado en BD LOGISTICA"','SP de estado tras sync','Revisar LOGISTICA_SincronizacionLog'],
])
seccion('7. Administración',[
 ['"Error agregando/actualizando configuración"','Dato duplicado o requerido','Revisar campos/unicidad'],
 ['"El RUC es requerido y debe tener 11 dígitos"','Validación empresa','Corregir RUC'],
 ['"El logo no debe superar los 2MB"','Branding','Reducir imagen'],
 ['"Error al asignar aprobadores"','Flujo/aprobador inválido','Verificar usuario y área'],
 ['"Error al aplicar la configuración por defecto"','Config incompleta','Completar datos base'],
])
h2('8. Errores genéricos del API')
table(['HTTP','Significado','Acción'],[
 ['400','Validación fallida','Revisar campos enviados'],
 ['401','Sesión inválida/expirada','Reingresar'],
 ['404','Endpoint/recurso no existe','Verificar versión/ruta'],
 ['500','Error en SP o servidor','Ver detalle en mensaje; revisar SP/log'],
 ['0 / network','API inaccesible','Verificar conexión y que la API responda'],
],widths=[0.8,2.6,3.6])
p('— Fin del Catálogo de Errores —',italic=True)
d.save(os.path.join(BASE,'CATALOGO_ERRORES.docx')); print('OK errores')

# =====================================================================
# 4. DECISIONES DE ARQUITECTURA (ADR)
# =====================================================================
d=new_doc(); h1,h2,h3,p,bullets,numbered,code,table,portada=helpers(d)
portada('DECISIONES DE ARQUITECTURA','ADR — por qué está hecho así')
h1('Formato')
p('Cada ADR: contexto → decisión → consecuencia. No "corregir" estas decisiones sin un ADR nuevo.')

def adr(n,tit,ctx,dec,cons):
    h2(f'ADR-{n}: {tit}')
    p('Contexto: '+ctx); p('Decisión: '+dec,bold=True); p('Consecuencia: '+cons)
adr('01','Lógica de negocio en Stored Procedures',
    'El ERP SPRING ya centralizaba lógica en SPs y los tiempos de respuesta de integración lo requerían.',
    'Toda la lógica de negocio vive en SPs (Dapper/SqlClient); EF Core existe pero no se usa para la operación.',
    'Cambios de negocio no requieren redeploy del API. La BD es el punto crítico; el versionado de SPs se controla por scripts SQL numerados.')
adr('02','Angular standalone + hash routing',
    'IIS sirve la SPA; se evitó configuración de URL rewrite compleja y se simplificó el fallback.',
    'provideRouter(routes, withHashLocation()) → todas las rutas son /#/…',
    'El web.config solo necesita fallback a index.html; las URLs llevan # (estética, no funcional).')
adr('03','IndexedDB (Dexie) para offline',
    'Operación en campo con conectividad intermitente; maestras grandes del ERP.',
    'LogisticaDB guarda usuario, parámetros, ítems, CECOs y notificaciones.',
    'La app consulta local primero y sincroniza; ante corrupción se borra la DB y se reconfigura.')
adr('04','Multi-rol por comas en idrol',
    'Un mismo usuario puede ser operativo y aprobador a la vez.',
    'idrol admite lista separada por comas; los guards comparan cada valor exacto.',
    'No crear un rol "combo" por cada combinación. Los permisos son la suma de roles.')
adr('05','Tres accesos separados',
    'Portal operativo, admin global y admin logística tienen audiencias y controles distintos.',
    'Login principal (API Maestra), admin-login (ADMIN_TOKEN) y admin-logistica (token propio).',
    'Tres sesiones independientes; cada panel tiene su propio guard y token.')
adr('06','Aprobación OC/OS por niveles de monto',
    'La aprobación depende del monto y la jerarquía.',
    'Flujo configurable por niveles (JLOLOGIST→JEMLOGIST→FINANZAS→GERENTE) con registro por nivel.',
    'Los niveles se administran; un rechazo en cualquier nivel cierra el documento.')
adr('07','Sincronización a SPRING diferida con cola',
    'El ERP puede no estar disponible; no se puede perder la operación.',
    'estadoSpring (PENDIENTE_SYNC/SYNCHRONIZED/ERROR_SYNC) + LOGISTICA_ColaMigracionSpring + reintentos.',
    'La app opera sin SPRING en línea; hay reprocesos manuales/documentados.')
adr('08','PWA con actualización automática versionada',
    'Distribuir actualizaciones sin tienda y controlar la versión en campo.',
    'Service Worker (ngsw) + AppDeployments por ambiente + updateMode AUTO.',
    'Publicar una versión requiere registrar AppDeployments; rollback = versión previa.')
adr('09','Correos vía MailKit + SMTP por empresa',
    'Multiempresa con distintas cuentas de envío.',
    'ConfigSmtp por empresa + plantillas de correo.',
    'Cada empresa envía con su buzón; errores quedan en LOGISTICA_CorreoLog.')
adr('10','Menú dinámico por permisos',
    'Menús por rol sin recompilar.',
    'ConfigMenu + permisos por rol → menú dinámico en el layout.',
    'Mostrar/ocultar opciones es configuración, no código.')
p('— Fin de los ADR —',italic=True)
d.save(os.path.join(BASE,'DECISIONES_ARQUITECTURA.docx')); print('OK ADR')

# =====================================================================
# 5. ACTA DE ENTREGA (1-2 paginas, para firma)
# =====================================================================
d=new_doc(); h1,h2,h3,p,bullets,numbered,code,table,portada=helpers(d)
portada('ACTA DE ENTREGA A PRODUCCIÓN','Suite de Logística — Etapa 1',indice=False)
h1('1. Datos de la entrega')
table(['Concepto','Detalle'],[
 ['Sistema','Suite de Logística — Etapa 1'],
 ['Versión','7.0.1'],
 ['Fecha de entrega','____/____/______'],
 ['Ambiente','Producción (apilogistica:7018 / logistica:7019)'],
 ['Componentes entregados','Portal Angular PWA, API .NET 8, BD SQL Server (169 tablas, ~600 SPs), integración SPRING, subsitio /documentacion'],
 ['Documentación entregada','28 documentos Word (paquete completo)'],
],widths=[2.2,4.8])
h1('2. Alcance entregado')
bullets(['11 roles, 3 accesos (portal, admin-login, admin-logistica).',
         'Flujo completo: requerimiento → aprobaciones → compras/servicios → OC/OS → SPRING → recepción → despacho → kardex.',
         'Administración, notificaciones, dashboards, reportes y PWA con actualización automática.'])
h1('3. Validación')
table(['Verificación','Resultado'],[
 ['Prueba end-to-end requerimiento→aprobación→despacho→SPRING','________________'],
 ['Ciclo OC completo (aprobación, correo, sync, recepción)','________________'],
 ['Checklist de operación diaria ejecutado','________________'],
 ['Responsables capacitados por rol','________________'],
],widths=[4.4,2.6])
h1('4. Observaciones y pendientes')
p('_'*70); p('_'*70)
h1('5. Conformidad')
p('Se deja constancia de la entrega del sistema a producción conforme a lo descrito.')
d.add_paragraph(); d.add_paragraph()
table(['Entrega','Recibe'],[
 ['____________________\nTI / Desarrollo\nFecha: ____/____/______','____________________\nLogística / Negocio\nFecha: ____/____/______'],
],widths=[3.5,3.5])
d.save(os.path.join(BASE,'ACTA_ENTREGA.docx')); print('OK acta')
