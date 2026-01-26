import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import {
  SolicitudCompra,
  DetalleSolicitudCompra,
  Usuario,
  Requerimiento,
  DetalleRequerimiento,
  Almacen,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-solicitudes-compra',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './solicitudes-compra.component.html',
  styleUrls: ['./solicitudes-compra.component.scss'],
})
export class SolicitudesCompraComponent implements OnInit {
  // Listas principales
  solicitudesCompra: SolicitudCompra[] = [];
  requerimientosAprobados: Requerimiento[] = [];
  almacenes: Almacen[] = [];

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;

  // Solicitud actual
  solicitud: SolicitudCompra = this.nuevaSolicitud();
  detalleSolicitud: DetalleSolicitudCompra[] = [];

  // Usuario
  usuario: Usuario = {
    id: '',
    sociedad: 0,
    idempresa: '',
    ruc: '',
    razonSocial: '',
    idProyecto: '',
    proyecto: '',
    documentoidentidad: '',
    usuario: '',
    clave: '',
    nombre: '',
    idrol: '',
    rol: '',
  };

  // Selección
  requerimientosSeleccionados: Requerimiento[] = [];
  allSelected = false;

  // Filtros
  filtroEstado: string = 'TODAS';
  filtroTipo: string = 'TODAS';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Contadores
  totalGeneradas = 0;
  totalEnviadas = 0;
  totalAprobadas = 0;
  totalEnCotizacion = 0;

  // Modal detalle
  modalDetalleAbierto = false;
  solicitudDetalle: SolicitudCompra | null = null;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService,
    private utilsService: UtilsService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarMaestras();
    await this.cargarSolicitudes();
    await this.cargarRequerimientosAprobados();
    this.actualizarContadores();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarMaestras() {
    this.almacenes = await this.dexieService.showAlmacenes();
  }

  async cargarSolicitudes() {
    this.solicitudesCompra = await this.dexieService.showSolicitudesCompra();
    this.actualizarContadores();
  }

  async cargarRequerimientosAprobados() {
    const todosRequerimientos = await this.dexieService.showRequerimiento();
    // Filtrar solo requerimientos aprobados y no despachados
    this.requerimientosAprobados = todosRequerimientos.filter(
      (r: Requerimiento) => r.estado === 1 && !r.despachado
    );
  }

  actualizarContadores() {
    this.totalGeneradas = this.solicitudesCompra.filter(
      (s) => s.estado === 'GENERADA'
    ).length;
    this.totalEnviadas = this.solicitudesCompra.filter(
      (s) => s.estado === 'ENVIADA'
    ).length;
    this.totalAprobadas = this.solicitudesCompra.filter(
      (s) => s.estado === 'APROBADA'
    ).length;
    this.totalEnCotizacion = this.solicitudesCompra.filter(
      (s) => s.estado === 'EN_COTIZACION'
    ).length;
  }

  nuevaSolicitud(): SolicitudCompra {
    return {
      numeroSolicitud: '',
      fecha: new Date().toISOString(),
      tipo: 'CONSOLIDADA',
      almacen: '',
      usuarioSolicita: this.usuario.documentoidentidad || '',
      nombreSolicita: this.usuario.nombre || '',
      estado: 'GENERADA',
      detalle: [],
      prioridad: 'NORMAL',
    };
  }

  nuevoDetalle(): DetalleSolicitudCompra {
    return {
      id: 0,
      solicitudCompraId: 0,
      codigo: '',
      descripcion: '',
      cantidad: 0,
      cantidadAprobada: 0,
      cantidadAtendida: 0,
      unidadMedida: 'UND',
      estado: 'PENDIENTE',
    };
  }

  nuevaSolicitudCompra() {
    this.solicitud = this.nuevaSolicitud();
    this.detalleSolicitud = [];
    this.requerimientosSeleccionados = [];
    this.mostrarFormulario = true;
    this.modoEdicion = false;
  }

