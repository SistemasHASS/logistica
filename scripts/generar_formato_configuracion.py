# -*- coding: utf-8 -*-
"""
Genera el Excel de levantamiento que se envia al usuario/empresa para que
indique: quienes usaran la app LOGISTICA, en que area trabajan, que tipos
de requerimiento crean (CONSUMO/COMPRA/SERVICIO/TRANSFERENCIA), que jefes
de area aprueban esos requerimientos y quienes aprueban la OC y la OS.

Salida: ../docs/FORMATO_USUARIO_LEVANTAMIENTO_LOGISTICA.xlsx
"""
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

# ---------------------------------------------------------------- estilos
AZUL = "1F4E78"
AZUL_CLARO = "DDEBF7"
VERDE = "375623"
NARANJA = "C55A11"
MORADO = "5B2D8E"
AMARILLO = "FFF2CC"
GRIS_NOTA = "595959"

F_HEADER = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
F_GRUPO = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
F_NORMAL = Font(name="Calibri", size=10)
F_EJEMPLO = Font(name="Calibri", size=10, italic=True, color="7F7F7F")
F_NOTA = Font(name="Calibri", size=9, italic=True, color=GRIS_NOTA)

FILL_TITULO = PatternFill("solid", fgColor=AZUL)
FILL_HEADER = PatternFill("solid", fgColor=AZUL)
FILL_EJEMPLO = PatternFill("solid", fgColor=AMARILLO)
FILL_SECCION = PatternFill("solid", fgColor=AZUL_CLARO)

BORDE = Border(
    left=Side(style="thin", color="BFBFBF"),
    right=Side(style="thin", color="BFBFBF"),
    top=Side(style="thin", color="BFBFBF"),
    bottom=Side(style="thin", color="BFBFBF"),
)

CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
LEFT = Alignment(horizontal="left", vertical="center", wrap_text=True)

MAX_FILAS = 300  # filas habilitadas con validacion en cada hoja


