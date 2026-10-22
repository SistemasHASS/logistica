# Manual del Módulo de Administración Clásica (`/administracion`)

**Versión:** 1.0 — Octubre 2026
**Audiencia:** TILOGIST, ADLOGIST (acceso con login adicional)

---

## Índice

1. [Acceso](#1-acceso)
2. [Panel y usuarios](#2-panel-y-usuarios)
3. [Estructura organizacional](#3-estructura-organizacional)
4. [Aprobaciones y flujos](#4-aprobaciones-y-flujos)
5. [Correo y plantillas](#5-correo-y-plantillas)
6. [Apariencia y branding](#6-apariencia-y-branding)
7. [Permisos y menús](#7-permisos-y-menús)
8. [Empresas y sincronización](#8-empresas-y-sincronización)
9. [Diferencias con la consola `/admin-logistica`](#9-diferencias-con-la-consola-admin-logistica)

---

## 1. Acceso

| Paso | Detalle |
|---|---|
| Login | `/admin-login` → genera `ADMIN_TOKEN` en localStorage |
| Ruta | `/administracion` (lazy module, `AdminGuard`) |
| Sin token | Redirige a `/admin-login` |
| Layout | `AdminLayoutComponent` con menú propio |

> A diferencia de la consola `/admin-logistica` (que valida rol), aquí el control es el token de admin-login. En la práctica lo usan TILOGIST y ADLOGIST.

## 2. Panel y usuarios

### 2.1 Dashboard — `/administracion/dashboard`

Panel del módulo: resumen de usuarios, roles y configuración.

### 2.2 Usuarios — `admin-usuarios`

CRUD de usuarios de la app: alta, edición, cambio de rol, activar/desactivar.

1. Lista de usuarios → buscar por nombre/usuario.
2. **Nuevo** o editar → datos + `idrol`.
3. Guardar.

### 2.3 Roles — `admin-roles`

Mantenedor del catálogo de roles (los `idrol` disponibles para asignar).

### 2.4 Perfiles — `admin-perfiles`

Perfiles de acceso (agrupaciones de permisos históricos del sistema).

## 3. Estructura organizacional

### 3.1 Áreas — `admin-areas`

CRUD de áreas: nombre, empresa, estado.

### 3.2 Usuarios por Área — `usuarios-por-area`

Asignación usuario ↔ área. Es la base para que APLOGIST reciba solo los requerimientos de su área.

1. Seleccionar área → ver usuarios asignados.
2. Agregar/quitar usuarios → guardar.

## 4. Aprobaciones y flujos

### 4.1 Flujos — `admin-flujos`

Definición de flujos de aprobación (secuencia de niveles y aprobadores por tipo de documento).

### 4.2 Aprobadores — `admin-aprobadores`

Mantenedor de aprobadores: quién aprueba en cada nivel del flujo.

## 5. Correo y plantillas

### 5.1 Proveedores Email — `admin-proveedores-email`

Correos de proveedores para envío automático de OC/notificaciones.

### 5.2 Config SMTP — `admin-config-smtp`

Servidor de correo saliente: host, puerto, credenciales, remitente. **Cambiar con cuidado** — afecta todos los envíos.

### 5.3 Plantilla Correo — `admin-plantilla-correo`

Cuerpo/asunto de los correos automáticos (variables del documento).

### 5.4 Plantilla PDF — `admin-plantilla-pdf`

Diseño del PDF de órdenes: cabecera, signatarios, pie.

## 6. Apariencia y branding

### 6.1 Configuración de Colores — `configuracion-colores`

Paleta de colores de la app por empresa.

### 6.2 Config Branding — `admin-config-branding`

Logo, nombre y assets de marca por empresa.

## 7. Permisos y menús

### 7.1 Permisos Roles — `admin-permisos-roles`

Permisos por rol del módulo clásico (distinto de `ADMINLG_*` de la consola nueva).

### 7.2 Menús Layout — `admin-menus-layout`

Tipo de layout del menú por rol (accordion, nav, list) — escribe las claves `MENU_TYPE`/`LAYOUT_*` en `LOGISTICA_ConfiguracionPermiso`.

### 7.3 Menús Dinámicos — `admin-menus-dinamicos`

Editor de `MENU_JSON` por rol: grupos, ítems, iconos, rutas, orden, activo/inactivo.

### 7.4 Permisos Menú Dinámico — `admin-permisos-menu-dinamico`

Permisos finos sobre los ítems del menú dinámico (`ITEMS_VISIBLES`).

### 7.5 Plantillas Menú — `admin-plantillas-menu`

Plantillas reutilizables de menú para aplicar a varios roles de una vez.

## 8. Empresas y sincronización

### 8.1 Empresas — `admin-empresas`

CRUD de empresas del grupo (multiempresa).

### 8.2 Plantilla Almacén — `admin-plantilla-almacen`

Plantillas de almacén por empresa.

### 8.3 Versión API — `admin-version-api`

Versión de la API desplegada — útil para verificar despliegues y el control de versiones de la app (`updateMode`).

### 8.4 Sincronización — `admin-sincronizacion`

Herramientas de sincronización de maestras/datos hacia los clientes.

## 9. Diferencias con la consola `/admin-logistica`

| Tema | `/administracion` (clásica) | `/admin-logistica` (consola) |
|---|---|---|
| Login | `/admin-login` + token | Login propio con usuario |
| Enfoque | Configuración histórica completa | Administración logística + aprobaciones |
| Aprobaciones | No | Sí (bandeja, consumo, SC, SS) |
| Menús/branding | Sí (editor completo) | No (solo permisos `ADMINLG_*`) |
| Usuarios | CRUD general | CRUD con restricción por rol |
| Recomendado para | Setup inicial, correo, branding | Operación diaria de administración |

> **Regla práctica:** configuración de correo, plantillas, branding y menús → módulo clásico. Aprobaciones, usuarios por área, flujos y permisos de consola → `/admin-logistica`.

---

*Ver también: [Manual maestro de roles](MANUAL_ROLES_SISTEMA_COMPLETO.md) · [Consola Admin Logística](MANUAL_CONSOLA_ADMIN_LOGISTICA.md)*
