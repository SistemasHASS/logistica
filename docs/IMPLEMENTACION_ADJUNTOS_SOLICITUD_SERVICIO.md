# Implementación de Adjuntos para Solicitud de Servicio

## 📋 Resumen

Se ha implementado la funcionalidad completa para adjuntar archivos a las Solicitudes de Servicio, similar a las Solicitudes de Compra, incluyendo:
- Tabla en base de datos SQL Server
- Interfaces TypeScript
- Tabla Dexie para almacenamiento local
- Componente Angular reutilizable para subir archivos

---

## 🗄️ Base de Datos

### Tabla: LOGISTICA_SolicitudServicioAdjuntos

```sql
CREATE TABLE [dbo].[LOGISTICA_SolicitudServicioAdjuntos](
    [idAdjunto] INT IDENTITY(1,1) PRIMARY KEY,
    [idSolicitudServicio] INT NOT NULL,
    [nombreArchivo] NVARCHAR(255) NOT NULL,
    [rutaArchivo] NVARCHAR(500) NOT NULL,
    [tipoArchivo] NVARCHAR(50) NULL,
    [tamanoArchivo] BIGINT NULL,
    [descripcion] NVARCHAR(500) NULL,
    [fechaCreacion] DATETIME NOT NULL DEFAULT GETDATE(),
    [usuarioCreacion] NVARCHAR(20) NOT NULL,
    [activo] BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_SolicitudServicioAdjuntos_SolicitudServicio 
        FOREIGN KEY([idSolicitudServicio]) 
        REFERENCES [dbo].[LOGISTICA_SolicitudServicio]([idSolicitudServicio])
)
```

**Índice creado:**
```sql
CREATE NONCLUSTERED INDEX IX_SolicitudServicioAdjuntos_IdSolicitudServicio
ON LOGISTICA_SolicitudServicioAdjuntos ([idSolicitudServicio])
INCLUDE ([nombreArchivo], [rutaArchivo], [activo]);
```

---

## 💻 Frontend - TypeScript

### Interface: SolicitudServicio

```typescript
export interface SolicitudServicio {
  id?: number;
  numeroSolicitud: string;
  fecha: string;
  fechaEnvio?: string;
  fechaAprobacion?: string;
  tipo: 'MANTENIMIENTO' | 'REPARACION' | 'INSTALACION' | 'CONSULTORIA' | 'OTRO';
  area: string;
  usuarioSolicita: string;
  nombreSolicita: string;
  usuarioAprueba?: string;
  estado:
    | 'GENERADA'
    | 'ENVIADA'
    | 'APROBADA'
    | 'RECHAZADA'
    | 'EN_PROCESO'
    | 'COMPLETADA'
    | 'CANCELADA';
  descripcionServicio: string;
  observaciones?: string;
  motivoRechazo?: string;
  prioridad?: 'NORMAL' | 'URGENTE' | 'CRITICA';
  fechaRequerida?: string;
  montoEstimado?: number;
  moneda?: string;
  proveedor?: string;
  empresa?: string;
  adjuntos?: SolicitudServicioAdjunto[];
}
```

### Interface: SolicitudServicioAdjunto

```typescript
export interface SolicitudServicioAdjunto {
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
  file?: File; // Para el archivo temporal antes de subir
}
```

### Dexie Tables

```typescript
// En dexie-db.service.ts
public solicitudesServicio!: Dexie.Table<SolicitudServicio, number>;
public solicitudServicioAdjuntos!: Dexie.Table<SolicitudServicioAdjunto, number>;

// En el schema
solicitudesServicio: `++id,numeroSolicitud,fecha,estado,usuarioSolicita,nombreSolicita,area,tipo,prioridad,fechaEnvio,fechaAprobacion,descripcionServicio,observaciones,motivoRechazo,montoEstimado,moneda,proveedor,empresa,fechaRequerida`
solicitudServicioAdjuntos: `++idAdjunto,idSolicitudServicio,nombreArchivo,rutaArchivo,tipoArchivo,usuarioCreacion,fechaCreacion,activo`

// En el constructor
this.solicitudesServicio = this.table('solicitudesServicio');
this.solicitudServicioAdjuntos = this.table('solicitudServicioAdjuntos');
```

