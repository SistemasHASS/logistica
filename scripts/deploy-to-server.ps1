# Script para copiar el build al servidor de produccion
# Uso: .\deploy-to-server.ps1

param(
    # [string]$ServerPath = "\\172.16.20.3\C$\logistica",
    [string]$ServerPath = "\\172.16.20.3\logistica",
    [string]$LocalBuildPath = "dist\logistica\browser"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY A SERVIDOR DE PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el build local
if (-not (Test-Path $LocalBuildPath)) {
    Write-Host "ERROR: No se encontro el build en $LocalBuildPath" -ForegroundColor Red
    Write-Host "Ejecuta primero: npm run build:prod-api" -ForegroundColor Yellow
    exit 1
}

# Verificar version local
$versionFile = Join-Path $LocalBuildPath "assets\version.json"
if (Test-Path $versionFile) {
    $versionContent = Get-Content $versionFile -Raw | ConvertFrom-Json
    Write-Host "Version a desplegar: $($versionContent.version)" -ForegroundColor Green
    Write-Host "Fecha de build: $($versionContent.buildTime)" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "ADVERTENCIA: No se encontro version.json" -ForegroundColor Yellow
}

# Preguntar confirmacion
Write-Host "Servidor destino: $ServerPath" -ForegroundColor Cyan
$confirm = Read-Host "Deseas continuar con el deploy? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Deploy cancelado" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Iniciando deploy..." -ForegroundColor Cyan

try {
    # Verificar acceso al servidor
    if (-not (Test-Path $ServerPath)) {
        Write-Host "ERROR: No se puede acceder a $ServerPath" -ForegroundColor Red
        Write-Host "Verifica que:" -ForegroundColor Yellow
        Write-Host "  1. Estas conectado al servidor via RDP o VPN" -ForegroundColor Yellow
        Write-Host "  2. Tienes permisos de escritura en la carpeta" -ForegroundColor Yellow
        Write-Host "  3. La ruta compartida esta habilitada (C$)" -ForegroundColor Yellow
        exit 1
    }

    # Crear backup de la version actual en el servidor
    $backupPath = Join-Path $ServerPath "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Write-Host "Creando backup en: $backupPath" -ForegroundColor Yellow
    
    # Solo hacer backup de archivos criticos
    $criticalFiles = @("index.html", "assets\version.json")
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    
    foreach ($file in $criticalFiles) {
        $sourcePath = Join-Path $ServerPath $file
        if (Test-Path $sourcePath) {
            $destPath = Join-Path $backupPath $file
            $destDir = Split-Path $destPath -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item $sourcePath $destPath -Force
        }
    }
    Write-Host "  OK - Backup creado" -ForegroundColor Green
    Write-Host ""

    # Copiar archivos al servidor
    Write-Host "Copiando archivos al servidor..." -ForegroundColor Cyan
    
    # Copiar todo el contenido
    Copy-Item -Path "$LocalBuildPath\*" -Destination $ServerPath -Recurse -Force
    
    Write-Host "  OK - Archivos copiados" -ForegroundColor Green
    Write-Host ""

    # Verificar que version.json se copio correctamente
    $serverVersionFile = Join-Path $ServerPath "assets\version.json"
    if (Test-Path $serverVersionFile) {
        $serverVersion = Get-Content $serverVersionFile -Raw | ConvertFrom-Json
        Write-Host "Version en servidor: $($serverVersion.version)" -ForegroundColor Green
        Write-Host "Fecha en servidor: $($serverVersion.buildTime)" -ForegroundColor Green
        
        # Comparar versiones
        if ($versionContent.version -eq $serverVersion.version) {
            Write-Host ""
            Write-Host "EXITO: Deploy completado correctamente" -ForegroundColor Green
            Write-Host "La version $($serverVersion.version) esta ahora en produccion" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "ADVERTENCIA: Las versiones no coinciden" -ForegroundColor Yellow
            Write-Host "  Local: $($versionContent.version)" -ForegroundColor Yellow
            Write-Host "  Servidor: $($serverVersion.version)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ADVERTENCIA: No se pudo verificar version.json en el servidor" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  DEPLOY FINALIZADO" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Abre el navegador en el servidor" -ForegroundColor White
    Write-Host "  2. Limpia cache (Ctrl + Shift + Delete)" -ForegroundColor White
    Write-Host "  3. Accede a la aplicacion" -ForegroundColor White
    Write-Host "  4. Verifica que la version sea correcta" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "ERROR durante el deploy: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Si el error es de acceso denegado:" -ForegroundColor Yellow
    Write-Host "  1. Conectate al servidor via Escritorio Remoto" -ForegroundColor White
    Write-Host "  2. Ejecuta este script desde el servidor" -ForegroundColor White
    Write-Host "  3. O copia manualmente desde dist\logistica\browser a C:\logistica" -ForegroundColor White
    exit 1
}
