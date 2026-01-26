# Módulo de Gestión de Inventario

## 📋 Descripción

El módulo de **Gestión de Inventario** permite controlar el stock de productos en los diferentes almacenes, registrar movimientos de entrada/salida, consultar el kardex de productos y mantener actualizado el inventario en tiempo real.

## 🎯 Funcionalidades Principales

### ✅ Control de Stock
- Vista consolidada de stock por almacén
- Alertas de stock bajo
- Búsqueda por código o descripción
- Filtros por almacén
- Indicadores visuales de nivel de stock

### 📊 Kardex de Productos
- Consulta de movimientos por producto
- Filtros por almacén y rango de fechas
- Cálculo automático de saldos
- Trazabilidad completa de movimientos
- Historial detallado

### 🔄 Registro de Movimientos
- **Entrada:** Ingreso de mercadería al almacén
- **Salida:** Despacho de productos
- **Transferencia:** Movimiento entre almacenes
- **Ajuste:** Correcciones de inventario
- Documento de referencia
- Motivo del movimiento

### 📈 Dashboard de Inventario
- Total de items en stock
- Total de almacenes activos
- Items con stock bajo
- Valor estimado del inventario

## 🏗️ Estructura del Módulo

```
gestion-inventario/
├── gestion-inventario.component.ts    # Lógica del componente
├── gestion-inventario.component.html  # Template HTML
├── gestion-inventario.component.scss  # Estilos
└── README.md                          # Documentación
```

## 🔗 Flujo de Trabajo

### 1. Consulta de Stock
```
Seleccionar Almacén → Filtrar Productos → Ver Stock Actual → Ver Detalle
```

### 2. Registro de Entrada
```
Nuevo Movimiento → Tipo: ENTRADA → Producto + Cantidad → Almacén Destino → Guardar
```

### 3. Registro de Salida
```
Nuevo Movimiento → Tipo: SALIDA → Producto + Cantidad → Almacén Origen → Guardar
```

### 4. Transferencia entre Almacenes
```
Nuevo Movimiento → Tipo: TRANSFERENCIA → Producto + Cantidad → 
Almacén Origen + Almacén Destino → Guardar
```

### 5. Consulta de Kardex
```
Ingresar Código → Seleccionar Almacén (opcional) → Rango de Fechas (opcional) → Buscar
```

## 📦 Interfaces Utilizadas

### Stock
```typescript
interface Stock {
  id?: number;
  codigo: string;
  almacen: string;
  cantidad: number;
  descripcion: string;
  unidadMedida: string;
  ultimaActualizacion: string;
}
```

### MovimientoStock
```typescript
interface MovimientoStock {
  id?: number;
  fecha: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA' | 'AJUSTE';
  codigo: string;
  almacenOrigen?: string;
  almacenDestino?: string;
  cantidad: number;
  referenciaDocumento?: string;
  usuario: string;
  motivo?: string;
}
```

## 🎨 Componentes Visuales

### Dashboard de Estadísticas
- 4 Cards con métricas clave
- Items en Stock (azul)
- Almacenes (verde)
- Stock Bajo (naranja)
- Valor Estimado (morado)

### Tab Stock Actual
- Filtros por almacén y código
- Checkbox "Solo stock bajo"
- Tabla con indicadores visuales
- Resaltado de filas con stock bajo
- Botón ver detalle por item

### Tab Kardex
- Formulario de búsqueda
- Tabla con columnas: Fecha, Tipo, Documento, Almacenes, Entrada, Salida, Saldo
- Cálculo automático de saldos
- Badges de colores por tipo de movimiento

### Tab Movimientos
- Listado de últimos 50 movimientos
- Vista cronológica descendente
- Información completa de cada movimiento

### Modal Nuevo Movimiento
- Selector de tipo de movimiento
- Campos dinámicos según tipo
- Validaciones automáticas
- Documento de referencia opcional

### Modal Detalle Stock
- Información completa del item
- Barra de progreso visual
- Indicador de estado (OK/BAJO)
- Última actualización

## 🔧 Métodos Principales

### Carga de Datos
- `cargarDatos()` - Carga stock, movimientos y almacenes
- `calcularContadores()` - Actualiza estadísticas del dashboard

### Gestión de Stock
- `stockFiltrado()` - Aplica filtros activos
- `limpiarFiltrosStock()` - Resetea filtros
- `verDetalleStock(stock)` - Abre modal de detalle

### Kardex
- `buscarKardex()` - Consulta movimientos de un producto
- `calcularSaldoKardex(index)` - Calcula saldo acumulado
- `limpiarKardex()` - Resetea búsqueda

