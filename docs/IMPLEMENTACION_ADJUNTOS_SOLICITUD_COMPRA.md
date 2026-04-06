# Implementación de Adjuntos para Solicitud de Compra

## 📋 Resumen

Se ha implementado la funcionalidad completa para adjuntar archivos a las Solicitudes de Compra, incluyendo:
- Tabla en base de datos SQL Server
- Stored Procedures actualizados
- Interfaces TypeScript
- Tabla Dexie para almacenamiento local
- Componente Angular para subir archivos

---

## 🗄️ Base de Datos

### Tabla: LOGISTICA_SolicitudCompraAdjuntos

```sql
CREATE TABLE [dbo].[LOGISTICA_SolicitudCompraAdjuntos](
    [idAdjunto] INT IDENTITY(1,1) PRIMARY KEY,
    [idSolicitud] INT NOT NULL,
    [nombreArchivo] NVARCHAR(255) NOT NULL,
    [rutaArchivo] NVARCHAR(500) NOT NULL,
    [tipoArchivo] NVARCHAR(50) NULL,
    [tamanoArchivo] BIGINT NULL,
    [descripcion] NVARCHAR(500) NULL,
    [fechaCreacion] DATETIME NOT NULL DEFAULT GETDATE(),
    [usuarioCreacion] NVARCHAR(20) NOT NULL,
    [activo] BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_SolicitudCompraAdjuntos_SolicitudCompra 
        FOREIGN KEY([idSolicitud]) 
        REFERENCES [dbo].[LOGISTICA_SolicitudCompra]([idSolicitud])
)
```

**Índice creado:**
```sql
CREATE NONCLUSTERED INDEX IX_SolicitudCompraAdjuntos_IdSolicitud
ON LOGISTICA_SolicitudCompraAdjuntos ([idSolicitud])
INCLUDE ([nombreArchivo], [rutaArchivo], [activo]);
```

---

## 📊 Stored Procedures Actualizados

### 1. LOGISTICA_listarSolicitudesCompra

Ahora incluye los adjuntos en la respuesta:

```sql
(
    SELECT 
        adj.idAdjunto,
        adj.idSolicitud,
        adj.nombreArchivo,
        adj.rutaArchivo,
        adj.tipoArchivo,
        adj.tamanoArchivo,
        adj.descripcion,
        adj.fechaCreacion,
        adj.usuarioCreacion
    FROM LOGISTICA_SolicitudCompraAdjuntos adj
    WHERE adj.idSolicitud = sc.idSolicitud
        AND adj.activo = 1
    ORDER BY adj.fechaCreacion DESC
    FOR JSON PATH
) AS adjuntos
```

### 2. LOGISTICA_obtenerSolicitudCompraPorId

Retorna adjuntos con alias compatibles con OC:

```sql
(
    SELECT 
        adj.idAdjunto AS idadjunto,
        adj.nombreArchivo AS nombre,
        adj.rutaArchivo AS url,
        adj.tipoArchivo AS tipo,
        adj.tamanoArchivo,
        adj.descripcion,
        adj.fechaCreacion,
        adj.usuarioCreacion
    FROM LOGISTICA_SolicitudCompraAdjuntos adj
    WHERE adj.idSolicitud = sc.idSolicitud
        AND adj.activo = 1
    ORDER BY adj.fechaCreacion DESC
    FOR JSON PATH
) AS adjuntos
```

---

## 💻 Frontend - TypeScript

### Interface: SolicitudCompraAdjunto

```typescript
export interface SolicitudCompraAdjunto {
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
  file?: File; // Para el archivo temporal antes de subir
}
```

### Dexie Table

```typescript
// En dexie-db.service.ts
public solicitudCompraAdjuntos!: Dexie.Table<SolicitudCompraAdjunto, number>;

// En el schema
solicitudCompraAdjuntos: `++idAdjunto,idSolicitud,nombreArchivo,rutaArchivo,tipoArchivo,usuarioCreacion,fechaCreacion,activo`

// En el constructor
this.solicitudCompraAdjuntos = this.table('solicitudCompraAdjuntos');
```

---

## 🎨 Componente Angular - Upload de Archivos

### HTML Template

