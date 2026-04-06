# Modal de Adjuntos - Guía de Uso

## 📋 Descripción

Componente modal reutilizable para gestionar archivos adjuntos en **Solicitud de Compra** y **Solicitud de Servicio**. Incluye validación, vista previa, y gestión completa de archivos.

---

## 🎯 Características

- ✅ **Reutilizable**: Funciona para Solicitud de Compra y Servicio
- ✅ **Validación automática**: Tipo de archivo y tamaño
- ✅ **Vista previa**: Para imágenes
- ✅ **Drag & Drop**: Interfaz intuitiva
- ✅ **PrimeNG Table**: Tabla responsive con scroll
- ✅ **SweetAlert2**: Alertas elegantes
- ✅ **Modo solo lectura**: Para visualización
- ✅ **Responsive**: Adaptable a móviles

---

## 📁 Estructura de Archivos

```
src/app/shared/components/adjuntos-modal/
├── adjuntos-modal.component.html
├── adjuntos-modal.component.ts
├── adjuntos-modal.component.scss
└── adjuntos-modal.component.spec.ts (opcional)
```

---

## 🚀 Instalación

### 1. Crear el componente

Los archivos ya están creados en:
- `adjuntos-modal.component.html`
- `adjuntos-modal.component.ts`
- `adjuntos-modal.component.scss`

### 2. Registrar en el módulo compartido

```typescript
// shared.module.ts
import { AdjuntosModalComponent } from './components/adjuntos-modal/adjuntos-modal.component';

@NgModule({
  declarations: [
    AdjuntosModalComponent,
    // ... otros componentes
  ],
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,      // PrimeNG
    TableModule,       // PrimeNG
    TooltipModule,     // PrimeNG
    // ... otros módulos
  ],
  exports: [
    AdjuntosModalComponent,
    // ... otros componentes
  ]
})
export class SharedModule { }
```

---

## 💻 Uso en Componentes

### Ejemplo 1: Solicitud de Compra

#### HTML
```html
<!-- Botón para abrir el modal -->
<button 
  type="button" 
  class="btn btn-outline-primary"
  (click)="abrirModalAdjuntos()"
>
  <i class="pi pi-paperclip me-2"></i>
  Adjuntar Archivos
  <span class="badge bg-info ms-2" *ngIf="adjuntos.length > 0">
    {{ adjuntos.length }}
  </span>
</button>

<!-- Modal de adjuntos -->
<app-adjuntos-modal
  [(visible)]="mostrarModalAdjuntos"
  [titulo]="'Adjuntar Archivos - Solicitud de Compra'"
  [tipoSolicitud]="'compra'"
  [(adjuntos)]="adjuntos"
  [maxFileSizeMB]="10"
  [soloLectura]="false"
  (onConfirmClick)="onAdjuntosConfirmados($event)"
  (onCancelClick)="onAdjuntosCancelados()"
>
</app-adjuntos-modal>
```

#### TypeScript
```typescript
import { Component } from '@angular/core';
import { SolicitudCompraAdjunto } from '@shared/interfaces/Tables';

@Component({
  selector: 'app-solicitud-compra-form',
  templateUrl: './solicitud-compra-form.component.html'
})
export class SolicitudCompraFormComponent {
  mostrarModalAdjuntos: boolean = false;
  adjuntos: SolicitudCompraAdjunto[] = [];

  /**
   * Abre el modal de adjuntos
   */
  abrirModalAdjuntos(): void {
    this.mostrarModalAdjuntos = true;
  }

  /**
   * Maneja la confirmación de adjuntos
   */
  onAdjuntosConfirmados(adjuntos: SolicitudCompraAdjunto[]): void {
    this.adjuntos = adjuntos;
    console.log('Adjuntos confirmados:', adjuntos);
    
    Swal.fire({
      icon: 'success',
      title: 'Archivos guardados',
      text: `Se guardaron ${adjuntos.length} archivo(s)`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    });
  }

  /**
   * Maneja la cancelación
   */
  onAdjuntosCancelados(): void {
    console.log('Adjuntos cancelados');
  }
}
```

---

### Ejemplo 2: Solicitud de Servicio

#### HTML
```html
<!-- Botón para abrir el modal -->
<button 
  type="button" 
  class="btn btn-outline-success"
  (click)="abrirModalAdjuntos()"
>
  <i class="pi pi-paperclip me-2"></i>
  Adjuntar Documentos
  <span class="badge bg-warning text-dark ms-2" *ngIf="adjuntos.length > 0">
    {{ adjuntos.length }}
  </span>
</button>

<!-- Modal de adjuntos -->
<app-adjuntos-modal
  [(visible)]="mostrarModalAdjuntos"
  [titulo]="'Adjuntar Documentos - Solicitud de Servicio'"
  [tipoSolicitud]="'servicio'"
  [(adjuntos)]="adjuntos"
  [maxFileSizeMB]="15"
  [soloLectura]="false"
  (onConfirmClick)="onAdjuntosConfirmados($event)"
>
</app-adjuntos-modal>
```

