# Módulo de Reportes Avanzados de Compras

## 📋 Descripción

El módulo de **Reportes Avanzados de Compras** proporciona análisis profundos y detallados del proceso de compras, complementando el Dashboard básico con reportes especializados, comparativas y análisis de tendencias.

## 🎯 Funcionalidades Principales

### ✅ 5 Tipos de Reportes
1. **Gasto por Proveedor** - Análisis de concentración de compras
2. **Gasto por Categoría** - Distribución de compras por tipo
3. **Tendencias** - Evolución mensual de compras
4. **Análisis de Ahorro** - Comparación cotizaciones vs órdenes
5. **Devoluciones** - Reporte consolidado de devoluciones

### 📊 Análisis Avanzados
- Gráficos de barras con porcentajes
- Comparativas de montos
- Identificación de ahorros
- Tendencias temporales
- Top proveedores y categorías

### 🔎 Filtros Globales
- Rango de fechas
- Proveedor específico
- Moneda (PEN/USD)
- Aplicables a todos los reportes

### 📥 Exportación (Preparado)
- Exportar a Excel
- Exportar a PDF
- Estructura lista para implementación

## 🏗️ Estructura del Módulo

```
reportes-compras/
├── reportes-compras.component.ts    # Lógica y generación de reportes
├── reportes-compras.component.html  # Template con 5 reportes
├── reportes-compras.component.scss  # Estilos profesionales
└── README.md                        # Documentación
```

## 🔗 Flujo de Trabajo

### 1. Seleccionar Tipo de Reporte
```
Acceder al módulo → Seleccionar tipo de reporte → 
Aplicar filtros (opcional) → Generar reporte
```

### 2. Aplicar Filtros
```
Fecha Inicio/Fin → Proveedor → Moneda → Click "Generar"
```

### 3. Analizar Resultados
```
Ver tabla de datos → Analizar gráficos → 
Identificar insights → Exportar (futuro)
```

## 📦 Interfaces Utilizadas

### ReporteGastoProveedor
```typescript
interface ReporteGastoProveedor {
  proveedor: string;
  nombreProveedor: string;
  totalOrdenes: number;
  montoTotal: number;
  porcentaje: number;
}
```

### ReporteGastoCategoria
```typescript
interface ReporteGastoCategoria {
  categoria: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
}
```

### ReporteTendencia
```typescript
interface ReporteTendencia {
  mes: string;
  solicitudes: number;
  ordenes: number;
  monto: number;
}
```

### ReporteAhorro
```typescript
interface ReporteAhorro {
  item: string;
  montoCotizado: number;
  montoOrden: number;
  ahorro: number;
  porcentajeAhorro: number;
}
```

## 🎨 Componentes Visuales

### Selector de Reportes
- 5 botones tipo card
- Iconos representativos
- Estado activo visual
- Responsive grid

### Filtros Globales
- Fecha inicio/fin
- Búsqueda de proveedor
- Selector de moneda
- Botones Generar y Limpiar

### Reporte: Gasto por Proveedor
- **Estadísticas:** Total gasto, órdenes, proveedores
- **Tabla:** RUC, Proveedor, Órdenes, Monto, %
- **Gráfico:** Barra de progreso por porcentaje
- **Ordenamiento:** Por monto descendente

### Reporte: Gasto por Categoría
- **Top 10** categorías
- **Tabla:** Categoría, Cantidad, Monto, %
- **Gráfico:** Barra de progreso
- **Análisis:** Distribución de compras

### Reporte: Tendencias
- **Últimos 12 meses**
- **Tabla:** Mes, Solicitudes, Órdenes, Monto, Promedio
- **Análisis:** Evolución temporal
- **Comparativa:** Solicitudes vs Órdenes

### Reporte: Análisis de Ahorro
- **Top 20** items con mayor ahorro
- **Tabla:** Item, Cotizado, Orden, Ahorro, %
- **Colores:** Verde (ahorro), Rojo (sobrecosto)
- **Resaltado:** Filas con ahorro positivo/negativo

### Reporte: Devoluciones
- **Consolidado** de todas las devoluciones
- **Tabla:** Número, Fecha, Proveedor, Orden, Tipo, Monto, Estado, Resolución
- **Filtros:** Por fecha y proveedor
- **Análisis:** Calidad de proveedores

