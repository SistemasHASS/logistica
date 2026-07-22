#requires -Version 5.1
<#
.SYNOPSIS
    Deploy completo de la funcionalidad Cotizacion OC Multiempresa (tablas, SPs, backend y frontend).

.DESCRIPTION
    1. Ejecuta los scripts SQL 741, 742 y 743 en la BD LOGISTICA (en ese orden).
    2. Verifica que LOGISTICA_enviarOCAprobacion y LOGISTICA_reintentarSyncSpring usen ISNULL(oc.idempresa, '000008').
    3. Publica el backend .NET y lo copia a la ruta IIS de la API.
    4. Construye y despliega el frontend Angular usando deploy-full.ps1.

.PARAMETER SqlServer
    Servidor SQL Server (default: localhost).

.PARAMETER Database
    Base de datos (default: LOGISTICA).

.PARAMETER SqlFix741
    Ruta relativa al script SQL 741.

.PARAMETER SqlFix742
    Ruta relativa al script SQL 742.

.PARAMETER SqlFix743
    Ruta relativa al script SQL 743.

.PARAMETER SqlFix744
    Ruta relativa al script SQL 744.

.PARAMETER SqlFix745
    Ruta relativa al script SQL 745.

.PARAMETER SkipSql
    Saltar ejecucion de los scripts SQL.

.PARAMETER Skip741
    Saltar script 741.

.PARAMETER Skip742
    Saltar script 742.

.PARAMETER Skip743
    Saltar script 743.

.PARAMETER BackendSln
    Ruta relativa a la solucion del backend.

.PARAMETER BackendPublishOut
    Carpeta local de salida del publish del backend.

.PARAMETER IisBackendPath
    Ruta destino de la API en IIS. Puede ser local o UNC.

.PARAMETER FrontendConfig
    Configuracion de Angular: production, prod-api o development.

.PARAMETER SkipSql
    Saltar ejecucion del script SQL.

.PARAMETER SkipBackendBuild
    Saltar publish del backend.

.PARAMETER SkipBackendDeploy
    Saltar copia del backend al IIS.

.PARAMETER SkipFrontend
    Saltar build y deploy del frontend.

.PARAMETER RecycleApiAppPool
    Reciclar el app pool de la API local despues de copiar (requiere WebAdministration).

.PARAMETER ApiAppPoolName
    Nombre del app pool de la API.

.EXAMPLE
    .\scripts\deploy-cotizacion-oc-multiempresa.ps1 -SqlServer "srv-bd" -IisBackendPath "\\srv-web\C$\api_logistica" -FrontendConfig prod-api
#>
param(
    [string]$SqlServer = "localhost",
    [string]$Database = "LOGISTICA",
    [string]$SqlFix741 = "..\..\api_logistica\SQL\741_FIX_OC_MULTIEMPRESA.sql",
    [string]$SqlFix742 = "..\..\api_logistica\SQL\742_FIX_SYNC_MULTIEMPRESA_OC.sql",
    [string]$SqlFix743 = "..\..\api_logistica\SQL\743_COTIZACION_OC_MULTIEMPRESA.sql",
    [string]$SqlFix744 = "..\..\api_logistica\SQL\744_FIX_OBTENER_OC_PARA_SINCRONIZAR_IDEMPRESA.sql",
    [string]$SqlFix745 = "..\..\api_logistica\SQL\745_FIX_SINCRONIZAR_OC_CONSOLIDACION_IDEMPRESA.sql",

    [string]$BackendSln = "..\..\api_logistica\api_logistica.sln",
    [string]$BackendPublishOut = "..\..\api_logistica\bin\publish\cotizacion-deploy",
    [string]$IisBackendPath = "\\172.16.20.3\C$\api_logistica",

    [ValidateSet('production','prod-api','development')]
    [string]$FrontendConfig = "prod-api",

    [switch]$SkipSql,
    [switch]$Skip741,
    [switch]$Skip742,
    [switch]$Skip743,
    [switch]$Skip744,
    [switch]$Skip745,
    [switch]$SkipBackendBuild,
    [switch]$SkipBackendDeploy,
    [switch]$SkipFrontend,

    [switch]$RecycleApiAppPool,
    [string]$ApiAppPoolName = "api_logistica"
)

