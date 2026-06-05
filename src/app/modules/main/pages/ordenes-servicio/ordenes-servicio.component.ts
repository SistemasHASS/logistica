import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { OrdenServicioService } from '@/app/services/orden-servicio.service';
import { SolicitudServicioService } from '@/app/services/solicitud-servicio.service';
import { SeguimientoOSService } from '@/app/services/seguimiento-os.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { lastValueFrom } from 'rxjs';
import {
  Usuario,
  HitoServicio,
  EstadoSeguimientoOS,
  SeguimientoOrdenServicio,
  OrdenServicioConSeguimiento
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

export interface FilaOSImport {
  grupoOs: string;
  proveedorCodigo: string;
  nombreProveedor: string;
  rucProveedor: string;
  descripcion: string;
  moneda: string;
  tipoPago: string;
  fechaEntrega: string;
  diasPago: number;
  tipoServicio: string;
  tipoCotizacion: string;
  montoNeto: number;
  montoIgv: number;
  centroCosto: string;
  proyecto: string;
  formaPago: string;
  lineaDetalle: number;
  descripcionDetalle: string;
  montoDetalle: number;
  commodity: string;
  cuentaContable: string;
  ccDestino: string;
  cantidad: number;
  sucursal: string;
  campoReferencia: string;
}

@Component({
  selector: 'app-ordenes-servicio',
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './ordenes-servicio.component.html',
  styleUrls: ['./ordenes-servicio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesServicioComponent implements OnInit {
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

  // ============================================
  // PROPIEDADES DE ÓRDENES
  // ============================================
  ordenesServicio: OrdenServicioConSeguimiento[] = [];
  ordenActual: OrdenServicioConSeguimiento | null = null;

  mostrarFormulario = false;
  mostrarModalConformidad = false;

  // ============================================
  // PROPIEDADES DE SEGUIMIENTO (PASO 4)
  // ============================================
  modalSeguimientoAbierto = false;
  ordenSeguimiento: OrdenServicioConSeguimiento | null = null;
  seguimientoActual: any = null;

  // Distribución contable
  distribucionContable: any[] = [];
  mostrarTabDistribucion = false;
  gastosData: any[] = [];
  laborData: any[] = [];

  // Modal distribución contable
  mostrarModalDistribucion = false;
  distribucionEditIndex: number | null = null;
  distribucionForm: any = {
    cuenta: '',
    descripcion: '',
    centrocosto: '',
    proyecto: '',
    monto: 0,
    fondo: '',
    referencia: '',
    ccdestino: '',
    turno: '',
    cultivo: ''
  };

  // Hitos del seguimiento
  hitosEdicion: HitoServicio[] = [];
  hitoEditando: HitoServicio = this.nuevoHitoVacio();
  mostrarModalHito = false;
  editandoHitoIndex: number = -1;

  // Estados de seguimiento
  estadosSeguimiento: EstadoSeguimientoOS[] = [
    'GENERADA', 'ENVIADA', 'ACEPTADA', 'EN_EJECUCION', 'FINALIZADA', 'RECHAZADA'
  ];

  // Estados de hitos
  estadosHito = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'En Ejecución', value: 'EN_EJECUCION' },
    { label: 'Completado', value: 'COMPLETADO' }
  ];
  
  solicitudesAprobadas: any[] = [];
  cotizacionesDisponibles: any[] = [];

  conformidad: any = {
    numeroConformidad: '',
    ordenServicioId: null,
    fechaInicioReal: '',
    fechaFinReal: '',
    conformidad: 'CONFORME',
    calificacion: 5,
    entregablesRecibidos: '',
    observaciones: '',
    incidencias: '',
    recomendaciones: '',
    usuarioConformidad: '',
    nombreUsuario: '',
    cargoUsuario: '',
  };

  tiposConformidad = [
    { label: 'Conforme', value: 'CONFORME' },
    { label: 'No Conforme', value: 'NO_CONFORME' },
    { label: 'Conforme con Observaciones', value: 'CONFORME_CON_OBSERVACIONES' },
  ];

  // Filtros
  filtroEstado = 'TODAS';
  filtroProveedor = '';
  filtroTipoServicio = '';

  // Lista filtrada
  ordenesFiltradas: OrdenServicioConSeguimiento[] = [];

  // Contadores estadísticos
  totalGeneradas = 0;
  totalEnviadas = 0;
  totalAceptadas = 0;
  totalEnEjecucion = 0;
  totalFinalizadas = 0;

  // Tipo de orden (DIRECTA o DESDE_SOLICITUD)
  tipoOrden: 'DIRECTA' | 'DESDE_SOLICITUD' = 'DESDE_SOLICITUD';

  // ============================================
  // CARGA MASIVA DESDE EXCEL
  // ============================================
  modalCargaMasivaAbierto = false;
  filasImportadas: FilaOSImport[] = [];
  filasConError: { fila: number; error: string }[] = [];
  procesandoCargaMasiva = false;
  resultadoCargaMasiva: { exitosas: number; fallidas: number; detalles: string[] } | null = null;

  constructor(
    private ordenServicioService: OrdenServicioService,
    private solicitudServicioService: SolicitudServicioService,
    private seguimientoOSService: SeguimientoOSService,
    private alertService: AlertService,
    private userService: UserService,
    private dexieService: DexieService,
    private maestrasService: MaestrasService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarOrdenes();
    await this.cargarCatalogosDistribucion(); // usuario ya cargado, ruc disponible
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarOrdenes() {
    try {
      this.alertService.mostrarModalCarga();

      const ordenes = await this.ordenServicioService
        .listarOrdenesServicio({})
        .toPromise();

      this.ordenesServicio = ordenes || [];
      this.ordenesFiltradas = [...this.ordenesServicio];
      this.actualizarContadores();
      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar órdenes de servicio', 'error');
    }
  }

  /**
   * Filtra las órdenes según los criterios seleccionados
   */
  filtrarOrdenes(): void {
    this.ordenesFiltradas = this.ordenesServicio.filter(orden => {
      const cumpleEstado = this.filtroEstado === 'TODAS' || orden.estado === this.filtroEstado;
      const cumpleProveedor = !this.filtroProveedor || 
        (orden.nombreProveedor?.toLowerCase().includes(this.filtroProveedor.toLowerCase()) ||
         orden.rucProveedor?.includes(this.filtroProveedor));
      const cumpleTipo = !this.filtroTipoServicio || 
        orden.tipoServicio?.toLowerCase().includes(this.filtroTipoServicio.toLowerCase());
      
      return cumpleEstado && cumpleProveedor && cumpleTipo;
    });
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroEstado = 'TODAS';
    this.filtroProveedor = '';
    this.filtroTipoServicio = '';
    this.ordenesFiltradas = [...this.ordenesServicio];
  }

  /**
   * Actualiza los contadores estadísticos
   */
  actualizarContadores(): void {
    this.totalGeneradas = this.ordenesServicio.filter(o => o.estado === 'GENERADA').length;
    this.totalEnviadas = this.ordenesServicio.filter(o => o.estado === 'ENVIADA').length;
    this.totalAceptadas = this.ordenesServicio.filter(o => o.estado === 'ACEPTADA').length;
    this.totalEnEjecucion = this.ordenesServicio.filter(o => o.estado === 'EN_EJECUCION').length;
    this.totalFinalizadas = this.ordenesServicio.filter(o => o.estado === 'FINALIZADA').length;
  }

  async cargarCatalogosDistribucion() {
    try {
      // Cargar gastos: desde Dexie o API si está vacío
      let gastos = await this.dexieService.showTipoGastos();
      if (!gastos || gastos.length === 0) {
        try {
          const resp = await lastValueFrom(this.maestrasService.getTipoGastos([{}]));
          if (resp && resp.length) {
            await this.dexieService.saveTipoGastos(resp);
            gastos = await this.dexieService.showTipoGastos();
          }
        } catch { /* sin conexión, continuar */ }
      }
      this.gastosData = gastos || [];

      // Cargar labores: desde Dexie o API si está vacío
      let labores = await this.dexieService.showLabores();
      if (!labores || labores.length === 0) {
        try {
          const resp = await this.maestrasService.getLabores([{ aplicacion: 'LOGISTICA', esadmin: 0 }]);
          if (resp && resp.length) {
            await this.dexieService.saveLabores(resp);
            labores = await this.dexieService.showLabores();
          }
        } catch { /* sin conexión, continuar */ }
      }
      this.laborData = labores || [];
    } catch (error) {
      console.error('Error al cargar catálogos de distribución:', error);
    }
  }

  async generarDistribucionContable() {
    try {
      this.distribucionContable = [];
      const distribucionesMap = new Map<string, any>();

      // Para OS, la distribución se basa en el tipo de servicio y centro de costo
      if (this.ordenActual) {
        const cuentaKey = `${this.ordenActual.tipoServicio}-${this.ordenActual.centroCosto || ''}-${this.ordenActual.proyecto || ''}`;
        const monto = this.ordenActual.montoTotal || 0;

        distribucionesMap.set(cuentaKey, {
          id: `DIST-${cuentaKey}`,
          cuenta: this.ordenActual.tipoServicio || '',
          descripcion: this.ordenActual.descripcion || '',
          centroCosto: this.ordenActual.centroCosto || '',
          proyecto: this.ordenActual.proyecto || '',
          monto: monto,
          referencia: '',
          ccDestino: ''
        });
      }

      this.distribucionContable = Array.from(distribucionesMap.values());
    } catch (error) {
      console.error('Error al generar distribución contable:', error);
    }
  }

  // ============================================
  // MÉTODOS DE MODAL DISTRIBUCIÓN CONTABLE
  // ============================================
  abrirModalDistribucion() {
    this.distribucionEditIndex = null;
    this.distribucionForm = {
      cuenta: '',
      descripcion: '',
      centrocosto: '',
      proyecto: '',
      monto: 0,
      fondo: '',
      referencia: '',
      ccdestino: '',
      turno: '',
      cultivo: ''
    };
    this.mostrarModalDistribucion = true;
  }

  editarDistribucion(index: number) {
    this.distribucionEditIndex = index;
    const item = this.distribucionContable[index];
    this.distribucionForm = { ...item };
    this.mostrarModalDistribucion = true;
  }

  guardarDistribucion() {
    if (!this.distribucionForm.cuenta || !this.distribucionForm.monto) {
      return;
    }
    const item = {
      ...this.distribucionForm,
      id: this.distribucionEditIndex !== null
        ? this.distribucionContable[this.distribucionEditIndex].id
        : `DIST-${Date.now()}`
    };
    if (this.distribucionEditIndex !== null) {
      this.distribucionContable[this.distribucionEditIndex] = item;
    } else {
      this.distribucionContable = [...this.distribucionContable, item];
    }
    this.cerrarModalDistribucion();
  }

  eliminarDistribucion(index: number) {
    this.distribucionContable = this.distribucionContable.filter((_, i) => i !== index);
  }

  cerrarModalDistribucion() {
    this.mostrarModalDistribucion = false;
    this.distribucionEditIndex = null;
  }

  getTotalDistribucion(): number {
    return this.distribucionContable.reduce((sum, item) => sum + (item.monto || 0), 0);
  }

  async nuevaOrdenServicio() {
    this.tipoOrden = 'DESDE_SOLICITUD';
    this.mostrarTabDistribucion = false;
    try {
      this.alertService.mostrarModalCarga();

      // Cargar solicitudes aprobadas
      const solicitudes = await this.solicitudServicioService
        .listarSolicitudesServicio({ estado: 'APROBADA' })
        .toPromise();

      this.solicitudesAprobadas = solicitudes || [];

      if (this.solicitudesAprobadas.length === 0) {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert(
          'Atención',
          'No hay solicitudes de servicio aprobadas disponibles. Use "Orden Directa" si necesita crear una orden sin solicitud previa.',
          'warning'
        );
        return;
      }

      this.alertService.cerrarModalCarga();
      this.mostrarFormulario = true;
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar solicitudes aprobadas', 'error');
    }
  }

  nuevaOrdenServicioDirecta() {
    this.tipoOrden = 'DIRECTA';
    this.mostrarTabDistribucion = false;
    this.ordenActual = {
      numeroOrden: this.generarNumeroOrden(),
      solicitudServicioId: 0,
      tipoServicio: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      rucProveedor: '',
      proveedor: '',
      nombreProveedor: '',
      contactoProveedor: '',
      telefonoProveedor: '',
      emailProveedor: '',
      fechaInicioServicio: '',
      fechaFinServicio: '',
      plazoEjecucion: 0,
      montoTotal: 0,
      moneda: 'PEN',
      formaPago: 'CONTADO',
      condicionesPago: '',
      garantia: '',
      penalidades: '',
      estado: 'GENERADA',
      usuarioGenera: this.usuario.documentoidentidad || '',
      porcentajeCompletado: 0,
      hitos: []
    };
    this.cotizacionesDisponibles = [];
    this.solicitudesAprobadas = [];
    this.mostrarFormulario = true;
    this.distribucionContable = [];
  }

  async seleccionarSolicitud(solicitudId: number) {
    try {
      this.alertService.mostrarModalCarga();

      const solicitud = await this.solicitudServicioService
        .obtenerSolicitudServicioPorId(solicitudId)
        .toPromise();

      if (solicitud) {
        // Cargar cotizaciones de esta solicitud
        const cotizaciones = await this.solicitudServicioService
          .listarCotizacionesServicio({ solicitudServicioId: solicitudId })
          .toPromise();

        this.cotizacionesDisponibles = cotizaciones || [];

        // Crear orden desde solicitud
        this.ordenActual = {
          numeroOrden: this.generarNumeroOrden(),
          solicitudServicioId: solicitud.id,
          cotizacionServicioId: undefined,
          fecha: new Date().toISOString().split('T')[0],
          estado: 'GENERADA',
          tipoServicio: solicitud.tipoServicio,
          descripcion: solicitud.descripcion,
          alcance: solicitud.alcance,
          entregables: solicitud.entregables,
          proveedor: '',
          nombreProveedor: '',
          rucProveedor: '',
          contactoProveedor: '',
          telefonoProveedor: '',
          emailProveedor: '',
          fechaInicioServicio: solicitud.fechaInicioRequerida || '',
          fechaFinServicio: solicitud.fechaFinRequerida || '',
          plazoEjecucion: solicitud.plazoEjecucion,
          ubicacionServicio: solicitud.ubicacionServicio,
          montoTotal: solicitud.montoEstimado,
          moneda: solicitud.moneda,
          formaPago: '',
          condicionesPago: '',
          garantia: '',
          penalidades: '',
          centroCosto: solicitud.centroCosto,
          proyecto: solicitud.proyecto,
          observaciones: '',
          usuarioGenera: this.usuario.documentoidentidad,
          detalle: solicitud.detalle ? JSON.parse(solicitud.detalle) : [],
        };

        // Generar distribución contable
        await this.generarDistribucionContable();
      }

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar solicitud', 'error');
    }
  }

  async seleccionarCotizacion(cotizacionId: number) {
    try {
      const cotizacion = this.cotizacionesDisponibles.find(c => c.id === cotizacionId);
      
      if (cotizacion && this.ordenActual) {
        this.ordenActual.cotizacionServicioId = cotizacion.id;
        this.ordenActual.proveedor = cotizacion.proveedor;
        this.ordenActual.nombreProveedor = cotizacion.nombreProveedor;
        this.ordenActual.rucProveedor = cotizacion.rucProveedor;
        this.ordenActual.contactoProveedor = cotizacion.contactoProveedor;
        this.ordenActual.telefonoProveedor = cotizacion.telefonoProveedor;
        this.ordenActual.emailProveedor = cotizacion.emailProveedor;
        this.ordenActual.montoTotal = cotizacion.montoTotal;
        this.ordenActual.formaPago = cotizacion.formaPago;
        this.ordenActual.plazoEjecucion = cotizacion.plazoEjecucion;
        this.ordenActual.garantia = cotizacion.garantia;
        this.ordenActual.penalidades = cotizacion.penalidades;

        // Generar distribución contable
        await this.generarDistribucionContable();
      }
    } catch (error) {
      console.error('Error al seleccionar cotización:', error);
    }
  }

  generarNumeroOrden(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const segundo = String(fecha.getSeconds()).padStart(2, '0');
    return `OS-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
  }

  async guardarOrden() {
    if (!this.validarOrden()) {
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.ordenServicioService
        .generarOrdenServicio(this.ordenActual)
        .toPromise();

      if (respuesta?.status === 'success' && this.ordenActual) {
        // Asignar aprobadores automáticamente
        try {
          await this.ordenServicioService
            .asignarAprobadoresOS(respuesta.id, this.ordenActual.montoTotal)
            .toPromise();
        } catch (error) {
          console.warn('Error al asignar aprobadores:', error);
        }

        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Éxito', respuesta.mensaje, 'success');
        this.mostrarFormulario = false;
        this.ordenActual = null;
        await this.cargarOrdenes();
      } else {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al guardar', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al guardar orden', 'error');
    }
  }

  validarOrden(): boolean {
    if (!this.ordenActual) {
      this.alertService.showAlert('Atención', 'No hay orden en proceso', 'warning');
      return false;
    }

    // Validaciones específicas para orden directa
    if (this.tipoOrden === 'DIRECTA') {
      if (!this.ordenActual.tipoServicio) {
        this.alertService.showAlert('Atención', 'Debe ingresar el tipo de servicio', 'warning');
        return false;
      }

      if (!this.ordenActual.descripcion) {
        this.alertService.showAlert('Atención', 'Debe ingresar la descripción del servicio', 'warning');
        return false;
      }
    }

    if (!this.ordenActual.proveedor) {
      this.alertService.showAlert('Atención', 'Debe ingresar el proveedor', 'warning');
      return false;
    }

    if (!this.ordenActual.nombreProveedor) {
      this.alertService.showAlert('Atención', 'Debe ingresar el nombre del proveedor', 'warning');
      return false;
    }

    if (!this.ordenActual.formaPago) {
      this.alertService.showAlert('Atención', 'Debe ingresar la forma de pago', 'warning');
      return false;
    }

    return true;
  }

  async verDetalleOrden(orden: any) {
    try {
      this.alertService.mostrarModalCarga();

      const ordenCompleta = await this.ordenServicioService
        .obtenerOrdenServicioPorId(orden.id)
        .toPromise();

      if (ordenCompleta) {
        this.ordenActual = ordenCompleta;
        // Mostrar modal de detalle (implementar según necesidad)
      }

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar orden:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar orden', 'error');
    }
  }

  abrirModalConformidad(orden: any) {
    this.conformidad = {
      numeroConformidad: this.generarNumeroConformidad(),
      ordenServicioId: orden.id,
      fechaInicioReal: '',
      fechaFinReal: '',
      conformidad: 'CONFORME',
      calificacion: 5,
      entregablesRecibidos: '',
      observaciones: '',
      incidencias: '',
      recomendaciones: '',
      usuarioConformidad: this.usuario.documentoidentidad,
      nombreUsuario: this.usuario.nombre,
      cargoUsuario: this.usuario.rol,
    };
    this.mostrarModalConformidad = true;
  }

  generarNumeroConformidad(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    return `CONF-${año}${mes}${dia}-${hora}${minuto}`;
  }

  async guardarConformidad() {
    if (!this.conformidad.fechaInicioReal || !this.conformidad.fechaFinReal) {
      this.alertService.showAlert('Atención', 'Debe ingresar las fechas de ejecución', 'warning');
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.ordenServicioService
        .registrarConformidadServicio(this.conformidad)
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert('Éxito', respuesta.mensaje, 'success');
        this.mostrarModalConformidad = false;
        await this.cargarOrdenes();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al registrar', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al registrar conformidad', 'error');
    }
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.ordenActual = null;
    this.solicitudesAprobadas = [];
    this.cotizacionesDisponibles = [];
    this.tipoOrden = 'DESDE_SOLICITUD';
  }

  cerrarModalConformidad() {
    this.mostrarModalConformidad = false;
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);
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

  obtenerClaseEstado(estado: string): string {
    return this.seguimientoOSService.obtenerColorEstado(estado as EstadoSeguimientoOS);
  }

  // ============================================
  // MÉTODOS DE SEGUIMIENTO (PASO 4 COMPLETO)
  // ============================================

  /**
   * Inicializa un hito vacío para edición
   */
  nuevoHitoVacio(): HitoServicio {
    return {
      descripcion: '',
      estado: 'PENDIENTE',
      porcentajeAvance: 0,
      fechaInicio: '',
      fechaFin: '',
      observaciones: '',
      responsable: ''
    };
  }

  /**
   * Abre el modal de seguimiento para una orden
   */
  async verSeguimiento(orden: OrdenServicioConSeguimiento) {
    this.ordenSeguimiento = orden;
    this.hitosEdicion = orden.hitos || [];
    this.modalSeguimientoAbierto = true;

    // Cargar seguimiento desde el backend si existe
    if (orden.id) {
      try {
        const respuesta = await this.seguimientoOSService
          .obtenerSeguimiento(orden.id)
          .toPromise();

        if (respuesta?.error === 0 && respuesta.data) {
          this.seguimientoActual = respuesta.data;
          // Actualizar hitos con los del backend
          if (respuesta.data.hitos) {
            this.hitosEdicion = respuesta.data.hitos;
            orden.hitos = respuesta.data.hitos;
            orden.porcentajeCompletado = respuesta.data.porcentajeAvance;
          }
        }
      } catch (error) {
        console.warn('No se pudo cargar seguimiento del backend:', error);
      }
    }
  }

  /**
   * Cierra el modal de seguimiento
   */
  cerrarModalSeguimiento() {
    this.modalSeguimientoAbierto = false;
    this.ordenSeguimiento = null;
    this.seguimientoActual = null;
    this.hitosEdicion = [];
  }

  /**
   * Calcula el porcentaje total basado en los hitos
   */
  calcularPorcentajeTotal(): number {
    return this.seguimientoOSService.calcularPorcentajeAvance(this.hitosEdicion);
  }

  /**
   * Avanza al siguiente estado en el flujo
   */
  async avanzarEstado() {
    if (!this.ordenSeguimiento?.id) return;

    const estadoActual = this.ordenSeguimiento.estado;
    const siguienteEstado = this.seguimientoOSService.obtenerSiguienteEstado(estadoActual);

    if (!siguienteEstado) {
      this.alertService.showAlert('Atención', 'No hay siguiente estado disponible', 'warning');
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Avance',
      `¿Marcar orden como "${this.seguimientoOSService.obtenerTextoEstado(siguienteEstado)}"?`,
      'info'
    );

    if (!confirmacion) return;

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.seguimientoOSService
        .actualizarSeguimiento({
          idOrdenServicio: this.ordenSeguimiento.id,
          nuevoEstado: siguienteEstado,
          hitos: this.hitosEdicion,
          observaciones: `Estado cambiado de ${estadoActual} a ${siguienteEstado}`
        })
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.error === 0) {
        this.ordenSeguimiento.estado = siguienteEstado;
        this.ordenSeguimiento.porcentajeCompletado = respuesta?.porcentajeAvance || this.calcularPorcentajeTotal();
        this.alertService.showAlert('Éxito', `Orden marcada como ${siguienteEstado}`, 'success');
        await this.cargarOrdenes();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al actualizar', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al avanzar estado', 'error');
    }
  }

  /**
   * Abre el modal para agregar/editar hito
   */
  abrirModalHito(index?: number) {
    if (index !== undefined && this.hitosEdicion[index]) {
      // Editar hito existente
      this.hitoEditando = { ...this.hitosEdicion[index] };
      this.editandoHitoIndex = index;
    } else {
      // Nuevo hito
      this.hitoEditando = this.nuevoHitoVacio();
      this.editandoHitoIndex = -1;
    }
    this.mostrarModalHito = true;
  }

  /**
   * Cierra el modal de hito
   */
  cerrarModalHito() {
    this.mostrarModalHito = false;
    this.hitoEditando = this.nuevoHitoVacio();
    this.editandoHitoIndex = -1;
  }

  /**
   * Guarda el hito (nuevo o editado)
   */
  guardarHito() {
    if (!this.hitoEditando.descripcion) {
      this.alertService.showAlert('Atención', 'Debe ingresar una descripción', 'warning');
      return;
    }

    if (this.editandoHitoIndex >= 0) {
      // Actualizar hito existente
      this.hitosEdicion[this.editandoHitoIndex] = { ...this.hitoEditando };
    } else {
      // Agregar nuevo hito
      this.hitosEdicion.push({ ...this.hitoEditando });
    }

    // Actualizar porcentaje en la orden
    if (this.ordenSeguimiento) {
      this.ordenSeguimiento.hitos = [...this.hitosEdicion];
      this.ordenSeguimiento.porcentajeCompletado = this.calcularPorcentajeTotal();
    }

    this.cerrarModalHito();
  }

  /**
   * Elimina un hito del listado
   */
  async eliminarHito(index: number) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Eliminación',
      '¿Eliminar este hito?',
      'warning'
    );

    if (confirmacion) {
      this.hitosEdicion.splice(index, 1);
      if (this.ordenSeguimiento) {
        this.ordenSeguimiento.hitos = [...this.hitosEdicion];
        this.ordenSeguimiento.porcentajeCompletado = this.calcularPorcentajeTotal();
      }
    }
  }

  /**
   * Sincroniza los hitos con el backend
   */
  async sincronizarHitos() {
    if (!this.ordenSeguimiento?.id) return;

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.seguimientoOSService
        .actualizarSeguimiento({
          idOrdenServicio: this.ordenSeguimiento.id,
          nuevoEstado: this.ordenSeguimiento.estado,
          hitos: this.hitosEdicion
        })
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.error === 0) {
        this.ordenSeguimiento.porcentajeCompletado = respuesta?.porcentajeAvance || this.calcularPorcentajeTotal();
        this.alertService.showAlert('Éxito', 'Hitos sincronizados correctamente', 'success');
        await this.cargarOrdenes();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al sincronizar', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al sincronizar hitos', 'error');
    }
  }

  /**
   * Verifica si se puede avanzar al siguiente estado
   */
  puedeAvanzar(): boolean {
    if (!this.ordenSeguimiento) return false;
    return this.seguimientoOSService.obtenerSiguienteEstado(this.ordenSeguimiento.estado) !== null;
  }

  /**
   * Obtiene el texto del siguiente estado
   */
  obtenerTextoSiguienteEstado(): string {
    if (!this.ordenSeguimiento) return '';
    const siguiente = this.seguimientoOSService.obtenerSiguienteEstado(this.ordenSeguimiento.estado);
    return siguiente ? this.seguimientoOSService.obtenerTextoEstado(siguiente) : '';
  }

  /**
   * Obtiene el estado de un hito en formato legible
   */
  obtenerTextoEstadoHito(estado: string): string {
    const estadoEncontrado = this.estadosHito.find(e => e.value === estado);
    return estadoEncontrado?.label || estado;
  }

  /**
   * Actualiza el porcentaje de un hito cuando cambia su estado
   */
  onEstadoHitoChange(hito: HitoServicio) {
    switch (hito.estado) {
      case 'COMPLETADO':
        hito.porcentajeAvance = 100;
        hito.fechaFin = new Date().toISOString().split('T')[0];
        break;
      case 'PENDIENTE':
        hito.porcentajeAvance = 0;
        break;
      case 'EN_EJECUCION':
        if (hito.porcentajeAvance === 0 || hito.porcentajeAvance === 100) {
          hito.porcentajeAvance = 25;
        }
        hito.fechaInicio = hito.fechaInicio || new Date().toISOString().split('T')[0];
        break;
    }

    // Recalcular porcentaje total
    if (this.ordenSeguimiento) {
      this.ordenSeguimiento.porcentajeCompletado = this.calcularPorcentajeTotal();
    }
  }

  /**
   * Verifica si la orden está finalizada
   */
  isOrdenFinalizada(): boolean {
    return this.ordenSeguimiento?.estado === 'FINALIZADA' ||
           this.ordenSeguimiento?.estado === 'RECHAZADA';
  }

  /**
   * Verifica si un estado del timeline está completado
   * basado en el estado actual de la orden
   */
  esEstadoCompletado(estado: EstadoSeguimientoOS): boolean {
    if (!this.ordenSeguimiento) return false;

    const ordenEstados: EstadoSeguimientoOS[] = ['GENERADA', 'ENVIADA', 'ACEPTADA', 'EN_EJECUCION', 'FINALIZADA'];
    const estadoActualIndex = ordenEstados.indexOf(this.ordenSeguimiento.estado);
    const estadoVerificarIndex = ordenEstados.indexOf(estado);

    return estadoVerificarIndex < estadoActualIndex ||
           (this.ordenSeguimiento.estado === estado && estado !== 'FINALIZADA');
  }

  /**
   * Obtiene la fecha de transición para un estado
   */
  obtenerFechaEstado(estado: EstadoSeguimientoOS): string {
    if (!this.ordenSeguimiento) return '';

    const fecha = this.seguimientoActual &&
      (this.seguimientoActual as any)[`fecha${this.capitalizarEstado(estado)}`];

    return fecha ? this.formatearFecha(fecha) : '';
  }

  /**
   * Capitaliza el nombre del estado para obtener la propiedad de fecha
   */
  private capitalizarEstado(estado: string): string {
    return estado.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
  }

  /**
   * Obtiene el texto descriptivo de un estado
   * Wrapper para el servicio
   */
  obtenerTextoEstado(estado: EstadoSeguimientoOS | string): string {
    return this.seguimientoOSService.obtenerTextoEstado(estado as EstadoSeguimientoOS);
  }

  // ============================================
  // MÉTODOS DE CARGA MASIVA EXCEL
  // ============================================

  /**
   * Descarga la plantilla Excel para carga masiva de OS
   */
  descargarPlantillaOSMasivo(): void {
    const wb = XLSX.utils.book_new();

    const encabezados = [
      'GRUPO_OS', 'PROVEEDOR_CODIGO', 'NOMBRE_PROVEEDOR', 'RUC_PROVEEDOR',
      'DESCRIPCION_OS', 'MONEDA', 'TIPO_PAGO', 'FECHA_ENTREGA', 'DIAS_PAGO',
      'TIPO_SERVICIO', 'TIPO_COTIZACION', 'MONTO_NETO', 'MONTO_IGV',
      'CENTRO_COSTO', 'PROYECTO', 'FORMA_PAGO',
      'LINEA_DETALLE', 'DESCRIPCION_DETALLE', 'MONTO_DETALLE',
      'COMMODITY', 'CUENTA_CONTABLE', 'CC_DESTINO', 'CANTIDAD',
      'SUCURSAL', 'CAMPO_REFERENCIA'
    ];

    const ejemplo = [
      'OS-001', '10', 'PROVEEDOR EJEMPLO S.A.C.', '20123456789',
      'CONTRATOS ADMIN', 'LO', 'TB', '2026-05-15', 0,
      '0702', '01', 80.00, 14.40,
      '10010', 'ARANDANO 26', 'CONTADO',
      1, 'CONTRATOS PERSONAL OFICINA', 80.00,
      '0702', '13213002', '4502', 1.00,
      '0801', 'GA'
    ];

    const instrucciones = [
      ['INSTRUCCIONES DE USO'],
      [''],
      ['1. Cada fila representa UNA línea de detalle de una OS.'],
      ['2. Para crear una OS con múltiples detalles, use el mismo GRUPO_OS en varias filas.'],
      ['3. Los campos de cabecera (GRUPO_OS hasta FORMA_PAGO) se toman de la primera fila del grupo.'],
      ['4. MONEDA: LO=Soles, DO=Dólares'],
      ['5. TIPO_PAGO: TB=Transferencia Bancaria, EF=Efectivo'],
      ['6. MONTO_NETO: sin IGV. MONTO_IGV: importe del impuesto.'],
      ['7. FECHA_ENTREGA: formato YYYY-MM-DD'],
      ['8. El sistema creará la OS y la enviará a SPRING automáticamente.'],
    ];

    const wsData = [encabezados, ejemplo];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = encabezados.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, 'OS_MASIVO');

    const wsInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
    wsInstrucciones['!cols'] = [{ wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'INSTRUCCIONES');

    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbOut], { type: 'application/octet-stream' }), 'plantilla_os_masivo.xlsx');
  }

  /**
   * Maneja la selección del archivo Excel y parsea las filas
   */
  onArchivoExcelSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    input.value = '';

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const ws = wb.Sheets['OS_MASIVO'] || wb.Sheets[wb.SheetNames[0]];
        const filas: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (filas.length < 2) {
          this.alertService.showAlert('Error', 'El archivo no contiene datos (mínimo 1 fila de datos más encabezado).', 'error');
          return;
        }

        this.filasImportadas = [];
        this.filasConError = [];

        for (let i = 1; i < filas.length; i++) {
          const f = filas[i];
          if (!f[0] && !f[4]) continue;

          const grupoOs = String(f[0] || '').trim();
          if (!grupoOs) {
            this.filasConError.push({ fila: i + 1, error: 'GRUPO_OS es obligatorio' });
            continue;
          }

          const montoNeto = parseFloat(String(f[11] || '0').replace(',', '.')) || 0;
          const montoIgv = parseFloat(String(f[12] || '0').replace(',', '.')) || 0;

          const fila: FilaOSImport = {
            grupoOs,
            proveedorCodigo: String(f[1] || '').trim(),
            nombreProveedor: String(f[2] || '').trim(),
            rucProveedor: String(f[3] || '').trim(),
            descripcion: String(f[4] || '').trim(),
            moneda: String(f[5] || 'LO').trim(),
            tipoPago: String(f[6] || 'TB').trim(),
            fechaEntrega: this.parsearFechaExcel(f[7]),
            diasPago: parseInt(String(f[8] || '0'), 10) || 0,
            tipoServicio: String(f[9] || '').trim(),
            tipoCotizacion: String(f[10] || '01').trim(),
            montoNeto,
            montoIgv,
            centroCosto: String(f[13] || '').trim(),
            proyecto: String(f[14] || '').trim(),
            formaPago: String(f[15] || 'CONTADO').trim(),
            lineaDetalle: parseInt(String(f[16] || '1'), 10) || 1,
            descripcionDetalle: String(f[17] || '').trim(),
            montoDetalle: parseFloat(String(f[18] || '0').replace(',', '.')) || 0,
            commodity: String(f[19] || '').trim(),
            cuentaContable: String(f[20] || '').trim(),
            ccDestino: String(f[21] || '').trim(),
            cantidad: parseFloat(String(f[22] || '1').replace(',', '.')) || 1,
            sucursal: String(f[23] || '').trim(),
            campoReferencia: String(f[24] || '').trim(),
          };

          if (!fila.descripcion) {
            this.filasConError.push({ fila: i + 1, error: 'DESCRIPCION_OS es obligatoria' });
            continue;
          }

          this.filasImportadas.push(fila);
        }

        if (this.filasImportadas.length === 0 && this.filasConError.length > 0) {
          this.alertService.showAlert('Error', 'Ninguna fila válida encontrada. Revise los errores.', 'error');
          return;
        }

        this.resultadoCargaMasiva = null;
        this.modalCargaMasivaAbierto = true;
        this.cdr.markForCheck();
      } catch (err) {
        console.error('Error al parsear Excel:', err);
        this.alertService.showAlert('Error', 'No se pudo leer el archivo Excel. Verifique el formato.', 'error');
      }
    };
    reader.readAsArrayBuffer(archivo);
  }

  private parsearFechaExcel(valor: unknown): string {
    if (!valor) return new Date().toISOString().split('T')[0];
    if (valor instanceof Date) return valor.toISOString().split('T')[0];
    const str = String(valor).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
    const partes = str.split('/');
    if (partes.length === 3) {
      const [d, m, y] = partes;
      return `${y.padStart(4,'0')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Agrupa las filas importadas por GRUPO_OS y devuelve payloads de OS
   */
  agruparFilasPorOS(): Map<string, { cabecera: FilaOSImport; detalles: FilaOSImport[] }> {
    const mapa = new Map<string, { cabecera: FilaOSImport; detalles: FilaOSImport[] }>();
    for (const fila of this.filasImportadas) {
      if (!mapa.has(fila.grupoOs)) {
        mapa.set(fila.grupoOs, { cabecera: fila, detalles: [] });
      }
      mapa.get(fila.grupoOs)!.detalles.push(fila);
    }
    return mapa;
  }

  get gruposOSAgrupados(): { grupoOs: string; cabecera: FilaOSImport; detalles: FilaOSImport[]; montoTotal: number }[] {
    const grupos: { grupoOs: string; cabecera: FilaOSImport; detalles: FilaOSImport[]; montoTotal: number }[] = [];
    this.agruparFilasPorOS().forEach((val, key) => {
      const montoTotal = val.cabecera.montoNeto + val.cabecera.montoIgv;
      grupos.push({ grupoOs: key, cabecera: val.cabecera, detalles: val.detalles, montoTotal });
    });
    return grupos;
  }

  cerrarModalCargaMasiva(): void {
    if (this.procesandoCargaMasiva) return;
    this.modalCargaMasivaAbierto = false;
    this.filasImportadas = [];
    this.filasConError = [];
    this.resultadoCargaMasiva = null;
  }

  /**
   * Procesa la carga masiva: crea una OS por cada grupo y la sincroniza con SPRING
   */
  async procesarCargaMasivaOS(): Promise<void> {
    const grupos = this.agruparFilasPorOS();
    if (grupos.size === 0) return;

    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Carga Masiva',
      `Se crearán y enviarán a SPRING <strong>${grupos.size} Orden(es) de Servicio</strong>. ¿Desea continuar?`,
      'info'
    );
    if (!confirmacion) return;

    this.procesandoCargaMasiva = true;
    const detalles: string[] = [];
    let exitosas = 0;
    let fallidas = 0;

    for (const [grupoOs, { cabecera, detalles: lineas }] of grupos) {
      try {
        const montoTotal = cabecera.montoNeto + cabecera.montoIgv;

        const detalleOS = lineas.map(l => ({
          lineaDetalle: l.lineaDetalle,
          descripcion: l.descripcionDetalle || cabecera.descripcion,
          montoTotal: l.montoDetalle,
          commodity: l.commodity,
          cuentaContable: l.cuentaContable,
          centroCosto: l.centroCosto || cabecera.centroCosto,
          ccDestino: l.ccDestino,
          proyecto: l.proyecto || cabecera.proyecto,
          cantidad: l.cantidad,
          sucursal: l.sucursal,
          campoReferencia: l.campoReferencia,
          precioUnitario: l.cantidad > 0 ? l.montoDetalle / l.cantidad : l.montoDetalle,
        }));

        const payloadOS = {
          tipoServicio: cabecera.tipoServicio,
          descripcion: cabecera.descripcion,
          proveedor: cabecera.proveedorCodigo,
          nombreProveedor: cabecera.nombreProveedor,
          rucProveedor: cabecera.rucProveedor,
          montoTotal,
          moneda: cabecera.moneda,
          formaPago: cabecera.formaPago,
          fechaInicioServicio: new Date().toISOString().split('T')[0],
          fechaFinServicio: cabecera.fechaEntrega,
          plazoEjecucion: cabecera.diasPago,
          centroCosto: cabecera.centroCosto,
          proyecto: cabecera.proyecto,
          estado: 'GENERADA' as const,
          usuarioGenera: this.usuario.documentoidentidad || '',
          detalle: detalleOS,
        };

        const respOS = await this.ordenServicioService.generarOrdenServicio(payloadOS).toPromise();

        if (respOS?.status !== 'success') {
          fallidas++;
          detalles.push(`${grupoOs}: ERROR al crear OS — ${respOS?.mensaje || 'Error desconocido'}`);
          continue;
        }

        const idOS = respOS.id;

        const payloadSpring = {
          idordenservicio: idOS,
          idempresa: this.usuario.idempresa,
          ruc: this.usuario.ruc,
          serie: 'APSO',
          rucproveedor: cabecera.rucProveedor,
          moneda: cabecera.moneda,
          tiposervicio: cabecera.tipoServicio,
          descripcion: cabecera.descripcion,
          fechainicioservicio: new Date().toISOString().split('T')[0],
          fechafinservicio: cabecera.fechaEntrega,
          plazoejecucion: cabecera.diasPago,
          montototal: cabecera.montoNeto,
          montoigv: cabecera.montoIgv,
          formapago: cabecera.formaPago,
          centrocosto: cabecera.centroCosto,
          proyecto: cabecera.proyecto,
          usuariogenera: this.usuario.documentoidentidad,
          tipopago: cabecera.tipoPago,
          tipocotizacion: cabecera.tipoCotizacion,
          detalle: detalleOS,
        };

        const respSpring = await this.ordenServicioService.sincronizarOrdenServicio(payloadSpring).toPromise();

        if (respSpring?.errorgeneral === 0) {
          exitosas++;
          detalles.push(`${grupoOs}: OK — N° SPRING: ${respSpring.numeroOrden || ''}`);
        } else {
          fallidas++;
          detalles.push(`${grupoOs}: OS creada (id=${idOS}) pero ERROR en SPRING — ${respSpring?.mensaje || 'Error desconocido'}`);
        }
      } catch (err: any) {
        fallidas++;
        detalles.push(`${grupoOs}: EXCEPCIÓN — ${err?.message || String(err)}`);
      }
    }

    this.resultadoCargaMasiva = { exitosas, fallidas, detalles };
    this.procesandoCargaMasiva = false;
    this.cdr.markForCheck();

    await this.cargarOrdenes();
  }

  /**
   * Sincroniza la Orden de Servicio con SPRING (ERP)
   */
  async sincronizarOrdenServicio(orden: OrdenServicioConSeguimiento) {
    const confirmacion = await this.alertService.showConfirm(
      'Enviar a SPRING',
      `¿Desea enviar la orden <strong>${orden.numeroOrden}</strong> al sistema SPRING?`,
      'info'
    );
    if (!confirmacion) return;

    try {
      this.alertService.mostrarModalCarga();

      const payload = {
        idordenservicio: orden.id,
        idempresa: this.usuario.idempresa,
        ruc: this.usuario.ruc,
        serie: 'OS',
        rucproveedor: orden.rucProveedor,
        moneda: orden.moneda || 'PEN',
        tiposervicio: orden.tipoServicio,
        descripcion: orden.descripcion,
        fechainicioservicio: orden.fechaInicioServicio,
        fechafinservicio: orden.fechaFinServicio,
        plazoejecucion: orden.plazoEjecucion,
        montototal: orden.montoTotal,
        montoigv: 0,
        formapago: orden.formaPago || 'CONTADO',
        observaciones: orden.observaciones,
        centrocosto: orden.centroCosto,
        proyecto: orden.proyecto,
        usuariogenera: this.usuario.documentoidentidad,
        detalle: orden.detalle || []
      };

      const respuesta = await this.ordenServicioService
        .sincronizarOrdenServicio(payload)
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.errorgeneral === 0) {
        this.alertService.showAlert(
          'Sincronizado',
          `Orden enviada a SPRING correctamente. N° SPRING: <strong>${respuesta.numeroOrden}</strong>`,
          'success'
        );
        await this.cargarOrdenes();
      } else {
        this.alertService.showAlert(
          'Error',
          respuesta?.mensaje || 'Error al sincronizar con SPRING',
          'error'
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al conectar con SPRING', 'error');
    }
  }
}
