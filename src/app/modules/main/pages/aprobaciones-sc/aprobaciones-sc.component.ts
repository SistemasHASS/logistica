import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AprobacionSCService } from '@/app/services/aprobacion-sc.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-aprobaciones-sc',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule],
  templateUrl: './aprobaciones-sc.component.html',
  styleUrls: ['./aprobaciones-sc.component.scss']
})
export class AprobacionesSCComponent implements OnInit {
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

  // Listas
  solicitudesPendientes: any[] = [];
  solicitudesFiltradas: any[] = [];

  // Filtros
  filtroEstado: string = 'PENDIENTE';
  filtroPrioridad: string = 'TODAS';
  filtroNumeroSolicitud: string = '';

  // Contadores
  totalPendientes = 0;
  totalUrgentes = 0;
  totalAprobadosHoy = 0;
  totalRechazadosHoy = 0;
  tiempoPromedioAprobacion = 0;

  // Modal de aprobación/rechazo
  modalAprobacionAbierto = false;
  modalRechazoAbierto = false;
  solicitudSeleccionada: any = null;
  observaciones: string = '';
  motivoRechazo: string = '';

  // Modal de historial
  modalHistorialAbierto = false;
  historialAprobaciones: any[] = [];

  // Estado de conexión
  tieneConexion: boolean = true;
  cargando: boolean = false;

