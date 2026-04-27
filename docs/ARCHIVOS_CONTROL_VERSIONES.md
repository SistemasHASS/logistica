# Archivos del Control de Versiones — Referencia

Listado **exclusivo** de archivos involucrados en el control de versiones de la app `logistica`, separados por capa y por API destino (`api_logistica` o `api_maestros`).

> Convenciones: `[FE]` = Frontend Angular · `[BE-L]` = Backend api_logistica · `[BE-M]` = Backend api_maestros · `[DB-L]` = SQL en BD api_logistica · `[DB-M]` = SQL en BD api_maestros · `[CI]` = Scripts de despliegue

---

## 1. Frontend `logistica` — archivos COMPARTIDOS (sirven para ambas APIs)

Estos archivos no dependen de qué API uses; el switch los hace agnósticos.

### Configuración

| # | Archivo | Función |
|---|---|---|
| 1 | `package.json` | Define `version` semántica del proyecto (`1.0.68`). Fuente de verdad. |
| 2 | `src/environments/environment.ts` | `appVersion`, `updateMode`, `showUpdateModal`, **`versionControlApi`**, `baseUrl` (logística), `apiMaestra` (maestra). |
| 3 | `src/environments/environment.prod.ts` | Mismo set, valores producción. |
| 4 | `src/environments/environment.prod-api.ts` | Mismo set, perfil `prod-api` (build con APIs reales). |
| 5 | `ngsw-config.json` | Config Service Worker. **Crítico:** excluye `/assets/version.json` del cache → `"!/assets/version.json"`. |

### Archivo público en IIS

| # | Archivo | Función |
|---|---|---|
| 6 | `src/assets/version.json` | Generado por `update-version.js`. Lo lee el frontend en runtime para saber qué versión hay en el IIS (sin cache). |

### Scripts de build / deploy [CI]

| # | Archivo | Función |
|---|---|---|
| 7 | `scripts/update-version.js` | Incrementa el patch en `package.json`, `environment*.ts` y genera `assets/version.json` con `buildTime`. |
| 8 | `scripts/deploy.ps1` | Deploy local: invoca `update-version.js`, hace `npm run build:prod` y commit + push. |
| 9 | `scripts/deploy-to-server.ps1` | Copia `dist/` al IIS y registra el deploy en la API. **Acepta `-VersionApi LOGISTICA\|MAESTRA`** (default `LOGISTICA`). |
| 10 | `scripts/git-commit-and-build.js` | Llamado por `npm run build:prod-api` antes del build. |

### Servicios y componentes Angular [FE]

| # | Archivo | Función |
|---|---|---|
| 11 | `src/app/services/version.service.ts` | Lee `version.json` del IIS (con `ngsw-bypass`), `environment.appVersion` (bundle local), helpers de localStorage. **Independiente de la API**. |
| 12 | `src/app/services/version-check.service.ts` | Escucha `SwUpdate.versionUpdates` para auto-recargar cuando el SW detecta versión nueva. |
| 13 | `src/app/services/deployment-tracking.service.ts` | **DUAL.** Selecciona `LOGISTICA` o `MAESTRA` en runtime y hace GET o POST según corresponda. Expone `getActiveApi()`, `setActiveApi()`, `activeApi$`. |
| 14 | `src/app/app.component.ts` | Orquesta verificaciones (focus, online, visibility, intervalo 10 min), modal SweetAlert2, limpieza Dexie + reload. |
| 15 | `src/app/modules/main/pages/administracion/pages/admin-version-api/admin-version-api.component.ts` | Página UI **switcher** entre LOGISTICA y MAESTRA. Muestra estado de versiones en vivo. |
| 16 | `src/app/modules/main/pages/administracion/pages/admin-version-api/admin-version-api.component.html` | Plantilla del switcher. |
| 17 | `src/app/modules/main/pages/administracion/pages/admin-version-api/admin-version-api.component.scss` | Estilos del switcher. |
| 18 | `src/app/modules/main/pages/administracion/admin-routing.module.ts` | Registro de la ruta `admin-version-api`. |
| 19 | `src/app/modules/main/pages/administracion/pages/admin-layout/admin-layout.component.html` | Sidebar con la entrada **"API Versionado"** (solo perfil `TI`). |

### Documentación

| # | Archivo | Función |
|---|---|---|
| 20 | `docs/SISTEMA_CONTROL_VERSIONES_COMPLETO.md` | Documento maestro del sistema completo. |
| 21 | `docs/ARCHIVOS_CONTROL_VERSIONES.md` | **Este archivo.** Referencia rápida. |

---

## 2. Cuando se usa `api_logistica`

### Backend [BE-L]

