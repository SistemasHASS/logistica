# Flujo de Estados en el Módulo de Cotizaciones

## 📋 Descripción

Este documento detalla el flujo completo de estados en el módulo de cotizaciones, específicamente qué sucede con la **Solicitud de Cotización** cuando se selecciona una cotización ganadora.

---

## 🔄 Flujo Completo de Estados

### **1. Solicitud de Cotización - Estados Posibles**

```typescript
estado: 'GENERADA' | 'PENDIENTE' | 'EN_REVISION' | 'CERRADA' | 'ANULADA'
```

| Estado | Descripción | Cuándo Ocurre |
|--------|-------------|---------------|
| `GENERADA` | Solicitud creada, lista para enviar | Al crear desde consolidación |
| `PENDIENTE` | Esperando cotizaciones | Después de enviar a proveedores |
| `EN_REVISION` | Cotizaciones recibidas, en evaluación | Al recibir la primera cotización |
| `CERRADA` | ✅ **Proceso completado - Ganadora seleccionada** | Al seleccionar cotización ganadora |
| `ANULADA` | Solicitud cancelada | Al anular manualmente |

---

## 🎯 Flujo Cuando se Selecciona Cotización Ganadora

### **Antes de la Corrección** ❌

```
Solicitud de Cotización: EN_REVISION
         ↓
Usuario selecciona cotización ganadora
         ↓
Cotización: SELECCIONADA ✅
Solicitud de Cotización: EN_REVISION ❌ (NO SE ACTUALIZABA)
Solicitud de Compra: GENERADA ✅
```

**Problema**: La Solicitud de Cotización quedaba en `EN_REVISION` indefinidamente, sin reflejar que el proceso había terminado.

---

### **Después de la Corrección** ✅

```
Solicitud de Cotización: EN_REVISION
         ↓
Usuario selecciona cotización ganadora
         ↓
1. Cotización: SELECCIONADA ✅
2. Solicitud de Cotización: CERRADA ✅
3. Solicitud de Compra: GENERADA ✅
```

**Solución**: Ahora la Solicitud de Cotización se actualiza a `CERRADA` automáticamente.

---

## 💻 Implementación Técnica

### **Método: `seleccionarCotizacion()`**

```typescript
async seleccionarCotizacion(cotizacion: Cotizacion) {
  // 1. Marcar cotización como SELECCIONADA
  cotizacion.estado = 'SELECCIONADA';
  cotizacion.seleccionada = true;
  cotizacion.usuarioEvalua = this.usuario.documentoidentidad;
  cotizacion.fechaEvaluacion = new Date().toISOString();
  await this.dexieService.saveCotizacion(cotizacion);

  // 2. ✅ ACTUALIZAR SOLICITUD DE COTIZACIÓN A CERRADA
  if (cotizacion.idSolicitudCotizacion) {
    const solicitudCotizacion = await this.dexieService.solicitudesCotizacion
      .get(cotizacion.idSolicitudCotizacion);
    
    if (solicitudCotizacion) {
      solicitudCotizacion.estado = 'CERRADA';
      solicitudCotizacion.fechaModificacion = new Date().toISOString();
      solicitudCotizacion.usuarioModifica = this.usuario.documentoidentidad;
      await this.dexieService.saveSolicitudCotizacion(solicitudCotizacion);
    }
  }

  // 3. Generar Solicitud de Compra automáticamente
  await this.generarSolicitudDesdeCotizacion(cotizacion);
}
```

---

## 📊 Tabs del Módulo de Cotizaciones

### **Tab 1: Solicitudes de Cotización**

Estados mostrados:
- `GENERADA` - Badge amarillo
- `PENDIENTE` - Badge amarillo
- `EN_REVISION` - Badge azul
- `CERRADA` - Badge verde ✅
- `ANULADA` - Badge rojo

### **Tab 2: Cotizaciones Recibidas**

Estados de cotizaciones:
- `RECIBIDA` - Cotización recibida
- `EN_EVALUACION` - En proceso de evaluación
- `SELECCIONADA` - ✅ Cotización ganadora
- `RECHAZADA` - Cotización no seleccionada

### **Tab 3: Cotizaciones Ganadoras**

Muestra solo cotizaciones con estado `SELECCIONADA`.

---

## 🔍 Verificación del Estado

### **Consultar Solicitud de Cotización**

