# -*- coding: utf-8 -*-
"""
Genera la GUIA de configuracion de usuarios, areas y aprobaciones
del APP LOGISTICA en dos formatos: Word (.docx) y PDF.

Salida:
  ../docs/GUIA_CONFIGURACION_USUARIOS_APROBACIONES.docx
  ../docs/GUIA_CONFIGURACION_USUARIOS_APROBACIONES.pdf
"""
import os
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, Preformatted, PageBreak)

AZUL = "1F4E78"
GRIS_CODE = "F2F2F2"

# ================================================================
# CONTENIDO DEL DOCUMENTO (bloques compartidos docx/pdf)
# ================================================================
# tipos: h1, h2, p, bullet, table([headers], [rows]), code
C = []

def h1(t): C.append(("h1", t))
def h2(t): C.append(("h2", t))
def p(t): C.append(("p", t))
def bullet(items): C.append(("bullet", items))
def table(headers, rows): C.append(("table", headers, rows))
def code(t): C.append(("code", t))

h1("GUIA DE CONFIGURACION - USUARIOS, AREAS Y APROBACIONES")
p("Sistema: APP LOGISTICA | Modulos: Requerimientos, Aprobaciones, OC/OS | "
  "Documento para el equipo de Sistemas - configuracion inicial y altas masivas.")
p("Contenido: (1) Configuracion desde la aplicacion, (2) Uso del formato Excel "
  "de levantamiento, (3) Carga masiva directa a base de datos con scripts SQL y SPs.")

# ---------------------------------------------------------------- SEC 1
h1("1. CONFIGURACION DESDE LA APLICACION (sin tocar la base de datos)")
p("Todo se hace desde pantallas del sistema. El orden recomendado es:")
bullet([
    "1. Crear las AREAS (si faltan)",
    "2. Crear las CUENTAS de usuario (acceso a la app)",
    "3. Asignar USUARIOS A AREAS con su rol (solicitante, jefe, almacen)",
    "4. Definir el FLUJO de aprobacion por area y tipo de requerimiento",
    "5. Registrar aprobadores de OC",
    "6. Registrar aprobadores de OS",
])

h2("1.1 Acceso al panel de administracion")
bullet([
    "Ruta: menu Admin Logistica  ->  /admin-logistica/login",
    "Roles que ven las opciones de configuracion: TILOGIST y ADLOGIST.",
    "JLOLOGIST solo puede crear usuarios operativos (LOLOGIST, EMLOGIST, ALLOGIST, OPLOGIST, APLOGIST).",
])

h2("1.2 Crear areas - menu 'Areas'")
bullet([
    "Seleccionar la empresa (RUC) en el combo superior.",
    "Boton Nueva Area: nombre, descripcion, 'mostrarAdmision' y estado.",
    "Graba en la tabla LOGISTICA_Areas. El idarea se genera solo (identity).",
])

h2("1.3 Crear cuentas de usuario - menu 'Usuarios'")
bullet([
    "Boton Nuevo usuario -> buscar a la persona en el ERP por DNI o nombre.",
    "Al seleccionarla el sistema trae: nrodocumento, usuario, nombre y clave del ERP.",
    "Completar: Empresa (RUC), Rol del sistema y email -> Guardar.",
    "La persona ingresa a la app con su usuario (DNI) y la clave del ERP.",
    "Roles disponibles: SOLICITANTE, APLOGIST, JEFE_AREA, ALLOGIST, OPLOGIST, "
    "LOLOGIST, EMLOGIST, JLOLOGIST, JEMLOGIST, FINANZAS, GERENTE, ADLOGIST, TILOGIST.",
])

h2("1.4 Asignar usuarios a areas - menu 'Usuarios por Area'")
p("Aqui se define QUIEN crea requerimientos y QUIEN es jefe/aprobador del area. "
  "Campos: DNI, nombre, email, telefono, Area, Subarea, Rol, 'Es Jefe de Area', "
  "'Es Aprobador', activo. Graba en LOGISTICA_UsuariosPorArea. "
  "Si una persona pertenece a varias areas, registrar una fila por cada area.")
