# FAQ y Troubleshooting — Sistema Logística

Preguntas frecuentes y solución de problemas comunes, ordenados por síntoma.

---

## Acceso y sesión

| Problema | Causa | Solución |
|---|---|---|
| No puedo entrar, credenciales rechazadas | Usuario inexistente o contraseña errada | Verifica mayúsculas; pide al admin verificar tu cuenta |
| Entro pero no veo ningún menú | Tu rol no tiene `MENU_JSON` configurado en BD | Avisa al admin para configurar el menú de tu rol |
| Entro y me devuelve al login | Sesión expirada o usuario sin datos | Vuelve a ingresar; si persiste, limpia caché del navegador |
| **No puedo cerrar sesión** | Tienes requerimientos sin sincronizar | Ve a **Parámetros → Sincronizar** y reintenta |
| Entro a una pantalla y me rebota al dashboard | Tu rol no tiene permiso para esa ruta | Es normal: cada rol ve solo sus módulos |

## Requerimientos

| Problema | Causa | Solución |
|---|---|---|
| "Falta configurar" al abrir Requerimientos | No sincronizaste las maestras | **Parámetros → Sincronizar** primero |
| Creé un requerimiento y no aparece en el sistema | Quedó guardado local sin sincronizar | Sincroniza desde Parámetros con conexión |
| Mi requerimiento no avanza | Falta aprobación del jefe de área | Consulta su estado; el APLOGIST de tu área debe aprobarlo |
| No encuentro un ítem al crear | Maestra desactualizada o el ítem no existe | Sincroniza maestras; si falta, pide a admin darlo de alta |
| Trabajé offline, ¿se perdió algo? | No — se guardó en la base local | Sincroniza al recuperar conexión |

## Aprobaciones

| Problema | Causa | Solución |
|---|---|---|
| (APLOGIST) No veo requerimientos | No estás asignado a esa área | Admin → **Usuarios por Área** debe asignarte |
| (FIN/GER/JEM) Una OC no llega a mi bandeja | No fue enviada a aprobación o el flujo no te incluye | Confirma con LOLOGIST; admin revisa el flujo en **Aprobadores** |
| Rechacé algo por error | El documento volvió al origen | El solicitante/originador debe reenviarlo |
| ¿Cómo justifico un rechazo? | — | Siempre escribe el motivo: queda en auditoría y notifica al origen |

## Compras y almacén

| Problema | Causa | Solución |
|---|---|---|
| Una línea aprobada no sale para consolidar | Estado o filtro incorrecto | Verifica en Consolidación que esté aprobada y sin OC previa |
| No puedo emitir la OC | Falta cotización ganadora o datos | Completa cotizaciones y selecciona ganadora |
| No hay stock para despachar | Recepción pendiente o saldo real en 0 | Revisa Recepción de Mercadería y Kardex |
| La cantidad a recepcionar supera la OC | Límite de incremento configurado | Admin ajusta en **Incremento Cantidad OC** de la consola |

## Notificaciones

| Problema | Solución |
|---|---|
| El contador no se actualiza | Se refresca cada 30 s; fuerza con F5 |
| Sale un aviso de "saldos pendientes" | Hay requerimientos aprobados sin consolidar — revísalos en Notificaciones |

## Consolas de administración

| Problema | Solución |
|---|---|
| `/administracion` me pide login | Necesitas entrar por `/admin-login` primero (genera token) |
| No veo una pestaña en `/admin-logistica` | Tu rol no tiene la clave `ADMINLG_MENU_*` — un admin la habilita en **Permisos por Rol** |
| Cambié permisos y el usuario no ve el cambio | Debe recargar la página o reingresar |
| JLOLOGIST no ve pestañas de configuración | Por defecto solo ve operativas; habilítalas con permisos |

## Comportamientos conocidos (no son errores)

- **EMLOGIST** puede abrir a una pantalla sin menú si su rol no tiene config en BD — el admin debe asignarle `MENU_JSON`.
- **GERENTE** no tiene pantalla inicial fija — depende del menú configurado.
- Un usuario con **varios roles** (ej. `LOLOGIST,ALLOGIST`) entra al dashboard del primer rol que coincide en la regla de redirect.
- **Reporte Logístico, Reporte Requerimientos y Catálogo** no tienen restricción: cualquier usuario autenticado puede verlos.

## Si nada funciona

1. Verifica tu conexión a internet.
2. F5 / Ctrl+F5 (recarga forzada).
3. Sincroniza pendientes, cierra sesión y vuelve a entrar.
4. Escala a soporte TI indicando: **tu usuario, rol, pantalla y captura del error**.
