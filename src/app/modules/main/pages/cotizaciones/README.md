# Módulo de Cotizaciones

## 📋 Descripción

El módulo de **Cotizaciones** permite gestionar las cotizaciones de proveedores para las solicitudes de compra. Este módulo es esencial en el proceso de selección de proveedores y generación de órdenes de compra.

## 🎯 Funcionalidades Principales

### ✅ CRUD Completo
- **Crear** cotizaciones vinculadas a solicitudes de compra
- **Listar** todas las cotizaciones con filtros avanzados
- **Editar** cotizaciones en estado RECIBIDA
- **Eliminar** cotizaciones en estado RECIBIDA
- **Ver Detalle** completo de cada cotización

### 🔄 Gestión de Cotizaciones
- Vinculación automática con solicitudes de compra
- Carga automática de items desde la solicitud
- Cálculo automático de montos (subtotal, descuento, IGV, total)
- Selección de cotización ganadora
- Rechazo de cotizaciones con motivo

### 📊 Dashboard de Estadísticas
- Total de cotizaciones recibidas
- Total en evaluación
- Total seleccionadas
- Total rechazadas

### 🔍 Filtros Avanzados
- Por estado (RECIBIDA, EN_EVALUACION, SELECCIONADA, RECHAZADA)
- Por proveedor (nombre o código)
- Por rango de fechas
- Limpiar filtros rápidamente

### 💰 Cálculos Automáticos
- Subtotal por item
- Descuentos (porcentaje y monto)
- IGV (configurable por item)
- Total por item
- Monto total de la cotización

## 🏗️ Estructura del Módulo

```
cotizaciones/
├── cotizaciones.component.ts    # Lógica del componente
├── cotizaciones.component.html  # Template HTML
├── cotizaciones.component.scss  # Estilos
└── README.md                    # Documentación
```

## 🔗 Flujo de Trabajo

### 1. Creación de Cotización
```
Solicitud de Compra → Selección → Carga Items → Ingreso Precios → Guardar
```

**Proceso:**
1. Seleccionar solicitud de compra (ENVIADA o APROBADA)
2. Sistema carga automáticamente los items solicitados
3. Ingresar datos del proveedor (código, nombre, RUC)
4. Completar condiciones comerciales (plazo, forma pago, etc.)
5. Ingresar precios unitarios por item
6. Sistema calcula automáticamente descuentos, IGV y totales
7. Guardar cotización

### 2. Estados de la Cotización
```
RECIBIDA → EN_EVALUACION → SELECCIONADA
                          ↓
                       RECHAZADA
```

### 3. Evaluación y Selección
```
Múltiples Cotizaciones → Comparación → Selección Ganadora → Actualiza Solicitud
```

## 📦 Interfaces Utilizadas

### Cotizacion
```typescript
interface Cotizacion {
  id?: number;
  numeroCotizacion: string;
  solicitudCompraId: number;
  numeroSolicitud: string;
  proveedor: string;
  nombreProveedor: string;
  rucProveedor: string;
  fecha: string;
  fechaVencimiento: string;
  montoTotal: number;
  moneda: string;
  plazoEntrega: number;
  condicionesPago: string;
  validezOferta: number;
  formaPago: string;
  lugarEntrega: string;
  detalle: DetalleCotizacion[];
  estado: 'RECIBIDA' | 'EN_EVALUACION' | 'SELECCIONADA' | 'RECHAZADA';
  seleccionada: boolean;
}
```

### DetalleCotizacion
```typescript
interface DetalleCotizacion {
  id?: number;
  cotizacionId: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  descuento: number;
  porcentajeDescuento: number;
  subtotal: number;
  impuesto: number;
  porcentajeImpuesto: number;
  total: number;
  marca?: string;
  modelo?: string;
  especificaciones?: string;
}
```

## 🎨 Componentes Visuales

### Dashboard de Estadísticas
- 4 Cards con iconos y colores distintivos
- Animaciones hover
- Actualización automática de contadores