```html
<!-- Sección de Adjuntos en el formulario de Solicitud de Compra -->
<div class="card mt-3">
  <div class="card-header">
    <h5 class="mb-0">
      <i class="pi pi-paperclip me-2"></i>
      Archivos Adjuntos
    </h5>
  </div>
  <div class="card-body">
    <!-- Botón para agregar archivos -->
    <div class="mb-3">
      <input 
        type="file" 
        #fileInput 
        (change)="onFileSelected($event)" 
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        class="d-none"
      />
      <button 
        type="button" 
        class="btn btn-outline-primary"
        (click)="fileInput.click()"
      >
        <i class="pi pi-plus me-2"></i>
        Agregar Archivo
      </button>
      <small class="text-muted ms-2">
        Formatos permitidos: PDF, Word, Excel, Imágenes (Max 10MB)
      </small>
    </div>

    <!-- Lista de archivos adjuntos -->
    <div *ngIf="adjuntos.length > 0" class="table-responsive">
      <table class="table table-sm table-hover">
        <thead>
          <tr>
            <th>Archivo</th>
            <th>Tipo</th>
            <th>Tamaño</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let adjunto of adjuntos; let i = index">
            <td>
              <i [class]="getFileIcon(adjunto.tipoArchivo)" class="me-2"></i>
              {{ adjunto.nombreArchivo }}
            </td>
            <td>
              <span class="badge bg-secondary">
                {{ adjunto.tipoArchivo || 'N/A' }}
              </span>
            </td>
            <td>{{ formatFileSize(adjunto.tamanoArchivo) }}</td>
            <td>
              <input 
                type="text" 
                class="form-control form-control-sm" 
                [(ngModel)]="adjunto.descripcion"
                placeholder="Descripción opcional"
              />
            </td>
            <td>
              <button 
                type="button" 
                class="btn btn-sm btn-outline-danger"
                (click)="eliminarAdjunto(i)"
              >
                <i class="pi pi-trash"></i>
              </button>
              <button 
                *ngIf="adjunto.rutaArchivo && !adjunto.file"
                type="button" 
                class="btn btn-sm btn-outline-info ms-1"
                (click)="descargarAdjunto(adjunto)"
              >
                <i class="pi pi-download"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mensaje cuando no hay archivos -->
    <div *ngIf="adjuntos.length === 0" class="text-center text-muted py-3">
      <i class="pi pi-inbox" style="font-size: 2rem;"></i>
      <p class="mb-0 mt-2">No hay archivos adjuntos</p>
    </div>
  </div>
</div>
```

### TypeScript Component

```typescript
import { Component } from '@angular/core';
import { SolicitudCompraAdjunto } from '@shared/interfaces/Tables';
import { DexieService } from '@shared/dixiedb/dexie-db.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-solicitud-compra-form',
  templateUrl: './solicitud-compra-form.component.html',
  styleUrls: ['./solicitud-compra-form.component.scss']
})
export class SolicitudCompraFormComponent {
  adjuntos: SolicitudCompraAdjunto[] = [];
  maxFileSize = 10 * 1024 * 1024; // 10MB
  allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  constructor(private dexieService: DexieService) {}

  /**
   * Maneja la selección de archivos
   */
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar tipo de archivo
      if (!this.allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'warning',
          title: 'Tipo de archivo no permitido',
          text: `El archivo ${file.name} no es un tipo permitido`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        continue;
      }

      // Validar tamaño
      if (file.size > this.maxFileSize) {
        Swal.fire({
          icon: 'warning',
          title: 'Archivo muy grande',
          text: `El archivo ${file.name} excede el tamaño máximo de 10MB`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        continue;
      }

      // Crear objeto adjunto temporal
      const adjunto: SolicitudCompraAdjunto = {
        nombreArchivo: file.name,
        rutaArchivo: '', // Se llenará al subir al servidor
        tipoArchivo: file.type,
        tamanoArchivo: file.size,
        descripcion: '',
        file: file, // Guardar referencia al archivo
        activo: true
      };

      this.adjuntos.push(adjunto);
    }

    // Limpiar input
    event.target.value = '';

    Swal.fire({
      icon: 'success',
      title: 'Archivos agregados',
      text: `Se agregaron ${files.length} archivo(s)`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    });
  }

  /**
   * Elimina un adjunto de la lista
   */
  eliminarAdjunto(index: number): void {
    Swal.fire({
      title: '¿Eliminar archivo?',
      text: '¿Está seguro de eliminar este archivo adjunto?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adjuntos.splice(index, 1);
        Swal.fire({
          icon: 'success',
          title: 'Archivo eliminado',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  }

  /**
   * Descarga un archivo adjunto
   */
  descargarAdjunto(adjunto: SolicitudCompraAdjunto): void {
    if (!adjunto.rutaArchivo) {
      return;
    }

    // Crear un enlace temporal y hacer clic
    const link = document.createElement('a');
    link.href = adjunto.rutaArchivo;
    link.download = adjunto.nombreArchivo;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Obtiene el ícono según el tipo de archivo
   */
  getFileIcon(tipoArchivo?: string): string {
    if (!tipoArchivo) return 'pi pi-file';
    
    if (tipoArchivo.includes('pdf')) return 'pi pi-file-pdf text-danger';
    if (tipoArchivo.includes('word')) return 'pi pi-file-word text-primary';
    if (tipoArchivo.includes('excel') || tipoArchivo.includes('sheet')) 
      return 'pi pi-file-excel text-success';
    if (tipoArchivo.includes('image')) return 'pi pi-image text-info';
    
    return 'pi pi-file';
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Guarda los adjuntos en Dexie (antes de enviar al servidor)
   */
  async guardarAdjuntosEnDexie(idSolicitud: number): Promise<void> {
    const usuario = await this.dexieService.usuario.toArray();
    const usuarioActual = usuario[0]?.usuario || 'SYSTEM';

    for (const adjunto of this.adjuntos) {
      if (adjunto.file) {
        // Convertir archivo a base64 para almacenar temporalmente
        const base64 = await this.fileToBase64(adjunto.file);
        
        await this.dexieService.solicitudCompraAdjuntos.add({
          idSolicitud: idSolicitud,
          nombreArchivo: adjunto.nombreArchivo,
          rutaArchivo: base64, // Temporal, se reemplazará con URL del servidor
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

  /**
   * Convierte un archivo a base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Carga adjuntos desde Dexie
   */
  async cargarAdjuntosDesdeDexi(idSolicitud: number): Promise<void> {
    const adjuntosDB = await this.dexieService.solicitudCompraAdjuntos
      .where('idSolicitud')
      .equals(idSolicitud)
      .and(adj => adj.activo === true)
      .toArray();

    this.adjuntos = adjuntosDB;
  }
}
```

