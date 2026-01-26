# Módulo de Devoluciones a Proveedores

## 📋 Descripción

El módulo de **Devoluciones a Proveedores** permite gestionar el proceso completo de devolución de productos no conformes a los proveedores. Se integra directamente con las recepciones de mercadería para facilitar el registro de devoluciones y su seguimiento hasta la resolución.

## 🎯 Funcionalidades Principales

### ✅ Gestión de Devoluciones
- **Generar** devoluciones desde recepciones no conformes
- **Registrar** devoluciones con detalle de items
- **Seguimiento** de estados de devolución
- **Resolver** devoluciones (Reemplazo, Nota Crédito, Devolución Dinero)
- **Ver Detalle** completo de cada devolución

### 🔄 Proceso de Devolución
- Identificación de recepciones no conformes
- Generación automática de devolución
- Carga automática de items rechazados
- Cálculo automático de montos
- Generación de movimiento de salida en inventario
- Seguimiento de resolución

### 📊 Dashboard de Estadísticas
- Recepciones no conformes pendientes
- Total de devoluciones registradas
- Devoluciones pendientes de resolución
- Devoluciones resueltas

### 🔎 Filtros Avanzados
- Por estado de devolución
- Por rango de fechas
- Limpiar filtros rápidamente

### ⚡ Funciones Especiales
- Cambio de estado (Registrada → Enviada → Confirmada → Resuelta)
- Resolución con 3 opciones
- Actualización automática de inventario
- Trazabilidad completa

## 🏗️ Estructura del Módulo

```
devoluciones-proveedores/
├── devoluciones-proveedores.component.ts    # Lógica del componente
├── devoluciones-proveedores.component.html  # Template HTML
├── devoluciones-proveedores.component.scss  # Estilos
└── README.md                                # Documentación
```

## 🔗 Flujo de Trabajo

### 1. Identificar Recepción No Conforme
```
Recepción con productos rechazados → Tab "Recepciones No Conformes" →
Ver items rechazados → Generar Devolución
```

### 2. Registrar Devolución
```
Click "Devolver" → Sistema carga datos automáticamente →
Revisar items → Ajustar cantidades → Ingresar motivo → Guardar
```

### 3. Seguimiento de Devolución
```
REGISTRADA → ENVIADA → CONFIRMADA → RESUELTA
```

### 4. Resolución
```
Devolución CONFIRMADA → Seleccionar tipo de resolución →
(Reemplazo / Nota Crédito / Devolución Dinero) → Confirmar
```

## 📦 Interfaces Utilizadas

### DevolucionProveedor
```typescript
interface DevolucionProveedor {
  id?: number;
  numeroDevolucion: string;
  recepcionId: number;
  numeroRecepcion: string;
  ordenCompraId: number;
  numeroOrden: string;
  proveedor: string;
  nombreProveedor: string;
  rucProveedor: string;
  fecha: string;
  motivo: string;
  tipoDevolucion: 'TOTAL' | 'PARCIAL';
  detalle: DetalleDevolucion[];
  montoTotal: number;
  estado: 'REGISTRADA' | 'ENVIADA' | 'CONFIRMADA' | 'RESUELTA';
  resolucion?: 'REEMPLAZO' | 'NOTA_CREDITO' | 'DEVOLUCION_DINERO';
  fechaResolucion?: string;
  observaciones?: string;
  usuarioRegistra: string;
}
```

### DetalleDevolucion
```typescript
interface DetalleDevolucion {
  id?: number;
  devolucionId: number;
  codigo: string;
  descripcion: string;
  cantidadDevuelta: number;
  cantidadRecibida: number;
  unidadMedida: string;
  precioUnitario: number;
  subtotal: number;
  motivoDetalle: string;
  lote?: string;
  estado: 'PENDIENTE' | 'REEMPLAZADO' | 'ACREDITADO';
}
```

## 🎨 Componentes Visuales

### Dashboard de Estadísticas
- 4 Cards con métricas clave
- Recepciones No Conformes (naranja)
- Total Devoluciones (azul)
- Pendientes (morado)
- Resueltas (verde)

### Tab Recepciones No Conformes
- Tabla de recepciones con productos rechazados
- Contador de items rechazados
- Total de cantidad rechazada
- Botón "Devolver" por recepción

### Tab Devoluciones Registradas
- Filtros por estado y fechas
- Tabla completa de devoluciones
- Badges de estado y resolución
- Botones de acción contextuales

### Formulario de Devolución
- **Info del Proveedor:** Datos automáticos de la orden
- **Datos Generales:** Número, fecha, tipo, motivo
- **Detalle de Items:** Tabla editable con cantidades
- Cálculo automático de montos

### Modal de Detalle
- Vista completa de la devolución
- Grid de información general
- Tabla de items devueltos
- Sección de resolución (si está confirmada)

## 🔧 Métodos Principales

