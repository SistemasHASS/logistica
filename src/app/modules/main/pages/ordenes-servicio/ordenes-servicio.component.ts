import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenServicioService } from '@/app/services/orden-servicio.service';
import { SolicitudServicioService } from '@/app/services/solicitud-servicio.service';
import { SeguimientoOSService } from '@/app/services/seguimiento-os.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import {
  Usuario,
  HitoServicio,
  EstadoSeguimientoOS,
  SeguimientoOrdenServicio,
  OrdenServicioConSeguimiento
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-ordenes-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './ordenes-servicio.component.html',
  styleUrls: ['./ordenes-servicio.component.scss'],
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

  constructor(
    private ordenServicioService: OrdenServicioService,
    private solicitudServicioService: SolicitudServicioService,
    private seguimientoOSService: SeguimientoOSService,
    private alertService: AlertService,
    private userService: UserService,
    private dexieService: DexieService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarOrdenes();
    await this.cargarCatalogosDistribucion();
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
      // Cargar gastos
      const gastos = await this.dexieService.showTipoGastos();
      this.gastosData = gastos || [];

      // Cargar labor/centros de costo destino (usar almacenes como referencia)
      const almacenes = await this.dexieService.showAlmacenes();
      this.laborData = almacenes || [];
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
