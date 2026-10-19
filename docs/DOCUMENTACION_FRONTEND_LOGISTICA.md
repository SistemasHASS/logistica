# Documentacion General del Frontend Logistica

Fecha de referencia: 2026-09-14  
Proyecto: `logistica`  
Framework: Angular 20.3.6  
UI: PrimeNG 20.3.0, Bootstrap 5.3.3  
Version declarada: 4.2.0

## 1. Objetivo

El frontend `logistica` es la aplicacion web usada por solicitantes, logistica, almacen, aprobadores, jefaturas, finanzas y administradores para operar el ciclo logistico completo: requerimientos, aprobaciones, consolidacion, compras, servicios, recepcion, despachos, kardex, reportes y administracion.

## 2. Tecnologias

Dependencias principales:

- Angular 20.
- Angular Router.
- RxJS.
- PrimeNG.
- Bootstrap.
- Dexie para IndexedDB local.
- SweetAlert2 para modales y alertas.
- ExcelJS, `xlsx` y `xlsx-js-style` para exportaciones/cargas Excel.
- jsPDF, jsPDF AutoTable y pdfmake para documentos PDF.
- Chart.js y ApexCharts para dashboards.
- Service Worker Angular para soporte PWA.

Scripts relevantes:

```powershell
npm start           # actualiza version y levanta ng serve
npm run dev         # ng serve en configuracion development
npm run build       # build productivo y registra deployment
npm run build:dev   # build development
npm run build:prod-api
npm run docs
npm run docs:backend
npm run docs:all
npm run deploy
```

## 3. Configuracion de entorno

Archivos:

```text
src/environments/environment.ts
src/environments/environment.prod.ts
src/environments/environment.prod-api.ts
src/environments/environment.dev.ts
```

Configuracion observada:

```ts
production: false | true
appVersion: '4.2.0'
updateMode: 'AUTO'
showUpdateModal: true
versionControlApi: 'MAESTRA'
baseUrl: 'https://apilogistica.agroapps.net:7018'
apiMaestra: 'https://apimaestra.agroapps.net:7003'
```

Uso:

- `baseUrl`: API Logistica.
- `apiMaestra`: autenticacion y consulta de usuarios maestros.
- `versionControlApi`: decide contra que API se consulta el control de version.
- `updateMode`: controla comportamiento de actualizacion de app.

## 4. Estructura del proyecto

```text
src/
  app/
    app.routes.ts                       Rutas principales
    modules/
      auth/                             Login y guards
      main/
        pages/                          Pantallas funcionales
        services/                       Servicios de negocio del modulo main
        guards/                         Guards especificos
      admin-login/                      Login administrativo
      admin-logistica/                  Consola admin logistica nueva
    services/                           Servicios globales
    shared/
      components/                       Componentes compartidos
      services/                         Servicios compartidos
      dixiedb/                          Persistencia local IndexedDB
      interfaces/                       Interfaces compartidas
      pipes/                            Pipes reutilizables
  assets/                               Imagenes, estilos, libs estaticas
  environments/                         Entornos
docs/                                   Documentacion
scripts/                                Automatizacion build/deploy/docs/version
database/                               Scripts SQL del frontend/proyecto
```

## 5. Rutas principales

Archivo central: `src/app/app.routes.ts`.

Rutas raiz:

```text
/auth/login
/admin-login
/administracion
/admin-logistica
/main
/404
```

Rutas bajo `/main`:

