# Guia Tecnica de Instalacion y Despliegue

Fecha de referencia: 2026-09-14  
Proyectos:

- Frontend: `logistica`
- Backend: `api_logistica`

## 1. Requisitos

Frontend:

- Node.js compatible con Angular 20.
- npm.
- Angular CLI 20.

Backend:

- .NET SDK 8.
- SQL Server accesible.
- Cadena de conexion `DefaultConnection`.

## 2. Estructura local recomendada

```text
10.02.26/
  logistica/      Frontend Angular
  api_logistica/  API .NET
```

## 3. Configurar API

Archivos:

```text
api_logistica/appsettings.json
api_logistica/appsettings.Development.json
api_logistica/Properties/launchSettings.json
```

La cadena de conexion se define con la clave:

```text
ConnectionStrings:DefaultConnection
```

No documentar usuarios ni claves en archivos publicos.

Perfiles locales:

```text
http:  http://localhost:5213
https: https://localhost:7140 y http://localhost:5213
Swagger: /swagger
```

Comandos:

```powershell
cd api_logistica
dotnet restore
dotnet build
dotnet run
```

Verificacion:

```text
http://localhost:5213/swagger
```

## 4. Configurar frontend

Archivos:

```text
logistica/src/environments/environment.ts
logistica/src/environments/environment.dev.ts
logistica/src/environments/environment.prod.ts
logistica/src/environments/environment.prod-api.ts
```

Variables importantes:

```ts
production: false
appVersion: '4.2.0'
updateMode: 'AUTO'
showUpdateModal: true
versionControlApi: 'MAESTRA'
baseUrl: 'https://apilogistica.agroapps.net:7018'
apiMaestra: 'https://apimaestra.agroapps.net:7003'
```

Para desarrollo local contra API local:

```ts
baseUrl: 'http://localhost:5213'
```

Comandos:

```powershell
cd logistica
npm install
npm run dev
```

Por defecto Angular servira en:

```text
http://localhost:4200
```

## 5. Scripts frontend

Archivo:

```text
logistica/package.json
```

Scripts principales:

```text
npm start
npm run dev
npm run build
npm run build:dev
npm run build:prod
npm run build:prod-api
npm run build:no-register
npm run docs
npm run docs:backend
npm run docs:all
npm run deploy
npm run deploy:full
npm run deploy:logistica
npm run deploy:maestra
npm run version:patch
npm run version:minor
npm run version:major
npm run version:check
```

Notas:

- `npm start` ejecuta `scripts/update-version.js` y luego `ng serve`.
- `npm run build` actualiza version, compila en produccion y registra deployment.
- `npm run build:prod-api` ejecuta flujo de commit/build/version/deployment usando configuracion `prod-api`.
- `npm run deploy` ejecuta `scripts/deploy-to-server.ps1`.

## 6. Build Angular

Configuracion:

```text
logistica/angular.json
```

Build productivo:

```powershell
npm run build
```

Build contra configuracion `prod-api`:

```powershell
npm run build:prod-api
```

Salida:

```text
dist/logistica
```

Presupuestos configurados:

```text
initial warning: 12mb
initial error:   15mb
component style warning: 30kb
component style error:   60kb
```

## 7. Versionamiento

El frontend usa:

```text
src/environments/version.ts
src/assets/version.json
```

Scripts relacionados:

```text
scripts/update-version.js
scripts/generate-version.js
scripts/register-deployment.js
scripts/git-commit-and-build.js
```

El API expone:

```text
GET  /api/app-deployments/current
GET  /api/app-deployments/history
POST /api/app-deployments
```

Uso: mostrar version actual, historial y registrar despliegues.

## 8. Flujo recomendado de despliegue

1. Revisar cambios pendientes en frontend y API.
2. Confirmar que no haya archivos temporales o de entorno comprometidos.
3. Ejecutar build del API.
4. Ejecutar build del frontend.
5. Validar login y rutas principales.
6. Registrar deployment.
7. Copiar/publicar artefactos segun script de despliegue.
8. Probar en ambiente publicado.

Comandos orientativos:

```powershell
cd api_logistica
dotnet build

cd ..\logistica
npm run build:prod-api
npm run deploy
```

## 9. Checklist de validacion post despliegue

API:

- Swagger abre correctamente.
- `GET /api/app-deployments/current` responde.
- Login o endpoint de salud funcional responde.
- Conexion SQL activa.
- Middleware no bloquea endpoints esperados.

Frontend:

- Login carga.
- Usuario normal ingresa.
- Usuario admin ingresa.
- Menu corresponde al rol.
- Dashboard inicial abre.
- Requerimientos abre.
- Aprobaciones abre.
- Consolidacion/compras abre.
- Recepcion o despachos abre.
- Version visible coincide con build.

Integracion:

- `environment.baseUrl` apunta al API correcto.
- `environment.apiMaestra` apunta al API Maestra correcto.
- CORS permite llamadas del dominio publicado.
- No hay errores CORS en consola del navegador.
- No hay endpoints hardcodeados apuntando a ambiente incorrecto.

## 10. Troubleshooting rapido

### API no levanta

Revisar:

- .NET SDK instalado.
- Puerto ocupado.
- `DefaultConnection`.
- Acceso a SQL Server.
- Paquetes restaurados con `dotnet restore`.

### Swagger abre pero endpoints fallan

Revisar:

- Body JSON esperado.
- Stored procedure instalado.
- Permisos de base de datos.
- Middleware de autorizacion.
- Logs del API.

### Frontend no compila

Revisar:

- `npm install`.
- Version Node compatible.
- Errores TypeScript.
- Tamaño de bundles por budgets.
- Imports con alias `@`.

### Login falla

Revisar:

- API Maestra disponible.
- Usuario activo.
- Aplicacion `LOGISTICA`.
- Rol asignado.
- Respuesta de `get-usuarios`.

### Menu no aparece

Revisar:

- Usuario guardado en IndexedDB.
- Rol correcto.
- Configuracion en `LayoutConfigService`.
- Registros de menu dinamico.
- Guards de ruta.

### No se puede cerrar sesion

Hay pendientes locales en IndexedDB. Sincronizar requerimientos antes de salir.

### OC no sincroniza

Revisar:

- Estado de OC.
- Empresa/RUC.
- Proveedor.
- Adjuntos obligatorios.
- Parametros de incremento OC.
- Cola Spring/ERP.
- Endpoint de reintento o sincronizacion.

## 11. Buenas practicas

- No exponer cadenas de conexion reales en documentacion.
- Mantener `environment` como unica fuente de URLs.
- Documentar cambios de SQL junto con pantallas afectadas.
- Probar con al menos un rol operativo, uno logistico, uno aprobador y uno almacen.
- Mantener `docs/` actualizado cuando cambien rutas o flujos.
