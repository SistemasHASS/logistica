# Módulo de Maestro de Proveedores

## 📋 Descripción

El módulo de **Maestro de Proveedores** permite gestionar la información completa de los proveedores de la empresa. Centraliza datos comerciales, condiciones de pago, y facilita la consulta rápida de información para el proceso de compras.

## 🎯 Funcionalidades Principales

### ✅ CRUD Completo
- **Crear** nuevos proveedores
- **Listar** todos los proveedores con filtros
- **Editar** información de proveedores
- **Eliminar** proveedores
- **Ver Detalle** completo

### 🔍 Gestión de Proveedores
- Registro de datos básicos (RUC, razón social)
- Condiciones comerciales (tipo de pago, moneda)
- Clasificación por tipo de persona y servicio
- Control de estado (Activo/Inactivo)
- Indicador de detracción

### 📊 Dashboard de Estadísticas
- Total de proveedores registrados
- Proveedores activos
- Proveedores inactivos

### 🔎 Filtros Avanzados
- Por nombre o RUC
- Por tipo de persona (Natural/Jurídica)
- Por estado (Activo/Inactivo)
- Limpiar filtros rápidamente

### ⚡ Funciones Especiales
- Cambio rápido de estado (Activar/Desactivar)
- Validación automática de RUC
- Detección automática de tipo de persona por RUC

## 🏗️ Estructura del Módulo

```
maestro-proveedores/
├── maestro-proveedores.component.ts    # Lógica del componente
├── maestro-proveedores.component.html  # Template HTML
├── maestro-proveedores.component.scss  # Estilos
└── README.md                           # Documentación
```

## 🔗 Flujo de Trabajo

### 1. Registro de Proveedor
```
Nuevo Proveedor → Ingresar RUC → Auto-detectar Tipo Persona → 
Completar Datos → Configurar Condiciones → Guardar
```

### 2. Edición de Proveedor
```
Buscar Proveedor → Editar → Modificar Datos → Guardar
```

### 3. Cambio de Estado
```
Seleccionar Proveedor → Cambiar Estado → Confirmar → Actualizar
```

## 📦 Interface Utilizada

### Proveedor
```typescript
interface Proveedor {
  id: number;
  TipoPersona: string;        // NATURAL | JURIDICA
  documento: string;           // Nombre/Razón Social
  ruc: string;                // RUC de 11 dígitos
  Estado: string;             // ACTIVO | INACTIVO
  TipoPago: string;           // Condiciones de pago
  MonedaPago: string;         // PEN | USD
  detraccion: string;         // SI | NO
  TipoServicio: string;       // BIENES | SERVICIOS | MIXTO
}
```

## 🎨 Componentes Visuales

### Dashboard de Estadísticas
- 3 Cards con métricas clave
- Total Proveedores (morado)
- Activos (verde)
- Inactivos (gris)

### Tabla de Proveedores
- Columnas: #, RUC, Nombre, Tipo Persona, Tipo Pago, Moneda, Tipo Servicio, Estado, Acciones
- Badges de colores para estados
- Múltiples botones de acción

### Formulario de Proveedor
- **Información Básica:** RUC, Tipo Persona, Nombre/Razón Social
- **Condiciones Comerciales:** Tipo Pago, Moneda, Tipo Servicio, Detracción, Estado
- Grid responsive de 2 columnas
- Validación de RUC automática

### Modal de Detalle
- Vista completa del proveedor
- Grid de información organizada
- Badges para estados y clasificaciones

## 🔧 Métodos Principales

### Carga de Datos
- `cargarProveedores()` - Carga todos los proveedores
- `calcularContadores()` - Actualiza estadísticas

### CRUD
- `nuevoProveedorForm()` - Inicializa formulario nuevo
- `guardarProveedor()` - Guarda o actualiza proveedor
- `editarProveedor(index)` - Carga proveedor para edición
- `eliminarProveedor(index)` - Elimina proveedor

### Gestión de Estado
- `cambiarEstado(proveedor)` - Activa/Desactiva proveedor

