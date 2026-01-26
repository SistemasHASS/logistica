# Dashboard de Compras

## 📋 Descripción

El **Dashboard de Compras** es un módulo de análisis y visualización que consolida toda la información del proceso de compras. Proporciona métricas clave (KPIs), gráficos y análisis en tiempo real para la toma de decisiones estratégicas.

## 🎯 Funcionalidades Principales

### 📊 KPIs Principales
- **Total Solicitudes de Compra** - Con monto estimado total
- **Total Cotizaciones** - Con monto total cotizado
- **Total Órdenes de Compra** - Con monto total de órdenes
- **Total Recepciones** - Con cantidad de recepciones completas

### 📈 Métricas de Rendimiento
- **Eficiencia de Compras** - % de órdenes recibidas vs total
- **Tasa de Conformidad** - % de recepciones conformes
- **Ahorro Estimado** - Diferencia entre cotizaciones y órdenes
- **Cotizaciones Activas** - En proceso de evaluación

### 📉 Gráficos y Análisis
- **Solicitudes por Estado** - Gráfico de barras
- **Órdenes por Estado** - Gráfico de barras
- **Recepciones por Mes** - Tendencia temporal

### 🔍 Desglose Detallado
- Estados de Solicitudes de Compra
- Estados de Cotizaciones
- Estados de Órdenes de Compra
- Estados de Recepciones

### 👥 Top Proveedores
- Ranking de proveedores por monto
- Cantidad de órdenes por proveedor
- Monto total por proveedor

### 🕐 Últimas Actividades
- Últimas 5 solicitudes
- Últimas 5 órdenes
- Últimas 5 recepciones

### 🔎 Filtros
- Filtro por rango de fechas
- Aplicar/Limpiar filtros
- Actualización automática de métricas

## 🏗️ Estructura del Módulo

```
dashboard-compras/
├── dashboard-compras.component.ts    # Lógica y cálculos
├── dashboard-compras.component.html  # Visualización
├── dashboard-compras.component.scss  # Estilos
└── README.md                         # Documentación
```

## 📊 KPIs y Métricas

### KPIs Generales
```typescript
- Total Solicitudes: Cantidad total de solicitudes de compra
- Total Cotizaciones: Cantidad total de cotizaciones recibidas
- Total Órdenes: Cantidad total de órdenes de compra
- Total Recepciones: Cantidad total de recepciones registradas
```

### Métricas Calculadas
```typescript
// Eficiencia de Compras
eficiencia = (Órdenes Recibidas / Total Órdenes) × 100

// Tasa de Conformidad
conformidad = (Recepciones Conformes / Total Recepciones) × 100

// Ahorro Estimado
ahorro = Monto Total Cotizaciones - Monto Total Órdenes
```

### Desglose por Estado

#### Solicitudes de Compra
- GENERADA
- ENVIADA
- APROBADA
- EN_COTIZACION

#### Cotizaciones
- RECIBIDA
- EN_EVALUACION
- SELECCIONADA

#### Órdenes de Compra
- GENERADA
- ENVIADA
- CONFIRMADA
- EN_PROCESO
- RECIBIDAS (PARCIAL + TOTAL)

#### Recepciones
- PARCIAL
- COMPLETA
- CONFORME
- NO_CONFORME

## 🎨 Componentes Visuales

### KPIs Principales (4 Cards)
- Diseño con gradientes
- Iconos distintivos
- Valores grandes y destacados
- Subtítulos con información adicional
- Animación hover

### Métricas de Rendimiento (4 Cards)
- Valor principal
- Barra de progreso visual
- Descripción del indicador
- Iconos representativos

### Gráficos de Barras
- Barras verticales con gradientes
- Altura proporcional al valor
- Etiquetas de estado
- Colores según tipo de estado

### Desglose por Estado (4 Cards)
- Lista de estados con badges
- Valores numéricos destacados
- Agrupación por módulo

