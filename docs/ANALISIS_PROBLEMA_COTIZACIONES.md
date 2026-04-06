# Análisis del Problema: Cotizaciones No Aparecen en los Tabs

## 🔍 Problema Identificado

Cuando se crea una nueva cotización, **no aparece en ninguno de los 4 tabs** del módulo de cotizaciones.

## 🐛 Causa Raíz

El método `cargarCotizaciones()` tiene un **comportamiento destructivo** que elimina las cotizaciones locales:

```typescript
// Línea 286 - cotizaciones.component.ts
await this.dexieService.cotizaciones.clear(); // ❌ ELIMINA TODO
```

### Flujo Actual (PROBLEMÁTICO):

1. Usuario crea cotización → Se guarda en **Dexie** (local)
2. Usuario crea cotización → Se envía al **Backend** 
3. Se llama `cargarCotizaciones()` para refrescar
4. **Se limpia Dexie completamente** (línea 286)
5. Se cargan cotizaciones desde Backend
6. **Problema**: Si el backend aún no procesó la cotización o hay delay, la cotización desaparece

## 📊 Análisis de los 4 Tabs

### Tab 1: SOLICITUDES
- Muestra `solicitudesCotizacion[]`
- Carga desde: `cargarSolicitudesCotizacion()`
- **Estado**: ✅ Funciona correctamente

### Tab 2: COTIZACIONES
- Muestra `cotizacionesFiltradas()` que filtra `cotizaciones[]`
- Carga desde: `cargarCotizaciones()`
- **Estado**: ❌ Problema aquí - Se limpia Dexie antes de cargar

### Tab 3: GANADORES
- Muestra `cotizacionesGanadoras[]`
- Filtra de `cotizaciones[]` donde `estado === 'SELECCIONADA'`
- **Estado**: ❌ Depende de Tab 2, mismo problema

### Tab 4: COMPARACION
- Muestra `cotizacionesComparativo[]`
- Filtra de `cotizaciones[]` por solicitud
- **Estado**: ❌ Depende de Tab 2, mismo problema

## 🔧 Soluciones Propuestas

### Opción 1: Merge en lugar de Clear (RECOMENDADA)

```typescript
async cargarCotizaciones() {
  try {
    const filtros = {
      sociedad: this.usuario?.sociedad || '001',
      idproyecto: this.usuario?.idProyecto
    };
    
    const response = await this.cotizacionesService.listarCotizaciones(filtros);
    let cotizacionesBackend = [];
    
    if (typeof response === 'string') {
      cotizacionesBackend = JSON.parse(response);
    } else {
      cotizacionesBackend = response;
    }
    
    // ✅ NO LIMPIAR - Hacer merge inteligente
    const cotizacionesLocales = await this.dexieService.showCotizaciones();
    const idsBackend = new Set(cotizacionesBackend.map(c => c.id));
    
    // Preservar cotizaciones locales que no están en backend
    const cotizacionesSoloLocales = cotizacionesLocales.filter(c => !idsBackend.has(c.id));
    
    // Actualizar/agregar desde backend
    for (const cot of cotizacionesBackend) {
      // ... parsear y guardar
      await this.dexieService.saveCotizacion(cotizacion);
    }
    
    // Mantener cotizaciones locales
    this.cotizaciones = await this.dexieService.showCotizaciones();
    
  } catch (error) {
    console.error('Error:', error);
    this.cotizaciones = await this.dexieService.showCotizaciones();
  }
  
  this.actualizarContadores();
  this.actualizarCotizacionesGanadoras();
}
```

### Opción 2: No recargar después de guardar

```typescript
async guardarCotizacionDesdeSolicitud() {
  // ... validaciones ...
  
  await this.dexieService.saveCotizacion(this.cotizacion);
  
  // ✅ NO llamar cargarCotizaciones()
  // En su lugar, agregar directamente al array
  this.cotizaciones.push(this.cotizacion);
  this.actualizarContadores();
  
  this.cerrarModalRegistrarCotizacion();
  this.tabActiva = 'COTIZACIONES';
}
```

