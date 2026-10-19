# Mapa de Modulos del Frontend Logistica

Fecha de referencia: 2026-09-14  
Proyecto: `logistica`

## 1. Proposito

Este documento sirve como mapa rapido para ubicar pantallas, rutas, servicios y responsabilidades del frontend Angular.

## 2. Entrada de la aplicacion

Archivos principales:

```text
src/main.ts
src/app/app.config.ts
src/app/app.component.ts
src/app/app.routes.ts
```

La navegacion principal se define en `src/app/app.routes.ts`. La ruta `/main` carga el layout operativo y sus pantallas hijas.

## 3. Modulo de autenticacion

Carpeta:

```text
src/app/modules/auth
```

Responsabilidades:

- Login del usuario normal.
- Validacion contra API Maestra.
- Guards por rol.
- Redireccion a pantallas protegidas.

Archivos clave:

```text
services/auth.service.ts
pages/login/login.component.ts
guard/auth.guard.ts
guard/admin.guard.ts
guard/administrador.guard.ts
guard/almacen.guard.ts
guard/aprobador.guard.ts
guard/aprobador-oc.guard.ts
guard/logistico.guard.ts
guard/operativo-empaque.guard.ts
guard/operativo-logistico.guard.ts
```

## 4. Layout principal

Carpeta:

```text
src/app/modules/main/pages/layout
```

Responsabilidades:

- Renderizar menu lateral.
- Cargar usuario desde IndexedDB.
- Cargar menu dinamico por rol.
- Abrir/cerrar grupos del menu.
- Mostrar titulo de pantalla.
- Consultar notificaciones cada 30 segundos.
- Redirigir a dashboard inicial por rol.
- Controlar cierre de sesion.

Componentes relacionados:

```text
layout.component.ts
components/dynamic-menu/dynamic-menu.component.ts
```

Servicios relacionados:

```text
src/app/modules/main/services/layout-config.service.ts
src/app/shared/services/notificacion-api.service.ts
src/app/shared/dixiedb/dexie-db.service.ts
```

## 5. Persistencia local

Servicio:

```text
src/app/shared/dixiedb/dexie-db.service.ts
```

Base local:

```text
Nombre: Logistica
Version: 44
Motor: IndexedDB mediante Dexie
```

Tablas principales:

```text
usuario
configuracion
empresas
fundos
almacenes
almacenesDestino
areas
cultivos
proyectos
turnos
acopios
cecos
labores
clasificaciones
itemComoditys
detalles
requerimientos
requerimientosCommodity
requerimientosActivoFijo
requerimientosActivoFijoMenor
maestroItems
maestroCommoditys
maestroSubCommoditys
solicitudesCompra
detalleSolicitudCompra
solicitudCompraAdjuntos
solicitudesServicio
solicitudServicioAdjuntos
cotizaciones
detalleCotizacion
ordenesCompra
detalleOrdenCompra
stock
movimientosStock
listasStock
detalleListaStock
despachos
detalleDespachos
recepcionesOrdenCompra
detalleRecepciones
devolucionesProveedor
detalleDevoluciones
evaluacionesProveedor
criteriosEvaluacion
itemsTemporales
solicitudesCotizacion
detalleSolicitudCotizacion
unidadesMedida
```

Uso importante:

- Guardar sesion.
- Cachear maestras.
- Guardar requerimientos locales.
- Mantener pendientes antes de sincronizar.
- Bloquear cierre de sesion si hay pendientes no sincronizados.

## 6. Modulos funcionales bajo `/main`

### Requerimientos

Ruta:

```text
/main/requerimientos
```

Carpeta:

```text
src/app/modules/main/pages/requerimientos
```

Servicios internos:

```text
services/requerimientos-sync.service.ts
services/requerimientos-maestras.service.ts
services/requerimientos-item.service.ts
services/requerimientos-commodity.service.ts
services/requerimientos-activo-fijo.service.ts
services/requerimientos-activo-menor.service.ts
```

Responsabilidad: crear requerimientos de items, commodities, activos fijos y activos menores; manejar sincronizacion y validaciones.

### Aprobaciones

Rutas:

```text
/main/aprobaciones
/main/aprobaciones-area
/main/aprobaciones-oc
/main/aprobaciones-os
/main/dashboard-aprobaciones-area
/main/reporte-aprobaciones-area
```

Servicios:

```text
src/app/modules/main/services/aprobaciones.service.ts
src/app/modules/main/services/aprobaciones-area.service.ts
src/app/services/aprobacion-sc.service.ts
src/app/services/aprobacion-oc.service.ts
src/app/services/aprobacion-os.service.ts
src/app/services/aprobacion-orden.service.ts
```

Responsabilidad: listar pendientes, mostrar detalle, aprobar/rechazar, consultar historiales y contadores.

### Compras y consolidacion

Rutas:

```text
/main/solicitudes-compra
/main/consolidacion-requerimientos
/main/consolidacion-compras
/main/consolidacion-compra
/main/consolidacion-corporativa
/main/cotizaciones
/main/ordenes-compra
```

Servicios:

```text
src/app/services/solicitud-compra.service.ts
src/app/services/consolidacion.service.ts
src/app/services/orden-compra.service.ts
src/app/modules/main/services/cotizaciones.service.ts
src/app/modules/main/pages/consolidacion-compras/orden-pdf.service.ts
```

Responsabilidad: consolidar lineas aprobadas, cotizar, crear solicitudes/OC, manejar adjuntos, generar PDF y sincronizar.