### Acciones
- `verDetalle(proveedor)` - Abre modal de detalle

### Filtros
- `aplicarFiltros()` - Aplica filtros activos
- `limpiarFiltros()` - Resetea filtros

### Validaciones
- `validarRUC()` - Valida RUC y detecta tipo de persona

### Utilidades
- `obtenerClaseEstado(estado)` - Clase CSS por estado
- `obtenerEtiquetaTipoPago(tipo)` - Etiqueta legible de tipo de pago
- `obtenerEtiquetaMoneda(moneda)` - Etiqueta legible de moneda

## 📊 Opciones de Configuración

### Tipos de Persona
- **NATURAL** - Persona natural (RUC inicia con 1)
- **JURIDICA** - Persona jurídica (RUC inicia con 2)

### Estados
- **ACTIVO** - Proveedor habilitado para compras
- **INACTIVO** - Proveedor deshabilitado

### Tipos de Pago
- **CONTADO** - Pago al contado
- **CREDITO_15** - Crédito a 15 días
- **CREDITO_30** - Crédito a 30 días
- **CREDITO_45** - Crédito a 45 días
- **CREDITO_60** - Crédito a 60 días

### Monedas
- **PEN** - Soles (S/)
- **USD** - Dólares ($)

### Tipos de Servicio
- **BIENES** - Proveedor de bienes
- **SERVICIOS** - Proveedor de servicios
- **MIXTO** - Proveedor de bienes y servicios

### Detracción
- **SI** - Sujeto a detracción
- **NO** - No sujeto a detracción

## 🎯 Integración con Otros Módulos

### Cotizaciones
- Selección de proveedor al crear cotización
- Datos del proveedor se cargan automáticamente
- Condiciones de pago predefinidas

### Órdenes de Compra
- Información del proveedor en la orden
- Condiciones comerciales aplicadas
- Datos de contacto disponibles

### Reportes
- Análisis de compras por proveedor
- Evaluación de desempeño
- Ranking de proveedores

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas
- ✅ RUC requerido y de 11 dígitos
- ✅ Nombre/Razón social requerido
- ✅ Validación de formato de RUC
- ✅ Detección automática de tipo de persona
- ✅ Confirmación antes de eliminar
- ✅ Confirmación antes de cambiar estado

### Permisos
- Solo usuarios con rol **ALLOGIST** o **TI** pueden acceder
- Guard: `AlmacenGuard`

## 📱 Responsive Breakpoints

- **Desktop:** > 768px - Vista completa con todas las columnas
- **Tablet:** 768px - Ajuste de grid a 2 columnas
- **Mobile:** < 768px - Grid de 1 columna, scroll horizontal en tablas

## 🚀 Uso del Módulo

### Registrar Nuevo Proveedor
1. Ir a **Maestros → Proveedores**
2. Click en **"Nuevo Proveedor"**
3. Ingresar RUC (11 dígitos)
4. Sistema detecta automáticamente tipo de persona
5. Ingresar nombre o razón social
6. Configurar condiciones comerciales
7. Click en **"Guardar"**

### Editar Proveedor
1. Buscar proveedor en la tabla
2. Click en botón **"Editar"** (lápiz)
3. Modificar datos necesarios
4. Click en **"Guardar"**

### Cambiar Estado de Proveedor
1. Localizar proveedor en la tabla
2. Click en botón de estado (✓ o ✗)
3. Confirmar cambio
4. Estado se actualiza inmediatamente

### Eliminar Proveedor
1. Localizar proveedor en la tabla
2. Click en botón **"Eliminar"** (basura)
3. Confirmar eliminación
4. Proveedor se elimina de la base de datos

### Buscar Proveedor
1. Usar filtro "Nombre/RUC"
2. Ingresar texto de búsqueda
3. Resultados se filtran automáticamente
4. Combinar con otros filtros si es necesario

### Ver Detalle de Proveedor
1. Click en botón **"Ver Detalle"** (ojo)
2. Se abre modal con información completa
3. Revisar todos los datos
4. Click en **"Cerrar"**