table(
    ["Tipo de usuario", "Rol sugerido", "Es Jefe de Area", "Es Aprobador"],
    [
        ["Crea req. CONSUMO y COMPRA (solicitante)", "SOLICITANTE (u OPLOGIST si es de campo)", "NO", "NO"],
        ["Jefe de area que aprueba CONSUMO y COMPRA", "JEFE_AREA o APLOGIST", "SI", "SI"],
        ["Almacen que registra transferencias", "ALLOGIST (area = ALMACEN)", "NO", "NO"],
        ["Operador de logistica / compras", "LOLOGIST", "NO", "NO"],
        ["Aprobador adicional del area", "APLOGIST", "NO", "SI"],
    ],
)

h2("1.5 Quien aprueba cada tipo de requerimiento - menu 'Flujo Aprobacion Area'")
bullet([
    "Una fila por combinacion: Empresa + Area + Tipo de requerimiento + Rol aprobador.",
    "Tipos: CONSUMO, COMPRA, SERVICIO, TRANSFERENCIA.",
    "Roles aprobador: JEFE_AREA, APLOGIST, JLOLOGIST, JEMLOGIST.",
    "Ejemplo: RIEGO + CONSUMO -> JEFE_AREA (el jefe de Riego aprueba consumos).",
    "Ejemplo: RIEGO + COMPRA -> JEFE_AREA (o ADLOGIST si aprueba otra persona).",
    "El sistema busca en Usuarios por Area a la persona con ese rol en esa area.",
])

h2("1.6 Aprobadores de OC - pantalla 'Aprobaciones OC' (app principal)")
bullet([
    "Tab 'Usuarios Aprobadores' -> Nuevo: DNI, nombre, email, rol "
    "(FINANZAS, GERENTE...), montoMinimo, montoMaximo, nivel (orden de firma), activo.",
    "Tab 'Flujos de Aprobacion' -> Nuevo: nombre, descripcion, rango de montos, niveles.",
    "Ruta: /aprobaciones-oc  (requiere rol aprobador/admin).",
])

h2("1.7 Aprobadores de OS - pantalla 'Aprobaciones OS' (app principal)")
bullet([
    "Tab 'Usuarios Aprobadores' -> DNI, nombre, rol, nivelMaximo, activo.",
    "Tab 'Flujos' -> nombre, montoDesde, montoHasta, niveles.",
    "Ruta: /aprobaciones-os",
])

h2("1.8 Resumen: que configurar segun el tipo de usuario")
table(
    ["Para que una persona...", "Configurar"],
    [
        ["Cree requerimientos CONSUMO/COMPRA",
         "Cuenta (1.3) + fila en Usuarios por Area con rol SOLICITANTE en su area"],
        ["Sea jefe y apruebe CONSUMO/COMPRA",
         "Cuenta + Usuarios por Area rol JEFE_AREA/APLOGIST con Es Jefe=SI + "
         "filas CONSUMO y COMPRA en Flujo Aprobacion Area"],
        ["Apruebe Ordenes de Compra",
         "Cuenta con rol FINANZAS + fila en tab Usuarios Aprobadores de Aprobaciones OC"],
        ["Apruebe Ordenes de Servicio",
         "Cuenta con rol FINANZAS + fila en tab Usuarios Aprobadores de Aprobaciones OS"],
        ["Sea de almacen y haga transferencias",
         "Cuenta rol ALLOGIST + Usuarios por Area en ALMACEN + fila TRANSFERENCIA en el flujo"],
    ],
)

# ---------------------------------------------------------------- SEC 2
h1("2. FORMATO EXCEL DE LEVANTAMIENTO")
p("Para recopilar la informacion del negocio existen dos archivos en docs/:")

h2("2.1 Formato para el usuario (FORMATO_USUARIO_LEVANTAMIENTO_LOGISTICA.xlsx)")
p("Disenado para que lo complete una persona de negocio sin conocer el sistema. "
  "Una fila por usuario con casillas SI/NO de lo que puede crear y aprobar.")
