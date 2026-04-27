# Sistema de Control de Versiones - Documentación Completa

## Tabla de Contenidos
1. [Flujo Actual de Control de Versiones](#flujo-actual)
2. [Archivos Frontend Involucrados](#archivos-frontend)
3. [Archivos Backend Involucrados](#archivos-backend)
4. [Scripts de Deploy](#scripts-deploy)
5. [Flujo Detallado de Actualización](#flujo-detallado)
6. [Mejoras Propuestas](#mejoras-propuestas)
7. [Migración a API Maestra](#migracion-api-maestra)
8. [Guía de Uso](#guia-de-uso)

---

## Flujo Actual de Control de Versiones {#flujo-actual}

### Resumen del Flujo

```
1. Desarrollo → npm run build:prod-api
   ↓
2. update-version.js incrementa versión (patch)
   ↓
3. Actualiza: package.json, environments/*.ts, version.json
   ↓
4. Build Angular genera dist/
   ↓
5. deploy-to-server.ps1 copia a IIS
   ↓
6. Registra versión en API (POST /api/app-deployments)
   ↓
7. Usuario accede app → verifica versión
   ↓
8. Si versión local ≠ servidor → muestra modal
   ↓
9. Usuario acepta → limpia Dexie → recarga
```

### Componentes Principales

**Frontend:**
- Service Worker (Angular) - Cache de archivos estáticos
- version.json - Versión en servidor (no cacheado)
- environment.ts - Versión compilada en bundle
- VersionService - Compara versiones
- DeploymentTrackingService - Consulta API de deployments
- AppComponent - Orquesta verificaciones

**Backend:**
- AppDeployments table - Historial de versiones
- AppDeploymentsController - API REST
- AppDeploymentUseCase - Lógica de negocio
- AppDeploymentRepository - Acceso a datos

---

## Archivos Frontend Involucrados {#archivos-frontend}

### 1. package.json
**Ubicación:** Raíz del proyecto
**Función:** Define la versión semántica de la aplicación

```json
{
  "name": "logistica",
  "version": "1.0.68",
  "scripts": {
    "build:prod-api": "node scripts/git-commit-and-build.js && node scripts/update-version.js && ng build --configuration=prod-api",
    "build:prod": "node scripts/update-version.js && ng build --configuration=production"
  }
}
```

**Formato de versión:** SemVer (Major.Minor.Patch)
- Major: Cambios breaking
- Minor: Nuevas features backward compatible
- Patch: Bug fixes

---

### 2. scripts/update-version.js
**Ubicación:** `scripts/update-version.js`
**Función:** Incrementa automáticamente la versión patch y actualiza todos los archivos

**Proceso:**
1. Lee `package.json`
2. Parsea versión: `1.0.68` → `[1, 0, 68]`
3. Incrementa patch: `68 + 1 = 69`
4. Nueva versión: `1.0.69`
5. Actualiza archivos:
   - `package.json` → `version: "1.0.69"`
   - `src/environments/environment.ts` → `appVersion: '1.0.69'`
   - `src/environments/environment.prod.ts` → `appVersion: '1.0.69'`
   - `src/environments/environment.prod-api.ts` → `appVersion: '1.0.69'`
   - `src/assets/version.json` → `{ version: "1.0.69", buildTime: "2026-04-27T..." }`

**Por qué update-version.js:**
- Automatiza el incremento de versión
- Evita errores humanos
- Mantiene consistencia entre todos los archivos
- Genera timestamp para auditoría

---

### 3. src/assets/version.json
**Ubicación:** `src/assets/version.json`
**Función:** Archivo estático con versión del servidor (NO cacheado por SW)

```json
{
  "version": "1.0.68",
  "buildTime": "2026-04-23T18:00:58.971Z"
}
```

**Por qué NO cacheado:**
En `ngsw-config.json` línea 26:
```json
"!/assets/version.json"
```

Esto permite que el cliente siempre lea la versión fresca del servidor, sin depender del cache del Service Worker.

---

### 4. ngsw-config.json
**Ubicación:** `ngsw-config.json`
**Función:** Configuración del Service Worker de Angular

**Estructura:**
```json
{
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "!/assets/version.json",  // ← EXCLUIDO DEL CACHE
          "/media/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ]
}
```

**Modos:**
- `installMode: prefetch` - Descarga todo inmediatamente al instalar
- `updateMode: prefetch` - Verifica actualizaciones en background
- `!/assets/version.json` - Exclusión crítica para control de versiones

---

### 5. src/environments/environment.ts
**Ubicación:** `src/environments/environment.ts`
**Función:** Configuración de entorno (desarrollo)

```typescript
export const environment = {
  production: false,
  appVersion: '1.0.68', // se reemplaza automáticamente
  updateMode: 'AUTO',      // 'AUTO' | 'MANUAL' | 'DISABLED'
  showUpdateModal: true,   // true | false
  baseUrl: 'https://apilogistica.agroapps.net:7018',
  apiMaestra: 'https://apimaestra.agroapps.net:7003'
};
```

**Configuraciones:**
- `appVersion`: Versión compilada en el bundle (inmutable hasta nuevo build)
- `updateMode`: 
  - `'AUTO'` - Verifica automáticamente cada 10 min y en eventos
  - `'MANUAL'` - Solo cuando se llama manualmente
  - `'DISABLED'` - Desactiva verificaciones
- `showUpdateModal`: Si muestra o no el modal de actualización
- `baseUrl`: URL de la API de logística
- `apiMaestra`: URL de la API maestra (para migración futura)

---

### 6. src/app/services/version.service.ts
**Ubicación:** `src/app/services/version.service.ts`
**Función:** Servicio central para gestión de versiones

**Métodos principales:**

```typescript
async getServerVersion(): Promise<string | null>
```
- Lee `/assets/version.json?ngsw-bypass=true&t={timestamp}`
- Bypass completo del cache (Service Worker + Navegador)
- Headers: `Cache-Control: no-cache, no-store, must-revalidate`
- Retorna: versión del servidor o null si falla

```typescript
async getLocalVersion(): Promise<string>
```
- Retorna `environment.appVersion`
- Esta es la versión con la que fue compilado el bundle actual

```typescript
setLocalVersion(version: string)
getStoredVersion(): string | null
```
- Guarda/lee versión en localStorage
- Útil para tracking

```typescript
setUpdatedVersion(version: string)
getUpdatedVersion(): string | null
```
- Marca que el usuario ya actualizó a esta versión
- Evita mostrar el modal múltiples veces para la misma versión

**Configuración dinámica:**
```typescript
setMode(mode: UpdateMode)  // Cambia updateMode en runtime
setShowModal(show: boolean)  // Cambia si muestra modal
getMode(): UpdateMode
canShowModal(): boolean
```

---

### 7. src/app/services/deployment-tracking.service.ts
**Ubicación:** `src/app/services/deployment-tracking.service.ts`
**Función:** Consulta la API de deployments para validar versiones

**Interfaces:**
```typescript
export interface DeploymentRecord {
  id?: number;
  appName: string;
  environment: string;
  version: string;
  buildTime?: string | null;
  deployedAt?: string | null;
  deployedBy?: string | null;
  serverName?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface VersionAuditSnapshot {
  appName: string;
  environment: string;
  localVersion: string;
  serverVersion: string | null;
  apiVersion: string | null;
  apiDeployment: DeploymentRecord | null;
  confirmedUpdateVersion: string | null;
  promptDecisionReason: string;
  isLocalBehindServer: boolean;
  isServerOutOfSyncWithApi: boolean;
  isFullyAligned: boolean;
}
```

**Métodos:**

```typescript
async getCurrentDeployment(): Promise<DeploymentRecord | null>
```
- GET `/api/app-deployments/current?appName=logistica&environment=production`
- Retorna el deployment activo actual

```typescript
async buildVersionAudit(localVersion: string, serverVersion: string | null): Promise<VersionAuditSnapshot>
```
- Compara 3 fuentes:
  1. `localVersion` - Del bundle
  2. `serverVersion` - De version.json en IIS
  3. `apiVersion` - De tabla AppDeployments
- Determina si hay actualización confirmada

```typescript
shouldPromptForUpdate(snapshot: VersionAuditSnapshot): boolean
```
- Retorna true solo si:
  - serverVersion existe
  - apiVersion existe
  - serverVersion === apiVersion (IIS y API alineados)
  - serverVersion !== localVersion (hay nueva versión)

```typescript
logAuditResult(snapshot: VersionAuditSnapshot): void
```
- Logs detallados para debugging
- Muestra estado de alineación de versiones

---

### 8. src/app/services/version-check.service.ts
**Ubicación:** `src/app/services/version-check.service.ts`
**Función:** Escucha eventos del Service Worker

```typescript
@Injectable({ providedIn: 'root' })
export class VersionCheckService {
  constructor(private updates: SwUpdate) {
    this.checkForUpdates();
  }

  async checkForUpdates() {
    if (this.updates.isEnabled) {
      this.updates.versionUpdates.subscribe(async event => {
        if (event.type === 'VERSION_READY') {
          console.log('⚡ Nueva versión disponible');
          const db = new DexieService();
          await db.clearAll();
          window.location.reload();
        }
      });
    }
  }
}
```

**Eventos del SW:**
- `VERSION_READY` - Nueva versión descargada y lista
- `VERSION_DETECTED` - Nueva versión detectada
- `VERSION_INSTALLATION_FAILED` - Falló instalación

**Nota:** Este servicio actualmente NO muestra modal, solo recarga automáticamente.

---

### 9. src/app/app.component.ts
**Ubicación:** `src/app/app.component.ts`
**Función:** Orquesta todo el flujo de control de versiones

**Configuración:**
```typescript
private readonly CHECK_INTERVAL_MINUTES = 10;
private lastPromptKey = 'last_update_prompt';
```

**Métodos clave:**

```typescript
ngOnInit()
```
- Verifica modo de actualización
- Si `AUTO`:
  - Registra listeners (focus, online, visibility)
  - Ejecuta verificación inicial
  - Programa verificaciones cada 10 min
  - Escucha eventos del SW

```typescript
registerVersionCheckListeners()
```
- `window.addEventListener('focus')` - Usuario vuelve a la pestaña
- `window.addEventListener('online')` - Conexión restablecida
- `document.addEventListener('visibilitychange')` - Pestaña visible

```typescript
async checkVersionFromServer()
```
1. Obtiene versión del servidor (version.json)
2. Obtiene versión local (environment)
3. Obtiene versión actualizada (localStorage)
4. Ejecuta auditoría de deployments
5. Si hay versión confirmada nueva:
   - Verifica si ya actualizó a esta versión
   - Verifica cooldown de 15 min entre prompts
   - Muestra modal

```typescript
async askUserToUpdate(remote?: string, local?: string)
```
- Muestra SweetAlert2 con:
  - Versión actual
  - Versión nueva
  - Botones: "Actualizar ahora" / "Más tarde"
- Si acepta: `clearDexieAndReload()`

```typescript
async clearDexieAndReload()
```
1. Guarda versión que se está actualizando
2. Elimina todas las bases IndexedDB
3. Muestra modal "Actualizando..."
4. Recarga página después de 1.5 seg

**Flujo completo en AppComponent:**

```
ngOnInit()
  ↓
auditDeploymentVersions()
  ↓
scheduleVersionChecks() (cada 10 min)
  ↓
registerVersionCheckListeners() (focus, online, visibility)
  ↓
checkVersionFromServer() (en cada evento)
  ↓
Obtener: serverVersion, localVersion, apiVersion
  ↓
buildVersionAudit()
  ↓
shouldPromptForUpdate()? → askUserToUpdate()
  ↓
clearDexieAndReload()
```

---

## Archivos Backend Involucrados {#archivos-backend}

### 1. SQL/267_CREATE_TABLE_APP_DEPLOYMENTS.sql
**Ubicación:** `api_logistica/SQL/267_CREATE_TABLE_APP_DEPLOYMENTS.sql`
**Función:** Crea tabla para historial de deployments

```sql
CREATE TABLE dbo.AppDeployments
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    AppName NVARCHAR(100) NOT NULL,
    Environment NVARCHAR(50) NOT NULL,
    Version NVARCHAR(50) NOT NULL,
    BuildTime DATETIME2 NULL,
    DeployedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    DeployedBy NVARCHAR(150) NULL,
    ServerName NVARCHAR(150) NULL,
    Notes NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT (1)
);

-- Índices para rendimiento
CREATE INDEX IX_AppDeployments_App_Environment_Active
    ON dbo.AppDeployments (AppName, Environment, IsActive, DeployedAt DESC);

CREATE INDEX IX_AppDeployments_App_Environment_History
    ON dbo.AppDeployments (AppName, Environment, DeployedAt DESC, Id DESC);

-- Un solo deployment activo por app+environment
CREATE UNIQUE INDEX UX_AppDeployments_OneActivePerAppEnvironment
    ON dbo.AppDeployments (AppName, Environment)
    WHERE IsActive = 1;
```

**Índice único filtrado:**
- Garantiza que solo haya 1 deployment activo por AppName + Environment
- Permite múltiples históricos inactivos

---

### 2. SQL/268_SEED_APP_DEPLOYMENTS_MULTIPLE_APPS.sql
**Ubicación:** `api_logistica/SQL/268_SEED_APP_DEPLOYMENTS_MULTIPLE_APPS.sql`
**Función:** Datos iniciales para múltiples aplicaciones

```sql
INSERT INTO @Deployments VALUES
('logistica', 'production', '1.0.67', '2026-04-23T18:20:00', '2026-04-23T18:25:00', 'Jonathan', 'SRV-IIS-01', 'Carga inicial', 1),
('portal-proveedores', 'production', '2.3.14', '2026-04-23T17:10:00', '2026-04-23T17:20:00', 'Jonathan', 'SRV-IIS-01', 'Carga inicial', 1),
('rrhh', 'qa', '0.9.8', '2026-04-22T15:00:00', '2026-04-22T15:10:00', 'Jonathan', 'SRV-QA-01', 'Carga inicial de QA', 1);
```

**Lógica:**
1. Desactiva deployments activos existentes
2. Inserta nuevos deployments
3. Evita duplicados exactos

---

### 3. Domain/Models/AppDeploymentModels.cs
**Ubicación:** `api_logistica/Domain/Models/AppDeploymentModels.cs`
**Función:** Modelos de datos

```csharp
public class AppDeploymentRecord
{
    public int Id { get; set; }
    public string AppName { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public DateTime? BuildTime { get; set; }
    public DateTime? DeployedAt { get; set; }
    public string? DeployedBy { get; set; }
    public string? ServerName { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
}

public class CreateAppDeploymentRequest
{
    public string AppName { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public DateTime? BuildTime { get; set; }
    public DateTime? DeployedAt { get; set; }
    public string? DeployedBy { get; set; }
    public string? ServerName { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
}
```

---

### 4. Domain/Repository/IAppDeploymentRepository.cs
**Ubicación:** `api_logistica/Domain/Repository/IAppDeploymentRepository.cs`
**Función:** Interfaz del repositorio

```csharp
public interface IAppDeploymentRepository
{
    Task<AppDeploymentRecord?> ObtenerDespliegueActualAsync(string appName, string environment);
    Task<IReadOnlyList<AppDeploymentRecord>> ObtenerHistorialAsync(string appName, string environment, int take);
    Task<AppDeploymentRecord> RegistrarDespliegueAsync(CreateAppDeploymentRequest request);
}
```

---

### 5. Infraestructure/RepositoryImpl/AppDeploymentRepositoryImpl.cs
**Ubicación:** `api_logistica/Infraestructure/RepositoryImpl/AppDeploymentRepositoryImpl.cs`
**Función:** Implementación con SQL directo

**Método ObtenerDespliegueActualAsync:**
```sql
SELECT TOP (1)
    Id, AppName, Environment, Version, BuildTime,
    DeployedAt, DeployedBy, ServerName, Notes, IsActive
FROM AppDeployments
WHERE AppName = @AppName
  AND Environment = @Environment
  AND IsActive = 1
ORDER BY ISNULL(DeployedAt, BuildTime) DESC, Id DESC;
```

**Método RegistrarDespliegueAsync:**
```sql
IF (@IsActive = 1)
BEGIN
    UPDATE AppDeployments
    SET IsActive = 0
    WHERE AppName = @AppName
      AND Environment = @Environment
      AND IsActive = 1;
END;

INSERT INTO AppDeployments (...) OUTPUT INSERTED.* VALUES (...);
```

**Lógica atómica:**
- Si es activo, desactiva los anteriores
- Inserta el nuevo
- Retorna el registro insertado

---

### 6. Application/UseCaseImpl/AppDeploymentUseCase.cs
**Ubicación:** `api_logistica/Application/UseCaseImpl/AppDeploymentUseCase.cs`
**Función:** Caso de uso con logging

```csharp
public async Task<AppDeploymentRecord?> ObtenerDespliegueActualAsync(string appName, string environment)
{
    _logger.LogInformation("Consultando despliegue actual de {AppName} en {Environment}", appName, environment);
    return await _appDeploymentRepository.ObtenerDespliegueActualAsync(appName, environment);
}
```

---

### 7. Infraestructure/Controller/AppDeploymentsController.cs
**Ubicación:** `api_logistica/Infraestructure/Controller/AppDeploymentsController.cs`
**Función:** API REST

**Endpoints:**

```
GET /api/app-deployments/current?appName=logistica&environment=production
→ Retorna deployment activo actual

GET /api/app-deployments/history?appName=logistica&environment=production&take=20
→ Retorna historial de deployments

POST /api/app-deployments
Body: {
  "appName": "logistica",
  "environment": "production",
  "version": "1.0.69",
  "buildTime": "2026-04-27T...",
  "deployedBy": "Jonathan",
  "serverName": "SRV-IIS-01",
  "notes": "Deploy automatizado",
  "isActive": true
}
→ Registra nuevo deployment
```

---

### 8. Program.cs
**Ubicación:** `api_logistica/Program.cs`
**Función:** Registro de servicios

```csharp
builder.Services.AddScoped<IAppDeploymentRepository, AppDeploymentRepositoryImpl>();
builder.Services.AddScoped<IAppDeploymentUseCase, AppDeploymentUseCase>();
```

---

## Scripts de Deploy {#scripts-deploy}

### 1. scripts/deploy.ps1
**Ubicación:** `scripts/deploy.ps1`
**Función:** Deploy local (sin copiar a servidor)

**Pasos:**
1. Ejecuta `update-version.js`
2. Lee versión de `version.json`
3. Ejecuta `npm run build:prod`
4. Git add, commit, push

**Uso:**
```powershell
.\scripts\deploy.ps1
```

---

### 2. scripts/deploy-to-server.ps1
**Ubicación:** `scripts/deploy-to-server.ps1`
**Función:** Deploy completo a IIS + registro en API

**Parámetros:**
```powershell
param(
    [string]$ServerPath = "\\172.16.20.3\C$\logistica",
    [string]$LocalBuildPath = "dist\logistica\browser",
    [string]$DeploymentApiUrl = "https://apilogistica.agroapps.net:7018/api/app-deployments",
    [string]$AppName = "",
    [string]$EnvironmentName = "production",
    [string]$Notes = "Deploy IIS automatizado",
    [switch]$SkipApiRegister
)
```

**Pasos:**
1. Verifica que existe el build local
2. Lee versión de `dist/logistica/browser/assets/version.json`
3. Crea backup completo en `\\172.16.20.3\C$\logistica_backup_{timestamp}`
4. Copia archivos del build al servidor
5. Verifica que `version.json` se copió correctamente
6. Si no es `-SkipApiRegister`:
   - POST a `/api/app-deployments` con metadata
   - Si falla el registro, el deploy se considera inválido

**Uso:**
```powershell
.\scripts\deploy-to-server.ps1
```

**Uso con parámetros:**
```powershell
.\scripts\deploy-to-server.ps1 -AppName "logistica" -EnvironmentName "production"
```

**Uso sin registro API (testing):**
```powershell
.\scripts\deploy-to-server.ps1 -SkipApiRegister
```

---

## Flujo Detallado de Actualización {#flujo-detallado}

### Escenario 1: Usuario con versión antigua

```
1. Usuario tiene app v1.0.68 instalada
   ↓
2. Admin hace deploy de v1.0.69
   ↓
3. deploy-to-server.ps1:
   - Copia archivos a IIS
   - Registra v1.0.69 en API (AppDeployments table)
   ↓
4. Usuario accede a la app
   ↓
5. AppComponent.ngOnInit() ejecuta checkVersionFromServer()
   ↓
6. VersionService.getServerVersion() lee /assets/version.json
   - Obtiene: "1.0.69" (versión fresca del servidor)
   ↓
7. VersionService.getLocalVersion() retorna "1.0.68" (del bundle)
   ↓
8. DeploymentTrackingService.getCurrentDeployment()
   - GET /api/app-deployments/current?appName=logistica&environment=production
   - Obtiene: { version: "1.0.69", isActive: true }
   ↓
9. buildVersionAudit(local="1.0.68", server="1.0.69")
   - apiVersion = "1.0.69"
   - serverVersion === apiVersion → true
   - serverVersion !== localVersion → true
   - confirmedUpdateVersion = "1.0.69"
   ↓
10. shouldPromptForUpdate() → true
   ↓
11. askUserToUpdate(remote="1.0.69", local="1.0.68")
   - Muestra SweetAlert2:
     "⚡ Nueva versión disponible
      Versión actual: 1.0.68
      Versión nueva: 1.0.69
      ¿Deseas actualizar ahora?"
   ↓
12. Usuario hace clic en "Actualizar ahora"
   ↓
13. clearDexieAndReload()
   - setUpdatedVersion("1.0.69") en localStorage
   - Elimina todas las bases IndexedDB
   - Muestra "Actualizando..."
   - window.location.reload()
   ↓
14. Navegador recarga
   ↓
15. Service Worker descarga nueva versión
   ↓
16. Usuario ahora tiene v1.0.69
```

### Escenario 2: Usuario ya actualizado

```
1. Usuario tiene app v1.0.69 (ya actualizada)
   ↓
2. checkVersionFromServer()
   ↓
3. local="1.0.69", server="1.0.69"
   ↓
4. buildVersionAudit()
   - confirmedUpdateVersion = null (mismas versiones)
   ↓
5. shouldPromptForUpdate() → false
   ↓
6. No muestra modal
```

### Escenario 3: IIS y API desincronizados

```
1. Admin hace deploy pero falla registro en API
   ↓
2. IIS tiene v1.0.69
   ↓
3. API tiene v1.0.68 (último registrado)
   ↓
4. checkVersionFromServer()
   ↓
5. buildVersionAudit()
   - isServerOutOfSyncWithApi = true
   - confirmedUpdateVersion = null
   ↓
6. shouldPromptForUpdate() → false
   ↓
7. Log: "IIS y API no coinciden (1.0.69 vs 1.0.68)"
   ↓
8. No muestra modal (por seguridad)
```

---

## Mejoras Propuestas {#mejoras-propuestas}

### 1. Detección de Sesión Activa

**Problema:** Si el usuario tiene datos sin guardar, el modal de actualización puede causar pérdida de datos.

**Solución:** Detectar si hay sesión activa y datos pendientes.

**Implementación propuesta en VersionService:**

```typescript
// src/app/services/version.service.ts

export interface SessionState {
  hasActiveSession: boolean;
  hasUnsavedChanges: boolean;
  hasPendingOperations: boolean;
  lastActivityTime: number;
}

export class VersionService {
  // ... código existente ...

  checkSessionState(): SessionState {
    const usuario = localStorage.getItem('usuario');
    const hasSession = !!usuario;

    // Detectar cambios no guardados en Dexie
    // (necesitaría implementar un flag en DexieService)
    const hasUnsaved = localStorage.getItem('has_unsaved_changes') === 'true';

    // Detectar operaciones pendientes
    const hasPending = localStorage.getItem('pending_operations') === 'true';

    const lastActivity = localStorage.getItem('last_activity_time');
    const lastActivityTime = lastActivity ? parseInt(lastActivity) : 0;

    return {
      hasActiveSession: hasSession,
      hasUnsavedChanges: hasUnsaved,
      hasPendingOperations: hasPending,
      lastActivityTime
    };
  }

  isSessionActive(): boolean {
    const state = this.checkSessionState();
    if (!state.hasActiveSession) return false;

    // Considerar inactiva si hace más de 30 min
    const thirtyMinutes = 30 * 60 * 1000;
    const timeSinceActivity = Date.now() - state.lastActivityTime;

    return timeSinceActivity < thirtyMinutes;
  }
}
```

**Implementación en AppComponent:**

```typescript
// src/app/app.component.ts

async askUserToUpdate(remote?: string, local?: string) {
  const sessionState = this.versionService.checkSessionState();
  
  let warningMessage = '';
  if (sessionState.hasActiveSession) {
    warningMessage = `
      <div class="alert alert-warning" style="padding: 10px; margin-bottom: 15px; border-radius: 5px;">
        ⚠️ <strong>Tienes una sesión activa</strong>
      </div>
    `;
  }
  
  if (sessionState.hasUnsavedChanges) {
    warningMessage += `
      <div class="alert alert-danger" style="padding: 10px; margin-bottom: 15px; border-radius: 5px;">
        ❌ <strong>Tienes cambios sin guardar</strong><br>
        Por favor guarda tus cambios antes de actualizar.
      </div>
    `;
  }

  const result = await Swal.fire({
    title: '⚡ Nueva versión disponible',
    html: `
      ${warningMessage}
      <p>Versión actual: <b>${local ?? this.APP_VERSION}</b></p>
      <p>Versión nueva: <b>${remote ?? 'desconocida'}</b></p>
      <p>¿Deseas actualizar ahora?</p>
    `,
    icon: sessionState.hasUnsavedChanges ? 'warning' : 'info',
    confirmButtonText: 'Actualizar ahora',
    cancelButtonText: 'Más tarde',
    showCancelButton: true,
    confirmButtonColor: sessionState.hasUnsavedChanges ? '#d33' : '#3085d6',
    cancelButtonColor: '#aaa',
    allowOutsideClick: false
  });

  if (result.isConfirmed) {
    if (sessionState.hasUnsavedChanges) {
      const confirmForce = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Tienes cambios sin guardar. Se perderán al actualizar.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, actualizar de todas formas',
        cancelButtonText: 'Cancelar'
      });

      if (!confirmForce.isConfirmed) {
        return; // Cancela la actualización
      }
    }
    
    await this.clearDexieAndReload();
  }
}
```

**Implementación en DexieService para tracking de cambios:**

```typescript
// src/app/shared/dixiedb/dexie-db.service.ts

export class DexieService extends Dexie {
  // ... código existente ...

  private markUnsavedChanges() {
    localStorage.setItem('has_unsaved_changes', 'true');
    localStorage.setItem('last_activity_time', Date.now().toString());
  }

  private markSaved() {
    localStorage.setItem('has_unsaved_changes', 'false');
    localStorage.setItem('last_activity_time', Date.now().toString());
  }

  // Sobrescribir métodos de escritura para marcar cambios
  async add(table: string, data: any) {
    this.markUnsavedChanges();
    return super.table(table).add(data);
  }

  async put(table: string, data: any) {
    this.markUnsavedChanges();
    return super.table(table).put(data);
  }

  async delete(table: string, key: any) {
    this.markUnsavedChanges();
    return super.table(table).delete(key);
  }

  // Método para marcar que se guardaron cambios
  async markAllAsSaved() {
    this.markSaved();
  }
}
```

### 2. Modal con Opciones de Actualización

**Mejora:** Ofrecer opciones al usuario.

```typescript
async askUserToUpdate(remote?: string, local?: string) {
  const sessionState = this.versionService.checkSessionState();
  
  const result = await Swal.fire({
    title: '⚡ Nueva versión disponible',
    html: `
      <p>Versión actual: <b>${local ?? this.APP_VERSION}</b></p>
      <p>Versión nueva: <b>${remote ?? 'desconocida'}</b></p>
      ${sessionState.hasActiveSession ? '<p class="text-warning">⚠️ Tienes una sesión activa</p>' : ''}
    `,
    icon: 'info',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Actualizar ahora',
    denyButtonText: 'Recordar más tarde (5 min)',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3085d6',
    denyButtonColor: '#ffc107',
    cancelButtonColor: '#aaa',
    allowOutsideClick: false
  });

  if (result.isConfirmed) {
    await this.clearDexieAndReload();
  } else if (result.isDenied) {
    // Recordar en 5 minutos
    setTimeout(() => {
      this.runVersionCheck('reminder');
    }, 5 * 60 * 1000);
  }
}
```

### 3. Notificación Persistente (Toast)

**Mejora:** Mostrar notificación no intrusiva primero.

```typescript
// Usar PrimeNG Toast en lugar de SweetAlert2 para primera notificación

async showUpdateNotification(remote: string, local: string) {
  this.messageService.add({
    severity: 'info',
    summary: 'Nueva versión disponible',
    detail: `Versión ${remote} disponible. Actual: ${local}`,
    life: 10000,
    sticky: true
  });
}
```

---

## Migración a API Maestra {#migracion-api-maestra}

### Concepto

La API maestra es una API centralizada que maneja deployments de múltiples aplicaciones (logística, portal-proveedores, rrhh, etc.).

**Ventajas:**
- Centralización de control de versiones
- Auditoría unificada
- Dashboard de deployments
- Rollback coordinado

### Tabla AppDeployments (Ya existe en API Logística)

La tabla `AppDeployments` en la base de datos de logística ya soporta múltiples aplicaciones:

```sql
CREATE TABLE dbo.AppDeployments
(
    AppName NVARCHAR(100) NOT NULL,  -- ← Soporta múltiples apps
    Environment NVARCHAR(50) NOT NULL,
    Version NVARCHAR(50) NOT NULL,
    -- ...
);
```

### Estrategia de Migración

#### Opción 1: Usar API Logística como API Maestra

**Ventajas:**
- No requiere cambios en infraestructura
- La tabla ya soporta múltiples apps
- Solo necesita exponer el endpoint

**Implementación:**

1. **Ya está implementado** - El endpoint `/api/app-deployments` ya soporta múltiples apps:

```csharp
[HttpGet("current")]
public async Task<ActionResult<AppDeploymentRecord>> ObtenerActual(
    [FromQuery] string appName,
    [FromQuery] string environment)
```

2. **Configurar otras aplicaciones para usar esta API:**

En `environment.ts` de otras apps:
```typescript
export const environment = {
  // ...
  deploymentApiUrl: 'https://apilogistica.agroapps.net:7018/api/app-deployments',
  appName: 'portal-proveedores'
};
```

3. **DeploymentTrackingService genérico:**

```typescript
// Crear servicio genérico reutilizable

@Injectable({ providedIn: 'root' })
export class DeploymentTrackingService {
  constructor(
    @Inject('DEPLOYMENT_CONFIG') private config: DeploymentConfig,
    private http: HttpClient
  ) {}

  async getCurrentDeployment(): Promise<DeploymentRecord | null> {
    const params = new HttpParams()
      .set('appName', this.config.appName)
      .set('environment', this.config.environment);

    return await lastValueFrom(
      this.http.get<DeploymentRecord>(this.config.apiUrl, { params })
    );
  }
}
```

**Registro en otras apps:**

```typescript
// portal-proveedores/app.module.ts o main.ts

providers: [
  {
    provide: 'DEPLOYMENT_CONFIG',
    useValue: {
      apiUrl: 'https://apilogistica.agroapps.net:7018/api/app-deployments',
      appName: 'portal-proveedores',
      environment: 'production'
    }
  }
]
```

#### Opción 2: Crear API Maestra dedicada

**Ventajas:**
- Separación de responsabilidades
- Escalabilidad independiente
- Features específicos de deployment

**Implementación:**

1. **Crear nuevo proyecto .NET:** `api-maestra`

2. **Migrar tabla AppDeployments a base de datos centralizada**

```sql
-- En base de datos de API Maestra
CREATE TABLE dbo.AppDeployments
(
    -- Misma estructura
);
```

3. **Migrar datos:**

```sql
-- Migración inicial
INSERT INTO ApiMaestra.dbo.AppDeployments
SELECT * FROM ApiLogistica.dbo.AppDeployments;
```

4. **Crear endpoints similares en API Maestra**

5. **Actualizar environment.ts de todas las apps:**

```typescript
export const environment = {
  deploymentApiUrl: 'https://apimaestra.agroapps.net:7003/api/app-deployments',
  // ...
};
```

### Recomendación

**Usar Opción 1 (API Logística como API Maestra)** porque:
- Ya está implementado
- La tabla soporta múltiples apps
- Menor esfuerzo de migración
- La URL `apiMaestra` ya está en environment.ts (posiblemente para esto)

### Configuración Actual

En `environment.ts` ya existe:
```typescript
apiMaestra: 'https://apimaestra.agroapps.net:7003'
```

Esto sugiere que ya hay una API maestra. Para usarla:

**Actualizar DeploymentTrackingService:**

```typescript
// src/app/services/deployment-tracking.service.ts

export class DeploymentTrackingService {
  private readonly baseUrl = environment.apiMaestra; // ← Cambiar de environment.baseUrl
  private readonly endpoint = `${this.baseUrl}/api/app-deployments`;
  // ...
}
```

**Verificar que API Maestra tiene el endpoint:**

La API maestra debe tener:
- Tabla `AppDeployments` (mismo esquema)
- Controller `AppDeploymentsController` (mismos endpoints)
- Repository, UseCase, etc.

---

## Guía de Uso {#guia-de-uso}

### Para Desarrolladores

#### 1. Hacer un Deploy a Producción

**Paso 1:** Asegurarse de estar en la rama correcta
```bash
git checkout main
git pull origin main
```

**Paso 2:** Ejecutar build y deploy
```bash
npm run build:prod-api
```

Esto:
- Ejecuta `git-commit-and-build.js` (commit automático)
- Ejecuta `update-version.js` (incrementa versión)
- Ejecuta `ng build --configuration=prod-api` (compila)

**Paso 3:** Copiar al servidor
```powershell
.\scripts\deploy-to-server.ps1
```

Esto:
- Copia archivos a `\\172.16.20.3\C$\logistica`
- Crea backup
- Registra versión en API

**Paso 4:** Verificar
1. Abrir navegador en servidor
2. Limpiar cache (Ctrl + Shift + Delete)
3. Acceder a `https://apilogistica.agroapps.net:7018`
4. Verificar versión en console: `localStorage.getItem('app_updated_version')`

#### 2. Verificar Estado de Versiones

**En frontend:**
```typescript
// Abrir console en navegador
const local = await versionService.getLocalVersion();
const server = await versionService.getServerVersion();
console.log('Local:', local, 'Server:', server);
```

**En backend:**
```sql
SELECT * FROM AppDeployments 
WHERE AppName = 'logistica' 
  AND Environment = 'production' 
ORDER BY DeployedAt DESC;
```

**Via API:**
```bash
curl "https://apilogistica.agroapps.net:7018/api/app-deployments/current?appName=logistica&environment=production"
```

#### 3. Forzar Actualización Manual

**En frontend:**
```typescript
// Desde console
const app = ng.probe(getAllAngularRootElements()[0]).componentInstance;
app.triggerManualUpdate();
```

**O cambiar modo:**
```typescript
// En environment.ts temporalmente
updateMode: 'MANUAL'
```

#### 4. Desactivar Actualizaciones (Testing)

**En environment.ts:**
```typescript
updateMode: 'DISABLED'
```

#### 5. Cambiar Cooldown de Modal

**En app.component.ts:**
```typescript
private readonly CHECK_INTERVAL_MINUTES = 10;  // Cambiar frecuencia
// En checkVersionFromServer():
if (!lastPrompt || now - parseInt(lastPrompt) > 15 * 60 * 1000) {  // 15 min cooldown
```

### Para Administradores

#### 1. Ver Historial de Deploys

**Via SQL:**
```sql
SELECT 
    AppName,
    Environment,
    Version,
    BuildTime,
    DeployedAt,
    DeployedBy,
    ServerName,
    Notes,
    IsActive
FROM AppDeployments
WHERE AppName = 'logistica'
ORDER BY DeployedAt DESC;
```

**Via API:**
```bash
curl "https://apilogistica.agroapps.net:7018/api/app-deployments/history?appName=logistica&environment=production&take=20"
```

#### 2. Rollback a Versión Anterior

**Opción 1: Re-deploy versión anterior**
```bash
# Cambiar package.json a versión anterior
# Ejecutar deploy normalmente
```

**Opción 2: Marcar versión anterior como activa (SQL)**
```sql
-- Desactivar actual
UPDATE AppDeployments
SET IsActive = 0
WHERE AppName = 'logistica'
  AND Environment = 'production'
  AND IsActive = 1;

-- Activar anterior
UPDATE AppDeployments
SET IsActive = 1
WHERE AppName = 'logistica'
  AND Environment = 'production'
  AND Version = '1.0.67';  -- Versión a restaurar

-- Restaurar archivos en IIS manualmente desde backup
```

#### 3. Monitorear Usuarios Desactualizados

**SQL para ver distribución:**
```sql
-- Necesitaría tabla de sesiones activas (no implementado actualmente)
-- Alternativa: revisar logs de la aplicación
```

### Para Soporte

#### 1. Usuario reporta problemas tras actualización

**Diagnosticar:**
1. Preguntar versión actual: `localStorage.getItem('app_version')`
2. Preguntar versión del servidor: verificar en `/assets/version.json`
3. Verificar si Dexie se limpió: `indexedDB.databases()`
4. Verificar logs de console

**Solución:**
- Si Dexie no se limpió: Limpiar manualmente
```javascript
indexedDB.databases().then(dbs => {
  dbs.forEach(db => indexedDB.deleteDatabase(db.name));
});
location.reload();
```

#### 2. Modal no aparece

**Diagnosticar:**
1. Verificar `updateMode` en environment
2. Verificar `showUpdateModal` en environment
3. Verificar logs de console
4. Verificar si `app_updated_version` coincide con server

**Solución:**
- Limpiar `localStorage.removeItem('app_updated_version')`
- Limpiar `localStorage.removeItem('last_update_prompt')`
- Recargar página

#### 3. IIS y API desincronizados

**Diagnosticar:**
```sql
-- Verificar última versión en API
SELECT TOP 1 * FROM AppDeployments 
WHERE AppName = 'logistica' AND IsActive = 1;
```

```bash
# Verificar versión en IIS
curl https://apilogistica.agroapps.net:7018/assets/version.json
```

**Solución:**
- Re-registrar deployment en API:
```bash
curl -X POST https://apilogistica.agroapps.net:7018/api/app-deployments \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "logistica",
    "environment": "production",
    "version": "1.0.69",
    "buildTime": "2026-04-27T...",
    "deployedBy": "Soporte",
    "isActive": true
  }'
```

---

## Resumen de Archivos

### Frontend

| Archivo | Función |
|---------|---------|
| `package.json` | Versión semántica del proyecto |
| `scripts/update-version.js` | Incrementa versión automáticamente |
| `src/assets/version.json` | Versión en servidor (no cacheado) |
| `ngsw-config.json` | Config Service Worker (excluye version.json) |
| `src/environments/environment.ts` | Configuración (appVersion, updateMode, etc.) |
| `src/environments/environment.prod.ts` | Configuración producción |
| `src/environments/environment.prod-api.ts` | Configuración producción con API |
| `src/app/services/version.service.ts` | Servicio central de versiones |
| `src/app/services/deployment-tracking.service.ts` | Consulta API de deployments |
| `src/app/services/version-check.service.ts` | Escucha eventos del SW |
| `src/app/app.component.ts` | Orquesta verificaciones y modal |

### Backend

| Archivo | Función |
|---------|---------|
| `SQL/267_CREATE_TABLE_APP_DEPLOYMENTS.sql` | Crea tabla de deployments |
| `SQL/268_SEED_APP_DEPLOYMENTS_MULTIPLE_APPS.sql` | Datos iniciales |
| `Domain/Models/AppDeploymentModels.cs` | Modelos de datos |
| `Domain/Repository/IAppDeploymentRepository.cs` | Interfaz repositorio |
| `Infraestructure/RepositoryImpl/AppDeploymentRepositoryImpl.cs` | Implementación SQL |
| `Domain/UseCase/IAppDeploymentUseCase.cs` | Interfaz caso de uso |
| `Application/UseCaseImpl/AppDeploymentUseCase.cs` | Implementación caso de uso |
| `Infraestructure/Controller/AppDeploymentsController.cs` | API REST |
| `Program.cs` | Registro de servicios |

### Scripts

| Archivo | Función |
|---------|---------|
| `scripts/deploy.ps1` | Deploy local (build + git) |
| `scripts/deploy-to-server.ps1` | Deploy a IIS + registro API |

---

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    DESARROLLADOR                             │
│  1. npm run build:prod-api                                  │
│     ↓                                                       │
│  2. update-version.js incrementa versión                    │
│     ↓                                                       │
│  3. ng build --configuration=prod-api                       │
│     ↓                                                       │
│  4. deploy-to-server.ps1                                   │
│     ↓                                                       │
│  5. Copia a IIS + Registra en API                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      IIS + API                                │
│  - version.json: "1.0.69"                                    │
│  - AppDeployments table: {version: "1.0.69", isActive: true} │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      USUARIO                                  │
│  1. Accede a app (bundle v1.0.68)                           │
│     ↓                                                       │
│  2. AppComponent.checkVersionFromServer()                   │
│     ↓                                                       │
│  3. getServerVersion() → "1.0.69"                           │
│     getLocalVersion() → "1.0.68"                             │
│     ↓                                                       │
│  4. DeploymentTrackingService.audit()                        │
│     - server === api → true                                  │
│     - server !== local → true                                │
│     ↓                                                       │
│  5. askUserToUpdate() → Modal SweetAlert2                   │
│     ↓                                                       │
│  6. Usuario acepta → clearDexieAndReload()                  │
│     ↓                                                       │
│  7. Recarga → Service Worker actualiza                       │
│     ↓                                                       │
│  8. Usuario ahora tiene v1.0.69                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Conclusión

El sistema de control de versiones actual es robusto y funcional. Las mejoras propuestas (detección de sesión activa, opciones de actualización) lo harán más user-friendly. La migración a API maestra puede hacerse usando la API de logística como punto central, ya que la tabla AppDeployments ya soporta múltiples aplicaciones.
