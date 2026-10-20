# Manual de la Consola Admin Logística (`/admin-logistica`)

**Versión:** 1.0 — Octubre 2026
**Audiencia:** TILOGIST, ADLOGIST, JLOLOGIST

---

## Índice

1. [Acceso a la consola](#1-acceso-a-la-consola)
2. [Estructura y visibilidad por rol](#2-estructura-y-visibilidad-por-rol)
3. [Pestañas operativas](#3-pestañas-operativas)
4. [Pestañas de catálogos](#4-pestañas-de-catálogos)
5. [Pestañas de usuarios y áreas](#5-pestañas-de-usuarios-y-áreas)
6. [Pestañas de configuración](#6-pestañas-de-configuración)
7. [Pestañas de control](#7-pestañas-de-control)
8. [Permisos ADMINLG_*](#8-permisos-adminlg_)
9. [Preguntas frecuentes](#9-preguntas-frecuentes)

---

## 1. Acceso a la consola

| Paso | Detalle |
|---|---|
| URL | `/admin-logistica/login` |
| Autenticación | Login **propio** de la consola (independiente del login de la app) |
| Roles con acceso | TILOGIST, ADLOGIST, JLOLOGIST (con menú reducido) |
| Guard | `AdminLogisticaAuthGuard` — sin sesión → redirige al login |

La sesión de la consola es independiente: cerrar sesión en la app no cierra la consola y viceversa.

## 2. Estructura y visibilidad por rol

La consola es un layout con menú lateral de 21 pestañas. Cada pestaña está controlada por una clave `ADMINLG_MENU_*` almacenada en `LOGISTICA_ConfiguracionPermiso`. Si el rol no tiene la clave en BD, se aplica el **valor por defecto**:

- `true` → visible para los 3 roles
- `isAdmin()` → solo TILOGIST y ADLOGIST
- `!isJefeLogistica()` → oculta para JLOLOGIST
- `canCreateUsers()` → TILOGIST, ADLOGIST, JLOLOGIST

## 3. Pestañas operativas

### 3.1 Dashboard — `ADMINLG_MENU_DASHBOARD`

Panel de control de la consola: contadores de pendientes, aprobaciones del día y accesos rápidos.

**Procedimiento:** revisar tarjetas → clic en una tarjeta para ir a la bandeja correspondiente.

### 3.2 Bandeja Aprobaciones — `ADMINLG_MENU_BANDEJA`

Bandeja unificada de documentos pendientes de aprobación (requerimientos, SC, SS).

**Procedimiento:**
1. Revisar la lista de pendientes (columna estado: `PENDIENTE` / `RECHAZADO`).
2. Abrir el documento para ver detalle.
3. Aprobar o rechazar desde el detalle.

### 3.3 Aprobar Consumo — `ADMINLG_MENU_APROBAR_CONSUMO`

Aprobación de requerimientos de **consumo** (salidas a almacén por consumo de área).

1. Lista de solicitudes de consumo pendientes.
2. Revisar ítems, cantidades y área solicitante.
3. Aprobar o rechazar con motivo.

### 3.4 Aprobar Solicitud Compra — `ADMINLG_MENU_APROBAR_SC` *(no JLOLOGIST por defecto)*

Aprobación de **Solicitudes de Compra** antes de que pasen a cotización/OC.

### 3.5 Aprobar Solicitud Servicio — `ADMINLG_MENU_APROBAR_SS` *(no JLOLOGIST por defecto)*

Aprobación de **Solicitudes de Servicio**.

## 4. Pestañas de catálogos

### 4.1 Maestros — `ADMINLG_MENU_MAESTROS`

Mantenimiento de maestras del módulo: ítems, commodities, unidades de medida, etc.

### 4.2 Gestión Proveedores — `ADMINLG_MENU_PROVEEDORES`

CRUD de proveedores: razón social, RUC, contactos, condiciones.

## 5. Pestañas de usuarios y áreas

### 5.1 Usuarios — `ADMINLG_MENU_USUARIOS`

Crear y editar usuarios de la app operativa.

1. **Nuevo usuario** → completar datos personales y credenciales.
2. Asignar `idrol`:
   - TILOGIST: cualquier rol.
   - ADLOGIST: todos excepto TILOGIST.
   - JLOLOGIST: solo LOLOGIST, EMLOGIST, ALLOGIST, OPLOGIST, APLOGIST.
3. Roles múltiples: separar por coma (ej. `LOLOGIST,ALLOGIST`).
4. Guardar. *(JLOLOGIST no ve usuarios JLOLOGIST ni ADLOGIST en las listas.)*

### 5.2 Áreas — `ADMINLG_MENU_AREAS` *(admin)*

CRUD de áreas organizacionales que agrupan usuarios para el flujo de aprobación.

### 5.3 Usuarios por Área — `ADMINLG_MENU_USUARIO_AREA` *(admin)*

Asigna usuarios a áreas. Determina **qué APLOGIST ve qué requerimientos**.

1. Seleccionar área.
2. Agregar/quitar usuarios asignados.
3. Guardar → el aprobador solo verá requerimientos de sus áreas.

### 5.4 Flujo Aprobación Área — `ADMINLG_MENU_FLUJO_AREA` *(admin)*

Define el flujo de aprobación por tipo de requerimiento: `CONSUMO`, `COMPRA`, `SERVICIO`, `TRANSFERENCIA`, con niveles `JEFE_AREA` / `APLOGIST`.

1. Elegir área y tipo de flujo.
2. Definir niveles y aprobador de cada nivel.
3. Activar el flujo → los requerimientos nuevos lo siguen.

## 6. Pestañas de configuración

### 6.1 Formato PDF — `ADMINLG_MENU_PDF`

Plantilla del PDF de órdenes: signatarios (Solicitante, Jefe de Área, Aprobado por, Gerencia/Logística, Proveedor) y datos de empresa que se imprimen.

### 6.2 Empresa — `ADMINLG_MENU_EMPRESA` *(admin)*

CRUD de empresas. Campos obligatorios: **RUC y Razón Social**.

### 6.3 Parámetros — `ADMINLG_MENU_PARAMETROS` *(admin)*

Parámetros generales del módulo: moneda (`Soles S/`, `Dólares $`, `Euros €`), umbrales, valores por defecto.

### 6.4 Incremento Cantidad OC — `ADMINLG_MENU_INCREMENTO_OC` *(admin)*

Configura si/cuánto se puede incrementar la cantidad de una línea de OC al recepcionar, con **control de versiones** (guarda nueva versión, mantiene historial, valida rango de fechas).

1. Revisar configuración vigente.
2. **Guardar nueva versión** con % de incremento permitido y vigencia (fecha desde/hasta).
3. El historial queda auditable.

### 6.5 Plantillas Almacén — `ADMINLG_MENU_ALMACEN` *(admin)*

Plantillas de configuración de almacenes por empresa.

### 6.6 Conformidad Servicio — `ADMINLG_MENU_CONFORMIDAD` *(admin)*

Configuración del proceso de conformidad de servicios.

### 6.7 Migrar Adjuntos — `ADMINLG_MENU_MIGRAR_ADJUNTOS` *(admin)*

Utilidad técnica para migrar adjuntos de OC y OS (Orden de Compra / Orden de Servicio).

## 7. Pestañas de control

### 7.1 Aprobadores — `ADMINLG_MENU_APROBADORES` *(admin)*

Mantenedor de aprobadores por flujo de OC/OS (niveles, orden, usuario aprobador).

### 7.2 Auditoría — `ADMINLG_MENU_AUDITORIA` *(admin)*

Trazabilidad de acciones administrativas.

1. Filtrar por tipo de acción: Inicio de Sesión, Creación, Actualización, Eliminación, Aprobación…
2. Revisar usuario, fecha y detalle del cambio.

### 7.3 Permisos por Rol — `ADMINLG_MENU_PERMISOS_ROL` *(admin)*

Pantalla para asignar/quitar las claves `ADMINLG_MENU_*` a cada rol — controla qué pestañas de esta consola ve cada rol.

1. Seleccionar el rol (catálogo `ROLES_SISTEMA`, 11 roles).
2. Activar/desactivar cada clave de menú.
3. Guardar → se persiste en `LOGISTICA_ConfiguracionPermiso` (valor `1` = habilitado).
4. El cambio aplica al próximo inicio de sesión del usuario afectado.

## 8. Permisos `ADMINLG_*`

| Clave | Pestaña | Defecto |
|---|---|---|
| `ADMINLG_MENU_DASHBOARD` | Dashboard | Todos |
| `ADMINLG_MENU_BANDEJA` | Bandeja | Todos |
| `ADMINLG_MENU_APROBAR_CONSUMO` | Aprobar Consumo | Todos |
| `ADMINLG_MENU_APROBAR_SC` | Aprobar SC | No JLOLOGIST |
| `ADMINLG_MENU_APROBAR_SS` | Aprobar SS | No JLOLOGIST |
| `ADMINLG_MENU_MAESTROS` | Maestros | Todos |
| `ADMINLG_MENU_PROVEEDORES` | Proveedores | Todos |
| `ADMINLG_MENU_USUARIOS` | Usuarios | Quien puede crear usuarios |
| `ADMINLG_MENU_AREAS` | Áreas | Admin |
| `ADMINLG_MENU_USUARIO_AREA` | Usuarios por Área | Admin |
| `ADMINLG_MENU_FLUJO_AREA` | Flujo Aprobación | Admin |
| `ADMINLG_MENU_PDF` | Formato PDF | Todos |
| `ADMINLG_MENU_EMPRESA` | Empresa | Admin |
| `ADMINLG_MENU_PARAMETROS` | Parámetros | Admin |
| `ADMINLG_MENU_INCREMENTO_OC` | Incremento OC | Admin |
| `ADMINLG_MENU_APROBADORES` | Aprobadores | Admin |
| `ADMINLG_MENU_AUDITORIA` | Auditoría | Admin |
| `ADMINLG_MENU_ALMACEN` | Plantillas Almacén | Admin |
| `ADMINLG_MENU_CONFORMIDAD` | Conformidad | Admin |
| `ADMINLG_MENU_PERMISOS_ROL` | Permisos por Rol | Admin |
| `ADMINLG_MENU_MIGRAR_ADJUNTOS` | Migrar Adjuntos | Admin |

## 9. Preguntas frecuentes

| Pregunta | Respuesta |
|---|---|
| ¿Por qué JLOLOGIST no ve Áreas/Empresa? | Esas pestañas son `isAdmin()`. Se le pueden habilitar en Permisos por Rol |
| ¿Los cambios de permisos son inmediatos? | Aplican al recargar la consola o al próximo login |
| ¿Puedo darle a EMLOGIST acceso a la consola? | No directamente: el guard de la consola solo deja entrar sesiones autenticadas de la consola y el menú depende de permisos; está pensada para TI/AD/JL |
| ¿Dónde veo quién cambió un permiso? | Pestaña Auditoría → filtrar por Actualización |
