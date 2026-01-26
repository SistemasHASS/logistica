# Módulo de Órdenes de Compra

## 📋 Descripción

El módulo de **Órdenes de Compra** permite gestionar las órdenes de compra generadas desde las cotizaciones seleccionadas. Este módulo es fundamental para formalizar las compras con proveedores y realizar el seguimiento hasta la recepción de mercadería.

## 🎯 Funcionalidades Principales

### ✅ CRUD Completo
- **Crear** órdenes de compra manualmente o desde cotizaciones
- **Listar** todas las órdenes con filtros avanzados
- **Editar** órdenes en estado GENERADA
- **Eliminar** órdenes en estado GENERADA
- **Ver Detalle** completo de cada orden

### 🔄 Gestión de Órdenes
- Generación automática desde cotización seleccionada
- Transferencia de datos del proveedor y condiciones comerciales
- Control de estados del ciclo de vida de la orden
- Seguimiento de recepción (parcial/total)
- Cancelación de órdenes con motivo

### 📊 Dashboard de Estadísticas
- Total de órdenes generadas
- Total enviadas al proveedor
- Total confirmadas por proveedor
- Total en proceso de preparación
- Total recibidas (parcial o total)

### 🔍 Filtros Avanzados
- Por estado (7 estados diferentes)
- Por proveedor (nombre o código)
- Por rango de fechas
- Limpiar filtros rápidamente

### 📈 Seguimiento y Control
- Barra de progreso de recepción por orden
- Timeline visual del estado de la orden
- Porcentaje de cumplimiento de entrega
- Control de cantidades (ordenada, recibida, pendiente)

## 🏗️ Estructura del Módulo

```
ordenes-compra/
├── ordenes-compra.component.ts    # Lógica del componente
├── ordenes-compra.component.html  # Template HTML
├── ordenes-compra.component.scss  # Estilos
└── README.md                      # Documentación
```

## 🔗 Flujo de Trabajo

### 1. Generación desde Cotización
```
Cotización Seleccionada → Generar OC → Transferencia Automática de Datos → Orden Generada
```

**Proceso:**
1. Sistema muestra cotizaciones seleccionadas pendientes
2. Usuario hace clic en "Generar OC"
3. Sistema carga automáticamente:
   - Datos del proveedor
   - Condiciones comerciales
   - Items cotizados con precios
   - Fecha de entrega estimada
4. Usuario revisa y completa información adicional
5. Guardar orden de compra

### 2. Estados de la Orden
```
GENERADA → ENVIADA → CONFIRMADA → EN_PROCESO → RECIBIDA_PARCIAL/RECIBIDA_TOTAL
                                                ↓
                                            CANCELADA
```

### 3. Ciclo Completo
```
1. Cotización Seleccionada
   ↓
2. Generar Orden de Compra
   ↓
3. Enviar al Proveedor
   ↓
4. Proveedor Confirma
   ↓
5. Proveedor Prepara Pedido (EN_PROCESO)
   ↓
6. Recepción de Mercadería
   ↓
7. Orden Completa
```

## 📦 Interfaces Utilizadas

### OrdenCompra
```typescript
interface OrdenCompra {
  id?: number;
  numeroOrden: string;
  solicitudCompraId: number;
  cotizacionId?: number;
  fecha: string;
  fechaEntrega: string;
  proveedor: string;
  nombreProveedor: string;
  rucProveedor: string;
  direccionEntrega: string;
  contactoProveedor?: string;
  telefonoProveedor?: string;
  correoProveedor?: string;
  montoTotal: number;
  moneda: string;
  formaPago: string;
  condicionesPago: string;
  plazoEntrega: number;
  garantia?: string;
  penalidades?: string;
  detalle: DetalleOrdenCompra[];
  estado: 'GENERADA' | 'ENVIADA' | 'CONFIRMADA' | 'EN_PROCESO' | 
          'RECIBIDA_PARCIAL' | 'RECIBIDA_TOTAL' | 'CANCELADA';
  usuarioGenera: string;
}
```

### DetalleOrdenCompra
```typescript
interface DetalleOrdenCompra {
  id?: number;
  ordenCompraId: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  cantidadRecibida: number;
  cantidadPendiente: number;
  unidadMedida: string;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
  impuesto: number;
  total: number;
  marca?: string;
  modelo?: string;
  especificaciones?: string;
  estado: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO' | 'CANCELADO';
}
```

## 🎨 Componentes Visuales

### Dashboard de Estadísticas
- 5 Cards con iconos y colores distintivos
- Generadas (azul), Enviadas (naranja), Confirmadas (morado)
- En Proceso (gris), Recibidas (verde)
- Animaciones hover
- Actualización automática de contadores

### Sección de Cotizaciones Pendientes
- Tabla de cotizaciones seleccionadas sin orden generada
- Botón "Generar OC" para cada cotización
- Vista rápida de datos clave del proveedor

### Tabla de Órdenes
- Columnas: #, Número, Fecha, Proveedor, Monto, Fecha Entrega, Estado, Progreso, Acciones
- Barra de progreso visual por orden
- Badges de colores para estados
- Múltiples botones de acción contextuales

