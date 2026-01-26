# Módulo de Evaluación de Proveedores

## 📋 Descripción

El módulo de **Evaluación de Proveedores** permite calificar el desempeño de los proveedores basándose en criterios objetivos, generando un ranking que facilita la toma de decisiones en el proceso de compras y la mejora continua de la cadena de suministro.

## 🎯 Funcionalidades Principales

### ✅ Sistema de Evaluación
- **5 Criterios predefinidos** con pesos configurables
- Calificación de 0 a 10 por criterio
- Cálculo automático de puntaje ponderado
- Clasificación automática en 4 niveles

### 📊 Criterios de Evaluación
1. **Calidad** (30%) - Calidad de productos/servicios
2. **Tiempo de Entrega** (25%) - Cumplimiento de plazos
3. **Precio** (20%) - Competitividad de precios
4. **Servicio** (15%) - Atención y servicio al cliente
5. **Documentación** (10%) - Documentación completa y correcta

### 🏆 Ranking de Proveedores
- Clasificación automática por calificación
- Top 3 destacados visualmente
- Métricas de desempeño integradas
- Historial de evaluaciones

### 📈 Métricas Automáticas
- Total de órdenes de compra
- Órdenes recibidas
- Devoluciones registradas
- Tasa de cumplimiento
- Monto total de compras

### 🔎 Filtros y Búsqueda
- Por período (mes/año)
- Por proveedor
- Por nivel de calificación
- Historial completo

## 🏗️ Estructura del Módulo

```
evaluacion-proveedores/
├── evaluacion-proveedores.component.ts    # Lógica y cálculos
├── evaluacion-proveedores.component.html  # Template con 3 tabs
├── evaluacion-proveedores.component.scss  # Estilos profesionales
└── README.md                              # Documentación
```

## 🔗 Flujo de Trabajo

### 1. Seleccionar Proveedor
```
Tab "Nueva Evaluación" → Ver lista de proveedores con métricas →
Seleccionar proveedor → Ver historial de evaluaciones
```

### 2. Evaluar Criterios
```
Calificar cada criterio (0-10) → Sistema calcula puntaje ponderado →
Agregar comentarios por criterio → Ver calificación total en tiempo real
```

### 3. Finalizar Evaluación
```
Revisar calificación total → Agregar observaciones generales →
Guardar evaluación → Sistema clasifica automáticamente
```

### 4. Consultar Ranking
```
Tab "Ranking" → Ver proveedores ordenados por calificación →
Identificar top performers → Tomar decisiones
```

## 📦 Interfaces Utilizadas

### EvaluacionProveedor
```typescript
interface EvaluacionProveedor {
  id?: number;
  proveedor: string;
  nombreProveedor: string;
  rucProveedor: string;
  periodo: string; // YYYY-MM
  fechaEvaluacion: string;
  criterios: CriterioEvaluacionProveedor[];
  calificacionTotal: number;
  nivel: 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'DEFICIENTE';
  observaciones?: string;
  usuarioEvalua: string;
  estado: 'BORRADOR' | 'FINALIZADA';
}
```

### CriterioEvaluacionProveedor
```typescript
interface CriterioEvaluacionProveedor {
  id?: number;
  evaluacionId: number;
  criterio: 'CALIDAD' | 'TIEMPO_ENTREGA' | 'PRECIO' | 'SERVICIO' | 'DOCUMENTACION';
  descripcion: string;
  peso: number; // Porcentaje (0-100)
  calificacion: number; // Puntuación (0-10)
  puntajePonderado: number; // calificacion * peso / 100
  comentarios?: string;
}
```

## 🎨 Componentes Visuales

### Tab: Evaluaciones
- **Filtros:** Período, Proveedor, Nivel
- **Tabla:** Lista completa de evaluaciones
- **Badges:** Colores por nivel y estado
- **Acciones:** Ver detalle

### Tab: Nueva Evaluación
- **Selector de Proveedor:** Cards con métricas
- **Formulario:** Período y fecha
- **Criterios:** Grid de 5 criterios evaluables
- **Resultado:** Calificación total y nivel
- **Observaciones:** Comentarios generales

### Tab: Ranking
- **Cards de Proveedores:** Ordenados por calificación
- **Top 3:** Destacados con badge especial
- **Métricas:** Órdenes, devoluciones, cumplimiento
- **Período:** Fecha de última evaluación

## 🔧 Métodos Principales