### Movimientos
- `abrirFormMovimiento()` - Abre formulario de nuevo movimiento
- `guardarMovimiento()` - Registra movimiento y actualiza stock
- `actualizarStock(movimiento)` - Actualiza cantidades en stock
- `actualizarStockAlmacen(codigo, almacen, cantidad)` - Actualiza stock específico

### Utilidades
- `formatearFecha(fecha)` - Formato DD/MM/YYYY HH:MM
- `obtenerClaseTipoMovimiento(tipo)` - Clase CSS por tipo
- `obtenerIconoTipoMovimiento(tipo)` - Icono por tipo
- `esStockBajo(cantidad)` - Valida si está bajo el umbral
- `calcularPorcentajeStock(cantidad)` - Calcula % de stock

## 📊 Tipos de Movimientos

### ENTRADA
- **Uso:** Ingreso de mercadería al almacén
- **Origen:** Recepciones de compra, devoluciones de clientes
- **Efecto:** Incrementa stock en almacén destino
- **Campos requeridos:** Almacén Destino

### SALIDA
- **Uso:** Despacho de productos
- **Origen:** Ventas, consumos, despachos
- **Efecto:** Disminuye stock en almacén origen
- **Campos requeridos:** Almacén Origen

### TRANSFERENCIA
- **Uso:** Movimiento entre almacenes
- **Origen:** Redistribución de stock
- **Efecto:** Disminuye en origen, incrementa en destino
- **Campos requeridos:** Almacén Origen y Destino

### AJUSTE
- **Uso:** Correcciones de inventario
- **Origen:** Toma física, corrección de errores
- **Efecto:** Ajusta stock (positivo o negativo)
- **Campos requeridos:** Almacén Destino

## 🎯 Integración con Otros Módulos

### Recepción de Mercadería
- Al registrar recepción conforme → Genera movimiento ENTRADA
- Actualiza stock automáticamente
- Vincula con documento de recepción

### Despachos
- Al despachar productos → Genera movimiento SALIDA
- Disminuye stock del almacén
- Vincula con documento de despacho

### Órdenes de Compra
- Referencia en movimientos de entrada
- Trazabilidad de origen de mercadería

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas
- ✅ Código de producto requerido
- ✅ Cantidad mayor a 0
- ✅ Almacén origen/destino según tipo
- ✅ No permitir salidas sin stock suficiente (futuro)
- ✅ Usuario que registra el movimiento

### Permisos
- Solo usuarios con rol **ALLOGIST** o **TI** pueden acceder
- Guard: `AlmacenGuard`

## 📱 Responsive Breakpoints

- **Desktop:** > 768px - Vista completa con 3 tabs
- **Tablet:** 768px - Ajuste de grids
- **Mobile:** < 768px - Grid de 1 columna, scroll horizontal en tablas

## 🚀 Uso del Módulo

### Consultar Stock de un Producto
1. Ir a **Inventario → Gestión de Inventario**
2. Tab **"Stock Actual"**
3. Ingresar código o descripción en filtro
4. Seleccionar almacén (opcional)
5. Ver resultados en tabla

### Registrar Entrada de Mercadería
1. Click en **"Nuevo Movimiento"**
2. Seleccionar tipo: **ENTRADA**
3. Ingresar código del producto
4. Ingresar cantidad
5. Seleccionar almacén destino
6. Ingresar documento de referencia (ej: REC-001)
7. Agregar motivo (opcional)
8. Click en **"Guardar Movimiento"**

### Registrar Salida por Despacho
1. Click en **"Nuevo Movimiento"**
2. Seleccionar tipo: **SALIDA**
3. Ingresar código del producto
4. Ingresar cantidad
5. Seleccionar almacén origen
6. Ingresar documento de referencia (ej: DESP-001)
7. Click en **"Guardar Movimiento"**

### Transferir entre Almacenes
1. Click en **"Nuevo Movimiento"**
2. Seleccionar tipo: **TRANSFERENCIA**
3. Ingresar código del producto
4. Ingresar cantidad
5. Seleccionar almacén origen
6. Seleccionar almacén destino
7. Click en **"Guardar Movimiento"**

### Consultar Kardex
1. Tab **"Kardex"**
2. Ingresar código del producto
3. Seleccionar almacén (opcional)
4. Seleccionar rango de fechas (opcional)
5. Click en **"Buscar"**
6. Ver movimientos y saldos

### Realizar Ajuste de Inventario
1. Click en **"Nuevo Movimiento"**
2. Seleccionar tipo: **AJUSTE**
3. Ingresar código del producto
4. Ingresar cantidad (positiva para aumentar, negativa para disminuir)
5. Seleccionar almacén
6. Ingresar motivo del ajuste
7. Click en **"Guardar Movimiento"**

