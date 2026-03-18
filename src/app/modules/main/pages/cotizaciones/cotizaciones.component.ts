import { Component, OnInit, ViewChild } from '@angular/core';
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
import {
  Cotizacion,
  DetalleCotizacion,
  SolicitudCompra,
  DetalleSolicitudCompra,
  Usuario,
  SolicitudCotizacion,
  DetalleSolicitudCotizacion,
  OrdenCompra,
  DetalleOrdenCompra,
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
  @ViewChild('dt') table!: Table;
  
  // Tabs
  tabActiva: 'SOLICITUDES' | 'COTIZACIONES' | 'GANADORES' | 'COMPARACION' = 'SOLICITUDES';
  
  // Loading
  loading: boolean = false;
  
  // Listas principales
  solicitudesCotizacion: SolicitudCotizacion[] = [];
  cotizaciones: Cotizacion[] = [];
  solicitudesCompra: SolicitudCompra[] = [];
  cotizacionesGanadoras: Cotizacion[] = [];
  
  // Mapa para almacenar los números de orden de las cotizaciones ganadoras
  numerosOrden: Map<number, string> = new Map();
  
  // Lista de proveedores del ERP
  proveedores: any[] = [];

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;

  // Cotización actual
  cotizacion: Cotizacion = this.nuevaCotizacion();
  detalleCotizacion: DetalleCotizacion[] = [];

  // Línea temporal para edición de detalle
  lineaTemporal: DetalleCotizacion = this.nuevoDetalle();
  modalDetalleAbierto = false;
  detalleEditIndex = -1;

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

  // Solicitud seleccionada
  solicitudSeleccionada: SolicitudCompra | null = null;
  solicitudCotizacionSeleccionada: SolicitudCotizacion | null = null;

  // Filtros
  filtroEstado: string = 'TODAS';
  filtroProveedor: string = '';
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;

  // Contadores
  totalRecibidas = 0;
  totalEnEvaluacion = 0;
  totalSeleccionadas = 0;
  totalRechazadas = 0;
  
  // Contadores de solicitudes
  totalSolicitudesPendientes = 0;
  totalSolicitudesEnRevision = 0;
  totalSolicitudesCerradas = 0;

  // Getters para estadísticas de cotizaciones ganadoras
  get totalMontoGanadoras(): number {
    return this.cotizacionesGanadoras.reduce((sum, c) => sum + c.montoTotal, 0);
  }

  get totalSolicitudesGeneradas(): number {
    // Este valor se actualizará en actualizarCotizacionesGanadoras
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

  // Variable privada para almacenar el total de solicitudes generadas
  private _totalSolicitudesGeneradas = 0;

  // Modal comparativo
  modalComparativoAbierto = false;
  cotizacionesComparativo: Cotizacion[] = [];

  // Modal detalle cotización
  modalDetalleCotizacionAbierto = false;
  cotizacionDetalle: Cotizacion | null = null;
  
  // Modal detalle solicitud
  modalDetalleSolicitudAbierto = false;
  
  // Modal registrar cotización desde solicitud
  modalRegistrarCotizacionAbierto = false;
  
  // Modal nueva cotización manual
  modalNuevaCotizacionAbierto = false;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService,
    private utilsService: UtilsService,
    private maestrasService: MaestrasService,
    private cotizacionesService: CotizacionesService,
    private consolidacionService: ConsolidacionService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarProveedores();
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
      console.log('🔍 Cargando proveedores...');
      console.log('👤 Usuario:', this.usuario);
      
      const body = { 
        sociedad: this.usuario?.sociedad || '001',
        idproyecto: this.usuario?.idProyecto
      };
      
      console.log('📤 Enviando request con body:', body);
      const response = await this.maestrasService.getProveedores(body).toPromise();
      console.log('📥 Response:', response);
      
      if (response && Array.isArray(response)) {
        this.proveedores = response;
        console.log('✅ Proveedores cargados:', this.proveedores.length);
        console.log('📊 Primer proveedor:', this.proveedores[0]);
      } else if (response && response.data) {
        this.proveedores = response.data;
        console.log('✅ Proveedores cargados desde data:', this.proveedores.length);
        console.log('📊 Primer proveedor:', this.proveedores[0]);
      } else {
        console.log('❌ No se encontró response.data ni array directo');
      }
    } catch (error) {
      console.error('❌ Error cargando proveedores:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudieron cargar los proveedores del ERP',
        'error'
      );
    }
  }

  onProveedorChange(event: any) {
    const proveedorSeleccionado = this.proveedores.find(p => p.id === event);
    if (proveedorSeleccionado) {
      this.cotizacion.proveedor = proveedorSeleccionado.id;
      this.cotizacion.nombreProveedor = proveedorSeleccionado.proveedor;
      this.cotizacion.rucProveedor = proveedorSeleccionado.ruc;
    }
  }

  onProveedorSelected(event: any) {
    if (event) {
      this.cotizacion.proveedor = event.id;
      this.cotizacion.nombreProveedor = event.proveedor;
      this.cotizacion.rucProveedor = event.ruc;
    }
  }

  getProveedorRUC(id: string): string {
    const proveedor = this.proveedores.find(p => p.id === id);
    return proveedor ? proveedor.ruc : '';
  }

  async cargarCotizaciones() {
    console.log('🔍 Cargando cotizaciones desde backend...');
    
    try {
      // Cargar desde backend
      const filtros = {
        sociedad: this.usuario?.sociedad || '001',
        idproyecto: this.usuario?.idProyecto
      };
      
      // const cotizacionesBackend = await this.cotizacionesService.listarCotizaciones(filtros);
      // console.log('📊 Cotizaciones desde backend:', cotizacionesBackend);

      // Por:
      const response = await this.cotizacionesService.listarCotizaciones(filtros);
      let cotizacionesBackend = [];
      
      if (typeof response === 'string') {
        cotizacionesBackend = JSON.parse(response);
      } else {
        cotizacionesBackend = response;
      }
      
      // Obtener cotizaciones locales para preservar estados
      const cotizacionesLocales = await this.dexieService.showCotizaciones();
      const mapaEstadosLocales = new Map();
      
      // Crear mapa de estados locales
      for (const local of cotizacionesLocales) {
        if (local.id) {
          mapaEstadosLocales.set(local.id, {
            estado: local.estado,
            seleccionada: local.seleccionada,
            usuarioEvalua: local.usuarioEvalua,
            fechaEvaluacion: local.fechaEvaluacion,
            motivoRechazo: local.motivoRechazo
          });
        }
      }
      
      // Limpiar y guardar en Dexie
      await this.dexieService.cotizaciones.clear();
      
      // Guardar cada cotización preservando estados locales
      for (const cot of cotizacionesBackend) {
        console.log('📋 Cotización del backend:', cot);
        console.log('🔍 Propiedades:', Object.keys(cot));
        console.log('📝 numeroCotizacion:', cot.numeroCotizacion);
        console.log('📝 numeroSolicitud:', cot.numeroSolicitud);
        console.log('📝 id:', cot.id);
        
        // Parsear detalles si vienen como string
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
        
        // Crear objeto de cotización
        // Generar número de cotización si no existe
        const numeroCotizacionGenerado = cot.numeroCotizacion || 
          (cot.numeroSolicitud ? `COT-${cot.numeroSolicitud}` : `COT-${cot.id}`);
        
        // Log para depurar fecha
        if (!cot.fecha || cot.fecha === '') {
          console.warn('⚠️ Sin fecha para cotización ID:', cot.id);
        }
        
        const cotizacion: Cotizacion = {
          id: cot.id,
          numeroCotizacion: numeroCotizacionGenerado,
          fecha: cot.fecha || new Date().toISOString(), // Usar fecha actual si no viene
          fechaVencimiento: cot.fechaVencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días por defecto
          proveedor: cot.proveedor,
          nombreProveedor: cot.nombreProveedor,
          rucProveedor: cot.rucProveedor,
          montoTotal: cot.montoTotal,
          moneda: cot.moneda,
          plazoEntrega: cot.plazoEntrega,
          lugarEntrega: cot.lugarEntrega,
          formaPago: cot.formaPago,
          condicionesPago: cot.condicionesPago,
          garantia: cot.garantia,
          validezOferta: cot.validezOferta,
          estado: cot.estado || 'RECIBIDA', // Estado del backend
          seleccionada: cot.seleccionada || false,
          usuarioEvalua: cot.usuarioEvalua,
          fechaEvaluacion: cot.fechaEvaluacion,
          motivoRechazo: cot.motivoRechazo,
          detalle: detalleParsed,
          solicitudCompraId: cot.solicitudCompraId,
          numeroSolicitud: cot.numeroSolicitud,
          idSolicitudCotizacion: cot.idSolicitudCotizacion,
          usuarioRegistra: cot.usuarioRegistra
        };
        
        // Log para depurar
        if (cot.numeroCotizacion === 'GANADORA' || cot.numeroCotizacion === 'ganadora') {
          console.warn('⚠️ El backend está devolviendo "GANADORA" en numeroCotizacion para el ID:', cot.id);
          console.warn('📋 Objeto completo del backend:', cot);
        }
        
        // Restaurar estados locales si existen
        const estadoLocal = mapaEstadosLocales.get(cot.id);
        if (estadoLocal) {
          cotizacion.estado = estadoLocal.estado;
          cotizacion.seleccionada = estadoLocal.seleccionada;
          cotizacion.usuarioEvalua = estadoLocal.usuarioEvalua;
          cotizacion.fechaEvaluacion = estadoLocal.fechaEvaluacion;
          cotizacion.motivoRechazo = estadoLocal.motivoRechazo;
        }
        
        await this.dexieService.saveCotizacion(cotizacion);
      }
      
      this.cotizaciones = await this.dexieService.showCotizaciones();
      console.log('📊 Cotizaciones guardadas en Dexie:', this.cotizaciones.length);
    } catch (error) {
      console.error('❌ Error al cargar cotizaciones desde backend:', error);
      // Si hay error, cargar desde Dexie como fallback
      this.cotizaciones = await this.dexieService.showCotizaciones();
      console.log('📊 Cargando desde Dexie como fallback:', this.cotizaciones.length);
    }
    
    this.actualizarContadores();
    this.actualizarCotizacionesGanadoras();
  }

  async cambiarTabGanadores() {
    console.log('🔄 Cambiando al tab de cotizaciones ganadoras...');
    // Recargar datos antes de cambiar al tab
    await this.cargarCotizaciones();
    await this.actualizarCotizacionesGanadoras();
    // Cambiar al tab
    this.tabActiva = 'GANADORES';
  }

  async onTabChange(event: any) {
    // Si se cambia al tab de ganadores, actualizar los datos
    if (event.index === 3) { // Tab GANADORES
      console.log('🔄 Cambiando al tab de cotizaciones ganadoras...');
      await this.cargarCotizaciones();
      this.actualizarCotizacionesGanadoras();
    }
  }

  async actualizarCotizacionesGanadoras() {
    console.log('🔍 Actualizando cotizaciones ganadoras...');
    console.log('Total de cotizaciones:', this.cotizaciones.length);
    
    // Filtrar cotizaciones seleccionadas como ganadoras
    this.cotizacionesGanadoras = this.cotizaciones.filter(c => c.estado === 'SELECCIONADA');
    console.log('Cotizaciones con estado SELECCIONADA:', this.cotizacionesGanadoras.length);
    
    // Limpiar el mapa
    this.numerosOrden.clear();
    
    // Verificar cuántas tienen solicitud generada y llenar el mapa
    let conSolicitud = 0;
    const solicitudes = await this.dexieService.showSolicitudesCompra();
    console.log('Total de solicitudes en Dexie:', solicitudes.length);
    
    for (const cotizacion of this.cotizacionesGanadoras) {
      console.log('Buscando solicitud para cotización:', cotizacion.numeroCotizacion);
      // Buscar solicitud por número de solicitud o por coincidencia en observaciones
      const solicitud = solicitudes.find(s => 
        s.numeroSolicitud === cotizacion.numeroSolicitud ||
        (s.observaciones && s.observaciones.includes(cotizacion.numeroCotizacion))
      );
      if (solicitud) {
        console.log('✅ Solicitud encontrada:', solicitud.numeroSolicitud);
        conSolicitud++;
        this.numerosOrden.set(cotizacion.id!, solicitud.numeroSolicitud);
      } else {
        console.log('❌ No se encontró solicitud para la cotización');
      }
    }
    
    this._totalSolicitudesGeneradas = conSolicitud;
    console.log('Total de solicitudes generadas:', this._totalSolicitudesGeneradas);
  }

  async cargarSolicitudesCompra() {
    // Cargar todas las solicitudes para poder encontrar la asociada a la cotización
    this.solicitudesCompra = await this.dexieService.showSolicitudesCompra();
    console.log('📊 Solicitudes de compra cargadas:', this.solicitudesCompra.length);
  }

  async cargarSolicitudesCotizacion() {
    console.log('🔍 Cargando solicitudes de cotización desde backend...');
    
    try {
      // Cargar desde backend
      const filtros = {
        sociedad: this.usuario?.sociedad || '001',
        idproyecto: this.usuario?.idProyecto
      };
      
      const solicitudesBackend = await this.consolidacionService.listarSolicitudesCotizacion(filtros);
      console.log('📊 Solicitudes desde backend:', solicitudesBackend);
      
      // Limpiar y guardar en Dexie
      await this.dexieService.solicitudesCotizacion.clear();
      await this.dexieService.detalleSolicitudCotizacion.clear();
      
      // Guardar cada solicitud con sus detalles
      for (const sol of solicitudesBackend) {
        // Parsear el detalle si viene como string
        let detalleParsed = [];
        if (sol.detalle) {
          if (typeof sol.detalle === 'string') {
            try {
              detalleParsed = JSON.parse(sol.detalle);
            } catch (e) {
              console.error('Error al parsear detalle:', sol.detalle);
              detalleParsed = [];
            }
          } else {
            detalleParsed = sol.detalle;
          }
        }
        
        const solicitudDexie: SolicitudCotizacion = {
          id: sol.id,
          noSolicitud: sol.noSolicitud,
          idConsolidacion: sol.idConsolidacion,
          fechaGeneracion: sol.fechaGeneracion,
          fechaLimite: sol.fechaLimite,
          usuarioGenera: sol.usuarioGenera,
          totalItems: sol.totalItems,
          estado: sol.estado,
          observaciones: sol.observaciones,
          cotizacionesRecibidas: sol.cotizacionesRecibidas,
          fechaModificacion: sol.fechaModificacion,
          usuarioModifica: sol.usuarioModifica,
          detalle: detalleParsed
        };
        
        await this.dexieService.saveSolicitudCotizacion(solicitudDexie);
      }
      
      // Cargar desde Dexie para tener los datos consistentes
      this.solicitudesCotizacion = await this.dexieService.showSolicitudesCotizacion();
      console.log('📊 Solicitudes guardadas en Dexie:', this.solicitudesCotizacion);
      console.log('📊 Total de solicitudes:', this.solicitudesCotizacion.length);
      
    } catch (error) {
      console.error('❌ Error al cargar solicitudes desde backend:', error);
      // Si hay error, cargar desde Dexie como fallback
      this.solicitudesCotizacion = await this.dexieService.showSolicitudesCotizacion();
      console.log('📊 Cargando desde Dexie como fallback:', this.solicitudesCotizacion);
    }
    
    this.actualizarContadoresSolicitudes();
  }

  // MÉTODO TEMPORAL PARA CREAR DATOS DE PRUEBA - ELIMINAR DESPUÉS
  async crearSolicitudPrueba() {
    console.log('🧪 Creando solicitud de prueba...');
    
    const solicitud: SolicitudCotizacion = {
      noSolicitud: 'SC-TEST-' + Date.now(),
      idConsolidacion: 1,
      fechaGeneracion: new Date().toISOString(),
      usuarioGenera: this.usuario?.documentoidentidad || 'TEST_USER',
      totalItems: 1,
      estado: 'PENDIENTE',
      detalle: [
        {
          noLinea: 1,
          codigoItem: '002482',
          descripcionItem: 'SANIX - Producto de prueba',
          cantidad: 40,
          unidadMedida: 'KG'
        }
      ]
    };

    console.log('📝 Solicitud a guardar:', solicitud);

    try {
      const id = await this.dexieService.saveSolicitudCotizacion(solicitud);
      console.log('✅ Solicitud de prueba creada con ID:', id);
      
      // Verificar que se guardó
      await this.cargarSolicitudesCotizacion();
      
      this.alertService.showAlert(
        'Éxito',
        `Solicitud de prueba ${solicitud.noSolicitud} creada correctamente.`,
        'success'
      );
    } catch (error) {
      console.error('❌ Error al crear solicitud de prueba:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudo crear la solicitud de prueba: ' + error,
        'error'
      );
    }
  }

  actualizarContadores() {
    this.totalRecibidas = this.cotizaciones.filter(
      (c) => c.estado === 'RECIBIDA'
    ).length;
    this.totalEnEvaluacion = this.cotizaciones.filter(
      (c) => c.estado === 'EN_EVALUACION'
    ).length;
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

  contarCotizacionesPorSolicitud(solicitudId: number | undefined): number {
    if (!solicitudId) return 0;
    return this.cotizaciones.filter(c => c.idSolicitudCotizacion === solicitudId).length;
  }

  nuevaCotizacion(): Cotizacion {
    return {
      numeroCotizacion: '',
      solicitudCompraId: 0,
      numeroSolicitud: '',
      proveedor: '',
      nombreProveedor: '',
      rucProveedor: '',
      fecha: new Date().toISOString(),
      fechaVencimiento: '',
      montoTotal: 0,
      moneda: 'PEN',
      plazoEntrega: 0,
      condicionesPago: '',
      validezOferta: 30,
      formaPago: 'CONTADO',
      lugarEntrega: '',
      detalle: [],
      estado: 'RECIBIDA',
      seleccionada: false,
      usuarioRegistra: this.usuario?.documentoidentidad || '',
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
      descuento: 0,
      porcentajeDescuento: 0,
      subtotal: 0,
      impuesto: 0,
      porcentajeImpuesto: 18,
      total: 0,
    };
  }

  nuevaCotizacionForm() {
    this.cotizacion = this.nuevaCotizacion();
    this.detalleCotizacion = [];
    this.solicitudSeleccionada = null;
    this.mostrarFormulario = true;
    this.modoEdicion = false;
  }

  async onSolicitudChange() {
    if (!this.cotizacion.solicitudCompraId) return;

    const solicitud = this.solicitudesCompra.find(
      (s) => s.id === this.cotizacion.solicitudCompraId
    );

    if (solicitud) {
      this.solicitudSeleccionada = solicitud;
      this.cotizacion.numeroSolicitud = solicitud.numeroSolicitud;

      // Cargar items de la solicitud como base para la cotización
      this.detalleCotizacion = solicitud.detalle.map((item) => ({
        cotizacionId: 0,
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        unidadMedida: item.unidadMedida,
        precioUnitario: 0,
        descuento: 0,
        porcentajeDescuento: 0,
        subtotal: 0,
        impuesto: 0,
        porcentajeImpuesto: 18,
        total: 0,
      }));
    }
  }

  agregarDetalle() {
    if (!this.lineaTemporal.codigo) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el código del item.',
        'warning'
      );
      return;
    }

    if (this.lineaTemporal.cantidad <= 0) {
      this.alertService.showAlert(
        'Atención',
        'La cantidad debe ser mayor a 0.',
        'warning'
      );
      return;
    }

    if (this.lineaTemporal.precioUnitario <= 0) {
      this.alertService.showAlert(
        'Atención',
        'El precio unitario debe ser mayor a 0.',
        'warning'
      );
      return;
    }

    // Calcular montos
    this.calcularMontos(this.lineaTemporal);

    if (this.detalleEditIndex >= 0) {
      // Editar
      this.detalleCotizacion[this.detalleEditIndex] = { ...this.lineaTemporal };
      this.detalleEditIndex = -1;
    } else {
      // Agregar nuevo
      this.detalleCotizacion.push({ ...this.lineaTemporal });
    }

    this.lineaTemporal = this.nuevoDetalle();
    this.modalDetalleAbierto = false;
    this.calcularTotales();
  }

  calcularMontos(detalle: DetalleCotizacion) {
    // Subtotal
    detalle.subtotal = detalle.cantidad * detalle.precioUnitario;

    // Descuento
    if (detalle.porcentajeDescuento > 0) {
      detalle.descuento = (detalle.subtotal * detalle.porcentajeDescuento) / 100;
    }

    // Base imponible
    const baseImponible = detalle.subtotal - detalle.descuento;

    // Impuesto
    detalle.impuesto = (baseImponible * detalle.porcentajeImpuesto) / 100;

    // Total
    detalle.total = baseImponible + detalle.impuesto;
  }

  calcularTotales() {
    this.cotizacion.montoTotal = this.detalleCotizacion.reduce(
      (sum, d) => sum + d.total,
      0
    );
  }

  editarDetalle(index: number) {
    this.lineaTemporal = { ...this.detalleCotizacion[index] };
    this.detalleEditIndex = index;
    this.modalDetalleAbierto = true;
  }

  eliminarDetalle(index: number) {
    this.detalleCotizacion.splice(index, 1);
    this.calcularTotales();
  }

  abrirModalDetalle() {
    this.lineaTemporal = this.nuevoDetalle();
    this.detalleEditIndex = -1;
    this.modalDetalleAbierto = true;
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.lineaTemporal = this.nuevoDetalle();
    this.detalleEditIndex = -1;
  }

  async guardarCotizacion() {
    if (!this.cotizacion.solicitudCompraId) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar una solicitud de compra.',
        'warning'
      );
      return;
    }

    if (!this.cotizacion.proveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el código del proveedor.',
        'warning'
      );
      return;
    }

    if (!this.cotizacion.nombreProveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el nombre del proveedor.',
        'warning'
      );
      return;
    }

    if (this.detalleCotizacion.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe agregar al menos un item a la cotización.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      if (!this.modoEdicion) {
        this.cotizacion.numeroCotizacion = this.generarNumeroCotizacion();
      }

      this.cotizacion.detalle = [...this.detalleCotizacion];
      this.cotizacion.usuarioRegistra = this.usuario.documentoidentidad;

      await this.dexieService.saveCotizacion(this.cotizacion);

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Cotización guardada correctamente.',
        'success'
      );

      this.mostrarFormulario = false;
      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar la cotización.',
        'error'
      );
    }
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

  editarCotizacion(index: number) {
    const cotizacion = this.cotizacionesFiltradas()[index];
    if (!cotizacion) return;

    this.cotizacion = { ...cotizacion };
    this.detalleCotizacion = [...(cotizacion.detalle || [])];
    this.modoEdicion = true;
    this.editIndex = index;
    this.mostrarFormulario = true;

    // Cargar solicitud
    this.solicitudSeleccionada =
      this.solicitudesCompra.find((s) => s.id === cotizacion.solicitudCompraId) ||
      null;
  }

  async eliminarCotizacion(index: number) {
    const cotizacion = this.cotizacionesFiltradas()[index];
    if (!cotizacion) return;

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Está seguro de eliminar esta cotización?',
      'warning'
    );

    if (!confirmacion) return;

    try {
      await this.dexieService.cotizaciones.delete(cotizacion.id!);

      this.alertService.showAlert(
        'Éxito',
        'Cotización eliminada correctamente.',
        'success'
      );

      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al eliminar cotización:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar la cotización.',
        'error'
      );
    }
  }

  async generarSolicitudDesdeCotizacion(cotizacion: Cotizacion) {
    try {
      // Validar que la cotización tenga detalles
      if (!cotizacion.detalle || cotizacion.detalle.length === 0) {
        console.error('La cotización no tiene detalles');
        return;
      }

      // Verificar que no exista ya una solicitud para esta cotización
      const solicitudes = await this.dexieService.showSolicitudesCompra();
      const solicitudExistente = solicitudes.find(s => 
        s.numeroSolicitud === cotizacion.numeroSolicitud && 
        s.estado !== 'RECHAZADA'
      );
      
      if (solicitudExistente) {
        console.log('Ya existe una solicitud para esta cotización');
        return;
      }

      // Generar número de solicitud
      const numeroSolicitud = this.generarNumeroSolicitud();

      // Crear detalles de la solicitud
      const detallesSolicitud: DetalleSolicitudCompra[] = cotizacion.detalle.map(det => ({
        id: 0, // Se asignará automáticamente por Dexie
        solicitudCompraId: 0, // Se actualizará después de crear la solicitud
        codigo: det.codigo,
        descripcion: det.descripcion,
        cantidad: det.cantidad,
        cantidadAprobada: det.cantidad,
        cantidadAtendida: 0,
        unidadMedida: det.unidadMedida || 'UND',
        precioReferencial: det.precioUnitario || 0,
        montoReferencial: (det.precioUnitario || 0) * det.cantidad,
        proyecto: '', // Se asignará después de obtener del requerimiento
        ceco: '', // Se asignará después de obtener del requerimiento
        turno: '', // No se usa en compras
        labor: '', // No se usa en compras
        especificacionesTecnicas: det.especificaciones || '',
        estado: 'PENDIENTE',
      }));

      // Calcular montos totales
      const montoEstimado = detallesSolicitud.reduce((sum, d) => sum + (d.montoReferencial || 0), 0);

      // Obtener datos del requerimiento original (almacen, proyecto, CECCO)
      let almacen = '001'; // Valor por defecto
      let idAlmacen = 1;
      let proyecto = this.usuario.idProyecto || '';
      let ceco = '';
      
      console.log('🔍 Datos iniciales - Cotización:', {
        id: cotizacion.id,
        idSolicitudCotizacion: cotizacion.idSolicitudCotizacion,
        numeroSolicitud: cotizacion.numeroSolicitud
      });
      
      if (cotizacion.idSolicitudCotizacion) {
        // Buscar la solicitud de cotización para obtener la consolidación
        const solicitudCotizacion = await this.dexieService.solicitudesCotizacion
          .where('id')
          .equals(cotizacion.idSolicitudCotizacion)
          .first();
        
        console.log('📋 Solicitud de cotización encontrada:', solicitudCotizacion);
        
        if (solicitudCotizacion && solicitudCotizacion.idConsolidacion) {
          console.log('📦 ID Consolidación:', solicitudCotizacion.idConsolidacion);
          
          try {
            // Obtener la consolidación para acceder a sus detalles
            const consolidacion = await this.consolidacionService.obtenerConsolidacion(solicitudCotizacion.idConsolidacion);
            console.log('📊 Consolidación obtenida:', consolidacion);
            
            if (consolidacion && consolidacion.detalles && consolidacion.detalles.length > 0) {
              // Obtener el primer detalle para encontrar el origen
              const primerDetalle = consolidacion.detalles[0];
              console.log('📝 Primer detalle:', primerDetalle);
              
              if (primerDetalle.origenes && primerDetalle.origenes.length > 0) {
                const origen = primerDetalle.origenes[0];
                console.log('🔎 Origen encontrado:', origen);
                
                // Si el origen es un requerimiento de consumo, obtener sus detalles
                if (origen.tipoOrigen === 'CONSUMO' && origen.idOrigen) {
                  console.log('🔍 Buscando datos del requerimiento ID:', origen.idOrigen);
                  
                  const detalleRequerimiento = await this.consolidacionService.obtenerDetalleRequerimiento(origen.idOrigen);
                  console.log('📄 Detalle del requerimiento completo:', detalleRequerimiento);
                  console.log('📋 Campos disponibles:', Object.keys(detalleRequerimiento));
                  
                  if (detalleRequerimiento.idalmacen) {
                    almacen = detalleRequerimiento.idalmacen;
                    idAlmacen = parseInt(detalleRequerimiento.idalmacen) || 1;
                    console.log('✅ Almacén encontrado:', almacen);
                  } else {
                    console.warn('⚠️ No se encontró campo idalmacen en el detalle del requerimiento');
                  }
                  
                  // Los campos de proyecto y CECO están en el array detalle
                  if (detalleRequerimiento.detalle && detalleRequerimiento.detalle.length > 0) {
                    const primerDetalle = detalleRequerimiento.detalle[0];
                    console.log('📝 Primer detalle del requerimiento:', primerDetalle);
                    
                    // Buscar proyecto en varios campos posibles
                    proyecto = primerDetalle.idproyecto || 
                              primerDetalle.proyecto || 
                              primerDetalle.nombreProyecto ||
                              primerDetalle.idproyectoDescripcion ||
                              this.usuario.idProyecto || '';
                    
                    if (proyecto) {
                      console.log('✅ Proyecto encontrado:', proyecto);
                    } else {
                      console.warn('⚠️ No se encontró campo de proyecto en el detalle. Campos disponibles:', Object.keys(primerDetalle));
                    }
                    
                    // Buscar CECO en varios campos posibles
                    ceco = primerDetalle.idcentrocosto || 
                          primerDetalle.centroCosto || 
                          primerDetalle.nombreCentroCosto ||
                          primerDetalle.idcentrocostoDescripcion ||
                          primerDetalle.ceco;
                    
                    if (ceco) {
                      console.log('✅ CECO encontrado:', ceco);
                    } else {
                      console.warn('⚠️ No se encontró campo de CECO en el detalle. Campos disponibles:', Object.keys(primerDetalle));
                    }
                  } else {
                    console.warn('⚠️ No se encontró array detalle en el requerimiento o está vacío');
                  }
                } else {
                  console.warn('⚠️ El origen no es de tipo CONSUMO o no tiene idOrigen');
                }
              } else {
                console.warn('⚠️ El detalle no tiene orígenes');
              }
            } else {
              console.warn('⚠️ La consolidación no tiene detalles');
            }
          } catch (error) {
            console.error('❌ Error al obtener datos de la consolidación:', error);
            // Se mantienen los valores por defecto
          }
        } else {
          console.warn('⚠️ No se encontró consolidación asociada a la solicitud de cotización');
        }
      } else {
        console.warn('⚠️ La cotización no tiene idSolicitudCotizacion');
      }

      // Actualizar los detalles con los datos obtenidos
      detallesSolicitud.forEach(det => {
        det.proyecto = proyecto;
        det.ceco = ceco;
      });

      // Mostrar valores finales antes de crear la solicitud
      console.log('📋 Valores finales para la solicitud:', {
        almacen,
        idAlmacen,
        proyecto,
        ceco,
        cantidadDetalles: detallesSolicitud.length
      });

      // Crear la solicitud de compra
      const solicitudCompra: SolicitudCompra = {
        numeroSolicitud,
        fecha: new Date().toISOString(),
        tipo: 'DIRECTA', // Tipo válido según la interfaz
        prioridad: 'NORMAL',
        almacen,
        usuarioSolicita: this.usuario.documentoidentidad,
        nombreSolicita: this.usuario.nombre || this.usuario.usuario,
        estado: 'GENERADA',
        observaciones: `Solicitud generada automáticamente desde la cotización ganadora ${cotizacion.numeroCotizacion} del proveedor ${cotizacion.nombreProveedor}.`,
        detalle: detallesSolicitud,
        montoEstimado,
        moneda: cotizacion.moneda || 'PEN',
        fechaRequerida: new Date(Date.now() + (cotizacion.plazoEntrega || 15) * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Guardar la solicitud en Dexie
      const solicitudId = await this.dexieService.saveSolicitudCompra(solicitudCompra);

      // Actualizar los detalles con el ID de la solicitud, almacen, proyecto y CECO
      for (const det of detallesSolicitud) {
        // Crear un nuevo objeto sin la propiedad id para que Dexie lo asigne automáticamente
        const detalleParaGuardar = {
          ...det,
          solicitudCompraId: solicitudId as number,
          almacen,
          idAlmacen,
          proyecto, // Asignar el proyecto obtenido del requerimiento
          ceco // Asignar el CECO obtenido del requerimiento
        };
        delete (detalleParaGuardar as any).id;
        await this.dexieService.detalleSolicitudCompra.add(detalleParaGuardar);
      }

      console.log('✅ Solicitud de compra generada:', numeroSolicitud);
      
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

  generarNumeroOrden(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const seg = String(fecha.getSeconds()).padStart(2, '0');
    return `OC-${año}${mes}${dia}-${hora}${min}${seg}`;
  }

  async seleccionarCotizacion(cotizacion: Cotizacion) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea seleccionar esta cotización como ganadora y generar la solicitud de compra automáticamente?',
      'info'
    );

    if (!confirmacion) return;

    try {
      console.log('🏆 Seleccionando cotización ganadora:', cotizacion.numeroCotizacion);
      
      // Marcar como seleccionada
      cotizacion.estado = 'SELECCIONADA';
      cotizacion.seleccionada = true;
      cotizacion.usuarioEvalua = this.usuario.documentoidentidad;
      cotizacion.fechaEvaluacion = new Date().toISOString();
      
      console.log('📝 Cotización actualizada - Estado:', cotizacion.estado);
      
      await this.dexieService.saveCotizacion(cotizacion);
      console.log('✅ Cotización guardada en Dexie');

      // Generar solicitud de compra automáticamente
      await this.generarSolicitudDesdeCotizacion(cotizacion);
      console.log('✅ Solicitud de compra generada');

      console.log('🔄 Recargando cotizaciones...');
      await this.cargarCotizaciones();
      console.log('📊 Total de cotizaciones después de recargar:', this.cotizaciones.length);
      
      this.actualizarCotizacionesGanadoras();
      
      // Cambiar al tab de cotizaciones ganadoras
      this.tabActiva = 'GANADORES';
    } catch (error) {
      console.error('Error al seleccionar cotización:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al seleccionar la cotización.',
        'error'
      );
    }
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
      cotizacion.usuarioEvalua = this.usuario.documentoidentidad;
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

  verDetalle(cotizacion: Cotizacion) {
    this.cotizacionDetalle = cotizacion;
    this.modalDetalleCotizacionAbierto = true;
  }

  cerrarModalDetalleCotizacion() {
    this.modalDetalleCotizacionAbierto = false;
    this.cotizacionDetalle = null;
  }

  abrirComparativo(solicitudId: number) {
    this.cotizacionesComparativo = this.cotizaciones.filter(
      (c) => c.solicitudCompraId === solicitudId
    );
    this.modalComparativoAbierto = true;
  }

  cerrarModalComparativo() {
    this.modalComparativoAbierto = false;
    this.cotizacionesComparativo = [];
  }

  cancelarFormulario() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar? Se perderán los cambios no guardados.'
    );
    if (!confirmar) return;
    this.mostrarFormulario = false;
  }

  // Filtros
  cotizacionesFiltradas(): Cotizacion[] {
    let filtradas = [...this.cotizaciones];

    if (this.filtroEstado !== 'TODAS') {
      filtradas = filtradas.filter((c) => c.estado === this.filtroEstado);
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

  // Utilidades
  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      RECIBIDA: 'badge-info',
      EN_EVALUACION: 'badge-warning',
      SELECCIONADA: 'badge-success',
      RECHAZADA: 'badge-danger',
    };
    return clases[estado] || 'badge-secondary';
  }

  formatearFecha(fecha: string): string {
    if (!fecha || fecha === '' || fecha === null) return 'Sin fecha';
    
    try {
      const date = new Date(fecha);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Fecha inválida:', fecha);
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      console.error('❌ Error al formatear fecha:', fecha, error);
      return 'Error fecha';
    }
  }

  formatearMoneda(monto: number, moneda: string = 'PEN'): string {
    const simbolo = moneda === 'PEN' ? 'S/' : '$';
    return `${simbolo} ${monto.toFixed(2)}`;
  }

  obtenerMejorPrecio(solicitudId: number): number {
    const cotizacionesSolicitud = this.cotizaciones.filter(
      (c) => c.solicitudCompraId === solicitudId && c.estado !== 'RECHAZADA'
    );

    if (cotizacionesSolicitud.length === 0) return 0;

    return Math.min(...cotizacionesSolicitud.map((c) => c.montoTotal));
  }

  // =====================================================================
  // MÉTODOS PARA COTIZACIONES MANUALES
  // =====================================================================

  nuevaCotizacionManual() {
    this.cotizacion = this.nuevaCotizacion();
    this.detalleCotizacion = [];
    this.solicitudCotizacionSeleccionada = null;
    this.modalNuevaCotizacionAbierto = true;
    this.modoEdicion = false;
  }

  cerrarModalNuevaCotizacion() {
    this.modalNuevaCotizacionAbierto = false;
    this.cotizacion = this.nuevaCotizacion();
    this.detalleCotizacion = [];
  }

  async guardarCotizacionManual() {
    if (!this.cotizacion.proveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el código del proveedor.',
        'warning'
      );
      return;
    }

    if (!this.cotizacion.nombreProveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el nombre del proveedor.',
        'warning'
      );
      return;
    }

    if (this.detalleCotizacion.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe agregar al menos un item a la cotización.',
        'warning'
      );
      return;
    }

    // Validar que todos los items tengan precio
    const itemsSinPrecio = this.detalleCotizacion.filter(d => d.precioUnitario <= 0);
    if (itemsSinPrecio.length > 0) {
      this.alertService.showAlert(
        'Atención',
        'Todos los items deben tener un precio unitario mayor a 0.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      this.cotizacion.numeroCotizacion = this.generarNumeroCotizacion();
      this.cotizacion.detalle = [...this.detalleCotizacion];
      this.cotizacion.usuarioRegistra = this.usuario.documentoidentidad;
      this.cotizacion.estado = 'RECIBIDA';

      await this.dexieService.saveCotizacion(this.cotizacion);

      // Verificar si hay múltiples cotizaciones para esta solicitud
      await this.verificarYEvaluarCotizaciones(this.cotizacion.numeroSolicitud);

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Cotización registrada correctamente.',
        'success'
      );

      this.cerrarModalNuevaCotizacion();
      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar la cotización.',
        'error'
      );
    }
  }

  abrirModalAgregarItem() {
    this.lineaTemporal = this.nuevoDetalle();
    this.detalleEditIndex = -1;
    this.modalDetalleAbierto = true;
  }

  cerrarModalAgregarItem() {
    this.modalDetalleAbierto = false;
    this.lineaTemporal = this.nuevoDetalle();
    this.detalleEditIndex = -1;
  }

  agregarItemCotizacion() {
    if (!this.lineaTemporal.codigo) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el código del item.',
        'warning'
      );
      return;
    }

    if (this.lineaTemporal.cantidad <= 0) {
      this.alertService.showAlert(
        'Atención',
        'La cantidad debe ser mayor a 0.',
        'warning'
      );
      return;
    }

    if (this.lineaTemporal.precioUnitario <= 0) {
      this.alertService.showAlert(
        'Atención',
        'El precio unitario debe ser mayor a 0.',
        'warning'
      );
      return;
    }

    // Calcular montos
    this.calcularMontos(this.lineaTemporal);

    if (this.detalleEditIndex >= 0) {
      // Editar
      this.detalleCotizacion[this.detalleEditIndex] = { ...this.lineaTemporal };
      this.detalleEditIndex = -1;
    } else {
      // Agregar nuevo
      this.detalleCotizacion.push({ ...this.lineaTemporal });
    }

    this.lineaTemporal = this.nuevoDetalle();
    this.modalDetalleAbierto = false;
    this.calcularTotales();
  }

  editarItemCotizacion(index: number) {
    this.lineaTemporal = { ...this.detalleCotizacion[index] };
    this.detalleEditIndex = index;
    this.modalDetalleAbierto = true;
  }

  eliminarItemCotizacion(index: number) {
    this.detalleCotizacion.splice(index, 1);
    this.calcularTotales();
  }

  // =====================================================================
  // MÉTODOS PARA SOLICITUDES DE COTIZACIÓN
  // =====================================================================

  verDetalleSolicitud(solicitud: SolicitudCotizacion) {
    console.log('Ver detalle solicitud:', solicitud);
    this.solicitudCotizacionSeleccionada = solicitud;
    this.modalDetalleSolicitudAbierto = true;
    console.log('Modal abierto:', this.modalDetalleSolicitudAbierto);
  }

  cerrarModalDetalleSolicitud() {
    this.modalDetalleSolicitudAbierto = false;
    this.solicitudCotizacionSeleccionada = null;
  }

  async abrirRegistroCotizacionDesdeSolicitud(solicitud: SolicitudCotizacion) {
    this.solicitudCotizacionSeleccionada = solicitud;
    
    // Recargar proveedores si es necesario
    if (this.proveedores.length === 0) {
      console.log('🔄 Recargando proveedores...');
      await this.cargarProveedores();
    }
    
    // Preparar formulario de cotización
    this.cotizacion = this.nuevaCotizacion();
    this.cotizacion.numeroSolicitud = solicitud.noSolicitud;
    
    // Pre-cargar items de la solicitud
    this.detalleCotizacion = solicitud.detalle.map((item) => ({
      cotizacionId: 0,
      codigo: item.codigoItem,
      descripcion: item.descripcionItem,
      cantidad: item.cantidad,
      unidadMedida: item.unidadMedida,
      precioUnitario: 0,
      descuento: 0,
      porcentajeDescuento: 0,
      subtotal: 0,
      impuesto: 0,
      porcentajeImpuesto: 18,
      total: 0,
    }));
    
    this.modalRegistrarCotizacionAbierto = true;
  }

  cerrarModalRegistrarCotizacion() {
    this.modalRegistrarCotizacionAbierto = false;
    this.solicitudCotizacionSeleccionada = null;
  }

  async guardarCotizacionDesdeSolicitud() {
    if (!this.cotizacion.proveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el código del proveedor.',
        'warning'
      );
      return;
    }

    if (!this.cotizacion.nombreProveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el nombre del proveedor.',
        'warning'
      );
      return;
    }

    if (this.detalleCotizacion.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe agregar al menos un item a la cotización.',
        'warning'
      );
      return;
    }

    // Validar que todos los items tengan precio
    const itemsSinPrecio = this.detalleCotizacion.filter(d => d.precioUnitario <= 0);
    if (itemsSinPrecio.length > 0) {
      this.alertService.showAlert(
        'Atención',
        'Todos los items deben tener un precio unitario mayor a 0.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      // Preparar datos para el backend
      const cotizacionBackend = {
        idcotizacion: this.generarNumeroCotizacion(),
        idsolicitud: this.solicitudCotizacionSeleccionada?.noSolicitud,
        proveedor: this.cotizacion.proveedor,
        nombreProveedor: this.cotizacion.nombreProveedor,
        rucProveedor: this.cotizacion.rucProveedor,
        fechaCotizacion: new Date().toISOString().split('T')[0],
        fechaValidez: this.cotizacion.fechaVencimiento ? 
          new Date(this.cotizacion.fechaVencimiento).toISOString().split('T')[0] : 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        moneda: this.cotizacion.moneda || 'PEN',
        tiempoEntrega: this.cotizacion.plazoEntrega || 0,
        formaPago: this.cotizacion.formaPago || 'CONTADO',
        observaciones: this.cotizacion.observaciones || '',
        detalles: JSON.stringify(this.detalleCotizacion.map(d => ({
          codigo: d.codigo,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: d.subtotal,
          total: d.total
        }))),
        usuario: this.usuario.documentoidentidad
      };

      // Guardar en backend
      const response = await this.cotizacionesService.registrarCotizacion(cotizacionBackend);
      
      // También guardar localmente para Dexie
      this.cotizacion.numeroCotizacion = cotizacionBackend.idcotizacion;
      this.cotizacion.detalle = [...this.detalleCotizacion];
      this.cotizacion.usuarioRegistra = this.usuario.documentoidentidad;
      this.cotizacion.estado = 'RECIBIDA';
      this.cotizacion.idSolicitudCotizacion = this.solicitudCotizacionSeleccionada?.id;

      await this.dexieService.saveCotizacion(this.cotizacion);

      // Verificar si hay múltiples cotizaciones para esta solicitud
      await this.verificarYEvaluarCotizaciones(this.cotizacion.numeroSolicitud);

      // Actualizar contador de cotizaciones recibidas en la solicitud
      if (this.solicitudCotizacionSeleccionada) {
        this.solicitudCotizacionSeleccionada.cotizacionesRecibidas = 
          (this.solicitudCotizacionSeleccionada.cotizacionesRecibidas || 0) + 1;
        this.solicitudCotizacionSeleccionada.estado = 'EN_REVISION';
        // TODO: Guardar solicitud actualizada cuando esté disponible el servicio
      }

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Cotización registrada correctamente en el sistema.',
        'success'
      );

      this.cerrarModalRegistrarCotizacion();
      this.tabActiva = 'COTIZACIONES';
      await this.cargarCotizaciones();
      // Recargar solicitudes desde backend para actualizar estados
      await this.cargarSolicitudesCotizacion();
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      this.alertService.cerrarModalCarga();
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar la cotización: ' + errorMessage,
        'error'
      );
    }
  }

  obtenerCotizacionesPorSolicitud(noSolicitud: string): number {
    return this.cotizaciones.filter(
      (c) => c.numeroSolicitud === noSolicitud
    ).length;
  }

  obtenerClaseEstadoSolicitud(estado: string): string {
    const clases: { [key: string]: string } = {
      PENDIENTE: 'badge-warning',
      EN_REVISION: 'badge-info',
      CERRADA: 'badge-success',
      ANULADA: 'badge-danger',
    };
    return clases[estado] || 'badge-secondary';
  }

  // =====================================================================
  // MÉTODOS PARA COMPARACIÓN
  // =====================================================================

  abrirComparacionPorSolicitud(solicitud: SolicitudCotizacion) {
    this.solicitudCotizacionSeleccionada = solicitud;
    this.cotizacionesComparativo = this.cotizaciones.filter(
      (c) => c.numeroSolicitud === solicitud.noSolicitud
    );
    this.tabActiva = 'COMPARACION';
  }

  obtenerProveedorMejorPrecio(codigoItem: string): string {
    const cotizacionesConItem = this.cotizacionesComparativo
      .map(cot => ({
        proveedor: cot.nombreProveedor,
        precio: cot.detalle.find(d => d.codigo === codigoItem)?.precioUnitario || 0
      }))
      .filter(c => c.precio > 0);

    if (cotizacionesConItem.length === 0) return '-';

    const mejor = cotizacionesConItem.reduce((prev, current) => 
      current.precio < prev.precio ? current : prev
    );

    return mejor.proveedor;
  }

  obtenerDetalleCotizacion(cotizacion: Cotizacion, codigoItem: string): DetalleCotizacion | null {
    if (!cotizacion.detalle || cotizacion.detalle.length === 0) {
      return null;
    }
    return cotizacion.detalle.find(d => d.codigo === codigoItem) || null;
  }

  async seleccionarProveedorGanador(cotizacion: Cotizacion) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      `¿Desea seleccionar a ${cotizacion.nombreProveedor} como proveedor ganador y generar la orden de compra automáticamente?`,
      'info'
    );

    if (!confirmacion) return;

    try {
      // Marcar como seleccionada
      cotizacion.estado = 'SELECCIONADA';
      cotizacion.seleccionada = true;
      cotizacion.usuarioEvalua = this.usuario.documentoidentidad;
      cotizacion.fechaEvaluacion = new Date().toISOString();

      await this.dexieService.saveCotizacion(cotizacion);

      // Rechazar otras cotizaciones de la misma solicitud
      const otrasCotizaciones = this.cotizacionesComparativo.filter(
        c => c.id !== cotizacion.id
      );

      for (const otra of otrasCotizaciones) {
        otra.estado = 'RECHAZADA';
        otra.motivoRechazo = 'No seleccionada como proveedor ganador';
        otra.usuarioEvalua = this.usuario.documentoidentidad;
        otra.fechaEvaluacion = new Date().toISOString();
        await this.dexieService.saveCotizacion(otra);
      }

      // Generar orden de compra automáticamente
      await this.generarSolicitudDesdeCotizacion(cotizacion);

      // Cerrar modal de comparación
      this.modalComparativoAbierto = false;

      // Recargar datos
      await this.cargarCotizaciones();
      this.actualizarCotizacionesGanadoras();
      
      // Cambiar al tab de cotizaciones ganadoras
      this.tabActiva = 'GANADORES';

      this.alertService.showAlert(
        'Éxito',
        `Proveedor ${cotizacion.nombreProveedor} seleccionado y Solicitud de Compra generada correctamente.`,
        'success'
      );
    } catch (error) {
      console.error('Error al seleccionar proveedor ganador:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al seleccionar el proveedor ganador.',
        'error'
      );
    }
  }

  // =====================================================================
  // MÉTODOS PARA EVALUACIÓN DE COTIZACIONES
  // =====================================================================

  /**
   * Verifica si hay múltiples cotizaciones para una solicitud y las marca como EN_EVALUACION
   */
  async verificarYEvaluarCotizaciones(numeroSolicitud: string) {
    if (!numeroSolicitud) return;

    // Obtener todas las cotizaciones de la solicitud
    const cotizacionesSolicitud = this.cotizaciones.filter(
      c => c.numeroSolicitud === numeroSolicitud && c.estado !== 'RECHAZADA'
    );

    // Si hay 2 o más cotizaciones recibidas, marcar todas como EN_EVALUACION
    if (cotizacionesSolicitud.length >= 2) {
      for (const cot of cotizacionesSolicitud) {
        if (cot.estado === 'RECIBIDA') {
          cot.estado = 'EN_EVALUACION';
          await this.dexieService.saveCotizacion(cot);
        }
      }
      
      // Recargar para actualizar contadores
      await this.cargarCotizaciones();
    }
  }

  /**
   * Marca manualmente una cotización como EN_EVALUACION
   */
  async marcarComoEnEvaluacion(cotizacion: Cotizacion) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea marcar esta cotización como "En Evaluación"?',
      'info'
    );

    if (!confirmacion) return;

    try {
      cotizacion.estado = 'EN_EVALUACION';
      cotizacion.usuarioEvalua = this.usuario.documentoidentidad;
      cotizacion.fechaEvaluacion = new Date().toISOString();

      await this.dexieService.saveCotizacion(cotizacion);

      this.alertService.showAlert(
        'Éxito',
        'Cotización marcada como "En Evaluación".',
        'success'
      );

      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al marcar cotización como en evaluación:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al actualizar el estado.',
        'error'
      );
    }
  }

  /**
   * Abre el modal de comparación y marca las cotizaciones como EN_EVALUACION
   */
  async abrirComparativoYEvaluar(solicitudId: number) {
    this.cotizacionesComparativo = this.cotizaciones.filter(
      (c) => c.solicitudCompraId === solicitudId
    );

    // Marcar todas las cotizaciones del comparativo como EN_EVALUACION
    for (const cot of this.cotizacionesComparativo) {
      if (cot.estado === 'RECIBIDA') {
        cot.estado = 'EN_EVALUACION';
        await this.dexieService.saveCotizacion(cot);
      }
    }

    this.modalComparativoAbierto = true;
    await this.cargarCotizaciones();
  }

  /**
   * Abre la comparación por solicitud y marca como EN_EVALUACION
   */
  async abrirComparacionPorSolicitudYEvaluar(solicitud: SolicitudCotizacion) {
    console.log('🔄 Abriendo comparación para solicitud:', solicitud.noSolicitud);
    console.log('📋 ID Solicitud:', solicitud.id);
    
    this.solicitudCotizacionSeleccionada = solicitud;
    
    // Filtrar cotizaciones por idSolicitudCotizacion o por numeroSolicitud
    this.cotizacionesComparativo = this.cotizaciones.filter(
      (c) => c.idSolicitudCotizacion === solicitud.id || 
             c.numeroSolicitud === solicitud.noSolicitud ||
             (solicitud.noSolicitud && c.numeroSolicitud && c.numeroSolicitud.includes(solicitud.noSolicitud))
    );
    
    console.log('📊 Cotizaciones para comparación:', this.cotizacionesComparativo.length);
    console.log('📝 Detalle:', this.cotizacionesComparativo.map(c => ({
      id: c.id,
      numeroCotizacion: c.numeroCotizacion,
      numeroSolicitud: c.numeroSolicitud,
      idSolicitudCotizacion: c.idSolicitudCotizacion,
      proveedor: c.nombreProveedor
    })));

    // Marcar todas como EN_EVALUACION si están en RECIBIDA
    for (const cot of this.cotizacionesComparativo) {
      if (cot.estado === 'RECIBIDA') {
        cot.estado = 'EN_EVALUACION';
        await this.dexieService.saveCotizacion(cot);
      }
    }

    this.tabActiva = 'COMPARACION';
    // No recargar aquí para no perder los datos
  }

  // Métodos para cotizaciones ganadoras
  getNumeroOrdenFromMap(cotizacionId: number): string {
    return this.numerosOrden.get(cotizacionId) || '';
  }

  tieneOrdenFromMap(cotizacionId: number): boolean {
    return this.numerosOrden.has(cotizacionId);
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

  async verSolicitudGenerada(cotizacion: Cotizacion) {
    try {
      const solicitudes = await this.dexieService.showSolicitudesCompra();
      // Buscar solicitud por número de solicitud o por coincidencia en observaciones
      const solicitud = solicitudes.find(s => 
        s.numeroSolicitud === cotizacion.numeroSolicitud ||
        (s.observaciones && s.observaciones.includes(cotizacion.numeroCotizacion))
      );
      
      if (solicitud) {
        // Extraer nombre del proveedor desde las observaciones
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
        this.alertService.showAlert('Información', 'No se encontró la solicitud de compra asociada', 'warning');
      }
    } catch (error) {
      console.error('Error al buscar solicitud:', error);
      this.alertService.showAlert('Error', 'Ocurrió un error al buscar la solicitud de compra', 'error');
    }
  }

  descargarCotizacion(cotizacion: Cotizacion) {
    console.log('📥 Generando PDF para cotización');
    console.log('📋 Objeto cotización completo:', JSON.stringify(cotizacion, null, 2));
    console.log('📋 Numero de cotización:', cotizacion.numeroCotizacion);
    console.log('📋 ID de cotización:', cotizacion.id);
    console.log('📋 Propiedades disponibles:', Object.keys(cotizacion));
    
    // Importar jsPDF dinámicamente
    import('jspdf').then((jsPDF) => {
      const { jsPDF: JsPDF } = jsPDF;
      const doc = new JsPDF();
      
      // Configurar fuentes
      doc.setFont('helvetica');
      
      // Título
      doc.setFontSize(20);
      doc.text('COTIZACION', 105, 20, { align: 'center' });
      
      // Información principal
      doc.setFontSize(12);
      // Buscar el número real de cotización en diferentes propiedades
      let numCotizacion = 'N/A';
      
      // Intentar obtener desde diferentes propiedades
      if (cotizacion.numeroCotizacion && 
          cotizacion.numeroCotizacion !== 'SELECCIONADA' && 
          cotizacion.numeroCotizacion !== 'GANADORA' && 
          cotizacion.numeroCotizacion !== 'ganadora' &&
          !cotizacion.numeroCotizacion.includes('GANADORA')) {
        numCotizacion = cotizacion.numeroCotizacion;
      } else if (cotizacion.numeroSolicitud) {
        // Usar el número de solicitud como referencia
        numCotizacion = `COT-${cotizacion.numeroSolicitud}`;
      } else if (cotizacion.id) {
        // Usar el ID como último recurso
        numCotizacion = `COT-${cotizacion.id}`;
      }
      
      doc.text(`Numero: ${numCotizacion}`, 20, 40);
      doc.text(`Fecha: ${this.formatearFecha(cotizacion.fecha || '')}`, 20, 50);
      doc.text(`Fecha Vencimiento: ${this.formatearFecha(cotizacion.fechaVencimiento || '')}`, 20, 60);
      doc.text(`Estado: ${cotizacion.estado || 'N/A'}`, 20, 70);
      
      // Información del proveedor
      doc.setFontSize(14);
      doc.text('DATOS DEL PROVEEDOR', 20, 90);
      doc.setFontSize(11);
      doc.text(`RUC: ${cotizacion.rucProveedor || 'N/A'}`, 20, 100);
      doc.text(`Razon Social: ${cotizacion.nombreProveedor || 'N/A'}`, 20, 110);
      
      // Condiciones comerciales
      doc.setFontSize(14);
      doc.text('CONDICIONES COMERCIALES', 20, 130);
      doc.setFontSize(11);
      doc.text(`Moneda: ${cotizacion.moneda || 'N/A'}`, 20, 140);
      doc.text(`Monto Total: ${this.formatearMoneda(cotizacion.montoTotal || 0, cotizacion.moneda || '')}`, 20, 150);
      doc.text(`Plazo de Entrega: ${cotizacion.plazoEntrega || 0} dias`, 20, 160);
      doc.text(`Lugar de Entrega: ${cotizacion.lugarEntrega || 'N/A'}`, 20, 170);
      doc.text(`Forma de Pago: ${cotizacion.formaPago || 'N/A'}`, 20, 180);
      doc.text(`Condiciones de Pago: ${cotizacion.condicionesPago || 'N/A'}`, 20, 190);
      doc.text(`Validez de Oferta: ${cotizacion.validezOferta || 0} dias`, 20, 200);
      
      // Detalles de la cotización
      let yPosition = 220;
      doc.setFontSize(14);
      doc.text('DETALLE DE ITEMS', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.text('Codigo', 20, yPosition);
      doc.text('Descripcion', 50, yPosition);
      doc.text('Cantidad', 130, yPosition);
      doc.text('Precio Unit.', 150, yPosition);
      doc.text('Total', 180, yPosition);
      yPosition += 5;
      
      // Línea separadora
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      // Items del detalle
      if (cotizacion.detalle && cotizacion.detalle.length > 0) {
        cotizacion.detalle.forEach((item) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.text(item.codigo || '', 20, yPosition);
          // Truncar descripción si es muy larga
          const descripcion = item.descripcion || '';
          doc.text(descripcion.length > 40 ? descripcion.substring(0, 40) + '...' : descripcion, 50, yPosition);
          doc.text(item.cantidad?.toString() || '0', 130, yPosition);
          doc.text(this.formatearMoneda(item.precioUnitario || 0, ''), 150, yPosition);
          doc.text(this.formatearMoneda((item.precioUnitario || 0) * (item.cantidad || 0), ''), 180, yPosition);
          yPosition += 8;
        });
      }
      
      // Pie de página
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Pagina ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('Generado por Sistema de Logistica - Hass Peru', 105, 290, { align: 'center' });
      }
      
      // Descargar el PDF
      doc.save(`Cotizacion_${cotizacion.numeroCotizacion}.pdf`);
      
      this.alertService.showAlert(
        'Éxito',
        `PDF de la cotización ${cotizacion.numeroCotizacion} generado correctamente.`,
        'success'
      );
    }).catch((error) => {
      console.error('Error al generar PDF:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudo generar el PDF. Asegúrese de tener instalada la librería jsPDF.',
        'error'
      );
    });
  }
}