$ErrorActionPreference = "Stop"
$start = Get-Date

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
function Test-CommandAvailable {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Stop-OnError {
    param([string]$Message, [int]$Code = 1)
    Write-Host ""
    Write-Host "ERROR: $Message" -ForegroundColor Red
    Write-Host "Deploy cancelado. Revisa los mensajes anteriores." -ForegroundColor Red
    exit $Code
}

# ------------------------------------------------------------------
# Paso 0: Validar ubicacion base
# ------------------------------------------------------------------
$scriptRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptRoot)) {
    Stop-OnError "No se pudo determinar la carpeta del script. Ejecutalo desde un archivo .ps1."
}

$baseRoot = Split-Path -Parent $scriptRoot
$fullSql741 = Join-Path $baseRoot $SqlFix741
$fullSql742 = Join-Path $baseRoot $SqlFix742
$fullSql743 = Join-Path $baseRoot $SqlFix743
$fullSql744 = Join-Path $baseRoot $SqlFix744
$fullSql745 = Join-Path $baseRoot $SqlFix745
$fullBackendSln = Join-Path $baseRoot $BackendSln
$fullBackendPublishOut = Join-Path $baseRoot $BackendPublishOut

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  DEPLOY COTIZACION OC MULTIEMPRESA" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  SQL Server:        $SqlServer" -ForegroundColor Cyan
Write-Host "  Base de datos:     $Database" -ForegroundColor Cyan
Write-Host "  SQL 741:           $fullSql741" -ForegroundColor Cyan
Write-Host "  SQL 742:           $fullSql742" -ForegroundColor Cyan
Write-Host "  SQL 743:           $fullSql743" -ForegroundColor Cyan
Write-Host "  SQL 744:           $fullSql744" -ForegroundColor Cyan
Write-Host "  SQL 745:           $fullSql745" -ForegroundColor Cyan
Write-Host "  Backend:           $fullBackendSln" -ForegroundColor Cyan
Write-Host "  Publish backend:   $fullBackendPublishOut" -ForegroundColor Cyan
Write-Host "  IIS backend:       $IisBackendPath" -ForegroundColor Cyan
Write-Host "  Frontend config:   $FrontendConfig" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------
# Paso 1: Ejecutar scripts SQL
# ------------------------------------------------------------------
function Invoke-SqlScript {
    param([string]$ScriptPath, [string]$Label)
    if (-not (Test-Path $ScriptPath)) {
        Stop-OnError "No se encontro el script SQL ($Label): $ScriptPath"
    }

    if (-not (Test-CommandAvailable "sqlcmd")) {
        Stop-OnError "sqlcmd no esta en el PATH. Instala las herramientas de SQL Server o ejecuta el script manualmente."
    }

    $sqlArgs = @(
        "-S", $SqlServer,
        "-d", $Database,
        "-i", '"' + $ScriptPath + '"',
        "-b", "-I"
    )

    Write-Host "  sqlcmd ($Label) $([string]::Join(' ', $sqlArgs))" -ForegroundColor DarkGray

    $process = Start-Process -FilePath "sqlcmd" -ArgumentList $sqlArgs -NoNewWindow -Wait -PassThru
    if ($process.ExitCode -ne 0) {
        Stop-OnError "El script $Label finalizo con errores (codigo $($process.ExitCode)). Revisa el output de sqlcmd."
    }
    Write-Host "  OK - $Label ejecutado" -ForegroundColor Green
}