#### TypeScript
```typescript
import { Component } from '@angular/core';
import { SolicitudServicioAdjunto } from '@shared/interfaces/Tables';

@Component({
  selector: 'app-solicitud-servicio-form',
  templateUrl: './solicitud-servicio-form.component.html'
})
export class SolicitudServicioFormComponent {
  mostrarModalAdjuntos: boolean = false;
  adjuntos: SolicitudServicioAdjunto[] = [];

  abrirModalAdjuntos(): void {
    this.mostrarModalAdjuntos = true;
  }

  onAdjuntosConfirmados(adjuntos: SolicitudServicioAdjunto[]): void {
    this.adjuntos = adjuntos;
    console.log('Adjuntos de servicio:', adjuntos);
  }
}
```

---

### Ejemplo 3: Modo Solo Lectura (Visualización)

```html
<!-- Modal en modo solo lectura -->
<app-adjuntos-modal
  [(visible)]="mostrarModalAdjuntos"
  [titulo]="'Ver Archivos Adjuntos'"
  [tipoSolicitud]="'compra'"
  [(adjuntos)]="adjuntos"
  [soloLectura]="true"
>
</app-adjuntos-modal>
```

---

## 🎛️ Propiedades (Inputs)

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `visible` | `boolean` | `false` | Controla la visibilidad del modal |
| `titulo` | `string` | `'Gestión de Archivos Adjuntos'` | Título del modal |
| `tipoSolicitud` | `'compra' \| 'servicio'` | `'compra'` | Tipo de solicitud (define formatos permitidos) |
| `adjuntos` | `Array` | `[]` | Array de adjuntos |
| `maxFileSizeMB` | `number` | `10` | Tamaño máximo por archivo en MB |
| `soloLectura` | `boolean` | `false` | Modo solo lectura (sin edición) |

---

## 📤 Eventos (Outputs)

| Evento | Parámetro | Descripción |
|--------|-----------|-------------|
| `visibleChange` | `boolean` | Emite cuando cambia la visibilidad |
| `adjuntosChange` | `Array` | Emite cuando cambia el array de adjuntos |
| `onConfirmClick` | `Array` | Emite al confirmar con los adjuntos |
| `onCancelClick` | `void` | Emite al cancelar |

---

## 📋 Formatos Permitidos

### Solicitud de Compra
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- Imágenes (`.jpg`, `.jpeg`, `.png`)

### Solicitud de Servicio
- Todos los de Compra +
- ZIP (`.zip`)
- RAR (`.rar`)

---

## 🔧 Métodos Públicos

### `onFileSelected(event)`
Maneja la selección de archivos desde el input.

### `eliminarAdjunto(index)`
Elimina un adjunto por índice con confirmación.

### `limpiarTodos()`
Elimina todos los adjuntos con confirmación.

### `descargarAdjunto(adjunto)`
Descarga un archivo adjunto.

### `previsualizarArchivo(adjunto)`
Muestra vista previa de imágenes.

### `getFileIcon(tipoArchivo)`
Retorna el ícono PrimeNG según el tipo de archivo.

### `formatFileSize(bytes)`
Formatea el tamaño del archivo en formato legible.

### `getTotalSize()`
Calcula el tamaño total de todos los archivos.

---

## 🎨 Personalización de Estilos

### Cambiar colores del header

```scss
::ng-deep {
  .adjuntos-modal {
    .p-dialog-header {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    }
  }
}
```

### Cambiar altura de la tabla

```html
<p-table
  [scrollable]="true"
  scrollHeight="500px"  <!-- Cambiar aquí -->
>
```

---

## 📊 Estructura de Datos

### SolicitudCompraAdjunto
```typescript
{
  idAdjunto?: number;
  idSolicitud?: number;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo?: string;
  tamanoArchivo?: number;
  descripcion?: string;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  activo?: boolean;
  file?: File;  // Temporal, antes de subir
}
```

### SolicitudServicioAdjunto
```typescript
{
  idAdjunto?: number;
  idSolicitudServicio?: number;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo?: string;
  tamanoArchivo?: number;
  descripcion?: string;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  activo?: boolean;
  file?: File;  // Temporal, antes de subir
}
```

---

## 🔄 Flujo de Trabajo Completo

### 1. Usuario abre el modal
```typescript
abrirModalAdjuntos(): void {
  this.mostrarModalAdjuntos = true;
}
```

### 2. Usuario selecciona archivos
- Validación automática de tipo
- Validación automática de tamaño
- Detección de duplicados
- Agregado a la lista

### 3. Usuario agrega descripción (opcional)
```html
<input [(ngModel)]="adjunto.descripcion" />
```