| Ruta | Funcion | Guard principal |
|---|---|---|
| `/main/maestros` | Items y commodities | Administrador |
| `/main/parametros` | Parametros de operacion | Operativo/Empaque |
| `/main/requerimientos` | Creacion de requerimientos | Operativo/Empaque + Config |
| `/main/notificaciones` | Notificaciones del usuario | Operativo/Empaque |
| `/main/solicitudes-compra` | Solicitudes de compra | Logistico |
| `/main/dashboard-logistica` | Dashboard logistico | Logistico |
| `/main/dashboard-oplogist` | Dashboard operativo | Operativo logistico |
| `/main/dashboard-compras` | Dashboard compras | Logistico |
| `/main/dashboard-jlologist` | Dashboard jefatura logistica | Logistico |
| `/main/dashboard-adlogist` | Dashboard admin logistica | Administrador |
| `/main/dashboard-tilogist` | Dashboard sistema | Administrador |
| `/main/dashboard-despacho` | Dashboard almacen/despacho | Almacen |
| `/main/dashboard-finanzas` | Dashboard finanzas | Aprobador OC |
| `/main/dashboard-aprobaciones-area` | Panel aprobadores por area | Aprobador |
| `/main/cotizaciones` | Cotizaciones | Logistico |
| `/main/ordenes-compra` | Ordenes de compra | Logistico |
| `/main/recepcion-mercaderia` | Recepcion OC | Almacen |
| `/main/conformidad-almacen` | Conformidad de despacho | Devolucion consumo |
| `/main/devoluciones-proveedores` | Devoluciones a proveedor | Almacen |
| `/main/devoluciones-consumo` | Devoluciones consumo | Devolucion consumo |
| `/main/reingresos` | Reingresos | Reingreso |
| `/main/reportes-compras` | Reportes de compras | Logistico |
| `/main/gestion-inventario` | Inventario | Almacen |
| `/main/kardex` | Kardex | Almacen |
| `/main/aprobaciones` | Aprobacion general | Aprobador |
| `/main/aprobaciones-oc` | Aprobacion OC | Aprobador OC |
| `/main/aprobaciones-os` | Aprobacion OS | Aprobador OC |
| `/main/solicitudes-servicio` | Solicitudes de servicio | Logistico |
| `/main/ordenes-servicio` | Ordenes de servicio | Logistico |
| `/main/aprobaciones-area` | Aprobacion por area | Aprobador |
| `/main/reporte-aprobaciones-area` | Reporte aprobaciones area | Aprobador |
| `/main/listas-stock` | Configuracion stock | Almacen |
| `/main/despachos` | Despachos | Almacen |
| `/main/transferencias-almacen` | Transferencias | Almacen |
| `/main/consolidacion-requerimientos` | Consolidacion de requerimientos | Logistico |
| `/main/consolidacion-compras` | Flujo compras | Logistico |
| `/main/consolidacion-compra` | Flujo compras alterno/nuevo | Logistico |
| `/main/consolidacion-servicios` | Flujo servicios | Logistico |
| `/main/conformidad-servicios` | Conformidad servicios | Conformidad servicios |
| `/main/consolidacion-corporativa` | Consolidacion corporativa | Logistico |
| `/main/catalogo-items` | Consulta catalogo items | Sin guard especifico |

## 6. Autenticacion y sesion

Servicio: `src/app/modules/auth/services/auth.service.ts`.

El login de usuario normal llama:

```text
POST {apiMaestra}/api/Maestros/get-usuarios
```

Payload usado:

```json
[
  {
    "usuario": "USUARIO",
    "clave": "CLAVE",
    "aplicacion": "LOGISTICA"
  }
]
```

Luego el usuario se guarda en IndexedDB mediante `DexieService`. El sistema consulta el usuario logueado desde IndexedDB para:

- Saber si hay sesion.
- Obtener rol.
- Evaluar guards.
- Mostrar menu.
- Cargar area del usuario.

El servicio tambien intenta cargar el area del usuario con:

```text
POST {baseUrl}/api/logistica/obtener-area-usuario
```

Si el rol es `APLOGIST`, la aplicacion redirige a:

- `/main/aprobaciones-area` cuando tiene area asignada.
- `/main/aprobaciones` cuando no tiene area.

## 7. Roles y permisos

Roles usados por el frontend:

| Rol | Uso principal |
|---|---|
| `TILOGIST` | Administrador de sistema |
| `ADLOGIST` | Administrador logistico |
| `JLOLOGIST` | Jefatura logistica |
| `JEMLOGIST` | Jefatura empaque |
| `OPLOGIST` | Operativo solicitante |
| `LOLOGIST` | Logistica |
| `ALLOGIST` | Almacen |
| `APLOGIST` | Aprobador |
| `FINANZA` | Finanzas / aprobacion OC |
| `EMLOGIST` | Empaque |

Los guards principales estan en:

```text
src/app/modules/auth/guard/
src/app/modules/main/guards/
```

## 8. Layout y menu

Componente: `src/app/modules/main/pages/layout/layout.component.ts`.

Responsabilidades:

- Leer usuario desde IndexedDB.
- Guardar rol en signal.
- Cargar configuracion de menu dinamico con `LayoutConfigService`.
- Mostrar menu legacy o menu dinamico segun rol/configuracion.
- Mantener acordeones abiertos/cerrados en `localStorage`.
- Actualizar titulo de pantalla segun ruta.
- Cargar contador de notificaciones cada 30 segundos.
- Redirigir al dashboard inicial segun rol.
- Validar pendientes de sincronizacion antes de cerrar sesion.

Dashboards por rol:

```text
TILOGIST  -> /main/dashboard-tilogist
ADLOGIST  -> /main/dashboard-adlogist
JLOLOGIST -> /main/dashboard-logistica
JEMLOGIST -> /main/dashboard-jemlogist
OPLOGIST  -> /main/dashboard-oplogist
LOLOGIST  -> /main/dashboard-logistica
EMLOGIST  -> /main/dashboard-logistica
ALLOGIST  -> /main/despachos
APLOGIST  -> /main/dashboard-aprobaciones-area
FINANZA   -> /main/dashboard-finanzas
```

