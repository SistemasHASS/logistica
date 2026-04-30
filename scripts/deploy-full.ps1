# Script todo-en-uno: incrementa version, build, copia a IIS y registra en la API seleccionada.
# Uso:
#   .\scripts\deploy-full.ps1                    # default: API Logistica
#   .\scripts\deploy-full.ps1 -VersionApi MAESTRA
#   .\scripts\deploy-full.ps1 -SkipBuild         # si ya hiciste el build manual
#   .\scripts\deploy-full.ps1 -SkipVersionBump   # si NO quieres incrementar la version

param(
    [ValidateSet('LOGISTICA','MAESTRA')]
    [string]$VersionApi = "LOGISTICA",
    [ValidateSet('production','prod-api','development')]
    [string]$Configuration = "prod-api",
    [switch]$SkipBuild,
    [switch]$SkipVersionBump,
    [switch]$SkipApiRegister
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  DEPLOY FULL (build + deploy + api)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Configuracion build: $Configuration" -ForegroundColor Cyan
Write-Host "  API de versionado:   $VersionApi" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------------------------
# Paso 1: Incrementar la version (package.json + environment*.ts + version.json)
# ---------------------------------------------------------------
if (-not $SkipVersionBump) {
    Write-Host "[1/3] Incrementando version..." -ForegroundColor Yellow
    node scripts/update-version.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Fallo el incremento de version" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} else {
    Write-Host "[1/3] Saltando incremento de version (-SkipVersionBump)" -ForegroundColor DarkGray
    Write-Host ""
}

# ---------------------------------------------------------------
# Paso 2: Build de Angular
# ---------------------------------------------------------------
if (-not $SkipBuild) {
    Write-Host "[2/3] Ejecutando ng build --configuration=$Configuration..." -ForegroundColor Yellow
    npx ng build --configuration=$Configuration
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Fallo el build de Angular" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} else {
    Write-Host "[2/3] Saltando build (-SkipBuild)" -ForegroundColor DarkGray
    Write-Host ""
}

# ---------------------------------------------------------------
# Paso 3: Deploy al IIS
# (El registro en API ya lo hizo register-deployment.js despues del ng build.
#  Por eso pasamos -SkipApiRegister aqui para no duplicar el registro.)
# ---------------------------------------------------------------
Write-Host "[3/3] Copiando archivos al IIS..." -ForegroundColor Yellow
$deployArgs = @("-VersionApi", $VersionApi, "-SkipApiRegister")

& "$PSScriptRoot\deploy-to-server.ps1" @deployArgs
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo el deploy al IIS" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOY FULL COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