### Carga de Datos
- `cargarDatos()` - Carga proveedores, órdenes, recepciones, devoluciones
- `calcularMetricasProveedores()` - Calcula métricas de desempeño

### Evaluación
- `nuevaEvaluacionForm()` - Inicializa formulario
- `seleccionarProveedor(proveedor)` - Selecciona proveedor a evaluar
- `calcularPuntajePonderado(criterio)` - Calcula puntaje por criterio
- `calcularCalificacionTotal()` - Suma puntajes y determina nivel
- `guardarEvaluacion()` - Guarda evaluación finalizada

### Visualización
- `verDetalle(evaluacion)` - Abre modal de detalle
- `rankingProveedores()` - Ordena proveedores por calificación

### Filtros
- `evaluacionesFiltradas()` - Aplica filtros activos
- `limpiarFiltros()` - Resetea filtros

### Utilidades
- `formatearFecha(fecha)` - Formato DD/MM/YYYY
- `formatearPeriodo(periodo)` - Formato "Mes YYYY"
- `obtenerClaseNivel(nivel)` - Clase CSS por nivel
- `obtenerColorCalificacion(calificacion)` - Color dinámico
- `obtenerIconoCriterio(criterio)` - Icono por criterio

## 📊 Niveles de Calificación

### EXCELENTE (9.0 - 10.0)
- **Color:** Verde
- **Descripción:** Proveedor de excelencia
- **Acción:** Priorizar en futuras compras

### BUENO (7.0 - 8.9)
- **Color:** Azul
- **Descripción:** Proveedor confiable
- **Acción:** Mantener relación comercial

### REGULAR (5.0 - 6.9)
- **Color:** Naranja
- **Descripción:** Proveedor con áreas de mejora
- **Acción:** Solicitar plan de mejora

### DEFICIENTE (0.0 - 4.9)
- **Color:** Rojo
- **Descripción:** Proveedor problemático
- **Acción:** Considerar reemplazo

## 🎯 Integración con Otros Módulos

### Maestro de Proveedores
- Lee datos básicos de proveedores
- Muestra RUC y nombre
- Vincula evaluaciones con proveedor

### Órdenes de Compra
- Cuenta total de órdenes por proveedor
- Calcula monto total de compras
- Identifica órdenes recibidas

### Recepciones
- Valida cumplimiento de entregas
- Identifica recepciones conformes
- Base para criterio de calidad

### Devoluciones
- Cuenta devoluciones por proveedor
- Impacta en calificación de calidad
- Reduce tasa de cumplimiento

### Reportes Avanzados
- Datos de evaluación en reportes
- Análisis de proveedores
- Tendencias de calificación

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas
- ✅ Proveedor seleccionado requerido
- ✅ Todos los criterios deben estar calificados
- ✅ Calificaciones entre 0 y 10
- ✅ Pesos suman 100%
- ✅ Usuario evaluador registrado

### Permisos
- Solo usuarios con rol **ALLOGIST** o **TI** pueden acceder
- Guard: `AlmacenGuard`

## 📱 Responsive Breakpoints

- **Desktop:** > 768px - Grid de 3 columnas en criterios
- **Tablet:** 768px - Grid de 2 columnas
- **Mobile:** < 768px - Grid de 1 columna, cards apiladas

## 🚀 Uso del Módulo

### Evaluar un Proveedor
1. Ir a **Maestros → Evaluación de Proveedores**
2. Click en **"Nueva Evaluación"**
3. Seleccionar proveedor de la lista
4. Revisar métricas automáticas
5. Calificar cada uno de los 5 criterios (0-10)
6. Agregar comentarios por criterio (opcional)
7. Revisar calificación total calculada
8. Agregar observaciones generales
9. Click en **"Guardar Evaluación"**

### Consultar Evaluaciones
1. Tab **"Evaluaciones"**
2. Aplicar filtros (período, proveedor, nivel)
3. Click en **"Ver Detalle"** para más información
4. Revisar criterios evaluados y comentarios

### Ver Ranking de Proveedores
1. Tab **"Ranking de Proveedores"**
2. Ver proveedores ordenados por calificación
3. Identificar top 3 (destacados en naranja)
4. Revisar métricas de desempeño
5. Tomar decisiones basadas en datos

## 📊 Integración con Dexie (IndexedDB)

### Tablas Utilizadas
- `proveedores` - Datos básicos
- `ordenesCompra` - Métricas de compras
- `recepcionesOrdenCompra` - Cumplimiento
- `devolucionesProveedor` - Problemas de calidad
- `evaluacionesProveedor` - Evaluaciones guardadas

