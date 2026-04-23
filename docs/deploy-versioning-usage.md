# Deploy con Registro de Versiones

El script `scripts/deploy-to-server.ps1` registra automaticamente el deploy en la API de versionado al finalizar la copia del build.

## Datos que envia

- `appName`: se toma de `package.json` si no lo pasas manualmente
- `environment`: por defecto `production`
- `version`: se lee desde `dist/.../assets/version.json`
- `buildTime`: se lee desde `version.json`
- `deployedAt`: fecha/hora actual del deploy
- `deployedBy`: usuario actual de Windows
- `serverName`: equipo desde donde se ejecuto el script
- `notes`: texto libre, por defecto `Deploy IIS automatizado`

## Uso normal

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-to-server.ps1
```

## Otra aplicacion

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-to-server.ps1 `
  -ServerPath "\\172.16.20.3\C$\portal-proveedores" `
  -LocalBuildPath "dist\portal-proveedores\browser" `
  -AppName "portal-proveedores" `
  -EnvironmentName "production"
```

## Otro ambiente

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-to-server.ps1 `
  -EnvironmentName "qa" `
  -ServerPath "\\172.16.20.3\C$\portal-proveedores-qa"
```

## Personalizar notas

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-to-server.ps1 `
  -Notes "Deploy luego de correccion urgente de login"
```

## Omitir registro en API

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-to-server.ps1 -SkipApiRegister
```