if (-not $SkipSql) {
    Write-Host "[1/5] Ejecutando scripts SQL..." -ForegroundColor Yellow

    if (-not $Skip741) { Invoke-SqlScript -ScriptPath $fullSql741 -Label "741_FIX_OC_MULTIEMPRESA" }
    if (-not $Skip742) { Invoke-SqlScript -ScriptPath $fullSql742 -Label "742_FIX_SYNC_MULTIEMPRESA_OC" }
    if (-not $Skip743) { Invoke-SqlScript -ScriptPath $fullSql743 -Label "743_COTIZACION_OC_MULTIEMPRESA" }
    if (-not $Skip744) { Invoke-SqlScript -ScriptPath $fullSql744 -Label "744_FIX_OBTENER_OC_PARA_SINCRONIZAR_IDEMPRESA" }
    if (-not $Skip745) { Invoke-SqlScript -ScriptPath $fullSql745 -Label "745_FIX_SINCRONIZAR_OC_CONSOLIDACION_IDEMPRESA" }

    # Verificacion: LOGISTICA_enviarOCAprobacion y reintentarSyncSpring deben usar oc.idempresa
    Write-Host "  Verificando que no haya idempresa hardcodeado en sync Spring..." -ForegroundColor DarkGray
    $verifySql = @"
USE [$Database];
DECLARE @bad INT = 0;
SELECT @bad += CASE WHEN m.definition LIKE '%idempresa%' AND m.definition NOT LIKE '%ISNULL(oc.idempresa%' THEN 1 ELSE 0 END
FROM sys.sql_modules m
INNER JOIN sys.objects o ON o.object_id = m.object_id
WHERE o.name IN ('LOGISTICA_enviarOCAprobacion', 'LOGISTICA_reintentarSyncSpring')
  AND m.definition LIKE '%idempresa%'
  AND m.definition NOT LIKE '%ISNULL(oc.idempresa, ''000008'')%';

IF @bad > 0
BEGIN
    RAISERROR ('ERROR: LOGISTICA_enviarOCAprobacion o reintentarSyncSpring no usan ISNULL(oc.idempresa, ''000008'')', 16, 1);
END
ELSE
BEGIN
    PRINT 'OK: Sync Spring usa ISNULL(oc.idempresa, ''000008'')';
END
"@
    $verifyPath = [System.IO.Path]::GetTempFileName() + ".sql"
    Set-Content -Path $verifyPath -Value $verifySql -Encoding UTF8
    $verifyArgs = @("-S", $SqlServer, "-d", $Database, "-i", '"' + $verifyPath + '"', "-b")
    $vProcess = Start-Process -FilePath "sqlcmd" -ArgumentList $verifyArgs -NoNewWindow -Wait -PassThru
    Remove-Item $verifyPath -Force -ErrorAction SilentlyContinue
    if ($vProcess.ExitCode -ne 0) {
        Stop-OnError "Verificacion de idempresa fallo. Revisa que los SPs de sync usen ISNULL(oc.idempresa, '000008')."
    }

    Write-Host "  OK - Verificacion de idempresa exitosa" -ForegroundColor Green
} else {
    Write-Host "[1/5] Saltando SQL (-SkipSql)" -ForegroundColor DarkGray
}
Write-Host ""

# ------------------------------------------------------------------
# Paso 2: Publicar backend .NET
# ------------------------------------------------------------------
if (-not $SkipBackendBuild) {
    Write-Host "[2/5] Publicando backend .NET..." -ForegroundColor Yellow

    if (-not (Test-Path $fullBackendSln)) {
        Stop-OnError "No se encontro la solucion del backend: $fullBackendSln"
    }

    if (-not (Test-CommandAvailable "dotnet")) {
        Stop-OnError "dotnet CLI no esta en el PATH."
    }

    if (Test-Path $fullBackendPublishOut) {
        Remove-Item -Path $fullBackendPublishOut -Recurse -Force -ErrorAction SilentlyContinue
    }

    $publishArgs = @(
        "publish", '"' + $fullBackendSln + '"',
        "-c", "Release",
        "-o", '"' + $fullBackendPublishOut + '"',
        "--self-contained", "false"
    )

    Write-Host "  dotnet $([string]::Join(' ', $publishArgs))" -ForegroundColor DarkGray

    $process = Start-Process -FilePath "dotnet" -ArgumentList $publishArgs -NoNewWindow -Wait -PassThru
    if ($process.ExitCode -ne 0) {
        Stop-OnError "dotnet publish finalizo con errores (codigo $($process.ExitCode))."
    }

    if (-not (Test-Path $fullBackendPublishOut)) {
        Stop-OnError "No se genero la carpeta de publicacion del backend."
    }

    Write-Host "  OK - Backend publicado en $fullBackendPublishOut" -ForegroundColor Green
} else {
    Write-Host "[2/5] Saltando build del backend (-SkipBackendBuild)" -ForegroundColor DarkGray
}
Write-Host ""