## 🔧 Métodos Principales

### Carga de Datos
- `cargarDatos()` - Carga todas las entidades necesarias
- `cargarUsuario()` - Carga usuario actual

### Generación de Reportes
- `generarReporte()` - Genera reporte según tipo seleccionado
- `generarReporteProveedores()` - Análisis por proveedor
- `generarReporteCategorias()` - Análisis por categoría
- `generarReporteTendencias()` - Análisis temporal
- `generarReporteAhorro()` - Comparativa de ahorros

### Filtros
- `aplicarFiltros()` - Aplica filtros globales
- `limpiarFiltros()` - Resetea todos los filtros
- `devolucionesFiltradas()` - Filtra devoluciones

### Cálculos
- `calcularTotales()` - Calcula totales generales

### Exportación (Preparado)
- `exportarExcel()` - Exporta a Excel (en desarrollo)
- `exportarPDF()` - Exporta a PDF (en desarrollo)

### Utilidades
- `formatearFecha(fecha)` - Formato DD/MM/YYYY
- `formatearMoneda(monto, moneda)` - Formato con símbolo
- `obtenerColorPorcentaje(porcentaje)` - Color según porcentaje

## 📊 Análisis Detallados

### 1. Gasto por Proveedor
**Objetivo:** Identificar concentración de compras
- Muestra todos los proveedores con órdenes
- Calcula % del total de gasto
- Ordena por monto descendente
- Gráfico visual de participación

**Insights:**
- Proveedores con mayor volumen
- Dependencia de proveedores
- Oportunidades de diversificación

### 2. Gasto por Categoría
**Objetivo:** Distribución de compras por tipo
- Top 10 categorías
- Cantidad y monto por categoría
- Porcentaje del total

**Insights:**
- Categorías con mayor gasto
- Oportunidades de consolidación
- Análisis de necesidades

### 3. Tendencias
**Objetivo:** Evolución temporal
- Últimos 12 meses
- Solicitudes vs Órdenes
- Monto total por mes
- Promedio por orden

**Insights:**
- Estacionalidad de compras
- Crecimiento/decrecimiento
- Eficiencia de conversión

### 4. Análisis de Ahorro
**Objetivo:** Comparar cotizaciones vs órdenes
- Top 20 items con diferencias
- Ahorro positivo (verde)
- Sobrecosto (rojo)
- Porcentaje de ahorro

**Insights:**
- Efectividad de negociación
- Items con mejor precio
- Oportunidades de mejora

### 5. Devoluciones
**Objetivo:** Calidad de proveedores
- Todas las devoluciones
- Filtrable por fecha y proveedor
- Estado y resolución

**Insights:**
- Proveedores con problemas
- Frecuencia de devoluciones
- Impacto económico

## 🎯 Integración con Otros Módulos

### Solicitudes de Compra
- Lee todas las solicitudes
- Cuenta solicitudes por mes
- Análisis de tendencias

### Cotizaciones
- Lee cotizaciones seleccionadas
- Compara precios cotizados
- Calcula ahorros potenciales

### Órdenes de Compra
- Base principal de análisis
- Montos por proveedor
- Montos por categoría
- Tendencias temporales

### Recepciones
- Valida órdenes recibidas
- Análisis de cumplimiento

### Devoluciones
- Reporte consolidado
- Análisis de calidad
- Impacto en proveedores

## 🔐 Seguridad y Validaciones

### Permisos
- Solo usuarios con rol **ALLOGIST** o **TI** pueden acceder
- Guard: `AlmacenGuard`

### Validaciones
- ✅ Fechas coherentes (inicio ≤ fin)
- ✅ Manejo de datos vacíos
- ✅ Cálculos seguros (división por cero)

## 📱 Responsive Breakpoints

- **Desktop:** > 768px - Vista completa con grid de 5 columnas
- **Tablet:** 768px - Grid adaptativo
- **Mobile:** < 768px - Grid de 1 columna, scroll horizontal en tablas

## 🚀 Uso del Módulo

### Generar Reporte de Gasto por Proveedor
1. Ir a **Compras → Reportes Avanzados**
2. Click en **"Gasto por Proveedor"**
3. Aplicar filtros si es necesario:
   - Fecha inicio/fin
   - Proveedor específico
   - Moneda