table(["Hoja", "Contenido"], [
    ["INSTRUCCIONES", "Quien llena, paso a paso y como funciona la aprobacion."],
    ["EMPRESAS", "RUC y razon social (pre-llenado: Hass Peru, Berry Harvest)."],
    ["AREAS", "Areas/subareas por empresa (pre-llenado con las actuales)."],
    ["USUARIOS", "DNI, nombre, cargo, area, funcion, y casillas SI/NO: "
                 "CREA Consumo/Compra/Servicio/Transferencia; APRUEBA esos tipos; "
                 "Aprueba OC; Aprueba OS."],
    ["APROBACION_OC", "Personas que firman OC: rango de monto y orden de firma."],
    ["APROBACION_OS", "Personas que firman OS: rango de monto y orden de firma."],
    ["CATALOGOS", "Funciones disponibles y equivalencia funcion -> rol interno."],
])

h2("2.2 Formato tecnico (FORMATO_TECNICO_CONFIGURACION_LOGISTICA.xlsx)")
p("Para el implementador: cada hoja replica 1:1 una tabla de la BD con los "
  "nombres de columna reales. Incluye README con el orden de carga y la "
  "configuracion actual pre-cargada (areas con sus idarea, aprobadores actuales, "
  "flujos FINANZAS). Sirve como insumo directo para generar los INSERTs de la "
  "seccion 3.")

h2("2.3 Flujo de trabajo recomendado")
bullet([
    "1. Enviar el formato USUARIO al responsable del negocio.",
    "2. Con el formato devuelto, completar el formato TECNICO (o usarlo para "
    "capturar datos en las pantallas de la seccion 1).",
    "3. Cargar: por pantalla (pocos registros) o por script SQL (carga masiva).",
    "4. Verificar con los SELECT de control al final de cada bloque SQL.",
])

# ---------------------------------------------------------------- SEC 3
h1("3. CARGA MASIVA DESDE LA BASE DE DATOS")
p("Cuando hay muchos usuarios se ahorra tiempo cargando directo con SQL. "
  "Todas las tablas estan en la BD LOGISTICA. Ejecutar en el orden indicado.")

h2("3.1 Orden de carga y objetos afectados")
table(
    ["Orden", "Objeto", "Tabla destino", "SP / metodo"],
    [
        ["1", "Areas", "LOGISTICA_Areas", "INSERT directo o endpoint admin-logistica/areas/crear"],
        ["2", "Cuentas de acceso", "LOGISTICA_AdminUsuarios", "INSERT con HASHBYTES SHA2_256"],
        ["3", "Padron de usuarios", "LOGISTICA_Usuarios", "SP_LogisticaUsuarios_Crear o MERGE"],
        ["4", "Usuarios por area", "LOGISTICA_UsuariosPorArea", "MERGE por (ruc + documentoidentidad + idarea)"],
        ["5", "Flujo req. por area", "LOGISTICA_FlujoAprobacionPorArea", "INSERT o LOGISTICA_guardarFlujoAprobacionArea"],
        ["6", "Flujo OC", "LOGISTICA_FlujoAprobacionOC", "INSERT o LOGISTICA_guardarFlujoAprobacionOC"],
        ["7", "Aprobadores OC", "LOGISTICA_UsuariosAprobadoresOC", "INSERT o LOGISTICA_guardarUsuarioAprobadorOC"],
        ["8", "Flujo OS", "LOGISTICA_FlujoAprobacionOS", "INSERT o LOGISTICA_crearFlujoAprobacionOS"],
        ["9", "Aprobadores OS", "LOGISTICA_UsuarioAprobadorOS", "INSERT o LOGISTICA_crearUsuarioAprobadorOS"],
    ],
)
p("Nota: los SP de guardado reciben parametros JSON cuando se llaman desde la API; "
  "para carga masiva en SSMS es mas rapido usar INSERT/MERGE directo como se muestra.")