### Formulario de Orden
- **Información General:** Proveedor, fechas, condiciones
- **Contacto:** Teléfono, correo, dirección
- **Detalle de Items:** Tabla con cantidades y precios
- Grid responsive
- Campos de solo lectura para datos generados

### Modal de Detalle
- Vista completa de la orden
- Grid de información general
- Tabla de items con cantidades recibidas y pendientes
- Estados visuales con badges

### Modal de Seguimiento (Timeline)
- Timeline vertical con estados
- Marcadores visuales (completados en verde)
- Información de fechas y usuarios
- Barra de progreso de recepción

## 🔧 Métodos Principales

### Carga de Datos
- `cargarOrdenesCompra()` - Carga todas las órdenes
- `cargarCotizaciones()` - Carga cotizaciones seleccionadas
- `cargarAlmacenes()` - Carga almacenes disponibles

### CRUD
- `nuevaOrdenCompraForm()` - Inicializa formulario nuevo
- `guardarOrdenCompra()` - Guarda o actualiza orden
- `editarOrdenCompra(index)` - Carga orden para edición
- `eliminarOrdenCompra(index)` - Elimina orden

### Generación
- `generarDesdeCotizacion(cotizacion)` - Crea orden desde cotización
- `generarNumeroOrden()` - Genera número único (OC-YYYYMMDD-HHMMSS)
- `calcularFechaEntrega(plazoEntrega)` - Calcula fecha estimada

### Gestión de Estados
- `enviarOrdenCompra(orden)` - Cambia estado a ENVIADA
- `confirmarOrdenCompra(orden)` - Cambia estado a CONFIRMADA
- `iniciarProcesoOrden(orden)` - Cambia estado a EN_PROCESO
- `cancelarOrdenCompra(orden)` - Cancela orden con motivo

### Acciones
- `verDetalle(orden)` - Abre modal de detalle
- `verSeguimiento(orden)` - Abre modal de timeline

### Filtros
- `ordenesCompraFiltradas()` - Aplica filtros activos
- `limpiarFiltros()` - Resetea todos los filtros

### Utilidades
- `obtenerClaseEstado(estado)` - Retorna clase CSS por estado
- `formatearFecha(fecha)` - Formatea fecha a DD/MM/YYYY
- `formatearMoneda(monto, moneda)` - Formatea monto con símbolo
- `calcularPorcentajeRecibido(orden)` - Calcula % de recepción
- `obtenerEstadoDetalle(detalle)` - Determina estado del item

## 📊 Cálculos y Lógica

### Porcentaje de Recepción
```typescript
totalOrdenado = Σ(cantidad de cada item)
totalRecibido = Σ(cantidadRecibida de cada item)
porcentajeRecibido = (totalRecibido / totalOrdenado) × 100
```

### Estado del Item
```typescript
if (cantidadRecibida === 0) → PENDIENTE
if (cantidadRecibida >= cantidad) → COMPLETO
else → PARCIAL
```

### Cantidad Pendiente
```typescript
cantidadPendiente = cantidad - cantidadRecibida
```

## 🎯 Integración con Otros Módulos

### Cotizaciones
- Lee cotizaciones en estado SELECCIONADA
- Genera orden automáticamente con todos los datos
- Transfiere items, precios y condiciones comerciales

### Solicitudes de Compra
- Actualiza estado a ORDEN_GENERADA al crear orden
- Mantiene trazabilidad con `solicitudCompraId`

### Recepción de Mercadería (Próximo)
- Registra cantidades recibidas por item
- Actualiza estado de la orden (PARCIAL/TOTAL)
- Controla conformidad de entrega

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas
- ✅ Proveedor completo (código, nombre, RUC)
- ✅ Dirección de entrega requerida
- ✅ Al menos un item en el detalle
- ✅ Solo editar/eliminar órdenes en estado GENERADA
- ✅ Confirmación antes de cambiar estados
- ✅ Confirmación antes de cancelar

### Permisos
- Solo usuarios con rol **ALLOGIST** o **TI** pueden acceder
- Guard: `AlmacenGuard`

## 📱 Responsive Breakpoints

- **Desktop:** > 768px - Vista completa con todas las columnas
- **Tablet:** 768px - Ajuste de grid a 2 columnas
- **Mobile:** < 768px - Grid de 1 columna, tablas con scroll horizontal

## 🚀 Uso del Módulo

### Generar Orden desde Cotización
1. Ir a **Compras → Órdenes de Compra**
2. En la sección "Cotizaciones Seleccionadas"
3. Click en **"Generar OC"** de la cotización deseada
4. Sistema carga automáticamente todos los datos
5. Revisar y completar información adicional
6. Click en **"Guardar"**

### Crear Orden Manual
1. Click en **"Nueva Orden"**
2. Completar datos del proveedor
3. Ingresar condiciones comerciales
4. Agregar items manualmente
5. Click en **"Guardar"**

