# Flujo de Adjuntos en Solicitud de Compra

## 📋 Descripción

Este documento describe el flujo completo para adjuntar archivos en las **Solicitudes de Compra**, desde la interfaz de usuario hasta el almacenamiento en Dexie (IndexedDB).

---

## 🎯 Ubicación del Botón de Adjuntos

### **En el Formulario de Nueva/Editar Solicitud**

El botón de adjuntos se encuentra en la sección del formulario, **después de la tabla de items** y **antes de los botones de acción** (Cancelar/Guardar).

**Ubicación visual**:
```
┌─────────────────────────────────────────┐
│ FORMULARIO DE SOLICITUD DE COMPRA       │
├─────────────────────────────────────────┤
│ • Número de Solicitud                   │
│ • Tipo de Solicitud                     │
│ • Almacén                               │
│ • Prioridad                             │
│ • Observaciones                         │
├─────────────────────────────────────────┤
│ DETALLE DE ITEMS                        │
│ [Tabla con items agregados]            │
├─────────────────────────────────────────┤
│ ✅ ARCHIVOS ADJUNTOS ← AQUÍ            │
│ [Botón: Adjuntar Archivos (0)]         │
│ [Lista de archivos adjuntos]           │
├─────────────────────────────────────────┤
│ [Cancelar]  [Guardar]                  │
└─────────────────────────────────────────┘
```

---

## 🔄 Flujo Completo de Adjuntos

### **Paso 1: Crear/Editar Solicitud de Compra**

1. Usuario hace clic en **"Nueva Solicitud"** o **"Editar"**
2. Se muestra el formulario de solicitud
3. Usuario llena los datos básicos (tipo, almacén, prioridad, etc.)
4. Usuario agrega items al detalle

### **Paso 2: Adjuntar Archivos**

1. Usuario hace clic en el botón **"Adjuntar Archivos"**
2. Se abre el **Modal de Adjuntos** (componente reutilizable)
3. Usuario puede:
   - **Arrastrar y soltar** archivos (Drag & Drop)
   - **Hacer clic** para seleccionar archivos
   - **Ver vista previa** de imágenes
   - **Eliminar** archivos antes de confirmar
   - **Descargar** archivos ya adjuntados

### **Paso 3: Validación de Archivos**

El modal valida automáticamente:
- ✅ **Tipo de archivo**: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.jpg`, `.jpeg`, `.png`
- ✅ **Tamaño máximo**: 10 MB por archivo
- ✅ **Duplicados**: No permite archivos con el mismo nombre

**Mensajes de error**:
- "El archivo excede el tamaño máximo permitido (10 MB)"
- "Tipo de archivo no permitido"
- "Ya existe un archivo con este nombre"

### **Paso 4: Confirmar Adjuntos**

1. Usuario hace clic en **"Confirmar"** en el modal
2. Los archivos se agregan al array `adjuntos[]`
3. El modal se cierra
4. Se muestra la **lista de archivos adjuntados** en el formulario
5. El **badge del botón** se actualiza con el número de archivos

### **Paso 5: Guardar Solicitud**

1. Usuario hace clic en **"Guardar"**
2. Se valida que haya al menos un item en el detalle
3. Se genera el número de solicitud (si es nueva)
4. Se guarda la solicitud en Dexie
5. **Se guardan los adjuntos** en la tabla `solicitudCompraAdjuntos` de Dexie

---

## 💾 Almacenamiento en Dexie

### **Tabla: `solicitudCompraAdjuntos`**

```typescript
interface SolicitudCompraAdjunto {
  idAdjunto?: number;           // ID auto-incrementable
  idSolicitud?: number;          // FK a solicitudesCompra
  nombreArchivo: string;         // Nombre del archivo
  rutaArchivo: string;           // Ruta o Base64 del archivo
  tipoArchivo?: string;          // MIME type (e.g., 'application/pdf')
  tamanoArchivo?: number;        // Tamaño en bytes
  descripcion?: string;          // Descripción opcional
  fechaCreacion?: string;        // Fecha de creación (ISO)
  usuarioCreacion?: string;      // Usuario que adjuntó el archivo
  activo?: boolean;              // true/false
  file?: File;                   // Archivo temporal (no se guarda en Dexie)
}
```

### **Proceso de Guardado**

```typescript
// 1. Guardar solicitud y obtener ID
const idSolicitud = await this.dexieService.saveSolicitudCompra(this.solicitud);