### Top Proveedores (Tabla)
- Ranking numerado
- Nombre del proveedor
- Cantidad de órdenes
- Monto total

### Últimas Actividades (3 Cards)
- Número de documento
- Fecha de registro
- Badge de estado/conformidad
- Scroll si hay muchos items

## 🔧 Métodos Principales

### Carga de Datos
- `cargarDatos()` - Carga todos los datos de los módulos
- `aplicarFiltrosFecha()` - Filtra datos por rango de fechas

### Cálculo de KPIs
- `calcularKPIs()` - Calcula todos los KPIs principales
- `calcularAnalisis()` - Calcula análisis adicionales
- `prepararDatosGraficos()` - Prepara datos para visualización

### Métricas
- `calcularEficienciaCompras()` - % de eficiencia
- `calcularTasaConformidad()` - % de conformidad
- `calcularAhorro()` - Ahorro estimado
- `calcularPorcentaje(parte, total)` - Cálculo de porcentajes

### Análisis
- `calcularRecepcionesPorMes()` - Tendencia mensual
- Top proveedores por monto

### Filtros
- `aplicarFiltros()` - Aplica filtros de fecha
- `limpiarFiltros()` - Resetea filtros

### Utilidades
- `formatearFecha(fecha)` - Formato DD/MM/YYYY
- `formatearMoneda(monto, moneda)` - Formato con símbolo
- `obtenerClaseEstado(estado)` - Clase CSS por estado

## 📈 Análisis Disponibles

### Análisis Temporal
- Recepciones por mes (últimos 6 meses)
- Tendencias de actividad

### Análisis de Proveedores
- Top 5 proveedores por monto
- Cantidad de órdenes por proveedor
- Concentración de compras

### Análisis de Estados
- Distribución de solicitudes por estado
- Distribución de órdenes por estado
- Tasa de conversión en el proceso

### Análisis de Calidad
- Tasa de conformidad en recepciones
- Cantidad de no conformidades
- Productos rechazados

## 🎯 Casos de Uso

### Caso 1: Monitoreo Diario
```
Usuario: Gerente de Compras
Acción: Revisar dashboard al inicio del día
Objetivo: Conocer estado general del proceso
Métricas clave: KPIs principales, últimas actividades
```

### Caso 2: Análisis de Rendimiento
```
Usuario: Jefe de Almacén
Acción: Revisar métricas de rendimiento
Objetivo: Evaluar eficiencia del proceso
Métricas clave: Eficiencia, conformidad, ahorro
```

### Caso 3: Evaluación de Proveedores
```
Usuario: Analista de Compras
Acción: Revisar top proveedores
Objetivo: Identificar proveedores principales
Métricas clave: Ranking, montos, cantidad de órdenes
```

### Caso 4: Análisis Temporal
```
Usuario: Gerente de Logística
Acción: Aplicar filtros de fecha
Objetivo: Analizar período específico
Métricas clave: Todos los KPIs filtrados
```

## 🔐 Seguridad y Permisos

### Permisos
- Solo usuarios con rol **ALLOGIST** o **TI** pueden acceder
- Guard: `AlmacenGuard`

### Datos Mostrados
- Solo datos a los que el usuario tiene acceso
- Filtrado automático por permisos

## 📱 Responsive Design

- **Desktop:** > 768px - Grid completo, todos los gráficos visibles
- **Tablet:** 768px - Ajuste de grids, scroll en tablas
- **Mobile:** < 768px - Grid de 1 columna, cards apiladas

## 🚀 Uso del Módulo

### Acceder al Dashboard
1. Ir a **Compras → Dashboard de Compras**
2. Sistema carga automáticamente todos los datos
3. Visualizar KPIs y métricas

### Aplicar Filtros de Fecha
1. Seleccionar "Fecha Inicio"
2. Seleccionar "Fecha Fin"
3. Click en **"Aplicar"**
4. Dashboard se actualiza con datos filtrados

