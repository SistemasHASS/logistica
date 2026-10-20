# Servidor de documentacion - Sistema Logistica (sin dependencias)
# Requiere solo PowerShell (incluido en Windows). Sirve docs/ en localhost:8791
$port = 8791
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
# Si el script esta dentro de docs/, servir la raiz del proyecto
# (asi los documentos sueltos de la raiz tambien son accesibles)
$proj = Split-Path -Parent $here
if (Test-Path (Join-Path $proj 'docs\manuales-roles\index.html')) {
    $root = $proj; $entry = 'docs/manuales-roles/index.html'
} else {
    $root = $here; $entry = 'manuales-roles/index.html'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
} catch {
    Start-Process "http://localhost:$port/$entry"
    exit
}
Start-Process "http://localhost:$port/$entry"
# Compatibilidad con URLs antiguas: /manuales-roles/... -> /docs/manuales-roles/...
Write-Host "============================================================"
Write-Host "  VISOR DE DOCUMENTACION - SISTEMA LOGISTICA (PowerShell)"
Write-Host "  http://localhost:$port/$entry"
Write-Host "  Cierra esta ventana para detener el servicio."
Write-Host "============================================================"

$mime = @{
    '.html' = 'text/html; charset=utf-8'; '.htm' = 'text/html; charset=utf-8'
    '.css'  = 'text/css';                 '.js'  = 'application/javascript'
    '.png'  = 'image/png';  '.jpg' = 'image/jpeg'; '.svg' = 'image/svg+xml'
    '.md'   = 'text/plain; charset=utf-8'; '.sql' = 'text/plain; charset=utf-8'
    '.py'   = 'text/plain; charset=utf-8'; '.json' = 'application/json'
    '.mp4'  = 'video/mp4';  '.pdf' = 'application/pdf'
    '.docx' = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    '.xlsx' = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

# Pool de runspaces: atiende peticiones en paralelo (el navegador abre
# varias conexiones simultaneas para imagenes, js, etc.)
$pool = [runspacefactory]::CreateRunspacePool(1, 16)
$pool.Open()

$serve = {
    param($ctx, $root, $mime, $entry)
    try {
        $rel = [Uri]::UnescapeDataString($ctx.Request.Url.LocalPath).TrimStart('/') -replace '/', '\'
        if ($rel -eq '') { $rel = $entry -replace '/', '\' }
        $file = Join-Path $root $rel

        if (Test-Path -LiteralPath $file -PathType Leaf) {
            $bytes = [IO.File]::ReadAllBytes($file)
            $ext = [IO.Path]::GetExtension($file).ToLower()
            $ctx.Response.ContentType = $(if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' })
            $ctx.Response.ContentLength64 = $bytes.Length
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } elseif (Test-Path -LiteralPath $file -PathType Container) {
            $base = $ctx.Request.Url.LocalPath.TrimEnd('/')
            $items = (Get-ChildItem -LiteralPath $file | ForEach-Object {
                "<li><a href='$base/$($_.Name)'>$($_.Name)</a></li>" }) -join ''
            $html = "<html><body style='font-family:sans-serif'><h2>$base/</h2><ul>$items</ul></body></html>"
            $bytes = [Text.Encoding]::UTF8.GetBytes($html)
            $ctx.Response.ContentType = 'text/html; charset=utf-8'
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } elseif ($entry.StartsWith('docs/') -and $rel.StartsWith('manuales-roles\')) {
            # Compatibilidad: /manuales-roles/... -> /docs/manuales-roles/...
            $ctx.Response.StatusCode = 302
            $ctx.Response.Headers.Add('Location', '/docs/' + ($rel -replace '\\','/'))
        } else {
            $ctx.Response.StatusCode = 404
        }
    } catch {}
    try { $ctx.Response.Close() } catch {}
}

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $ps = [powershell]::Create()
    $ps.RunspacePool = $pool
    [void]$ps.AddScript($serve).AddArgument($ctx).AddArgument($root).AddArgument($mime).AddArgument($entry)
    [void]$ps.BeginInvoke()
}
