# Módulo de Recepción de Mercadería

## 📋 Descripción

El módulo de **Recepción de Mercadería** permite registrar y controlar la llegada de productos desde las órdenes de compra. Este módulo es fundamental para cerrar el ciclo de compras, validar la conformidad de los productos recibidos y actualizar el inventario.

## 🎯 Funcionalidades Principales

### ✅ Gestión de Recepciones
- **Crear** recepciones desde órdenes de compra
- **Listar** todas las recepciones con filtros
- **Ver Detalle** completo de cada recepción
- **Eliminar** recepciones (con precaución)
- **Control de conformidad** (conforme/no conforme)

### 🔄 Proceso de Recepción
- Selección de orden de compra pendiente
- Carga automática de items ordenados
- Registro de cantidades recibidas por item
- Separación de cantidades aceptadas y rechazadas
- Control de lotes y fechas de vencimiento
- Actualización automática de la orden de compra

### 📊 Dashboard de Estadísticas
- Total de recepciones parciales
- Total de recepciones completas
- Total de recepciones conformes
- Total de recepciones no conformes

### 🔍 Filtros Avanzados
- Por estado (PARCIAL, COMPLETA)
- Por almacén
- Por rango de fechas
- Limpiar filtros rápidamente

### 📈 Control de Calidad
- Registro de cantidades rechazadas
- Motivos de rechazo por item
- Estado de conformidad por item
- Observaciones generales y por item
- Trazabilidad completa

## 🏗️ Estructura del Módulo

```
recepcion-mercaderia/
├── recepcion-mercaderia.component.ts    # Lógica del componente
├── recepcion-mercaderia.component.html  # Template HTML
├── recepcion-mercaderia.component.scss  # Estilos
└── README.md                            # Documentación
```

## 🔗 Flujo de Trabajo

### 1. Proceso de Recepción
```
Orden de Compra (CONFIRMADA/EN_PROCESO) → Registrar Recepción → 
Validar Cantidades → Guardar → Actualizar Orden
```

**Proceso Detallado:**
1. Sistema muestra órdenes pendientes de recepción
2. Usuario selecciona orden y almacén
3. Sistema carga automáticamente items ordenados
4. Usuario registra cantidades recibidas por item
5. Usuario separa cantidades aceptadas y rechazadas
6. Sistema calcula conformidad automáticamente
7. Usuario registra lotes y fechas de vencimiento (opcional)
8. Guardar recepción
9. Sistema actualiza cantidades en la orden de compra
10. Sistema actualiza estado de la orden (PARCIAL/TOTAL)

### 2. Estados de la Recepción
```
PARCIAL → Algunos items pendientes de recibir
COMPLETA → Todos los items recibidos completamente
```

### 3. Conformidad
```
CONFORME → Todos los items aceptados sin rechazos
NO CONFORME → Al menos un item con cantidad rechazada
```

## 📦 Interfaces Utilizadas

### RecepcionOrdenCompra
```typescript
interface RecepcionOrdenCompra {
  id?: number;
  numeroRecepcion: string;
  ordenCompraId: number;
  numeroOrden: string;
  fecha: string;
  almacen: string;
  detalle: DetalleRecepcion[];
  observaciones?: string;
  conformidad: boolean;
  usuarioRecibe: string;
  estado: 'PARCIAL' | 'COMPLETA';
}
```

### DetalleRecepcion
```typescript
interface DetalleRecepcion {
  id?: number;
  recepcionId: number;
  detalleOrdenCompraId: number;
  codigo: string;
  descripcion: string;
  cantidadOrdenada: number;
  cantidadRecibida: number;
  cantidadAceptada: number;
  cantidadRechazada: number;
  motivoRechazo?: string;
  observaciones?: string;
  lote?: string;
  fechaVencimiento?: string;
  estado: 'CONFORME' | 'NO_CONFORME';
}
```

## 🎨 Componentes Visuales