// 2. Guardar cada adjunto
if (this.adjuntos.length > 0 && idSolicitud) {
  for (const adjunto of this.adjuntos) {
    adjunto.idSolicitud = idSolicitud;
    adjunto.usuarioCreacion = this.usuario.documentoidentidad;
    adjunto.fechaCreacion = new Date().toISOString();
    adjunto.activo = true;
    await this.dexieService.solicitudCompraAdjuntos.add(adjunto);
  }
}
```

---

## 🎨 Interfaz de Usuario

### **Botón de Adjuntos**

```html
<button 
  type="button" 
  class="btn-primary btn-sm" 
  (click)="abrirModalAdjuntos()">
  <i class="bx bx-paperclip"></i> Adjuntar Archivos
  <span class="badge bg-info ms-2" *ngIf="adjuntos.length > 0">
    {{ adjuntos.length }}
  </span>
</button>
```

**Estados del botón**:
- Sin adjuntos: `Adjuntar Archivos`
- Con adjuntos: `Adjuntar Archivos (3)` ← Badge con número

### **Lista de Archivos Adjuntados**

```html
<div class="adjuntos-list" *ngIf="adjuntos.length > 0">
  <p class="text-muted mb-2">Archivos adjuntos ({{ adjuntos.length }}):</p>
  <ul class="list-unstyled">
    <li *ngFor="let adjunto of adjuntos" class="adjunto-item">
      <i class="bx bx-file"></i>
      <span>{{ adjunto.nombreArchivo }}</span>
      <small class="text-muted">({{ (adjunto.tamanoArchivo || 0) / 1024 | number:'1.0-0' }} KB)</small>
    </li>
  </ul>
</div>
```

---

## 🔧 Implementación Técnica

### **1. Importar el Componente**

```typescript
// solicitudes-compra.component.ts
import { AdjuntosModalComponent } from '@/app/shared/components/adjuntos-modal/adjuntos-modal.component';
import { SolicitudCompraAdjunto } from '@/app/shared/interfaces/Tables';

@Component({
  imports: [
    // ... otros imports
    AdjuntosModalComponent
  ]
})
```

### **2. Variables de Estado**

```typescript
// Adjuntos
adjuntos: SolicitudCompraAdjunto[] = [];
mostrarModalAdjuntos: boolean = false;
```

### **3. Métodos**

```typescript
abrirModalAdjuntos() {
  this.mostrarModalAdjuntos = true;
}

onAdjuntosConfirmados(adjuntos: SolicitudCompraAdjunto[]) {
  this.adjuntos = adjuntos;
  this.mostrarModalAdjuntos = false;
  console.log('✅ Adjuntos confirmados:', this.adjuntos.length);
}

onAdjuntosCancelados() {
  this.mostrarModalAdjuntos = false;
}
```

### **4. Limpiar Adjuntos al Crear Nueva Solicitud**

```typescript
nuevaSolicitudCompra() {
  this.solicitud = this.nuevaSolicitud();
  this.detalleSolicitud = [];
  this.adjuntos = []; // ✅ Limpiar adjuntos
  this.requerimientosSeleccionados = [];
  this.mostrarFormulario = true;
  this.modoEdicion = false;
}
```

---

## 📱 Modal de Adjuntos (Componente Reutilizable)

### **Propiedades del Modal**

| Propiedad | Tipo | Descripción | Default |
|-----------|------|-------------|---------|
| `visible` | `boolean` | Controla si el modal está abierto | `false` |
| `titulo` | `string` | Título del modal | - |
| `tipoSolicitud` | `'compra' \| 'servicio'` | Tipo de solicitud | `'compra'` |
| `adjuntos` | `SolicitudCompraAdjunto[]` | Array de adjuntos | `[]` |
| `maxFileSizeMB` | `number` | Tamaño máximo en MB | `10` |
| `soloLectura` | `boolean` | Modo solo lectura | `false` |

### **Eventos del Modal**

| Evento | Parámetro | Descripción |
|--------|-----------|-------------|
| `onConfirmClick` | `SolicitudCompraAdjunto[]` | Se emite al confirmar adjuntos |
| `onCancelClick` | - | Se emite al cancelar |

### **Uso en HTML**

```html
<app-adjuntos-modal
  [(visible)]="mostrarModalAdjuntos"
  [titulo]="'Adjuntar Archivos - Solicitud de Compra'"
  [tipoSolicitud]="'compra'"
  [(adjuntos)]="adjuntos"
  [maxFileSizeMB]="10"
  [soloLectura]="false"
  (onConfirmClick)="onAdjuntosConfirmados($event)"
  (onCancelClick)="onAdjuntosCancelados()"