h2("3.2 Crear areas (si faltan)")
code(
"""IF NOT EXISTS (SELECT 1 FROM LOGISTICA_Areas
               WHERE nombre = 'ACOPIOS' AND ruc = '20481121966')
    INSERT INTO LOGISTICA_Areas
        (ruc, nombre, descripcion, estado, mostrarAdmision, eliminado)
    VALUES ('20481121966', 'ACOPIOS', 'ACOPIOS', 1, 1, 0);

-- Repetir por cada area/empresa. Verificar ids asignados:
SELECT idarea, ruc, nombre FROM LOGISTICA_Areas ORDER BY ruc, idarea;"""
)

h2("3.3 Crear cuentas de acceso (login) - LOGISTICA_AdminUsuarios")
p("usuario = DNI, claveHash = SHA2_256 de la clave en texto plano. "
  "Patron masivo con IF NOT EXISTS para que sea re-ejecutable:")
code(
"""IF NOT EXISTS (SELECT 1 FROM LOGISTICA_AdminUsuarios WHERE usuario = '48073280')
    INSERT INTO LOGISTICA_AdminUsuarios
        (usuario, claveHash, nombre, email, idrol, rol, idempresa, ruc, activo, creadoPor)
    VALUES (
        '48073280',
        CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', 'CLAVE_EN_TEXTO'), 2),
        'JULCA BARRANTES JULIO CESAR', 'jjulca@hassperu.com',
        'APLOGIST', 'Aprobador Consumo',
        '000008', '20481121966', 1, 'CARGA_INICIAL');"""
)

h2("3.4 Padron de usuarios - LOGISTICA_Usuarios")
p("Un usuario por persona (documentoidentidad + ruc es unico). Opcion A con SP:")
code(
"""EXEC SP_LogisticaUsuarios_Crear
    @documentoidentidad = '48073280',
    @nombreCompleto     = 'JULCA BARRANTES JULIO CESAR',
    @email              = 'jjulca@hassperu.com',
    @telefono           = NULL,
    @ruc                = '20481121966',
    @usuarioCreacion    = 'CARGA_INICIAL';"""
)
p("Opcion B masiva con MERGE:")
code(
"""MERGE INTO LOGISTICA_Usuarios AS t
USING (VALUES
    ('20481121966','48073280','JULCA BARRANTES JULIO CESAR','jjulca@hassperu.com'),
    ('20481121966','76019678','CARRANZA LLANOS ANTONY JUNIOR','acarranza@hassperu.com')
) AS s(ruc, documentoidentidad, nombreCompleto, email)
ON t.ruc = s.ruc AND t.documentoidentidad = s.documentoidentidad
WHEN NOT MATCHED THEN
    INSERT (documentoidentidad, nombreCompleto, email, ruc, activo,
            fechaCreacion, usuarioCreacion)
    VALUES (s.documentoidentidad, s.nombreCompleto, s.email, s.ruc, 1,
            GETDATE(), 'CARGA_INICIAL');"""
)

h2("3.5 Usuarios por area - LOGISTICA_UsuariosPorArea")
p("Aqui van los solicitantes (rol SOLICITANTE/OPLOGIST), jefes de area "
  "(APLOGIST/JEFE_AREA con esJefeArea=1) y almacenistas (ALLOGIST):")
code(
"""MERGE INTO LOGISTICA_UsuariosPorArea AS t
USING (VALUES
    -- ruc,          dni,        nombre,                          idarea, rol,       jefe, aprob, act
    ('20481121966','48073280','JULCA BARRANTES JULIO CESAR',      15,    'APLOGIST',  1,    1,    1),
    ('20481121966','76019678','CARRANZA LLANOS ANTONY JUNIOR',    15,    'APLOGIST',  1,    1,    1),
    ('20481121966','081279',  'REYES RUIZ PABLO',                  5,    'APLOGIST',  1,    1,    1),
    ('20481121966','75612345','PEREZ LOPEZ JUAN',                  1,    'SOLICITANTE',0,   0,    1),
    ('20481121966','43210987','ALMACENISTA EJEMPLO',               5,    'ALLOGIST',  0,    0,    1)
) AS s(ruc, documentoidentidad, nombreCompleto, idarea, rol,
       esJefeArea, esAprobador, activo)
ON t.ruc = s.ruc AND t.documentoidentidad = s.documentoidentidad
WHEN MATCHED THEN
    UPDATE SET nombreCompleto = s.nombreCompleto, idarea = s.idarea,
               rol = s.rol, esJefeArea = s.esJefeArea,
               esAprobador = s.esAprobador, activo = s.activo
WHEN NOT MATCHED THEN
    INSERT (documentoidentidad, nombreCompleto, ruc, idarea, rol,
            esJefeArea, esAprobador, activo)
    VALUES (s.documentoidentidad, s.nombreCompleto, s.ruc, s.idarea,
            s.rol, s.esJefeArea, s.esAprobador, s.activo);"""
)