### Dashboard de Estadísticas
- 4 Cards con iconos y colores distintivos
- Parciales (naranja), Completas (verde)
- Conformes (azul), No Conformes (rojo)
- Actualización automática de contadores

### Sección de Órdenes Pendientes
- Tabla de órdenes confirmadas o en proceso
- Botón "Recibir" para cada orden
- Vista rápida de datos del proveedor y fecha de entrega

### Tabla de Recepciones
- Columnas: #, Número, Fecha, Orden, Almacén, Estado, Conformidad, Items, Acciones
- Badges de colores para estados y conformidad
- Botones de acción (Ver Detalle, Eliminar)

### Formulario de Recepción
- **Información General:** Orden, almacén, fecha, observaciones
- **Info de la Orden:** Proveedor, RUC, fecha entrega, estado
- **Detalle de Items:** Tabla editable con cantidades
- Campos por item: Ordenada, Recibida, Aceptada, Rechazada, Lote, F. Vencimiento
- Indicador de conformidad en tiempo real

### Modal de Detalle
- Vista completa de la recepción
- Grid de información general
- Totales de aceptados y rechazados
- Tabla de items recibidos con estados

## 🔧 Métodos Principales

### Carga de Datos
- `cargarRecepciones()` - Carga todas las recepciones
- `cargarOrdenesCompra()` - Carga órdenes pendientes
- `cargarAlmacenes()` - Carga almacenes disponibles

### Gestión de Recepción
- `nuevaRecepcionForm()` - Inicializa formulario nuevo
- `onOrdenChange()` - Carga items al seleccionar orden
- `guardarRecepcion()` - Guarda recepción y actualiza orden
- `eliminarRecepcion(index)` - Elimina recepción

### Control de Cantidades
- `actualizarCantidades(detalle)` - Valida y calcula cantidades
- `actualizarConformidadGeneral()` - Determina conformidad
- `actualizarOrdenCompra()` - Actualiza cantidades en la orden

### Generación
- `generarNumeroRecepcion()` - Genera número único (REC-YYYYMMDD-HHMMSS)

### Acciones
- `verDetalle(recepcion)` - Abre modal de detalle

### Filtros
- `recepcionesFiltradas()` - Aplica filtros activos
- `limpiarFiltros()` - Resetea todos los filtros

### Utilidades
- `obtenerClaseEstado(estado)` - Retorna clase CSS por estado
- `formatearFecha(fecha)` - Formatea fecha a DD/MM/YYYY
- `calcularPorcentajeRecepcion(recepcion)` - Calcula % recibido
- `calcularTotalAceptado(recepcion)` - Suma cantidades aceptadas
- `calcularTotalRechazado(recepcion)` - Suma cantidades rechazadas

## 📊 Cálculos y Validaciones

### Validación de Cantidades
```typescript
// Reglas:
cantidadRecibida >= 0
cantidadAceptada >= 0
cantidadRechazada >= 0
cantidadAceptada + cantidadRechazada <= cantidadRecibida

// Si la suma excede:
cantidadAceptada = cantidadRecibida - cantidadRechazada
```

### Estado del Item
```typescript
if (cantidadRechazada > 0) → NO_CONFORME
else → CONFORME
```

### Conformidad General
```typescript
if (algún item NO_CONFORME) → conformidad = false
else → conformidad = true
```

### Estado de la Recepción
```typescript
if (todos los items recibidos >= ordenados) → COMPLETA
else → PARCIAL
```

### Actualización de Orden de Compra
```typescript
// Por cada item recibido:
item.cantidadRecibida += cantidadAceptada
item.cantidadPendiente = cantidad - cantidadRecibida

// Estado del item:
if (cantidadRecibida >= cantidad) → COMPLETO
else if (cantidadRecibida > 0) → PARCIAL
else → PENDIENTE

// Estado de la orden:
if (todos COMPLETO) → RECIBIDA_TOTAL
else if (alguno PARCIAL) → RECIBIDA_PARCIAL
```

## 🎯 Integración con Otros Módulos

