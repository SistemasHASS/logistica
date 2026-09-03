@echo off
chcp 65001 >nul
title Detener Mockup OC +10%

echo Buscando proceso del servidor en el puerto 8080...

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $p = Get-NetTCPConnection -LocalPort 8080 -ErrorAction Stop | Select-Object -First 1 -ExpandProperty OwningProcess; if ($p) { Stop-Process -Id $p -Force -ErrorAction Stop; Write-Host 'Servidor detenido correctamente.' } else { Write-Host 'No se encontro proceso en el puerto 8080.' } } catch { Write-Host 'Error o no hay servidor activo en el puerto 8080.' }"

echo.
pause
