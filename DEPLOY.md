# 🚀 Guía de Deploy a Producción

Esta guía explica cómo desplegar la aplicación al servidor de producción (172.16.20.3).

---

## 📋 Requisitos Previos

1. ✅ Acceso al servidor via Escritorio Remoto (172.16.20.3)
2. ✅ Usuario: HASSPERU\Administrador
3. ✅ Permisos de escritura en `C:\logistica`
4. ✅ IIS configurado con el sitio LogisticaFront

---

## 🎯 Métodos de Deploy

### Método 1: Deploy Automático (Recomendado)

Este método construye y despliega automáticamente desde tu máquina local.

#### Opción A: Build + Deploy en un solo comando

```bash
npm run deploy:full
```

Este comando:
1. ✅ Guarda cambios en Git automáticamente
2. ✅ Actualiza la versión automáticamente
3. ✅ Genera el build de producción (SIN web.config)
4. ✅ Crea backup completo de C:\logistica en C:\logistica_backup_[timestamp]
5. ✅ Copia SOLO el contenido del build (preserva web.config existente)
6. ✅ Verifica que la versión sea correcta

#### Opción B: Deploy solo (si ya tienes el build)

```bash
npm run deploy
```

Este comando:
1. ✅ Crea backup completo de C:\logistica
2. ✅ Copia el build al servidor
3. ✅ Verifica que la versión sea correcta

---

### Método 2: Deploy Manual

Si prefieres copiar manualmente los archivos:

#### Paso 1: Generar el build

```bash
npm run build:prod-api
```

#### Paso 2: Conectarse al servidor

1. Abre **Conexión a Escritorio Remoto**
2. Equipo: `172.16.20.3`
3. Usuario: `HASSPERU\Administrador`
4. Conectar

#### Paso 3: Copiar archivos

**Desde tu máquina local:**

1. Navega a: `dist\logistica\browser\`
2. Selecciona **TODOS** los archivos y carpetas
3. Copia (Ctrl + C)

**En el servidor (172.16.20.3):**

1. Navega a: `C:\logistica`
2. **IMPORTANTE:** Haz backup de la carpeta actual (opcional pero recomendado)
3. Pega los archivos (Ctrl + V)
4. Confirma reemplazar todos los archivos

#### Paso 4: Verificar version.json

**En el servidor:**

1. Abre: `C:\logistica\assets\version.json`
2. Verifica que la versión sea la correcta
3. Ejemplo:
   ```json
   {
     "version": "1.0.46",
     "buildTime": "2026-03-04T13:15:00.000Z"
   }
   ```

#### Paso 5: Limpiar caché del navegador

**En el servidor:**

1. Abre el navegador
2. Presiona `Ctrl + Shift + Delete`
3. Selecciona "Imágenes y archivos en caché"
4. Limpia

#### Paso 6: Verificar la aplicación

1. Accede a: `https://apilogistica.agroapps.net:7019`
2. Verifica que la versión en el modal sea correcta
3. Prueba funcionalidades críticas

---

## 🔧 Solución de Problemas

### Problema: "La versión en el modal no coincide"

**Causa:** El archivo `version.json` no se actualizó en el servidor.

**Solución:**

1. Verifica que el archivo `C:\logistica\assets\version.json` tenga la versión correcta
2. Si no, cópialo manualmente desde `dist\logistica\browser\assets\version.json`
3. Limpia caché del navegador en el servidor
4. Recarga la aplicación

### Problema: "No se puede acceder a \\172.16.20.3\C$\logistica"

**Causa:** No tienes acceso a la carpeta compartida del servidor.

**Solución:**

1. Conéctate al servidor via Escritorio Remoto
2. Ejecuta el deploy desde dentro del servidor:
   ```bash
   # En el servidor, navega a la carpeta del proyecto
   cd C:\ruta\al\proyecto\logistica
   npm run build:prod-api
   
   # Luego copia manualmente
   xcopy /E /Y dist\logistica\browser\* C:\logistica\
   ```

### Problema: "Los archivos no se copian correctamente"

**Causa:** Permisos insuficientes o archivos en uso.

**Solución:**

1. Cierra todos los navegadores en el servidor
2. Reinicia IIS:
   ```powershell
   iisreset
   ```
3. Intenta copiar nuevamente

### Problema: "Error 404 después del deploy"

**Causa:** IIS no está configurado correctamente.

**Solución:**

1. Abre IIS Manager en el servidor
2. Verifica que LogisticaFront apunte a `C:\logistica`
3. Verifica que el archivo `web.config` exista
4. Reinicia el sitio en IIS

---

## 📝 Checklist de Deploy

Usa esta lista para asegurarte de que todo está correcto:

- [ ] Build generado correctamente (`npm run build:prod-api`)
- [ ] Versión actualizada en `package.json`
- [ ] Versión actualizada en `src/assets/version.json`
- [ ] Archivos copiados a `C:\logistica` en el servidor
- [ ] Archivo `version.json` verificado en el servidor
- [ ] Caché del navegador limpiado
- [ ] Aplicación accesible en producción
- [ ] Versión correcta mostrada en el modal
- [ ] Funcionalidades principales probadas
- [ ] Sin errores en la consola del navegador

---

## 🔄 Flujo Completo de Deploy

```
1. Desarrollo local
   ↓
2. npm run deploy:full
   ↓
3. Git commit automático
   ↓
4. Actualización de versión
   ↓
5. Build de producción
   ↓
6. Copia al servidor (C:\logistica)
   ↓
7. Verificación automática
   ↓
8. Limpiar caché en servidor
   ↓
9. Probar aplicación
   ↓
10. ✅ Deploy completado
```

---

## 📊 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run build:prod-api` | Genera build de producción |
| `npm run deploy` | Despliega build existente al servidor |
| `npm run deploy:full` | Build + Deploy automático |
| `npm run git-commit` | Guarda cambios en Git |
| `npm run docs:all` | Genera documentación |

---

## 🌐 URLs de Producción

- **Aplicación:** https://apilogistica.agroapps.net:7019
- **API Backend:** https://apilogistica.agroapps.net:7018
- **Servidor:** 172.16.20.3
- **Carpeta:** C:\logistica

---

## 📞 Contacto

Para problemas con el deploy, contactar al equipo de desarrollo.

**Última actualización:** 2026-03-04