## 📊 Integración con Dexie (IndexedDB)

### Tabla Utilizada
- `proveedores` - Almacena todos los proveedores

### Operaciones
```typescript
// Guardar proveedor
await this.dexieService.saveProveedor(proveedor);

// Listar proveedores
const proveedores = await this.dexieService.showProveedores();

// Eliminar proveedor
await this.dexieService.proveedores.delete(id);
```

## 🎨 Clases CSS Principales

### Estados
- `.badge-success` - ACTIVO (verde)
- `.badge-secondary` - INACTIVO (gris)

### Tipos
- `.badge-info` - Tipo de Persona (azul)
- `.badge-warning` - Detracción SI (naranja)

## 📝 Notas de Desarrollo

- Componente standalone (no requiere módulo)
- Usa PrimeNG Table para tablas avanzadas
- Validación de RUC peruano (11 dígitos)
- Detección automática de tipo de persona por primer dígito del RUC
- Filtros en tiempo real
- Confirmaciones para acciones críticas

## 💡 Validación de RUC

### Reglas de Validación
```typescript
- Longitud: Exactamente 11 dígitos
- Primer dígito 1: Persona Natural
- Primer dígito 2: Persona Jurídica
- Otros: Validar manualmente
```

### Auto-detección
Al ingresar un RUC válido, el sistema automáticamente:
1. Valida la longitud (11 dígitos)
2. Lee el primer dígito
3. Asigna el tipo de persona correspondiente

## 🔄 Estados del Proveedor

### ACTIVO
- **Uso:** Proveedor habilitado para compras
- **Acciones permitidas:** Todas
- **Aparece en:** Cotizaciones, Órdenes de Compra

### INACTIVO
- **Uso:** Proveedor deshabilitado temporalmente
- **Acciones permitidas:** Ver, Editar, Reactivar
- **No aparece en:** Nuevas cotizaciones u órdenes

## 🎯 Casos de Uso

### Caso 1: Registro de Proveedor Nuevo
```
Empresa necesita nuevo proveedor →
Registrar en maestro →
Configurar condiciones →
Disponible para cotizaciones
```

### Caso 2: Actualización de Condiciones
```
Proveedor cambia condiciones de pago →
Editar proveedor →
Actualizar tipo de pago →
Nuevas órdenes usan nuevas condiciones
```

### Caso 3: Desactivación Temporal
```
Problemas con proveedor →
Cambiar estado a INACTIVO →
No aparece en nuevas cotizaciones →
Resolver problema →
Reactivar proveedor
```

## 💡 Mejoras Futuras

- Datos de contacto (teléfono, email, dirección)
- Datos bancarios para pagos
- Historial de compras por proveedor
- Evaluación de desempeño
- Calificación de proveedores
- Documentos adjuntos (contratos, certificados)
- Múltiples contactos por proveedor
- Integración con SUNAT para validación de RUC
- Importación masiva desde Excel
- Exportación de listado a PDF/Excel

## 🔄 Versión

**v1.0.0** - Implementación inicial completa
- CRUD completo de proveedores
- Validación de RUC
- Auto-detección de tipo de persona
- Gestión de estados
- Filtros avanzados
- Dashboard con estadísticas
- Responsive design
- Integración con módulos de compras

## 🎊 Valor del Módulo

Este módulo es **fundamental para el sistema de compras** porque:

1. ✅ **Centraliza información** de proveedores
2. ✅ **Facilita selección** en cotizaciones y órdenes
3. ✅ **Estandariza condiciones** comerciales
4. ✅ **Mejora trazabilidad** de compras
5. ✅ **Agiliza procesos** con datos predefinidos
6. ✅ **Control de calidad** con estados activo/inactivo
7. ✅ **Base para análisis** de proveedores
8. ✅ **Cumplimiento normativo** con datos fiscales

**El Maestro de Proveedores es la base de datos central para todas las operaciones de compras.** 👥🎯