Carpeta raíz: `c:\...\backup\10.02.26\api_logistica\`

| # | Archivo | Capa | Función |
|---|---|---|---|
| L1 | `Domain/Models/AppDeploymentModels.cs` | Domain | DTOs `AppDeploymentRecord` y `CreateAppDeploymentRequest`. |
| L2 | `Domain/Repository/IAppDeploymentRepository.cs` | Domain | Interfaz: `ObtenerDespliegueActualAsync`, `ObtenerHistorialAsync`, `RegistrarDespliegueAsync`. |
| L3 | `Domain/UseCase/IAppDeploymentUseCase.cs` | Domain | Interfaz del caso de uso. |
| L4 | `Application/UseCaseImpl/AppDeploymentUseCase.cs` | Application | Implementación del caso de uso (con logging). |
| L5 | `Infraestructure/RepositoryImpl/AppDeploymentRepositoryImpl.cs` | Infrastructure | **SQL inline** directo (no SP). Hereda `BaseRepository`. |
| L6 | `Infraestructure/Controller/AppDeploymentsController.cs` | Infrastructure | Ruta `api/app-deployments`. **GET** `/current`, `/history` y **POST** `/`. |
| L7 | `Program.cs` | Startup | Registro DI: `AddScoped<IAppDeploymentRepository, AppDeploymentRepositoryImpl>()` y use case. |

### Base de datos [DB-L]

Carpeta: `c:\...\backup\10.02.26\api_logistica\SQL\`

| # | Archivo | Función |
|---|---|---|
| L8 | `SQL/267_CREATE_TABLE_APP_DEPLOYMENTS.sql` | Crea tabla `dbo.AppDeployments` + 3 índices (incluido el único filtrado `WHERE IsActive=1`). |
| L9 | `SQL/268_SEED_APP_DEPLOYMENTS_MULTIPLE_APPS.sql` | Seed con datos iniciales (logistica, portal-proveedores, rrhh). |

### Endpoints expuestos por `api_logistica`

| Método | Ruta | Acción | Body / Query |
|---|---|---|---|
| GET | `/api/app-deployments/current` | Versión activa | `?appName=logistica&environment=production` |
| GET | `/api/app-deployments/history` | Historial | `?appName=...&environment=...&take=20` |
| POST | `/api/app-deployments` | Registrar deploy | JSON `{ appName, environment, version, ... }` |

### Cómo se usa desde el frontend

- En el switcher de `Administración → API Versionado` se elige **API Logística**.
- El servicio `deployment-tracking.service.ts` detecta `activeApi === 'LOGISTICA'` y hace `GET` con `HttpParams`.
- El script `deploy-to-server.ps1` (sin parámetros o con `-VersionApi LOGISTICA`) registra el deploy con `POST https://apilogistica.agroapps.net:7018/api/app-deployments`.

---

## 3. Cuando se usa `api_maestros`

### Backend [BE-M]

Carpeta raíz: `c:\...\proyectos\api_maestros\`

| # | Archivo | Capa | Función |
|---|---|---|---|
| M1 | `Domain/Repository/IAppDeploymentsRepository.cs` | Domain | Interfaz con 3 métodos `Async(string json)` que retornan `List<JsonElement>`. |
| M2 | `Domain/UseCase/IAppDeploymentsUseCase.cs` | Domain | Interfaz del caso de uso. |
| M3 | `Application/UseCaseImpl/AppDeploymentsUseCaseImpl.cs` | Application | Implementación delgada (delega al repo). |
| M4 | `Infraestructure/RepositoryImpl/AppDeploymentsRepositoryImpl.cs` | Infrastructure | **Stored Procedures.** Hereda `BaseRepository`, usa `EjecutarStoredProcedureAsync<JsonElement>`. |
| M5 | `Infraestructure/Controller/AppDeploymentsController.cs` | Infrastructure | Ruta `api/app-deployments`. **POST** en los 3 endpoints (`/current`, `/history`, `/register`). |
| M6 | `Program.cs` | Startup | Registro DI (2 líneas añadidas): `AddScoped<IAppDeploymentsRepository, AppDeploymentsRepositoryImpl>()` y use case. |

### Base de datos [DB-M]

Carpeta: `c:\...\proyectos\api_maestros\SQL\`

| # | Archivo | Función |
|---|---|---|
| M7 | `SQL/001_APP_DEPLOYMENTS.sql` | Script todo-en-uno: crea tabla + 3 índices + 3 SPs (`MAESTRO_obtenerDespliegueActual`, `MAESTRO_obtenerHistorialDespliegue`, `MAESTRO_registrarDespliegue`). |

### Stored Procedures (parte de M7)

| SP | Entrada JSON | Salida |
|---|---|---|
| `MAESTRO_obtenerDespliegueActual` | `{ appName, environment }` | Objeto JSON único o `null` |
| `MAESTRO_obtenerHistorialDespliegue` | `{ appName, environment, take }` | Array JSON |
| `MAESTRO_registrarDespliegue` | Registro completo (camelCase) | Objeto JSON insertado |

### Endpoints expuestos por `api_maestros`

| Método | Ruta | SP que invoca | Body |
|---|---|---|---|
| POST | `/api/app-deployments/current` | `MAESTRO_obtenerDespliegueActual` | `{ "appName":"logistica", "environment":"production" }` |
| POST | `/api/app-deployments/history` | `MAESTRO_obtenerHistorialDespliegue` | `{ "appName":"...", "environment":"...", "take":20 }` |
| POST | `/api/app-deployments/register` | `MAESTRO_registrarDespliegue` | Registro completo |

### Documentación específica

| # | Archivo | Función |
|---|---|---|
| M8 | `docs/MIGRACION_APP_DEPLOYMENTS.md` (en api_maestros) | Detalle de la migración a API Maestra. |

### Cómo se usa desde el frontend

- En el switcher de `Administración → API Versionado` se elige **API Maestra**.
- El servicio `deployment-tracking.service.ts` detecta `activeApi === 'MAESTRA'` y hace `POST` con JSON body.
- El script `deploy-to-server.ps1 -VersionApi MAESTRA` registra el deploy con `POST https://apimaestra.agroapps.net:7003/api/app-deployments/register`.

