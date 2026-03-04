# 📘 Guía Completa: Publicar Aplicación Angular en IIS

Esta guía te enseña paso a paso cómo publicar una aplicación Angular en Internet Information Services (IIS) en Windows Server.

---

## 📋 Requisitos Previos

### En el Servidor Windows

- ✅ Windows Server (2016, 2019, 2022) o Windows 10/11 Pro
- ✅ Permisos de Administrador
- ✅ IIS instalado
- ✅ .NET Framework instalado (si usas backend .NET)

---

## 🔧 Parte 1: Instalación y Configuración de IIS

### Paso 1.1: Instalar IIS

**En Windows Server:**

1. Abre **Administrador del servidor**
2. Clic en **Administrar** → **Agregar roles y características**
3. Siguiente hasta **Roles de servidor**
4. Marca **Servidor web (IIS)**
5. Clic en **Agregar características**
6. Siguiente → Siguiente → Siguiente
7. En **Servicios de rol**, asegúrate de marcar:
   - ✅ Servidor web
   - ✅ Características HTTP comunes (todas)
   - ✅ Desarrollo de aplicaciones → ASP.NET (si usas .NET)
   - ✅ Administración → Consola de administración de IIS
8. Clic en **Instalar**
9. Espera a que termine la instalación

**En Windows 10/11:**

1. Abre **Panel de Control**
2. **Programas** → **Activar o desactivar las características de Windows**
3. Marca **Internet Information Services**
4. Expande y marca:
   - ✅ Servicios World Wide Web
   - ✅ Características HTTP comunes (todas)
   - ✅ Herramientas de administración web
5. Clic en **Aceptar**
6. Espera a que se instale

### Paso 1.2: Verificar Instalación de IIS

1. Abre el navegador
2. Navega a: `http://localhost`
3. Deberías ver la página de bienvenida de IIS

---

## 🌐 Parte 2: Preparar la Aplicación Angular

### Paso 2.1: Generar Build de Producción

**En tu máquina de desarrollo:**

1. Abre terminal en la carpeta del proyecto
2. Ejecuta:
   ```bash
   npm run build:prod-api
   ```
3. Espera a que termine el build
4. Verifica que se creó la carpeta: `dist/logistica/browser`

### Paso 2.2: Crear archivo web.config

El archivo `web.config` es **CRÍTICO** para que Angular funcione en IIS.

**Crea el archivo:** `dist/logistica/browser/web.config`

**Contenido:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    
    <!-- Reescritura de URLs para Angular routing -->
    <rewrite>
      <rules>
        <rule name="Angular Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- Tipos MIME para archivos estáticos -->
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
      <mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
      <mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" />
    </staticContent>
    
    <!-- Manejo de errores 404 -->
    <httpErrors errorMode="Custom" existingResponse="Replace">
      <remove statusCode="404" subStatusCode="-1" />
      <error statusCode="404" path="/index.html" responseMode="ExecuteURL" />
    </httpErrors>
    
    <!-- Headers de caché -->
    <httpProtocol>
      <customHeaders>
        <add name="Cache-Control" value="no-cache, no-store, must-revalidate" />
        <add name="Pragma" value="no-cache" />
        <add name="Expires" value="0" />
      </customHeaders>
    </httpProtocol>
    
  </system.webServer>
</configuration>
```

**IMPORTANTE:** Si el servidor no tiene instalado el módulo **URL Rewrite**, usa esta versión simplificada:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <httpErrors errorMode="Custom" existingResponse="Replace">
      <remove statusCode="404" subStatusCode="-1" />
      <error statusCode="404" path="/index.html" responseMode="ExecuteURL" />
    </httpErrors>
  </system.webServer>
</configuration>
```

### Paso 2.3: Copiar Archivos al Servidor

**Opción A: Copiar via Escritorio Remoto**

1. Conéctate al servidor via RDP (Escritorio Remoto)
2. Copia la carpeta `dist/logistica/browser` completa
3. Pégala en el servidor (ej: `C:\inetpub\wwwroot\logistica`)

**Opción B: Copiar via Red**

1. Desde tu PC, accede a: `\\IP_SERVIDOR\C$\inetpub\wwwroot`
2. Crea una carpeta: `logistica`
3. Copia todo el contenido de `dist/logistica/browser` dentro

---

## 🏗️ Parte 3: Crear Sitio en IIS

### Paso 3.1: Abrir IIS Manager

1. En el servidor, presiona `Win + R`
2. Escribe: `inetmgr`
3. Presiona Enter
4. Se abre **Administrador de Internet Information Services (IIS)**

### Paso 3.2: Crear Nuevo Sitio Web

1. En el panel izquierdo, expande el servidor
2. Clic derecho en **Sitios**
3. Selecciona **Agregar sitio web...**

### Paso 3.3: Configurar el Sitio

