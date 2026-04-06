# Análisis Completo del Flujo de Moneda en el Sistema de Logística

## 🎯 Problema Reportado

En el PDF de cotizaciones, cuando la moneda es **PEN (Soles)**, se muestra el símbolo **$** (dólar) en lugar de **S/** (soles).

---

## 🔍 Causa Raíz Identificada

### **Problema en PDF de Cotizaciones** (CORREGIDO ✅)

**Archivo**: `cotizaciones.component.ts`  
**Líneas**: 2071-2072

```typescript
// ❌ ANTES - Pasaba string vacío
doc.text(this.formatearMoneda(item.precioUnitario || 0, ''), 150, yPosition);
doc.text(this.formatearMoneda((item.precioUnitario || 0) * (item.cantidad || 0), ''), 180, yPosition);

// ✅ DESPUÉS - Pasa cotizacion.moneda correctamente
doc.text(this.formatearMoneda(item.precioUnitario || 0, cotizacion.moneda), 150, yPosition);
doc.text(this.formatearMoneda((item.precioUnitario || 0) * (item.cantidad || 0), cotizacion.moneda), 180, yPosition);
```

### **Problema en método `formatearMoneda()`** (CORREGIDO ✅)

**Archivo**: `cotizaciones.component.ts`  
**Línea**: 1324-1328

```typescript
// ❌ ANTES - No manejaba strings vacíos
formatearMoneda(monto: number, moneda: string = 'PEN'): string {
  const simbolo = moneda === 'PEN' ? 'S/' : '$';
  return `${simbolo} ${monto.toFixed(2)}`;
}

// ✅ DESPUÉS - Normaliza strings vacíos a PEN
formatearMoneda(monto: number, moneda: string = 'PEN'): string {
  const monedaNormalizada = !moneda || moneda.trim() === '' ? 'PEN' : moneda.toUpperCase();
  const simbolo = monedaNormalizada === 'PEN' ? 'S/' : '$';
  return `${simbolo} ${monto.toFixed(2)}`;
}
```

---

## 📊 Análisis del Flujo de Moneda en Todo el Sistema

### **1. Interfaces con Campo `moneda`**

| Interfaz | Archivo | Campo | Tipo | Default |
|----------|---------|-------|------|---------|
| `SolicitudCompra` | Tables.ts:673 | `moneda?: string` | Opcional | 'PEN' |
| `DetalleSolicitudCompra` | Tables.ts:688 | `moneda?: string` | Opcional | - |
| `SolicitudCotizacion` | Tables.ts:741 | `moneda: string` | Requerido | - |
| `Cotizacion` | Tables.ts:814 | `moneda: string` | Requerido | - |
| `OrdenCompra` | Tables.ts (estimado) | `moneda: string` | Requerido | - |
| `SolicitudServicio` | Tables.ts:1140 | `moneda?: string` | Opcional | - |
| `Proveedor` | Tables.ts:488 | `MonedaPago: string` | Requerido | - |
| `ItemERP` | Tables.ts:522 | `monedaCodigo: string` | Requerido | - |

---

### **2. Componentes que Usan Moneda**

#### **A. Cotizaciones** ✅ CORREGIDO

**Archivo**: `cotizaciones.component.ts`

**Inicialización**:
```typescript
// Línea 610
moneda: 'PEN',
```

**Método de formateo**:
```typescript
// Línea 1324-1328 (CORREGIDO)
formatearMoneda(monto: number, moneda: string = 'PEN'): string {
  const monedaNormalizada = !moneda || moneda.trim() === '' ? 'PEN' : moneda.toUpperCase();
  const simbolo = monedaNormalizada === 'PEN' ? 'S/' : '$';
  return `${simbolo} ${monto.toFixed(2)}`;
}
```

**Uso en PDF**:
```typescript
// Línea 2034 - Encabezado
doc.text(`Moneda: ${cotizacion.moneda || 'N/A'}`, 20, 140);

// Línea 2035 - Monto total
doc.text(`Monto Total: ${this.formatearMoneda(cotizacion.montoTotal || 0, cotizacion.moneda || '')}`, 20, 150);

// Líneas 2073-2074 - Detalles (CORREGIDO)
doc.text(this.formatearMoneda(item.precioUnitario || 0, cotizacion.moneda), 150, yPosition);
doc.text(this.formatearMoneda((item.precioUnitario || 0) * (item.cantidad || 0), cotizacion.moneda), 180, yPosition);
```

**HTML**:
```html
<!-- Línea 255 - Tabla de cotizaciones -->
<strong>{{ formatearMoneda(cotizacion.montoTotal, cotizacion.moneda) }}</strong>
```

---

#### **B. Órdenes de Compra** ✅ FUNCIONA CORRECTAMENTE

**Archivo**: `ordenes-compra.component.ts`

**Inicialización**:
```typescript
// Línea 146
moneda: 'PEN',
```

**Método de formateo**:
```typescript
// Línea 646-649
formatearMoneda(monto: number, moneda: string = 'PEN'): string {
  const simbolo = moneda === 'PEN' ? 'S/' : '$';
  return `${simbolo} ${monto.toFixed(2)}`;
}
```

**HTML - Selector de moneda**:
```html
<!-- Línea 352-356 -->
<label>Moneda:</label>
<select [(ngModel)]="ordenCompra.moneda" class="form-control">
  <option value="PEN">Soles (PEN)</option>
  <option value="USD">Dólares (USD)</option>
</select>
```

**Desde cotización ganadora**:
```typescript
// Línea 195
moneda: cotizacion.moneda,
```

---

#### **C. Solicitudes de Compra** ✅ FUNCIONA CORRECTAMENTE

**Archivo**: `solicitudes-compra.component.ts`

**Inicialización**:
```typescript
// Línea 343
nuevaSolicitud.moneda = 'PEN';
```

**HTML - Visualización**:
```html
<!-- Línea 428-430 -->
<label>Moneda:</label>
<span class="badge badge-info">{{ solicitudDetalle.moneda || 'PEN' }}</span>
```

**Desde cotización ganadora**:
```typescript
// Línea 1080
moneda: cotizacion.moneda || 'PEN',
```

---

#### **D. Solicitudes de Servicio** ⚠️ REVISAR

**Archivo**: `solicitudes-servicio.component.ts`

**Inicialización**:
```typescript
// Línea 148
moneda: 'PEN',
```

**Método de formateo**:
```typescript
// Línea 370-373 - ⚠️ NO RECIBE PARÁMETRO DE MONEDA
formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);
}
```

**Problema**: El método `formatearMoneda()` **no muestra símbolo de moneda**, solo formatea el número.

---

#### **E. Órdenes de Servicio** ⚠️ REVISAR

**Archivo**: `ordenes-servicio.component.ts`

**Desde solicitud**:
```typescript
// Línea 178
moneda: solicitud.moneda,
```

**Método de formateo**:
```typescript
// Línea 378-382 - ⚠️ NO RECIBE PARÁMETRO DE MONEDA
formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);
}
```

**Problema**: El método `formatearMoneda()` **no muestra símbolo de moneda**, solo formatea el número.

---

#### **F. Reportes de Compras** ✅ FUNCIONA CORRECTAMENTE

**Archivo**: `reportes-compras.component.ts`

**Filtro de moneda**:
```typescript
// Línea 85
filtroMoneda: string = 'TODOS';

// Línea 184-186
if (this.filtroMoneda !== 'TODOS') {
  ordenesFiltradas = ordenesFiltradas.filter(o => o.moneda === this.filtroMoneda);
}
```

**Método de formateo**:
```typescript
// Línea 381-384
formatearMoneda(monto: number, moneda: string = 'PEN'): string {
  const simbolo = moneda === 'PEN' ? 'S/' : '$';
  return `${simbolo} ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
```

**HTML - Selector de moneda**:
```html
<!-- Línea 34-38 -->
<label>Moneda:</label>
<select [(ngModel)]="filtroMoneda" class="form-control">
  <option value="TODOS">Todas</option>
  <option value="PEN">Soles (S/)</option>
  <option value="USD">Dólares ($)</option>
</select>
```

---

#### **G. Dashboard de Compras** ✅ FUNCIONA CORRECTAMENTE

**Archivo**: `dashboard-compras.component.ts`

**Método de formateo**:
```typescript
// Línea 298-301
formatearMoneda(monto: number, moneda: string = 'PEN'): string {
  const simbolo = moneda === 'PEN' ? 'S/' : '$';
  return `${simbolo} ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
```

---

#### **H. Maestro de Proveedores** ✅ FUNCIONA CORRECTAMENTE

**Archivo**: `maestro-proveedores.component.ts`

**Opciones de moneda**:
```typescript
// Línea 63
monedas = ['PEN', 'USD'];
```

**Método de etiqueta**:
```typescript
// Línea 289-291
obtenerEtiquetaMoneda(moneda: string): string {
  return moneda === 'PEN' ? 'Soles (S/)' : 'Dólares ($)';
}
```

**HTML - Selector**:
```html
<!-- Línea 209-212 -->
<select [(ngModel)]="proveedor.MonedaPago" class="form-control">
  <option *ngFor="let moneda of monedas" [value]="moneda">
    {{ obtenerEtiquetaMoneda(moneda) }}
  </option>
</select>
```

---

#### **I. Saldo Requerimiento** ✅ FUNCIONA CORRECTAMENTE

**Archivo**: `saldo-requerimiento.component.ts`

**Inicialización**:
```typescript
// Línea 449
moneda: 'PEN'
```

---

#### **J. Kardex** ⚠️ HARDCODED A PEN

**Archivo**: `kardex.component.ts`

**Método de formateo**:
```typescript
// Línea 902-906 - ⚠️ SIEMPRE USA PEN
formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(valor);
}
```

**Problema**: El método **siempre usa PEN**, no acepta parámetro de moneda.

---

#### **K. Devoluciones a Proveedores** ⚠️ HARDCODED A SOLES

**Archivo**: `devoluciones-proveedores.component.ts`

**Método de formateo**:
```typescript
// Línea 368-370 - ⚠️ SIEMPRE USA S/
formatearMoneda(monto: number): string {
  return `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
```

**Problema**: El método **siempre usa S/** (soles), no acepta parámetro de moneda.

---

#### **L. Aprobaciones OC** ⚠️ HARDCODED A SOLES

**Archivo**: `aprobaciones-oc.component.ts`

**Uso**:
```typescript
// Línea 197 - ⚠️ SIEMPRE MUESTRA S/
`¿Está seguro de aprobar la Orden de Compra ${oc.numeroOrden} por un monto de S/ ${this.formatearMoneda(oc.montoTotal)}?`
```

**Método de formateo**:
```typescript
// Línea 627-631 - ⚠️ NO MUESTRA SÍMBOLO
formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);
}
```

**Problema**: Hardcoded "S/" en el mensaje, el método no muestra símbolo.

---

#### **M. Aprobaciones OS** ⚠️ HARDCODED A PEN

**Archivo**: `aprobaciones-os.component.ts`

**Método de formateo**:
```typescript
// Línea 345-349 - ⚠️ SIEMPRE USA PEN
formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(monto);
}
```

**Problema**: El método **siempre usa PEN**, no acepta parámetro de moneda.

---

## 🎯 Resumen de Problemas Encontrados

### ✅ **Componentes que Funcionan Correctamente**

1. **Cotizaciones** (CORREGIDO)
2. **Órdenes de Compra**
3. **Solicitudes de Compra**
4. **Reportes de Compras**
5. **Dashboard de Compras**
6. **Maestro de Proveedores**
7. **Saldo Requerimiento**

---

### ⚠️ **Componentes con Problemas**

| Componente | Archivo | Problema | Severidad |
|------------|---------|----------|-----------|
| **Solicitudes de Servicio** | `solicitudes-servicio.component.ts` | `formatearMoneda()` no muestra símbolo | Media |
| **Órdenes de Servicio** | `ordenes-servicio.component.ts` | `formatearMoneda()` no muestra símbolo | Media |
| **Kardex** | `kardex.component.ts` | Hardcoded a PEN | Baja |
| **Devoluciones Proveedores** | `devoluciones-proveedores.component.ts` | Hardcoded a S/ | Baja |
| **Aprobaciones OC** | `aprobaciones-oc.component.ts` | Hardcoded "S/" en mensaje | Media |
| **Aprobaciones OS** | `aprobaciones-os.component.ts` | Hardcoded a PEN | Media |

---

## 🔧 Recomendaciones de Corrección

### **1. Estandarizar método `formatearMoneda()` en todos los componentes**

**Método recomendado**:
```typescript
formatearMoneda(monto: number, moneda: string = 'PEN'): string {
  const monedaNormalizada = !moneda || moneda.trim() === '' ? 'PEN' : moneda.toUpperCase();
  const simbolo = monedaNormalizada === 'PEN' ? 'S/' : '$';
  return `${simbolo} ${monto.toFixed(2)}`;
}
```

**Aplicar en**:
- ✅ Cotizaciones (YA CORREGIDO)
- ⚠️ Solicitudes de Servicio
- ⚠️ Órdenes de Servicio
- ⚠️ Kardex
- ⚠️ Devoluciones Proveedores
- ⚠️ Aprobaciones OC
- ⚠️ Aprobaciones OS

---

### **2. Agregar selector de moneda donde falte**

**Componentes que necesitan selector**:
- Solicitudes de Servicio (ya tiene campo `moneda` en interfaz)
- Órdenes de Servicio (ya hereda de solicitud)

**HTML recomendado**:
```html
<div class="form-group">
  <label>Moneda:</label>
  <select [(ngModel)]="solicitud.moneda" class="form-control">
    <option value="PEN">Soles (S/)</option>
    <option value="USD">Dólares ($)</option>
  </select>
</div>
```

---

### **3. Actualizar backend para soportar moneda**

**Stored Procedures que deben incluir campo `moneda`**:
- `LOGISTICA_listarSolicitudesServicio`
- `LOGISTICA_obtenerSolicitudServicioPorId`
- `LOGISTICA_listarOrdenesServicio`
- `LOGISTICA_obtenerOrdenServicioPorId`

---

## 📌 Conclusión

**Problema principal RESUELTO**: El PDF de cotizaciones ahora muestra correctamente el símbolo de moneda (S/ para PEN, $ para USD).

**Problemas secundarios identificados**: Varios componentes tienen métodos `formatearMoneda()` que no aceptan el parámetro de moneda o están hardcoded a PEN/S/.

**Recomendación**: Estandarizar el método `formatearMoneda()` en todos los componentes para consistencia y soporte completo de múltiples monedas.