def hoja_base(wb, nombre, titulo, headers, anchos, nota=None, color_header=AZUL):
    """Crea hoja con titulo (fila 1), nota opcional (fila 2) y cabeceras (fila 3)."""
    ws = wb.create_sheet(nombre)
    n = len(headers)
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=n)
    c = ws.cell(row=1, column=1, value=titulo)
    c.font = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor=color_header)
    c.alignment = CENTER
    ws.row_dimensions[1].height = 26

    fila_header = 3
    if nota:
        ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=n)
        cn = ws.cell(row=2, column=1, value=nota)
        cn.font = F_NOTA
        cn.alignment = LEFT
        ws.row_dimensions[2].height = 26
    else:
        fila_header = 2

    for i, h in enumerate(headers, start=1):
        cell = ws.cell(row=fila_header, column=i, value=h)
        cell.font = F_HEADER
        cell.fill = PatternFill("solid", fgColor=color_header)
        cell.alignment = CENTER
        cell.border = BORDE
    ws.row_dimensions[fila_header].height = 40

    for i, w in enumerate(anchos, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w

    ws.freeze_panes = f"A{fila_header + 1}"
    return ws, fila_header + 1


def escribir_filas(ws, filas, inicio, ejemplo=False):
    for r, fila in enumerate(filas, start=inicio):
        for c, val in enumerate(fila, start=1):
            cell = ws.cell(row=r, column=c, value=val)
            cell.font = F_EJEMPLO if ejemplo else F_NORMAL
            cell.border = BORDE
            cell.alignment = LEFT
            if ejemplo:
                cell.fill = FILL_EJEMPLO


def validacion_lista(ws, formula, col, fila_ini=4, fila_fin=MAX_FILAS):
    dv = DataValidation(type="list", formula1=formula, allow_blank=True, showDropDown=False)
    dv.error = "Seleccione un valor de la lista"
    dv.errorTitle = "Valor no valido"
    ws.add_data_validation(dv)
    dv.add(f"{col}{fila_ini}:{col}{fila_fin}")


wb = Workbook()
wb.remove(wb.active)

# ================================================================
# HOJA: INSTRUCCIONES
# ================================================================
ws = wb.create_sheet("INSTRUCCIONES")
ws.column_dimensions["A"].width = 3
ws.column_dimensions["B"].width = 26
ws.column_dimensions["C"].width = 115

ws.merge_cells("B2:C2")
c = ws["B2"]
c.value = "FORMATO DE LEVANTAMIENTO - USUARIOS Y APROBACIONES DEL SISTEMA LOGISTICA"
c.font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
c.fill = FILL_TITULO
c.alignment = CENTER
ws.row_dimensions[2].height = 30

# Bloque: datos de quien llena
ws["B4"] = "DATOS DEL LEVANTAMIENTO"
ws["B4"].font = Font(bold=True, color=AZUL)
ws["B4"].fill = FILL_SECCION
ws.merge_cells("B4:C4")
datos = [
    ("Empresa / Sede:", ""),
    ("Persona que completa:", ""),
    ("Cargo:", ""),
    ("Fecha de envio:", ""),
]
fila = 5
for etiqueta, _ in datos:
    b = ws.cell(row=fila, column=2, value=etiqueta)
    b.font = Font(bold=True)
    ws.cell(row=fila, column=3).border = Border(bottom=Side(style="thin", color="808080"))
    fila += 1

lineas = [
    ("", ""),
    ("PARA QUE SIRVE ESTE FORMATO", ""),
    ("", "Con esta informacion el equipo de Sistemas creara los usuarios, les asignara su area, "
          "su rol dentro del sistema y configurara quien aprueba cada tipo de documento. "
          "Complete TODAS las hojas marcadas con (*) en el indice."),
    ("", ""),
    ("INDICE DE HOJAS", ""),
    ("EMPRESAS", "Ya viene con las empresas registradas. Agregue filas solo si falta alguna empresa o sede."),
    ("AREAS", "Ya viene con las areas actuales. Corrija nombres, agregue las areas que falten o marque "
              "con NO en 'Activo' las que no aplican."),
    ("USUARIOS (*)", "La hoja mas importante: UNA FILA POR PERSONA que usara el sistema. Indique con SI/NO "
                     "que tipos de requerimiento crea, cuales aprueba (si es jefe de area) y si aprueba OC u OS."),
    ("APROBACION_OC (*)", "Lista de personas que firman/aprueban las Ordenes de Compra y hasta que monto."),
    ("APROBACION_OS (*)", "Lista de personas que firman/aprueban las Ordenes de Servicio y hasta que monto."),
    ("CATALOGOS", "Solo de referencia: lista de funciones disponibles y significado de cada una. No llenar."),
    ("", ""),
    ("COMO LLENAR LA HOJA USUARIOS", ""),
    ("1.", "Datos de la persona: DNI, apellidos y nombres, cargo, correo y telefono."),
    ("2.", "Area: seleccione de la lista el area donde trabaja (las areas vienen de la hoja AREAS)."),
    ("3.", "Funcion principal: elija la funcion que mejor describe lo que hara en el sistema "
           "(solicitante, jefe de area, almacen, logistica, finanzas, etc.)."),
    ("4.", "CREA REQUERIMIENTOS: marque SI en cada tipo que el usuario puede registrar "
           "(Consumo = items de almacen, Compra = items que hay que comprar, Servicio, Transferencia)."),
    ("5.", "APRUEBA REQUERIMIENTOS: solo para jefes de area o responsables. Marque SI en cada tipo de "
           "requerimiento que la persona debe aprobar. En 'Alcance' indique si aprueba solo su propia "
           "area o todas las areas."),
    ("6.", "APRUEBA OC / OS: marque SI si la persona firma Ordenes de Compra u Ordenes de Servicio "
           "(ademas detalle los montos en las hojas APROBACION_OC / APROBACION_OS)."),
    ("", ""),
    ("REGLAS", ""),
    ("*", "El DNI es obligatorio: es el usuario con el que la persona ingresara al sistema."),
    ("*", "Las celdas con lista desplegable solo aceptan los valores de la lista."),
    ("*", "Las filas sombreadas en AMARILLO son ejemplos: borrelas o reemplacelas con datos reales."),
    ("*", "Si una persona pertenece a mas de un area, repita la fila cambiando solo el area."),
    ("*", "Si no esta seguro de que marcar en alguna columna, dejelo en blanco y anote la duda "
          "en Observaciones."),
    ("", ""),
    ("COMO FUNCIONA LA APROBACION EN EL SISTEMA", ""),
    ("Requerimientos", "El usuario crea el requerimiento -> llega al aprobador configurado para su area "
                       "y tipo (normalmente el jefe del area)."),
    ("Orden de Compra", "La OC se genera desde el area de compras -> la aprueban las personas listadas en "
                        "APROBACION_OC segun el monto total de la orden."),
    ("Orden de Servicio", "La OS se genera desde el area de compras -> la aprueban las personas listadas en "
                          "APROBACION_OS segun el monto total de la orden."),
    ("", ""),
    ("DEVOLVER A:", "Area de Sistemas / Implementador del sistema LOGISTICA."),
]

for col_b, col_c in lineas:
    b = ws.cell(row=fila, column=2, value=col_b)
    c2 = ws.cell(row=fila, column=3, value=col_c)
    if col_c == "" and col_b:
        b.font = Font(name="Calibri", size=11, bold=True, color=AZUL)
        b.fill = FILL_SECCION
        ws.merge_cells(start_row=fila, start_column=2, end_row=fila, end_column=3)
    else:
        b.font = Font(name="Calibri", size=10, bold=True)
        b.alignment = Alignment(horizontal="right", vertical="top")
        c2.font = F_NORMAL
        c2.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        if len(col_c) > 95:
            ws.row_dimensions[fila].height = 30
    fila += 1

# ================================================================
# HOJA: EMPRESAS
# ================================================================
ws, ini = hoja_base(
    wb, "EMPRESAS",
    "EMPRESAS / SEDES donde se usara el sistema LOGISTICA",
    ["RUC (*)", "Razon Social (*)", "Codigo Interno", "Activo (SI/NO)"],
    [16, 45, 15, 14],
    nota="Verifique que esten todas las empresas del grupo. Agregue filas si falta alguna.",
)
escribir_filas(ws, [
    ["20481121966", "HASS PERU S.A.", "HP", "SI"],
    ["20610773274", "BERRY HARVEST S.A.C.", "BH", "SI"],
], ini)
validacion_lista(ws, '"SI,NO"', "D")

# ================================================================
# HOJA: AREAS
# ================================================================
ws, ini = hoja_base(
    wb, "AREAS",
    "AREAS Y SUBAREAS de cada empresa (los usuarios se asignan a estas areas)",
    ["RUC Empresa (*)", "Nombre del Area (*)", "Subarea (si aplica)", "Activo (SI/NO)"],
    [16, 35, 35, 14],
    nota="Listado actual del sistema. Agregue las areas que falten y marque NO en 'Activo' las que no apliquen.",
)
areas_hp = ["RIEGO", "LABORES", "BPM", "SST", "ALMACEN", "SERVICIO DE TRANSPORTE", "ACOPIOS",
            "LOGISTICA", "LICITACIONES", "COSTOS", "SISTEMAS", "TESORERIA", "CONTABILIDAD",
            "ADMINISTRACION Y FINANZAS", "GERENCIA", "RECURSOS HUMANOS", "COMERCIO EXTERIOR"]
areas_bh = ["ALMACEN", "ACOPIOS", "BPA"]
filas_areas = [["20481121966", a, "", "SI"] for a in areas_hp]
filas_areas += [["20610773274", a, "", "SI"] for a in areas_bh]
escribir_filas(ws, filas_areas, ini)
validacion_lista(ws, "EMPRESAS!$A$4:$A$20", "A")
validacion_lista(ws, '"SI,NO"', "D")

# ================================================================
# HOJA: USUARIOS  (una fila por persona - matriz completa)
# ================================================================
headers_usr = [
    "RUC Empresa (*)", "DNI (*)", "Apellidos y Nombres (*)", "Cargo / Puesto",
    "Email", "Telefono", "Area (*)", "Subarea",
    "Funcion Principal en el Sistema (*)",
    "CREA Req. CONSUMO", "CREA Req. COMPRA", "CREA Req. SERVICIO", "CREA Req. TRANSFERENCIA",
    "APRUEBA Req. CONSUMO", "APRUEBA Req. COMPRA", "APRUEBA Req. SERVICIO", "APRUEBA Req. TRANSFERENCIA",
    "Alcance de Aprobacion de Req.", "Aprueba OC", "Aprueba OS",
    "Observaciones", "Activo (SI/NO)",
]
anchos_usr = [15, 12, 30, 20, 28, 12, 24, 18, 30, 10, 10, 10, 13, 12, 11, 11, 13, 18, 10, 10, 26, 10]
ws, ini = hoja_base(
    wb, "USUARIOS",
    "USUARIOS DEL SISTEMA - una fila por cada persona que usara la app",
    headers_usr, anchos_usr,
    nota="Marque SI/NO en cada columna segun lo que la persona pueda hacer. "
         "Las columnas 'APRUEBA Req.' son solo para jefes de area o responsables que autorizan requerimientos. "
         "Filas amarillas = ejemplos a reemplazar.",
    color_header=VERDE,
)
escribir_filas(ws, [
    ["20481121966", "48073280", "JULCA BARRANTES JULIO CESAR", "Jefe de Transporte",
     "jjulca@empresa.com", "999888777", "SERVICIO DE TRANSPORTE", "",
     "Jefe de Area (aprueba requerimientos)",
     "SI", "SI", "SI", "NO",
     "SI", "SI", "SI", "NO",
     "Solo su area", "NO", "NO",
     "EJEMPLO: crea y aprueba requerimientos de su area", "SI"],
    ["20481121966", "081279", "REYES RUIZ PABLO", "Jefe de Almacen",
     "preyes@empresa.com", "", "ALMACEN", "",
     "Jefe de Area (aprueba requerimientos)",
     "SI", "SI", "NO", "SI",
     "SI", "SI", "NO", "SI",
     "Solo su area", "NO", "NO",
     "EJEMPLO", "SI"],
    ["20481121966", "75612345", "PEREZ LOPEZ JUAN", "Supervisor de Riego",
     "jperez@empresa.com", "", "RIEGO", "",
     "Solicitante (crea requerimientos)",
     "SI", "SI", "NO", "NO",
     "NO", "NO", "NO", "NO",
     "", "NO", "NO",
     "EJEMPLO: solo crea requerimientos", "SI"],
    ["20481121966", "43210987", "GOMEZ RIOS MARIA", "Analista de Compras",
     "mgomez@empresa.com", "", "LOGISTICA", "",
     "Logistica / Compras (operador)",
     "NO", "NO", "NO", "NO",
     "NO", "SI", "SI", "NO",
     "Todas las areas", "NO", "NO",
     "EJEMPLO: valida compras y servicios de todas las areas", "SI"],
    ["20481121966", "40999888", "TORRES VEGA LUIS", "Jefe de Finanzas",
     "ltorres@empresa.com", "", "ADMINISTRACION Y FINANZAS", "",
     "Finanzas (aprueba OC/OS)",
     "NO", "NO", "NO", "NO",
     "NO", "NO", "NO", "NO",
     "", "SI", "SI",
     "EJEMPLO: aprueba OC y OS (ver hojas APROBACION_OC/OS)", "SI"],
], ini, ejemplo=True)
validacion_lista(ws, "EMPRESAS!$A$4:$A$20", "A")
validacion_lista(ws, "AREAS!$B$4:$B$80", "G")
validacion_lista(ws, "CATALOGOS!$H$4:$H$30", "I")
for col in ["J", "K", "L", "M", "N", "O", "P", "Q", "S", "T", "V"]:
    validacion_lista(ws, '"SI,NO"', col)
validacion_lista(ws, '"Solo su area,Todas las areas"', "R")

# ================================================================
# HOJA: APROBACION_OC
# ================================================================
ws, ini = hoja_base(
    wb, "APROBACION_OC",
    "PERSONAS QUE APRUEBAN LAS ORDENES DE COMPRA (OC)",
    ["RUC Empresa (*)", "DNI (*)", "Apellidos y Nombres (*)", "Cargo", "Email",
     "Aprueba OC desde S/", "Aprueba OC hasta S/", "Orden de firma (nivel)",
     "Observaciones", "Activo (SI/NO)"],
    [15, 12, 30, 22, 28, 15, 15, 14, 28, 12],
    nota="Indique que personas firman las OC y en que rango de monto. 'Orden de firma' = 1 si es el primer "
         "aprobador, 2 si firma despues (doble aprobacion), etc. Si una sola persona aprueba todo, use nivel 1 "
         "y rango 0 a 999999999.",
    color_header=NARANJA,
)
escribir_filas(ws, [
    ["20481121966", "40999888", "TORRES VEGA LUIS", "Jefe de Finanzas",
     "ltorres@empresa.com", 0, 999999999, 1, "EJEMPLO: aprueba cualquier monto", "SI"],
    ["20481121966", "45678901", "DIAZ MORA ANA", "Gerente General",
     "adiaz@empresa.com", 50001, 999999999, 2, "EJEMPLO: segunda firma solo para montos altos", "SI"],
], ini, ejemplo=True)
validacion_lista(ws, "EMPRESAS!$A$4:$A$20", "A")
validacion_lista(ws, '"SI,NO"', "J")

# ================================================================
# HOJA: APROBACION_OS
# ================================================================
ws, ini = hoja_base(
    wb, "APROBACION_OS",
    "PERSONAS QUE APRUEBAN LAS ORDENES DE SERVICIO (OS)",
    ["RUC Empresa (*)", "DNI (*)", "Apellidos y Nombres (*)", "Cargo", "Email",
     "Aprueba OS desde S/", "Aprueba OS hasta S/", "Orden de firma (nivel)",
     "Observaciones", "Activo (SI/NO)"],
    [15, 12, 30, 22, 28, 15, 15, 14, 28, 12],
    nota="Indique que personas firman las OS y en que rango de monto. Mismo criterio que la hoja de OC.",
    color_header=MORADO,
)
escribir_filas(ws, [
    ["20481121966", "40999888", "TORRES VEGA LUIS", "Jefe de Finanzas",
     "ltorres@empresa.com", 0, 999999999, 1, "EJEMPLO: aprueba cualquier monto", "SI"],
], ini, ejemplo=True)
validacion_lista(ws, "EMPRESAS!$A$4:$A$20", "A")
validacion_lista(ws, '"SI,NO"', "J")

# ================================================================
# HOJA: CATALOGOS (referencia - no llenar)
# ================================================================
ws = wb.create_sheet("CATALOGOS")
for col, w in zip("ABCDEFGHI", [30, 46, 3, 22, 50, 3, 20, 34, 16]):
    ws.column_dimensions[col].width = w

ws.merge_cells("A1:I1")
c = ws["A1"]
c.value = "CATALOGOS DE REFERENCIA - no llenar (listas usadas en las demas hojas)"
c.font = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
c.fill = FILL_TITULO
c.alignment = CENTER
ws.row_dimensions[1].height = 24

# --- Funciones (nombre amigable -> rol interno) ---
ws["A2"] = "FUNCIONES EN EL SISTEMA"
ws["A2"].font = Font(bold=True, color=AZUL)
ws.merge_cells("A2:B2")
for i, h in enumerate(["Funcion (lo que elige el usuario)", "Que puede hacer"], start=1):
    cell = ws.cell(row=3, column=i, value=h)
    cell.font = F_HEADER
    cell.fill = FILL_HEADER
    cell.border = BORDE
    cell.alignment = CENTER

funciones = [
    ("Solicitante (crea requerimientos)", "Registra requerimientos de consumo, compra, servicio o transferencia de su area."),
    ("Jefe de Area (aprueba requerimientos)", "Aprueba o rechaza los requerimientos de su area."),
    ("Almacen (despachos e ingresos)", "Gestiona despachos, ingresos de mercaderia y kardex."),
    ("Operativo de campo", "Registra requerimientos operativos desde campo."),
    ("Logistica / Compras (operador)", "Gestiona solicitudes de compra, cotizaciones, consolidaciones y ordenes."),
    ("Licitaciones (operador)", "Gestiona licitaciones y procesos de empaque."),
    ("Jefe de Logistica", "Supervisa la operacion de logistica y compras."),
    ("Jefe de Licitaciones", "Supervisa licitaciones y procesos de empaque."),
    ("Finanzas (aprueba OC/OS)", "Aprueba Ordenes de Compra y Ordenes de Servicio."),
    ("Administrador Logistica", "Administra la operacion completa del modulo."),
    ("Administrador de Sistema (TI)", "Configuracion tecnica del sistema."),
    ("Gerencia", "Visualizacion gerencial / aprobacion de nivel superior si se configura."),
]
fila = 4
for fn, desc in funciones:
    ws.cell(row=fila, column=1, value=fn).font = F_NORMAL
    ws.cell(row=fila, column=1).border = BORDE
    cc = ws.cell(row=fila, column=2, value=desc)
    cc.font = F_NORMAL
    cc.border = BORDE
    cc.alignment = LEFT
    fila += 1

# --- Tipos de requerimiento ---
ws["D2"] = "TIPOS DE REQUERIMIENTO"
ws["D2"].font = Font(bold=True, color=AZUL)
ws.merge_cells("D2:E2")
for i, h in enumerate(["Tipo", "Significado"], start=4):
    cell = ws.cell(row=3, column=i, value=h)
    cell.font = F_HEADER
    cell.fill = FILL_HEADER
    cell.border = BORDE
    cell.alignment = CENTER
tipos = [
    ("CONSUMO", "Pedido de items que salen del almacen para uso interno (insumos, repuestos, EPP, etc.)."),
    ("COMPRA", "Pedido de items o activos que no estan en almacen y deben comprarse."),
    ("SERVICIO", "Pedido de servicios de terceros (fletes, mantenimiento, analisis, etc.)."),
    ("TRANSFERENCIA", "Movimiento de items entre almacenes o entre empresas del grupo."),
]
fila = 4
for t, d in tipos:
    ws.cell(row=fila, column=4, value=t).font = F_NORMAL
    ws.cell(row=fila, column=4).border = BORDE
    cc = ws.cell(row=fila, column=5, value=d)
    cc.font = F_NORMAL
    cc.border = BORDE
    cc.alignment = LEFT
    ws.row_dimensions[fila].height = 26
    fila += 1

ws["D10"] = "CAMPOS SI/NO"
ws["D10"].font = Font(bold=True, color=AZUL)
ws["D11"] = "En las columnas con lista use unicamente SI o NO."
ws["D11"].font = F_NOTA
ws.merge_cells("D11:E11")

# --- lista oculta de funciones para validacion (columna H) ---
ws["H2"] = "LISTA_FUNCIONES"
ws["H2"].font = F_NOTA
for i, (fn, _) in enumerate(funciones, start=4):
    ws.cell(row=i, column=8, value=fn)
    ws.cell(row=i, column=8).font = F_NOTA

# --- equivalencia tecnica (para el implementador) ---
ws["A20"] = "EQUIVALENCIA TECNICA (uso interno del implementador)"
ws["A20"].font = Font(bold=True, color=AZUL)
ws.merge_cells("A20:E20")
refs = [
    ("Hoja del formato", "Tabla de base de datos"),
    ("USUARIOS", "LOGISTICA_UsuariosPorArea"),
    ("USUARIOS - columnas APRUEBA Req.", "LOGISTICA_FlujoAprobacionPorArea"),
    ("AREAS", "LOGISTICA_Areas / LOGISTICA_SubAreas"),
    ("APROBACION_OC", "LOGISTICA_UsuariosAprobadoresOC + LOGISTICA_FlujoAprobacionOC"),
    ("APROBACION_OS", "LOGISTICA_UsuarioAprobadorOS + LOGISTICA_FlujoAprobacionOS"),
]
fila = 21
for i, (hoja, tabla) in enumerate(refs):
    a = ws.cell(row=fila, column=1, value=hoja)
    b = ws.cell(row=fila, column=2, value=tabla)
    if i == 0:
        a.font = F_HEADER; a.fill = FILL_HEADER
        b.font = F_HEADER; b.fill = FILL_HEADER
    else:
        a.font = F_NORMAL; b.font = F_NOTA
    a.border = BORDE; b.border = BORDE
    ws.merge_cells(start_row=fila, start_column=2, end_row=fila, end_column=5)
    fila += 1

# roles internos mapeados a funcion (referencia implementador)
ws["A29"] = "ROL INTERNO SEGUN FUNCION"
ws["A29"].font = Font(bold=True, color=AZUL)
ws.merge_cells("A29:B29")
for i, h in enumerate(["Funcion", "Codigo de rol interno"], start=1):
    cell = ws.cell(row=30, column=i, value=h)
    cell.font = F_HEADER
    cell.fill = FILL_HEADER
    cell.border = BORDE
mapa = [
    ("Solicitante (crea requerimientos)", "SOLICITANTE"),
    ("Jefe de Area (aprueba requerimientos)", "JEFE_AREA / APLOGIST"),
    ("Almacen (despachos e ingresos)", "ALLOGIST"),
    ("Operativo de campo", "OPLOGIST"),
    ("Logistica / Compras (operador)", "LOLOGIST"),
    ("Licitaciones (operador)", "EMLOGIST"),
    ("Jefe de Logistica", "JLOLOGIST"),
    ("Jefe de Licitaciones", "JEMLOGIST"),
    ("Finanzas (aprueba OC/OS)", "FINANZAS"),
    ("Administrador Logistica", "ADLOGIST"),
    ("Administrador de Sistema (TI)", "TILOGIST"),
    ("Gerencia", "GERENTE"),
]
fila = 31
for fn, rol in mapa:
    ws.cell(row=fila, column=1, value=fn).font = F_NORMAL
    ws.cell(row=fila, column=1).border = BORDE
    ws.cell(row=fila, column=2, value=rol).font = F_NORMAL
    ws.cell(row=fila, column=2).border = BORDE
    fila += 1

# ================================================================
# ordenar hojas y guardar
# ================================================================
wb._sheets = [wb[n] for n in [
    "INSTRUCCIONES", "EMPRESAS", "AREAS", "USUARIOS",
    "APROBACION_OC", "APROBACION_OS", "CATALOGOS",
]]

salida = os.path.join(os.path.dirname(__file__), "..", "docs",
                      "FORMATO_USUARIO_LEVANTAMIENTO_LOGISTICA.xlsx")
salida = os.path.abspath(salida)
wb.save(salida)
print(f"Excel generado: {salida}")