**Configuración básica:**

| Campo | Valor | Descripción |
|-------|-------|-------------|
| **Nombre del sitio** | `LogisticaFront` | Nombre interno del sitio |
| **Grupo de aplicaciones** | `LogisticaFront` (crear nuevo) | Pool de aplicaciones |
| **Ruta de acceso física** | `C:\logistica` | Carpeta con los archivos |
| **Tipo** | `https` | Protocolo seguro |
| **Dirección IP** | `Todas las no asignadas` | O IP específica |
| **Puerto** | `7019` | Puerto personalizado |
| **Nombre de host** | (vacío o dominio) | Opcional |
| **Certificado SSL** | Selecciona certificado | Requerido para HTTPS |

**Pasos detallados:**

1. **Nombre del sitio:** `LogisticaFront`
2. **Grupo de aplicaciones:** 
   - Clic en **Seleccionar...**
   - Clic en **Nuevo...**
   - Nombre: `LogisticaFront`
   - Versión de .NET CLR: `Sin código administrado` (para Angular)
   - Modo de canalización: `Integrado`
   - Clic en **Aceptar**
3. **Ruta de acceso física:** 
   - Clic en **...**
   - Navega a `C:\logistica`
   - Clic en **Aceptar**
4. **Enlace:**
   - Tipo: `https`
   - Dirección IP: `Todas las no asignadas`
   - Puerto: `7019`
   - Certificado SSL: Selecciona tu certificado
5. Clic en **Aceptar**

### Paso 3.4: Configurar Grupo de Aplicaciones

1. En IIS Manager, clic en **Grupos de aplicaciones**
2. Busca `LogisticaFront`
3. Clic derecho → **Configuración avanzada...**
4. Configura:
   - **Versión de .NET CLR:** `Sin código administrado`
   - **Modo de canalización:** `Integrado`
   - **Habilitar aplicaciones de 32 bits:** `False`
   - **Iniciar automáticamente:** `True`
5. Clic en **Aceptar**

---

## 🔐 Parte 4: Configurar Permisos

### Paso 4.1: Permisos de Carpeta

1. En el servidor, navega a `C:\logistica`
2. Clic derecho → **Propiedades**
3. Pestaña **Seguridad**
4. Clic en **Editar...**
5. Clic en **Agregar...**
6. Escribe: `IIS_IUSRS`
7. Clic en **Comprobar nombres**
8. Clic en **Aceptar**
9. Marca los permisos:
   - ✅ Lectura y ejecución
   - ✅ Mostrar el contenido de la carpeta
   - ✅ Lectura
10. Clic en **Aceptar** → **Aceptar**

### Paso 4.2: Permisos del Grupo de Aplicaciones

1. Repite el proceso anterior
2. Agrega también: `IIS APPPOOL\LogisticaFront`
3. Mismos permisos de lectura

---

## 🔧 Parte 5: Instalar URL Rewrite (Recomendado)

El módulo URL Rewrite es necesario para que Angular routing funcione correctamente.

### Paso 5.1: Descargar URL Rewrite

1. Descarga desde: https://www.iis.net/downloads/microsoft/url-rewrite
2. O busca: "IIS URL Rewrite Module 2.1"

### Paso 5.2: Instalar

1. Ejecuta el instalador descargado
2. Acepta los términos
3. Clic en **Instalar**
4. Espera a que termine
5. Clic en **Finalizar**
6. **Reinicia IIS:**
   ```powershell
   iisreset
   ```

---

## 🚀 Parte 6: Iniciar y Probar el Sitio

### Paso 6.1: Iniciar el Sitio

1. En IIS Manager, ve a **Sitios**
2. Selecciona `LogisticaFront`
3. En el panel derecho, clic en **Iniciar**
4. El estado debe cambiar a **Iniciado**

### Paso 6.2: Probar Localmente en el Servidor

1. Abre el navegador en el servidor
2. Navega a: `https://localhost:7019`
3. Deberías ver tu aplicación Angular

### Paso 6.3: Probar desde Otra Máquina

1. Desde tu PC, abre el navegador
2. Navega a: `https://IP_SERVIDOR:7019`
3. Ejemplo: `https://172.16.20.3:7019`

---

## 🔥 Parte 7: Configurar Firewall

Si no puedes acceder desde otra máquina, necesitas abrir el puerto en el firewall.

### Paso 7.1: Abrir Puerto en Firewall de Windows

1. En el servidor, abre **Firewall de Windows Defender con seguridad avanzada**
2. Clic en **Reglas de entrada**
3. Clic en **Nueva regla...**
4. Tipo de regla: **Puerto**
5. Siguiente
6. Protocolo: **TCP**
7. Puerto local específico: `7019`
8. Siguiente
9. Acción: **Permitir la conexión**
10. Siguiente
11. Perfil: Marca todos (Dominio, Privado, Público)
12. Siguiente
13. Nombre: `IIS - LogisticaFront - Puerto 7019`
14. Finalizar

