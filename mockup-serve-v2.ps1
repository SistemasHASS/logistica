$port = 4600

# 1. Matar proceso que use el puerto
$proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($proc) {
    Write-Host "Liberando puerto $port (PID $proc)..." -ForegroundColor Yellow
    Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# 2. Levantar servidor Node.js propio
Write-Host "Servidor mockup v2 en http://localhost:$port/mockup-consolidacion-v2" -ForegroundColor Green
node mockup-server-v2.js