# ------------------------------------------------------------------
# Paso 3: Copiar backend al IIS
# ------------------------------------------------------------------
if (-not $SkipBackendDeploy) {
    Write-Host "[3/5] Desplegando backend a IIS..." -ForegroundColor Yellow

    if (-not (Test-Path $fullBackendPublishOut)) {
        Stop-OnError "No existe la carpeta de publicacion del backend. Ejecuta sin -SkipBackendBuild."
    }

    if (-not (Test-Path $IisBackendPath)) {
        Stop-OnError "No se puede acceder a la ruta IIS del backend: $IisBackendPath. Verifica red/permisos."
    }

    # Backup
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backendBackup = "$IisBackendPath`_backup_$timestamp"
    Write-Host "  Creando backup: $backendBackup" -ForegroundColor DarkGray
    Copy-Item -Path $IisBackendPath -Destination $backendBackup -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  OK - Backup creado" -ForegroundColor Green

    # Copiar archivos del publish (excluir archivos de config sensibles si existen)
    Write-Host "  Copiando archivos del publish..." -ForegroundColor DarkGray
    Get-ChildItem -Path $fullBackendPublishOut | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $IisBackendPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  OK - Backend desplegado en $IisBackendPath" -ForegroundColor Green

    # Reciclar app pool local si se solicito
    if ($RecycleApiAppPool -and -not [string]::IsNullOrWhiteSpace($ApiAppPoolName)) {
        try {
            Import-Module WebAdministration -ErrorAction Stop
            if (Get-ChildItem IIS:\AppPools | Where-Object { $_.Name -eq $ApiAppPoolName }) {
                Write-Host "  Reciclando app pool: $ApiAppPoolName" -ForegroundColor DarkGray
                Restart-WebAppPool -Name $ApiAppPoolName
                Write-Host "  OK - App pool reciclado" -ForegroundColor Green
            } else {
                Write-Host "  ADVERTENCIA: No existe el app pool '$ApiAppPoolName'" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  ADVERTENCIA: No se pudo reciclar el app pool. Reinicialo manualmente." -ForegroundColor Yellow
            Write-Host "    Detalle: $_" -ForegroundColor Yellow
        }
    } elseif ($RecycleApiAppPool) {
        Write-Host "  ADVERTENCIA: RecycleApiAppPool esta activo pero no se definio ApiAppPoolName" -ForegroundColor Yellow
    }
} else {
    Write-Host "[3/5] Saltando despliegue del backend (-SkipBackendDeploy)" -ForegroundColor DarkGray
}
Write-Host ""

# ------------------------------------------------------------------
# Paso 4: Build y deploy del frontend
# ------------------------------------------------------------------
if (-not $SkipFrontend) {
    Write-Host "[4/5] Construyendo y desplegando frontend..." -ForegroundColor Yellow

    $deployFull = Join-Path $scriptRoot "deploy-full.ps1"
    if (-not (Test-Path $deployFull)) {
        Stop-OnError "No se encontro deploy-full.ps1 en $deployFull"
    }

    & $deployFull -Configuration $FrontendConfig
    if ($LASTEXITCODE -ne 0) {
        Stop-OnError "El deploy del frontend finalizo con errores."
    }

    Write-Host "  OK - Frontend desplegado" -ForegroundColor Green
} else {
    Write-Host "[4/5] Saltando deploy del frontend (-SkipFrontend)" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------
# Resumen
# ------------------------------------------------------------------
$elapsed = (Get-Date) - $start
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOY COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Duracion: $($elapsed.ToString('hh\:mm\:ss'))" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pasos manuales recomendados:" -ForegroundColor Cyan
Write-Host "  1. Verifica que la API responde: GET /api/health o similar" -ForegroundColor White
Write-Host "  2. Limpia cache del navegador (Ctrl+Shift+Supr)" -ForegroundColor White
Write-Host "  3. Prueba exportar/importar cotizacion en Consolidacion > Compras" -ForegroundColor White
Write-Host "  4. Verifica que las lineas congeladas no aparezcan en el listado" -ForegroundColor White