h2("3.6 Flujo de aprobacion de requerimientos por area")
p("Una fila por (ruc + idarea + tipoRequerimiento). Define QUE ROL aprueba; "
  "la persona se resuelve via UsuariosPorArea:")
code(
"""INSERT INTO LOGISTICA_FlujoAprobacionPorArea
    (ruc, idarea, tipoRequerimiento, rolAprobador, activo)
VALUES
    ('20481121966', 1, 'CONSUMO',      'JEFE_AREA', 1),   -- Riego
    ('20481121966', 1, 'COMPRA',       'JEFE_AREA', 1),
    ('20481121966', 1, 'SERVICIO',     'JEFE_AREA', 1),
    ('20481121966', 5, 'CONSUMO',      'JEFE_AREA', 1),   -- Almacen
    ('20481121966', 5, 'COMPRA',       'JEFE_AREA', 1),
    ('20481121966', 5, 'TRANSFERENCIA','JEFE_AREA', 1),   -- transferencias de almacen
    ('20481121966', 15,'CONSUMO',      'JEFE_AREA', 1),   -- Transporte
    ('20481121966', 15,'COMPRA',       'JEFE_AREA', 1);

-- Si el jefe de area NO aprueba compras y las valida Logistica:
-- ('20481121966', 1, 'COMPRA', 'ADLOGIST', 1)"""
)

h2("3.7 Aprobadores de Ordenes de Compra (OC)")
p("Dos tablas: el flujo define el ROL por rango de monto; el aprobador es la "
  "PERSONA con ese rol. El motor hace join por rol:")
code(
"""-- a) Flujo: que rol aprueba segun el monto de la OC
DELETE FROM LOGISTICA_FlujoAprobacionOC;
INSERT INTO LOGISTICA_FlujoAprobacionOC
    (montoMinimo, montoMaximo, nivel, rolAprobador, nombreRol, descripcion)
VALUES
    (0,     10000,     1, 'FINANZAS', 'Finanzas', 'OC hasta S/ 10,000'),
    (10001, 50000,     1, 'FINANZAS', 'Finanzas', 'OC S/ 10,001 - 50,000'),
    (50001, 999999999, 1, 'FINANZAS', 'Finanzas', 'OC mayor a S/ 50,000'),
    -- Ejemplo doble firma: gerente firma despues en montos altos
    -- (50001, 999999999, 2, 'GERENTE', 'Gerencia', 'Segunda firma > S/ 50,000');
    ;

-- b) Personas aprobadoras (una fila por DNI)
INSERT INTO LOGISTICA_UsuariosAprobadoresOC
    (documentoIdentidad, nombreCompleto, email, rol,
     montoMinimo, montoMaximo, nivel, activo)
VALUES
    ('DNI_FINANZAS', 'NOMBRE APROBADOR', 'finanzas@empresa.com',
     'FINANZAS', 0, 999999999, 1, 1);"""
)