### Limpiar Filtros
1. Click en botón **"Limpiar"** (X)
2. Dashboard vuelve a mostrar todos los datos

### Interpretar Métricas

#### Eficiencia de Compras
- **> 80%:** Excelente - La mayoría de órdenes están siendo recibidas
- **60-80%:** Bueno - Proceso normal
- **< 60%:** Atención - Revisar órdenes pendientes

#### Tasa de Conformidad
- **> 95%:** Excelente - Proveedores confiables
- **85-95%:** Bueno - Calidad aceptable
- **< 85%:** Atención - Revisar calidad de proveedores

#### Ahorro Estimado
- **Positivo:** Se logró negociar mejor precio
- **Negativo:** Se pagó más que lo cotizado inicialmente

## 📊 Integración con Dexie (IndexedDB)

### Tablas Consultadas
- `solicitudesCompra` - Lee todas las solicitudes
- `cotizaciones` - Lee todas las cotizaciones
- `ordenesCompra` - Lee todas las órdenes
- `recepcionesOrdenCompra` - Lee todas las recepciones

### Operaciones
```typescript
// Cargar datos
const solicitudes = await this.dexieService.showSolicitudesCompra();
const cotizaciones = await this.dexieService.showCotizaciones();
const ordenes = await this.dexieService.showOrdenesCompra();
const recepciones = await this.dexieService.showRecepcionesOrdenCompra();
```

## 🎨 Paleta de Colores

### KPIs Principales
- **Primary (Morado):** Solicitudes de Compra
- **Info (Azul):** Cotizaciones
- **Success (Verde):** Órdenes de Compra
- **Warning (Naranja):** Recepciones

### Estados
- **Info (Azul):** GENERADA, RECIBIDA
- **Warning (Naranja):** ENVIADA, EN_EVALUACION, PARCIAL
- **Success (Verde):** APROBADA, SELECCIONADA, COMPLETA, CONFORME
- **Primary (Morado):** EN_COTIZACION, CONFIRMADA
- **Secondary (Gris):** EN_PROCESO
- **Danger (Rojo):** RECHAZADA, NO_CONFORME, CANCELADA

## 💡 Mejoras Futuras

- Gráficos interactivos con bibliotecas como Chart.js
- Exportación de reportes a PDF/Excel
- Comparativas mes a mes
- Predicciones con IA
- Alertas automáticas de KPIs fuera de rango
- Drill-down a detalle desde gráficos
- Dashboard personalizable por usuario
- Notificaciones en tiempo real

## 📝 Notas de Desarrollo

- Componente standalone (no requiere módulo)
- Usa PrimeNG Table para tablas
- Cálculos en tiempo real
- Actualización automática al aplicar filtros
- Gráficos con CSS puro (sin bibliotecas externas)
- Responsive design completo

## 🔄 Versión

**v1.0.0** - Implementación inicial completa
- KPIs principales (4 cards)
- Métricas de rendimiento (4 cards)
- Gráficos de barras (2 gráficos)
- Desglose por estado (4 cards)
- Top proveedores (tabla)
- Últimas actividades (3 cards)
- Filtros por fecha
- Responsive design
- Integración completa con todos los módulos de compras

## 🎊 Valor del Dashboard

Este dashboard proporciona una **vista 360° del proceso de compras**, permitiendo:

1. ✅ **Monitoreo en tiempo real** de todos los procesos
2. ✅ **Identificación rápida** de cuellos de botella
3. ✅ **Toma de decisiones** basada en datos
4. ✅ **Evaluación de proveedores** objetiva
5. ✅ **Medición de eficiencia** del proceso
6. ✅ **Control de calidad** de recepciones
7. ✅ **Análisis de ahorro** en compras
8. ✅ **Visibilidad completa** del flujo de compras

**El dashboard es la herramienta central para la gestión estratégica de compras.** 📊🎯
