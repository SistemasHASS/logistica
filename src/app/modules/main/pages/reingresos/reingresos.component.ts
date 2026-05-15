import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ReingresoService } from '../../services/reingreso.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import Swal from 'sweetalert2';

interface Reingreso {
  id?: number;
  numeroReingreso: string;
  saldoPendienteId: number;
  requerimientoOriginalId: number;
  numeroRequerimientoOriginal: string;
  area: string;
  nombreArea: string;
  fecha: string;
  motivo: string;
  observaciones?: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO';
  usuarioRegistra: string;
  fechaRegistro?: string;
  usuarioAprueba?: string;
  fechaAprobacion?: string;
  motivoRechazo?: string;
  requerimientoGeneradoId?: number;
  numeroRequerimientoGenerado?: string;
  detalle: DetalleReingreso[];
}

interface DetalleReingreso {
  id?: number;
  reingresoId: number;
  codigo: string;
  descripcion: string;
  cantidadSolicitada: number;
  cantidadPendiente: number;
  unidadMedida: string;
  observacion?: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

interface SaldoPendiente {
  id: number;
  requerimientoId: number;
  numeroRequerimiento: string;
  area: string;
  nombreArea: string;
  fecha: string;
  codigo: string;
  descripcion: string;
  cantidadSolicitada: number;
  cantidadDespachada: number;
  cantidadPendiente: number;
  unidadMedida: string;
  estado: string;
}

@Component({
  selector: 'app-reingresos',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DialogModule, ButtonModule, TooltipModule],
  templateUrl: './reingresos.component.html',
  styleUrls: ['./reingresos.component.scss']
})
export class ReingresosComponent implements OnInit {
  // Listas
  reingresos: Reingreso[] = [];
  saldosPendientes: SaldoPendiente[] = [];

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
  tabActiva: 'saldos' | 'reingresos' = 'saldos';

  // Formulario
  mostrarFormulario = false;
  reingreso: Reingreso = this.nuevoReingreso();
  saldoSeleccionado: SaldoPendiente | null = null;

  // Filtros
  filtroEstado: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Contadores
  totalReingresos = 0;
  reingresosPendientes = 0;
  reingresosAprobados = 0;
  reingresosRechazados = 0;

  // Modal detalle
  modalDetalleAbierto = false;
  reingresoDetalle: Reingreso | null = null;

  // Loading
  loading = false;

  constructor(
    private reingresoService: ReingresoService,
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

      // Cargar saldos pendientes desde backend
      this.saldosPendientes = await this.reingresoService.listarSaldosPendientes();
      
      // Cargar reingresos desde backend
      this.reingresos = await this.reingresoService.listarReingresos();

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
    this.totalReingresos = this.reingresos.length;
    this.reingresosPendientes = this.reingresos.filter(r => r.estado === 'PENDIENTE').length;
    this.reingresosAprobados = this.reingresos.filter(r => r.estado === 'APROBADO').length;
    this.reingresosRechazados = this.reingresos.filter(r => r.estado === 'RECHAZADO').length;
  }