### Órdenes de Compra
- Lee órdenes en estado CONFIRMADA, EN_PROCESO, RECIBIDA_PARCIAL
- Actualiza cantidades recibidas por item
- Actualiza estado de la orden (RECIBIDA_PARCIAL/RECIBIDA_TOTAL)
- Actualiza estado de cada item (PENDIENTE/PARCIAL/COMPLETO)

### Inventario (Futuro)
- Actualiza stock con cantidades aceptadas
- Registra lotes y fechas de vencimiento
- Genera movimientos de entrada al almacén

### Control de Calidad (Futuro)
- Registra no conformidades
- Genera reportes de calidad de proveedores
- Tracking de productos rechazados

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas
- ✅ Orden de compra requerida
- ✅ Almacén requerido
- ✅ Al menos un item con cantidad recibida
- ✅ Cantidades coherentes (aceptada + rechazada <= recibida)
- ✅ Confirmación antes de eliminar

### Permisos
- Solo usuarios con rol **ALLOGIST** o **TI** pueden acceder
- Guard: `AlmacenGuard`

## 📱 Responsive Breakpoints

- **Desktop:** > 768px - Vista completa con todas las columnas
- **Tablet:** 768px - Ajuste de grid a 2 columnas
- **Mobile:** < 768px - Grid de 1 columna, inputs más pequeños

## 🚀 Uso del Módulo

### Registrar Recepción desde Orden Pendiente
1. Ir a **Compras → Recepción de Mercadería**
2. En la sección "Órdenes Pendientes"
3. Click en **"Recibir"** de la orden deseada
4. Sistema carga automáticamente los items
5. Seleccionar almacén de destino
6. Registrar cantidades recibidas por item
7. Separar cantidades aceptadas y rechazadas
8. Registrar lotes y fechas de vencimiento (opcional)
9. Click en **"Guardar Recepción"**

### Registrar Recepción Manual
1. Click en **"Nueva Recepción"**
2. Seleccionar orden de compra
3. Seleccionar almacén
4. Completar cantidades por item
5. Click en **"Guardar Recepción"**

### Registrar Producto No Conforme
1. En el item correspondiente
2. Ingresar cantidad rechazada
3. Sistema calcula automáticamente cantidad aceptada
4. Estado del item cambia a **NO_CONFORME**
5. Conformidad general cambia a **NO CONFORME**
6. Agregar motivo de rechazo en observaciones

## 📊 Integración con Dexie (IndexedDB)

### Tablas Utilizadas
- `recepcionesOrdenCompra` - Almacena las recepciones
- `detalleRecepcion` - Almacena los items de cada recepción
- `ordenesCompra` - Lee y actualiza órdenes
- `detalleOrdenCompra` - Actualiza cantidades recibidas
- `almacenes` - Lee almacenes disponibles

### Operaciones
```typescript
// Guardar recepción
await this.dexieService.saveRecepcionOrdenCompra(recepcion);

// Listar recepciones
const recepciones = await this.dexieService.showRecepcionesOrdenCompra();

// Actualizar orden
await this.dexieService.saveOrdenCompra(orden);

// Eliminar recepción
await this.dexieService.recepcionesOrdenCompra.delete(id);
```

## 🎨 Clases CSS Principales

### Estados
- `.badge-warning` - PARCIAL (naranja)
- `.badge-success` - COMPLETA, CONFORME (verde)
- `.badge-danger` - NO_CONFORME (rojo)

### Highlights
- `.highlight-success` - Cantidades aceptadas (verde)
- `.highlight-danger` - Cantidades rechazadas (rojo)

## 📝 Notas de Desarrollo

- Componente standalone (no requiere módulo)
- Usa PrimeNG Table para tablas avanzadas
- Integración con AlertService para notificaciones
- Manejo de errores con try-catch
- Logging en consola para debugging
- Validación automática de cantidades
- Cálculo automático de conformidad
- Actualización en tiempo real de estados