></app-adjuntos-modal>
```

---

## 🎯 Formatos de Archivo Permitidos

### **Solicitud de Compra**

- **Documentos**: `.pdf`, `.doc`, `.docx`
- **Hojas de cálculo**: `.xls`, `.xlsx`
- **Imágenes**: `.jpg`, `.jpeg`, `.png`

### **Tamaño Máximo**

- **10 MB** por archivo
- Sin límite de cantidad de archivos

---

## 🔄 Sincronización con Backend

### **Flujo de Sincronización**

1. **Modo Offline**: Los adjuntos se guardan en Dexie (IndexedDB)
2. **Modo Online**: Al enviar la solicitud al backend:
   - Se envía la solicitud con sus datos
   - Se envían los adjuntos como Base64 o FormData
   - El backend guarda los archivos en el servidor
   - Se actualiza la ruta del archivo en la base de datos

### **Estructura para Backend**

```json
{
  "numeroSolicitud": "SC-2024-001",
  "tipo": "CONSOLIDADA",
  "almacen": "ALM001",
  "detalle": [...],
  "adjuntos": [
    {
      "nombreArchivo": "cotizacion.pdf",
      "rutaArchivo": "data:application/pdf;base64,JVBERi0xLjQK...",
      "tipoArchivo": "application/pdf",
      "tamanoArchivo": 245678,
      "usuarioCreacion": "12345678"
    }
  ]
}
```

---

## ✅ Ventajas del Sistema

1. **Offline-First**: Funciona sin conexión a internet
2. **Validación Automática**: Tipo y tamaño de archivo
3. **Vista Previa**: Para imágenes
4. **Reutilizable**: Mismo componente para Compra y Servicio
5. **Persistencia**: Los archivos se guardan en IndexedDB
6. **UX Mejorada**: Drag & Drop, badges, alertas

---

## 🐛 Solución de Problemas

### **Problema: No veo el botón de adjuntos**

**Solución**: Verificar que estás en el formulario de **Nueva/Editar Solicitud**, no en la vista de listado.

### **Problema: El modal no se abre**

**Solución**: 
1. Verificar que `AdjuntosModalComponent` está importado
2. Verificar que `mostrarModalAdjuntos` está en `false` inicialmente
3. Revisar la consola del navegador para errores

### **Problema: Los archivos no se guardan**

**Solución**:
1. Verificar que `idSolicitud` existe antes de guardar adjuntos
2. Revisar que Dexie tiene la tabla `solicitudCompraAdjuntos`
3. Verificar permisos de IndexedDB en el navegador

### **Problema: Error de tamaño de archivo**

**Solución**: El archivo excede 10 MB. Comprimir o dividir el archivo.

---

## 📌 Resumen del Flujo

```
1. Usuario crea/edita solicitud
   ↓
2. Usuario hace clic en "Adjuntar Archivos"
   ↓
3. Se abre el modal de adjuntos
   ↓
4. Usuario selecciona archivos (Drag & Drop o clic)
   ↓
5. Modal valida tipo y tamaño
   ↓
6. Usuario confirma adjuntos
   ↓
7. Modal se cierra, archivos se agregan al array
   ↓
8. Se muestra lista de archivos en el formulario
   ↓
9. Usuario hace clic en "Guardar"
   ↓
10. Se guarda solicitud en Dexie
    ↓
11. Se guardan adjuntos en solicitudCompraAdjuntos
    ↓
12. ✅ Solicitud guardada con adjuntos
```

---

## 🎉 Resultado Final

El usuario ahora puede:
- ✅ Adjuntar archivos a solicitudes de compra
- ✅ Ver la lista de archivos adjuntados
- ✅ Validar automáticamente tipo y tamaño
- ✅ Guardar todo en Dexie (modo offline)
- ✅ Sincronizar con backend cuando haya conexión