### Carga de Datos
- `cargarDatos()` - Carga recepciones no conformes y devoluciones
- `calcularContadores()` - Actualiza estadísticas

### Generación
- `generarDevolucionDesdeRecepcion(recepcion)` - Crea devolución desde recepción
- `generarNumeroDevolucion()` - Genera número único (DEV-YYYYMMDD-HHMMSS)

### Gestión de Devolución
- `guardarDevolucion()` - Guarda devolución y actualiza inventario
- `calcularMontoTotal()` - Suma subtotales de items
- `actualizarSubtotal(detalle)` - Recalcula subtotal de item

### Movimientos de Inventario
- `generarMovimientoSalida()` - Crea movimiento SALIDA por cada item
- Actualiza stock en almacén

### Estados y Resolución
- `cambiarEstado(devolucion, nuevoEstado)` - Cambia estado de devolución
- `resolverDevolucion(devolucion, resolucion)` - Marca como resuelta

### Acciones
- `verDetalle(devolucion)` - Abre modal de detalle

### Filtros
- `devolucionesFiltradas()` - Aplica filtros activos
- `limpiarFiltros()` - Resetea filtros

### Utilidades
- `formatearFecha(fecha)` - Formato DD/MM/YYYY
- `formatearMoneda(monto)` - Formato S/ con decimales
- `obtenerClaseEstado(estado)` - Clase CSS por estado
- `obtenerClaseResolucion(resolucion)` - Clase CSS por resolución
- `obtenerEtiquetaResolucion(resolucion)` - Etiqueta legible
- `contarItemsRechazados(recepcion)` - Cuenta items rechazados
- `calcularTotalRechazado(recepcion)` - Suma cantidades rechazadas

## 📊 Estados de la Devolución

### REGISTRADA
- **Descripción:** Devolución creada, pendiente de envío
- **Acciones:** Editar, Marcar como Enviada
- **Color:** Azul (info)

### ENVIADA
- **Descripción:** Devolución enviada al proveedor
- **Acciones:** Confirmar Recepción por proveedor
- **Color:** Naranja (warning)

### CONFIRMADA
- **Descripción:** Proveedor confirmó recepción
- **Acciones:** Resolver devolución
- **Color:** Morado (primary)

### RESUELTA
- **Descripción:** Devolución resuelta completamente
- **Acciones:** Solo visualización
- **Color:** Verde (success)

## 🎯 Tipos de Resolución

### REEMPLAZO
- **Descripción:** Proveedor reemplaza productos defectuosos
- **Efecto:** Items marcados como REEMPLAZADO
- **Proceso:** Esperar nueva recepción de reemplazo
- **Color:** Verde (success)

### NOTA_CREDITO
- **Descripción:** Proveedor emite nota de crédito
- **Efecto:** Items marcados como ACREDITADO
- **Proceso:** Aplicar crédito en futuras compras
- **Color:** Azul (info)

### DEVOLUCION_DINERO
- **Descripción:** Proveedor devuelve el dinero
- **Efecto:** Items marcados como ACREDITADO
- **Proceso:** Esperar reembolso
- **Color:** Naranja (warning)

## 🎯 Integración con Otros Módulos

### Recepción de Mercadería
- Lee recepciones no conformes (conformidad = false)
- Carga items con cantidadRechazada > 0
- Obtiene motivos de rechazo

### Órdenes de Compra
- Lee datos del proveedor
- Obtiene precios unitarios
- Calcula montos de devolución

### Gestión de Inventario
- Genera movimiento de SALIDA por devolución
- Actualiza stock en almacén
- Registra trazabilidad completa

### Maestro de Proveedores
- Muestra datos del proveedor
- Historial de devoluciones (futuro)

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas
- ✅ Motivo de devolución requerido
- ✅ Al menos un item para devolver
- ✅ Cantidades coherentes
- ✅ Confirmación antes de cambiar estado
- ✅ Confirmación antes de resolver

### Permisos
- Solo usuarios con rol **ALLOGIST** o **TI** pueden acceder
- Guard: `AlmacenGuard`

## 📱 Responsive Breakpoints

- **Desktop:** > 768px - Vista completa con todas las columnas
- **Tablet:** 768px - Ajuste de grids
- **Mobile:** < 768px - Grid de 1 columna, scroll horizontal en tablas

## 🚀 Uso del Módulo

### Generar Devolución desde Recepción No Conforme
1. Ir a **Compras → Devoluciones a Proveedores**
2. Tab **"Recepciones No Conformes"**
3. Localizar recepción con productos rechazados
4. Click en **"Devolver"**
5. Sistema carga automáticamente:
   - Datos del proveedor
   - Items rechazados
   - Cantidades y precios
6. Revisar y ajustar cantidades si es necesario
7. Ingresar motivo de devolución
8. Click en **"Registrar Devolución"**

### Enviar Devolución al Proveedor
1. Tab **"Devoluciones Registradas"**
2. Localizar devolución en estado REGISTRADA
3. Click en botón **"Enviar"** (sobre)
4. Confirmar acción
5. Estado cambia a ENVIADA

