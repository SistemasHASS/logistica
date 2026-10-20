# Guía de Primeros Pasos — Sistema Logística

**Para:** todo usuario nuevo del sistema
**Tiempo estimado:** 15 minutos

---

## Índice

1. [Antes de empezar](#1-antes-de-empezar)
2. [Día 1: tu primer acceso](#2-día-1-tu-primer-acceso)
3. [Conoce tu pantalla](#3-conoce-tu-pantalla)
4. [Sincronización inicial (obligatoria para operativos)](#4-sincronización-inicial)
5. [Tu primera tarea según tu rol](#5-tu-primera-tarea-según-tu-rol)
6. [Buenas prácticas desde el día 1](#6-buenas-prácticas)
7. [¿A quién pedir ayuda?](#7-a-quién-pedir-ayuda)

---

## 1. Antes de empezar

### ¿Cómo obtengo mi usuario?

- Tu cuenta la crea el **administrador del sistema** (TILOGIST) o el **administrador de logística** (ADLOGIST).
- Si eres personal operativo, tu **Jefe de Logística** (JLOLOGIST) también puede crearte la cuenta.
- Recibirás: **usuario** y **contraseña** corporativos, más tu **rol** asignado.

### Requisitos técnicos

| Requisito | Detalle |
|---|---|
| Navegador | Chrome, Edge o Firefox actualizados |
| Conexión | Internet para login y sincronización; la app **funciona offline** para requerimientos |
| URL | La que indique tu área de TI |

## 2. Día 1: tu primer acceso

1. Abre la URL de la aplicación.
2. Ingresa **usuario** y **contraseña**.
3. El sistema te lleva automáticamente a **tu** pantalla de inicio según tu rol — no necesitas buscar nada.

![Login](../capturas_manual/01_login.png)

### ¿A dónde entro según mi rol?

| Tu rol | Verás primero |
|---|---|
| Operativo Campo (OPLOGIST) | Mis Requerimientos |
| Almacén (ALLOGIST) | Gestión de Despachos |
| Aprobador (APLOGIST) | Dashboard de Aprobaciones por Área |
| Finanzas (FINANZAS) | Dashboard Finanzas |
| Jefe Logística / Operador / Licitaciones | Dashboard Logística |
| Admin (TILOGIST/ADLOGIST) | Dashboard de administración |
| Jefe Licitaciones (JEMLOGIST) | Dashboard Jef. Licitaciones |

> **Si entras y no ves menú o queda en blanco:** tu rol puede no tener menú configurado. Avisa al administrador (ver §7).

## 3. Conoce tu pantalla

| Elemento | Qué es |
|---|---|
| Menú lateral (izquierda) | Tus opciones, agrupadas por tema. Se abren/cierran como acordeón |
| Campana / contador | Notificaciones — se actualiza cada 30 segundos |
| Título superior | Nombre de la pantalla actual |
| Tu nombre | Arriba a la izquierda; ahí está también **Cerrar sesión** |

## 4. Sincronización inicial

> **Obligatorio si tu rol crea requerimientos** (OPLOGIST, EMLOGIST, LOLOGIST, ALLOGIST, ADLOGIST, JLOLOGIST, TILOGIST).

1. Menú → **Parámetros**.
2. Presiona **Sincronizar**.
3. Espera a que descargue las maestras: ítems, almacenes, áreas, centros de costo, labores, unidades.
4. Sin esto, la pantalla Requerimientos te mostrará *"Falta configurar"*.

![Parámetros](../capturas_manual/05_parametros.png)

## 5. Tu primera tarea según tu rol

| Rol | Primera tarea sugerida | Manual |
|---|---|---|
| OPLOGIST | Crear un requerimiento de prueba | [manual](roles/MANUAL_ROL_OPLOGIST.md) |
| EMLOGIST | Igual: requerimiento + sincronizar | [manual](roles/MANUAL_ROL_EMLOGIST.md) |
| APLOGIST | Revisar la bandeja de aprobaciones | [manual](roles/MANUAL_ROL_APLOGIST.md) |
| ALLOGIST | Revisar despachos pendientes | [manual](roles/MANUAL_ROL_ALLOGIST.md) |
| LOLOGIST | Revisar consolidación de aprobados | [manual](roles/MANUAL_ROL_LOLOGIST.md) |
| JLOLOGIST | Recorrer el menú acordeón | [manual](roles/MANUAL_ROL_JLOLOGIST.md) |
| JEMLOGIST | Revisar OC/OS pendientes | [manual](roles/MANUAL_ROL_JEMLOGIST.md) |
| FINANZAS / GERENTE | Revisar órdenes pendientes | [FIN](roles/MANUAL_ROL_FINANZAS.md) · [GER](roles/MANUAL_ROL_GERENTE.md) |
| ADLOGIST / TILOGIST | Recorrer la consola admin | [AD](roles/MANUAL_ROL_ADLOGIST.md) · [TI](roles/MANUAL_ROL_TILOGIST.md) |

## 6. Buenas prácticas

- ✅ **Sincroniza al entrar y antes de salir** — el sistema no te deja cerrar sesión con requerimientos sin sincronizar.
- ✅ Revisa las **notificaciones**: avisan de saldos pendientes por consolidar.
- ✅ Puedes trabajar **sin internet**: todo se guarda local y se envía al sincronizar.
- ❌ No compartas tu usuario — las aprobaciones quedan registradas a tu nombre.
- ❌ No cierres el navegador a la fuerza con pendientes sin sincronizar.

## 7. ¿A quién pedir ayuda?

| Problema | Contacto |
|---|---|
| No tengo usuario / olvidé contraseña | Administrador (TILOGIST/ADLOGIST) |
| No veo un menú o pantalla | Administrador — revisa permisos/menú de tu rol |
| No veo requerimientos de mi área | Admin → *Usuarios por Área* |
| Error técnico / bug | Soporte TI |
| Duda del proceso | Tu jefe de área o Jefatura de Logística |

**Ver también:** [FAQ y Troubleshooting](FAQ_TROUBLESHOOTING.md) · [Manual maestro de roles](MANUAL_ROLES_SISTEMA_COMPLETO.md)
