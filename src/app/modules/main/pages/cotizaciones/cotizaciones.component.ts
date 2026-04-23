import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownComponent } from '@/app/modules/main/components/dropdown/dropdown.component';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { CotizacionesService } from '@/app/modules/main/services/cotizaciones.service';
import { ConsolidacionService } from '@/app/services/consolidacion.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Cotizacion,
  DetalleCotizacion,
  SolicitudCotizacion,
  DetalleSolicitudCotizacion,
  SolicitudCompra,
  DetalleSolicitudCompra,
  SolicitudServicio,
  Usuario,
  ItemComodity,
  SubClasificacion
} from '@/app/shared/interfaces/Tables';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    TooltipModule,
    DropdownComponent,
  ],
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.scss'],
})
export class CotizacionesComponent implements OnInit {
  // Propiedades principales
  cotizaciones: Cotizacion[] = [];
  solicitudesCotizacion: SolicitudCotizacion[] = [];
  solicitudesCompra: SolicitudCompra[] = [];
  usuario: Usuario | null = null;
  
  // Tabs
  tabActiva: string = 'SOLICITUDES';
  subTabSolicitudes: string = 'PENDIENTES';
  
  // Filtros
  filtroEstado: string = 'TODAS';
  filtroProveedor: string = '';
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;
  
  // Formulario
  mostrarFormulario: boolean = false;
  modoEdicion: boolean = false;
  cotizacion: Cotizacion = this.nuevaCotizacion();
  detalleCotizacion: DetalleCotizacion[] = [];
  lineaTemporal: DetalleCotizacion = this.nuevoDetalle();
  detalleEditIndex: number = -1;
  modalDetalleAbierto: boolean = false;
  
  // Modales
  modalDetalleCotizacionAbierto: boolean = false;
  modalRegistrarCotizacionAbierto: boolean = false;
  modalDetalleSolicitudAbierto: boolean = false;
  modalNuevaCotizacionAbierto: boolean = false;
  modalItemAbierto: boolean = false;
  modalComodityAbierto: boolean = false;
  cotizacionDetalle: Cotizacion | null = null;
  modalComparativoAbierto: boolean = false;
  cotizacionesComparativo: Cotizacion[] = [];
  
  // Contadores
  totalPendientes: number = 0;
  totalEnRevision: number = 0;
  totalCerradas: number = 0;
  totalGeneradas: number = 0;
  totalSeleccionadas: number = 0;
  totalRechazadas: number = 0;
  totalRecibidas: number = 0;
  totalEnEvaluacion: number = 0;
  totalSolicitudesPendientes: number = 0;
  totalSolicitudesEnRevision: number = 0;
  totalSolicitudesCerradas: number = 0;
  
  // Datos auxiliares
  proveedores: any[] = [];
  items: any[] = [];
  itemsFiltrados: any[] = [];
  commodities: any[] = [];
  commoditiesFiltrados: any[] = [];
  subComoditiesFiltrados: SubClasificacion[] = [];
  comoditySeleccionado: any = null;
  solicitudSeleccionada: SolicitudCotizacion | null = null;
  solicitudCotizacionSeleccionada: SolicitudCotizacion | null = null;
  
  // Cotizaciones ganadoras
  cotizacionesGanadoras: Cotizacion[] = [];
  numerosOrden = new Map<number, string>();
  private _totalSolicitudesGeneradas: number = 0;
  loading: boolean = false;
  
  // Getters para estadísticas de cotizaciones ganadoras
  get totalMontoGanadoras(): number {
    return this.cotizacionesGanadoras.reduce((sum, c) => sum + c.montoTotal, 0);
  }
  
  get totalSolicitudesGeneradas(): number {
    return this._totalSolicitudesGeneradas;
  }
  
  get promedioPlazoEntrega(): number {
    if (this.cotizacionesGanadoras.length === 0) return 0;
    const total = this.cotizacionesGanadoras.reduce((sum, c) => {
      const plazo = c.plazoEntrega || 0;
      return sum + (isNaN(plazo) ? 0 : plazo);
    }, 0);
    return Math.round(total / this.cotizacionesGanadoras.length);
  }
  
  // Forzar actualización de tabla
  private _tableRefresh = 0;
  get tableRefresh(): number {
    return this._tableRefresh;
  }
  
  // Propiedad computada para forzar actualización de datos en PrimeNG
  get solicitudesFiltradasConRefresh(): SolicitudCotizacion[] {
    const _ = this.tableRefresh; 
    return this.solicitudesFiltradas;
  }
  