## 📊 Integración con Dexie (IndexedDB)

### Tablas Utilizadas
- `stock` - Almacena cantidades por producto y almacén
- `movimientosStock` - Registra todos los movimientos
- `almacenes` - Lista de almacenes disponibles

### Operaciones
```typescript
// Guardar movimiento
await this.dexieService.saveMovimientoStock(movimiento);

// Actualizar stock
await this.dexieService.saveStock(stock);

// Listar stock
const stock = await this.dexieService.showStock();

// Listar movimientos
const movimientos = await this.dexieService.showMovimientosStock();
```

## 🎨 Clases CSS Principales

### Tipos de Movimiento
- `.badge-success` - ENTRADA (verde)
- `.badge-danger` - SALIDA (rojo)
- `.badge-info` - TRANSFERENCIA (azul)
- `.badge-warning` - AJUSTE (naranja)

### Estados de Stock
- `.badge-success` - Stock OK (verde)
- `.badge-danger` - Stock BAJO (rojo)

### Resaltados
- `.stock-bajo` - Fila con stock bajo (fondo rojo claro)
- `.cantidad.bajo` - Cantidad en rojo

## 📝 Notas de Desarrollo

- Componente standalone (no requiere módulo)
- Usa PrimeNG Table para tablas avanzadas
- Actualización automática de stock tras cada movimiento
- Cálculo de saldos en tiempo real en kardex
- Validaciones antes de guardar movimientos
- Umbral de stock bajo configurable (actualmente 10 unidades)

## 🔄 Flujo de Actualización de Stock

### Entrada
```typescript
1. Usuario registra movimiento ENTRADA
2. Sistema valida datos
3. Guarda movimiento en BD
4. Busca stock existente (código + almacén destino)
5. Si existe: Incrementa cantidad
6. Si no existe: Crea nuevo registro
7. Actualiza fecha de última actualización
```

### Salida
```typescript
1. Usuario registra movimiento SALIDA
2. Sistema valida datos
3. Guarda movimiento en BD
4. Busca stock existente (código + almacén origen)
5. Disminuye cantidad
6. Actualiza fecha de última actualización
```

### Transferencia
```typescript
1. Usuario registra movimiento TRANSFERENCIA
2. Sistema valida datos
3. Guarda movimiento en BD
4. Disminuye stock en almacén origen
5. Incrementa stock en almacén destino
6. Actualiza fechas en ambos registros
```

## 💡 Mejoras Futuras

- Validación de stock disponible antes de salidas
- Alertas automáticas de stock bajo
- Stock mínimo y máximo por producto
- Punto de reorden automático
- Valorización de inventario (PEPS, UEPS, Promedio)
- Toma física de inventario
- Conciliación de inventario
- Reportes de rotación de inventario
- Productos con lotes y fechas de vencimiento
- Códigos de barras para escaneo
- Integración con balanzas
- Exportación de kardex a Excel/PDF

## 🎯 Casos de Uso

### Caso 1: Recepción de Compra
```
Recepción conforme → Sistema genera movimiento ENTRADA automático →
Stock se actualiza → Producto disponible para despacho
```

### Caso 2: Despacho a Cliente
```
Despacho aprobado → Sistema genera movimiento SALIDA automático →
Stock se reduce → Actualización en tiempo real
```

### Caso 3: Redistribución de Stock
```
Almacén A tiene exceso, Almacén B tiene falta →
Transferencia de A a B → Stock se balancea
```

### Caso 4: Corrección por Toma Física
```
Toma física revela diferencia → Ajuste de inventario →
Stock se corrige → Motivo documentado
```

## 🔄 Versión

**v1.0.0** - Implementación inicial completa
- Control de stock por almacén
- Kardex de productos
- Registro de 4 tipos de movimientos
- Dashboard con estadísticas
- Filtros avanzados
- Actualización automática de stock
- Responsive design
- Integración con Recepciones y Despachos

## 🎊 Valor del Módulo

Este módulo es **crítico para el sistema de logística** porque:

1. ✅ **Cierra el ciclo** Recepción → Stock → Despacho
2. ✅ **Visibilidad en tiempo real** del inventario
3. ✅ **Trazabilidad completa** de movimientos
4. ✅ **Control de stock** por almacén
5. ✅ **Prevención de faltantes** con alertas
6. ✅ **Auditoría** de todos los movimientos
7. ✅ **Base para valorización** de inventario
8. ✅ **Integración perfecta** con compras y despachos

**El módulo de Gestión de Inventario es el corazón del control de almacenes.** 📦🎯