## 🔄 Flujo Completo de Compras (COMPLETO)

```
✅ 1. REQUERIMIENTOS (Operativo)
✅ 2. APROBACIONES (Aprobador)
✅ 3. SOLICITUDES DE COMPRA (Almacén)
✅ 4. COTIZACIONES (Almacén)
✅ 5. ÓRDENES DE COMPRA (Almacén)
✅ 6. RECEPCIÓN DE MERCADERÍA (Almacén) ← MÓDULO ACTUAL
⏳ 7. ACTUALIZACIÓN DE STOCK (Automático)
```

## 🎯 Campos de la Recepción

### Información Básica
- Número de recepción (auto-generado)
- Fecha de recepción
- Orden de compra asociada
- Almacén de destino
- Estado (PARCIAL/COMPLETA)
- Conformidad (true/false)

### Por Item
- Código y descripción
- Cantidad ordenada (referencia)
- Cantidad recibida (input)
- Cantidad aceptada (input)
- Cantidad rechazada (input)
- Lote (opcional)
- Fecha de vencimiento (opcional)
- Estado (CONFORME/NO_CONFORME)
- Observaciones

### Control
- Usuario que recibe
- Observaciones generales
- Motivos de rechazo por item

## 💡 Mejoras Futuras

- Escaneo de códigos de barras para agilizar registro
- Captura de fotos de productos no conformes
- Generación automática de reportes de recepción
- Integración con balanzas para pesaje automático
- Notificaciones a compras sobre no conformidades
- Generación de devoluciones a proveedor
- Integración con sistema de calidad
- Reportes de desempeño de proveedores
- Alertas de productos próximos a vencer

## 📋 Casos de Uso

### Caso 1: Recepción Completa y Conforme
```
- Orden: 100 unidades
- Recibido: 100 unidades
- Aceptado: 100 unidades
- Rechazado: 0 unidades
- Estado: COMPLETA
- Conformidad: CONFORME
- Orden actualiza a: RECIBIDA_TOTAL
```

### Caso 2: Recepción Parcial
```
- Orden: 100 unidades
- Recibido: 50 unidades
- Aceptado: 50 unidades
- Rechazado: 0 unidades
- Estado: PARCIAL
- Conformidad: CONFORME
- Orden actualiza a: RECIBIDA_PARCIAL
```

### Caso 3: Recepción con No Conformidad
```
- Orden: 100 unidades
- Recibido: 100 unidades
- Aceptado: 90 unidades
- Rechazado: 10 unidades (defectuosas)
- Estado: COMPLETA
- Conformidad: NO CONFORME
- Orden actualiza a: RECIBIDA_TOTAL
- Nota: Solo se aceptan 90 unidades al stock
```

### Caso 4: Recepción Múltiple (Entregas Parciales)
```
Primera recepción:
- Recibido: 50 unidades → Estado: PARCIAL

Segunda recepción:
- Recibido: 50 unidades → Estado: COMPLETA
- Orden actualiza a: RECIBIDA_TOTAL
```

## 🔄 Versión

**v1.0.0** - Implementación inicial completa
- Gestión completa de recepciones
- Control de cantidades aceptadas/rechazadas
- Validación automática de conformidad
- Actualización automática de órdenes de compra
- Dashboard de estadísticas
- Filtros avanzados
- Responsive design
- Integración completa con Órdenes de Compra
- Control de lotes y fechas de vencimiento

## 🎊 Cierre del Ciclo de Compras

Este módulo **completa el ciclo completo de compras** en el sistema de logística:

1. ✅ **Requerimientos** - Solicitud de necesidades
2. ✅ **Aprobaciones** - Validación de requerimientos
3. ✅ **Solicitudes de Compra** - Consolidación
4. ✅ **Cotizaciones** - Evaluación de proveedores
5. ✅ **Órdenes de Compra** - Formalización
6. ✅ **Recepción de Mercadería** - Cierre y validación

**El flujo está completamente implementado y funcional** 🎉
