# Libera el puerto 4500 si está ocupado
$proc = Get-NetTCPConnection -LocalPort 4500 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($proc) { Stop-Process -Id $proc -Force; Write-Host "Puerto 4500 liberado" }

# Abre el mockup en el navegador
Start-Process "http://localhost:4500/mockup-consolidacion-corporativa.html"

# Levanta el servidor en puerto 4500
npx serve -p 4500 .