h2("3.8 Aprobadores de Ordenes de Servicio (OS)")
code(
"""-- a) Flujo: rangos de monto y cuantos niveles requiere
INSERT INTO LOGISTICA_FlujoAprobacionOS
    (nombre, montoDesde, montoHasta, niveles, activo)
VALUES
    ('OS hasta S/ 10,000',       0,     10000,     1, 1),
    ('OS S/ 10,001 a S/ 50,000', 10001, 50000,     1, 1),
    ('OS mayor a S/ 50,000',     50001, 999999999, 1, 1);

-- b) Personas aprobadoras
INSERT INTO LOGISTICA_UsuarioAprobadorOS
    (documentoIdentidad, nombre, rol, nivelMaximo, activo)
VALUES
    ('DNI_FINANZAS', 'NOMBRE APROBADOR', 'FINANZAS', 3, 1);"""
)

h2("3.9 Verificacion final (queries de control)")
code(
"""-- Usuarios por area con su area
SELECT u.documentoidentidad, u.nombreCompleto, a.nombre AS area,
       u.rol, u.esJefeArea, u.esAprobador, u.activo
FROM LOGISTICA_UsuariosPorArea u
LEFT JOIN LOGISTICA_Areas a ON u.idarea = a.idarea AND u.ruc = a.ruc
ORDER BY a.nombre, u.nombreCompleto;

-- Flujo de requerimientos
SELECT f.ruc, a.nombre AS area, f.tipoRequerimiento, f.rolAprobador, f.activo
FROM LOGISTICA_FlujoAprobacionPorArea f
JOIN LOGISTICA_Areas a ON f.idarea = a.idarea
ORDER BY a.nombre, f.tipoRequerimiento;

-- Aprobadores OC / OS
SELECT documentoIdentidad, nombreCompleto, rol, montoMinimo, montoMaximo, nivel
FROM LOGISTICA_UsuariosAprobadoresOC;
SELECT documentoIdentidad, nombre, rol, nivelMaximo
FROM LOGISTICA_UsuarioAprobadorOS;"""
)

h2("3.10 Recomendaciones para la carga masiva")
bullet([
    "Sacar backup o snapshot de la BD LOGISTICA antes de ejecutar.",
    "Usar MERGE o IF NOT EXISTS: los scripts quedan re-ejecutables sin duplicar.",
    "El documentoidentidad es varchar: conservar ceros a la izquierda (ej: '081279').",
    "Generar los VALUES directamente desde el Excel tecnico lleno "
    "(copiar filas y armar la lista con CONCATENAR o un generador).",
    "Las tablas de OC/OS no tienen columna ruc: la configuracion es global en la BD.",
    "Para claves iniciales usar un patron conocido y pedir cambio en primer ingreso.",
])

h2("3.11 Carga masiva en un solo SP (RECOMENDADO)")
p("El SP LOGISTICA_cargaMasivaConfiguracion (archivo "
  "api_logistica/SQL/750_SP_CARGA_MASIVA_CONFIGURACION.sql) carga TODA la "
  "configuracion en una sola llamada y una sola transaccion: areas, cuentas de "
  "acceso, usuarios por area, flujo de requerimientos por area, y flujos + "
  "aprobadores de OC y OS. Recibe un unico JSON y es re-ejecutable (no duplica).")
code(
"""EXEC [dbo].[LOGISTICA_cargaMasivaConfiguracion] @json = N'
{
  "usuarioCreacion": "CARGA_INICIAL",
  "areas":           [ {"ruc":"20481121966","nombre":"ACOPIOS","activo":1} ],
  "usuariosAcceso":  [ {"ruc":"20481121966","usuario":"48073280","clave":"xxx",
                        "nombre":"JULCA BARRANTES","idrol":"APLOGIST",
                        "rol":"Aprobador Consumo","nrodocumento":"48073280"} ],
  "usuariosPorArea": [ {"ruc":"20481121966","documentoidentidad":"48073280",
                        "nombreCompleto":"JULCA BARRANTES","area":"ALMACEN",
                        "rol":"APLOGIST","esJefeArea":1,"esAprobador":1} ],
  "flujoReq":        [ {"ruc":"20481121966","idarea":5,"tipoRequerimiento":"CONSUMO",
                        "rolAprobador":"JEFE_AREA"} ],
  "flujoOC":         [ {"montoMinimo":0,"montoMaximo":10000,"nivel":1,
                        "rolAprobador":"FINANZAS","nombreRol":"Finanzas"} ],
  "aprobadoresOC":   [ {"documentoIdentidad":"41780114","nombreCompleto":"...",
                        "rol":"FINANZAS","montoMinimo":0,
                        "montoMaximo":999999999,"nivel":1} ],
  "flujoOS":         [ {"nombre":"OS hasta 10000","montoDesde":0,
                        "montoHasta":10000,"niveles":1} ],
  "aprobadoresOS":   [ {"documentoIdentidad":"41780114","nombre":"...",
                        "rol":"FINANZAS","nivelMaximo":3} ]
}';""")
p("El SP devuelve un JSON con resumen por seccion (insertados/actualizados) y "
  "advertencias (ej. usuarios cuyo area no existe). En usuariosPorArea y "
  "flujoReq puede mandarse 'idarea' o 'area' (nombre): el SP resuelve el id "
  "por ruc + nombre. Las claves en 'usuariosAcceso' pueden ir en texto plano "
  "('clave', se hashea SHA2_256) o ya hasheadas ('claveHash').")