---

## 🚀 Flujo de Trabajo

### 1. Crear Solicitud de Compra con Adjuntos

```typescript
async crearSolicitudCompra(): Promise<void> {
  // 1. Crear la solicitud en Dexie
  const idSolicitud = await this.dexieService.solicitudesCompra.add({
    numeroSolicitud: this.generarNumeroSolicitud(),
    fecha: new Date().toISOString(),
    tipo: this.form.value.tipo,
    almacen: this.form.value.almacen,
    usuarioSolicita: this.usuarioActual,
    nombreSolicita: this.nombreUsuario,
    estado: 'GENERADA',
    prioridad: this.form.value.prioridad,
    observaciones: this.form.value.observaciones,
    detalle: []
  });

  // 2. Guardar adjuntos en Dexie
  await this.guardarAdjuntosEnDexie(idSolicitud);

  // 3. Enviar al servidor (cuando esté online)
  await this.enviarAlServidor(idSolicitud);
}
```

### 2. Subir Archivos al Servidor

```typescript
async subirArchivosAlServidor(idSolicitud: number): Promise<void> {
  const formData = new FormData();
  
  // Agregar archivos al FormData
  this.adjuntos.forEach((adjunto, index) => {
    if (adjunto.file) {
      formData.append(`archivos`, adjunto.file);
      formData.append(`descripciones[${index}]`, adjunto.descripcion || '');
    }
  });

  formData.append('idSolicitud', idSolicitud.toString());
  formData.append('usuarioCreacion', this.usuarioActual);

  // Llamar al endpoint de subida
  const response = await this.http.post(
    `${this.baseUrl}/api/logistica/solicitud-compra/subir-adjuntos`,
    formData
  ).toPromise();

  console.log('Archivos subidos:', response);
}
```

---

## 📝 Pasos de Implementación

### Backend
1. ✅ Ejecutar `CREATE_TABLE_SOLICITUD_COMPRA_ADJUNTOS.sql`
2. ✅ Ejecutar `SP_SOLICITUD_COMPRA_LISTAR.sql` (actualizado)
3. ✅ Ejecutar `SP_SOLICITUD_COMPRA_OBTENER_POR_ID.sql` (actualizado)
4. 🔜 Crear endpoint para subir archivos al servidor
5. 🔜 Configurar almacenamiento de archivos (carpeta o blob storage)

### Frontend
1. ✅ Agregar interface `SolicitudCompraAdjunto` en Tables.ts
2. ✅ Agregar tabla Dexie `solicitudCompraAdjuntos`
3. 🔜 Implementar componente de upload en formulario de SC
4. 🔜 Agregar visualización de adjuntos en detalle de SC
5. 🔜 Implementar descarga de archivos

---

## 🔒 Consideraciones de Seguridad

1. **Validación de archivos**: Solo permitir tipos específicos
2. **Tamaño máximo**: Limitar a 10MB por archivo
3. **Sanitización**: Validar nombres de archivo
4. **Almacenamiento**: Usar nombres únicos (GUID) en el servidor
5. **Permisos**: Solo el creador y aprobadores pueden ver adjuntos

---

## 📦 Archivos Creados/Modificados

### SQL
- ✅ `CREATE_TABLE_SOLICITUD_COMPRA_ADJUNTOS.sql`
- ✅ `SP_SOLICITUD_COMPRA_LISTAR.sql` (actualizado)
- ✅ `SP_SOLICITUD_COMPRA_OBTENER_POR_ID.sql` (actualizado)

### Frontend
- ✅ `Tables.ts` - Interface `SolicitudCompraAdjunto`
- ✅ `dexie-db.service.ts` - Tabla `solicitudCompraAdjuntos`
- 🔜 Componente de upload (implementar según ejemplo)

---

## 🎯 Próximos Pasos

1. Crear endpoint en backend para subir archivos físicos
2. Configurar carpeta de almacenamiento en el servidor
3. Implementar componente Angular según el ejemplo
4. Agregar funcionalidad de descarga
5. Implementar sincronización offline/online