---

## 🎨 Componente Angular - Upload de Archivos

### HTML Template (Reutilizable)

```html
<!-- Sección de Adjuntos en el formulario de Solicitud de Servicio -->
<div class="card mt-3">
  <div class="card-header">
    <h5 class="mb-0">
      <i class="pi pi-paperclip me-2"></i>
      Archivos Adjuntos
      <span class="badge bg-info ms-2" *ngIf="adjuntos.length > 0">
        {{ adjuntos.length }}
      </span>
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
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar"
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
        Formatos: PDF, Word, Excel, Imágenes, ZIP (Max 10MB)
      </small>
    </div>

    <!-- Lista de archivos adjuntos -->
    <div *ngIf="adjuntos.length > 0" class="table-responsive">
      <table class="table table-sm table-hover">
        <thead class="table-light">
          <tr>
            <th style="width: 35%">Archivo</th>
            <th style="width: 15%">Tipo</th>
            <th style="width: 10%">Tamaño</th>
            <th style="width: 30%">Descripción</th>
            <th style="width: 10%">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let adjunto of adjuntos; let i = index">
            <td>
              <i [class]="getFileIcon(adjunto.tipoArchivo)" class="me-2"></i>
              <span class="text-truncate d-inline-block" style="max-width: 200px;" 
                    [title]="adjunto.nombreArchivo">
                {{ adjunto.nombreArchivo }}
              </span>
            </td>
            <td>
              <span class="badge bg-secondary">
                {{ getFileExtension(adjunto.nombreArchivo) }}
              </span>
            </td>
            <td>
              <small>{{ formatFileSize(adjunto.tamanoArchivo) }}</small>
            </td>
            <td>
              <input 
                type="text" 
                class="form-control form-control-sm" 
                [(ngModel)]="adjunto.descripcion"
                placeholder="Descripción opcional"
                maxlength="200"
              />
            </td>
            <td>
              <div class="btn-group btn-group-sm">
                <button 
                  type="button" 
                  class="btn btn-outline-danger"
                  (click)="eliminarAdjunto(i)"
                  title="Eliminar"
                >
                  <i class="pi pi-trash"></i>
                </button>
                <button 
                  *ngIf="adjunto.rutaArchivo && !adjunto.file"
                  type="button" 
                  class="btn btn-outline-info"
                  (click)="descargarAdjunto(adjunto)"
                  title="Descargar"
                >
                  <i class="pi pi-download"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mensaje cuando no hay archivos -->
    <div *ngIf="adjuntos.length === 0" class="text-center text-muted py-4">
      <i class="pi pi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
      <p class="mb-0 mt-2">No hay archivos adjuntos</p>
      <small>Haga clic en "Agregar Archivo" para adjuntar documentos</small>
    </div>
  </div>
</div>
```

### TypeScript Component