---

## 4. Resumen visual

### Diagrama de qué archivo se usa según la API activa

```
┌─────────────────────────────── FRONTEND (compartido) ──────────────────────────────┐
│                                                                                    │
│  package.json ─┐                                                                   │
│  environment*.ts ─┐                                                                │
│  ngsw-config.json ─┤                                                               │
│  scripts/update-version.js ─┤── Generan version.json y appVersion del bundle       │
│  scripts/deploy-to-server.ps1 ─┘   (acepta -VersionApi LOGISTICA|MAESTRA)         │
│                                                                                    │
│  src/app/services/version.service.ts        (lee version.json + bundle)           │
│  src/app/services/version-check.service.ts  (eventos SW)                          │
│  src/app/services/deployment-tracking.service.ts  ◀── SWITCH RUNTIME              │
│  src/app/app.component.ts                                                         │
│  src/app/modules/.../admin-version-api/*    (UI del switcher)                     │
│                                                                                    │
└─────────────┬─────────────────────────────────────────────┬────────────────────────┘
              │ Si activeApi === 'LOGISTICA' (default)      │ Si activeApi === 'MAESTRA'
              ▼                                              ▼
┌─────────────────────────────┐              ┌─────────────────────────────┐
│ api_logistica :7018         │              │ api_maestros :7003          │
│  GET /current,/history      │              │  POST /current,/history,    │
│  POST /                     │              │       /register             │
│                             │              │                             │
│ Domain/Models/AppDeploy*.cs │              │ Domain/Repository/IAppDep*  │
│ Domain/Repository/IAppDep*  │              │ Domain/UseCase/IAppDep*     │
│ Domain/UseCase/IAppDep*     │              │ Application/.../AppDep*Impl │
│ Application/.../AppDep*Use  │              │ Infraestructure/Controller/ │
│ Infraestructure/Repo/AppDep │              │   AppDeploymentsController  │
│ Infraestructure/Controller  │              │ Infraestructure/Repo/...    │
│ Program.cs (DI)             │              │ Program.cs (DI)             │
│                             │              │                             │
│ SQL/267_CREATE_TABLE_*.sql  │              │ SQL/001_APP_DEPLOYMENTS.sql │
│ SQL/268_SEED_*.sql          │              │  └─ Tabla + 3 SPs           │
│  └─ SQL inline (sin SP)     │              │                             │
└─────────────────────────────┘              └─────────────────────────────┘
```

---

## 5. Tabla maestra — checklist rápido

| Componente | Solo LOGISTICA | Solo MAESTRA | Compartido |
|---|:---:|:---:|:---:|
| `package.json`, `environment*.ts`, `ngsw-config.json` | | | ✅ |
| `src/assets/version.json` | | | ✅ |
| `scripts/update-version.js`, `deploy.ps1`, `deploy-to-server.ps1`, `git-commit-and-build.js` | | | ✅ |
| `version.service.ts`, `version-check.service.ts` | | | ✅ |
| `deployment-tracking.service.ts` (servicio dual) | | | ✅ |
| `app.component.ts` | | | ✅ |
| `admin-version-api.component.*` (switcher UI) | | | ✅ |
| `admin-routing.module.ts`, `admin-layout.component.html` | | | ✅ |
| **Backend api_logistica** (L1–L7) | ✅ | | |
| **SQL api_logistica** (L8–L9) | ✅ | | |
| **Backend api_maestros** (M1–M6) | | ✅ | |
| **SQL api_maestros** (M7) | | ✅ | |

---

## 6. Comandos rápidos

### Build con versión
```powershell
npm run build:prod-api
```

### Deploy registrando en api_logistica (default actual)
```powershell
.\scripts\deploy-to-server.ps1
```

### Deploy registrando en api_maestros
```powershell
.\scripts\deploy-to-server.ps1 -VersionApi MAESTRA
```

### Cambiar API activa en el frontend (sin redeploy)
1. Login con perfil `TI`
2. `Administración → API Versionado`
3. Click en **API Maestra** o **API Logística**

### Resetear override (volver al default del environment)
```javascript
// Console del navegador
localStorage.removeItem('version_control_api');
location.reload();
```

### Probar SP directamente
```sql
-- En BD de api_maestros
EXEC dbo.MAESTRO_obtenerDespliegueActual
    @json = N'{"appName":"logistica","environment":"production"}';
```