h2("3.12 Generar el JSON automaticamente desde el Excel tecnico")
p("El script logistica/scripts/generar_json_carga_masiva.py lee el Excel "
  "FORMATO_TECNICO_CONFIGURACION_LOGISTICA.xlsx ya lleno y genera "
  "doc_output/CARGA_MASIVA.sql con el EXEC listo para correr en SSMS. "
  "Flujo completo: llenar Excel tecnico -> python generar_json_carga_masiva.py "
  "-> ejecutar CARGA_MASIVA.sql.")
code(
"""cd logistica/scripts
python generar_json_carga_masiva.py
-- genera: ../doc_output/carga_masiva_config.json
--         ../doc_output/CARGA_MASIVA.sql""")

h2("3.13 Referencia: SPs del sistema para operaciones unitarias")
table(
    ["Operacion", "Stored Procedure"],
    [
        ["Crear usuario del padron", "SP_LogisticaUsuarios_Crear"],
        ["Actualizar usuario", "SP_LogisticaUsuarios_Actualizar"],
        ["Cambiar estado usuario", "SP_LogisticaUsuarios_CambiarEstado"],
        ["Guardar flujo req. por area", "LOGISTICA_guardarFlujoAprobacionArea"],
        ["Eliminar flujo req. por area", "LOGISTICA_eliminarFlujoAprobacionArea"],
        ["Guardar flujo OC", "LOGISTICA_guardarFlujoAprobacionOC"],
        ["Guardar aprobador OC", "LOGISTICA_guardarUsuarioAprobadorOC"],
        ["Eliminar aprobador OC", "LOGISTICA_eliminarUsuarioAprobadorOC"],
        ["Crear flujo OS", "LOGISTICA_crearFlujoAprobacionOS"],
        ["Crear/actualizar aprobador OS", "LOGISTICA_crearUsuarioAprobadorOS / LOGISTICA_actualizarUsuarioAprobadorOS"],
    ],
)

# ================================================================
# GENERAR DOCX
# ================================================================
def set_cell_bg(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), color)
    tcPr.append(shd)

