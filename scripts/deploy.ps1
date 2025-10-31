# =========================================================
# 🚀 DEPLOY SCRIPT - LOGISTICA ANGULAR APP
# Autor: ChatGPT
# Fecha: 2025-10-31
# =========================================================

# ✅ 1. Mostrar inicio
Write-Host "🚀 Iniciando proceso de build y despliegue..." -ForegroundColor Cyan

# Ir a la carpeta raíz del proyecto
Set-Location "D:\proyectos\logistica\logistica"

# ✅ 2. Actualizar versión
Write-Host "🧩 Ejecutando actualización de versión..." -ForegroundColor Yellow
node .\scripts\update-version.js

# Leer la versión actual del archivo generado
$versionFile = "src\assets\version.json"
$versionData = Get-Content $versionFile | ConvertFrom-Json
$version = $versionData.version
Write-Host "📦 Nueva versión generada: $version" -ForegroundColor Green

# ✅ 3. Compilar proyecto Angular en producción
Write-Host "🛠️ Compilando Angular app en modo producción..." -ForegroundColor Yellow
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en la compilación. Revisa el log anterior." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Compilación completada correctamente." -ForegroundColor Green

# ✅ 4. Agregar cambios a Git
Write-Host "🧾 Preparando commit..." -ForegroundColor Yellow
git add -A

$commitMessage = "🚀 Deploy versión $version"
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ No hay cambios para commitear o ya está actualizado." -ForegroundColor DarkYellow
} else {
    Write-Host "✅ Commit realizado: $commitMessage" -ForegroundColor Green
}

# ✅ 5. Hacer push al repositorio remoto
Write-Host "📤 Subiendo cambios a Git remoto..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push completado correctamente." -ForegroundColor Green
} else {
    Write-Host "⚠️ Hubo un problema al hacer push. Verifica tus credenciales de Git." -ForegroundColor Red
}

# ✅ 6. Finalizar
Write-Host "🎉 DEPLOY FINALIZADO: Versión $version publicada correctamente." -ForegroundColor Cyan