### Enviar Orden al Proveedor
1. En la tabla, click en botón **"Enviar"** (✉️)
2. Confirmar acción
3. Estado cambia a **ENVIADA**

### Confirmar Orden
1. Cuando proveedor confirma
2. Click en botón **"Confirmar"** (✓)
3. Estado cambia a **CONFIRMADA**

### Ver Seguimiento
1. Click en botón **"Seguimiento"** (📊)
2. Se abre timeline visual
3. Muestra progreso completo de la orden

## 📊 Integración con Dexie (IndexedDB)

### Tablas Utilizadas
- `ordenesCompra` - Almacena las órdenes
- `detalleOrdenCompra` - Almacena los items de cada orden
- `cotizaciones` - Lee cotizaciones seleccionadas
- `solicitudesCompra` - Actualiza estado de solicitudes

### Operaciones
```typescript
// Guardar orden
await this.dexieService.saveOrdenCompra(orden);

// Listar órdenes
const ordenes = await this.dexieService.showOrdenesCompra();

// Eliminar orden
await this.dexieService.ordenesCompra.delete(id);
```

## 🎨 Clases CSS Principales

### Estados
- `.badge-info` - GENERADA (azul)
- `.badge-warning` - ENVIADA, RECIBIDA_PARCIAL (naranja)
- `.badge-primary` - CONFIRMADA (morado)
- `.badge-secondary` - EN_PROCESO (gris)
- `.badge-success` - RECIBIDA_TOTAL (verde)
- `.badge-danger` - CANCELADA (rojo)

### Progreso
- `.progress-bar` - Contenedor de barra de progreso
- `.progress-fill` - Relleno con gradiente verde
- `.progress-text` - Texto del porcentaje

### Timeline
- `.timeline` - Contenedor del timeline
- `.timeline-item` - Cada paso del timeline
- `.timeline-marker` - Marcador circular
- `.timeline-item.completed` - Paso completado (verde)

## 📝 Notas de Desarrollo

- Componente standalone (no requiere módulo)
- Usa PrimeNG Table para tablas avanzadas
- Integración con AlertService para notificaciones
- Manejo de errores con try-catch
- Logging en consola para debugging
- Timeline visual con CSS puro
- Barra de progreso animada

## 🔄 Flujo Completo de Compras

```
1. REQUERIMIENTOS (Operativo)
   ↓
2. APROBACIONES (Aprobador)
   ↓
3. SOLICITUDES DE COMPRA (Almacén)
   ↓
4. COTIZACIONES (Almacén)
   ↓
5. ÓRDENES DE COMPRA (Almacén) ← MÓDULO ACTUAL
   ↓
6. RECEPCIÓN DE MERCADERÍA (Almacén) ← Próximo módulo
   ↓
7. ACTUALIZACIÓN DE STOCK
```

## 🎯 Próximos Pasos

1. **Recepción de Mercadería** - Registrar llegada de productos
2. **Control de Calidad** - Validar conformidad de productos
3. **Integración con Contabilidad** - Registro de facturas
4. **Reportes de Compras** - Análisis de compras por período

## 💡 Mejoras Futuras

- Generación automática de PDF de la orden
- Envío automático por email al proveedor
- Notificaciones de vencimiento de fecha de entrega
- Alertas de órdenes retrasadas
- Gráficos de desempeño de proveedores
- Historial de compras por proveedor
- Comparativo de precios históricos
- Integración con sistema ERP

## 🔄 Estados Detallados

| Estado | Descripción | Acciones Permitidas |
|--------|-------------|---------------------|
| **GENERADA** | Orden creada, pendiente de envío | Editar, Eliminar, Enviar |
| **ENVIADA** | Enviada al proveedor | Confirmar, Cancelar |
| **CONFIRMADA** | Confirmada por proveedor | Iniciar Proceso, Cancelar |
| **EN_PROCESO** | Proveedor preparando pedido | Ver Seguimiento |
| **RECIBIDA_PARCIAL** | Recepción parcial de items | Ver Seguimiento |
| **RECIBIDA_TOTAL** | Todos los items recibidos | Ver Detalle |
| **CANCELADA** | Orden cancelada | Solo lectura |

## 📋 Campos de la Orden

### Información Básica
- Número de Orden (auto-generado)
- Fecha de emisión
- Fecha de entrega estimada
- Estado

### Datos del Proveedor
- Código de proveedor
- Nombre o razón social
- RUC
- Dirección de entrega
- Contacto (nombre, teléfono, correo)

### Condiciones Comerciales
- Moneda (PEN/USD)
- Forma de pago
- Condiciones de pago
- Plazo de entrega (días)
- Garantía
- Penalidades

### Control
- Usuario que genera
- Usuario que aprueba
- Fecha de aprobación
- Observaciones

## 🔄 Versión

**v1.0.0** - Implementación inicial completa
- CRUD completo
- Generación automática desde cotizaciones
- Control de estados del ciclo de vida
- Timeline de seguimiento
- Barra de progreso de recepción
- Dashboard de estadísticas
- Filtros avanzados
- Responsive design
- Integración completa con Cotizaciones y Solicitudes
