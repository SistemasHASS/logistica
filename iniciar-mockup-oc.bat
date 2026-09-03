@echo off
chcp 65001 >nul
title Iniciar Mockup OC +10%
cd /d "C:\Users\jonathan.marquina\Documents\Jonathan Marquina\proyectos\backup\10.02.26\logistica"

echo Iniciando servidor en http://localhost:8080/mockup/
echo.

start "Servidor Mockup OC" cmd /k "python -m http.server 8080"

timeout /t 2 /nobreak >nul

start "" "http://localhost:8080/mockup/"

echo Navegador abierto. El servidor esta corriendo en su propia ventana.
echo Cierra la ventana "Servidor Mockup OC" para detenerlo o usa detener-mockup-oc.bat.
echo.
pause
