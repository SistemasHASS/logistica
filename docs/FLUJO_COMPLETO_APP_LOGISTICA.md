# Flujo Completo del App Logistica

Fecha de referencia: 2026-09-14

## 1. Resumen general

El sistema Logistica cubre el ciclo operativo desde la creacion de un requerimiento hasta su atencion, compra, recepcion, despacho, conformidad, kardex y reportes.

El flujo completo se divide en cinco grandes caminos:

1. Requerimientos de items/activos/commodities.
2. Aprobaciones por area o por rol.
3. Consolidacion y compras.
4. Servicios y ordenes de servicio.
5. Almacen, recepcion, despacho e inventario.

## 2. Actores

| Actor/Rol | Responsabilidad |
|---|---|
| Operativo (`OPLOGIST`) | Crea requerimientos y consulta sus estados |
| Empaque (`EMLOGIST`) | Crea/gestiona requerimientos vinculados a empaque |
| Aprobador (`APLOGIST`) | Aprueba/rechaza requerimientos por area |
| Jefatura logistica (`JLOLOGIST`) | Supervisa, consolida y aprueba segun flujo |
| Logistica (`LOLOGIST`) | Gestiona solicitudes, consolidaciones, cotizaciones y ordenes |
| Almacen (`ALLOGIST`) | Despacha, recepciona, mueve kardex e inventario |
| Finanzas (`FINANZA`) | Aprueba o revisa OC segun flujo |
| Administrador logistico (`ADLOGIST`) | Configura usuarios, areas, flujos, menus y parametros |
| Sistemas (`TILOGIST`) | Administra configuracion tecnica y soporte |

## 3. Flujo tecnico base

```text
Usuario
  -> Frontend Angular
  -> Servicio Angular
  -> API Logistica
  -> Controller
  -> UseCase
  -> Repository
  -> Stored Procedure / SQL Server
  -> Respuesta JSON
  -> Pantalla actualizada
```

## 4. Login y carga inicial

1. El usuario ingresa credenciales en el login.
2. El frontend llama al API Maestra:

```text
POST {apiMaestra}/api/Maestros/get-usuarios
```

3. Si el usuario es valido, se guarda en IndexedDB.
4. Se consulta el area del usuario cuando aplica.
5. El layout carga configuracion de menu por rol.
6. El sistema redirige al dashboard correspondiente.
7. El contador de notificaciones empieza a actualizarse cada 30 segundos.

## 5. Creacion de requerimientos

Pantalla principal:

```text
/main/requerimientos
```

Tipos manejados:

- Items.
- Commodity/servicio.
- Activo fijo.
- Activo menor.
- Transferencia.
- Consumo.

Flujo:

1. Solicitante crea el requerimiento.
2. El frontend valida datos requeridos y puede usar maestras locales.
3. Si el flujo trabaja offline o con almacenamiento temporal, el requerimiento queda en IndexedDB hasta sincronizar.
4. Al sincronizar, el API registra el requerimiento en SQL Server.
5. Se asignan aprobadores segun area, rol o configuracion.
6. El requerimiento queda pendiente de aprobacion.

Endpoints frecuentes:

```text
POST /api/logistica/crear-requerimiento-commodity
POST /api/logistica/crear-requerimiento-activo-fijo
POST /api/logistica/crear-requerimiento-activo-fijo-menor
POST /api/logistica/registrar-requerimiento
POST /api/logistica/asignar-aprobadores-requerimiento
```

## 6. Aprobacion de requerimientos

Pantallas:

```text
/main/aprobaciones
/main/aprobaciones-area
/main/dashboard-aprobaciones-area
/main/reporte-aprobaciones-area
```

Flujo:

1. El aprobador entra a su dashboard o bandeja.
2. El sistema lista pendientes filtrados por usuario, documento, area, rol y/o empresa.
3. El aprobador revisa detalle y adjuntos.
4. Puede aprobar o rechazar.
5. Si hay varios niveles, el requerimiento avanza al siguiente aprobador.
6. Si se completa el flujo, queda disponible para logistica/consolidacion.
7. Si se rechaza, queda con estado rechazado y observacion.

Endpoints frecuentes:

```text
POST /api/logistica/requerimientos-pendientes-area
POST /api/logistica/requerimientos-pendientes-area-detalle
POST /api/logistica/aprobar-requerimiento-area
POST /api/logistica/historial-aprobaciones-area
POST /api/logistica/listar-requerimientos-pendientes-aprobacion
POST /api/logistica/aprobar-rechazar-requerimiento
```

## 7. Consolidacion de compras

Pantallas:

```text
/main/consolidacion-requerimientos
/main/consolidacion-compras
/main/consolidacion-compra
/main/consolidacion-corporativa
```

Flujo:

1. Logistica lista requerimientos aprobados o pendientes de consolidacion.
2. Selecciona lineas por empresa, tipo, almacen, item u otros filtros.
3. Crea una consolidacion.
4. La consolidacion agrupa lineas para cotizar o generar OC.
5. Puede anular lineas o la consolidacion completa si corresponde.
6. Para compra multiempresa, se pueden crear cotizaciones OC y congelar lineas.

Endpoints frecuentes:

```text
POST /api/consolidacion/listar-items-pendientes-consolidacion
POST /api/consolidacion/listar-commodities-pendientes-consolidacion
POST /api/consolidacion/crear-consolidacion
POST /api/consolidacion/obtener-consolidacion
POST /api/consolidacion/listar-historial-consolidaciones
POST /api/consolidacion/anular-consolidacion
POST /api/consolidacion/anular-linea-consolidacion
POST /api/consolidacion/crear-cotizacion-oc
POST /api/consolidacion/guardar-precios-cotizacion-oc
```

## 8. Cotizaciones y seleccion de proveedor

Pantallas:

```text
/main/cotizaciones
/main/evaluacion-proveedores
/main/maestro-proveedores
```

Flujo:

1. Desde una consolidacion se genera una solicitud de cotizacion.
2. Se registran cotizaciones de proveedores.
3. El sistema compara precios, condiciones, moneda y datos del proveedor.
4. Logistica selecciona la cotizacion ganadora.
5. Las cotizaciones no seleccionadas quedan rechazadas o cerradas segun regla.
6. Con la seleccion se puede generar OC.

Endpoints frecuentes:

```text
POST /api/consolidacion/generar-solicitud-cotizacion
POST /api/consolidacion/listar-solicitudes-cotizacion
POST /api/consolidacion/cerrar-cotizacion-oc
POST /api/logistica/listar-proveedores
POST /api/logistica/registrar-proveedor
```

## 9. Solicitud de compra y orden de compra

Pantallas:

```text
/main/solicitudes-compra
/main/ordenes-compra
/main/aprobaciones-oc
/main/dashboard-finanzas
```

Flujo:

1. Se crea una solicitud de compra desde requerimiento/consolidacion o de forma directa.
2. La solicitud puede pasar por aprobacion SC.
3. Aprobada la solicitud, se genera una OC.
4. La OC puede quedar en borrador, pendiente, aprobada, rechazada o anulada.
5. La OC se envia a aprobacion segun flujo configurado.
6. Cuando se aprueba, se sincroniza con Spring/ERP.
7. Si falla la sincronizacion, se puede reintentar desde los endpoints/modulos correspondientes.

Endpoints frecuentes:

```text
POST /api/logistica/solicitud-compra/crear
POST /api/logistica/solicitud-compra/listar
POST /api/logistica/solicitud-compra/guardar-adjunto
POST /api/logistica/aprobacion-sc/listar-pendientes
POST /api/logistica/aprobacion-sc/aprobar
POST /api/logistica/orden-compra/generar-desde-solicitud
POST /api/logistica/orden-compra/listar
POST /api/logistica/orden-compra/sincronizar
POST /api/logistica/aprobacion-oc/aprobar-rechazar
```

## 10. Recepcion de mercaderia y kardex

Pantallas:

```text
/main/recepcion-mercaderia
/main/kardex
/main/gestion-inventario
```

Flujo:

1. Almacen lista OCs disponibles para recepcion.
2. Registra recepcion parcial o total.
3. El sistema valida cantidades y datos.
4. Se registra la recepcion.
5. Se ingresa el movimiento al kardex.
6. El inventario queda actualizado.
7. Los dashboards y reportes consumen la informacion resultante.

Endpoints frecuentes:

```text
POST /api/logistica/recepcion-oc/listar-ocs-para-recepcion
POST /api/logistica/recepcion-oc/registrar
POST /api/logistica/recepcion-oc/validar
POST /api/logistica/recepcion-oc/ingresar-kardex
POST /api/logistica/recepcion-oc/listar
```

## 11. Despacho, saldos y notificaciones

Pantallas:

```text
/main/despachos
/main/notificaciones
/main/reporte-despachos
/main/reporte-saldos
```

Flujo:

1. Almacen atiende requerimientos aprobados.
2. Si hay stock suficiente, despacha completo.
3. Si hay atencion parcial, se genera saldo pendiente.
4. El saldo puede ir a aprobacion o consolidacion segun configuracion.
5. Se notifican saldos disponibles o pendientes.
6. El solicitante/logistica revisa notificaciones.

Endpoints frecuentes:

```text
POST /api/logistica/listar-despachos
POST /api/logistica/registrar-despacho
POST /api/consolidacion/registrar-saldo-pendiente-aprobacion
POST /api/consolidacion/listar-saldos-pendientes-aprobacion
POST /api/consolidacion/aprobar-rechazar-saldo-pendiente
POST /api/logistica/listar-mis-notificaciones
POST /api/logistica/notificar-stock-disponible
```

## 12. Servicios y ordenes de servicio

Pantallas:

```text
/main/solicitudes-servicio
/main/consolidacion-servicios
/main/ordenes-servicio
/main/aprobaciones-os
/main/conformidad-servicios
```

Flujo:

1. Se registra una solicitud de servicio.
2. Se envia a aprobacion si aplica.
3. Logistica genera cotizacion u orden de servicio.
4. La OS pasa por aprobacion.
5. Se sincroniza o registra en sistema externo cuando aplica.
6. El responsable registra conformidad del servicio.
7. El seguimiento queda disponible en reportes y dashboards.

Endpoints frecuentes:

```text
POST /api/logistica/solicitud-servicio/guardar
POST /api/logistica/solicitud-servicio/enviar
POST /api/logistica/orden-servicio/generar
POST /api/logistica/orden-servicio/cotizacion/guardar
POST /api/logistica/orden-servicio/cotizacion/seleccionar
POST /api/logistica/aprobacion-os/aprobar-rechazar
POST /api/logistica/orden-servicio/registrar-conformidad
```

## 13. Devoluciones, reingresos y transferencias

Pantallas:

```text
/main/devoluciones-proveedores
/main/devoluciones-consumo
/main/reingresos
/main/transferencias-almacen
```

Flujo:

1. Se identifica el movimiento a devolver, consumir, reingresar o transferir.
2. El usuario registra la operacion.
3. Si requiere aprobacion, queda en pendiente.
4. Aprobada la operacion, se impacta inventario/kardex.
5. La trazabilidad queda en historial y reportes.

## 14. Administracion del sistema

Rutas:

```text
/admin-login
/admin-logistica
/administracion
```

Funciones:

- Usuarios logisticos.
- Usuarios por area.
- Areas y subareas.
- Roles.
- Permisos por rol.
- Menu dinamico.
- Flujos de aprobacion.
- Configuracion SMTP.
- Plantillas de correo.
- Plantillas PDF.
- Branding.
- Parametros.
- Incrementos OC.
- Auditoria.
- Control de version.

## 15. Estado final de cada ciclo

| Ciclo | Estado final esperado |
|---|---|
| Requerimiento con stock | Despachado / completado |
| Requerimiento sin stock | Saldo pendiente, consolidado o comprado |
| Compra | OC aprobada, sincronizada y recepcionada |
| Servicio | OS aprobada y con conformidad |
| Recepcion | Kardex actualizado |
| Devolucion/reingreso | Inventario actualizado |
| Transferencia | Stock movido entre almacenes |

## 16. Puntos criticos

- El usuario debe tener rol correcto y, cuando aplica, area asignada.
- El menu debe estar alineado con los permisos del rol.
- Los SPs son parte central de la logica; un cambio de SQL puede afectar pantallas.
- La sincronizacion con Spring/ERP puede dejar registros en estado pendiente si falla.
- El cierre de sesion se bloquea si hay requerimientos locales sin sincronizar.
- Las URLs deben venir del environment; evitar endpoints hardcodeados.