  // Getter para filtrar solicitudes según sub-tab
  get solicitudesFiltradas(): SolicitudCotizacion[] {
    if (this.subTabSolicitudes === 'PENDIENTES') {
      return this.solicitudesCotizacion.filter(s => s.estado === 'GENERADA' || s.estado === 'PENDIENTE');
    } else if (this.subTabSolicitudes === 'EN_REVISION') {
      return this.solicitudesCotizacion.filter(s => s.estado === 'EN_REVISION');
    } else if (this.subTabSolicitudes === 'CERRADA') {
      return this.solicitudesCotizacion.filter(s => s.estado === 'CERRADA');
    }
    return this.solicitudesCotizacion;
  }
  
  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService,
    private utilsService: UtilsService,
    private maestrasService: MaestrasService,
    private cotizacionesService: CotizacionesService,
    private consolidacionService: ConsolidacionService,
    private cdr: ChangeDetectorRef
  ) {}
  
  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarProveedores();
    await this.cargarItems();
    await this.cargarSolicitudesCotizacion();
    await this.cargarCotizaciones();
    await this.cargarSolicitudesCompra();
    this.actualizarContadores();
    this.actualizarContadoresSolicitudes();
  }
  
  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }
  
  async cargarProveedores() {
    try {
      const body = { idproyecto: this.usuario?.idProyecto };
      const response = await this.maestrasService.getProveedores(body).toPromise();
      if (response && Array.isArray(response)) {
        this.proveedores = response;
      } else if (response && response.data) {
        this.proveedores = response.data;
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  }
  
  async cargarItems() {
    try {
      const todosLosItems = await this.dexieService.showItems();
      this.items = todosLosItems.filter(item => item.tipoclasificacion === 'I');
      this.itemsFiltrados = [...this.items];
      this.commodities = todosLosItems.filter(item => item.tipoclasificacion === 'C');
      this.commoditiesFiltrados = [...this.commodities];
    } catch (error) {
      console.error('Error cargando items:', error);
    }
  }
  
  async cargarSolicitudesCotizacion() {
    try {
      const response = await this.consolidacionService.listarSolicitudesCotizacion();
      let solicitudesBackend = [];
      
      if (typeof response === 'string') {
        solicitudesBackend = JSON.parse(response);
      } else {
        solicitudesBackend = response;
      }
      
      for (const sol of solicitudesBackend) {
        let detalleParsed = [];
        if (sol.detalle) {
          if (typeof sol.detalle === 'string') {
            try {
              detalleParsed = JSON.parse(sol.detalle);
            } catch (e) {
              console.error('Error al parsear detalle:', sol.detalle);
              detalleParsed = [];
            }
          } else if (Array.isArray(sol.detalle)) {
            detalleParsed = sol.detalle;
          }
        }
        
        const detalleLegacy = (detalleParsed || []).map((det: any) => ({
          id: 0,
          idSolicitudCotizacion: sol.id,
          noLinea: det.noLinea || 1,
          codigoItem: det.codigo || det.codigoItem,
          descripcionItem: det.descripcion || det.descripcionItem,
          cantidad: parseFloat(det.cantidad) || 0,
          unidadMedida: det.unidadMedida || 'UND',
          especificaciones: det.especificaciones || '',
        }));
        
        const solicitudDexie: SolicitudCotizacion = {
          id: sol.id,
          noSolicitud: sol.idsolicitud || sol.noSolicitud,
          tipo: sol.tipo || 'COMPRA',
          estado: sol.estado,
          fechaGeneracion: sol.fecha || sol.fechaGeneracion || sol.fechaCreacion || new Date().toISOString(),
          usuarioGenera: sol.usuario || sol.usuarioGenera || sol.usuarioCrea || '',
          totalItems: sol.totalItems || detalleLegacy.length,
          fechaModificacion: sol.fechaModificacion,
          usuarioModifica: sol.usuarioModifica,
          idConsolidacion: sol.idconsolidacion || sol.idConsolidacion,
          detalle: detalleLegacy
        };
        
        await this.dexieService.saveSolicitudCotizacion(solicitudDexie);
      }
      
      // Pequeño delay para asegurar que todas las operaciones de escritura se completen
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.solicitudesCotizacion = await this.dexieService.showSolicitudesCotizacion();
    } catch (error) {
      console.error('Error al cargar solicitudes desde backend:', error);
      this.solicitudesCotizacion = await this.dexieService.showSolicitudesCotizacion();
    }
    
    this.actualizarContadoresSolicitudes();
  }
  
  async cargarCotizaciones() {
    try {
      const filtros = {
        idproyecto: this.usuario?.idProyecto
      };
      
      const response = await this.cotizacionesService.listarCotizaciones(filtros);
      let cotizacionesBackend = [];
      
      if (typeof response === 'string') {
        cotizacionesBackend = JSON.parse(response);
      } else {
        cotizacionesBackend = response;
      }
      
      const cotizacionesLocales = await this.dexieService.showCotizaciones();
      const idsBackend = new Set(cotizacionesBackend.map((c: any) => c.id));
      
      for (const cot of cotizacionesBackend) {
        let detalleParsed = [];
        if (cot.detalles) {
          if (typeof cot.detalles === 'string') {
            try {
              detalleParsed = JSON.parse(cot.detalles);
            } catch (e) {
              console.error('Error al parsear detalles:', cot.detalles);
              detalleParsed = [];
            }
          } else {
            detalleParsed = cot.detalles;
          }
        }
        
        const cotizacion: Cotizacion = {
          id: cot.id,
          numeroCotizacion: cot.numeroCotizacion || `COT-${cot.id}`,
          fecha: cot.fecha || new Date().toISOString(),
          proveedor: cot.proveedor,
          nombreProveedor: cot.nombreProveedor,
          rucProveedor: cot.rucProveedor,
          // contacto: cot.contacto, // No existe en Cotizacion
          // telefono: cot.telefono, // No existe en Cotizacion
          // email: cot.email, // No existe en Cotizacion
          plazoEntrega: cot.plazoEntrega,
          validezOferta: cot.validezOferta,
          moneda: cot.moneda,
          montoTotal: cot.montoTotal,
          estado: cot.estado || 'RECIBIDA',
          seleccionada: false,
          detalle: detalleParsed,
          solicitudCompraId: cot.solicitudCompraId || 0,
          numeroSolicitud: cot.numeroSolicitud || '',
          idSolicitudCotizacion: cot.idSolicitudCotizacion,
          usuarioRegistra: cot.usuarioRegistra,
          // Propiedades requeridas faltantes
          fechaVencimiento: cot.fechaVencimiento || new Date().toISOString(),
          condicionesPago: cot.condicionesPago || '',
          formaPago: cot.formaPago || '',
          lugarEntrega: cot.lugarEntrega || ''
        };
        
        await this.dexieService.saveCotizacion(cotizacion);
      }
      
      this.cotizaciones = await this.dexieService.showCotizaciones();
    } catch (error) {
      console.error('Error al cargar cotizaciones desde backend:', error);
      this.cotizaciones = await this.dexieService.showCotizaciones();
    }
    
    this.actualizarContadores();
    this.actualizarCotizacionesGanadoras();
  }
  
  async cargarSolicitudesCompra() {
    this.solicitudesCompra = await this.dexieService.showSolicitudesCompra();
  }
  
  actualizarContadores() {
    this.totalPendientes = this.cotizaciones.filter(
      (c) => c.estado === 'RECIBIDA'
    ).length;
    this.totalRecibidas = this.totalPendientes; // Alias para RECIBIDA
    this.totalEnRevision = this.cotizaciones.filter(
      (c) => c.estado === 'EN_EVALUACION'
    ).length;
    this.totalEnEvaluacion = this.totalEnRevision; // Alias para EN_EVALUACION
    this.totalCerradas = 0; // No existe estado CERRADA en Cotizacion
    this.totalGeneradas = 0; // No existe estado GENERADA en Cotizacion
    this.totalSeleccionadas = this.cotizaciones.filter(
      (c) => c.estado === 'SELECCIONADA'
    ).length;
    this.totalRechazadas = this.cotizaciones.filter(
      (c) => c.estado === 'RECHAZADA'
    ).length;
  }
  
  actualizarContadoresSolicitudes() {
    this.totalSolicitudesPendientes = this.solicitudesCotizacion.filter(
      (s) => s.estado === 'GENERADA' || s.estado === 'PENDIENTE'
    ).length;
    this.totalSolicitudesEnRevision = this.solicitudesCotizacion.filter(
      (s) => s.estado === 'EN_REVISION'
    ).length;
    this.totalSolicitudesCerradas = this.solicitudesCotizacion.filter(
      (s) => s.estado === 'CERRADA'
    ).length;
  }
  
  async actualizarCotizacionesGanadoras() {
    this.cotizacionesGanadoras = this.cotizaciones.filter(
      (c) => c.estado === 'SELECCIONADA'
    );
    
    const solicitudesCompra = await this.dexieService.showSolicitudesCompra();
    const solicitudesServicio = await this.dexieService.solicitudesServicio.toArray();
    let conSolicitud = 0;
    
    for (const cotizacion of this.cotizacionesGanadoras) {
      const tipoSolicitud = this.obtenerTipoSolicitud(cotizacion);
      
      if (tipoSolicitud === 'SERVICIO') {
        // Buscar en solicitudes de servicio
        console.log('🔍 Buscando solicitud de servicio para cotización:', {
          numeroCotizacion: cotizacion.numeroCotizacion,
          numeroSolicitud: cotizacion.numeroSolicitud,
          totalSolicitudesServicio: solicitudesServicio.length
        });
        
        const solicitud = solicitudesServicio.find(s => 
          // Buscar por numeroCotizacion en observaciones o descripción
          (s.observaciones && s.observaciones.includes(cotizacion.numeroCotizacion)) ||
          (s.descripcionServicio && s.descripcionServicio.includes(cotizacion.numeroCotizacion))
        );
        
        if (solicitud) {
          console.log('✅ Solicitud de servicio encontrada:', solicitud.numeroSolicitud);
          conSolicitud++;
          this.numerosOrden.set(cotizacion.id!, solicitud.numeroSolicitud);
        } else {
          console.log('❌ No se encontró solicitud de servicio para:', cotizacion.numeroCotizacion);
          console.log('📋 Solicitudes de servicio disponibles:', solicitudesServicio);
        }
      } else {
        // Buscar en solicitudes de compra
        const solicitud = solicitudesCompra.find(s => 
          s.numeroSolicitud === cotizacion.numeroSolicitud ||
          (s.observaciones && s.observaciones.includes(cotizacion.numeroCotizacion))
        );
        if (solicitud) {
          conSolicitud++;
          this.numerosOrden.set(cotizacion.id!, solicitud.numeroSolicitud);
        }
      }
    }
    
    this._totalSolicitudesGeneradas = conSolicitud;
  }
  
  async cambiarTabGanadores() {
    await this.cargarCotizaciones();
    await this.actualizarCotizacionesGanadoras();
    this.tabActiva = 'GANADORES';
  }
  
  // Método para cambiar de sub-tab y forzar actualización
  cambiarSubTab(tab: string) {
    this.subTabSolicitudes = tab;
    this.cdr.detectChanges();
    
    this._tableRefresh++;
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }
  
  trackBySolicitudId(index: number, solicitud: SolicitudCotizacion): number {
    return solicitud.id || index;
  }
  
  // Métodos para cotizaciones
  nuevaCotizacion(): Cotizacion {
    return {
      numeroCotizacion: '',
      fecha: new Date().toISOString(),
      proveedor: '',
      nombreProveedor: '',
      rucProveedor: '',
      plazoEntrega: 0,
      validezOferta: 7,
      moneda: 'PEN',
      montoTotal: 0,
      detalle: [],
      estado: 'RECIBIDA',
      seleccionada: false,
      usuarioRegistra: this.usuario?.documentoidentidad || '',
      // Propiedades requeridas faltantes
      solicitudCompraId: 0,
      numeroSolicitud: '',
      fechaVencimiento: new Date().toISOString(),
      condicionesPago: '',
      formaPago: '',
      lugarEntrega: ''
    };
  }
  
  nuevoDetalle(): DetalleCotizacion {
    return {
      cotizacionId: 0,
      codigo: '',
      descripcion: '',
      cantidad: 0,
      unidadMedida: 'UND',
      precioUnitario: 0,
      subtotal: 0,
      porcentajeDescuento: 0,
      descuento: 0,
      porcentajeImpuesto: 18,
      impuesto: 0,
      total: 0,
    };
  }
  
  generarNumeroCotizacion(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const seg = String(fecha.getSeconds()).padStart(2, '0');
    return `COT-${año}${mes}${dia}-${hora}${min}${seg}`;
  }
  
  // Métodos principales del flujo
  async seleccionarCotizacion(cotizacion: Cotizacion) {
    // Obtener el tipo de solicitud original
    let tipoSolicitud = 'COMPRA';
    if (cotizacion.idSolicitudCotizacion) {
      const solicitudCotizacion = await this.dexieService.solicitudesCotizacion
        .where('id')
        .equals(cotizacion.idSolicitudCotizacion)
        .first();
      
      if (solicitudCotizacion?.tipo === 'SERVICIO') {
        tipoSolicitud = 'SERVICIO';
      }
    }
    
    const mensajeConfirmacion = tipoSolicitud === 'SERVICIO' 
      ? '¿Desea seleccionar esta cotización como ganadora y generar la solicitud de servicio automáticamente?'
      : '¿Desea seleccionar esta cotización como ganadora y generar la solicitud de compra automáticamente?';
    
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      mensajeConfirmacion,
      'info'
    );

    if (!confirmacion) return;

    try {
      // Marcar como seleccionada
      cotizacion.estado = 'SELECCIONADA';
      cotizacion.seleccionada = true;
      cotizacion.usuarioEvalua = this.usuario!.documentoidentidad;
      cotizacion.fechaEvaluacion = new Date().toISOString();
      
      await this.dexieService.saveCotizacion(cotizacion);

      // Actualizar el estado de la Solicitud de Cotización a CERRADA
      if (cotizacion.idSolicitudCotizacion) {
        const solicitudCotizacion = await this.dexieService.solicitudesCotizacion.get(cotizacion.idSolicitudCotizacion);
        if (solicitudCotizacion) {
          solicitudCotizacion.estado = 'CERRADA';
          solicitudCotizacion.fechaModificacion = new Date().toISOString();
          solicitudCotizacion.usuarioModifica = this.usuario!.documentoidentidad;
          
          await this.dexieService.saveSolicitudCotizacion(solicitudCotizacion);
          
          try {
            await this.consolidacionService.actualizarEstadoSolicitudCotizacion({
              id: solicitudCotizacion.id!,
              estado: 'CERRADA',
              usuarioModifica: this.usuario!.documentoidentidad
            });
          } catch (errorBackend) {
            console.warn('Error al sincronizar estado con backend:', errorBackend);
          }
        }
      }

      // Generar solicitud automáticamente según el tipo
      await this.generarSolicitudDesdeCotizacion(cotizacion);

      await this.cargarCotizaciones();
      await this.cargarSolicitudesCotizacion();
      
      this.actualizarCotizacionesGanadoras();
      this.actualizarContadoresSolicitudes();
      
      // Forzar actualización de la tabla
      this._tableRefresh++;
      this.cdr.detectChanges();
      
      // Cambiar al tab de cotizaciones ganadoras
      this.tabActiva = 'GANADORES';
      
      console.log('✅ Solicitud de cotización cambió a estado CERRADA y se movió a la pestaña correspondiente');
    } catch (error) {
      console.error('Error al seleccionar cotización:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al seleccionar la cotización.',
        'error'
      );
    }
  }
  
  async generarSolicitudDesdeCotizacion(cotizacion: Cotizacion) {
    try {
      if (!cotizacion.detalle || cotizacion.detalle.length === 0) {
        console.error('La cotización no tiene detalles');
        return;
      }

      // Verificar que no exista ya una solicitud
      const solicitudes = await this.dexieService.showSolicitudesCompra();
      const solicitudExistente = solicitudes.find(s => 
        s.numeroSolicitud === cotizacion.numeroSolicitud && 
        s.estado !== 'RECHAZADA'
      );
      
      if (solicitudExistente) {
        return;
      }

      // Buscar la solicitud de cotización para obtener el tipo
      if (cotizacion.idSolicitudCotizacion) {
        const solicitudCotizacion = await this.dexieService.solicitudesCotizacion
          .where('id')
          .equals(cotizacion.idSolicitudCotizacion)
          .first();
        
        // Si es tipo SERVICIO, generar solicitud de servicio
        if (solicitudCotizacion?.tipo === 'SERVICIO') {
          await this.generarSolicitudServicio(cotizacion, solicitudCotizacion);
          return;
        }
      }

      // Generar solicitud de compra
      const numeroSolicitud = this.generarNumeroSolicitud();

      const detallesSolicitud: DetalleSolicitudCompra[] = cotizacion.detalle.map(det => ({
        id: 0,
        solicitudCompraId: 0,
        codigo: det.codigo,
        descripcion: det.descripcion,
        cantidad: det.cantidad,
        cantidadAprobada: det.cantidad,
        cantidadAtendida: 0,
        unidadMedida: det.unidadMedida || 'UND',
        precioReferencial: det.precioUnitario || 0,
        montoReferencial: (det.precioUnitario || 0) * det.cantidad,
        proyecto: '',
        ceco: '',
        turno: '',
        labor: '',
        especificacionesTecnicas: '',
        estado: 'PENDIENTE',
      }));

      const montoEstimado = detallesSolicitud.reduce((sum, d) => sum + (d.montoReferencial || 0), 0);

      // Obtener datos del requerimiento original
      let almacen = 'H001'; // ✅ CORRECCIÓN: Valor por defecto con formato completo
      let idAlmacen = 1;
      let proyecto = this.usuario!.idProyecto || '';
      let ceco = '';
      
      if (cotizacion.idSolicitudCotizacion) {
        const solicitudCotizacion = await this.dexieService.solicitudesCotizacion
          .where('id')
          .equals(cotizacion.idSolicitudCotizacion)
          .first();
        
        if (solicitudCotizacion && solicitudCotizacion.idConsolidacion) {
          try {
            const consolidacion = await this.consolidacionService.obtenerConsolidacion(solicitudCotizacion.idConsolidacion);
            
            if (consolidacion && consolidacion.detalles && consolidacion.detalles.length > 0) {
              const primerDetalle = consolidacion.detalles[0];
              
              console.log('🔍 DEBUG - Consolidación completa:', consolidacion);
              console.log('🔍 DEBUG - Primer detalle consolidación:', primerDetalle);
              
              if (primerDetalle.origenes && primerDetalle.origenes.length > 0) {
                const origen = primerDetalle.origenes[0];
                console.log('🔍 DEBUG - Origen completo:', origen);
                console.log('🔍 DEBUG - idOrigen:', origen.idOrigen);
                console.log('🔍 DEBUG - Tipo de idOrigen:', typeof origen.idOrigen);
                
                // Obtener datos del requerimiento (CONSUMO o COMPRA)
                if (origen.idOrigen) {
                  const detalleRequerimiento = await this.consolidacionService.obtenerDetalleRequerimiento(origen.idOrigen);
                  
                  // Obtener almacén del requerimiento
                  if (detalleRequerimiento.idalmacen) {
                    almacen = detalleRequerimiento.idalmacen;
                    
                    // ✅ CORRECCIÓN: Convertir código corto a formato completo (001 → H001)
                    if (almacen && almacen.length <= 3 && !isNaN(Number(almacen))) {
                      console.log('🏪 DEBUG - Almacén en formato corto detectado:', almacen);
                      // Buscar en la lista de almacenes
                      const almacenes = await this.dexieService.showAlmacenes();
                      const almacenCompleto = almacenes.find((a: any) => a.almacen === almacen);
                      if (almacenCompleto) {
                        almacen = almacenCompleto.idalmacen;
                        console.log('🏪 DEBUG - Almacén convertido a:', almacen);
                      } else {
                        // Si no se encuentra, usar formato H + código (ej: H001)
                        almacen = 'H' + almacen.padStart(3, '0');
                        console.log('🏪 DEBUG - Almacén convertido a formato estándar:', almacen);
                      }
                    }
                    
                    console.log('🏪 DEBUG - Almacén FINAL:', almacen);
                    idAlmacen = parseInt(detalleRequerimiento.idalmacen) || 1;
                  }
                  
                  // 🔍 DEBUG: Ver estructura completa del requerimiento
                  console.log('🔍 DEBUG - Requerimiento completo:', detalleRequerimiento);
                  console.log('🔍 DEBUG - Tiene detalle?', !!detalleRequerimiento.detalle);
                  console.log('🔍 DEBUG - Cantidad de detalles:', detalleRequerimiento.detalle?.length);
                  
                  // ✅ CORRECCIÓN: Obtener proyecto y ceco del primer detalle del requerimiento
                  if (detalleRequerimiento.detalle && detalleRequerimiento.detalle.length > 0) {
                    const primerDetalle = detalleRequerimiento.detalle[0];
                    console.log('🔍 DEBUG - Primer detalle del requerimiento:', primerDetalle);
                    console.log('🔍 DEBUG - Campos disponibles:', Object.keys(primerDetalle));
                    
                    // Los campos vienen directamente como 'proyecto' y 'ceco' en el detalle
                    proyecto = primerDetalle.proyecto || 
                              primerDetalle.idproyecto || 
                              primerDetalle.nombreProyecto ||
                              this.usuario!.idProyecto || '';
                    
                    ceco = primerDetalle.ceco || 
                          primerDetalle.idcentrocosto || 
                          primerDetalle.centroCosto || 
                          primerDetalle.nombreCentroCosto || '';
                    
                    console.log('✅ Proyecto obtenido del detalle:', proyecto);
                    console.log('✅ CECO obtenido del detalle:', ceco);
                  } else {
                    console.warn('⚠️ No hay detalles en el requerimiento');
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error al obtener datos de la consolidación:', error);
          }
        }
      }

      // Actualizar los detalles con los datos obtenidos
      detallesSolicitud.forEach(det => {
        det.proyecto = proyecto;
        det.ceco = ceco;
      });

      // Crear la solicitud de compra
      const solicitudCompra: SolicitudCompra = {
        numeroSolicitud,
        fecha: new Date().toISOString(),
        tipo: 'DIRECTA',
        prioridad: 'NORMAL',
        almacen,
        usuarioSolicita: this.usuario!.documentoidentidad,
        nombreSolicita: this.usuario!.nombre || this.usuario!.usuario,
        estado: 'GENERADA',
        observaciones: `Solicitud generada automáticamente desde la cotización ganadora ${cotizacion.numeroCotizacion} del proveedor ${cotizacion.nombreProveedor}.`,
        detalle: detallesSolicitud,
        montoEstimado,
        moneda: cotizacion.moneda || 'PEN',
        fechaRequerida: new Date(Date.now() + (cotizacion.plazoEntrega || 15) * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Guardar la solicitud en Dexie
      const solicitudId = await this.dexieService.saveSolicitudCompra(solicitudCompra);

      // Actualizar los detalles con el ID de la solicitud
      for (const det of detallesSolicitud) {
        const detalleParaGuardar = {
          ...det,
          solicitudCompraId: solicitudId as number,
          almacen,
          idAlmacen,
          proyecto,
          ceco
        };
        delete (detalleParaGuardar as any).id;
        await this.dexieService.detalleSolicitudCompra.add(detalleParaGuardar);
      }
      
      // Mostrar mensaje de éxito
      this.alertService.showAlert(
        'Éxito',
        `Solicitud de Compra ${numeroSolicitud} generada automáticamente desde la cotización seleccionada.\n\nLa solicitud está lista para enviar a aprobación.`,
        'success'
      );

    } catch (error) {
      console.error('Error al generar solicitud desde cotización:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudo generar la solicitud de compra automáticamente.',
        'error'
      );
    }
  }
  
  async generarSolicitudServicio(cotizacion: Cotizacion, solicitudCotizacion: SolicitudCotizacion) {
    try {
      if (!cotizacion.detalle || cotizacion.detalle.length === 0) {
        console.error('La cotización no tiene detalles');
        return;
      }

      const numeroSolicitud = this.generarNumeroSolicitudServicio();

      // Obtener datos de la consolidación
      let ceco = '';
      
      if (solicitudCotizacion.idConsolidacion) {
        try {
          const consolidacion = await this.consolidacionService.obtenerConsolidacion(solicitudCotizacion.idConsolidacion);
          
          if (consolidacion && consolidacion.detalles && consolidacion.detalles.length > 0) {
            const primerDetalle = consolidacion.detalles[0];
            
            if (primerDetalle.origenes && primerDetalle.origenes.length > 0) {
              const origen = primerDetalle.origenes[0];
              
              if (origen.tipoOrigen === 'CONSUMO' && origen.idOrigen) {
                const detalleRequerimiento = await this.consolidacionService.obtenerDetalleRequerimiento(origen.idOrigen);
                
                if (detalleRequerimiento.ceco) {
                  ceco = detalleRequerimiento.ceco;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error al obtener datos de la consolidación:', error);
        }
      }

      // Crear la solicitud de servicio
      const solicitudServicio: SolicitudServicio = {
        numeroSolicitud,
        fecha: new Date().toISOString(),
        tipo: 'OTRO',
        area: this.usuario!.idarea || '',
        usuarioSolicita: this.usuario!.documentoidentidad,
        nombreSolicita: this.usuario!.nombre || this.usuario!.usuario,
        estado: 'GENERADA',
        descripcionServicio: `Solicitud de servicio generada desde cotización ${cotizacion.numeroCotizacion}`,
        observaciones: `Proveedor seleccionado: ${cotizacion.nombreProveedor}\n` +
                      `Moneda: ${cotizacion.moneda || 'PEN'}\n` +
                      `Monto total: ${this.formatearMoneda(cotizacion.montoTotal, cotizacion.moneda)}\n` +
                      `Plazo entrega: ${cotizacion.plazoEntrega || 0} días` +
                      (ceco ? `\nCECO: ${ceco}` : ''),
        proveedor: cotizacion.proveedor,
        empresa: cotizacion.nombreProveedor,
        montoEstimado: cotizacion.montoTotal,
        moneda: cotizacion.moneda || 'PEN',
        fechaRequerida: new Date(Date.now() + (cotizacion.plazoEntrega || 15) * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Guardar la solicitud en Dexie
      await this.dexieService.solicitudesServicio.add(solicitudServicio);
      
      // Actualizar el Map de números de orden para habilitar el botón
      if (cotizacion.id) {
        this.numerosOrden.set(cotizacion.id, numeroSolicitud);
        cotizacion.numeroSolicitud = numeroSolicitud;
      }
      
      // Mostrar mensaje de éxito
      this.alertService.showAlert(
        'Éxito',
        `Solicitud de Servicio ${numeroSolicitud} generada automáticamente desde la cotización seleccionada.\n\nLa solicitud está lista para enviar a aprobación.`,
        'success'
      );

    } catch (error) {
      console.error('Error al generar solicitud de servicio desde cotización:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudo generar la solicitud de servicio automáticamente.',
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
  
  generarNumeroSolicitudServicio(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const seg = String(fecha.getSeconds()).padStart(2, '0');
    return `SS-${año}${mes}${dia}-${hora}${min}${seg}`;
  }
  
  // Métodos de filtros
  cotizacionesFiltradas(): Cotizacion[] {
    let filtradas = [...this.cotizaciones];

    if (this.filtroEstado !== 'TODAS') {
      // Mapear estados de filtro a estados válidos
      const estadoMap: { [key: string]: string } = {
        'PENDIENTES': 'RECIBIDA',
        'EN_REVISION': 'EN_EVALUACION',
        'CERRADAS': 'SELECCIONADA'
      };
      const estadoFiltro = estadoMap[this.filtroEstado] || this.filtroEstado;
      filtradas = filtradas.filter((c) => c.estado === estadoFiltro);
    }

    if (this.filtroProveedor) {
      filtradas = filtradas.filter(
        (c) =>
          c.nombreProveedor
            .toLowerCase()
            .includes(this.filtroProveedor.toLowerCase()) ||
          c.proveedor.toLowerCase().includes(this.filtroProveedor.toLowerCase())
      );
    }

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(
        (c) => new Date(c.fecha) >= this.filtroFechaInicio!
      );
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter(
        (c) => new Date(c.fecha) <= this.filtroFechaFin!
      );
    }

    return filtradas;
  }
  
  limpiarFiltros() {
    this.filtroEstado = 'TODAS';
    this.filtroProveedor = '';
    this.filtroFechaInicio = null;
    this.filtroFechaFin = null;
  }
  
  // Métodos de utilidad
  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      RECIBIDA: 'badge-info',
      EN_REVISION: 'badge-warning',
      SELECCIONADA: 'badge-success',
      RECHAZADA: 'badge-danger',
      CERRADA: 'badge-secondary',
      GENERADA: 'badge-primary',
      PENDIENTE: 'badge-warning',
    };
    return clases[estado] || 'badge-secondary';
  }
  
  formatearFecha(fecha: string): string {
    if (!fecha || fecha === '' || fecha === null) return 'Sin fecha';
    
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) return 'Fecha inválida';
    
    const dia = String(fechaObj.getDate()).padStart(2, '0');
    const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const año = fechaObj.getFullYear();
    
    return `${dia}/${mes}/${año}`;
  }
  
  formatearMoneda(monto: number, moneda: string = 'PEN'): string {
    const monedaNormalizada = !moneda || moneda.trim() === '' ? 'PEN' : moneda.toUpperCase();
    
    const simbolos: { [key: string]: string } = {
      'PEN': 'S/',
      'USD': '$',
      'EUR': '€'
    };
    
    const simbolo = simbolos[monedaNormalizada] || monedaNormalizada;
    
    return `${simbolo} ${monto.toFixed(2)}`;
  }
  
  // Métodos de modales
  verDetalle(cotizacion: Cotizacion) {
    console.log('📋 Abriendo modal de detalle para:', cotizacion);
    this.cotizacionDetalle = cotizacion;
    this.modalDetalleCotizacionAbierto = true;
    console.log('✅ Modal abierto:', this.modalDetalleCotizacionAbierto);
  }
  
  cerrarModalDetalleCotizacion() {
    this.modalDetalleCotizacionAbierto = false;
    this.cotizacionDetalle = null;
  }
  
  async rechazarCotizacion(cotizacion: Cotizacion) {
    const motivo = await this.alertService.showPrompt(
      'Rechazar Cotización',
      'Ingrese el motivo del rechazo:'
    );

    if (!motivo) return;

    try {
      cotizacion.estado = 'RECHAZADA';
      cotizacion.motivoRechazo = motivo;
      cotizacion.usuarioEvalua = this.usuario!.documentoidentidad;
      cotizacion.fechaEvaluacion = new Date().toISOString();

      await this.dexieService.saveCotizacion(cotizacion);

      this.alertService.showAlert(
        'Éxito',
        'Cotización rechazada correctamente.',
        'success'
      );

      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al rechazar cotización:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al rechazar la cotización.',
        'error'
      );
    }
  }
  
  async cambiarEstadoSolicitudAEnRevision() {
    try {
      if (!this.solicitudCotizacionSeleccionada) {
        console.warn('No hay solicitud de cotización seleccionada');
        return;
      }

      // Verificar si la solicitud está en estado PENDIENTE o GENERADA
      if (this.solicitudCotizacionSeleccionada.estado === 'GENERADA' || 
          this.solicitudCotizacionSeleccionada.estado === 'PENDIENTE') {
        
        // Actualizar estado a EN_REVISION
        this.solicitudCotizacionSeleccionada.estado = 'EN_REVISION';
        this.solicitudCotizacionSeleccionada.fechaModificacion = new Date().toISOString();
        this.solicitudCotizacionSeleccionada.usuarioModifica = this.usuario!.documentoidentidad;
        
        // Guardar en Dexie
        await this.dexieService.saveSolicitudCotizacion(this.solicitudCotizacionSeleccionada);
        
        // Sincronizar con backend
        try {
          await this.consolidacionService.actualizarEstadoSolicitudCotizacion({
            id: this.solicitudCotizacionSeleccionada.id!,
            estado: 'EN_REVISION',
            usuarioModifica: this.usuario!.documentoidentidad
          });
          console.log('✅ Estado de solicitud actualizado a EN_REVISION en backend');
        } catch (errorBackend) {
          console.warn('⚠️ Error al sincronizar estado con backend:', errorBackend);
        }
        
        // Actualizar contadores
        this.actualizarContadoresSolicitudes();
        
        console.log('✅ Solicitud de cotización cambió a estado EN_REVISION');
      }
    } catch (error) {
      console.error('Error al cambiar estado de solicitud a EN_REVISION:', error);
    }
  }
  
  // Otros métodos existentes (abreviados para espacio)
  async marcarComoEnEvaluacion(cotizacion: Cotizacion) {
    try {
      cotizacion.estado = 'EN_EVALUACION';
      await this.dexieService.saveCotizacion(cotizacion);
      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  }
  
  cancelarFormulario() {
    if (!confirm('¿Seguro que deseas cancelar? Se perderán los cambios no guardados.')) return;
    this.mostrarFormulario = false;
  }
  
  // Métodos adicionales para el template
  cerrarModalDetalleSolicitud() {
    this.modalDetalleSolicitudAbierto = false;
    this.solicitudCotizacionSeleccionada = null;
  }
  
  cerrarModalAgregarComodity() {
    this.modalComodityAbierto = false;
    this.lineaTemporal = this.nuevoDetalle();
    this.detalleEditIndex = -1;
  }
  
  agregarItemCotizacion() {
    // Validaciones
    if (!this.lineaTemporal.codigo) {
      this.alertService.showAlert('Atención', 'Debe ingresar el código del item.', 'warning');
      return;
    }
    
    if (this.lineaTemporal.cantidad <= 0) {
      this.alertService.showAlert('Atención', 'La cantidad debe ser mayor a 0.', 'warning');
      return;
    }
    
    if (this.lineaTemporal.precioUnitario <= 0) {
      this.alertService.showAlert('Atención', 'El precio unitario debe ser mayor a 0.', 'warning');
      return;
    }
    
    // Calcular montos antes de agregar
    this.calcularMontos(this.lineaTemporal);
    
    // Agregar o actualizar
    if (this.detalleEditIndex >= 0) {
      // Actualizar item existente
      this.detalleCotizacion[this.detalleEditIndex] = { ...this.lineaTemporal };
      this.detalleEditIndex = -1;
    } else {
      // Agregar nuevo item
      this.detalleCotizacion.push({ ...this.lineaTemporal });
    }
    
    // Limpiar y cerrar modal
    this.lineaTemporal = this.nuevoDetalle();
    this.modalItemAbierto = false;
    this.modalComodityAbierto = false;
    this.calcularTotales();
  }
  
  cerrarModalRegistrarCotizacion() {
    this.modalRegistrarCotizacionAbierto = false;
  }
  
  async guardarCotizacionDesdeSolicitud() {
    try {
      // Validaciones
      if (!this.cotizacion.proveedor) {
        this.alertService.showAlert('Atención', 'Debe seleccionar un proveedor.', 'warning');
        return;
      }
      
      if (this.detalleCotizacion.length === 0) {
        this.alertService.showAlert('Atención', 'Debe agregar al menos un item.', 'warning');
        return;
      }
      
      // Generar número de cotización
      this.cotizacion.numeroCotizacion = this.generarNumeroCotizacion();
      this.cotizacion.detalle = this.detalleCotizacion;
      
      // Asociar a la solicitud de cotización
      if (this.solicitudCotizacionSeleccionada) {
        this.cotizacion.idSolicitudCotizacion = this.solicitudCotizacionSeleccionada.id;
        this.cotizacion.numeroSolicitud = this.solicitudCotizacionSeleccionada.noSolicitud;
      }
      
      // Preparar datos para el backend
      const cotizacionBackend = {
        idcotizacion: this.cotizacion.numeroCotizacion,
        idsolicitud: this.cotizacion.numeroSolicitud,
        proveedor: this.cotizacion.proveedor,
        nombreProveedor: this.cotizacion.nombreProveedor,
        rucProveedor: this.cotizacion.rucProveedor,
        fechaCotizacion: this.cotizacion.fecha.split('T')[0], // Solo fecha
        moneda: this.cotizacion.moneda || 'PEN',
        tiempoEntrega: this.cotizacion.plazoEntrega || 0,
        formaPago: this.cotizacion.formaPago || '',
        observaciones: this.cotizacion.observaciones || '',
        usuario: this.usuario!.documentoidentidad,
        detalles: JSON.stringify(this.detalleCotizacion.map(det => ({
          codigo: det.codigo,
          descripcion: det.descripcion,
          cantidad: det.cantidad,
          unidadMedida: det.unidadMedida,
          precioUnitario: det.precioUnitario,
          total: det.total
        })))
      };
      
      // Guardar en backend
      try {
        const response = await this.cotizacionesService.registrarCotizacion(cotizacionBackend);
        
        if (response && response.errorgeneral === 0) {
          // Si el backend devuelve el ID, actualizar la cotización
          if (response.id) {
            this.cotizacion.id = response.id;
          }
          
          // Guardar en Dexie
          await this.dexieService.saveCotizacion(this.cotizacion);
          
          // Cambiar estado de la solicitud de cotización a EN_REVISION
          await this.cambiarEstadoSolicitudAEnRevision();
          
          this.alertService.showAlert('Éxito', 'Cotización registrada correctamente. La solicitud pasó a estado EN REVISIÓN.', 'success');
          
          // Cerrar modal y recargar
          this.cerrarModalRegistrarCotizacion();
          await this.cargarCotizaciones();
          await this.cargarSolicitudesCotizacion();
          
          // Limpiar formulario
          this.cotizacion = this.nuevaCotizacion();
          this.detalleCotizacion = [];
        } else {
          throw new Error(response?.mensaje || 'Error al registrar cotización en el servidor');
        }
      } catch (errorBackend) {
        console.error('Error al sincronizar con backend:', errorBackend);
        
        // Guardar solo en Dexie como fallback
        await this.dexieService.saveCotizacion(this.cotizacion);
        
        // Cambiar estado de la solicitud de cotización a EN_REVISION
        await this.cambiarEstadoSolicitudAEnRevision();
        
        this.alertService.showAlert(
          'Atención', 
          'Cotización guardada localmente. No se pudo sincronizar con el servidor. La solicitud pasó a estado EN REVISIÓN.', 
          'warning'
        );
        
        // Cerrar modal y recargar
        this.cerrarModalRegistrarCotizacion();
        await this.cargarCotizaciones();
        await this.cargarSolicitudesCotizacion();
        
        // Limpiar formulario
        this.cotizacion = this.nuevaCotizacion();
        this.detalleCotizacion = [];
      }
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      this.alertService.showAlert('Error', 'Ocurrió un error al guardar la cotización.', 'error');
    }
  }
  
  abrirModalAgregarItem() {
    this.lineaTemporal = this.nuevoDetalle();
    this.detalleEditIndex = -1;
    this.modalItemAbierto = true;
  }
  
  abrirModalAgregarComodity() {
    this.lineaTemporal = this.nuevoDetalle();
    this.detalleEditIndex = -1;
    this.modalComodityAbierto = true;
  }
  
  verDetalleSolicitud(solicitud: SolicitudCotizacion) {
    this.solicitudCotizacionSeleccionada = solicitud;
    this.modalDetalleSolicitudAbierto = true;
  }
  
  abrirRegistroCotizacionDesdeSolicitud(solicitud: SolicitudCotizacion) {
    this.solicitudCotizacionSeleccionada = solicitud;
    
    // Inicializar cotización vacía
    this.cotizacion = this.nuevaCotizacion();
    this.cotizacion.idSolicitudCotizacion = solicitud.id;
    
    // Si es SERVICIO, crear un detalle genérico para el servicio
    if (solicitud.tipo === 'SERVICIO') {
      this.detalleCotizacion = [{
        id: 0,
        cotizacionId: 0,
        codigo: 'SERVICIO',
        descripcion: solicitud.detalle?.[0]?.descripcionItem || 'Servicio solicitado',
        cantidad: 1,
        unidadMedida: 'SERVICIO',
        precioUnitario: 0,
        descuento: 0,
        porcentajeDescuento: 0,
        subtotal: 0,
        impuesto: 0,
        porcentajeImpuesto: 18,
        total: 0
      }];
    } else {
      // Para COMPRA, cargar los items de la solicitud
      this.detalleCotizacion = (solicitud.detalle || []).map(det => ({
        id: 0,
        cotizacionId: 0,
        codigo: det.codigoItem,
        descripcion: det.descripcionItem,
        cantidad: det.cantidad,
        unidadMedida: det.unidadMedida || 'UND',
        precioUnitario: 0,
        descuento: 0,
        porcentajeDescuento: 0,
        subtotal: 0,
        impuesto: 0,
        porcentajeImpuesto: 18,
        total: 0
      }));
    }
    
    this.modalRegistrarCotizacionAbierto = true;
  }
  
  nuevaCotizacionManual() {
    this.cotizacion = this.nuevaCotizacion();
    this.detalleCotizacion = [];
    this.modalNuevaCotizacionAbierto = true;
    this.modoEdicion = false;
  }
  
  cerrarModalNuevaCotizacion() {
    this.modalNuevaCotizacionAbierto = false;
    this.cotizacion = this.nuevaCotizacion();
    this.detalleCotizacion = [];
  }
  
  editarItemCotizacion(index: number) {
    this.lineaTemporal = { ...this.detalleCotizacion[index] };
    this.detalleEditIndex = index;
    this.modalItemAbierto = true;
  }
  
  cerrarModalAgregarItem() {
    this.modalItemAbierto = false;
    this.lineaTemporal = this.nuevoDetalle();
    this.detalleEditIndex = -1;
  }
  
  contarCotizacionesPorSolicitud(solicitudId: number | undefined): number {
    if (!solicitudId) return 0;
    return this.cotizaciones.filter(c => c.idSolicitudCotizacion === solicitudId).length;
  }
  
  obtenerClaseEstadoSolicitud(estado: string): string {
    const clases: { [key: string]: string } = {
      PENDIENTE: 'bg-warning',
      GENERADA: 'bg-primary',
      EN_REVISION: 'bg-info',
      CERRADA: 'bg-success',
    };
    return clases[estado] || 'bg-secondary';
  }
  
  eliminarItemCotizacion(index: number) {
    this.detalleCotizacion.splice(index, 1);
  }
  
  async guardarCotizacionManual() {
    try {
      if (!this.cotizacion.proveedor) {
        this.alertService.showAlert('Atención', 'Debe seleccionar un proveedor.', 'warning');
        return;
      }
      
      if (this.detalleCotizacion.length === 0) {
        this.alertService.showAlert('Atención', 'Debe agregar al menos un item.', 'warning');
        return;
      }
      
      this.cotizacion.numeroCotizacion = this.generarNumeroCotizacion();
      this.cotizacion.detalle = this.detalleCotizacion;
      
      await this.dexieService.saveCotizacion(this.cotizacion);
      
      this.alertService.showAlert('Éxito', 'Cotización guardada correctamente.', 'success');
      this.mostrarFormulario = false;
      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      this.alertService.showAlert('Error', 'Ocurrió un error al guardar la cotización.', 'error');
    }
  }
  
  async verResumenGanadoras() {
    const resumen = `
RESUMEN DE COTIZACIONES GANADORAS
================================

Total de cotizaciones ganadoras: ${this.cotizacionesGanadoras.length}
Monto total acumulado: ${this.formatearMoneda(this.totalMontoGanadoras, 'PEN')}
Solicitudes generadas: ${this.totalSolicitudesGeneradas}
Plazo promedio de entrega: ${this.promedioPlazoEntrega} días

Proveedores seleccionados:
${this.cotizacionesGanadoras.map(c => `- ${c.nombreProveedor} (${c.numeroCotizacion})`).join('\n')}
    `;
    
    this.alertService.showAlert('Resumen de Cotizaciones Ganadoras', resumen, 'info');
  }
  
  async abrirComparacionPorSolicitudYEvaluar(solicitud: SolicitudCotizacion) {
    try {
      // Filtrar cotizaciones de esta solicitud
      this.cotizacionesComparativo = this.cotizaciones.filter(
        c => c.idSolicitudCotizacion === solicitud.id && c.estado !== 'RECHAZADA'
      );
      
      if (this.cotizacionesComparativo.length < 2) {
        this.alertService.showAlert(
          'Atención',
          'Se necesitan al menos 2 cotizaciones para comparar.',
          'warning'
        );
        return;
      }
      
      // Establecer la solicitud seleccionada
      this.solicitudCotizacionSeleccionada = solicitud;
      
      // Cambiar al tab de comparación
      this.tabActiva = 'COMPARACION';
      
      console.log('📊 Cotizaciones para comparar:', this.cotizacionesComparativo);
    } catch (error) {
      console.error('Error al abrir comparación:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al cargar las cotizaciones para comparar.',
        'error'
      );
    }
  }
  
  verificarYEvaluarCotizaciones() {
    // Implementación vacía por ahora
  }
  
  tieneOrdenFromMap(cotizacionId: number): boolean {
    return this.numerosOrden.has(cotizacionId);
  }
  
  getNumeroOrdenFromMap(cotizacionId: number): string {
    return this.numerosOrden.get(cotizacionId) || '';
  }
  
  obtenerTipoSolicitud(cotizacion: Cotizacion): string {
    const solicitud = this.solicitudesCotizacion.find(s => s.id === cotizacion.idSolicitudCotizacion);
    return solicitud?.tipo || 'COMPRA';
  }

  async verSolicitudGenerada(cotizacion: Cotizacion) {
    try {
      const tipoSolicitud = this.obtenerTipoSolicitud(cotizacion);
      
      if (tipoSolicitud === 'SERVICIO') {
        // Obtener el número de solicitud de servicio desde el Map
        const numeroSolicitudServicio = this.numerosOrden.get(cotizacion.id!);
        
        if (!numeroSolicitudServicio) {
          this.alertService.showAlert(
            'Información',
            'No se encontró la solicitud de servicio asociada a esta cotización.',
            'info'
          );
          return;
        }
        
        // Buscar en solicitudes de servicio por el número correcto
        const solicitudesServicio = await this.dexieService.solicitudesServicio.toArray();
        const solicitud = solicitudesServicio.find(s => 
          s.numeroSolicitud === numeroSolicitudServicio
        );
        
        if (solicitud) {
          this.alertService.showAlert(
            'Solicitud de Servicio Generada',
            `Número: ${solicitud.numeroSolicitud}\n` +
            `Fecha: ${this.formatearFecha(solicitud.fecha)}\n` +
            `Proveedor: ${solicitud.empresa || 'No especificado'}\n` +
            `Monto Estimado: ${this.formatearMoneda(solicitud.montoEstimado || 0, solicitud.moneda || 'PEN')}\n` +
            `Estado: ${solicitud.estado}`,
            'success'
          );
        } else {
          this.alertService.showAlert(
            'Información',
            'No se encontró la solicitud de servicio asociada a esta cotización.',
            'info'
          );
        }
      } else {
        // Buscar en solicitudes de compra
        const solicitudes = await this.dexieService.showSolicitudesCompra();
        const solicitud = solicitudes.find(s => 
          s.numeroSolicitud === cotizacion.numeroSolicitud ||
          (s.observaciones && s.observaciones.includes(cotizacion.numeroCotizacion))
        );
        
        if (solicitud) {
          const proveedorMatch = solicitud.observaciones?.match(/proveedor\s+([^\.]+)/i);
          const nombreProveedor = proveedorMatch ? proveedorMatch[1] : 'No especificado';
          
          this.alertService.showAlert(
            'Solicitud de Compra Generada',
            `Número: ${solicitud.numeroSolicitud}\n` +
            `Fecha: ${this.formatearFecha(solicitud.fecha)}\n` +
            `Proveedor: ${nombreProveedor}\n` +
            `Monto Estimado: ${this.formatearMoneda(solicitud.montoEstimado || 0, solicitud.moneda || 'PEN')}\n` +
            `Estado: ${solicitud.estado}`,
            'success'
          );
        } else {
          this.alertService.showAlert(
            'Información',
            'No se encontró la solicitud de compra asociada a esta cotización.',
            'info'
          );
        }
      }
    } catch (error) {
      console.error('Error al buscar solicitud:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al buscar la solicitud de compra.',
        'error'
      );
    }
  }
  
  descargarCotizacion(cotizacion: Cotizacion) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Encabezado
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('COTIZACIÓN GANADORA', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Información de la cotización
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Número: ${cotizacion.numeroCotizacion || 'COT-' + (cotizacion.id || 'N/A')}`, 15, yPos);
      yPos += 6;
      doc.text(`Fecha: ${cotizacion.fecha ? this.formatearFecha(cotizacion.fecha) : 'Sin fecha'}`, 15, yPos);
      yPos += 6;
      doc.text(`Solicitud: ${cotizacion.numeroSolicitud || 'SOL-' + (cotizacion.idSolicitudCotizacion || 'N/A')}`, 15, yPos);
      yPos += 10;

      // Información del proveedor
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PROVEEDOR', 15, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${cotizacion.nombreProveedor || 'N/A'}`, 15, yPos);
      yPos += 6;
      doc.text(`RUC: ${cotizacion.rucProveedor || 'N/A'}`, 15, yPos);
      yPos += 6;
      doc.text(`Forma de Pago: ${cotizacion.formaPago || 'N/A'}`, 15, yPos);
      yPos += 6;
      doc.text(`Plazo de Entrega: ${cotizacion.plazoEntrega || 0} días`, 15, yPos);
      yPos += 10;

      // Detalle de items
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE ITEMS', 15, yPos);
      yPos += 6;

      if (cotizacion.detalle && cotizacion.detalle.length > 0) {
        const tableData = cotizacion.detalle.map((item, index) => [
          (index + 1).toString(),
          item.codigo || 'N/A',
          item.descripcion || 'N/A',
          item.cantidad?.toString() || '0',
          item.unidadMedida || 'UND',
          this.formatearMoneda(item.precioUnitario || 0, cotizacion.moneda),
          this.formatearMoneda(item.total || 0, cotizacion.moneda)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Código', 'Descripción', 'Cantidad', 'U.M.', 'P. Unitario', 'Total']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 25 },
            2: { cellWidth: 60 },
            3: { cellWidth: 20, halign: 'right' },
            4: { cellWidth: 15, halign: 'center' },
            5: { cellWidth: 25, halign: 'right' },
            6: { cellWidth: 25, halign: 'right' }
          },
          didDrawPage: (data) => {
            yPos = data.cursor?.y || yPos;
          }
        });

        yPos += 10;
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('No hay items en esta cotización', 15, yPos);
        yPos += 10;
      }

      // Totales
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const montoTotal = cotizacion.montoTotal || 0;
      const montoTexto = `MONTO TOTAL: ${this.formatearMoneda(montoTotal, cotizacion.moneda)}`;
      doc.text(montoTexto, pageWidth - 15, yPos, { align: 'right' });

      // Pie de página
      const fechaGeneracion = new Date().toLocaleString('es-PE');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Generado el: ${fechaGeneracion}`, 15, pageHeight - 10);
      doc.text('Sistema de Logística - HASS', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Descargar
      const fileName = `Cotizacion_${cotizacion.numeroCotizacion || cotizacion.id}_${Date.now()}.pdf`;
      doc.save(fileName);

      this.alertService.showAlert('Éxito', 'PDF descargado correctamente', 'success');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.alertService.showAlert('Error', 'No se pudo generar el PDF', 'error');
    }
  }
  
  obtenerDetalleCotizacion(cotizacion: Cotizacion, codigoItem: string): DetalleCotizacion | null {
    if (!cotizacion.detalle || cotizacion.detalle.length === 0) {
      return null;
    }
    return cotizacion.detalle.find(d => d.codigo === codigoItem) || null;
  }
  
  async seleccionarProveedorGanador(cotizacion: Cotizacion) {
    await this.seleccionarCotizacion(cotizacion);
  }
  
  onProveedorChange(event: any) {
    if (event) {
      const proveedor = this.proveedores.find(p => p.id === event);
      if (proveedor) {
        this.cotizacion.proveedor = proveedor.id;
        this.cotizacion.nombreProveedor = proveedor.proveedor || proveedor.nombre;
        this.cotizacion.rucProveedor = proveedor.ruc;
      }
    }
  }
  
  onProveedorSelected(event: any) {
    if (event) {
      this.cotizacion.proveedor = event.id;
      this.cotizacion.nombreProveedor = event.proveedor || event.nombre;
      this.cotizacion.rucProveedor = event.ruc;
    }
  }
  
  getProveedorRUC(id: string): string {
    const proveedor = this.proveedores.find(p => p.id === id);
    return proveedor ? proveedor.ruc : '';
  }
  
  onItemSelected(event: any) {
    if (event) {
      this.lineaTemporal.codigo = event.codigo || String(event.id);
      this.lineaTemporal.descripcion = event.descripcion || '';
      this.lineaTemporal.unidadMedida = event.um || 'UND';
    }
  }
  
  async onComoditySelected(event: any) {
    if (event) {
      this.comoditySeleccionado = event;
      // Cargar subcomodities si es necesario
      if (event.id) {
        const todasLasSubClasificaciones = await this.dexieService.showSubClasificaciones();
        this.subComoditiesFiltrados = todasLasSubClasificaciones.filter(
          sub => sub.comodityId === event.id
        );
      }
    }
  }
  
  onSubComoditySelected(event: any) {
    if (event && this.comoditySeleccionado) {
      this.lineaTemporal.codigo = event.subClase || this.comoditySeleccionado.codigo;
      this.lineaTemporal.descripcion = `${this.comoditySeleccionado.descripcion} - ${event.descripcion || ''}`;
      this.lineaTemporal.unidadMedida = event.unidad || 'UND';
    }
  }
  
  calcularMontos(detalle: DetalleCotizacion) {
    detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
    
    if (detalle.porcentajeDescuento > 0) {
      detalle.descuento = (detalle.subtotal * detalle.porcentajeDescuento) / 100;
    } else {
      detalle.descuento = 0;
    }
    
    const baseImponible = detalle.subtotal - detalle.descuento;
    detalle.impuesto = (baseImponible * detalle.porcentajeImpuesto) / 100;
    detalle.total = baseImponible + detalle.impuesto;
  }
  
  calcularTotales() {
    this.cotizacion.montoTotal = this.detalleCotizacion.reduce(
      (sum, d) => sum + d.total,
      0
    );
  }
}
