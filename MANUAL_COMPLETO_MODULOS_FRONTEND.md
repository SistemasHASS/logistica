# Manual Completo de Módulos del Frontend - Sistema de Logística

## Tabla de Contenidos
1. [Introducción](#introduccion)
2. [Roles y Usuarios](#roles)
3. [Módulos del Sistema](#modulos)
4. [Flujos de Trabajo](#flujos)
5. [Integraciones](#integraciones)

---

## 1. Introducción {#introduccion}

Este manual documenta todos los módulos del frontend del Sistema de Logística, describiendo en detalle cada funcionalidad, los roles que tienen acceso, y los flujos de trabajo asociados.

### Arquitectura del Sistema
- **Framework**: Angular 20
- **Base de Datos Local**: Dexie (IndexedDB)
- **Backend**: API REST (.NET)
- **Integración**: SPRING ERP

---

## 2. Roles y Usuarios {#roles}

### 2.1 Roles del Sistema

| Código | Nombre | Descripción Completa |
|--------|--------|---------------------|
| **ADLOGIST** | Administrador de Logística | Control total del sistema, gestión de maestros, configuración de flujos de aprobación |
| **OPLOGIST** | Operador de Logística | Creación y gestión de requerimientos, seguimiento de saldos pendientes |
| **EMLOGIST** | Empleado de Logística | Creación básica de requerimientos, consultas de estado |
| **LOLOGIST** | Logístico de Consolidación | Consolidación de requerimientos para compras, optimización de volúmenes |
| **ALLOGIST** | Almacenero de Logística | Gestión de despachos, control de stock, recepción de mercadería, compras |
| **APLOGIST** | Aprobador de Logística | Aprobación de requerimientos de consumo, validación presupuestaria |
| **TILOGIST** | Soporte TI | Mantenimiento técnico, configuración del sistema |

### 2.2 Usuarios de Ejemplo

```typescript
// Usuario Aprobador (Jefe de Área)
{
  documentoidentidad: "41097635",
  idrol: "APLOGIST",
  nombre: "Juan Pérez",
  idarea: "10",
  nombreArea: "SANIDAD",
  esJefeArea: true
}

// Usuario Operador
{
  documentoidentidad: "47792900",
  idrol: "OPLOGIST",
  nombre: "María García"
}
```

---

## 3. Módulos del Sistema {#modulos}

### 3.1 Módulo de Autenticación

**Ruta**: `/auth/login`  
**Componente**: `LoginComponent`  
**Acceso**: Público

#### Funcionalidades:
- Login con usuario y contraseña
- Validación contra API maestra
- Almacenamiento de sesión en Dexie
- Redirección según rol

#### Flujo de Login:
```typescript
1. Usuario ingresa credenciales
2. Sistema valida contra API
3. Se obtiene información del usuario
4. Se carga área del usuario (si es APLOGIST)
5. Se guardan datos en Dexie
6. Redirección según rol:
   - APLOGIST con área → /main/aprobaciones-area
   - APLOGIST sin área → /main/aprobaciones
   - OPLOGIST → /main/requerimientos
   - ALLOGIST → /main/despachos
   - LOLOGIST → /main/consolidacion-requerimientos
```

---

### 3.2 Módulo de Parámetros

**Ruta**: `/main/parametros`  
**Componente**: `ParametrosComponent`  
**Acceso**: OPLOGIST, EMLOGIST, LOLOGIST

#### Funcionalidades:
- Sincronización de datos maestros desde el backend
- Carga de datos a Dexie para uso offline
- Configuración de parámetros del usuario

#### Datos Maestros Sincronizados:
- **Proyectos**: Lista de proyectos activos
- **Fundos**: Ubicaciones/sedes
- **Áreas**: Áreas organizacionales
- **Almacenes**: Almacenes disponibles
- **Items**: Catálogo de productos
- **Commodities**: Productos agrícolas
- **Cultivos**: Tipos de cultivo
- **CECOs**: Centros de costo
- **Labores**: Actividades/labores
- **Turnos**: Turnos de trabajo

#### Proceso de Sincronización:
```typescript
1. Usuario ingresa a Parámetros
2. Sistema verifica conexión
3. Descarga datos desde API
4. Guarda en Dexie (IndexedDB)
5. Muestra confirmación de sincronización
```

---

### 3.3 Módulo de Requerimientos

**Ruta**: `/main/requerimientos`  
**Componente**: `RequerimientosComponent`  
**Acceso**: OPLOGIST, EMLOGIST, LOLOGIST

#### Funcionalidades Principales:

##### 3.3.1 Crear Requerimiento
- **Tipos**: COMPRA, CONSUMO, TRANSFERENCIA
- **Clasificaciones**: Stock Almacén, Activo Fijo, Gasto
- **Campos obligatorios**:
  - Tipo de requerimiento
  - Almacén origen/destino
  - Proyecto
  - Centro de costo
  - Labor (opcional)
  - Turno (opcional)
  - Items con cantidades

##### 3.3.2 Gestión de Items
- Búsqueda por código o descripción
- Selección desde maestro de items
- Ingreso manual de cantidades
- Asignación de proyecto/CECO por item

##### 3.3.3 Estados del Requerimiento
| Estado | Descripción |
|--------|-------------|
| BORRADOR | Recién creado, editable |
| ENVIADO | Enviado para aprobación |
| APROBADO | Aprobado por jefatura |
| RECHAZADO | Rechazado con motivo |
| ATENDIDO PARCIAL | Despachado parcialmente |
| ATENDIDO | Despachado completamente |
| ANULADO | Cancelado |

##### 3.3.4 Acciones Disponibles:
- **Crear**: Nuevo requerimiento
- **Editar**: Solo en estado BORRADOR
- **Enviar**: Envía para aprobación (CONSUMO) o directo a despacho (COMPRA)
- **Anular**: Cancela el requerimiento
- **Ver Detalle**: Consulta información completa
- **Imprimir**: Genera PDF del requerimiento

---

### 3.4 Módulo de Aprobaciones

**Ruta**: `/main/aprobaciones`  
**Componente**: `AprobacionesComponent`  
**Acceso**: APLOGIST

#### Funcionalidades:

##### 3.4.1 Lista de Requerimientos Pendientes
- Filtros por fecha, estado, usuario
- Búsqueda por número de requerimiento
- Ordenamiento por prioridad

##### 3.4.2 Detalle de Requerimiento
- Información completa del solicitante
- Lista de items solicitados
- Proyecto y centro de costo
- Glosa/justificación

##### 3.4.3 Acciones de Aprobación:
```typescript
// Aprobar
- Valida presupuesto
- Sincroniza con SPRING
- Envía a despacho
- Notifica al solicitante

// Rechazar
- Requiere motivo de rechazo
- Notifica al solicitante
- Registra en historial
```

##### 3.4.4 Sincronización con SPRING:
Al aprobar un requerimiento, el sistema:
1. Construye JSON con estructura SPRING
2. Incluye distribución contable
3. Envía a API de integración
4. Actualiza estado en sistema local

---

### 3.5 Módulo de Aprobaciones por Área

**Ruta**: `/main/aprobaciones-area`  
**Componente**: `AprobacionesAreaComponent`  
**Acceso**: APLOGIST (con área asignada)

#### Diferencias con Aprobaciones Normales:
- Solo muestra requerimientos del área del usuario
- Incluye validación de área en el filtro
- Permite aprobación masiva de items del área

#### Funcionalidades Adicionales:
- Filtro automático por área
- Reporte de aprobaciones del área
- Estadísticas de consumo por área

---

### 3.6 Módulo de Despachos

**Ruta**: `/main/despachos`  
**Componente**: `DespachoComponent`  
**Acceso**: ALLOGIST

#### Funcionalidades:

##### 3.6.1 Selección de Requerimientos
- Lista de requerimientos aprobados
- Filtro por almacén
- Priorización por fecha

##### 3.6.2 Verificación de Stock
```typescript
// El sistema verifica:
- Stock disponible en almacén
- Cantidades solicitadas vs disponibles
- Sugiere despacho parcial si no hay stock completo
```

##### 3.6.3 Proceso de Despacho:
1. Seleccionar requerimiento
2. Verificar stock disponible
3. Ingresar cantidades a despachar
4. Generar saldo pendiente (si aplica)
5. Confirmar despacho
6. Actualizar stock
7. Notificar al solicitante

##### 3.6.4 Gestión de Saldos Pendientes:
- Se crea automáticamente si despacho es parcial
- Opciones: Esperar stock, Consolidar, Cerrar
- Notificación cuando hay stock disponible

---

### 3.7 Módulo de Saldo Pendiente

**Ruta**: `/main/saldo-requerimiento`  
**Componente**: `SaldoRequerimientoComponent`  
**Acceso**: OPLOGIST, EMLOGIST, LOLOGIST

#### Funcionalidades:
- Lista de items con saldo pendiente
- Filtros por fecha, almacén, estado
- Acciones disponibles:
  - **Esperar Stock**: Mantiene en espera
  - **Consolidar**: Envía a consolidación para compra
  - **Cerrar**: Cierra el saldo (ya no se necesita)

---

### 3.8 Módulo de Consolidación

**Ruta**: `/main/consolidacion-requerimientos`  
**Componente**: `ConsolidacionRequerimientosComponent`  
**Acceso**: LOLOGIST

#### Funcionalidades:

##### 3.8.1 Vista de Items Pendientes
- Lista de items con saldo pendiente
- Agrupación por item similar
- Cálculo de totales

##### 3.8.2 Proceso de Consolidación:
```typescript
1. Seleccionar items a consolidar
2. Sistema agrupa por:
   - Código de item
   - Unidad de medida
   - Características similares
3. Calcular cantidad total
4. Crear solicitud de compra consolidada
5. Enviar a cotizaciones
```

##### 3.8.3 Gestión de Consolidaciones:
- Ver historial de consolidaciones
- Anular líneas consolidadas
- Reporte de eficiencia de consolidación

---

### 3.9 Módulo de Solicitudes de Compra

**Ruta**: `/main/solicitudes-compra`  
**Componente**: `SolicitudesCompraComponent`  
**Acceso**: LOLOGIST, ALLOGIST

#### Funcionalidades:

##### 3.9.1 Gestión de Solicitudes
- **Tab 1 - Locales**: Solicitudes creadas localmente (Dexie)
- **Tab 2 - Procesadas**: Solicitudes sincronizadas con backend

##### 3.9.2 Crear Solicitud:
- Desde consolidación (automático)
- Manual (agregar items directamente)
- Desde requerimientos aprobados

##### 3.9.3 Campos de la Solicitud:
- Número de solicitud (auto-generado)
- Fecha y prioridad
- Almacén destino
- Moneda (Soles/Dólares)
- Forma de pago
- Proyecto, CECO, Labor
- Items con cantidades y precios referenciales

##### 3.9.4 Sincronización:
- Envío a backend
- Generación de número oficial
- Actualización de estado

---

### 3.10 Módulo de Cotizaciones

**Ruta**: `/main/cotizaciones`  
**Componente**: `CotizacionesComponent`  
**Acceso**: LOLOGIST, ALLOGIST

#### Funcionalidades:

##### 3.10.1 Gestión de Cotizaciones
- Crear cotización desde solicitud de compra
- Agregar múltiples proveedores
- Ingresar precios por proveedor
- Comparar cotizaciones

##### 3.10.2 Evaluación de Cotizaciones:
```typescript
// Criterios de evaluación:
- Precio unitario
- Plazo de entrega
- Forma de pago
- Calidad del proveedor
- Historial de cumplimiento
```

##### 3.10.3 Selección de Ganador:
1. Comparar cotizaciones
2. Seleccionar proveedor ganador
3. Generar orden de compra automáticamente
4. Notificar a proveedor

---

### 3.11 Módulo de Órdenes de Compra

**Ruta**: `/main/ordenes-compra`  
**Componente**: `OrdenesCompraComponent`  
**Acceso**: LOLOGIST, ALLOGIST

#### Funcionalidades:

##### 3.11.1 Gestión de Órdenes
- Generación automática desde cotización ganadora
- Edición de términos y condiciones
- Aprobación de orden
- Envío a proveedor

##### 3.11.2 Estados de la Orden:
| Estado | Descripción |
|--------|-------------|
| GENERADA | Creada automáticamente |
| ENVIADA | Enviada al proveedor |
| CONFIRMADA | Confirmada por proveedor |
| EN_TRANSITO | Mercadería en camino |
| RECIBIDA | Recepcionada en almacén |
| CERRADA | Proceso completado |

##### 3.11.3 Seguimiento:
- Historial de cambios de estado
- Notificaciones de avance
- Alertas de retrasos

---

### 3.12 Módulo de Recepción de Mercadería

**Ruta**: `/main/recepcion-mercaderia`  
**Componente**: `RecepcionMercaderiaComponent`  
**Acceso**: ALLOGIST

#### Funcionalidades:

##### 3.12.1 Proceso de Recepción:
```typescript
1. Seleccionar orden de compra
2. Verificar documentación
3. Inspeccionar mercadería
4. Registrar cantidades recibidas
5. Reportar diferencias (si aplica)
6. Actualizar inventario
7. Cerrar orden
```

##### 3.12.2 Control de Calidad:
- Verificación de cantidades
- Inspección de calidad
- Registro de no conformidades
- Generación de devoluciones

---

### 3.13 Módulo de Devoluciones

#### 3.13.1 Devoluciones a Proveedores
**Ruta**: `/main/devoluciones-proveedores`  
**Acceso**: ALLOGIST

**Funcionalidades**:
- Crear devolución desde recepción
- Motivos de devolución
- Seguimiento de devolución
- Nota de crédito

#### 3.13.2 Devoluciones de Consumo
**Ruta**: `/main/devoluciones-consumo`  
**Acceso**: ALLOGIST, ADLOGIST, OPLOGIST, EMLOGIST, LOLOGIST, APLOGIST

**Funcionalidades**:
- Devolución de items despachados
- Reingreso a stock
- Actualización de saldos

---

### 3.14 Módulo de Reingresos

**Ruta**: `/main/reingresos`  
**Componente**: `ReingresosComponent`  
**Acceso**: APLOGIST, ALLOGIST, ADLOGIST, OPLOGIST, EMLOGIST, LOLOGIST

#### Funcionalidades:
- Registro de reingresos a almacén
- Actualización de inventario
- Trazabilidad de movimientos

---

### 3.15 Módulo de Gestión de Inventario

**Ruta**: `/main/gestion-inventario`  
**Componente**: `GestionInventarioComponent`  
**Acceso**: ALLOGIST

#### Funcionalidades:
- Consulta de stock por almacén
- Movimientos de inventario
- Ajustes de stock
- Toma de inventario físico

---

### 3.16 Módulo de Kardex

**Ruta**: `/main/kardex`  
**Componente**: `KardexComponent`  
**Acceso**: ALLOGIST

#### Funcionalidades:
- Historial de movimientos por item
- Filtros por fecha y almacén
- Exportación a Excel
- Análisis de rotación

---

### 3.17 Módulo de Maestros

**Ruta**: `/main/maestros`  
**Acceso**: ADLOGIST, TILOGIST

#### Submódulos:

##### 3.17.1 Maestro de Items
**Ruta**: `/main/maestros/items`

**Funcionalidades**:
- CRUD de items
- Clasificación por commodity
- Unidades de medida
- Cuenta contable

##### 3.17.2 Maestro de Commodities
**Ruta**: `/main/maestros/comodities`

**Funcionalidades**:
- Gestión de categorías de productos
- Clasificación agrícola

---

### 3.18 Módulo de Maestro de Proveedores

**Ruta**: `/main/maestro-proveedores`  
**Acceso**: ALLOGIST

#### Funcionalidades:
- CRUD de proveedores
- Datos fiscales
- Contactos
- Historial de compras
- Evaluación de desempeño

---

### 3.19 Módulo de Evaluación de Proveedores

**Ruta**: `/main/evaluacion-proveedores`  
**Acceso**: ALLOGIST

#### Funcionalidades:
- Criterios de evaluación
- Calificación por compra
- Ranking de proveedores
- Reportes de desempeño

---

### 3.20 Módulo de Aprobadores

**Ruta**: `/main/aprobadores`  
**Acceso**: ADLOGIST

#### Funcionalidades:
- Configuración de flujos de aprobación
- Asignación de aprobadores por área
- Jerarquías de aprobación
- Delegación de aprobaciones

---

### 3.21 Módulo de Notificaciones

**Ruta**: `/main/notificaciones`  
**Acceso**: OPLOGIST, EMLOGIST, LOLOGIST, ALLOGIST

#### Funcionalidades:
- Lista de notificaciones
- Filtros por tipo y estado
- Marcar como leída
- Acceso directo a módulo relacionado

---

### 3.22 Módulo de Reportes

#### 3.22.1 Dashboard de Compras
**Ruta**: `/main/dashboard-compras`  
**Acceso**: LOLOGIST, ALLOGIST

**KPIs**:
- Total de órdenes de compra
- Monto total de compras
- Proveedores activos
- Órdenes pendientes

#### 3.22.2 Reporte de Saldos
**Ruta**: `/main/reporte-saldos`  
**Acceso**: ALLOGIST

**Información**:
- Saldos pendientes por almacén
- Antigüedad de saldos
- Items críticos

#### 3.22.3 Reporte de Despachos
**Ruta**: `/main/reporte-despachos`  
**Acceso**: ALLOGIST

**Información**:
- Despachos por período
- Cumplimiento de entregas
- Items más despachados

#### 3.22.4 Reporte de Aprobaciones
**Ruta**: `/main/reporte-aprobaciones-area`  
**Acceso**: APLOGIST

**Información**:
- Aprobaciones realizadas
- Tiempo promedio de aprobación
- Rechazos y motivos

#### 3.22.5 Reporte de Requerimientos
**Ruta**: `/main/reporte-requerimientos`  
**Acceso**: Todos

**Información**:
- Requerimientos por estado
- Análisis de tendencias
- Exportación a Excel

---

## 4. Flujos de Trabajo {#flujos}

### 4.1 Flujo Completo: Requerimiento de Consumo

```
1. OPLOGIST crea requerimiento tipo CONSUMO
   ↓
2. Sistema envía a aprobación
   ↓
3. APLOGIST recibe notificación
   ↓
4. APLOGIST aprueba/rechaza
   ↓
5. Si aprueba: sincroniza con SPRING
   ↓
6. ALLOGIST recibe para despacho
   ↓
7. ALLOGIST verifica stock
   ↓
8. Si hay stock: despacha completo
   Si no hay stock: despacha parcial + saldo pendiente
   ↓
9. Saldo pendiente va a consolidación
   ↓
10. LOLOGIST consolida y crea solicitud de compra
    ↓
11. ALLOGIST cotiza con proveedores
    ↓
12. ALLOGIST selecciona ganador
    ↓
13. Sistema genera orden de compra
    ↓
14. ALLOGIST recepciona mercadería
    ↓
15. ALLOGIST despacha saldo pendiente
    ↓
16. Proceso completo
```

### 4.2 Flujo Simplificado: Requerimiento de Compra

```
1. OPLOGIST crea requerimiento tipo COMPRA
   ↓
2. Va directo a consolidación (sin aprobación)
   ↓
3. LOLOGIST consolida
   ↓
4. Continúa flujo de compra normal
```

---

## 5. Integraciones {#integraciones}

### 5.1 Integración con SPRING ERP

**Endpoint**: API de integración SPRING

**Datos Sincronizados**:
- Requerimientos aprobados
- Distribución contable
- Centro de costo
- Proyecto (AFE)
- Labor (Lote de producción)
- Almacén

**Estructura JSON**:
```typescript
{
  CompaniaSocio: "H00100",
  Clasificacion: "Stock Almacen",
  AlmacenCodigo: "H001",
  CentroCosto: "11040",
  LoteProduccion: "250111040",
  distribucion: [{
    Account: "6111101",
    Afe: "20241086110401",
    CentroCostoDestino: "250111040",
    Sucursal: "HASS",
    CampoReferencia: "PL"
  }]
}
```

### 5.2 Almacenamiento Local (Dexie)

**Tablas Principales**:
- usuarios
- requerimientos
- detalleRequerimientos
- solicitudesCompra
- cotizaciones
- ordenesCompra
- proyectos
- cecos
- labores
- almacenes
- items
- turnos

---

## Conclusión

Este manual documenta todos los módulos del frontend del Sistema de Logística. Cada módulo está diseñado para un rol específico y forma parte de un flujo integral de gestión logística.

**Última actualización**: Abril 2026  
**Versión**: 2.0
