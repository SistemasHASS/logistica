import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DevolucionConsumoService } from '../../services/devolucion-consumo.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import Swal from 'sweetalert2';

interface DevolucionConsumo {
  id?: number;
  numeroDevolucion: string;
  despachoId: number;
  numeroDespacho: string;
  requerimientoId: number;
  numeroRequerimiento: string;
  area: string;
  nombreArea: string;
  fecha: string;
  motivo: string;
  observaciones?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'ANULADA';
  usuarioRegistra: string;
  fechaRegistro?: string;
  usuarioAprueba?: string;
  fechaAprobacion?: string;
  motivoRechazo?: string;
  detalle: DetalleDevolucionConsumo[];
}

interface DetalleDevolucionConsumo {
  id?: number;
  devolucionId: number;
  codigo: string;
  descripcion: string;
  cantidadDevuelta: number;
  cantidadDespachada: number;
  unidadMedida: string;
  motivoDetalle?: string;
  lote?: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

interface DespachoConsumo {
  id: number;
  numeroDespacho: string;
  fecha: string;
  almacen: string;
  area: string;
  nombreArea: string;
  numeroRequerimiento: string;
  usuarioDespacha: string;
  totalItems: number;
  cantidadTotal: number;
}

@Component({
  selector: 'app-devoluciones-consumo',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DialogModule, ButtonModule, TooltipModule],
  templateUrl: './devoluciones-consumo.component.html',
  styleUrls: ['./devoluciones-consumo.component.scss']
})
export class DevolucionesConsumoComponent implements OnInit {
  // Listas
  devoluciones: DevolucionConsumo[] = [];
  despachosConsumo: DespachoConsumo[] = [];

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

  // Tabs
  tabActiva: 'despachos' | 'devoluciones' = 'despachos';

  // Formulario
  mostrarFormulario = false;
  devolucion: DevolucionConsumo = this.nuevaDevolucion();
  despachoSeleccionado: DespachoConsumo | null = null;

  // Filtros
  filtroEstado: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Contadores
  totalDevoluciones = 0;
  devolucionesPendientes = 0;
  devolucionesAprobadas = 0;
  devolucionesRechazadas = 0;

  // Modal detalle
  modalDetalleAbierto = false;
  devolucionDetalle: DevolucionConsumo | null = null;

  // Loading
  loading = false;

  constructor(
    private devolucionService: DevolucionConsumoService,
    private alertService: AlertService,
    private dexieService: DexieService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarDatos();
    this.calcularContadores();
  }

  async cargarUsuario() {
    const usuarioData = await this.dexieService.showUsuario();
    if (usuarioData) {
      this.usuario = usuarioData;
    }
  }