### Operaciones
```typescript
// Guardar evaluación
await this.dexieService.saveEvaluacionProveedor(evaluacion);

// Listar evaluaciones
const evaluaciones = await this.dexieService.showEvaluacionesProveedor();

// Cargar datos relacionados
const ordenes = await this.dexieService.showOrdenesCompra();
const devoluciones = await this.dexieService.showDevolucionesProveedor();
```

## 🎨 Clases CSS Principales

### Niveles
- `.badge-success` - EXCELENTE (verde)
- `.badge-info` - BUENO (azul)
- `.badge-warning` - REGULAR (naranja)
- `.badge-danger` - DEFICIENTE (rojo)

### Ranking
- `.ranking-card` - Card de proveedor
- `.top3` - Badge especial para top 3
- `.posicion-numero` - Número de posición

## 📝 Notas de Desarrollo

- Componente standalone
- Usa PrimeNG Table
- Cálculos automáticos en tiempo real
- Pesos de criterios configurables
- Colores dinámicos según calificación
- Integración completa con módulos de compras

## 💡 Cálculo de Calificación

### Fórmula
```
Puntaje Ponderado = (Calificación × Peso) / 100

Calificación Total = Σ Puntajes Ponderados

Ejemplo:
- Calidad: 9 × 30% = 2.70
- Tiempo: 8 × 25% = 2.00
- Precio: 7 × 20% = 1.40
- Servicio: 8 × 15% = 1.20
- Documentación: 9 × 10% = 0.90
Total: 8.20 → BUENO
```

## 🔄 Flujo de Métricas Automáticas

### Al Seleccionar Proveedor
```typescript
1. Sistema busca todas las órdenes del proveedor
2. Cuenta órdenes totales
3. Cuenta órdenes recibidas (estado RECIBIDA_TOTAL/PARCIAL)
4. Cuenta devoluciones del proveedor
5. Calcula tasa de cumplimiento:
   ((Órdenes Recibidas - Devoluciones) / Total Órdenes) × 100
6. Busca última evaluación
7. Muestra todo en el card del proveedor
```

## 💡 Mejoras Futuras

- Evaluación automática basada en métricas
- Alertas de proveedores con calificación baja
- Gráficos de evolución de calificación
- Comparativa entre proveedores
- Exportación de evaluaciones a PDF
- Notificaciones a proveedores
- Portal para que proveedores vean sus evaluaciones
- Planes de mejora vinculados
- Reevaluación automática periódica
- Pesos de criterios personalizables por usuario

## 🎯 Casos de Uso

### Caso 1: Identificar Mejor Proveedor
```
Necesidad: Seleccionar proveedor para contrato anual
Acción: Consultar ranking de proveedores
Resultado: Top 3 con calificación EXCELENTE
Decisión: Negociar con el #1 del ranking
```

### Caso 2: Proveedor con Problemas
```
Situación: Múltiples devoluciones de un proveedor
Acción: Evaluar proveedor
Resultado: Calificación DEFICIENTE (4.2)
Decisión: Solicitar plan de mejora o reemplazar
```

### Caso 3: Evaluación Periódica
```
Proceso: Evaluación mensual de proveedores activos
Acción: Evaluar todos los proveedores del mes
Resultado: Ranking actualizado
Decisión: Reconocer top performers, mejorar otros
```

## 🔄 Versión

**v1.0.0** - Implementación inicial completa
- Sistema de evaluación con 5 criterios
- Cálculo automático de calificación
- 4 niveles de clasificación
- Ranking de proveedores
- Métricas automáticas integradas
- Filtros avanzados
- Responsive design
- Integración completa con módulos de compras

## 🎊 Valor del Módulo

Este módulo es **crítico para la mejora continua** porque:

1. ✅ **Objetiviza** la selección de proveedores
2. ✅ **Identifica** top performers y problemáticos
3. ✅ **Mejora** la calidad de la cadena de suministro
4. ✅ **Facilita** negociaciones con datos concretos
5. ✅ **Reduce** riesgos de compra
6. ✅ **Optimiza** costos con mejores proveedores
7. ✅ **Documenta** el desempeño histórico
8. ✅ **Impulsa** la mejora continua

**El módulo de Evaluación de Proveedores cierra el ciclo de calidad y mejora continua del sistema de compras.** ⭐🎯