### Confirmar Recepción por Proveedor
1. Localizar devolución en estado ENVIADA
2. Click en botón **"Confirmar"** (check)
3. Confirmar que proveedor recibió la devolución
4. Estado cambia a CONFIRMADA

### Resolver Devolución
1. Localizar devolución en estado CONFIRMADA
2. Click en **"Ver Detalle"**
3. En sección "Resolver Devolución"
4. Seleccionar tipo de resolución:
   - **Reemplazo:** Si proveedor enviará productos nuevos
   - **Nota de Crédito:** Si se aplicará crédito
   - **Devolución de Dinero:** Si se reembolsará
5. Confirmar resolución
6. Estado cambia a RESUELTA

## 📊 Integración con Dexie (IndexedDB)

### Tablas Utilizadas
- `recepcionesOrdenCompra` - Lee recepciones no conformes
- `devolucionesProveedor` - Almacena devoluciones
- `detalleDevolucion` - Almacena items de devoluciones
- `ordenesCompra` - Lee datos de proveedores y precios
- `movimientosStock` - Registra salidas por devolución
- `stock` - Actualiza cantidades

### Operaciones
```typescript
// Guardar devolución
await this.dexieService.saveDevolucionProveedor(devolucion);

// Listar devoluciones
const devoluciones = await this.dexieService.showDevolucionesProveedor();

// Listar recepciones no conformes
const recepciones = await this.dexieService.showRecepcionesOrdenCompra();
const noConformes = recepciones.filter(r => !r.conformidad);
```

## 🎨 Clases CSS Principales

### Estados
- `.badge-info` - REGISTRADA (azul)
- `.badge-warning` - ENVIADA, PARCIAL (naranja)
- `.badge-primary` - CONFIRMADA (morado)
- `.badge-success` - RESUELTA, TOTAL (verde)

### Resoluciones
- `.badge-success` - REEMPLAZO (verde)
- `.badge-info` - NOTA_CREDITO (azul)
- `.badge-warning` - DEVOLUCION_DINERO (naranja)

## 📝 Notas de Desarrollo

- Componente standalone (no requiere módulo)
- Usa PrimeNG Table para tablas avanzadas
- Generación automática de número de devolución
- Actualización automática de inventario
- Cálculos automáticos de montos
- Validaciones antes de guardar
- Confirmaciones para acciones críticas

## 🔄 Flujo de Actualización de Inventario

### Al Registrar Devolución
```typescript
1. Usuario guarda devolución
2. Sistema genera movimiento de SALIDA por cada item
3. Stock se reduce en almacén
4. Movimiento referencia número de devolución
5. Trazabilidad completa registrada
```

## 💡 Mejoras Futuras

- Adjuntar fotos de productos defectuosos
- Generación automática de documentos (guías de remisión)
- Notificaciones automáticas al proveedor
- Integración con correo electrónico
- Reportes de devoluciones por proveedor
- Análisis de calidad de proveedores
- Penalidades automáticas por no conformidades
- Tracking de envío de devoluciones
- Portal para proveedores
- Exportación de devoluciones a Excel/PDF

## 🎯 Casos de Uso

### Caso 1: Devolución Total
```
Recepción: 100 unidades, todas defectuosas
Devolución: TOTAL, 100 unidades
Resolución: REEMPLAZO
Resultado: Proveedor envía 100 unidades nuevas
```

### Caso 2: Devolución Parcial
```
Recepción: 100 unidades, 20 defectuosas
Devolución: PARCIAL, 20 unidades
Resolución: NOTA_CREDITO
Resultado: Crédito aplicado en siguiente compra
```

### Caso 3: Devolución con Reembolso
```
Recepción: Producto incorrecto
Devolución: TOTAL
Resolución: DEVOLUCION_DINERO
Resultado: Proveedor reembolsa el monto
```

## 🔄 Versión

**v1.0.0** - Implementación inicial completa
- Gestión completa de devoluciones
- Integración con recepciones no conformes
- 4 estados de seguimiento
- 3 tipos de resolución
- Actualización automática de inventario
- Dashboard con estadísticas
- Filtros avanzados
- Responsive design
- Trazabilidad completa

## 🎊 Valor del Módulo

Este módulo es **crítico para el control de calidad** porque:

1. ✅ **Cierra el ciclo** de control de calidad
2. ✅ **Gestiona no conformidades** de manera estructurada
3. ✅ **Actualiza inventario** automáticamente
4. ✅ **Seguimiento completo** hasta resolución
5. ✅ **Trazabilidad** de productos defectuosos
6. ✅ **Evaluación de proveedores** (base para análisis)
7. ✅ **Protección financiera** con devoluciones
8. ✅ **Mejora continua** identificando problemas recurrentes

**El módulo de Devoluciones a Proveedores completa el ciclo de compras con control de calidad.** 🔄🎯
