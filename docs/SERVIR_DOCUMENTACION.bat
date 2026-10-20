@echo off
REM ============================================================
REM  Servidor local de documentacion - Sistema Logistica
REM  Orden de preferencia:
REM    1. VisorDocumentacion.exe (autocontenido, recomendado)
REM    2. python -m http.server (si hay Python instalado)
REM    3. servidor_docs.ps1 (PowerShell, sin dependencias)
REM  Para detener: cerrar la ventana del servidor.
REM ============================================================
cd /d "%~dp0"

REM Si ya esta corriendo, solo abrir el portal
netstat -ano | findstr ":8791" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    start "" http://localhost:8791/
    exit /b
)

if exist "%~dp0..\VisorDocumentacion.exe" (
    start "VisorDocs" "%~dp0..\VisorDocumentacion.exe"
    exit /b
)
if exist "%~dp0VisorDocumentacion.exe" (
    start "VisorDocs" "%~dp0VisorDocumentacion.exe"
    exit /b
)

python --version >nul 2>&1
if %errorlevel%==0 (
    start "ServidorDocs" /min python "%~dp0servidor_docs.py"
    timeout /t 2 /nobreak >nul
    start "" http://localhost:8791/
    exit /b
)

powershell -ExecutionPolicy Bypass -File "%~dp0servidor_docs.ps1"