  async generarSolicitudDesdeRequerimientos() {
    if (this.requerimientosSeleccionados.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar al menos un requerimiento aprobado.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      // Generar número de solicitud
      const numeroSolicitud = this.generarNumeroSolicitud();

      // Consolidar detalles de todos los requerimientos seleccionados
      const detallesConsolidados: DetalleSolicitudCompra[] = [];
      const idsRequerimientos: string[] = [];

      for (const req of this.requerimientosSeleccionados) {
        idsRequerimientos.push(req.idrequerimiento);

        // Obtener detalles del requerimiento
        const detalles = await this.dexieService.showDetallesByRequerimiento(
          req.idrequerimiento
        );

        for (const det of detalles) {
          // Buscar si ya existe el mismo código en la consolidación
          const existente = detallesConsolidados.find(
            (d) => d.codigo === det.codigo
          );

          if (existente) {
            // Sumar cantidad
            existente.cantidad += det.cantidad;
            existente.cantidadAprobada += det.cantidad;
            existente.requerimientosOrigen += `,${req.idrequerimiento}`;
          } else {
            // Agregar nuevo
            detallesConsolidados.push({
              id: 0,
              solicitudCompraId: 0,
              codigo: det.codigo,
              descripcion: det.descripcion,
              cantidad: det.cantidad,
              cantidadAprobada: det.cantidad,
              cantidadAtendida: 0,
              unidadMedida: 'UND',
              proyecto: det.proyecto,
              ceco: det.ceco,
              turno: det.turno,
              labor: det.labor,
              requerimientosOrigen: req.idrequerimiento,
              estado: 'PENDIENTE',
            });
          }
        }
      }

      // Crear solicitud
      const nuevaSolicitud: SolicitudCompra = {
        numeroSolicitud: numeroSolicitud,
        fecha: new Date().toISOString(),
        tipo: 'CONSOLIDADA',
        almacen: this.requerimientosSeleccionados[0].almacen,
        usuarioSolicita: this.usuario.documentoidentidad,
        nombreSolicita: this.usuario.nombre,
        estado: 'GENERADA',
        detalle: detallesConsolidados,
        requerimientosOrigen: idsRequerimientos.join(','),
        prioridad: 'NORMAL',
      };

      // Guardar en Dexie
      await this.dexieService.saveSolicitudCompra(nuevaSolicitud);

      // Guardar detalles
      for (const det of detallesConsolidados) {
        await this.dexieService.detalleSolicitudCompra.add(det);
      }

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        `Solicitud de Compra ${numeroSolicitud} generada correctamente.`,
        'success'
      );

      // Recargar datos
      await this.cargarSolicitudes();
      this.requerimientosSeleccionados = [];
      this.allSelected = false;
    } catch (error) {
      console.error('Error al generar solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al generar la solicitud de compra.',
        'error'
      );
    }
  }

  generarNumeroSolicitud(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const seg = String(fecha.getSeconds()).padStart(2, '0');
    return `SC-${año}${mes}${dia}-${hora}${min}${seg}`;
  }

  editarSolicitud(index: number) {
    const solicitud = this.solicitudesFiltradas()[index];
    if (!solicitud) return;

    this.solicitud = { ...solicitud };
    this.detalleSolicitud = [...(solicitud.detalle || [])];
    this.modoEdicion = true;
    this.editIndex = index;
    this.mostrarFormulario = true;
  }

  async eliminarSolicitud(index: number) {
    const solicitud = this.solicitudesFiltradas()[index];
    if (!solicitud) return;

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Está seguro de eliminar esta solicitud de compra?',
      'warning'
    );

    if (!confirmacion) return;

    try {
      // Eliminar de Dexie
      await this.dexieService.solicitudesCompra.delete(solicitud.id!);

      // Eliminar detalles
      const detalles = await this.dexieService.detalleSolicitudCompra
        .where('solicitudCompraId')
        .equals(solicitud.id!)
        .toArray();

      for (const det of detalles) {
        await this.dexieService.detalleSolicitudCompra.delete(det.id);
      }

      this.alertService.showAlert(
        'Éxito',
        'Solicitud eliminada correctamente.',
        'success'
      );

      await this.cargarSolicitudes();
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar la solicitud.',
        'error'
      );
    }
  }

  async guardarSolicitud() {
    if (!this.solicitud.almacen) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar un almacén.',
        'warning'
      );
      return;
    }

    if (this.detalleSolicitud.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe agregar al menos un detalle a la solicitud.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      if (!this.modoEdicion) {
        this.solicitud.numeroSolicitud = this.generarNumeroSolicitud();
      }

      this.solicitud.detalle = [...this.detalleSolicitud];

      await this.dexieService.saveSolicitudCompra(this.solicitud);

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Solicitud guardada correctamente.',
        'success'
      );

      this.mostrarFormulario = false;
      await this.cargarSolicitudes();
    } catch (error) {
      console.error('Error al guardar solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar la solicitud.',
        'error'
      );
    }
  }

  cancelarFormulario() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar? Se perderán los cambios no guardados.'
    );
    if (!confirmar) return;
    this.mostrarFormulario = false;
  }

  verDetalle(solicitud: SolicitudCompra) {
    this.solicitudDetalle = solicitud;
    this.modalDetalleAbierto = true;
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.solicitudDetalle = null;
  }

  async enviarSolicitud(solicitud: SolicitudCompra) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar esta solicitud de compra para aprobación?',
      'info'
    );

    if (!confirmacion) return;

    try {
      solicitud.estado = 'ENVIADA';
      solicitud.fechaEnvio = new Date().toISOString();
      await this.dexieService.saveSolicitudCompra(solicitud);

      this.alertService.showAlert(
        'Éxito',
        'Solicitud enviada correctamente.',
        'success'
      );

      await this.cargarSolicitudes();
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al enviar la solicitud.',
        'error'
      );
    }
  }

  // Selección múltiple
  toggleSeleccionRequerimiento(req: Requerimiento) {
    const index = this.requerimientosSeleccionados.findIndex(
      (r) => r.idrequerimiento === req.idrequerimiento
    );

    if (index > -1) {
      this.requerimientosSeleccionados.splice(index, 1);
    } else {
      this.requerimientosSeleccionados.push(req);
    }
  }

  estaSeleccionado(req: Requerimiento): boolean {
    return this.requerimientosSeleccionados.some(
      (r) => r.idrequerimiento === req.idrequerimiento
    );
  }

  toggleSeleccionarTodos() {
    if (this.allSelected) {
      this.requerimientosSeleccionados = [];
    } else {
      this.requerimientosSeleccionados = [...this.requerimientosAprobados];
    }
    this.allSelected = !this.allSelected;
  }

  // Filtros
  solicitudesFiltradas(): SolicitudCompra[] {
    let filtradas = [...this.solicitudesCompra];

    if (this.filtroEstado !== 'TODAS') {
      filtradas = filtradas.filter((s) => s.estado === this.filtroEstado);
    }

    if (this.filtroTipo !== 'TODAS') {
      filtradas = filtradas.filter((s) => s.tipo === this.filtroTipo);
    }

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(
        (s) => new Date(s.fecha) >= new Date(this.filtroFechaInicio)
      );
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter(
        (s) => new Date(s.fecha) <= new Date(this.filtroFechaFin)
      );
    }

    return filtradas;
  }

  limpiarFiltros() {
    this.filtroEstado = 'TODAS';
    this.filtroTipo = 'TODAS';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
  }

  // Utilidades
  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      GENERADA: 'badge-info',
      ENVIADA: 'badge-warning',
      APROBADA: 'badge-success',
      RECHAZADA: 'badge-danger',
      EN_COTIZACION: 'badge-primary',
      ORDEN_GENERADA: 'badge-dark',
    };
    return clases[estado] || 'badge-secondary';
  }

  obtenerClasePrioridad(prioridad: string): string {
    const clases: { [key: string]: string } = {
      NORMAL: 'badge-secondary',
      URGENTE: 'badge-warning',
      CRITICA: 'badge-danger',
    };
    return clases[prioridad || 'NORMAL'] || 'badge-secondary';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  calcularMontoTotal(detalle: DetalleSolicitudCompra[]): number {
    return detalle.reduce((sum, d) => sum + (d.montoReferencial || 0), 0);
  }
}
