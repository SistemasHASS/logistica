# Manual de Roles del Sistema Logística

**Versión:** 1.0
**Fecha:** Octubre 2026
**Proyecto:** App Logística (Frontend Angular + API Logística)
**Audiencia:** Usuarios finales, jefaturas, administradores y soporte TI

---

## Índice

1. [Introducción](#1-introducción)
2. [Formas de acceso al sistema](#2-formas-de-acceso-al-sistema)
3. [Catálogo de roles](#3-catálogo-de-roles)
4. [Arquitectura de permisos](#4-arquitectura-de-permisos)
5. [Pantalla de inicio por rol](#5-pantalla-de-inicio-por-rol)
6. [Matriz de acceso rol × módulo](#6-matriz-de-acceso-rol--módulo)
7. [Descripción funcional de cada rol](#7-descripción-funcional-de-cada-rol)
8. [Flujo de proceso end-to-end y participación por rol](#8-flujo-de-proceso-end-to-end)
9. [Consola de administración `/admin-logistica`](#9-consola-de-administración-admin-logistica)
10. [Módulo de administración clásica `/administracion`](#10-módulo-de-administración-clásica)
11. [Funciones transversales](#11-funciones-transversales)
12. [Observaciones técnicas conocidas](#12-observaciones-técnicas-conocidas)
13. [Manuales individuales y video tutoriales](#13-manuales-individuales-y-video-tutoriales)

---

## 1. Introducción

El Sistema Logística cubre el ciclo operativo completo: **requerimiento → aprobación → consolidación → cotización → orden de compra/servicio → recepción → despacho → conformidad → kardex e inventario → reportes**.

El acceso a cada pantalla está controlado por el **rol del usuario** (`idrol`), asignado al momento de crear la cuenta. Un usuario puede tener uno o varios roles (separados por coma en el campo `idrol`).

Los permisos se aplican en tres niveles:

| Nivel | Mecanismo | Dónde se define |
|---|---|---|
| Acceso a pantallas (rutas) | Guards de Angular | Código fuente (`app.routes.ts` + guards) |
| Menú lateral visible | Configuración en BD | Tabla `LOGISTICA_ConfiguracionPermiso` (claves `MENU_*`) |
| Opciones de la consola admin | Permisos por rol en BD | Claves `ADMINLG_MENU_*` (editables desde *Permisos por Rol*) |

---

## 2. Formas de acceso al sistema

El sistema tiene **tres puntos de entrada** distintos:

| Entrada | URL | Para quién | Autenticación |
|---|---|---|---|
| App operativa | `/auth/login` | Todos los roles operativos | API Maestra (usuario/contraseña corporativa) |
| Consola Admin Logística | `/admin-logistica/login` | TILOGIST, ADLOGIST, JLOLOGIST | Login propio de la consola |
| Administración clásica | `/admin-login` | Administradores del sistema | Genera `ADMIN_TOKEN` en sesión |

![Login](../capturas_manual/01_login.png)

**Después del login** el sistema:

1. Valida credenciales contra la API Maestra.
2. Guarda al usuario en la base local (IndexedDB/Dexie).
3. Carga la configuración de menú del rol desde la BD.
4. Redirige automáticamente al dashboard que corresponde al rol.
5. Activa el contador de notificaciones (se actualiza cada 30 segundos).

> **Importante:** antes de cerrar sesión se deben sincronizar los requerimientos pendientes. Si existen registros sin sincronizar, el sistema bloquea el cierre de sesión y muestra un aviso con el detalle.

---

## 3. Catálogo de roles

| # | Código (`idrol`) | Nombre | Perfil / Área típica |
|---|---|---|---|
| 1 | `TILOGIST` | Admin Sistema | Soporte TI / Sistemas |
| 2 | `ADLOGIST` | Admin Logística | Administrador funcional del módulo |
| 3 | `JLOLOGIST` | Jefe Logística | Jefatura de logística |
| 4 | `JEMLOGIST` | Jefe Licitaciones | Jefatura de licitaciones / empaque |
| 5 | `LOLOGIST` | Operador Logística | Analista de compras/logística |
| 6 | `EMLOGIST` | Operador Licitaciones | Operador de empaque/licitaciones |
| 7 | `ALLOGIST` | Almacén | Personal de almacén |
| 8 | `OPLOGIST` | Operativo Campo | Usuario de campo que solicita |
| 9 | `APLOGIST` | Aprobador Consumo | Jefe de área que aprueba requerimientos |
| 10 | `FINANZAS` | Finanzas | Área financiera (aprobación de órdenes) |
| 11 | `GERENTE` | Gerente | Gerencia (aprobación de alto nivel) |

**Jerarquía para administración de usuarios:**

- `TILOGIST` puede crear usuarios de **todos** los roles.
- `ADLOGIST` puede crear usuarios de todos los roles **excepto TILOGIST**.
- `JLOLOGIST` solo puede crear usuarios de roles operativos: `LOLOGIST`, `EMLOGIST`, `ALLOGIST`, `OPLOGIST`, `APLOGIST`.
- `JLOLOGIST` no puede ver usuarios con rol `JLOLOGIST` ni `ADLOGIST` en las listas.

---

## 4. Arquitectura de permisos

### 4.1 Guards de rutas (nivel código)

| Guard | Roles que pasan | Pantallas que protege |
|---|---|---|
| `AdministradorGuard` | TILOGIST, ADLOGIST | Maestros, Aprobadores, dashboards TI/Admin |
| `AdminGuard` | Sesión admin (`ADMIN_TOKEN`) | Todo `/administracion` |
| `LogisticoGuard` | LOLOGIST, TILOGIST, ADLOGIST, JLOLOGIST | Compras, cotizaciones, OC/OS, consolidaciones, reportes compras |
| `OperativoLogisticoGuard` | OPLOGIST, LOLOGIST, EMLOGIST, JEMLOGIST, JLOLOGIST, APLOGIST, ADLOGIST, ALLOGIST | Dashboard operativo |
| `OperativoEmpaqueGuard` | OPLOGIST, EMLOGIST + Logístico + Almacén | Requerimientos, Parámetros, Notificaciones |
| `AlmacenGuard` | ALLOGIST, LOLOGIST | Despachos, recepción, kardex, inventario, transferencias, devoluciones a proveedores |
| `AprobadorGuard` | APLOGIST, ADLOGIST, JLOLOGIST | Aprobaciones por área y sus reportes |
| `AprobadorOCGuard` | TILOGIST, ADLOGIST, JLOLOGIST, JEMLOGIST, FINANZAS, GERENTE | Aprobación OC/OS, dashboard finanzas |
| `DevolucionConsumoGuard` | TILOGIST, ADLOGIST, JLOLOGIST, ALLOGIST, OPLOGIST, EMLOGIST, LOLOGIST, APLOGIST | Devoluciones de consumo, conformidad de almacén |
| `ReingresoGuard` | APLOGIST, ALLOGIST, ADLOGIST, OPLOGIST, EMLOGIST, LOLOGIST | Reingresos |
| `JefeAreaGuard` | APLOGIST | Aprobar/rechazar reingresos |
| `JefeAlmacenGuard` | ALLOGIST, ADLOGIST | Aprobar/rechazar/anular devoluciones |
| `ConformidadServiciosGuard` | LOLOGIST, TILOGIST, ADLOGIST, OPLOGIST, EMLOGIST, JEMLOGIST, JLOLOGIST | Conformidad de servicios |
| `ConfigGuard` | Cualquier rol | Exige tener configuración sincronizada |

### 4.2 Menú dinámico por rol (nivel BD)

La tabla `LOGISTICA_ConfiguracionPermiso` guarda, por `idrol`:

| Clave | Uso |
|---|---|
| `MENU_TYPE` | Tipo visual: `accordion`, `nav`, `list` |
| `MENU_JSON` | Estructura completa del menú (grupos e ítems) |
| `ITEMS_VISIBLES` | Lista de ítems del menú por defecto a mostrar |
| `LAYOUT_ACCORDION` | `1` activa el menú acordeón |

> **Excepción:** `JLOLOGIST` usa un menú propio definido en el componente `DynamicMenuComponent` (no depende de `MENU_JSON`).

### 4.3 Permisos de la consola admin (`ADMINLG_*`)

Cada pestaña de `/admin-logistica` tiene una clave (`ADMINLG_MENU_USUARIOS`, `ADMINLG_MENU_AUDITORIA`, etc.) editable desde la propia consola en **Permisos por Rol**. Si no hay valor en BD, se aplica un comportamiento por defecto:

- `TILOGIST` y `ADLOGIST` ven todas las pestañas.
- `JLOLOGIST` ve: Dashboard, Bandeja, Aprobar Consumo, Maestros, Proveedores, Usuarios (solo roles operativos) y Formato PDF. **No** ve Aprobar SC/SS ni las pestañas de configuración.

---

## 5. Pantalla de inicio por rol

Al entrar a `/main`, el sistema redirige automáticamente:

| Rol | Pantalla inicial | Captura |
|---|---|---|
| `TILOGIST` | Dashboard Admin Sistema (`dashboard-tilogist`) | 02_dashboard_admin.png |
| `ADLOGIST` | Dashboard Admin Logística (`dashboard-adlogist`) | 02_dashboard_admin.png |
| `JLOLOGIST` | Dashboard Logística (`dashboard-logistica`) | 35_dashboard_logistica.png |
| `JEMLOGIST` | Dashboard Jef. Licitaciones (`dashboard-jemlogist`) | 52_dashboard_jemlogist.png |
| `LOLOGIST` | Dashboard Logística (`dashboard-logistica`) | 35_dashboard_logistica.png |
| `EMLOGIST` | Dashboard Logística (`dashboard-logistica`) | 35_dashboard_logistica.png |
| `OPLOGIST` | Mis Requerimientos (`dashboard-oplogist`) | 12_dashboard_operativo.png |
| `ALLOGIST` | Gestión de Despachos (`despachos`) | 23_despachos.png |
| `APLOGIST` | Dashboard Aprobaciones por Área | 15_dashboard_aprobaciones_area.png |
| `FINANZAS` | Dashboard Finanzas | 53_dashboard_finanzas.png |
| `GERENTE` | Menú configurado en BD (sin redirect fijo) | — |

---

## 6. Matriz de acceso rol × módulo

Leyenda: ✅ acceso · ⛔ sin acceso · 🔓 sin restricción (todo usuario autenticado)

| Módulo / Pantalla | TI | AD | JL | JEM | LO | EM | AL | OP | AP | FIN | GER |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Panel / Dashboards** |||||||||||||
| Dashboard Admin Sistema | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Dashboard Admin Logística | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Dashboard Logística | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Dashboard Jef. Logística | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Dashboard Jef. Licitaciones | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Dashboard Compras | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Dashboard Operativo | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ |
| Dashboard Despacho | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Dashboard Finanzas | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| Dashboard Aprob. Área | ⛔ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| **Configuración** |||||||||||||
| Parámetros | ✅ | ✅ | ✅ | ⛔ | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ |
| Notificaciones | ✅ | ✅ | ✅ | ⛔ | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ |
| **Requerimientos** |||||||||||||
| Requerimientos (crear) | ✅ | ✅ | ✅ | ⛔ | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ |
| Saldo de Requerimiento | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 |
| **Compras & Órdenes** |||||||||||||
| Solicitudes de Compra | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Consolidación Requerimientos | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Consolidación Compras | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Consolidación Corporativa | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Cotizaciones | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Órdenes de Compra | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Solicitudes de Servicio | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Consolidación Servicios | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Órdenes de Servicio | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Conformidad de Servicios | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ |
| **Almacén & Stock** |||||||||||||
| Despachos | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Recepción de Mercadería | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Conformidad de Despacho | ✅ | ✅ | ✅ | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ |
| Kardex e Inventario | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Gestión de Inventario | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Listas de Stock | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Transferencias de Almacén | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Devoluciones a Proveedores | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Devoluciones de Consumo | ✅ | ✅ | ✅ | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ |
| Reingresos | ⛔ | ✅ | ⛔ | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ |
| Evaluación de Proveedores | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| **Aprobaciones** |||||||||||||
| Aprobaciones por Área (req.) | ⛔ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| Reporte Aprob. Área | ⛔ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| Reporte Requerimientos Aprobados | ⛔ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| Aprobación OC | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| Aprobación OS | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| **Maestros & Catálogos** |||||||||||||
| Maestros (ítems/commodities) | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Maestro Proveedores | ✅ | ✅ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Aprobadores (mantenedor) | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Catálogo de Ítems | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 |
| **Reportes** |||||||||||||
| Reportes de Compras | ✅ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Reporte Requerimientos | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 |
| Reporte Logístico | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 |
| Reporte de Saldos | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Reporte de Despachos | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| **Consolas admin** |||||||||||||
| `/administracion` (clásica) | ✅* | ✅* | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| `/admin-logistica` (consola) | ✅ | ✅ | ✅** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |

\* Requiere login adicional en `/admin-login`.
\** `JLOLOGIST` entra con menú reducido (sin pestañas de configuración ni Aprobar SC/SS por defecto; ampliable con permisos `ADMINLG_*`).

> La matriz refleja los **guards del código fuente**. El menú lateral que ve cada usuario puede ser más corto según la configuración `MENU_JSON`/`ITEMS_VISIBLES` en BD.

---

## 7. Descripción funcional de cada rol

### 7.1 TILOGIST — Admin Sistema

**Propósito:** soporte técnico y administración total de la plataforma.

- Accede a los dashboards de administración (TI y Logística) y a casi todas las pantallas operativas excepto almacén físico y aprobaciones por área.
- Administra **todos** los roles de usuario, permisos `ADMINLG_*`, menús dinámicos, branding, SMTP, plantillas de correo/PDF, auditoría y sincronización.
- Es el único rol que puede crear otros `TILOGIST`.
- Entra a ambas consolas: `/administracion` (clásica) y `/admin-logistica`.

Manual: [roles/MANUAL_ROL_TILOGIST.md](roles/MANUAL_ROL_TILOGIST.md)

### 7.2 ADLOGIST — Admin Logística

**Propósito:** administrador funcional del módulo logístico.

- Mismas facultades de configuración que TILOGIST salvo crear cuentas TILOGIST.
- Además opera requerimientos, compras, aprobaciones por área, aprobaciones OC/OS, devoluciones, reingresos y conformidades.
- No accede a pantallas físicas de almacén (despachos, kardex, recepción) ni al dashboard operativo de campo… salvo `dashboard-oplogist` que sí está permitido.
- Gestiona usuarios de todos los roles excepto TILOGIST.

Manual: [roles/MANUAL_ROL_ADLOGIST.md](roles/MANUAL_ROL_ADLOGIST.md)

### 7.3 JLOLOGIST — Jefe Logística

**Propósito:** supervisar y aprobar el ciclo logístico completo.

- Único rol con **menú propio** (no configurable por `MENU_JSON`).
- Aprueba requerimientos por área, OC y OS; gestiona compras, cotizaciones, consolidaciones y conformidades.
- Puede crear usuarios operativos (LOLOGIST, EMLOGIST, ALLOGIST, OPLOGIST, APLOGIST) desde la consola admin.
- No accede a pantallas de almacén físico ni reingresos.

Manual: [roles/MANUAL_ROL_JLOLOGIST.md](roles/MANUAL_ROL_JLOLOGIST.md)

### 7.4 JEMLOGIST — Jefe Licitaciones

**Propósito:** jefatura del área de licitaciones/empaque; aprueba órdenes.

- Aprueba y rechaza OC y OS (junto a Finanzas y Gerente).
- Ve el dashboard operativo, dashboard de licitaciones y conformidad de servicios.
- Participa en devoluciones de consumo.
- No crea requerimientos ni gestiona compras directamente.

Manual: [roles/MANUAL_ROL_JEMLOGIST.md](roles/MANUAL_ROL_JEMLOGIST.md)

### 7.5 LOLOGIST — Operador Logística

**Propósito:** ejecutar el ciclo de compras y operar el almacén.

- Rol **más operativo del sistema**: cubre requerimientos, solicitudes de compra y servicio, consolidaciones (incluida corporativa), cotizaciones, OC/OS, conformidades.
- Es el único rol operativo con acceso completo a almacén: despachos, recepción, kardex, inventario, transferencias, devoluciones y evaluación de proveedores.
- No aprueba: ni requerimientos por área ni OC/OS.

Manual: [roles/MANUAL_ROL_LOLOGIST.md](roles/MANUAL_ROL_LOLOGIST.md)

### 7.6 EMLOGIST — Operador Licitaciones

**Propósito:** crear y gestionar requerimientos del área de empaque/licitaciones.

- Crea requerimientos (ítems, commodities, activos), revisa notificaciones y su dashboard operativo.
- Da conformidad de servicios, registra devoluciones de consumo y reingresos.
- No gestiona compras ni aprueba órdenes.

Manual: [roles/MANUAL_ROL_EMLOGIST.md](roles/MANUAL_ROL_EMLOGIST.md)

### 7.7 ALLOGIST — Almacén

**Propósito:** ejecutar la operación física del almacén.

- Pantalla inicial: **Gestión de Despachos**.
- Despacha, recepciona mercadería, mueve kardex, inventario, transferencias, listas de stock, devoluciones a proveedores y de consumo, reingresos y evaluación de proveedores.
- Actúa como **Jefe de Almacén**: puede aprobar/rechazar/anular devoluciones de consumo (`JefeAlmacenGuard`).
- Puede crear requerimientos y gestionar el maestro de proveedores.

Manual: [roles/MANUAL_ROL_ALLOGIST.md](roles/MANUAL_ROL_ALLOGIST.md)

### 7.8 OPLOGIST — Operativo Campo

**Propósito:** usuario solicitante en campo/fundo.

- Pantalla inicial: **Mis Requerimientos**.
- Crea requerimientos de ítems, commodities, activos fijos y menores; trabaja offline y sincroniza desde Parámetros.
- Da conformidad de despacho y de servicios; registra devoluciones de consumo y reingresos de material.
- No ve compras, almacén ni aprobaciones.

Manual: [roles/MANUAL_ROL_OPLOGIST.md](roles/MANUAL_ROL_OPLOGIST.md)

### 7.9 APLOGIST — Aprobador Consumo (Jefe de Área)

**Propósito:** aprobar o rechazar los requerimientos de su área.

- Pantalla inicial: **Dashboard de Aprobaciones por Área** con pendientes e historial.
- Aprueba/rechaza requerimientos y **reingresos** (es el único con `JefeAreaGuard`).
- Consulta reportes de aprobaciones de su área y conformidad de despacho.
- No crea requerimientos ni ve compras/almacén.

Manual: [roles/MANUAL_ROL_APLOGIST.md](roles/MANUAL_ROL_APLOGIST.md)

### 7.10 FINANZAS — Finanzas

**Propósito:** control financiero de las órdenes.

- Pantalla inicial: **Dashboard Finanzas**.
- Aprueba/rechaza Órdenes de Compra y Órdenes de Servicio.
- Rol de alcance reducido: solo aprobación de órdenes + reportes sin restricción.

Manual: [roles/MANUAL_ROL_FINANZAS.md](roles/MANUAL_ROL_FINANZAS.md)

### 7.11 GERENTE — Gerente

**Propósito:** aprobación de alto nivel y supervisión.

- Aprueba/rechaza OC y OS junto a Finanzas y jefaturas.
- Ve el Dashboard Finanzas y los reportes abiertos.
- Su menú se define 100% por configuración BD (recomendado: dashboard + aprobaciones + reportes).

Manual: [roles/MANUAL_ROL_GERENTE.md](roles/MANUAL_ROL_GERENTE.md)

---

## 8. Flujo de proceso end-to-end

```text
OPLOGIST/EMLOGIST/ALLOGIST   APLOGIST (área)    JLOLOGIST          LOLOGIST            ALLOGIST         FINANZAS/JEMLOGIST/GERENTE
        │                        │                 │                  │                   │                      │
  1. Crea requerimiento ────────►│                 │                  │                   │                      │
                                 2. Aprueba ──────►│                  │                   │                      │
                                                   3. Supervisa ────►│                   │                      │
                                                                     4. Consolida +      │                      │
                                                                        cotiza + SC      │                      │
                                                                     5. Genera OC ───────┼──────────────────────►│ 6. Aprueba OC
                                                                     7. Recepción ◄──────┤                      │
                                                                        (proveedor)      │                      │
                                                                     8. Despacha ───────►│ 9. Conforma consumo  │
                                                                                         │ 10. Kardex/stock     │
```

| Paso | Acción | Rol responsable | Pantalla |
|---|---|---|---|
| 1 | Crear requerimiento | OPLOGIST, EMLOGIST, LOLOGIST, ALLOGIST, ADLOGIST, JLOLOGIST, TILOGIST | Requerimientos |
| 2 | Aprobar por área | APLOGIST (ADLOGIST, JLOLOGIST también) | Aprobaciones por Área |
| 3 | Supervisar flujo | JLOLOGIST | Dashboard Logística |
| 4 | Consolidar + cotizar + SC | LOLOGIST, JLOLOGIST, ADLOGIST | Consolidación / Cotizaciones |
| 5 | Generar OC/OS | LOLOGIST | Órdenes de Compra/Servicio |
| 6 | Aprobar OC/OS | JLOLOGIST, JEMLOGIST, FINANZAS, GERENTE | Aprobación OC/OS |
| 7 | Recepcionar mercadería | ALLOGIST, LOLOGIST | Recepción de Mercadería |
| 8 | Despachar | ALLOGIST, LOLOGIST | Despachos |
| 9 | Conformidad | Solicitante (OPLOGIST/EMLOGIST/…) | Conformidad de Despacho |
| 10 | Inventario/kardex | ALLOGIST, LOLOGIST | Kardex e Inventario |

Flujos paralelos: **devoluciones** (consumo → APLOGIST aprueba reingreso; proveedor → ALLOGIST) y **evaluación de proveedores** (ALLOGIST/LOLOGIST).

---

## 9. Consola de administración `/admin-logistica`

Consola separada con login propio. Pestañas y su clave de permiso:

| Pestaña | Clave de permiso | Visible por defecto |
|---|---|---|
| Dashboard | `ADMINLG_MENU_DASHBOARD` | Todos |
| Bandeja Aprobaciones | `ADMINLG_MENU_BANDEJA` | Todos |
| Aprobar Consumo | `ADMINLG_MENU_APROBAR_CONSUMO` | Todos |
| Aprobar Solicitud Compra | `ADMINLG_MENU_APROBAR_SC` | TILOGIST, ADLOGIST |
| Aprobar Solicitud Servicio | `ADMINLG_MENU_APROBAR_SS` | TILOGIST, ADLOGIST |
| Maestros | `ADMINLG_MENU_MAESTROS` | Todos |
| Gestión Proveedores | `ADMINLG_MENU_PROVEEDORES` | Todos |
| Usuarios | `ADMINLG_MENU_USUARIOS` | Quienes pueden crear usuarios |
| Áreas | `ADMINLG_MENU_AREAS` | Admin |
| Usuarios por Área | `ADMINLG_MENU_USUARIO_AREA` | Admin |
| Flujo Aprobación Área | `ADMINLG_MENU_FLUJO_AREA` | Admin |
| Formato PDF | `ADMINLG_MENU_PDF` | Todos |
| Empresa | `ADMINLG_MENU_EMPRESA` | Admin |
| Parámetros | `ADMINLG_MENU_PARAMETROS` | Admin |
| Incremento Cantidad OC | `ADMINLG_MENU_INCREMENTO_OC` | Admin |
| Aprobadores | `ADMINLG_MENU_APROBADORES` | Admin |
| Auditoría | `ADMINLG_MENU_AUDITORIA` | Admin |
| Plantillas Almacén | `ADMINLG_MENU_ALMACEN` | Admin |
| Conformidad Servicio | `ADMINLG_MENU_CONFORMIDAD` | Admin |
| Permisos por Rol | `ADMINLG_MENU_PERMISOS_ROL` | Admin |
| Migrar Adjuntos | `ADMINLG_MENU_MIGRAR_ADJUNTOS` | Admin |

*(“Admin” = TILOGIST o ADLOGIST. Los permisos se pueden ajustar por rol en la pestaña **Permisos por Rol**.)*

---

## 10. Módulo de administración clásica

`/administracion` requiere login adicional en `/admin-login`. Incluye: dashboard admin, usuarios, roles, áreas, perfiles, flujos, aprobadores, usuarios por área, versión de API, correo de proveedores, SMTP, plantillas de correo y PDF, colores, permisos de roles, menús dinámicos y plantillas de menú, empresas, branding y sincronización.

![Administración](../capturas_manual/10_administracion.png)

---

## 11. Funciones transversales

| Función | Detalle |
|---|---|
| Notificaciones | Contador en el menú, refresco cada 30 s, toast clickeable cuando hay saldos pendientes |
| Trabajo offline | Requerimientos y maestras se guardan en IndexedDB; se sincronizan desde Parámetros |
| Cierre de sesión bloqueado | Si hay requerimientos sin sincronizar, el sistema impide salir hasta sincronizarlos |
| Adjuntos | SC y SS aceptan archivos adjuntos; existe pestaña “Migrar Adjuntos” en la consola |
| Multiempresa | La configuración de empresa/branding/PDF se gestiona por empresa |
| Auditoría | La consola registra acciones administrativas (pestaña Auditoría) |
| Reportes abiertos | Reporte Logístico, Reporte Requerimientos y Catálogo de Ítems no tienen guard: cualquier usuario autenticado puede entrar |

---

## 12. Observaciones técnicas conocidas

1. **EMLOGIST** redirige a `dashboard-logistica`, pero ese dashboard exige rol logístico. Si el usuario no tiene menú configurado en BD puede quedar sin pantalla inicial válida — configurar `MENU_JSON` para EMLOGIST apuntando a `dashboard-oplogist`.
2. **GERENTE** no tiene redirect definido: su entrada depende del `MENU_JSON` configurado en BD.
3. **TILOGIST** no ve aprobaciones por área ni reingresos (los guards no lo incluyen); para esos flujos usar ADLOGIST.
4. **JLOLOGIST** es el único rol con menú hardcodeado; los cambios de menú para este rol se hacen en `DynamicMenuComponent`.
5. Un usuario puede tener **varios roles** en `idrol` separados por coma (ej. `LOLOGIST,ALLOGIST`); los guards evalúan “contiene”.
6. El orden de evaluación del redirect es por `includes`: un usuario `TILOGIST,LOLOGIST` entrará siempre al dashboard TI.

---

## 13. Manuales individuales y video tutoriales

### Manuales por rol (Markdown + Word)

| Rol | Manual |
|---|---|
| TILOGIST | [MANUAL_ROL_TILOGIST.md](roles/MANUAL_ROL_TILOGIST.md) |
| ADLOGIST | [MANUAL_ROL_ADLOGIST.md](roles/MANUAL_ROL_ADLOGIST.md) |
| JLOLOGIST | [MANUAL_ROL_JLOLOGIST.md](roles/MANUAL_ROL_JLOLOGIST.md) |
| JEMLOGIST | [MANUAL_ROL_JEMLOGIST.md](roles/MANUAL_ROL_JEMLOGIST.md) |
| LOLOGIST | [MANUAL_ROL_LOLOGIST.md](roles/MANUAL_ROL_LOLOGIST.md) |
| EMLOGIST | [MANUAL_ROL_EMLOGIST.md](roles/MANUAL_ROL_EMLOGIST.md) |
| ALLOGIST | [MANUAL_ROL_ALLOGIST.md](roles/MANUAL_ROL_ALLOGIST.md) |
| OPLOGIST | [MANUAL_ROL_OPLOGIST.md](roles/MANUAL_ROL_OPLOGIST.md) |
| APLOGIST | [MANUAL_ROL_APLOGIST.md](roles/MANUAL_ROL_APLOGIST.md) |
| FINANZAS | [MANUAL_ROL_FINANZAS.md](roles/MANUAL_ROL_FINANZAS.md) |
| GERENTE | [MANUAL_ROL_GERENTE.md](roles/MANUAL_ROL_GERENTE.md) |

### Video tutoriales interactivos (HTML)

Abrir `video-tutoriales/index.html` en el navegador: cada rol tiene una presentación guiada paso a paso con narración y capturas reales del sistema.

---

*Documento generado a partir del código fuente (`app.routes.ts`, guards, `admin-logistica`, `LOGISTICA_ConfiguracionPermiso`) — Octubre 2026.*