---

## 🛠️ Parte 8: Solución de Problemas Comunes

### Error 500 - Internal Server Error

**Causa:** Configuración incorrecta de `web.config`

**Solución:**
1. Verifica que `web.config` existe en `C:\logistica`
2. Revisa los logs de IIS en: `C:\inetpub\logs\LogFiles`
3. Si el error menciona "URL Rewrite", instala el módulo o usa la versión simplificada del `web.config`

### Error 404 - Not Found

**Causa:** Rutas de Angular no funcionan

**Solución:**
1. Verifica que `web.config` tiene la configuración de reescritura de URLs
2. Instala URL Rewrite Module
3. Reinicia IIS: `iisreset`

### Error 403 - Forbidden

**Causa:** Permisos insuficientes

**Solución:**
1. Verifica permisos de `IIS_IUSRS` en la carpeta
2. Verifica permisos de `IIS APPPOOL\LogisticaFront`
3. Asegúrate que el grupo de aplicaciones esté iniciado

### La aplicación no carga archivos CSS/JS

**Causa:** Tipos MIME no configurados

**Solución:**
1. Verifica que `web.config` tiene la sección `<staticContent>`
2. O agrega los tipos MIME manualmente en IIS:
   - Selecciona el sitio
   - Doble clic en **Tipos MIME**
   - Agrega los tipos necesarios

### No puedo acceder desde otra máquina

**Causa:** Firewall bloqueando el puerto

**Solución:**
1. Abre el puerto en el Firewall de Windows (ver Parte 7)
2. Verifica que el sitio está iniciado en IIS
3. Verifica que el certificado SSL es válido

---

## 📝 Parte 9: Actualizar la Aplicación

Cuando necesites actualizar la aplicación:

### Paso 9.1: Detener el Sitio

1. En IIS Manager, selecciona `LogisticaFront`
2. Clic en **Detener**

### Paso 9.2: Reemplazar Archivos

1. Navega a `C:\logistica`
2. **Elimina** todo el contenido
3. **Copia** los nuevos archivos del build
4. **Verifica** que `web.config` existe

### Paso 9.3: Iniciar el Sitio

1. En IIS Manager, selecciona `LogisticaFront`
2. Clic en **Iniciar**

### Paso 9.4: Limpiar Caché

1. En el navegador, presiona `Ctrl + Shift + Delete`
2. Limpia caché
3. Recarga la página

---

## 🔒 Parte 10: Configurar HTTPS con Certificado

### Paso 10.1: Obtener Certificado SSL

**Opción A: Certificado de Autoridad Certificadora (Producción)**
- Compra un certificado SSL de una CA (Let's Encrypt, DigiCert, etc.)

**Opción B: Certificado Autofirmado (Desarrollo/Interno)**

1. Abre PowerShell como Administrador
2. Ejecuta:
   ```powershell
   New-SelfSignedCertificate -DnsName "logistica.tudominio.com" -CertStoreLocation "cert:\LocalMachine\My"
   ```

### Paso 10.2: Configurar Certificado en IIS

1. En IIS Manager, selecciona el sitio
2. Clic en **Enlaces...**
3. Selecciona el enlace HTTPS
4. Clic en **Editar...**
5. En **Certificado SSL**, selecciona tu certificado
6. Clic en **Aceptar**
cls
---

## 📊 Checklist Final

Antes de considerar el sitio en producción, verifica:

- [ ] IIS instalado y funcionando
- [ ] Sitio web creado en IIS
- [ ] Archivos de la aplicación copiados
- [ ] `web.config` presente y correcto
- [ ] URL Rewrite Module instalado
- [ ] Permisos de carpeta configurados
- [ ] Grupo de aplicaciones configurado
- [ ] Puerto abierto en firewall
- [ ] Certificado SSL configurado
- [ ] Sitio accesible desde localhost
- [ ] Sitio accesible desde red externa
- [ ] Rutas de Angular funcionando
- [ ] Archivos estáticos cargando
- [ ] Sin errores en consola del navegador

---

## 🎯 Resumen de Comandos Útiles

```powershell
# Reiniciar IIS
iisreset

# Iniciar sitio específico
Start-WebSite -Name "LogisticaFront"

# Detener sitio específico
Stop-WebSite -Name "LogisticaFront"

# Ver sitios activos
Get-WebSite

# Ver grupos de aplicaciones
Get-IISAppPool

# Reciclar grupo de aplicaciones
Restart-WebAppPool -Name "LogisticaFront"
```

---

## 📞 Soporte

Para más información:
- Documentación oficial de IIS: https://docs.microsoft.com/iis
- Angular deployment: https://angular.io/guide/deployment

**Última actualización:** 2026-03-04