  constructor(
    private dexieService: DexieService,
    private aprobacionSCService: AprobacionSCService,
    private alertService: AlertService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.verificarConexionYCargar();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async verificarConexionYCargar() {
    try {
      this.tieneConexion = await this.aprobacionSCService.verificarConexion();
      
      if (this.tieneConexion) {
        await this.cargarSolicitudesPendientes();
        await this.cargarContadores();
      } else {
        this.alertService.showAlert(
          'Sin Conexión',
          'No hay conexión con el servidor. Trabajando en modo offline.',
          'warning'
        );
      }
    } catch (error) {
      console.error('Error al verificar conexión:', error);
      this.tieneConexion = false;
    }
  }

  async cargarSolicitudesPendientes() {
    try {
      this.cargando = true;
      
      const filtros = {
        usuarioAprobador: this.usuario.documentoidentidad,
        estado: this.filtroEstado !== 'TODAS' ? this.filtroEstado : null
      };

      const response = await this.aprobacionSCService.listarSolicitudesPendientes(filtros);
      this.solicitudesPendientes = Array.isArray(response) ? response : [];
      this.aplicarFiltros();
      
      this.cargando = false;
    } catch (error) {
      console.error('Error al cargar solicitudes pendientes:', error);
      this.cargando = false;
      this.alertService.showAlert(
        'Error',
        'No se pudieron cargar las solicitudes pendientes.',
        'error'
      );
    }
  }

  async cargarContadores() {
    try {
      const response = await this.aprobacionSCService.obtenerContadores(this.usuario.documentoidentidad);
      
      if (response) {
        this.totalPendientes = response.totalPendientes || 0;
        this.totalUrgentes = response.totalUrgentes || 0;
        this.totalAprobadosHoy = response.totalAprobadosHoy || 0;
        this.totalRechazadosHoy = response.totalRechazadosHoy || 0;
        this.tiempoPromedioAprobacion = response.tiempoPromedioAprobacion || 0;
      }
    } catch (error) {
      console.error('Error al cargar contadores:', error);
    }
  }

  aplicarFiltros() {
    this.solicitudesFiltradas = this.solicitudesPendientes.filter(s => {
      const coincideNumero = !this.filtroNumeroSolicitud || 
        s.numeroSolicitud.toLowerCase().includes(this.filtroNumeroSolicitud.toLowerCase());
      
      const coincidePrioridad = this.filtroPrioridad === 'TODAS' || 
        s.prioridadAprobacion === this.filtroPrioridad;

      return coincideNumero && coincidePrioridad;
    });
  }

  onFiltroChange() {
    this.aplicarFiltros();
  }

  async onEstadoChange() {
    await this.cargarSolicitudesPendientes();
  }

  abrirModalAprobacion(solicitud: any) {
    this.solicitudSeleccionada = solicitud;
    this.observaciones = '';
    this.modalAprobacionAbierto = true;
  }

  cerrarModalAprobacion() {
    this.modalAprobacionAbierto = false;
    this.solicitudSeleccionada = null;
    this.observaciones = '';
  }

  async confirmarAprobacion() {
    if (!this.solicitudSeleccionada) return;

    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Aprobación',
      `¿Está seguro de aprobar la solicitud ${this.solicitudSeleccionada.numeroSolicitud}?`,
      'question'
    );

    if (!confirmacion) return;

    try {
      this.alertService.mostrarModalCarga();

      const response = await this.aprobacionSCService.aprobarSolicitud(
        this.solicitudSeleccionada.idAprobacion,
        this.usuario.documentoidentidad,
        this.observaciones
      );

      this.alertService.cerrarModalCarga();

      if (response && response.mensaje) {
        this.alertService.showAlert(
          'Éxito',
          response.mensaje,
          'success'
        );

        this.cerrarModalAprobacion();
        await this.cargarSolicitudesPendientes();
        await this.cargarContadores();
      }
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'No se pudo aprobar la solicitud.',
        'error'
      );
    }
  }

  abrirModalRechazo(solicitud: any) {
    this.solicitudSeleccionada = solicitud;
    this.motivoRechazo = '';
    this.modalRechazoAbierto = true;
  }

  cerrarModalRechazo() {
    this.modalRechazoAbierto = false;
    this.solicitudSeleccionada = null;
    this.motivoRechazo = '';
  }

  async confirmarRechazo() {
    if (!this.solicitudSeleccionada) return;

    if (!this.motivoRechazo || this.motivoRechazo.trim() === '') {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el motivo del rechazo.',
        'warning'
      );
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Rechazo',
      `¿Está seguro de rechazar la solicitud ${this.solicitudSeleccionada.numeroSolicitud}?`,
      'warning'
    );

    if (!confirmacion) return;

    try {
      this.alertService.mostrarModalCarga();

      const response = await this.aprobacionSCService.rechazarSolicitud(
        this.solicitudSeleccionada.idAprobacion,
        this.usuario.documentoidentidad,
        this.motivoRechazo
      );

      this.alertService.cerrarModalCarga();

      if (response && response.mensaje) {
        this.alertService.showAlert(
          'Solicitud Rechazada',
          response.mensaje,
          'info'
        );

        this.cerrarModalRechazo();
        await this.cargarSolicitudesPendientes();
        await this.cargarContadores();
      }
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'No se pudo rechazar la solicitud.',
        'error'
      );
    }
  }

  async verHistorial(solicitud: any) {
    try {
      this.alertService.mostrarModalCarga();

      const response = await this.aprobacionSCService.obtenerHistorial(
        solicitud.idSolicitud,
        solicitud.numeroSolicitud
      );

      this.historialAprobaciones = Array.isArray(response) ? response : [];
      this.solicitudSeleccionada = solicitud;
      this.modalHistorialAbierto = true;

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al obtener historial:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'No se pudo obtener el historial de aprobaciones.',
        'error'
      );
    }
  }

  cerrarModalHistorial() {
    this.modalHistorialAbierto = false;
    this.historialAprobaciones = [];
    this.solicitudSeleccionada = null;
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'badge-warning';
      case 'APROBADO': return 'badge-success';
      case 'RECHAZADO': return 'badge-danger';
      case 'CANCELADO': return 'badge-secondary';
      case 'EN_ESPERA': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getPrioridadClass(prioridad: string): string {
    switch (prioridad) {
      case 'URGENTE': return 'badge-danger';
      case 'ATRASADO': return 'badge-warning';
      case 'PENDIENTE': return 'badge-info';
      case 'NORMAL': return 'badge-success';
      default: return 'badge-secondary';
    }
  }

  formatearTiempo(minutos: number): string {
    if (!minutos) return '-';
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  }

  async refrescar() {
    await this.verificarConexionYCargar();
  }
}