### Servicios y OS

Rutas:

```text
/main/solicitudes-servicio
/main/consolidacion-servicios
/main/ordenes-servicio
/main/conformidad-servicios
```

Servicios:

```text
src/app/services/solicitud-servicio.service.ts
src/app/services/solicitud-servicio-local.service.ts
src/app/services/solicitud-servicio-remote.service.ts
src/app/services/orden-servicio.service.ts
src/app/services/seguimiento-os.service.ts
src/app/modules/main/pages/conformidad-servicios/conformidad-servicios.service.ts
```

Responsabilidad: solicitudes, cotizaciones, ordenes de servicio, seguimiento, aprobacion y conformidad.

### Almacen e inventario

Rutas:

```text
/main/despachos
/main/recepcion-mercaderia
/main/conformidad-almacen
/main/kardex
/main/gestion-inventario
/main/listas-stock
/main/devoluciones-proveedores
/main/devoluciones-consumo
/main/reingresos
/main/transferencias-almacen
```

Servicios:

```text
src/app/services/recepcion-oc.service.ts
src/app/services/kardex.service.ts
src/app/modules/main/services/despachos.service.ts
src/app/modules/main/services/gestion-inventario.service.ts
src/app/modules/main/services/listas-stock.service.ts
src/app/modules/main/services/devolucion-proveedor.service.ts
src/app/modules/main/services/devolucion-consumo.service.ts
src/app/modules/main/services/reingreso.service.ts
src/app/modules/main/services/transferencia.service.ts
src/app/modules/main/pages/conformidad-almacen/conformidad-almacen.service.ts
```

Responsabilidad: despacho, saldos, recepcion OC, movimientos kardex, stock, devoluciones, reingresos y transferencias.

### Maestros y catalogos

Rutas:

```text
/main/maestros
/main/maestros/items
/main/maestros/comodities
/main/maestro-proveedores
/main/catalogo-items
```

Servicios:

```text
src/app/modules/main/services/items.service.ts
src/app/modules/main/services/commoditys.service.ts
src/app/modules/main/services/unidades-medida.service.ts
src/app/modules/main/services/maestras.service.ts
```

Responsabilidad: mantenimiento/consulta de items, commodities, proveedores y unidades.

### Dashboards y reportes

Rutas:

```text
/main/dashboard-logistica
/main/dashboard-oplogist
/main/dashboard-compras
/main/dashboard-jlologist
/main/dashboard-jemlogist
/main/dashboard-adlogist
/main/dashboard-tilogist
/main/dashboard-despacho
/main/dashboard-finanzas
/main/reportes-compras
/main/reporte-requerimientos
/main/reporte-despachos
/main/reporte-saldos
/main/reporte-aprobados
/main/reporte_logistico
```

Responsabilidad: consulta y visualizacion de indicadores, requerimientos, saldos, aprobaciones, compras y almacen.

## 7. Administracion clasica

Ruta base:

```text
/administracion
```

Archivo de rutas:

```text
src/app/modules/main/pages/administracion/admin-routing.module.ts
```

Rutas internas:

```text
dashboard
admin-usuarios
admin-roles
admin-areas
admin-perfiles
admin-flujos
admin-aprobadores
usuarios-por-area
admin-version-api
admin-proveedores-email
admin-config-smtp
admin-plantilla-correo
admin-plantilla-pdf
configuracion-colores
admin-permisos-roles
admin-menus-layout
admin-menus-dinamicos
admin-empresas
admin-permisos-menu-dinamico
admin-plantillas-menu
admin-plantilla-almacen
admin-config-branding
admin-sincronizacion
```

Responsabilidad: administracion historica de usuarios, roles, areas, flujos, aprobadores, permisos, menus, plantillas, branding y sincronizacion.

## 8. Admin Logistica nuevo

Ruta base:

```text
/admin-logistica
```

Archivo:

```text
src/app/modules/admin-logistica/admin-logistica.routes.ts
```

Rutas internas:

```text
login
dashboard
bandeja
aprobar-consumo
aprobar-sc
aprobar-ss
maestros
proveedores
usuarios
pdf
empresa
parametros
incremento-oc
aprobadores
auditoria
areas
usuario-area
flujo-aprobacion-area
almacen
conformidad-servicio
permisos-rol
migracion-adjuntos
```

Responsabilidad: consola administrativa mas enfocada en administracion logistica, aprobaciones y configuracion multiempresa.

## 9. Integraciones HTTP

La mayoria de servicios consumen:

```text
environment.baseUrl
```

para API Logistica.

El login normal consume:

```text
environment.apiMaestra
```

para API Maestra.

Recomendacion: cualquier servicio nuevo debe inyectar `HttpClient` y construir URLs desde `environment`, no con URLs fijas.

## 10. Build

Configuracion en:

```text
angular.json
```

Salida:

```text
dist/logistica
```

Configuraciones:

```text
production
development
prod-api
```

`prod-api` reemplaza:

```text
src/environments/environment.ts
```

por:

```text
src/environments/environment.prod-api.ts
```

## 11. Recomendaciones al agregar pantallas

1. Crear componente en la carpeta funcional correcta.
2. Registrar ruta en `app.routes.ts` o en el modulo lazy correspondiente.
3. Asignar guard correcto.
4. Agregar opcion al menu dinamico o legacy.
5. Crear servicio si la pantalla consume API.
6. Usar `environment.baseUrl`.
7. Revisar permisos backend si corresponde.
8. Actualizar documentacion si cambia el flujo.
