# API de Versionado y Despliegues

## Objetivo

Esta API complementa el archivo `assets/version.json` publicado en IIS.

- `version.json` indica la version realmente desplegada en IIS.
- La API guarda el historial de despliegues.
- El frontend compara `local` vs `iis` vs `api`.

## Endpoints

### `GET /api/app-deployments/current`

Devuelve el despliegue activo para una aplicacion y ambiente.

#### Query params

- `appName`: nombre de la aplicacion. Ejemplo: `logistica`
- `environment`: ambiente. Ejemplo: `production`

#### Response 200

```json
{
  "id": 15,
  "appName": "logistica",
  "environment": "production",
  "version": "1.0.67",
  "buildTime": "2026-04-22T23:33:41.074Z",
  "deployedAt": "2026-04-22T23:40:12.000Z",
  "deployedBy": "Jonathan",
  "serverName": "SRV-IIS-01",
  "notes": "Deploy IIS automatizado",
  "isActive": true
}
```

### `POST /api/app-deployments`

Registra un nuevo despliegue y lo deja activo.

#### Request body

```json
{
  "appName": "logistica",
  "environment": "production",
  "version": "1.0.67",
  "buildTime": "2026-04-22T23:33:41.074Z",
  "deployedAt": "2026-04-22T23:40:12.000Z",
  "deployedBy": "Jonathan",
  "serverName": "SRV-IIS-01",
  "notes": "Deploy IIS automatizado",
  "isActive": true
}
```

#### Response 200 o 201

Puede devolver el registro creado o un objeto simple de confirmacion.

### `GET /api/app-deployments/history`

Devuelve el historial por aplicacion y ambiente.

#### Query params

- `appName`
- `environment`
- `take` opcional

## Regla recomendada en backend

Cuando se registre una nueva version activa:

1. Marcar como inactivos los registros activos anteriores de la misma aplicacion y ambiente.
2. Insertar el nuevo registro con `isActive = true`.

## Tabla sugerida

```sql
CREATE TABLE AppDeployments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AppName NVARCHAR(100) NOT NULL,
    Environment NVARCHAR(50) NOT NULL,
    Version NVARCHAR(50) NOT NULL,
    BuildTime DATETIME2 NULL,
    DeployedAt DATETIME2 NOT NULL,
    DeployedBy NVARCHAR(150) NULL,
    ServerName NVARCHAR(150) NULL,
    Notes NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
```

## Flujo esperado

1. `npm run build:prod-api`
2. Se genera `dist/logistica/browser/assets/version.json`
3. Se copia el build a IIS
4. Se verifica que `C:\logistica\assets\version.json` coincide
5. El script hace `POST /api/app-deployments`
6. El frontend consulta `GET /api/app-deployments/current`

## Logica en frontend

- `localVersion`: `environment.appVersion`
- `serverVersion`: `/assets/version.json`
- `apiVersion`: `GET /api/app-deployments/current`

Estados:

- `local != server`: el cliente necesita actualizar.
- `server != api`: IIS y la auditoria de backend no coinciden.
- `local == server == api`: despliegue consistente.
