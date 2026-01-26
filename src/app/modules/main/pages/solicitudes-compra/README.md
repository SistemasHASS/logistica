# Módulo de Solicitudes de Compra

## 📋 Descripción

El módulo de **Solicitudes de Compra** permite gestionar el proceso completo de generación de solicitudes de compra a partir de requerimientos aprobados. Este módulo es parte crítica del flujo de compras en el sistema de logística.

## 🎯 Funcionalidades Principales

### ✅ CRUD Completo
- **Crear** solicitudes de compra manualmente o desde requerimientos
- **Listar** todas las solicitudes con filtros avanzados
- **Editar** solicitudes en estado GENERADA
- **Eliminar** solicitudes en estado GENERADA
- **Ver Detalle** completo de cada solicitud

### 🔄 Generación desde Requerimientos
- Selección múltiple de requerimientos aprobados
- Consolidación automática de items repetidos
- Generación de número de solicitud único
- Trazabilidad de requerimientos origen

### 📊 Dashboard de Estadísticas
- Total de solicitudes generadas
- Total de solicitudes enviadas
- Total de solicitudes aprobadas
- Total de solicitudes en cotización

### 🔍 Filtros Avanzados
- Por estado (GENERADA, ENVIADA, APROBADA, etc.)
- Por tipo (CONSOLIDADA, DIRECTA, URGENTE)
- Por rango de fechas
- Limpiar filtros rápidamente

### 📱 Responsive Design
- Adaptado para desktop, tablet y móvil
- Tablas con scroll horizontal en móviles
- Modales fullscreen en dispositivos pequeños

## 🏗️ Estructura del Módulo

```
solicitudes-compra/
├── solicitudes-compra.component.ts    # Lógica del componente
├── solicitudes-compra.component.html  # Template HTML
├── solicitudes-compra.component.scss  # Estilos
└── README.md                          # Documentación
```

## 🔗 Flujo de Trabajo

### 1. Generación desde Requerimientos
```
Requerimientos Aprobados → Selección Múltiple → Consolidación → Solicitud de Compra
```

**Proceso:**
1. Usuario selecciona requerimientos aprobados
2. Sistema consolida items repetidos (suma cantidades)
3. Genera número único de solicitud (SC-YYYYMMDD-HHMMSS)
4. Guarda en Dexie con trazabilidad de origen

### 2. Estados de la Solicitud
```
GENERADA → ENVIADA → APROBADA → EN_COTIZACION → ORDEN_GENERADA
           ↓
        RECHAZADA
```

### 3. Permisos por Rol
- **ALLOGIST (Almacén):** Crear, editar, eliminar, enviar solicitudes
- **TI:** Acceso completo a todas las funcionalidades

## 📦 Interfaces Utilizadas

### SolicitudCompra
```typescript
interface SolicitudCompra {
  id?: number;
  numeroSolicitud: string;
  fecha: string;
  tipo: 'CONSOLIDADA' | 'DIRECTA' | 'URGENTE';
  almacen: string;
  usuarioSolicita: string;
  nombreSolicita: string;
  estado: 'GENERADA' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'EN_COTIZACION' | 'ORDEN_GENERADA';
  detalle: DetalleSolicitudCompra[];
  requerimientosOrigen?: string;
  prioridad?: 'NORMAL' | 'URGENTE' | 'CRITICA';
}
```

### DetalleSolicitudCompra
```typescript
interface DetalleSolicitudCompra {
  id: number;
  solicitudCompraId: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  cantidadAprobada: number;
  cantidadAtendida: number;
  unidadMedida: string;
  proyecto?: string;
  ceco?: string;
  turno?: string;
  labor?: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'PARCIAL';
}
```

## 🎨 Componentes Visuales

### Dashboard de Estadísticas
- Cards con iconos y colores distintivos
- Animaciones hover
- Actualización automática de contadores

### Tabla de Solicitudes
- Columnas: #, Número, Fecha, Tipo, Almacén, Solicitante, Items, Estado, Prioridad, Acciones
- Badges de colores para estados y prioridades
- Botones de acción contextuales

### Formulario de Solicitud
- Grid responsive de 2 columnas
- Campos: Tipo, Almacén, Prioridad, Observaciones
- Tabla de detalle de items
- Validaciones en tiempo real

### Modal de Detalle
- Vista completa de la solicitud
- Grid de información general
- Tabla de items solicitados
- Estados visuales con badges

## 🔧 Métodos Principales