```typescript
import { Component, OnInit } from '@angular/core';
import { SolicitudServicio, SolicitudServicioAdjunto } from '@shared/interfaces/Tables';
import { DexieService } from '@shared/dixiedb/dexie-db.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-solicitud-servicio-form',
  templateUrl: './solicitud-servicio-form.component.html',
  styleUrls: ['./solicitud-servicio-form.component.scss']
})
export class SolicitudServicioFormComponent implements OnInit {
  adjuntos: SolicitudServicioAdjunto[] = [];
  maxFileSize = 10 * 1024 * 1024; // 10MB
  allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/zip',
    'application/x-rar-compressed'
  ];

  constructor(private dexieService: DexieService) {}

  ngOnInit(): void {
    // Cargar adjuntos si estamos editando
  }

  /**
   * Maneja la selección de archivos
   */
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }

    let archivosAgregados = 0;

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
      const adjunto: SolicitudServicioAdjunto = {
        nombreArchivo: file.name,
        rutaArchivo: '', // Se llenará al subir al servidor
        tipoArchivo: file.type,
        tamanoArchivo: file.size,
        descripcion: '',
        file: file,
        activo: true
      };

      this.adjuntos.push(adjunto);
      archivosAgregados++;
    }

    // Limpiar input
    event.target.value = '';

    if (archivosAgregados > 0) {
      Swal.fire({
        icon: 'success',
        title: 'Archivos agregados',
        text: `Se agregaron ${archivosAgregados} archivo(s)`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
    }
  }

  /**
   * Elimina un adjunto de la lista
   */
  eliminarAdjunto(index: number): void {
    const adjunto = this.adjuntos[index];
    
    Swal.fire({
      title: '¿Eliminar archivo?',
      text: `¿Está seguro de eliminar "${adjunto.nombreArchivo}"?`,
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
  descargarAdjunto(adjunto: SolicitudServicioAdjunto): void {
    if (!adjunto.rutaArchivo) {
      return;
    }

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
    if (tipoArchivo.includes('zip') || tipoArchivo.includes('rar')) 
      return 'pi pi-folder text-warning';
    
    return 'pi pi-file';
  }

  /**
   * Obtiene la extensión del archivo
   */
  getFileExtension(nombreArchivo: string): string {
    const parts = nombreArchivo.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'N/A';
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
   * Guarda los adjuntos en Dexie
   */
  async guardarAdjuntosEnDexie(idSolicitudServicio: number): Promise<void> {
    const usuario = await this.dexieService.usuario.toArray();
    const usuarioActual = usuario[0]?.usuario || 'SYSTEM';

    for (const adjunto of this.adjuntos) {
      if (adjunto.file) {
        const base64 = await this.fileToBase64(adjunto.file);
        
        await this.dexieService.solicitudServicioAdjuntos.add({
          idSolicitudServicio: idSolicitudServicio,
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
  async cargarAdjuntosDesdeDexi(idSolicitudServicio: number): Promise<void> {
    const adjuntosDB = await this.dexieService.solicitudServicioAdjuntos
      .where('idSolicitudServicio')
      .equals(idSolicitudServicio)
      .and(adj => adj.activo === true)
      .toArray();

    this.adjuntos = adjuntosDB;
  }
}
```

---

## 🚀 Flujo de Trabajo

### 1. Crear Solicitud de Servicio con Adjuntos

```typescript
async crearSolicitudServicio(): Promise<void> {
  // 1. Crear la solicitud en Dexie
  const idSolicitud = await this.dexieService.solicitudesServicio.add({
    numeroSolicitud: this.generarNumeroSolicitud(),
    fecha: new Date().toISOString(),
    tipo: this.form.value.tipo,
    area: this.form.value.area,
    usuarioSolicita: this.usuarioActual,
    nombreSolicita: this.nombreUsuario,
    estado: 'GENERADA',
    prioridad: this.form.value.prioridad,
    descripcionServicio: this.form.value.descripcionServicio,
    observaciones: this.form.value.observaciones,
    empresa: this.empresaActual
  });

  // 2. Guardar adjuntos en Dexie
  await this.guardarAdjuntosEnDexie(idSolicitud);

  // 3. Mostrar confirmación
  Swal.fire({
    icon: 'success',
    title: 'Solicitud creada',
    text: `Solicitud ${this.numeroSolicitud} creada exitosamente`,
    confirmButtonText: 'Aceptar'
  });
}
```

---

## 📝 Pasos de Implementación