### Tabla de Cotizaciones
- Columnas: #, Número, Fecha, Solicitud, Proveedor, Monto Total, Plazo, Estado, Acciones
- Información del proveedor (nombre y RUC)
- Badges de colores para estados
- Botones de acción contextuales

### Formulario de Cotización
- **Información General:** Solicitud, proveedor, condiciones comerciales
- **Detalle de Items:** Tabla editable con cálculos automáticos
- Grid responsive
- Validaciones en tiempo real

### Modal de Detalle Item
- Campos: Código, descripción, cantidad, precio, descuento, IGV
- Campos adicionales: Marca, modelo, especificaciones
- Cálculo automático al agregar/editar

### Modal de Detalle Cotización
- Vista completa de la cotización
- Grid de información general
- Tabla de items cotizados
- Estados visuales con badges

## 🔧 Métodos Principales

### Carga de Datos
- `cargarCotizaciones()` - Carga todas las cotizaciones
- `cargarSolicitudesCompra()` - Carga solicitudes disponibles
- `onSolicitudChange()` - Carga items al seleccionar solicitud

### CRUD
- `nuevaCotizacionForm()` - Inicializa formulario nuevo
- `guardarCotizacion()` - Guarda o actualiza cotización
- `editarCotizacion(index)` - Carga cotización para edición
- `eliminarCotizacion(index)` - Elimina cotización

### Gestión de Detalle
- `agregarDetalle()` - Agrega/actualiza item en detalle
- `editarDetalle(index)` - Carga item para edición
- `eliminarDetalle(index)` - Elimina item del detalle
- `calcularMontos(detalle)` - Calcula subtotal, descuento, IGV, total
- `calcularTotales()` - Calcula monto total de la cotización

### Evaluación
- `seleccionarCotizacion(cotizacion)` - Marca como ganadora
- `rechazarCotizacion(cotizacion)` - Rechaza con motivo
- `obtenerMejorPrecio(solicitudId)` - Obtiene el menor precio

### Generación
- `generarNumeroCotizacion()` - Genera número único (COT-YYYYMMDD-HHMMSS)

### Acciones
- `verDetalle(cotizacion)` - Abre modal de detalle
- `abrirComparativo(solicitudId)` - Compara cotizaciones de una solicitud

### Filtros
- `cotizacionesFiltradas()` - Aplica filtros activos
- `limpiarFiltros()` - Resetea todos los filtros

### Utilidades
- `obtenerClaseEstado(estado)` - Retorna clase CSS por estado
- `formatearFecha(fecha)` - Formatea fecha a DD/MM/YYYY
- `formatearMoneda(monto, moneda)` - Formatea monto con símbolo

## 🧮 Fórmulas de Cálculo

### Por Item
```typescript
// Subtotal
subtotal = cantidad × precioUnitario

// Descuento
descuento = subtotal × (porcentajeDescuento / 100)

// Base Imponible
baseImponible = subtotal - descuento

// IGV
impuesto = baseImponible × (porcentajeImpuesto / 100)

// Total Item
total = baseImponible + impuesto
```

### Total Cotización
```typescript
montoTotal = Σ(total de cada item)
```

## 🎯 Integración con Otros Módulos

### Solicitudes de Compra
- Lee solicitudes en estado ENVIADA o APROBADA
- Carga automáticamente los items solicitados
- Actualiza estado a EN_COTIZACION al seleccionar ganadora

### Órdenes de Compra (Próximo)
- Genera orden de compra desde cotización seleccionada
- Transfiere datos del proveedor y condiciones comerciales

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas
- ✅ Solicitud de compra requerida
- ✅ Datos del proveedor completos (código, nombre, RUC)
- ✅ Al menos un item en el detalle
- ✅ Precio unitario mayor a 0
- ✅ Cantidad mayor a 0
- ✅ Solo editar/eliminar cotizaciones en estado RECIBIDA
- ✅ Confirmación antes de seleccionar/rechazar

### Permisos
- Solo usuarios con rol **ALLOGIST** o **TI** pueden acceder
- Guard: `AlmacenGuard`

## 📱 Responsive Breakpoints