### Carga de Datos
- `cargarSolicitudes()` - Carga todas las solicitudes
- `cargarRequerimientosAprobados()` - Carga requerimientos disponibles
- `cargarMaestras()` - Carga almacenes y otros maestros

### CRUD
- `nuevaSolicitudCompra()` - Inicializa formulario nuevo
- `guardarSolicitud()` - Guarda o actualiza solicitud
- `editarSolicitud(index)` - Carga solicitud para edición
- `eliminarSolicitud(index)` - Elimina solicitud

### Generación
- `generarSolicitudDesdeRequerimientos()` - Consolida requerimientos
- `generarNumeroSolicitud()` - Genera número único

### Acciones
- `enviarSolicitud(solicitud)` - Cambia estado a ENVIADA
- `verDetalle(solicitud)` - Abre modal de detalle

### Filtros
- `solicitudesFiltradas()` - Aplica filtros activos
- `limpiarFiltros()` - Resetea todos los filtros

### Utilidades
- `obtenerClaseEstado(estado)` - Retorna clase CSS por estado
- `obtenerClasePrioridad(prioridad)` - Retorna clase CSS por prioridad
- `formatearFecha(fecha)` - Formatea fecha a DD/MM/YYYY

## 🎯 Próximos Pasos (Módulos Relacionados)

1. **Cotizaciones** - Gestionar cotizaciones de proveedores
2. **Órdenes de Compra** - Generar órdenes desde cotizaciones aprobadas
3. **Recepción de Mercadería** - Registrar llegada de productos

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas
- ✅ Almacén requerido
- ✅ Al menos un item en el detalle
- ✅ Solo editar/eliminar solicitudes en estado GENERADA
- ✅ Confirmación antes de eliminar

### Permisos
- Solo usuarios con rol **ALLOGIST** o **TI** pueden acceder
- Guard: `AlmacenGuard`

## 📱 Responsive Breakpoints

- **Desktop:** > 768px - Vista completa con todas las columnas
- **Tablet:** 768px - Ajuste de grid a 2 columnas
- **Mobile:** < 768px - Grid de 1 columna, tablas con scroll horizontal

## 🚀 Uso del Módulo

### Generar Solicitud desde Requerimientos
1. Ir a **Compras → Solicitudes de Compra**
2. En la sección "Requerimientos Aprobados Disponibles"
3. Seleccionar los requerimientos deseados (checkbox)
4. Click en "Generar desde Requerimientos"
5. Sistema consolida y crea la solicitud automáticamente

### Crear Solicitud Manual
1. Click en "Nueva Solicitud"
2. Completar formulario (Tipo, Almacén, Prioridad)
3. Agregar observaciones si es necesario
4. Click en "Guardar"

### Enviar Solicitud para Aprobación
1. En la tabla de solicitudes
2. Click en botón "Enviar" (icono de envío)
3. Confirmar acción
4. Estado cambia a "ENVIADA"

## 📊 Integración con Dexie (IndexedDB)

### Tablas Utilizadas
- `solicitudesCompra` - Almacena las solicitudes
- `detalleSolicitudCompra` - Almacena los items de cada solicitud
- `requerimientos` - Lee requerimientos aprobados
- `detalles` - Lee detalles de requerimientos

### Operaciones
```typescript
// Guardar solicitud
await this.dexieService.saveSolicitudCompra(solicitud);

// Listar solicitudes
const solicitudes = await this.dexieService.showSolicitudesCompra();

// Eliminar solicitud
await this.dexieService.solicitudesCompra.delete(id);
```

## 🎨 Clases CSS Principales

### Estados
- `.badge-info` - GENERADA (azul)
- `.badge-warning` - ENVIADA (naranja)
- `.badge-success` - APROBADA (verde)
- `.badge-danger` - RECHAZADA (rojo)
- `.badge-primary` - EN_COTIZACION (morado)
- `.badge-dark` - ORDEN_GENERADA (negro)

### Prioridades
- `.badge-secondary` - NORMAL (gris)
- `.badge-warning` - URGENTE (naranja)
- `.badge-danger` - CRITICA (rojo)

## 📝 Notas de Desarrollo

- Componente standalone (no requiere módulo)
- Usa PrimeNG Table para tablas avanzadas
- Integración con AlertService para notificaciones
- Manejo de errores con try-catch
- Logging en consola para debugging

## 🔄 Versión

**v1.0.0** - Implementación inicial completa
- CRUD completo
- Generación desde requerimientos
- Dashboard de estadísticas
- Filtros avanzados
- Responsive design
