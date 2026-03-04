# 📚 Documentación del Sistema de Logística

Este directorio contiene la documentación automática generada del proyecto.

## 📂 Archivos de Documentación

- **FRONTEND.md** - Documentación completa del frontend Angular
- **BACKEND.md** - Documentación completa del backend .NET API

## 🚀 Comandos de Generación

### Generar documentación del Frontend

```bash
npm run docs
```

Este comando analiza:
- ✅ Componentes Angular (páginas)
- ✅ Servicios
- ✅ Estructura del proyecto
- ✅ Tecnologías utilizadas
- ✅ Estadísticas del código

### Generar documentación del Backend

```bash
npm run docs:backend
```

Este comando analiza:
- ✅ Controllers
- ✅ Stored Procedures
- ✅ Endpoints
- ✅ Arquitectura Clean Architecture
- ✅ Base de datos

### Generar toda la documentación

```bash
npm run docs:all
```

Este comando genera tanto la documentación del frontend como del backend en un solo paso.

## 📝 Contenido de la Documentación

### Frontend (FRONTEND.md)

1. **Resumen del Proyecto**
   - Estadísticas generales
   - Versión actual
   - Tecnologías

2. **Componentes**
   - Lista completa de componentes
   - Selectores
   - Número de métodos y propiedades
   - Rutas de archivos

3. **Servicios**
   - Lista de servicios
   - Número de métodos
   - Ubicación

4. **Estructura del Proyecto**
   - Árbol de directorios
   - Organización de archivos

5. **Tecnologías Utilizadas**
   - Stack tecnológico
   - Librerías principales
   - Herramientas de desarrollo

6. **Flujos de Trabajo**
   - Flujo de cotizaciones
   - Estados y transiciones

### Backend (BACKEND.md)

1. **Resumen del Proyecto**
   - Estadísticas de la API
   - Framework y versión
   - Arquitectura

2. **Arquitectura**
   - Clean Architecture
   - Capas del proyecto
   - Flujo de datos

3. **Controllers**
   - Lista de controllers
   - Número de endpoints
   - Líneas de código

4. **Stored Procedures**
   - Lista completa de SPs
   - Archivos SQL
   - Líneas de código

5. **Endpoints Principales**
   - Documentación de endpoints
   - Rutas y métodos HTTP
   - Descripción de funcionalidad

6. **Base de Datos**
   - Tablas principales
   - Relaciones
   - Convenciones

## 🔄 Actualización Automática

La documentación se genera automáticamente analizando el código fuente. Para mantenerla actualizada:

1. Ejecuta `npm run docs:all` después de cambios importantes
2. Revisa los archivos generados en `docs/`
3. Commitea la documentación junto con tus cambios

## 🎯 Uso Recomendado

### Para Desarrolladores Nuevos
1. Lee primero `FRONTEND.md` para entender la estructura del frontend
2. Luego revisa `BACKEND.md` para comprender la API
3. Consulta los flujos de trabajo para entender el negocio

### Para Mantenimiento
1. Genera documentación antes de cada release
2. Úsala como referencia para nuevas funcionalidades
3. Actualízala cuando agregues nuevos módulos

### Para Documentación de API
1. `BACKEND.md` contiene todos los endpoints disponibles
2. Úsala como referencia para integración
3. Compártela con equipos externos si es necesario

## 📊 Estadísticas Generadas

La documentación incluye automáticamente:

- 📈 Número total de componentes
- 📈 Número total de servicios
- 📈 Número total de controllers
- 📈 Número total de endpoints
- 📈 Número total de stored procedures
- 📈 Líneas de código por archivo

## 🛠️ Personalización

Si necesitas personalizar la documentación generada:

### Frontend
Edita: `scripts/generate-docs.js`

### Backend
Edita: `../api_logistica/scripts/generate-docs-backend.ps1`

## 📞 Soporte

Para problemas con la generación de documentación:

1. Verifica que Node.js esté instalado
2. Verifica que PowerShell esté disponible (para backend)
3. Asegúrate de estar en el directorio correcto
4. Revisa los logs de error en la consola

## 🔗 Enlaces Útiles

- [Angular Documentation](https://angular.io/docs)
- [PrimeNG Documentation](https://primeng.org/)
- [.NET Documentation](https://docs.microsoft.com/en-us/dotnet/)

---

**Última actualización:** Generada automáticamente con cada ejecución de `npm run docs:all`