  nuevoReingreso(): Reingreso {
    return {
      numeroReingreso: this.generarNumeroReingreso(),
      saldoPendienteId: 0,
      requerimientoOriginalId: 0,
      numeroRequerimientoOriginal: '',
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

  generarNumeroReingreso(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const segundo = String(fecha.getSeconds()).padStart(2, '0');
    return `REING-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
  }

  async generarReingresoDesdeSaldo(saldo: SaldoPendiente) {
    const { value: motivo } = await Swal.fire({
      title: 'Generar Reingreso',
      input: 'textarea',
      inputLabel: 'Ingrese el motivo del reingreso:',
      inputPlaceholder: 'Motivo del reingreso...',
      showCancelButton: true,
      confirmButtonText: 'Generar',
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

      const resultado = await this.reingresoService.generarReingresoDesdeSaldo(
        saldo.id,
        motivo,
        this.usuario.documentoidentidad
      );

      if (resultado.resultado === 'OK') {
        this.loading = false;
        this.alertService.showAlert('Éxito', 'Reingreso generado correctamente.', 'success');
        
        await this.cargarDatos();
        this.calcularContadores();
        this.tabActiva = 'reingresos';
      } else {
        this.loading = false;
        this.alertService.showAlert('Error', resultado.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error al generar reingreso:', error);
      this.loading = false;
      this.alertService.showAlert('Error', 'Ocurrió un error al generar el reingreso.', 'error');
    }
  }

  async aprobarReingreso(reingreso: Reingreso) {
    const confirmar = await this.alertService.showConfirm(
      'Confirmar',
      '¿Está seguro de aprobar este reingreso? Se generará un nuevo requerimiento de consumo.',
      'question'
    );

    if (!confirmar) return;

    try {
      this.loading = true;

      const resultado = await this.reingresoService.aprobarReingreso(
        reingreso.id!,
        this.usuario.documentoidentidad
      );

      if (resultado.resultado === 'OK') {
        this.loading = false;
        this.alertService.showAlert(
          'Éxito', 
          `Reingreso aprobado. Requerimiento generado: ${resultado.numeroRequerimiento}`,
          'success'
        );
        await this.cargarDatos();
        this.calcularContadores();
      } else {
        this.loading = false;
        this.alertService.showAlert('Error', resultado.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error al aprobar reingreso:', error);
      this.loading = false;
      this.alertService.showAlert('Error', 'Error al aprobar el reingreso.', 'error');
    }
  }

  async rechazarReingreso(reingreso: Reingreso) {
    const { value: motivo } = await Swal.fire({
      title: 'Rechazar Reingreso',
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

      const resultado = await this.reingresoService.rechazarReingreso(
        reingreso.id!,
        motivo,
        this.usuario.documentoidentidad
      );

      if (resultado.resultado === 'OK') {
        this.loading = false;
        this.alertService.showAlert('Éxito', 'Reingreso rechazado correctamente.', 'success');
        await this.cargarDatos();
        this.calcularContadores();
      } else {
        this.loading = false;
        this.alertService.showAlert('Error', resultado.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error al rechazar reingreso:', error);
      this.loading = false;
      this.alertService.showAlert('Error', 'Error al rechazar el reingreso.', 'error');
    }
  }

  async anularReingreso(reingreso: Reingreso) {
    const { value: motivo } = await Swal.fire({
      title: 'Anular Reingreso',
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

      const resultado = await this.reingresoService.anularReingreso(
        reingreso.id!,
        motivo,
        this.usuario.documentoidentidad
      );

      if (resultado.resultado === 'OK') {
        this.loading = false;
        this.alertService.showAlert('Éxito', 'Reingreso anulado correctamente.', 'success');
        await this.cargarDatos();
        this.calcularContadores();
      } else {
        this.loading = false;
        this.alertService.showAlert('Error', resultado.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error al anular reingreso:', error);
      this.loading = false;
      this.alertService.showAlert('Error', 'Error al anular el reingreso.', 'error');
    }
  }

  verDetalle(reingreso: Reingreso) {
    this.reingresoDetalle = reingreso;
    this.modalDetalleAbierto = true;
  }

  cerrarModal() {
    this.modalDetalleAbierto = false;
    this.reingresoDetalle = null;
  }

  get reingresosFiltrados(): Reingreso[] {
    return this.reingresos.filter(r => {
      const cumpleEstado = !this.filtroEstado || r.estado === this.filtroEstado;
      const cumpleFechaInicio = !this.filtroFechaInicio || r.fecha >= this.filtroFechaInicio;
      const cumpleFechaFin = !this.filtroFechaFin || r.fecha <= this.filtroFechaFin;
      
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
      'APROBADO': 'badge-estado estado-confirmado',
      'RECHAZADO': 'badge-estado estado-rechazado',
      'ANULADO': 'badge-estado estado-inactivo'
    };
    return clases[estado] || 'badge-estado estado-inactivo';
  }
}
