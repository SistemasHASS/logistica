# Estándar de Colores - Sistema Logística HASS

## 📋 Resumen Ejecutivo

Este documento define el estándar de colores para todos los módulos del sistema de logística, garantizando consistencia visual y una mejor experiencia de usuario.

---

## 🎯 Principios Fundamentales

### 1. Usar Clases Semánticas, NO Colores Directos

**❌ INCORRECTO:**
```html
<!-- No usar colores Bootstrap directos -->
<div class="bg-success">Aprobado</div>
<div class="bg-danger text-white">Rechazado</div>

<!-- No usar estilos inline -->
<div style="background-color: green">Aprobado</div>
<div style="color: #f25a5a">Error</div>
```

**✅ CORRECTO:**
```html
<!-- Usar clases semánticas del sistema -->
<div class="estado-aprobado">Aprobado</div>
<div class="estado-rechazado">Rechazado</div>
<div class="badge-pendiente">Pendiente</div>
```

### 2. Paleta de Colores Base

| Color | Hex | Uso Principal |
|-------|-----|---------------|
| **Primary** | `#2952ff` | Botones principales, navegación, branding |
| **Success** | `#85d446` | Éxito, aprobaciones, completado |
| **Danger** | `#f25a5a` | Error, rechazo, anulación, alertas |
| **Warning** | `#f2d15a` | Advertencia, pendiente, en proceso |
| **Info** | `#745af2` | Información, neutral, mensajes |
| **Secondary** | `#74dbf7` | Acciones secundarias, complementos |

---

## 📦 Clases CSS Semánticas Disponibles

### Estados de Aprobación
```css
.estado-aprobado      /* Verde - Aprobado, Éxito, Completado */
.estado-pendiente     /* Amarillo - Pendiente, En Proceso */
.estado-rechazado     /* Rojo - Rechazado, Error */
.estado-anulado       /* Gris - Anulado, Cancelado */
```

### Badges
```css
.badge-aprobado       /* Badge verde */
.badge-pendiente      /* Badge amarillo */
.badge-rechazado      /* Badge rojo */
.badge-anulado        /* Badge gris */
```

### Bordes Indicadores
```css
.border-aprobado      /* Borde izquierdo verde */
.border-pendiente     /* Borde izquierdo amarillo */
.border-rechazado     /* Borde izquierdo rojo */
.border-anulado       /* Borde izquierdo gris */
```

### Acciones
```css
.accion-primaria      /* Azul - Botones principales */
.accion-secundaria    /* Cyan - Botones secundarios */
.accion-peligro       /* Rojo - Eliminar, rechazar */
```

### Datos/Estadísticas
```css
.dato-principal       /* Azul - Métricas principales */
.dato-secundario      /* Púrpura - Métricas secundarias */
.dato-alerta         /* Amarillo - Alertas, advertencias */
```

---

## 🏢 Mapeo por Módulos

### Dashboard Finanzas
| Elemento | Clase a Usar | Color Resultante |
|----------|--------------|------------------|
| OC Pendientes | `estado-pendiente` | Amarillo |
| OS Pendientes | `estado-pendiente` | Amarillo |
| OC Aprobadas | `estado-aprobado` | Verde |
| OS Aprobadas | `dato-secundario` | Púrpura |
| Total Pendientes | `dato-alerta` | Amarillo |
| Total Aprobadas | `estado-aprobado` | Verde |

### Módulo Aprobaciones
| Elemento | Clase a Usar | Color Resultante |
|----------|--------------|------------------|
| Botón Aprobar | `accion-primaria` | Azul |
| Botón Rechazar | `accion-peligro` | Rojo |
| Botón Anular | `estado-anulado` | Gris |
| Estado Aprobado | `badge-aprobado` | Verde |
| Estado Pendiente | `badge-pendiente` | Amarillo |
| Estado Rechazado | `badge-rechazado` | Rojo |

### Módulo Requerimientos
| Elemento | Clase a Usar | Color Resultante |
|----------|--------------|------------------|
| Stock Disponible | `estado-aprobado` | Verde |
| Stock Bajo | `dato-alerta` | Amarillo |
| Sin Stock | `estado-rechazado` | Rojo |
| Urgente | `estado-rechazado` | Rojo |

### Módulo Despachos
| Elemento | Clase a Usar | Color Resultante |
|----------|--------------|------------------|
| Entregado | `estado-aprobado` | Verde |
| En Tránsito | `estado-pendiente` | Amarillo |
| Devuelto | `estado-rechazado` | Rojo |
| Cancelado | `estado-anulado` | Gris |