4. Click en **"Generar"**
5. Analizar tabla y gráficos

### Analizar Tendencias de Compras
1. Click en **"Tendencias"**
2. Seleccionar rango de fechas (opcional)
3. Click en **"Generar"**
4. Revisar evolución mensual
5. Identificar patrones estacionales

### Identificar Ahorros
1. Click en **"Análisis de Ahorro"**
2. Click en **"Generar"**
3. Revisar items con ahorro positivo (verde)
4. Identificar items con sobrecosto (rojo)
5. Analizar oportunidades de mejora

### Analizar Devoluciones
1. Click en **"Devoluciones"**
2. Aplicar filtros de fecha y proveedor
3. Click en **"Generar"**
4. Identificar proveedores problemáticos
5. Analizar frecuencia y montos

## 📊 Integración con Dexie (IndexedDB)

### Tablas Utilizadas
- `solicitudesCompra` - Para tendencias
- `cotizaciones` - Para análisis de ahorro
- `ordenesCompra` - Base principal de análisis
- `recepcionesOrdenCompra` - Para validaciones
- `devolucionesProveedor` - Para reporte de devoluciones

### Operaciones
```typescript
// Cargar datos
const solicitudes = await this.dexieService.showSolicitudesCompra();
const cotizaciones = await this.dexieService.showCotizaciones();
const ordenes = await this.dexieService.showOrdenesCompra();
const devoluciones = await this.dexieService.showDevolucionesProveedor();
```

## 🎨 Clases CSS Principales

### Selector de Reportes
- `.report-btn` - Botón de reporte
- `.report-btn.active` - Reporte seleccionado (azul)

### Gráficos
- `.progress-bar-container` - Contenedor de barra
- `.progress-bar-fill` - Relleno con color dinámico

### Filas Especiales
- `.ahorro-positivo` - Fondo verde claro
- `.ahorro-negativo` - Fondo rojo claro

## 📝 Notas de Desarrollo

- Componente standalone
- Usa PrimeNG Table
- Cálculos en tiempo real
- Filtros aplicables a todos los reportes
- Preparado para exportación
- Gráficos con colores dinámicos

## 💡 Mejoras Futuras

- Implementar exportación a Excel real
- Implementar exportación a PDF real
- Gráficos interactivos (Chart.js, D3.js)
- Comparativas entre períodos
- Reportes personalizables
- Guardar configuraciones de filtros
- Programar reportes automáticos
- Envío por correo electrónico
- Drill-down en gráficos
- Dashboards personalizados por usuario

## 🎯 Casos de Uso

### Caso 1: Identificar Proveedores Clave
```
Reporte: Gasto por Proveedor
Resultado: Top 3 proveedores = 70% del gasto
Acción: Negociar mejores condiciones
```

### Caso 2: Optimizar Categorías
```
Reporte: Gasto por Categoría
Resultado: Categoría X = 40% del gasto
Acción: Buscar alternativas más económicas
```

### Caso 3: Planificar Presupuesto
```
Reporte: Tendencias
Resultado: Pico de compras en Q4
Acción: Anticipar presupuesto para Q4
```

### Caso 4: Validar Negociaciones
```
Reporte: Análisis de Ahorro
Resultado: Ahorro promedio = 15%
Acción: Reconocer equipo de compras
```

## 🔄 Versión

**v1.0.0** - Implementación inicial completa
- 5 tipos de reportes especializados
- Filtros globales aplicables
- Análisis de proveedores, categorías, tendencias
- Análisis de ahorro y devoluciones
- Gráficos visuales con barras de progreso
- Preparado para exportación
- Responsive design
- Integración completa con módulos de compras

## 🎊 Valor del Módulo

Este módulo es **crítico para la toma de decisiones** porque:

1. ✅ **Visibilidad completa** del proceso de compras
2. ✅ **Identificación de ahorros** y oportunidades
3. ✅ **Análisis de proveedores** para mejores decisiones
4. ✅ **Tendencias temporales** para planificación
5. ✅ **Control de calidad** con análisis de devoluciones
6. ✅ **Base para negociaciones** con datos concretos
7. ✅ **Optimización de categorías** de gasto
8. ✅ **Reportes ejecutivos** para dirección

**El módulo de Reportes Avanzados transforma datos en insights accionables.** 📊🎯