## 9. Persistencia local

Servicio: `src/app/shared/dixiedb/dexie-db.service.ts`.

Uso principal:

- Guardar usuario logueado.
- Guardar maestras.
- Guardar requerimientos locales.
- Soportar flujos offline/parciales.
- Validar que no existan requerimientos sin sincronizar antes de cerrar sesion.

El cierre de sesion bloquea la salida si existen pendientes locales en:

- `requerimientos`
- `requerimientosCommodity`
- `requerimientosActivoFijo`
- `requerimientosActivoFijoMenor`

## 10. Servicios de negocio principales

Carpeta: `src/app/services`.

Servicios destacados:

- `solicitud-compra.service.ts`
- `orden-compra.service.ts`
- `recepcion-oc.service.ts`
- `aprobacion-sc.service.ts`
- `aprobacion-oc.service.ts`
- `aprobacion-os.service.ts`
- `aprobacion-orden.service.ts`
- `solicitud-servicio.service.ts`
- `orden-servicio.service.ts`
- `seguimiento-os.service.ts`
- `consolidacion.service.ts`
- `kardex.service.ts`
- `listas-stock.service.ts`
- `gestion-inventario.service.ts`
- `tipo-cambio.service.ts`
- `version.service.ts`
- `deployment-tracking.service.ts`

Tambien hay servicios dentro de paginas y modulos cuando la funcionalidad quedo encapsulada en una pantalla especifica.

## 11. Modulos funcionales

### Requerimientos

Pantalla: `/main/requerimientos`.

Permite crear requerimientos de items, commodities/servicios, activos fijos y activos menores. Usa IndexedDB para almacenamiento temporal y sincronizacion.

### Aprobaciones

Pantallas:

```text
/main/aprobaciones
/main/aprobaciones-area
/main/aprobaciones-oc
/main/aprobaciones-os
/main/dashboard-aprobaciones-area
```

Permiten ver pendientes, procesar aprobaciones/rechazos y consultar historiales.

### Compras

Pantallas:

```text
/main/solicitudes-compra
/main/consolidacion-compras
/main/consolidacion-compra
/main/consolidacion-corporativa
/main/cotizaciones
/main/ordenes-compra
```

Cubren la generacion de solicitudes, consolidacion, cotizacion, seleccion de proveedor, OC, aprobacion y sincronizacion.

### Almacen

Pantallas:

```text
/main/despachos
/main/recepcion-mercaderia
/main/kardex
/main/gestion-inventario
/main/listas-stock
/main/conformidad-almacen
/main/devoluciones-proveedores
/main/devoluciones-consumo
/main/reingresos
/main/transferencias-almacen
```

Cubren despacho, recepcion, movimientos de inventario, devoluciones, reingresos y transferencias.

### Servicios

Pantallas:

```text
/main/solicitudes-servicio
/main/consolidacion-servicios
/main/ordenes-servicio
/main/conformidad-servicios
```

Cubren solicitud, cotizacion/orden de servicio, aprobacion, seguimiento y conformidad.

### Administracion

Rutas:

```text
/administracion
/admin-logistica
/admin-login
```

Incluye usuarios, roles, permisos, menus, areas, flujos, SMTP, plantillas, branding, parametros y control de version.

## 12. Notificaciones

Servicios:

```text
src/app/shared/services/notificacion-api.service.ts
src/app/shared/services/notification.service.ts
src/app/shared/services/stock-notification.service.ts
```

El layout consulta contador de no leidas cada 30 segundos. Cuando hay pendientes, muestra un toast con SweetAlert2 e invita al usuario a abrir `/main/notificaciones`.

## 13. Versionamiento y despliegue

La version visible se toma desde:

```text
src/environments/version.ts
src/assets/version.json
```

Scripts:

- `scripts/update-version.js`
- `scripts/generate-version.js`
- `scripts/register-deployment.js`
- `scripts/deploy-full.ps1`
- `scripts/deploy-to-server.ps1`

El build productivo actualiza version y registra despliegue contra el API configurado.

## 14. Recomendaciones de mantenimiento

- Mantener nuevas pantallas registradas en `app.routes.ts` y en el menu dinamico.
- Crear servicios reutilizables bajo `src/app/services` cuando la logica se comparta entre pantallas.
- Evitar URLs hardcodeadas; usar siempre `environment.baseUrl` o `environment.apiMaestra`.
- Mantener sincronizados guards, menu dinamico y permisos del backend.
- Revisar IndexedDB cuando se cambie el modelo de requerimientos.
- Validar cambios de flujo con al menos un usuario por rol critico.
