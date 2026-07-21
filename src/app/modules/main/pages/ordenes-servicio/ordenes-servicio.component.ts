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
import { CommodityService } from '@/app/modules/main/services/commoditys.service';
import { lastValueFrom } from 'rxjs';
import {
  Usuario,
  HitoServicio,
  EstadoSeguimientoOS,
  SeguimientoOrdenServicio,
  OrdenServicioConSeguimiento
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';

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
  imports: [CommonModule, FormsModule, TableModule, AutoCompleteModule],
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
  mostrarModalDetalle = false;
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
  cecosData: any[] = [];

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
    'PENDIENTE_APROBACION', 'GENERADA', 'ENVIADA', 'ACEPTADA', 'EN_EJECUCION', 'FINALIZADA', 'RECHAZADA'
  ];

  // Estados de hitos
  estadosHito = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'En Ejecución', value: 'EN_EJECUCION' },
    { label: 'Completado', value: 'COMPLETADO' }
  ];
  
  solicitudesAprobadas: any[] = [];
  cotizacionesDisponibles: any[] = [];
  requerimientosServicio: any[] = [];

  // Buscador de proveedores
  proveedorInput: string = '';
  proveedoresSugeridos: any[] = [];
  proveedorSeleccionado: any = null;
  cargandoProveedores = false;

  // Catálogos de pago
  formasPago: any[] = [];
  tiposPago: any[] = [];

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
  filtroEmpresa = '';

  // Tabs del listado
  tabListado: 'TODOS' | 'PENDIENTES' | 'APROBADAS' | 'CERRADAS' = 'TODOS';
  conteoTodos = 0;
  conteoPendientes = 0;
  conteoAprobadas = 0;
  conteoCerradas = 0;

  // Lista filtrada
  ordenesFiltradas: OrdenServicioConSeguimiento[] = [];

  // Contadores estadísticos
  totalGeneradas = 0;
  totalEnviadas = 0;
  totalAceptadas = 0;
  totalEnEjecucion = 0;
  totalFinalizadas = 0;
  totalPendientesAprobacion = 0;

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
    private commodityService: CommodityService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarOrdenes();
    await this.cargarRequerimientosServicio();
    await this.cargarCatalogosDistribucion(); // usuario ya cargado, ruc disponible
    Promise.all([this.cargarFormasPago(), this.cargarTiposPago()]);
  }

  async cargarRequerimientosServicio() {
    try {
      const resp = await this.ordenServicioService
        .listarRequerimientosServicioParaOS({
          ruc: this.usuario.ruc,
          soloSinOS: true
        })
        .toPromise();
      this.requerimientosServicio = Array.isArray(resp) ? resp : [];
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error al cargar requerimientos de servicio:', error);
      this.requerimientosServicio = [];
    }
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
      this.actualizarContadores();
      this.filtrarOrdenes();
      this.cdr.markForCheck();
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
      const estadosCategoria = this.getEstadosPorCategoria(this.tabListado);
      const cumpleCategoria = estadosCategoria.includes(orden.estado as string);
      const cumpleEstado = this.filtroEstado === 'TODAS' || orden.estado === this.filtroEstado;
      const cumpleProveedor = !this.filtroProveedor || 
        (orden.nombreProveedor?.toLowerCase().includes(this.filtroProveedor.toLowerCase()) ||
         orden.rucProveedor?.includes(this.filtroProveedor));
      const cumpleTipo = !this.filtroTipoServicio || 
        orden.tipoServicio?.toLowerCase().includes(this.filtroTipoServicio.toLowerCase());
      const cumpleEmpresa = !this.filtroEmpresa ||
        orden.rucEmpresa?.includes(this.filtroEmpresa);

      return cumpleCategoria && cumpleEstado && cumpleProveedor && cumpleTipo && cumpleEmpresa;
    });
  }

  getEstadosPorCategoria(categoria: 'TODOS' | 'PENDIENTES' | 'APROBADAS' | 'CERRADAS'): string[] {
    switch (categoria) {
      case 'TODOS':
        return this.estadosSeguimiento;
      case 'PENDIENTES':
        return ['PENDIENTE_APROBACION', 'GENERADA'];
      case 'APROBADAS':
        return ['ENVIADA', 'ACEPTADA', 'EN_EJECUCION'];
      case 'CERRADAS':
        return ['FINALIZADA', 'RECHAZADA'];
      default:
        return [];
    }
  }

  cambiarTabListado(tab: 'TODOS' | 'PENDIENTES' | 'APROBADAS' | 'CERRADAS'): void {
    this.tabListado = tab;
    this.filtroEstado = 'TODAS';
    this.filtrarOrdenes();
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroEstado = 'TODAS';
    this.filtroProveedor = '';
    this.filtroTipoServicio = '';
    this.filtroEmpresa = '';
    this.filtrarOrdenes();
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
    this.totalPendientesAprobacion = this.ordenesServicio.filter(o => o.estado === 'PENDIENTE_APROBACION').length;

    this.conteoTodos = this.ordenesServicio.length;
    this.conteoPendientes = this.ordenesServicio.filter(o => ['PENDIENTE_APROBACION', 'GENERADA'].includes(o.estado as string)).length;
    this.conteoAprobadas = this.ordenesServicio.filter(o => ['ENVIADA', 'ACEPTADA', 'EN_EJECUCION'].includes(o.estado as string)).length;
    this.conteoCerradas = this.ordenesServicio.filter(o => ['FINALIZADA', 'RECHAZADA'].includes(o.estado as string)).length;
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

      // Cargar cecos: desde Dexie
      let cecos = await this.dexieService.showCecos();
      this.cecosData = cecos || [];
    } catch (error) {
      console.error('Error al cargar catálogos de distribución:', error);
    }
  }

  async generarDistribucionContable() {
    try {
      this.distribucionContable = [];
      if (!this.ordenActual) return;

      // Asegurar que maestro de subcommoditys esté cargado
      await this.asegurarMaestroCommoditys();

      const codigo = this.ordenActual.codigo || '';
      const monto = this.ordenActual.montoTotal || 0;
      const centrocosto = this.ordenActual.centroCosto || '';
      const proyecto = this.ordenActual.proyecto || '';

      // Buscar commodity/subcommodity en Dexie por código
      let cuentaContable = '';
      let elementoGasto = '';
      let descripcion = this.ordenActual.descripcion || '';

      // Buscar primero en subcommoditys (tiene más detalle)
      const subCommodity = await this.dexieService.maestroSubCommoditys
        .where('commodity')
        .equals(codigo)
        .first();

      if (subCommodity) {
        cuentaContable = subCommodity.cuentaContableGasto || '';
        elementoGasto = subCommodity.elementoGasto || '';
        descripcion = subCommodity.descripcionLocal || descripcion;
      } else {
        // Fallback: buscar en commoditys por commodity01
        const commodity = await this.dexieService.maestroCommoditys
          .where('commodity01')
          .equals(codigo)
          .first();
        if (commodity) {
          descripcion = commodity.descripcionLocal || descripcion;
        }
      }

      // Buscar tipo de gasto en catálogo para fondo
      let fondo = '';
      let referenciaGasto = elementoGasto || '';
      if (elementoGasto && this.gastosData.length > 0) {
        const gasto = this.gastosData.find((g: any) =>
          g.codigo === elementoGasto || g.TipoGasto === elementoGasto
        );
        fondo = gasto?.descripcion || gasto?.Descripcion || elementoGasto;
        referenciaGasto = gasto?.codigo || elementoGasto;
      }

      // C.C. Destino = labor del detalle del requerimiento
      const ccdestino = this.ordenActual.labor || '';

      this.distribucionContable = [{
        id: `DIST-${Date.now()}`,
        cuenta: cuentaContable,
        descripcion: descripcion,
        centrocosto: centrocosto,
        proyecto: proyecto,
        monto: monto,
        fondo: fondo || elementoGasto,
        referencia: referenciaGasto,
        ccdestino: ccdestino,
        turno: this.ordenActual.turno || '',
        cultivo: this.ordenActual.cultivo || ''
      }];

      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error al generar distribución contable:', error);
    }
  }

  private async asegurarMaestroCommoditys(): Promise<void> {
    const count = await this.dexieService.countMaestroSubCommodity();
    if (count === 0) {
      try {
        const resp = await lastValueFrom(this.commodityService.getSubCommodity([]));
        if (resp && resp.length) {
          await this.dexieService.saveMaestroSubCommodities(resp);
        }
      } catch { /* sin conexión, continuar */ }
    }
    const countCmm = await this.dexieService.countMaestroCommodity();
    if (countCmm === 0) {
      try {
        const resp = await lastValueFrom(this.commodityService.getCommodity([]));
        if (resp && resp.length) {
          await this.dexieService.saveMaestroCommodities(resp);
        }
      } catch { /* sin conexión, continuar */ }
    }
  }

  isLaborInList(ccdestino: string, centrocosto: string): boolean {
    const labores = this.getLaboresPorCeco(centrocosto);
    return labores.some(l => l.idlabor === ccdestino);
  }

  getLaboresPorCeco(centrocosto: string): any[] {
    if (!centrocosto) return this.laborData;
    const cecoTrim = centrocosto.trim();

    // Resolver: si centrocosto es un nombre (localname), buscar el código (costcenter)
    let codigoCeco = cecoTrim;
    const cecoObj = this.cecosData.find((c: any) =>
      c.costcenter?.trim() === cecoTrim ||
      c.localname?.trim()?.toUpperCase() === cecoTrim.toUpperCase()
    );
    if (cecoObj) {
      codigoCeco = cecoObj.costcenter?.trim() || cecoTrim;
    }

    const vistas = new Set<string>();
    return this.laborData
      .filter(l => l.ceco?.trim() === codigoCeco || l.ceco?.trim() === cecoTrim)
      .filter(l => {
        if (vistas.has(l.idlabor)) return false;
        vistas.add(l.idlabor);
        return true;
      });
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
    this.recalcularMontosDistribucion();
    this.cerrarModalDistribucion();
  }

  eliminarDistribucion(index: number) {
    this.distribucionContable = this.distribucionContable.filter((_, i) => i !== index);
    this.recalcularMontosDistribucion();
  }

  cerrarModalDistribucion() {
    this.mostrarModalDistribucion = false;
    this.distribucionEditIndex = null;
  }

  recalcularMontosDistribucion() {
    const total = this.ordenActual?.montoTotal || 0;
    const cant = this.distribucionContable.length;
    if (cant === 0) return;
    const montoPorLinea = Math.round((total / cant) * 100) / 100;
    // Ajustar último para que la suma sea exacta
    this.distribucionContable.forEach((dist, i) => {
      dist.monto = i < cant - 1 ? montoPorLinea : Math.round((total - montoPorLinea * (cant - 1)) * 100) / 100;
    });
  }

  getTotalDistribucion(): number {
    return this.distribucionContable.reduce((sum, item) => sum + (item.monto || 0), 0);
  }

  async nuevaOrdenServicio() {
    this.tipoOrden = 'DESDE_SOLICITUD';
    this.mostrarTabDistribucion = false;
    this.ordenActual = null;

    // Recargar requerimientos si no hay datos
    if (this.requerimientosServicio.length === 0) {
      try {
        this.alertService.mostrarModalCarga();
        await this.cargarRequerimientosServicio();
        this.alertService.cerrarModalCarga();
      } catch (error) {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Error', 'Error al cargar requerimientos de servicio aprobados', 'error');
        return;
      }
    }

    if (this.requerimientosServicio.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'No hay requerimientos de servicio aprobados disponibles. Use "Orden Directa" si necesita crear una orden sin requerimiento previo.',
        'warning'
      );
      return;
    }

    this.mostrarFormulario = true;
    this.cdr.markForCheck();
  }

  nuevaOrdenServicioDirecta() {
    this.tipoOrden = 'DIRECTA';
    this.mostrarTabDistribucion = false;
    this.ordenActual = {
      numeroOrden: this.generarNumeroOrden(),
      numeroOrdenSpring: '',
      solicitudServicioId: 0,
      tipoServicio: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      rucProveedor: '',
      rucEmpresa: this.usuario.ruc || '',
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
          numeroOrdenSpring: '',
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
          rucEmpresa: this.usuario.ruc || '',
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

  async seleccionarRequerimiento(req: any) {
    this.ordenActual = {
      numeroOrden: this.generarNumeroOrden(),
      numeroOrdenSpring: '',
      solicitudServicioId: 0,
      fecha: new Date().toISOString().split('T')[0],
      estado: 'GENERADA',
      tipoServicio: req.tipoItem || 'COMMODITY',
      descripcion: req.descripcion || '',
      proveedor: '',
      nombreProveedor: req.ultimoProveedor ? req.ultimoProveedor.split(' - ')[0] : '',
      rucProveedor: '',
      rucEmpresa: this.usuario.ruc || '',
      contactoProveedor: '',
      telefonoProveedor: '',
      emailProveedor: '',
      fechaInicioServicio: '',
      fechaFinServicio: '',
      plazoEjecucion: 0,
      montoTotal: (req.precioReferencial || 0) * (req.cantidad || 1),
      moneda: 'PEN',
      formaPago: '',
      condicionesPago: '',
      garantia: '',
      penalidades: '',
      centroCosto: req.ceco || req.centrocosto || '',
      proyecto: req.proyecto || req.idproyecto || '',
      turno: req.turno || '',
      labor: req.labor || '',
      cultivo: req.cultivo || '',
      observaciones: '',
      usuarioGenera: this.usuario.documentoidentidad || '',
      porcentajeCompletado: 0,
      hitos: [],
      // Referencia al requerimiento origen
      idRequerimientoOrigen: req.idrequerimiento,
      idDetalleRequerimiento: req.idDetalle,
      numeroRequerimiento: req.numeroRequerimiento,
      area: req.area,
      codigo: req.codigo,
      cantidad: req.cantidad,
      unidadMedida: req.unidadMedida,
      precioReferencial: req.precioReferencial || 0,
    };
    this.cotizacionesDisponibles = [];
    this.proveedorSeleccionado = null;
    this.proveedorInput = '';

    // Generar distribución contable automáticamente basada en el commodity
    await this.generarDistribucionContable();
    this.cdr.markForCheck();
  }

  // ============================================
  // BUSCADOR DE PROVEEDORES
  // ============================================
  async filtrarProveedores(event: any): Promise<void> {
    const query = String(event.query ?? '').trim();
    if (!query || query.length < 3) {
      this.proveedoresSugeridos = [];
      return;
    }
    this.cargandoProveedores = true;
    this.cdr.markForCheck();
    try {
      const body = { ruc: this.usuario.ruc, busqueda: query, estado: 'ACTIVO' };
      const resp: any = await lastValueFrom(this.maestrasService.getProveedores(body));
      let lista = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
      const queryLower = query.toLowerCase();
      lista = lista.filter((p: any) => {
        const nombre = String(p.proveedor ?? p.nombre ?? p.razonSocial ?? '').toLowerCase();
        const ruc = String(p.ruc ?? p.rucproveedor ?? p.documento ?? '').toLowerCase();
        return nombre.includes(queryLower) || ruc.includes(queryLower);
      });
      this.proveedoresSugeridos = lista.map((p: any) => ({
        id: String(p.idproveedor ?? p.id ?? p.ruc ?? p.documento ?? ''),
        nombre: String(p.proveedor ?? p.nombre ?? p.razonSocial ?? ''),
        ruc: String(p.ruc ?? p.rucproveedor ?? p.documento ?? ''),
        email: String(p.email ?? p.correo ?? p.Email ?? p.Correo ?? '').trim(),
        telefono: String(p.telefono ?? p.Telefono ?? '').trim(),
        formaPago: String(p.FormadePago ?? p.formadePago ?? p.formaPago ?? ''),
        condicionesPago: String(p.TipoPago ?? p.tipoPago ?? p.condicionesPago ?? ''),
        diasEntrega: parseInt(p.NumeroDiasEntrega ?? p.numeroDiasEntrega ?? p.DiasEntrega ?? p.diasEntrega ?? '30', 10) || 30
      }));
    } catch (err) {
      this.proveedoresSugeridos = [];
    } finally {
      this.cargandoProveedores = false;
      this.cdr.markForCheck();
    }
  }

  seleccionarProveedor(event: any): void {
    const prov = event?.value ?? event;
    this.proveedorSeleccionado = prov;
    if (!prov || !this.ordenActual) return;

    this.ordenActual.rucProveedor = prov.ruc;
    this.ordenActual.nombreProveedor = prov.nombre;
    this.ordenActual.emailProveedor = prov.email || '';
    this.ordenActual.condicionesPago = this.mapearAFormaPago(prov.formaPago) || this.mapearAFormaPago(prov.condicionesPago) || this.formasPago[0]?.idformapago || '';
    this.ordenActual.formaPago = this.mapearATipoPago(prov.condicionesPago) || this.mapearATipoPago(prov.formaPago) || this.tiposPago[0]?.TipoPago || '';
    this.ordenActual.plazoEjecucion = prov.diasEntrega ?? 30;
    this.proveedorInput = prov.nombre;
    this.cdr.markForCheck();
  }

  // ============================================
  // CATÁLOGOS DE PAGO
  // ============================================
  async cargarFormasPago(): Promise<void> {
    try {
      const resp: any = await lastValueFrom(this.maestrasService.getFormasPago({ ruc: this.usuario?.ruc }));
      this.formasPago = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
    } catch { this.formasPago = []; }
  }

  async cargarTiposPago(): Promise<void> {
    try {
      const resp: any = await lastValueFrom(this.maestrasService.getTiposPago({ ruc: this.usuario?.ruc }));
      this.tiposPago = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
    } catch { this.tiposPago = []; }
  }

  private normalizarTexto(texto: string): string {
    return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  }

  private mapearAFormaPago(valor: string): string {
    if (!valor || !this.formasPago.length) return valor;
    const v = this.normalizarTexto(valor);
    const match = this.formasPago.find((fp: any) =>
      this.normalizarTexto(fp.formapago) === v ||
      this.normalizarTexto(fp.idformapago) === v
    );
    return match?.idformapago || valor;
  }

  private mapearATipoPago(valor: string): string {
    if (!valor || !this.tiposPago.length) return valor;
    const v = this.normalizarTexto(valor);
    const match = this.tiposPago.find((tp: any) =>
      this.normalizarTexto(tp.Descripcion) === v ||
      this.normalizarTexto(tp.TipoPago) === v
    );
    return match?.TipoPago || valor;
  }

  condicionPagoExiste(valor: string): boolean {
    return this.formasPago.some((fp: any) => fp.idformapago === valor);
  }

  formaPagoExiste(valor: string): boolean {
    return this.tiposPago.some((tp: any) => tp.TipoPago === valor);
  }

  limpiarProveedor(): void {
    this.proveedorSeleccionado = null;
    this.proveedorInput = '';
    if (this.ordenActual) {
      this.ordenActual.rucProveedor = '';
      this.ordenActual.nombreProveedor = '';
      this.ordenActual.emailProveedor = '';
      this.ordenActual.formaPago = '';
      this.ordenActual.condicionesPago = '';
      this.ordenActual.plazoEjecucion = 0;
    }
    this.cdr.markForCheck();
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
        this.mostrarModalDetalle = true;
        this.cdr.detectChanges();
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
    this.proveedorSeleccionado = null;
    this.proveedorInput = '';
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.ordenActual = null;
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
    this.cdr.detectChanges();

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

    const ordenEstados: EstadoSeguimientoOS[] = ['PENDIENTE_APROBACION', 'GENERADA', 'ENVIADA', 'ACEPTADA', 'EN_EJECUCION', 'FINALIZADA'];
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
          rucEmpresa: this.usuario.ruc || '',
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