---

## 🔧 Implementación

### Paso 1: Inyectar el Servicio (Opcional para configuración)
```typescript
import { ThemeConfigService } from '@/app/shared/services/theme-config.service';

constructor(private themeService: ThemeConfigService) {}

// Obtener colores para aprobaciones
const colores = this.themeService.getColoresAprobacion();
// Returns: { oc: {pendiente, aprobada}, os: {pendiente, aprobada} }
```

### Paso 2: Aplicar Clases en Templates
```html
<!-- Dashboard Finanzas - Ejemplo correcto -->
<div class="col-md-3">
  <div class="card stats-card estado-pendiente">
    <h6>Pendientes OC</h6>
    <h3>{{contadoresOC.pendientes}}</h3>
  </div>
</div>

<div class="col-md-3">
  <div class="card stats-card dato-secundario">
    <h6>Aprobadas OS</h6>
    <h3>{{contadoresOS.aprobadas}}</h3>
  </div>
</div>

<!-- Badges en tablas -->
<span class="badge-aprobado">Aprobado</span>
<span class="badge-pendiente">Pendiente</span>
<span class="badge-rechazado">Rechazado</span>

<!-- Botones de acción -->
<button class="btn accion-primaria">Aprobar</button>
<button class="btn accion-peligro">Rechazar</button>
```

---

## 🎨 Configuración de Colores

### Para Administradores
Existe un módulo de configuración en: **Administración > Configuración de Colores**

Permite:
- Cambiar la paleta base de colores
- Previsualizar cambios en tiempo real
- Restaurar colores por defecto
- Exportar/importar configuraciones

### Variables CSS
Los colores se aplican mediante variables CSS que pueden ser sobrescritas:
```css
:root {
  --app-primary: #2952ff;
  --app-success: #85d446;
  --app-danger: #f25a5a;
  --app-warning: #f2d15a;
  --app-info: #745af2;
  --app-secondary: #74dbf7;
}
```

---

## ✅ Checklist de Revisión

Antes de entregar un módulo, verificar:

- [ ] No hay colores hexadecimales hardcodeados en HTML/SCSS
- [ ] No se usan clases Bootstrap (`bg-success`, `bg-danger`) directamente
- [ ] Todos los estados usan clases semánticas
- [ ] Los botones de acción usan `accion-primaria`, `accion-secundaria` o `accion-peligro`
- [ ] Las estadísticas/datos usan `dato-principal`, `dato-secundario` o `dato-alerta`
- [ ] Los badges de estado usan `badge-{estado}`

---

## 📝 Ejemplos de Migración

### Ejemplo 1: Dashboard (ANTES → DESPUÉS)
```html
<!-- ANTES ❌ -->
<div class="card bg-danger text-white">
  <h3>Pendientes</h3>
</div>
<div class="card bg-success text-white">
  <h3>Aprobadas</h3>
</div>

<!-- DESPUÉS ✅ -->
<div class="card estado-pendiente">
  <h3>Pendientes</h3>
</div>
<div class="card estado-aprobado">
  <h3>Aprobadas</h3>
</div>
```

### Ejemplo 2: Tabla de Estados (ANTES → DESPUÉS)
```html
<!-- ANTES ❌ -->
<span class="badge" [class.bg-success]="item.estado === 'A'" 
                   [class.bg-warning]="item.estado === 'P'">
  {{item.estado}}
</span>

<!-- DESPUÉS ✅ -->
<span [class.badge-aprobado]="item.estado === 'A'"
      [class.badge-pendiente]="item.estado === 'P'"
      [class.badge-rechazado]="item.estado === 'R'">
  {{item.estado}}
</span>
```

---

## 📊 Estadísticas Actuales

- **241 usos inconsistentes** encontrados en 50 archivos
- **Módulos afectados**: Dashboard, Cotizaciones, Consolidación, Despachos, Aprobaciones
- **Prioridad de migración**: 
  1. Dashboard Finanzas (nuevo)
  2. Aprobaciones OC/OS
  3. Dashboards de Logística
  4. Resto de módulos

---

## 🚀 Próximos Pasos

1. **Revisar cada módulo** y reemplazar colores directos por clases semánticas
2. **Usar el servicio** `ThemeConfigService` para colores dinámicos
3. **Probar el módulo de configuración** para ajustar colores globalmente
4. **Documentar** cualquier nuevo patrón de color necesario

---

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Responsable:** Sistemas HASS