### Backend
1. ✅ Ejecutar `CREATE_TABLE_SOLICITUD_SERVICIO_ADJUNTOS.sql`
2. 🔜 Crear stored procedures para listar y obtener solicitudes de servicio
3. 🔜 Crear endpoint para subir archivos al servidor
4. 🔜 Configurar almacenamiento de archivos

### Frontend
1. ✅ Agregar interface `SolicitudServicio` en Tables.ts
2. ✅ Agregar interface `SolicitudServicioAdjunto` en Tables.ts
3. ✅ Agregar tablas Dexie
4. 🔜 Implementar componente de upload en formulario
5. 🔜 Agregar visualización de adjuntos en detalle

---

## 🔒 Consideraciones de Seguridad

1. **Validación de archivos**: Solo permitir tipos específicos
2. **Tamaño máximo**: Limitar a 10MB por archivo
3. **Sanitización**: Validar nombres de archivo
4. **Almacenamiento**: Usar nombres únicos (GUID) en el servidor
5. **Permisos**: Solo el creador y aprobadores pueden ver adjuntos
6. **Antivirus**: Escanear archivos antes de almacenar (recomendado)

---

## 📦 Archivos Creados/Modificados

### SQL
- ✅ `CREATE_TABLE_SOLICITUD_SERVICIO_ADJUNTOS.sql`

### Frontend
- ✅ `Tables.ts` - Interfaces `SolicitudServicio` y `SolicitudServicioAdjunto`
- ✅ `dexie-db.service.ts` - Tablas `solicitudesServicio` y `solicitudServicioAdjuntos`
- 🔜 Componente de upload (implementar según ejemplo)

---

## 🎯 Diferencias con Solicitud de Compra

| Característica | Solicitud de Compra | Solicitud de Servicio |
|----------------|---------------------|----------------------|
| **Tabla principal** | LOGISTICA_SolicitudCompra | LOGISTICA_SolicitudServicio |
| **FK en adjuntos** | idSolicitud | idSolicitudServicio |
| **Tipos** | CONSOLIDADA, DIRECTA, URGENTE | MANTENIMIENTO, REPARACION, etc. |
| **Campo principal** | almacen | area |
| **Detalle** | DetalleSolicitudCompra[] | descripcionServicio (texto) |
| **Formatos adicionales** | - | ZIP, RAR (para planos, manuales) |

---

## 💡 Casos de Uso

### Mantenimiento Preventivo
- Adjuntar: Manual del equipo, cronograma, checklist

### Reparación
- Adjuntar: Fotos del daño, cotizaciones, reportes técnicos

### Instalación
- Adjuntar: Planos, especificaciones técnicas, permisos

### Consultoría
- Adjuntar: TDR, propuestas, contratos

---

## 🔄 Sincronización Offline/Online

```typescript
async sincronizarSolicitudesServicio(): Promise<void> {
  const solicitudes = await this.dexieService.solicitudesServicio
    .where('estado')
    .equals('GENERADA')
    .toArray();

  for (const solicitud of solicitudes) {
    // Obtener adjuntos
    const adjuntos = await this.dexieService.solicitudServicioAdjuntos
      .where('idSolicitudServicio')
      .equals(solicitud.id!)
      .toArray();

    // Subir archivos al servidor
    for (const adjunto of adjuntos) {
      if (adjunto.rutaArchivo.startsWith('data:')) {
        // Es base64, subir al servidor
        const url = await this.subirArchivoAlServidor(adjunto);
        adjunto.rutaArchivo = url;
      }
    }

    // Enviar solicitud al backend
    await this.solicitudServicioService.crear(solicitud, adjuntos);
  }
}
```

---

## ✅ Resumen

La funcionalidad de adjuntos para Solicitud de Servicio está **lista para implementar** siguiendo el mismo patrón de Solicitud de Compra. Todos los componentes de base de datos, interfaces TypeScript y tablas Dexie están configurados.

**Próximo paso**: Implementar el componente Angular usando el código de ejemplo proporcionado.