  async cargarDatos() {
    try {
      this.loading = true;

      // Cargar despachos de consumo desde backend
      this.despachosConsumo = await this.devolucionService.listarDespachosConsumo();
      
      // Cargar devoluciones desde backend
      this.devoluciones = await this.devolucionService.listarDevoluciones();

      this.loading = false;
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudieron cargar los datos',
        'error'
      );
      this.loading = false;
    }
  }

  calcularContadores() {
    this.totalDevoluciones = this.devoluciones.length;
    this.devolucionesPendientes = this.devoluciones.filter(d => d.estado === 'PENDIENTE').length;
    this.devolucionesAprobadas = this.devoluciones.filter(d => d.estado === 'APROBADA').length;
    this.devolucionesRechazadas = this.devoluciones.filter(d => d.estado === 'RECHAZADA').length;
  }

  nuevaDevolucion(): DevolucionConsumo {
    return {
      numeroDevolucion: this.generarNumeroDevolucion(),
      despachoId: 0,
      numeroDespacho: '',
      requerimientoId: 0,
      numeroRequerimiento: '',
      area: '',
      nombreArea: '',
      fecha: new Date().toISOString().split('T')[0],
      motivo: '',
      observaciones: '',
      estado: 'PENDIENTE',
      usuarioRegistra: this.usuario.documentoidentidad || '',
      detalle: []
    };
  }

  generarNumeroDevolucion(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const segundo = String(fecha.getSeconds()).padStart(2, '0');
    return `DEVC-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
  }

  async generarDevolucionDesdeDespacho(despacho: DespachoConsumo) {
    try {
      this.loading = true;
      
      this.despachoSeleccionado = despacho;
      this.devolucion = this.nuevaDevolucion();
      this.devolucion.despachoId = despacho.id;
      this.devolucion.numeroDespacho = despacho.numeroDespacho;
      this.devolucion.numeroRequerimiento = despacho.numeroRequerimiento;
      this.devolucion.area = despacho.area;
      this.devolucion.nombreArea = despacho.nombreArea;

      // Aquí deberías cargar los items del despacho
      // Por ahora dejamos el detalle vacío para que el usuario lo agregue
      
      this.mostrarFormulario = true;
      this.tabActiva = 'devoluciones';
      
      this.loading = false;
    } catch (error) {
      console.error('Error al generar devolución:', error);
      this.loading = false;
      this.alertService.showAlert('Error', 'Error al generar la devolución.', 'error');
    }
  }

  agregarDetalle() {
    this.devolucion.detalle.push({
      devolucionId: 0,
      codigo: '',
      descripcion: '',
      cantidadDevuelta: 0,
      cantidadDespachada: 0,
      unidadMedida: 'UND',
      motivoDetalle: '',
      lote: '',
      estado: 'PENDIENTE'
    });
  }

  eliminarDetalle(index: number) {
    this.devolucion.detalle.splice(index, 1);
  }

  async guardarDevolucion() {
    // Validaciones
    if (!this.devolucion.motivo) {
      this.alertService.showAlert('Atención', 'Debe ingresar el motivo de la devolución.', 'warning');
      return;
    }

    if (this.devolucion.detalle.length === 0) {
      this.alertService.showAlert('Atención', 'Debe tener al menos un item para devolver.', 'warning');
      return;
    }

    try {
      this.loading = true;

      this.devolucion.usuarioRegistra = this.usuario.documentoidentidad;
      
      // Guardar en backend
      const resultado = await this.devolucionService.registrarDevolucion(this.devolucion);

      if (resultado.resultado === 'OK') {
        this.loading = false;
        this.alertService.showAlert('Éxito', 'Devolución registrada correctamente.', 'success');

        this.mostrarFormulario = false;
        await this.cargarDatos();
        this.calcularContadores();
      } else {
        this.loading = false;
        this.alertService.showAlert('Error', resultado.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error al guardar devolución:', error);
      this.loading = false;
      this.alertService.showAlert('Error', 'Ocurrió un error al guardar la devolución.', 'error');
    }
  }

  async aprobarDevolucion(devolucion: DevolucionConsumo) {
    const confirmar = await this.alertService.showConfirm(
      'Confirmar',
      '¿Está seguro de aprobar esta devolución?',
      'question'
    );

    if (!confirmar) return;

    try {
      this.loading = true;

      const resultado = await this.devolucionService.aprobarDevolucion(
        devolucion.id!,
        this.usuario.documentoidentidad
      );

      if (resultado.resultado === 'OK') {
        this.loading = false;
        this.alertService.showAlert('Éxito', 'Devolución aprobada correctamente.', 'success');
        await this.cargarDatos();
        this.calcularContadores();
      } else {
        this.loading = false;
        this.alertService.showAlert('Error', resultado.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error al aprobar devolución:', error);
      this.loading = false;
      this.alertService.showAlert('Error', 'Error al aprobar la devolución.', 'error');
    }
  }

  async rechazarDevolucion(devolucion: DevolucionConsumo) {
    const { value: motivo } = await Swal.fire({
      title: 'Rechazar Devolución',
      input: 'textarea',
      inputLabel: 'Ingrese el motivo del rechazo:',
      inputPlaceholder: 'Motivo del rechazo...',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un motivo';
        }
        return null;
      }
    });

    if (!motivo) return;

    try {
      this.loading = true;

      const resultado = await this.devolucionService.rechazarDevolucion(
        devolucion.id!,
        motivo,
        this.usuario.documentoidentidad
      );

      if (resultado.resultado === 'OK') {
        this.loading = false;
        this.alertService.showAlert('Éxito', 'Devolución rechazada correctamente.', 'success');
        await this.cargarDatos();
        this.calcularContadores();
      } else {
        this.loading = false;
        this.alertService.showAlert('Error', resultado.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error al rechazar devolución:', error);
      this.loading = false;
      this.alertService.showAlert('Error', 'Error al rechazar la devolución.', 'error');
    }
  }

  async anularDevolucion(devolucion: DevolucionConsumo) {
    const { value: motivo } = await Swal.fire({
      title: 'Anular Devolución',
      input: 'textarea',
      inputLabel: 'Ingrese el motivo de la anulación:',
      inputPlaceholder: 'Motivo de la anulación...',
      showCancelButton: true,
      confirmButtonText: 'Anular',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un motivo';
        }
        return null;
      }
    });

    if (!motivo) return;

    try {
      this.loading = true;

      const resultado = await this.devolucionService.anularDevolucion(
        devolucion.id!,
        motivo,
        this.usuario.documentoidentidad
      );

      if (resultado.resultado === 'OK') {
        this.loading = false;
        this.alertService.showAlert('Éxito', 'Devolución anulada correctamente.', 'success');
        await this.cargarDatos();
        this.calcularContadores();
      } else {
        this.loading = false;
        this.alertService.showAlert('Error', resultado.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error al anular devolución:', error);
      this.loading = false;
      this.alertService.showAlert('Error', 'Error al anular la devolución.', 'error');
    }
  }

  verDetalle(devolucion: DevolucionConsumo) {
    this.devolucionDetalle = devolucion;
    this.modalDetalleAbierto = true;
  }

  cerrarModal() {
    this.modalDetalleAbierto = false;
    this.devolucionDetalle = null;
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.devolucion = this.nuevaDevolucion();
    this.despachoSeleccionado = null;
  }

  get devolucionesFiltradas(): DevolucionConsumo[] {
    return this.devoluciones.filter(d => {
      const cumpleEstado = !this.filtroEstado || d.estado === this.filtroEstado;
      const cumpleFechaInicio = !this.filtroFechaInicio || d.fecha >= this.filtroFechaInicio;
      const cumpleFechaFin = !this.filtroFechaFin || d.fecha <= this.filtroFechaFin;
      
      return cumpleEstado && cumpleFechaInicio && cumpleFechaFin;
    });
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE');
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      'PENDIENTE': 'badge-estado estado-pendiente',
      'APROBADA': 'badge-estado estado-confirmado',
      'RECHAZADA': 'badge-estado estado-rechazado',
      'ANULADA': 'badge-estado estado-inactivo'
    };
    return clases[estado] || 'badge-estado estado-inactivo';
  }
}