```typescript
// Obtener solicitud de cotización
const solicitud = await this.dexieService.solicitudesCotizacion.get(id);

// Verificar estado
if (solicitud.estado === 'CERRADA') {
  console.log('✅ Solicitud cerrada - Ganadora seleccionada');
}
```

### **Filtrar por Estado**

```typescript
// Solicitudes cerradas
const cerradas = await this.dexieService.solicitudesCotizacion
  .where('estado')
  .equals('CERRADA')
  .toArray();

// Solicitudes en revisión
const enRevision = await this.dexieService.solicitudesCotizacion
  .where('estado')
  .equals('EN_REVISION')
  .toArray();
```

---

## 📈 Contadores Actualizados

Los contadores en el dashboard ahora reflejan correctamente:

```typescript
// Solicitudes en revisión (esperando selección de ganadora)
totalSolicitudesEnRevision = this.solicitudesCotizacion.filter(
  s => s.estado === 'EN_REVISION'
).length;

// Solicitudes cerradas (ganadora seleccionada)
totalSolicitudesCerradas = this.solicitudesCotizacion.filter(
  s => s.estado === 'CERRADA'
).length;
```

---

## 🎨 Badges de Estado

### **Clases CSS por Estado**

```typescript
obtenerClaseEstadoSolicitud(estado: string): string {
  const clases: { [key: string]: string } = {
    PENDIENTE: 'badge-warning',      // Amarillo
    EN_REVISION: 'badge-info',       // Azul
    CERRADA: 'badge-success',        // Verde ✅
    ANULADA: 'badge-danger',         // Rojo
  };
  return clases[estado] || 'badge-secondary';
}
```

---

## 🔄 Flujo Completo del Proceso

```
1. Consolidación → Generar Solicitud de Cotización
   Estado: GENERADA

2. Enviar a Proveedores
   Estado: PENDIENTE

3. Recibir Primera Cotización
   Estado: EN_REVISION

4. Recibir Más Cotizaciones
   Estado: EN_REVISION (se mantiene)

5. Seleccionar Cotización Ganadora
   ✅ Cotización: SELECCIONADA
   ✅ Solicitud de Cotización: CERRADA
   ✅ Solicitud de Compra: GENERADA (automática)

6. Proceso Completado
   - Solicitud de Cotización queda en estado CERRADA
   - Ya no aparece en "Pendientes" ni "En Revisión"
   - Aparece en el contador de "Cerradas"
```

---

## 📝 Metadatos Actualizados

Al cerrar la solicitud, se actualizan:

```typescript
solicitudCotizacion.estado = 'CERRADA';
solicitudCotizacion.fechaModificacion = new Date().toISOString();
solicitudCotizacion.usuarioModifica = this.usuario.documentoidentidad;
```

Esto permite rastrear:
- ✅ Cuándo se cerró la solicitud
- ✅ Quién seleccionó la ganadora
- ✅ Auditoría completa del proceso

---

## ✅ Beneficios de la Corrección

1. **Claridad**: El estado refleja correctamente que el proceso terminó
2. **Contadores precisos**: Los dashboards muestran datos correctos
3. **Auditoría**: Se registra quién y cuándo cerró la solicitud
4. **Flujo completo**: El ciclo de vida está correctamente implementado
5. **UX mejorada**: Los usuarios saben qué solicitudes están pendientes vs completadas

---

## 🐛 Problema Resuelto

**Antes**: Las solicitudes de cotización quedaban en `EN_REVISION` indefinidamente, incluso después de seleccionar una ganadora.

**Ahora**: Las solicitudes de cotización pasan automáticamente a `CERRADA` cuando se selecciona una cotización ganadora, reflejando correctamente que el proceso ha finalizado.

---

## 📌 Resumen

| Acción | Cotización | Solicitud de Cotización | Solicitud de Compra |
|--------|------------|------------------------|---------------------|
| Crear solicitud | - | `GENERADA` | - |
| Enviar a proveedores | - | `PENDIENTE` | - |
| Recibir cotización | `RECIBIDA` | `EN_REVISION` | - |
| Seleccionar ganadora | `SELECCIONADA` | ✅ `CERRADA` | ✅ `GENERADA` |

**El estado `CERRADA` indica que la solicitud de cotización ha completado su ciclo de vida exitosamente.**