def generar_docx(ruta):
    doc = Document()
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10)

    for bloque in C:
        tipo = bloque[0]
        if tipo == "h1":
            par = doc.add_heading(bloque[1], level=1)
            for run in par.runs:
                run.font.color.rgb = RGBColor(0x1F, 0x4E, 0x78)
                run.font.size = Pt(16)
        elif tipo == "h2":
            par = doc.add_heading(bloque[1], level=2)
            for run in par.runs:
                run.font.color.rgb = RGBColor(0x1F, 0x4E, 0x78)
                run.font.size = Pt(12)
        elif tipo == "p":
            doc.add_paragraph(bloque[1])
        elif tipo == "bullet":
            for item in bloque[1]:
                doc.add_paragraph(item, style='List Bullet')
        elif tipo == "table":
            headers, rows = bloque[1], bloque[2]
            t = doc.add_table(rows=1, cols=len(headers))
            t.style = 'Table Grid'
            for i, h in enumerate(headers):
                cell = t.rows[0].cells[i]
                cell.text = h
                set_cell_bg(cell, AZUL)
                for r in cell.paragraphs[0].runs:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                    r.font.size = Pt(9)
            for row in rows:
                cells = t.add_row().cells
                for i, v in enumerate(row):
                    cells[i].text = str(v)
                    for r in cells[i].paragraphs[0].runs:
                        r.font.size = Pt(9)
            doc.add_paragraph()
        elif tipo == "code":
            par = doc.add_paragraph()
            run = par.add_run(bloque[1])
            run.font.name = 'Consolas'
            run.font.size = Pt(8)
            pPr = par._p.get_or_add_pPr()
            shd = OxmlElement('w:shd')
            shd.set(qn('w:fill'), GRIS_CODE)
            pPr.append(shd)
            doc.add_paragraph()

    doc.save(ruta)
    print(f"DOCX generado: {ruta}")

# ================================================================
# GENERAR PDF
# ================================================================
def generar_pdf(ruta):
    st_h1 = ParagraphStyle('h1', fontName='Helvetica-Bold', fontSize=15,
                           textColor=colors.HexColor('#1F4E78'), spaceBefore=14,
                           spaceAfter=8)
    st_h2 = ParagraphStyle('h2', fontName='Helvetica-Bold', fontSize=11.5,
                           textColor=colors.HexColor('#1F4E78'), spaceBefore=10,
                           spaceAfter=5)
    st_p = ParagraphStyle('p', fontName='Helvetica', fontSize=9.5,
                          spaceAfter=6, leading=13)
    st_b = ParagraphStyle('b', parent=st_p, leftIndent=14,
                          bulletIndent=4)
    st_code = ParagraphStyle('code', fontName='Courier', fontSize=7.2,
                             leading=8.6, backColor=colors.HexColor('#F2F2F2'),
                             borderPadding=6, spaceBefore=4, spaceAfter=8,
                             leftIndent=6)

    story = []
    for bloque in C:
        tipo = bloque[0]
        if tipo == "h1":
            story.append(Paragraph(bloque[1], st_h1))
        elif tipo == "h2":
            story.append(Paragraph(bloque[1], st_h2))
        elif tipo == "p":
            story.append(Paragraph(bloque[1], st_p))
        elif tipo == "bullet":
            for item in bloque[1]:
                story.append(Paragraph(f"&bull; {item}", st_b))
            story.append(Spacer(1, 4))
        elif tipo == "table":
            headers, rows = bloque[1], bloque[2]
            data = [[Paragraph(f'<b>{h}</b>',
                     ParagraphStyle('th', fontName='Helvetica-Bold',
                                    fontSize=8.5, textColor=colors.white))
                     for h in headers]]
            for row in rows:
                data.append([Paragraph(str(v),
                             ParagraphStyle('td', fontName='Helvetica',
                                            fontSize=8, leading=10))
                             for v in row])
            total_w = A4[0] - 4 * cm
            n = len(headers)
            t = Table(data, colWidths=[total_w * 0.24] + [total_w * 0.76 / (n - 1)] * (n - 1))
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E78')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BFBFBF')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1),
                 [colors.white, colors.HexColor('#F7FAFD')]),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(t)
            story.append(Spacer(1, 8))
        elif tipo == "code":
            story.append(Preformatted(bloque[1], st_code))

    doc = SimpleDocTemplate(ruta, pagesize=A4,
                            leftMargin=2 * cm, rightMargin=2 * cm,
                            topMargin=1.8 * cm, bottomMargin=1.8 * cm,
                            title="Guia de Configuracion - App Logistica")
    doc.build(story)
    print(f"PDF generado: {ruta}")


if __name__ == "__main__":
    docs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))
    generar_docx(os.path.join(docs_dir, "GUIA_CONFIGURACION_USUARIOS_APROBACIONES.docx"))
    generar_pdf(os.path.join(docs_dir, "GUIA_CONFIGURACION_USUARIOS_APROBACIONES.pdf"))