- **Desktop:** > 768px - Vista completa con todas las columnas
- **Tablet:** 768px - Ajuste de grid a 2 columnas
- **Mobile:** < 768px - Grid de 1 columna, tablas con scroll horizontal

## 🚀 Uso del Módulo

### Crear Cotización
1. Ir a **Compras → Cotizaciones**
2. Click en **"Nueva Cotización"**
3. Seleccionar solicitud de compra
4. Completar datos del proveedor
5. Ingresar condiciones comerciales
6. Editar precios de los items cargados
7. Click en **"Guardar"**

### Agregar/Editar Item
1. En el formulario de cotización
2. Click en **"Agregar Item"** o editar existente
3. Completar datos del item
4. Sistema calcula automáticamente los montos
5. Click en **"Agregar"** o **"Actualizar"**

### Seleccionar Cotización Ganadora
1. En la tabla de cotizaciones
2. Click en botón **"Seleccionar"** (✓)
3. Confirmar acción
4. Estado cambia a **SELECCIONADA**
5. Solicitud de compra cambia a **EN_COTIZACION**

### Rechazar Cotización
1. En la tabla de cotizaciones
2. Click en botón **"Rechazar"** (✗)
3. Ingresar motivo del rechazo
4. Confirmar acción
5. Estado cambia a **RECHAZADA**

## 📊 Integración con Dexie (IndexedDB)

### Tablas Utilizadas
- `cotizaciones` - Almacena las cotizaciones
- `detalleCotizacion` - Almacena los items de cada cotización
- `solicitudesCompra` - Lee solicitudes disponibles
- `detalleSolicitudCompra` - Lee items de solicitudes

### Operaciones
```typescript
// Guardar cotización
await this.dexieService.saveCotizacion(cotizacion);

// Listar cotizaciones
const cotizaciones = await this.dexieService.showCotizaciones();

// Eliminar cotización
await this.dexieService.cotizaciones.delete(id);
```

## 🎨 Clases CSS Principales

### Estados
- `.badge-info` - RECIBIDA (azul)
- `.badge-warning` - EN_EVALUACION (naranja)
- `.badge-success` - SELECCIONADA (verde)
- `.badge-danger` - RECHAZADA (rojo)

### Montos
- `.amount-highlight` - Resalta montos importantes (verde)
- `.total-amount` - Monto total (verde, tamaño grande)

## 📝 Notas de Desarrollo

- Componente standalone (no requiere módulo)
- Usa PrimeNG Table para tablas avanzadas
- Integración con AlertService para notificaciones
- Manejo de errores con try-catch
- Logging en consola para debugging
- Cálculos automáticos en tiempo real
- Validación de RUC (11 dígitos)

## 🔄 Flujo Completo de Compras

```
1. REQUERIMIENTOS (Operativo)
   ↓
2. APROBACIONES (Aprobador)
   ↓
3. SOLICITUDES DE COMPRA (Almacén) ← Consolidación
   ↓
4. COTIZACIONES (Almacén) ← MÓDULO ACTUAL
   ↓
5. ÓRDENES DE COMPRA (Almacén) ← Próximo módulo
   ↓
6. RECEPCIÓN DE MERCADERÍA (Almacén)
```

## 🎯 Próximos Pasos

1. **Comparativo de Cotizaciones** - Tabla comparativa lado a lado
2. **Criterios de Evaluación** - Ponderación de factores (precio, calidad, plazo)
3. **Órdenes de Compra** - Generar OC desde cotización seleccionada
4. **Historial de Proveedores** - Tracking de desempeño

## 💡 Mejoras Futuras

- Importación masiva de cotizaciones desde Excel
- Envío automático de solicitud de cotización a proveedores (email)
- Notificaciones de vencimiento de cotizaciones
- Gráficos comparativos de precios
- Integración con sistema de proveedores
- Validación de RUC con SUNAT

## 🔄 Versión

**v1.0.0** - Implementación inicial completa
- CRUD completo
- Cálculos automáticos
- Selección/Rechazo de cotizaciones
- Dashboard de estadísticas
- Filtros avanzados
- Responsive design
- Integración con Solicitudes de Compra
