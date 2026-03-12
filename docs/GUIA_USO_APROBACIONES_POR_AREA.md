# Guía de Uso - Sistema de Aprobaciones por Área

## 📋 Tabla de Contenidos
1. [Introducción](#introducción)
2. [Configuración Inicial](#configuración-inicial)
3. [Uso del Sistema](#uso-del-sistema)
4. [Casos de Uso](#casos-de-uso)
5. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Introducción

El Sistema de Aprobaciones por Área permite gestionar flujos de aprobación personalizados según el área organizacional, tipo de requerimiento y monto solicitado.

### Características Principales:
- ✅ Flujos de aprobación por área y subárea
- ✅ Aprobación multinivel automática
- ✅ Dashboard de indicadores en tiempo real
- ✅ Notificaciones y seguimiento
- ✅ Historial completo de aprobaciones

---

## ⚙️ Configuración Inicial

### 1. Ejecutar Scripts de Base de Datos

**Orden de ejecución:**

```sql
USE LOGISTICA
GO

-- 1. Crear tablas y estructuras
:r 31_TABLA_USUARIOS_POR_AREA_ADAPTADO.sql

-- 2. Crear stored procedures de aprobación
:r 32_SP_APROBACIONES_POR_AREA_ADAPTADO.sql

-- 3. Insertar datos de prueba
:r 33_DATOS_PRUEBA_AREAS_ADAPTADO.sql

-- 4. Crear SPs de integración
:r 34_SP_INTEGRACION_TUS_TABLAS_FINAL.sql
```

### 2. Verificar Instalación

```sql
-- Verificar tablas creadas
SELECT name FROM sys.tables 
WHERE name LIKE 'LOGISTICA_%Aprobacion%' OR name LIKE 'LOGISTICA_Usuario%'

-- Verificar stored procedures
SELECT name FROM sys.procedures 
WHERE name LIKE 'LOGISTICA_%Aprobacion%'

-- Verificar datos de prueba
SELECT COUNT(*) FROM LOGISTICA_UsuariosPorArea
SELECT COUNT(*) FROM LOGISTICA_FlujoAprobacion
```

### 3. Configurar Usuarios por Área

```sql
-- Insertar un nuevo usuario en un área
INSERT INTO LOGISTICA_UsuariosPorArea (
    documentoidentidad, nombreCompleto, ruc, idarea, 
    rol, esJefeArea, esAprobador, email, telefono, usuarioCreacion
)
VALUES (
    '12345678', 'Juan Pérez', '20100445620', 2,
    'OPLOGIST', 1, 1, 'jperez@empresa.com', '987654321', 'ADMIN'
)
```

### 4. Configurar Flujo de Aprobación

```sql
-- Configurar flujo para un área específica
INSERT INTO LOGISTICA_FlujoAprobacion (
    ruc, idarea, tipoRequerimiento, secuencia, 
    rolAprobador, requiereAprobacion, montoMinimo, montoMaximo, usuarioCreacion
)
VALUES 
    ('20100445620', 2, 'COMPRA', 1, 'JEFE_AREA', 1, 0, 5000, 'ADMIN'),
    ('20100445620', 2, 'COMPRA', 2, 'LOLOGIST', 1, 0, NULL, 'ADMIN'),
    ('20100445620', 2, 'COMPRA', 3, 'ALLOGIST', 1, 0, NULL, 'ADMIN')
```

---

## 🚀 Uso del Sistema

### Para Usuarios Solicitantes

#### 1. Crear un Requerimiento

El requerimiento se crea desde el módulo de **Requerimientos**. El sistema automáticamente:
- Detecta el área del usuario
- Asigna los aprobadores según el flujo configurado
- Notifica al primer aprobador

#### 2. Seguimiento del Requerimiento

Acceder a **Aprobaciones por Área** → Tab "Mis Requerimientos"

Aquí podrás ver:
- Estado actual del requerimiento
- Progreso de aprobaciones (ej: 2/3 aprobaciones completadas)
- Quién está revisando actualmente
- Historial de aprobaciones

### Para Aprobadores

#### 1. Ver Requerimientos Pendientes

Acceder a **Aprobaciones por Área** → Tab "Pendientes de Aprobación"

La tabla muestra:
- Número de requerimiento
- Solicitante y área
- Descripción y monto
- Urgencia
- Tiempo de espera

#### 2. Aprobar o Rechazar

1. Click en el botón **"Revisar"** del requerimiento
2. Se abre un modal con los detalles
3. Ingresar observaciones (opcional para aprobar, obligatorio para rechazar)
4. Click en **"Aprobar"** o **"Rechazar"**

**Comportamiento del Sistema:**
- **Si se aprueba**: Pasa al siguiente nivel de aprobación
- **Si se rechaza**: El requerimiento queda en estado RECHAZADO
- **Si es la última aprobación**: El requerimiento queda APROBADO

#### 3. Dashboard de Indicadores

En la parte superior se muestran:
- **Pendientes**: Requerimientos esperando tu aprobación
- **Aprobados Hoy**: Cantidad aprobada en el día
- **Rechazados Hoy**: Cantidad rechazada en el día
- **Tiempo Promedio**: Tiempo promedio de aprobación (últimos 7 días)

### Para Administradores (Rol TI)

#### 1. Vista General

Acceder a **Aprobaciones por Área** → Tab "Todos los Requerimientos"

Permite ver:
- Todos los requerimientos del sistema
- Estado de cada uno
- Progreso de aprobaciones
- Filtros por estado

#### 2. Gestión de Usuarios por Área

```sql
-- Ver usuarios asignados a un área
EXEC LOGISTICA_obtenerUsuariosPorArea '{"ruc":"20100445620","idarea":2}'

-- Actualizar rol de un usuario
UPDATE LOGISTICA_UsuariosPorArea
SET esJefeArea = 1, esAprobador = 1
WHERE documentoidentidad = '12345678'
```

#### 3. Consultar Flujo de Aprobación

```sql
-- Ver flujo completo de un área
EXEC LOGISTICA_obtenerFlujoCompletoAprobacion '{
  "ruc":"20100445620",
  "idarea":2,
  "tipoRequerimiento":"COMPRA"
}'
```

---

## 📚 Casos de Uso

### Caso 1: Requerimiento de Compra Simple

**Escenario**: Un operativo solicita compra de materiales por S/. 2,500

**Flujo**:
1. Usuario crea requerimiento en el módulo de Requerimientos
2. Sistema detecta: Área=Operaciones, Tipo=COMPRA, Monto=2500
3. Sistema asigna aprobadores según flujo:
   - Nivel 1: Jefe de Operaciones
   - Nivel 2: Logístico
   - Nivel 3: Almacenero
4. Jefe de Operaciones recibe notificación
5. Jefe aprueba → pasa a Logístico
6. Logístico aprueba → pasa a Almacenero
7. Almacenero aprueba → Requerimiento APROBADO

### Caso 2: Requerimiento Rechazado

**Escenario**: Solicitud excede presupuesto

**Flujo**:
1. Usuario crea requerimiento por S/. 15,000
2. Jefe de Área revisa y detecta que excede presupuesto
3. Jefe rechaza con observación: "Excede presupuesto mensual asignado"
4. Requerimiento queda en estado RECHAZADO
5. Usuario puede ver la observación en "Mis Requerimientos"

### Caso 3: Requerimiento Urgente

**Escenario**: Compra urgente de repuestos

**Flujo**:
1. Usuario crea requerimiento con prioridad ALTA
2. Sistema marca como urgente
3. Aparece destacado en el dashboard de aprobadores
4. Aprobadores ven el tiempo de espera en tiempo real
5. Proceso de aprobación acelerado

### Caso 4: Consulta de Estado

**Escenario**: Usuario quiere saber el estado de su requerimiento

**Pasos**:
1. Acceder a **Aprobaciones por Área**
2. Tab "Mis Requerimientos"
3. Ver el requerimiento con:
   - Barra de progreso (ej: 2/3 aprobaciones)
   - Estado actual
   - Click en "Ver" para ver detalle completo
4. En el modal se muestra el flujo completo con:
   - ✅ Aprobaciones completadas (con fecha y aprobador)
   - ⏳ Aprobación pendiente actual
   - ⏸️ Aprobaciones futuras

---

## 🔧 Solución de Problemas

### Problema: No aparecen requerimientos pendientes

**Solución**:
```sql
-- Verificar que el usuario está en la tabla de usuarios por área
SELECT * FROM LOGISTICA_UsuariosPorArea 
WHERE documentoidentidad = 'TU_DNI' AND activo = 1

-- Verificar que tiene el rol de aprobador
SELECT * FROM LOGISTICA_UsuariosPorArea 
WHERE documentoidentidad = 'TU_DNI' AND esAprobador = 1
```

### Problema: Requerimiento no se asigna automáticamente

**Solución**:
```sql
-- Verificar que existe flujo para el área
SELECT * FROM LOGISTICA_FlujoAprobacion
WHERE ruc = '20100445620' AND idarea = 2 AND tipoRequerimiento = 'COMPRA'

-- Si no existe, crear el flujo
-- (Ver sección Configurar Flujo de Aprobación)
```

### Problema: Error al aprobar requerimiento

**Solución**:
```sql
-- Verificar estado del log de aprobaciones
SELECT * FROM LOGISTICA_LogAprobaciones
WHERE idRequerimiento = 123 AND aprobadorAsignado = 'TU_DNI'

-- Verificar que el requerimiento está en estado correcto
SELECT * FROM logistic_req WHERE id = 123
```

### Problema: Dashboard no muestra datos

**Solución**:
```sql
-- Ejecutar manualmente el SP del dashboard
EXEC LOGISTICA_obtenerDashboardAprobaciones 'TU_DNI'

-- Verificar que hay datos en las tablas
SELECT COUNT(*) FROM LOGISTICA_LogAprobaciones 
WHERE aprobadorAsignado = 'TU_DNI'
```

---

## 📊 Consultas Útiles

### Ver todos mis requerimientos pendientes de aprobar

```sql
EXEC LOGISTICA_obtenerRequerimientosPendientesAprobacion '{
  "aprobadorAsignado": "TU_DNI",
  "estado": "PENDIENTE"
}'
```

### Ver historial de aprobaciones de un requerimiento

```sql
SELECT 
    la.secuencia,
    la.aprobadorAsignado,
    ua.nombreCompleto,
    la.rolAprobador,
    la.estado,
    la.fechaAsignacion,
    la.fechaAprobacion,
    la.observaciones
FROM LOGISTICA_LogAprobaciones la
INNER JOIN LOGISTICA_UsuariosPorArea ua ON la.aprobadorAsignado = ua.documentoidentidad
WHERE la.idRequerimiento = 123
ORDER BY la.secuencia
```

### Ver estadísticas de aprobación por área

```sql
SELECT 
    a.nombre AS area,
    COUNT(*) AS totalRequerimientos,
    SUM(CASE WHEN r.estados = 'APROBADO' THEN 1 ELSE 0 END) AS aprobados,
    SUM(CASE WHEN r.estados = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazados,
    SUM(CASE WHEN r.estados = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes
FROM logistic_req r
INNER JOIN logistic_areas a ON r.ruc = a.ruc AND TRY_CAST(r.idarea AS INT) = a.idarea
WHERE r.fecharegistro >= DATEADD(MONTH, -1, GETDATE())
GROUP BY a.nombre
ORDER BY totalRequerimientos DESC
```

---

## 🎓 Mejores Prácticas

1. **Configurar flujos antes de usar**: Asegúrate de tener flujos configurados para todas las áreas
2. **Asignar roles correctamente**: Verifica que los usuarios tengan los roles adecuados
3. **Usar observaciones**: Siempre agregar observaciones al aprobar/rechazar para trazabilidad
4. **Revisar pendientes diariamente**: Los aprobadores deben revisar sus pendientes al menos una vez al día
5. **Monitorear tiempos**: Usar el dashboard para identificar cuellos de botella
6. **Mantener datos actualizados**: Actualizar usuarios y flujos cuando hay cambios organizacionales

---

## 📞 Soporte

Para soporte técnico o consultas:
- Revisar la documentación en `/docs/APROBACIONES_POR_AREA_ENDPOINTS.md`
- Consultar logs de la aplicación
- Contactar al equipo de desarrollo

---

**Versión**: 1.0  
**Última actualización**: Marzo 2026