### Opción 3: Flag de sincronización

```typescript
interface Cotizacion {
  // ... campos existentes ...
  sincronizadaConBackend?: boolean; // ✅ Nuevo campo
}

async cargarCotizaciones() {
  // Solo limpiar las que están sincronizadas
  const cotizacionesLocales = await this.dexieService.showCotizaciones();
  const noSincronizadas = cotizacionesLocales.filter(c => !c.sincronizadaConBackend);
  
  await this.dexieService.cotizaciones.clear();
  
  // Restaurar las no sincronizadas
  for (const cot of noSincronizadas) {
    await this.dexieService.saveCotizacion(cot);
  }
  
  // Cargar desde backend y marcar como sincronizadas
  for (const cot of cotizacionesBackend) {
    cotizacion.sincronizadaConBackend = true;
    await this.dexieService.saveCotizacion(cotizacion);
  }
}
```

## 🎯 Recomendación

**Implementar Opción 1** porque:
- ✅ Preserva datos locales
- ✅ Sincroniza con backend
- ✅ No requiere cambios en la interfaz
- ✅ Maneja conflictos automáticamente
- ✅ Funciona offline y online

## 📝 Cambios Necesarios

1. Modificar `cargarCotizaciones()` para hacer merge en lugar de clear
2. Agregar logs para debugging
3. Manejar conflictos de ID (backend vs local)
4. Actualizar contadores después del merge

## 🧪 Casos de Prueba

1. **Crear cotización offline** → Debe aparecer en tab COTIZACIONES
2. **Crear cotización online** → Debe aparecer inmediatamente
3. **Refrescar página** → Cotizaciones deben persistir
4. **Seleccionar ganadora** → Debe aparecer en tab GANADORES
5. **Comparar cotizaciones** → Debe mostrar todas las de una solicitud

## 🚨 Problemas Adicionales Encontrados

### 1. Método `guardarCotizacionDesdeSolicitud()`
- Línea 1607: Llama al backend
- Línea 1616: Guarda en Dexie
- Línea 1638: **Llama `cargarCotizaciones()`** → Limpia Dexie
- **Resultado**: La cotización recién creada desaparece

### 2. Método `guardarCotizacionManual()`
- Línea 1392: Guarda en Dexie
- Línea 1405: **Llama `cargarCotizaciones()`** → Limpia Dexie
- **Resultado**: La cotización recién creada desaparece

### 3. Tab GANADORES
- Línea 404: Filtra `cotizaciones.filter(c => c.estado === 'SELECCIONADA')`
- Si `cotizaciones[]` está vacío, no muestra nada
- Depende completamente de `cargarCotizaciones()`

## 💡 Solución Inmediata

Comentar temporalmente la línea 286:

```typescript
// await this.dexieService.cotizaciones.clear(); // ❌ COMENTAR ESTO
```

Esto permitirá que las cotizaciones persistan, pero puede causar duplicados si el backend devuelve las mismas cotizaciones.

## 🔄 Flujo Correcto Propuesto

```
1. Usuario crea cotización
   ↓
2. Guardar en Dexie (ID temporal)
   ↓
3. Enviar a Backend
   ↓
4. Backend responde con ID real
   ↓
5. Actualizar cotización en Dexie con ID real
   ↓
6. Agregar al array this.cotizaciones
   ↓
7. Actualizar contadores
   ↓
8. Cambiar a tab COTIZACIONES
   ↓
9. Usuario ve la cotización inmediatamente
```

## 📌 Conclusión

El problema es **arquitectónico**: el método `cargarCotizaciones()` asume que el backend es la única fuente de verdad, pero en una aplicación offline-first con Dexie, necesitamos hacer **merge bidireccional** entre local y backend.
