# Manual del Sistema de Logística - Guía Completa por Roles

## Tabla de Contenidos
1. [Descripción General del Sistema](#descripción-general)
2. [Roles de Usuario y Permisos](#roles-y-permisos)
3. [Flujo General del Sistema](#flujo-general)
4. [Guía Detallada por Rol](#guía-por-rol)
5. [Módulos del Sistema](#módulos)
6. [Procesos Clave](#procesos-clave)
7. [Notificaciones y Alertas](#notificaciones)
8. [Reportes y Consultas](#reportes)

---

## <a name="descripción-general"></a>1. Descripción General del Sistema

El Sistema de Logística es una plataforma integral para la gestión de requerimientos, despachos, compras y control de inventario. El sistema opera bajo un flujo de aprobación multinivel que asegura el control y trazabilidad de todas las operaciones.

### Características Principales:
- **Gestión de Requerimientos**: Creación y seguimiento de solicitudes de consumo y compra
- **Control de Aprobaciones**: Flujo de aprobación por jefatura
- **Despachos**: Gestión de salidas de almacén con control de stock
- **Consolidación**: Agrupación de requerimientos para optimizar compras
- **Compras**: Gestión completa desde cotización hasta orden de compra
- **Notificaciones**: Sistema de alertas en tiempo real
- **Reportes**: Múltiples vistas analíticas y operativas

---

## <a name="roles-y-permisos"></a>2. Roles de Usuario y Permisos

### 2.1 Roles Principales

| Rol | Código | Descripción | Área Principal |
|-----|--------|-------------|----------------|
| Administrador de Logística | ADLOGIST | Control total del sistema | Administración |
| Operador de Logística | OPLOGIST | Gestión de requerimientos y despachos | Operaciones |
| Empleado de Logística | EMLOGIST | Creación de requerimientos | Operaciones |
| Logístico de Consolidación | LOLOGIST | Consolidación de compras | Compras |
| Almacenero de Logística | ALLOGIST | Gestión de almacén y despachos | Almacén |
| Aprobador de Logística | APLOGIST | Aprobación de consumos | Jefatura |
| Soporte TI | TI | Mantenimiento del sistema | TI |

### 2.2 Matriz de Permisos por Módulo

| Módulo | ADLOGIST | OPLOGIST | EMLOGIST | LOLOGIST | ALLOGIST | APLOGIST | TI |
|--------|----------|----------|----------|----------|----------|----------|----|
| **Maestros** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| - Items | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| - Commodities | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| - Aprobadores | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Configuración** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| - Parámetros | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Notificaciones** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Requerimientos** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| - Crear/Editar | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| - Reportes | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Saldo Pendiente** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Despachos** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| - Gestión | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| - Reportes | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Aprobaciones** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| - Aprobar Consumos | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| - Reportes | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Consolidación** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Compras** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| - Dashboard | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| - Solicitudes | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| - Cotizaciones | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| - Órdenes | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| - Recepción | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| - Devoluciones | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Reportes Avanzados** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

---

## <a name="flujo-general"></a>3. Flujo General del Sistema

### 3.1 Flujo Principal de Requerimientos

```
1. CREACIÓN DE REQUERIMIENTO
   ↓
2. APROBACIÓN DE JEFATURA (si es consumo)
   ↓
3. DESPACHO (si hay stock)
   ↓
4. SALDO PENDIENTE (si no hay stock)
   ↓
5. CONSOLIDACIÓN (agrupar para compra)
   ↓
6. SOLICITUD DE COTIZACIÓN
   ↓
7. COTIZACIONES
   ↓
8. ORDEN DE COMPRA
   ↓
9. RECEPCIÓN
   ↓
10. DESPACHO COMPLETO
```

### 3.2 Estados de un Requerimiento

| Estado | Descripción | Quién puede cambiar |
|--------|-------------|---------------------|
| BORRADOR | Recién creado, no enviado | EMLOGIST, OPLOGIST |
| ENVIADO | Enviado para aprobación | EMLOGIST, OPLOGIST |
| APROBADO | Aprobado por jefatura | APLOGIST |
| RECHAZADO | Rechazado por jefatura | APLOGIST |
| ATENDIDO PARCIAL | Despachado parcialmente | ALLOGIST |
| ATENDIDO | Despachado completamente | ALLOGIST |
| ANULADO | Cancelado | ADLOGIST |
| CERRADO | Proceso finalizado | Sistema |

---

## <a name="guía-por-rol"></a>4. Guía Detallada por Rol

### <a name="rol-adlogist"></a>4.1 Administrador de Logística (ADLOGIST)

#### Responsabilidades:
- Configuración y mantenimiento del sistema
- Gestión de usuarios y permisos
- Mantenimiento de maestros (items, commodities, aprobadores)
- Supervisión general de operaciones

#### Acciones Principales:

**1. Gestión de Maestros**
```typescript
// Acceso a módulos de configuración
- Items: Mantenimiento del catálogo de productos
- Commodities: Gestión de productos agrícolas
- Aprobadores: Configuración del flujo de aprobación
```

**2. Configuración del Sistema**
- Definir parámetros generales
- Configurar flujos de aprobación
- Mantener tablas de referencia

**3. Reportes de Administración**
- Acceso a todos los reportes del sistema
- Auditoría de operaciones
- Estadísticas generales

#### Flujo de Trabajo Típico:
1. Iniciar sesión → Acceso al panel de administración
2. Configurar maestros según necesidades operativas
3. Mantener actualizados los datos del sistema
4. Generar reportes de gestión para dirección

---

### <a name="rol-oplogist"></a>4.2 Operador de Logística (OPLOGIST)

#### Responsabilidades:
- Creación y gestión de requerimientos
- Seguimiento de solicitudes
- Gestión de saldos pendientes
- Coordinación con almacén

#### Acciones Principales:

**1. Gestión de Requerimientos**
```typescript
// Crear nuevo requerimiento
- Seleccionar tipo: COMPRA o CONSUMO
- Agregar items con cantidades
- Asignar proyecto, CECO, turno
- Enviar para aprobación (si es consumo)
```

**2. Seguimiento de Saldos Pendientes**
- Revisar requerimientos con saldo pendiente
- Decidir acción: esperar stock, consolidar o cerrar
- Coordinar con almacén para disponibilidad

**3. Reportes Operativos**
- Reporte de requerimientos creados
- Estado de solicitudes pendientes
- Histórico de requerimientos

#### Flujo de Trabajo Típico:
1. Recibir solicitud de área usuaria
2. Crear requerimiento en el sistema
3. Seguimiento hasta aprobación
4. Coordinar despacho con almacén
5. Gestionar saldos pendientes si aplica
6. Cerrar ciclo del requerimiento

---

### <a name="rol-emlogist"></a>4.3 Empleado de Logística (EMLOGIST)

#### Responsabilidades:
- Creación de requerimientos básicos
- Consulta de estado de solicitudes
- Reportes básicos

#### Acciones Principales:

**1. Creación de Requerimientos**
```typescript
// Funcionalidades limitadas
- Crear requerimientos de consumo
- Consultar estado de sus solicitudes
- Editar requerimientos en borrador
```

**2. Consultas**
- Ver sus requerimientos creados
- Consultar disponibilidad básica
- Reportes personales

#### Flujo de Trabajo Típico:
1. Recibir necesidad de su área
2. Crear requerimiento con datos básicos
3. Enviar para aprobación
4. Hacer seguimiento del estado
5. Recibir notificaciones de cambios

---

### <a name="rol-lologist"></a>4.4 Logístico de Consolidación (LOLOGIST)

#### Responsabilidades:
- Consolidación de requerimientos para compra
- Optimización de volúmenes de compra
- Generación de solicitudes de cotización
- Análisis de requerimientos pendientes

#### Acciones Principales:

**1. Consolidación de Requerimientos**
```typescript
// Proceso de consolidación
- Revisar items pendientes de consolidación
- Agrupar items similares
- Crear solicitudes de compra consolidadas
- Enviar a cotización
```

**2. Análisis y Optimización**
- Identificar oportunidades de consolidación
- Analizar patrones de compra
- Optimizar volúmenes y costos

**3. Gestión de Consolidaciones**
- Ver historial de consolidaciones
- Anular líneas si es necesario
- Generar reportes de consolidación

#### Flujo de Trabajo Típico:
1. Revisar requerimientos aprobados pendientes
2. Identificar items susceptibles de consolidación
3. Agrupar y crear solicitud de compra
4. Enviar a proceso de cotización
5. Hacer seguimiento hasta orden de compra

---

### <a name="rol-allogist"></a>4.5 Almacenero de Logística (ALLOGIST)

#### Responsabilidades:
- Gestión de despachos
- Control de stock
- Recepción de mercadería
- Gestión de devoluciones

#### Acciones Principales:

**1. Gestión de Despachos**
```typescript
// Proceso de despacho
- Seleccionar requerimiento aprobado
- Verificar stock disponible
- Registrar cantidades despachadas
- Generar documento de salida
```

**2. Control de Stock**
- Actualizar stock en tiempo real
- Notificar disponibilidad
- Gestionar saldos pendientes

**3. Recepción de Mercadería**
- Recibir órdenes de compra
- Verificar cantidades y calidades
- Actualizar inventario

**4. Gestión de Compras**
- Participar en proceso de cotizaciones
- Recepcionar mercadería
- Gestionar devoluciones a proveedores

#### Flujo de Trabajo Típico:
1. Recibir requerimientos para despacho
2. Verificar disponibilidad de stock
3. Realizar despacho parcial o total
4. Generar saldo pendiente si aplica
5. Recibir mercadería de compras
6. Actualizar inventario

---

### <a name="rol-aplogist"></a>4.6 Aprobador de Logística (APLOGIST)

#### Responsabilidades:
- Aprobación de requerimientos de consumo
- Validación de presupuestos
- Control de gastos
- Reportes de aprobaciones

#### Acciones Principales:

**1. Aprobación de Consumos**
```typescript
// Proceso de aprobación
- Revisar requerimientos pendientes
- Validar necesidad y presupuesto
- Aprobar o rechazar con motivo
- Enviar notificación de decisión
```

**2. Control Presupuestario**
- Verificar disponibilidad presupuestaria
- Validar centros de costo
- Asegurar cumplimiento de políticas

**3. Reportes de Gestión**
- Reporte de aprobaciones realizadas
- Análisis de rechazos
- Estadísticas de aprobación

#### Flujo de Trabajo Típico:
1. Recibir notificación de requerimientos pendientes
2. Analizar cada solicitud
3. Validar presupuesto y necesidad
4. Aprobar o rechazar con justificación
5. Monitorear reportes de gestión

---

### <a name="rol-ti"></a>4.7 Soporte TI (TI)

#### Responsabilidades:
- Mantenimiento técnico del sistema
- Configuración de flujos de aprobación
- Soporte a usuarios
- Gestión de accesos

#### Acciones Principales:

**1. Configuración Técnica**
- Mantener parámetros del sistema
- Configurar flujos de aprobación
- Gestionar integraciones

**2. Soporte a Usuarios**
- Resolver incidencias
- Capacitar a nuevos usuarios
- Gestionar accesos y permisos

**3. Reportes Técnicos**
- Auditoría del sistema
- Reportes de uso
- Monitoreo de performance

#### Flujo de Trabajo Típico:
1. Monitorear funcionamiento del sistema
2. Atender solicitudes de soporte
3. Realizar mantenimientos programados
4. Generar reportes técnicos

---

## <a name="módulos"></a>5. Módulos del Sistema

### 5.1 Módulo de Requerimientos

**Acceso**: OPLOGIST, EMLOGIST, LOLOGIST, TI

**Funcionalidades**:
- Creación de requerimientos (COMPRA/CONSUMO)
- Edición de borradores
- Seguimiento de estado
- Anulación de requerimientos

**Campos Principales**:
- Tipo de requerimiento
- Almacén origen y destino
- Proyecto y centro de costo
- Items con cantidades
- Prioridad y glosa

### 5.2 Módulo de Aprobaciones

**Acceso**: APLOGIST, TI

**Funcionalidades**:
- Lista de requerimientos por aprobar
- Detalle completo de solicitud
- Aprobación/rechazo con motivo
- Historial de aprobaciones

### 5.3 Módulo de Despachos

**Acceso**: ALLOGIST, TI

**Funcionalidades**:
- Selección de requerimientos aprobados
- Verificación de stock
- Registro de cantidades despachadas
- Gestión de saldos pendientes

### 5.4 Módulo de Consolidación

**Acceso**: LOLOGIST, TI

**Funcionalidades**:
- Lista de items pendientes de consolidación
- Agrupación de items similares
- Creación de solicitudes de compra
- Anulación de líneas

### 5.5 Módulo de Compras

**Acceso**: ALLOGIST, TI

**Submódulos**:
- Dashboard de compras
- Solicitudes de compra
- Cotizaciones
- Órdenes de compra
- Recepción de mercadería
- Devoluciones a proveedores

### 5.6 Módulo de Notificaciones

**Acceso**: Todos los roles excepto ADLOGIST

**Funcionalidades**:
- Recepción de notificaciones en tiempo real
- Contador de notificaciones no leídas
- Acceso directo a módulos relacionados
- Historial de notificaciones

---

## <a name="procesos-clave"></a>6. Procesos Clave

### 6.1 Proceso de Creación de Requerimiento

1. **Ingreso al Módulo**
   - Navegar a Requerimientos
   - Hacer clic en "Nuevo Requerimiento"

2. **Completar Datos Generales**
   - Seleccionar tipo (COMPRA/CONSUMO)
   - Elegir almacén y proyecto
   - Asignar centro de costo

3. **Agregar Items**
   - Buscar items por código o descripción
   - Ingresar cantidades
   - Asignar proyecto/CECO si es necesario

4. **Guardar y Enviar**
   - Validar datos completos
   - Guardar como borrador o enviar directo
   - Si es consumo, va a aprobación

### 6.2 Proceso de Aprobación

1. **Recepción de Notificación**
   - El aprobador recibe alerta
   - Contador de notificaciones se incrementa

2. **Análisis de Solicitud**
   - Ingresar al módulo de Aprobaciones
   - Revisar detalle completo
   - Validar presupuesto y necesidad

3. **Toma de Decisión**
   - Aprobar: pasa a despacho
   - Rechazar: devuelve con motivo
   - Se registra en historial

### 6.3 Proceso de Despacho

1. **Verificación de Stock**
   - Seleccionar requerimiento aprobado
   - Sistema verifica stock disponible
   - Muestra cantidades posibles de despachar

2. **Ejecución del Despacho**
   - Ingresar cantidades a despachar
   - Si hay faltante, genera saldo pendiente
   - Confirmar operación

3. **Manejo de Saldos Pendientes**
   - Opciones: esperar stock, consolidar, cerrar
   - Se crea registro en tabla de saldos
   - Se notifica al usuario

### 6.4 Proceso de Consolidación

1. **Identificación de Items**
   - Revisar lista de pendientes
   - Filtrar por criterios (fechas, items)
   - Seleccionar items a consolidar

2. **Agrupación**
   - Sistema agrupa items similares
   - Calcula totales
   - Permite ajustes manuales

3. **Generación de Solicitud**
   - Crea solicitud de compra
   - Envia a módulo de cotizaciones
   - Cierra items originales

---

## <a name="notificaciones"></a>7. Notificaciones y Alertas

### 7.1 Tipos de Notificaciones

| Tipo | Descripción | Quién recibe |
|------|-------------|--------------|
| REQUERIMIENTO_PENDIENTE | Nuevo requerimiento por aprobar | APLOGIST |
| REQUERIMIENTO_APROBADO | Requerimiento aprobado | Solicitante |
| REQUERIMIENTO_RECHAZADO | Requerimiento rechazado | Solicitante |
| SALDO_PENDIENTE | Despacho genera saldo | Solicitante |
| STOCK_DISPONIBLE | Hay stock para saldo pendiente | Usuario del saldo |
| DESPACHO_REALIZADO | Despacho completado | Solicitante |
| COMPRA_RECIBIDA | Llegó mercadería solicitada | Solicitante |

### 7.2 Gestión de Notificaciones

1. **Recepción**
   - Aparece contador en menú
   - Se muestra lista de notificaciones
   - Con indicador de leído/no leído

2. **Acciones**
   - Marcar como leída
   - Ir al módulo relacionado
   - Eliminar notificación

3. **Configuración**
   - Cada rol recibe notificaciones específicas
   - No se pueden desactivar individualmente
   - Se guardan históricamente

---

## <a name="reportes"></a>8. Reportes y Consultas

### 8.1 Reportes por Rol

**ADLOGIST**
- Reporte general de operaciones
- Auditoría de usuarios
- Estadísticas de uso del sistema

**OPLOGIST/EMLOGIST**
- Reporte de requerimientos creados
- Estado de solicitudes
- Histórico personal

**LOLOGIST**
- Reporte de consolidaciones
- Análisis de compras agrupadas
- Eficiencia de consolidación

**ALLOGIST**
- Reporte de despachos
- Movimientos de stock
- Recepción de mercadería

**APLOGIST**
- Reporte de aprobaciones
- Análisis de rechazos
- Tiempos de respuesta

### 8.2 Reportes Generales

1. **Reporte de Requerimientos**
   - Filtros por fechas, estado, usuario
   - Exportación a Excel
   - Gráficos de tendencias

2. **Reporte de Despachos**
   - Por almacén y período
   - Análisis de cumplimiento
   - Saldos pendientes

3. **Reporte de Compras**
   - Dashboard con KPIs
   - Análisis de proveedores
   - Comparativo de cotizaciones

---

## Consideraciones Finales

### Seguridad y Accesos
- Cada usuario solo ve información de su rol
- Las contraseñas caducan cada 90 días
- Se registra auditoría de todas las acciones

### Buenas Prácticas
1. **Requerimientos**: Ser específico en la descripción
2. **Aprobaciones**: Revisar siempre el presupuesto
3. **Despachos**: Verificar calidad del producto
4. **Consolidación**: Buscar siempre optimizar costos

### Soporte
- Para incidencias técnicas: Contactar al equipo TI
- Para dudas de proceso: Consultar con supervisor
- Manual actualizado disponible en el sistema

---

*Última actualización: Diciembre 2024*
*Versión del documento: 1.0*
