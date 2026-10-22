# Glosario — Sistema Logística

Términos usados en la aplicación, manuales y videos.

---

## Documentos del proceso

| Término | Significado |
|---|---|
| **Requerimiento (Req.)** | Solicitud de material/servicio creada por el usuario. Punto de partida de todo el flujo |
| **SC — Solicitud de Compra** | Documento interno que agrupa lo aprobado para comprar. Previa a la cotización/OC |
| **SS — Solicitud de Servicio** | Igual que la SC pero para servicios |
| **OC — Orden de Compra** | Documento formal emitido al proveedor tras cotización y aprobaciones |
| **OS — Orden de Servicio** | Documento formal para contratar un servicio |
| **Cotización** | Oferta registrada de un proveedor; se comparan y se elige ganadora |
| **Consolidación** | Agrupar líneas de varios requerimientos aprobados en una sola compra |
| **Consolidación Corporativa** | Consolidación entre varias empresas del grupo para mejorar precio |
| **Despacho** | Salida física de material del almacén hacia el solicitante |
| **Recepción** | Ingreso físico de mercadería de una OC al almacén |
| **Conformidad** | Confirmación del receptor de que recibió bien el material o servicio |
| **Devolución de consumo** | Material que el usuario devuelve porque no lo usó |
| **Devolución a proveedor** | Material que almacén devuelve al proveedor (fallas/exceso) |
| **Reingreso** | Material que retorna al stock del almacén (requiere aprobación del jefe de área) |
| **Transferencia** | Movimiento de stock entre dos almacenes |

## Catálogos y maestras

| Término | Significado |
|---|---|
| **Ítem** | Producto/material individual que se solicita o almacena |
| **Commodity** | Tipo de requerimiento asociado a labores/servicios de campo |
| **Activo fijo** | Bien de capital (maquinaria, equipos) |
| **Activo menor** | Bien de bajo valor (herramientas menores) |
| **Maestras** | Datos base descargados al equipo: ítems, almacenes, áreas, centros de costo, labores, unidades |
| **Ceco** | Centro de costo — unidad que asume el gasto |
| **Labor** | Actividad agrícola/operativa a la que se imputa el consumo |
| **Fundo** | Unidad agrícola/campo de la empresa |
| **Almacén destino** | Almacén que recibirá o atenderá el requerimiento |
| **Lista de stock** | Lista predefinida de ítems para despachos frecuentes |

## Estados y control

| Término | Significado |
|---|---|
| **Pendiente** | Documento creado/esperando acción del siguiente nivel |
| **Aprobado / Rechazado** | Resultado de la revisión en cada nivel |
| **Saldo de requerimiento** | Cantidad de un requerimiento aún no atendida |
| **Saldos pendientes** | Aprobados sin consolidar — generan notificación |
| **Kardex** | Historial de movimientos de cada ítem (entradas, salidas, saldos) |
| **Sincronizar** | Enviar datos locales al servidor y bajar maestras actualizadas |
| **Auditoría** | Registro de quién hizo qué y cuándo |

## Roles y accesos

| Término | Significado |
|---|---|
| **idrol** | Código del rol del usuario (OPLOGIST, ALLOGIST, etc.) |
| **Rol múltiple** | Varios roles en un usuario, separados por coma: `LOLOGIST,ALLOGIST` |
| **Guard** | Regla que decide si tu rol puede entrar a una pantalla |
| **MENU_JSON** | Configuración en BD que define el menú lateral de un rol |
| **ADMINLG_*** | Claves de permiso para las pestañas de la consola admin |
| **Admin clásica** | Módulo `/administracion` — configuración histórica (correo, branding, menús) |
| **Consola admin** | `/admin-logistica` — administración logística y aprobaciones |
| **Aprobador** | Usuario que valida un documento en un nivel del flujo |
| **Flujo de aprobación** | Secuencia de niveles que debe pasar un documento |
| **Bandeja** | Lista de documentos pendientes de tu acción |

## Técnicos (frecuentes en soporte)

| Término | Significado |
|---|---|
| **IndexedDB / Dexie** | Base de datos local del navegador donde se guarda tu sesión y pendientes |
| **API Maestra** | Servicio central de usuarios (login) |
| **API Logística** | Servicio del módulo (`baseUrl`) |
| **Offline-first** | Diseño que permite trabajar sin internet y sincronizar después |
| **ADMIN_TOKEN** | Token que habilita el módulo `/administracion` tras `/admin-login` |