### 4. Usuario confirma
```typescript
onAdjuntosConfirmados(adjuntos: Array): void {
  // Guardar en Dexie
  await this.guardarEnDexie(adjuntos);
  
  // O enviar al servidor
  await this.subirAlServidor(adjuntos);
}
```

---

## 💾 Integración con Dexie

```typescript
async guardarAdjuntosEnDexie(
  idSolicitud: number, 
  adjuntos: SolicitudCompraAdjunto[]
): Promise<void> {
  const usuario = await this.dexieService.usuario.toArray();
  const usuarioActual = usuario[0]?.usuario || 'SYSTEM';

  for (const adjunto of adjuntos) {
    if (adjunto.file) {
      // Convertir a base64 para almacenamiento offline
      const base64 = await this.fileToBase64(adjunto.file);
      
      await this.dexieService.solicitudCompraAdjuntos.add({
        idSolicitud: idSolicitud,
        nombreArchivo: adjunto.nombreArchivo,
        rutaArchivo: base64,
        tipoArchivo: adjunto.tipoArchivo,
        tamanoArchivo: adjunto.tamanoArchivo,
        descripcion: adjunto.descripcion,
        usuarioCreacion: usuarioActual,
        fechaCreacion: new Date().toISOString(),
        activo: true
      });
    }
  }
}

private fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
```

---

## 🌐 Integración con Backend

```typescript
async subirArchivosAlServidor(
  idSolicitud: number, 
  adjuntos: SolicitudCompraAdjunto[]
): Promise<void> {
  const formData = new FormData();
  
  adjuntos.forEach((adjunto, index) => {
    if (adjunto.file) {
      formData.append(`archivos`, adjunto.file);
      formData.append(`descripciones[${index}]`, adjunto.descripcion || '');
    }
  });

  formData.append('idSolicitud', idSolicitud.toString());

  const response = await this.http.post(
    `${this.baseUrl}/api/logistica/solicitud-compra/subir-adjuntos`,
    formData
  ).toPromise();

  console.log('Archivos subidos:', response);
}
```

---

## 🐛 Solución de Problemas

### El modal no se muestra
- Verificar que `visible` esté en `true`
- Verificar que `DialogModule` esté importado
- Verificar que el componente esté declarado en el módulo

### Los archivos no se validan
- Verificar que `tipoSolicitud` sea `'compra'` o `'servicio'`
- Verificar que `maxFileSizeMB` esté configurado
- Revisar la consola para errores

### Los estilos no se aplican
- Verificar que el archivo `.scss` esté vinculado
- Verificar que PrimeNG esté correctamente instalado
- Limpiar caché del navegador

---

## 📱 Responsive

El modal es completamente responsive:
- **Desktop**: Tabla completa con todas las columnas
- **Tablet**: Tabla ajustada con scroll horizontal
- **Mobile**: Tabla compacta con fuentes más pequeñas

---

## ✅ Checklist de Implementación

- [ ] Crear los 3 archivos del componente
- [ ] Registrar en `SharedModule`
- [ ] Importar `DialogModule`, `TableModule`, `TooltipModule`
- [ ] Agregar el componente en el HTML del formulario
- [ ] Implementar métodos `onAdjuntosConfirmados` y `onAdjuntosCancelados`
- [ ] Probar con archivos de diferentes tipos
- [ ] Probar con archivos grandes (>10MB)
- [ ] Probar modo solo lectura
- [ ] Probar vista previa de imágenes
- [ ] Integrar con Dexie o Backend

---

## 🎯 Ejemplos de Uso Real

### Caso 1: Formulario de Nueva Solicitud
```typescript
// Al crear la solicitud
async crearSolicitud(): Promise<void> {
  const idSolicitud = await this.guardarSolicitud();
  await this.guardarAdjuntosEnDexie(idSolicitud, this.adjuntos);
}
```

### Caso 2: Editar Solicitud Existente
```typescript
// Al cargar la solicitud
async cargarSolicitud(id: number): Promise<void> {
  this.solicitud = await this.obtenerSolicitud(id);
  this.adjuntos = await this.cargarAdjuntos(id);
}
```

### Caso 3: Ver Solicitud (Solo Lectura)
```typescript
verAdjuntos(): void {
  this.mostrarModalAdjuntos = true;
  this.modoSoloLectura = true;
}
```

---

## 📚 Referencias

- [PrimeNG Dialog](https://primeng.org/dialog)
- [PrimeNG Table](https://primeng.org/table)
- [SweetAlert2](https://sweetalert2.github.io/)
- [File API](https://developer.mozilla.org/en-US/docs/Web/API/File)

---

## 🎉 Conclusión

El modal de adjuntos es un componente completo y reutilizable que facilita la gestión de archivos en las solicitudes de compra y servicio. Con validación automática, vista previa, y una interfaz intuitiva, mejora significativamente la experiencia del usuario.
