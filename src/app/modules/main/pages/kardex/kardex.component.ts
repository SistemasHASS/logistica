import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KardexService } from '@/app/services/kardex.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { MaestrasService } from '../../services/maestras.service';
import { take } from 'rxjs/operators';

// Interfaces para formularios
interface RecepcionOCForm {
  companiaSocio: string;
  numeroOrden: string;
  almacenCodigo: string;
  usuario?: string;
}

interface SincronizacionForm {
  companiaSocio?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  soloPendientes?: boolean;
}

interface EjecutarSincronizacionForm extends SincronizacionForm {
  ejecutarReal?: boolean;
}

interface VerificarEstadoForm {
  companiaSocio?: string;
}

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CardModule,
    TagModule,
    TooltipModule,
    SelectModule,
    TextareaModule,
    DatePickerModule,
    AutoCompleteModule,
  ],
  templateUrl: './kardex.component.html',
  styleUrls: ['./kardex.component.scss'],
})
export class KardexComponent implements OnInit {
  // Tabs
  tabActiva: number = 0;

  // Stock
  stock: any[] = [];
  stockFiltrado: any[] = [];
  filtroStock = {
    almacen: '',
    codigoItem: '',
    stockBajo: false,
  };

  // Kardex
  movimientosKardex: any[] = [];
  filtroKardex = {
    codigoItem: '',
    almacen: '',
    fechaInicio: null as Date | null,
    fechaFin: null as Date | null,
    tipoMovimiento: '',
  };

  // Transacciones
  transacciones: any[] = [];
  transaccionesFiltradas: any[] = [];
  filtroTransacciones = {
    fechaInicio: null as Date | null,
    fechaFin: null as Date | null,
    tipoTransaccion: '',
    estado: '',
  };

  // Nueva transacción
  modalNuevaTransaccion = false;
  items: any[] = [];
  itemsFiltrados: any[] = [];
  nuevaTransaccion = {
    tipoTransaccion: 'INGRESO',
    tipoDocumentoOrigen: '',
    numeroDocumentoOrigen: '',
    almacenOrigen: '',
    almacenDestino: '',
    observaciones: '',
    detalles: [] as any[],
  };

  // Detalle transacción
  modalDetalleTransaccion = false;
  transaccionDetalle: any = null;

  // Dashboard
  dashboard: any = {
    indicadores: {
      totalItems: 0,
      totalAlmacenes: 0,
      stockTotal: 0,
      valorTotal: 0,
      itemsBajoStock: 0,
      itemsAltoStock: 0,
    },
    itemsBajoStock: [],
    itemsMayorValor: [],
    movimientosRecientes: [],
  };

  // Reporte valorización
  reporteValorizacion: any[] = [];

  // Opciones
  // almacenes = [
  //   { label: 'Todos', value: '' },
  //   { label: 'ALM-PRINCIPAL', value: 'ALM-PRINCIPAL' },
  //   { label: 'ALM-SUCURSAL', value: 'ALM-SUCURSAL' },
  // ];

  almacenes: any[] = [];
  almacenesDestino: any[] = [];

  tiposMovimiento = [
    { label: 'Todos', value: '' },
    { label: 'ENTRADA', value: 'ENTRADA' },
    { label: 'SALIDA', value: 'SALIDA' },
    { label: 'TRANSFERENCIA', value: 'TRANSFERENCIA' },
    { label: 'AJUSTE', value: 'AJUSTE' },
  ];

  tiposTransaccion = [
    { label: 'Todos', value: '' },
    { label: 'INGRESO', value: 'INGRESO' },
    { label: 'SALIDA', value: 'SALIDA' },
    { label: 'AJUSTE', value: 'AJUSTE' },
    { label: 'TRANSFERENCIA', value: 'TRANSFERENCIA' },
    { label: 'REINGRESO', value: 'REINGRESO' },
    { label: 'DEVOLUCION CONSUMO', value: 'DEVOLUCION_CONSUMO' },
  ];

  estadosTransaccion = [
    { label: 'Todos', value: '' },
    { label: 'PENDIENTE', value: 'PENDIENTE' },
    { label: 'PROCESADO', value: 'PROCESADO' },
    { label: 'ANULADO', value: 'ANULADO' },
  ];

  tiposDocumento = [
    { label: 'Seleccione...', value: '' },
    { label: 'ORDEN DE COMPRA', value: 'OC' },
    { label: 'FACTURA', value: 'FAC' },
    { label: 'BOLETA', value: 'BOL' },
    { label: 'NOTA DE CRÉDITO', value: 'NC' },
    { label: 'NOTA DE DÉBITO', value: 'ND' },
    { label: 'GUIA DE REMISIÓN', value: 'GR' },
    { label: 'VALE DE ALMACÉN', value: 'VA' },
    { label: 'NOTA DE INGRESO', value: 'NI' },
    { label: 'NOTA DE SALIDA', value: 'NS' },
  ];

  // Usuario
  usuario: any = null;

  // Loading
  loading = false;

  constructor(
    private kardexService: KardexService,
    private alertService: AlertService,
    private userService: UserService,
    private dexieService: DexieService,
    private maestrasService: MaestrasService,
  ) {}

  async ngOnInit() {
    console.log('ngOnInit - Iniciando');
    await this.cargarUsuario();
    console.log('Usuario cargado:', this.usuario);
    await this.cargarDatos();
    await this.cargarItems();
    
    // Cargar almacenes desde Dexie si ya existen
    await this.cargarAlmacenesDesdeDexie();
    
    // Sincronizar tablas maestras
    await this.sincronizarTablasMaestras();
    console.log('ngOnInit - Completado');
  }

  async cargarUsuario() {
    this.usuario = await this.userService.getUsuario();
  }

  async cargarDatos() {
    this.loading = true;
    try {
      await Promise.all([
        this.consultarStock(),
        this.listarTransacciones(),
        this.cargarDashboard(),
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.alertService.showAlert(
        'Error',
        'Error al cargar los datos',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async cargarAlmacenesDesdeDexie() {
    try {
      console.log('Cargando almacenes desde Dexie...');
      await Promise.all([
        this.ListarAlmacenes(),
        this.ListarAlmacenesDestino()
      ]);
      console.log('Almacenes cargados desde Dexie');
    } catch (error) {
      console.error('Error al cargar almacenes desde Dexie:', error);
    }
  }

  async sincronizarTablasMaestras() {
    try {
      console.log('Iniciando sincronización de tablas maestras...');
      this.alertService.mostrarModalCarga();

      // Cargar almacenes una sola vez y usar para ambos arrays
      const almacenes$ = this.maestrasService.getAlmacenes([
        { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' },
      ]);
      
      almacenes$.pipe(take(1)).subscribe(async (resp: any) => {
        console.log('Respuesta de almacenes:', resp);
        if (!!resp && resp.length) {
          console.log('Guardando almacenes en Dexie...');
          await Promise.all([
            this.dexieService.saveAlmacenes(resp),
            this.dexieService.saveAlmacenesDestino(resp)
          ]);
          console.log('Almacenes guardados, listando...');
          await Promise.all([
            this.ListarAlmacenes(),
            this.ListarAlmacenesDestino()
          ]);
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Éxito!',
            'Almacenes sincronizados correctamente',
            'success'
          );
        } else {
          console.log('No se encontraron almacenes');
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Información',
            'No se encontraron almacenes para sincronizar',
            'info'
          );
        }
      });

      // const items = this.maestrasService.getItems([{ ruc: this.usuario?.ruc }]);
      // items.subscribe(async (resp: any) => {
      //   if (!!resp && resp.length) {
      //     await this.dexieService.saveItemComoditys(resp);
      //     await this.ListarItems();
      //   }
      // });

      // const servicios = this.maestrasService.getItems([
      //   { ruc: this.usuario?.ruc },
      // ]);
      // servicios.subscribe(async (resp: any) => {
      //   if (!!resp && resp.length) {
      //     await this.dexieService.saveComodities(resp);
      //   }
      // });

      // const activosFijos = this.maestrasService.getActivosFijos([
      //   { idempresa: this.usuario?.idempresa },
      // ]);
      // activosFijos.subscribe(async (resp: any) => {
      //   if (!!resp && resp.length) {
      //     await this.dexieService.saveActivosFijos(resp);
      //   }
      // });
    } catch (error: any) {
      console.error('Error en sincronizarTablasMaestras:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error!',
        'Ocurrió un error al sincronizar tablas maestras',
        'error',
      );
    }
  }

  async ListarAlmacenes() {
    console.log('ListarAlmacenes - Iniciando');
    const almacenes = await this.dexieService.showAlmacenes();
    console.log('Almacenes desde Dexie:', almacenes);
    this.almacenes = almacenes.map(a => ({
      label: a.almacen,
      value: a.idalmacen.toString()
    }));
    console.log('Almacenes mapeados:', this.almacenes);
  }

  async ListarAlmacenesDestino() {
    console.log('ListarAlmacenesDestino - Iniciando');
    const almacenesDestino = await this.dexieService.showAlmacenesDestino();
    console.log('Almacenes destino desde Dexie:', almacenesDestino);
    this.almacenesDestino = almacenesDestino.map(a => ({
      label: a.almacen,
      value: a.idalmacen.toString()
    }));
    console.log('Almacenes destino mapeados:', this.almacenesDestino);
  }

  // ==================== STOCK ====================

  async consultarStock() {
    try {
      this.stock = await this.kardexService.consultarStock(this.filtroStock);
      this.stockFiltrado = [...this.stock];
    } catch (error) {
      console.error('Error al consultar stock:', error);
    }
  }

  filtrarStock() {
    this.stockFiltrado = this.stock.filter((item) => {
      let cumpleFiltro = true;

      if (this.filtroStock.almacen) {
        cumpleFiltro =
          cumpleFiltro && item.almacen === this.filtroStock.almacen;
      }

      if (this.filtroStock.codigoItem) {
        const busqueda = this.filtroStock.codigoItem.toLowerCase();
        cumpleFiltro =
          cumpleFiltro &&
          (item.codigoItem.toLowerCase().includes(busqueda) ||
            item.descripcionItem.toLowerCase().includes(busqueda));
      }

      if (this.filtroStock.stockBajo) {
        cumpleFiltro = cumpleFiltro && item.stockActual <= item.stockMinimo;
      }

      return cumpleFiltro;
    });
  }

  limpiarFiltrosStock() {
    this.filtroStock = {
      almacen: '',
      codigoItem: '',
      stockBajo: false,
    };
    this.consultarStock();
  }

  getEstadoStock(item: any): string {
    if (item.stockActual <= item.stockMinimo) return 'BAJO';
    if (item.stockActual >= item.stockMaximo) return 'ALTO';
    return 'NORMAL';
  }

  getSeverityStock(
    estado: string,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' {
    switch (estado) {
      case 'BAJO':
        return 'danger';
      case 'ALTO':
        return 'warn';
      default:
        return 'success';
    }
  }

  // ==================== KARDEX ====================

  async buscarKardex() {
    if (!this.filtroKardex.codigoItem) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar un código de item',
        'warning',
      );
      return;
    }

    try {
      this.loading = true;
      const filtros: any = {
        codigoItem: this.filtroKardex.codigoItem,
      };

      if (this.filtroKardex.almacen) {
        filtros.almacen = this.filtroKardex.almacen;
      }

      if (this.filtroKardex.fechaInicio) {
        filtros.fechaInicio = this.formatearFechaSQL(
          this.filtroKardex.fechaInicio,
        );
      }

      if (this.filtroKardex.fechaFin) {
        filtros.fechaFin = this.formatearFechaSQL(this.filtroKardex.fechaFin);
      }

      if (this.filtroKardex.tipoMovimiento) {
        filtros.tipoMovimiento = this.filtroKardex.tipoMovimiento;
      }

      this.movimientosKardex =
        await this.kardexService.consultarKardex(filtros);
    } catch (error) {
      console.error('Error al buscar kardex:', error);
      this.alertService.showAlert(
        'Error',
        'Error al consultar kardex',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  limpiarKardex() {
    this.filtroKardex = {
      codigoItem: '',
      almacen: '',
      fechaInicio: null,
      fechaFin: null,
      tipoMovimiento: '',
    };
    this.movimientosKardex = [];
  }

  getSeverityMovimiento(
    tipo: string,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' {
    switch (tipo) {
      case 'ENTRADA':
        return 'success';
      case 'SALIDA':
        return 'danger';
      case 'TRANSFERENCIA':
        return 'info';
      case 'AJUSTE':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  // ==================== TRANSACCIONES ====================

  async listarTransacciones() {
    try {
      const filtros: any = {};

      if (this.filtroTransacciones.fechaInicio) {
        filtros.fechaInicio = this.formatearFechaSQL(
          this.filtroTransacciones.fechaInicio,
        );
      }

      if (this.filtroTransacciones.fechaFin) {
        filtros.fechaFin = this.formatearFechaSQL(
          this.filtroTransacciones.fechaFin,
        );
      }

      if (this.filtroTransacciones.tipoTransaccion) {
        filtros.tipoTransaccion = this.filtroTransacciones.tipoTransaccion;
      }

      if (this.filtroTransacciones.estado) {
        filtros.estado = this.filtroTransacciones.estado;
      }

      this.transacciones =
        await this.kardexService.listarTransacciones(filtros);
      this.transaccionesFiltradas = [...this.transacciones];
    } catch (error) {
      console.error('Error al listar transacciones:', error);
    }
  }

  buscarItem(event: any) {
    const query = event.query.toLowerCase();

    // Obtener el almacén seleccionado según el tipo de transacción
    const almacenSeleccionado =
      this.nuevaTransaccion.tipoTransaccion === 'INGRESO' || 
      this.nuevaTransaccion.tipoTransaccion === 'REINGRESO' ||
      this.nuevaTransaccion.tipoTransaccion === 'DEVOLUCION_CONSUMO'
        ? this.nuevaTransaccion.almacenDestino
        : this.nuevaTransaccion.almacenOrigen;

    console.log('=== buscarItem ===');
    console.log('Tipo transacción:', this.nuevaTransaccion.tipoTransaccion);
    console.log('Almacén seleccionado (value):', almacenSeleccionado);
    console.log('Query:', query);
    console.log('Items totales:', this.items.length);

    // Si no hay almacén seleccionado, no mostrar ningún item
    if (!almacenSeleccionado) {
      console.log('No hay almacén seleccionado, no mostrar items');
      this.itemsFiltrados = [];
      return;
    }

    // Primero filtrar por almacén
    console.log('Filtrando por almacén:', almacenSeleccionado);
    
    const itemsPorAlmacen = this.items.filter(item => item.almacen === almacenSeleccionado);
    console.log('Items del almacén:', itemsPorAlmacen.length);
    
    // Si no hay query, mostrar todos los items del almacén
    if (!query) {
      this.itemsFiltrados = itemsPorAlmacen;
    } else {
      // Filtrar por el texto de búsqueda dentro de los items del almacén
      this.itemsFiltrados = itemsPorAlmacen.filter(item =>
        item.codigoItem.toLowerCase().includes(query) ||
        item.descripcionItem.toLowerCase().includes(query)
      );
    }

    console.log('Items filtrados finales:', this.itemsFiltrados.length);
    console.log('Items filtrados:', this.itemsFiltrados);
  }

  cambiarAlmacen() {
    console.log('cambiarAlmacen() - Limpiando items filtrados');
    this.itemsFiltrados = [];

    this.nuevaTransaccion.detalles.forEach((det) => {
      det.itemSeleccionado = null;
      det.codigoItem = '';
      det.descripcionItem = '';
    });

    // Pre-filtrar items por el almacén seleccionado
    const almacenSeleccionado =
      this.nuevaTransaccion.tipoTransaccion === 'INGRESO'
        ? this.nuevaTransaccion.almacenDestino
        : this.nuevaTransaccion.almacenOrigen;

    if (almacenSeleccionado) {
      console.log('Pre-filtrando items para almacén:', almacenSeleccionado);
      this.itemsFiltrados = this.items.filter(item => item.almacen === almacenSeleccionado);
      console.log('Items pre-filtrados:', this.itemsFiltrados);
    }
  }

  cambiarTipoTransaccion() {
    console.log('cambiarTipoTransaccion() - Tipo:', this.nuevaTransaccion.tipoTransaccion);
    
    // Limpiar almacenes seleccionados
    this.nuevaTransaccion.almacenOrigen = '';
    this.nuevaTransaccion.almacenDestino = '';
    
    // Limpiar items filtrados
    this.itemsFiltrados = [];
    
    // Limpiar detalles
    this.nuevaTransaccion.detalles = [];
    
    console.log('Tipo de transacción cambiado, almacenes y detalles limpiados');
  }

  limpiarFiltrosTransacciones() {
    this.filtroTransacciones = {
      fechaInicio: null,
      fechaFin: null,
      tipoTransaccion: '',
      estado: '',
    };
    this.listarTransacciones();
  }

  abrirModalNuevaTransaccion() {
    console.log('abrirModalNuevaTransaccion() - Inicializando');
    
    // Limpiar items filtrados al abrir el modal
    this.itemsFiltrados = [];
    
    this.nuevaTransaccion = {
      tipoTransaccion: 'INGRESO',
      tipoDocumentoOrigen: '',
      numeroDocumentoOrigen: this.generarNumeroDocumento(),
      almacenOrigen: '',
      almacenDestino: '',
      observaciones: '',
      detalles: [],
    };
    
    this.modalNuevaTransaccion = true;
    console.log('Modal abierto con tipo INGRESO por defecto');
    console.log('Número de documento generado:', this.nuevaTransaccion.numeroDocumentoOrigen);
  }

  generarNumeroDocumento(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');
    
    // Formato: KAR-YYYYMMDD-HHMMSS
    return `KAR-${año}${mes}${dia}-${horas}${minutos}${segundos}`;
  }

  async guardarTransaccion() {
    if (!this.validarTransaccion()) {
      return;
    }

    try {
      this.loading = true;
      const transaccion = {
        ...this.nuevaTransaccion,
        usuarioRegistro: this.usuario?.documentoidentidad || 'SISTEMA',
      };

      const resultado = await this.kardexService.registrarTransaccion(transaccion);

      if (resultado.success) {
        this.alertService.showAlert(
          'Éxito',
          'Transacción registrada correctamente',
          'success',
        );

        // Generar nuevo número de documento para la siguiente transacción
        this.nuevaTransaccion.numeroDocumentoOrigen = this.generarNumeroDocumento();
        console.log('Nuevo número de documento generado:', this.nuevaTransaccion.numeroDocumentoOrigen);

        const confirmar = await this.alertService.showConfirm(
          'Confirmar',
          '¿Desea procesar la transacción ahora?\n\nEsto actualizará el kardex y el stock',
          'question',
        );

        if (confirmar) {
          await this.procesarTransaccion(resultado.idTransaccion);
        } else {
          // Si no procesa, limpiar solo los detalles pero mantener el nuevo número
          this.nuevaTransaccion.detalles = [];
        }
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al guardar transacción:', error);
      this.alertService.showAlert(
        'Error',
        'Error al registrar transacción',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  validarTransaccion(): boolean {
    if (!this.nuevaTransaccion.tipoTransaccion) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar el tipo de transacción',
        'warning',
      );
      return false;
    }

    if (this.nuevaTransaccion.detalles.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe agregar al menos un item',
        'warning',
      );
      return false;
    }

    if (
      (this.nuevaTransaccion.tipoTransaccion === 'INGRESO' ||
       this.nuevaTransaccion.tipoTransaccion === 'REINGRESO' ||
       this.nuevaTransaccion.tipoTransaccion === 'DEVOLUCION_CONSUMO') &&
      !this.nuevaTransaccion.almacenDestino
    ) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar el almacén de destino',
        'warning',
      );
      return false;
    }

    if (
      this.nuevaTransaccion.tipoTransaccion === 'SALIDA' &&
      !this.nuevaTransaccion.almacenOrigen
    ) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar el almacén de origen',
        'warning',
      );
      return false;
    }

    return true;
  }

  async procesarTransaccion(idTransaccion: number) {
    try {
      this.loading = true;
      const resultado =
        await this.kardexService.procesarTransaccion(idTransaccion);

      if (resultado.status === 'success') {
        this.alertService.showAlert('Éxito', resultado.message, 'success');
        await this.cargarDatos();
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al procesar transacción:', error);
      this.alertService.showAlert(
        'Error',
        'Error al procesar transacción',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async verDetalleTransaccion(transaccion: any) {
    try {
      this.loading = true;
      this.transaccionDetalle =
        await this.kardexService.obtenerDetalleTransaccion(
          transaccion.idTransaccion,
        );
      this.modalDetalleTransaccion = true;
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      this.alertService.showAlert(
        'Error',
        'Error al obtener detalle de transacción',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async anularTransaccion(transaccion: any) {
    const confirmar = await this.alertService.showConfirm(
      '¿Está seguro de anular esta transacción?',
      'Esta acción no se puede deshacer',
      'warning',
    );

    if (!confirmar) return;

    const motivo = 'Anulado por usuario'; // Simplificado por ahora

    try {
      this.loading = true;
      const resultado = await this.kardexService.anularTransaccion(
        transaccion.idTransaccion,
        motivo,
      );

      if (resultado.status === 'success') {
        this.alertService.showAlert('Éxito', resultado.message, 'success');
        await this.listarTransacciones();
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al anular transacción:', error);
      this.alertService.showAlert(
        'Error',
        'Error al anular transacción',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  getSeverityEstado(
    estado: string,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' {
    switch (estado) {
      case 'PENDIENTE':
        return 'warn';
      case 'PROCESADO':
        return 'success';
      case 'ANULADO':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  // ==================== DASHBOARD ====================

  async cargarDashboard() {
    try {
      this.dashboard = await this.kardexService.dashboardInventario();
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    }
  }

  async cargarReporteValorizacion() {
    try {
      this.loading = true;
      this.reporteValorizacion = await this.kardexService.reporteValorizacion();
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      this.alertService.showAlert(
        'Error',
        'Error al cargar reporte de valorización',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  exportarReporte() {
    // Implementar exportación a Excel
    this.alertService.showAlert(
      'Info',
      'Funcionalidad de exportación en desarrollo',
      'info',
    );
  }

  // ==================== UTILIDADES ====================

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatearFechaSQL(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(valor);
  }

  formatearNumero(valor: number): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(valor);
  }

  // ==================== PRUEBAS Y SINCRONIZACIÓN ====================

  async probarFlujoCompleto() {
    const confirmar = await this.alertService.showConfirm(
      '¿Desea probar el flujo completo de kardex?',
      'Esto insertará datos ficticios para pruebas',
      'info',
    );

    if (!confirmar) return;

    try {
      this.loading = true;
      const resultado = await this.kardexService.probarFlujoCompleto();

      if (resultado.status === 'success') {
        this.alertService.showAlert('Éxito', resultado.message, 'success');
        await this.cargarDatos();
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al probar flujo:', error);
      this.alertService.showAlert(
        'Error',
        'Error al probar flujo completo',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async ejecutarRecepcionOC() {
    const formResult = await this.alertService.showFormDialog(
      'Ejecutar Recepción de Orden de Compra',
      [
        {
          label: 'Compañía Socio',
          name: 'companiaSocio',
          type: 'text',
          defaultValue: '00000800',
          required: true,
        },
        {
          label: 'Número de Orden',
          name: 'numeroOrden',
          type: 'text',
          defaultValue: '0000000146',
          required: true,
        },
        {
          label: 'Almacén',
          name: 'almacenCodigo',
          type: 'text',
          defaultValue: 'H001',
          required: true,
        },
        {
          label: 'Usuario',
          name: 'usuario',
          type: 'text',
          defaultValue: 'MISESF',
          required: false,
        },
      ],
    );

    if (!formResult) return;

    try {
      this.loading = true;
      const formData = formResult as RecepcionOCForm;
      const resultado = await this.kardexService.ejecutarRecepcionOC({
        companiaSocio: formData.companiaSocio,
        numeroOrden: formData.numeroOrden,
        almacenCodigo: formData.almacenCodigo,
        usuario: formData.usuario,
      });

      if (resultado.status === 'success') {
        this.alertService.showAlert(
          'Éxito',
          `Recepción ejecutada. Documento: ${resultado.numeroDocumento}`,
          'success',
        );
        await this.cargarDatos();
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al ejecutar recepción:', error);
      this.alertService.showAlert(
        'Error',
        'Error al ejecutar recepción de OC',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async sincronizarSpring() {
    const formResult = await this.alertService.showFormDialog(
      'Sincronizar con SPRING',
      [
        {
          label: 'Compañía Socio (opcional)',
          name: 'companiaSocio',
          type: 'text',
          required: false,
        },
        {
          label: 'Fecha Desde (opcional)',
          name: 'fechaDesde',
          type: 'date',
          required: false,
        },
        {
          label: 'Fecha Hasta (opcional)',
          name: 'fechaHasta',
          type: 'date',
          required: false,
        },
        {
          label: 'Solo pendientes',
          name: 'soloPendientes',
          type: 'checkbox',
          required: false,
        },
      ],
    );

    if (!formResult) return;

    const formData = formResult as SincronizacionForm;
    try {
      this.loading = true;
      const resultado = await this.kardexService.sincronizarSpring(formData);

      if (resultado.status === 'success') {
        this.alertService.showAlert(
          'Éxito',
          `Datos preparados: ${resultado.TotalRegistros} registros`,
          'success',
        );
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al sincronizar:', error);
      this.alertService.showAlert(
        'Error',
        'Error al sincronizar con SPRING',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async ejecutarSincronizacionSpring() {
    const formResult = await this.alertService.showFormDialog(
      'Ejecutar Sincronización con SPRING',
      [
        {
          label: 'Compañía Socio (opcional)',
          name: 'companiaSocio',
          type: 'text',
          required: false,
        },
        {
          label: 'Fecha Desde (opcional)',
          name: 'fechaDesde',
          type: 'date',
          required: false,
        },
        {
          label: 'Fecha Hasta (opcional)',
          name: 'fechaHasta',
          type: 'date',
          required: false,
        },
        {
          label: 'Solo pendientes',
          name: 'soloPendientes',
          type: 'checkbox',
          required: false,
        },
        {
          label: 'Ejecutar Real (no simular)',
          name: 'ejecutarReal',
          type: 'checkbox',
          required: false,
        },
      ],
    );

    if (!formResult) return;

    const formData = formResult as EjecutarSincronizacionForm;
    const modo = formData.ejecutarReal ? 'real' : 'simulación';
    const confirmar = await this.alertService.showConfirm(
      `¿Desea ejecutar la sincronización en modo ${modo}?`,
      'Esta acción procesará los datos para SPRING',
      'info',
    );

    if (!confirmar) return;

    try {
      this.loading = true;
      const resultado =
        await this.kardexService.ejecutarSincronizacionSpring(formData);

      if (resultado.status === 'success') {
        let mensaje = `Procesados: ${resultado.TotalProcesados} registros\n`;
        mensaje += `Errores: ${resultado.TotalErrores}\n`;
        if (resultado.TotalSimulados > 0)
          mensaje += `Simulados: ${resultado.TotalSimulados}\n`;
        if (resultado.TotalEnviados > 0)
          mensaje += `Enviados: ${resultado.TotalEnviados}`;

        this.alertService.showAlert('Éxito', mensaje, 'success');
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al ejecutar sincronización:', error);
      this.alertService.showAlert(
        'Error',
        'Error al ejecutar sincronización con SPRING',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async verificarEstadoSincronizacion() {
    const formResult = await this.alertService.showFormDialog(
      'Verificar Estado de Sincronización',
      [
        {
          label: 'Compañía Socio (opcional)',
          name: 'companiaSocio',
          type: 'text',
          required: false,
        },
      ],
    );

    if (!formResult) return;

    const formData = formResult as VerificarEstadoForm;
    try {
      this.loading = true;
      const resultado = await this.kardexService.verificarEstadoSincronizacion(
        formData.companiaSocio,
      );

      if (Array.isArray(resultado) && resultado.length > 0) {
        let mensaje = 'Estado de sincronización:\n\n';
        resultado.forEach((tabla: any) => {
          mensaje += `${tabla.Tabla}:\n`;
          mensaje += `  - Total: ${tabla.TotalRegistros}\n`;
          mensaje += `  - Pendientes: ${tabla.PendientesSincronizar}\n`;
          mensaje += `  - Completados: ${tabla.Completados}\n`;
          mensaje += `  - Última modificación: ${this.formatearFecha(tabla.UltimaModificacion)}\n\n`;
        });

        this.alertService.showAlert(
          'Estado de Sincronización',
          mensaje,
          'info',
        );
      } else {
        this.alertService.showAlert(
          'Información',
          'No se encontraron datos',
          'info',
        );
      }
    } catch (error) {
      console.error('Error al verificar estado:', error);
      this.alertService.showAlert(
        'Error',
        'Error al verificar estado de sincronización',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  // Métodos para el modal de nueva transacción
  agregarDetalleTransaccion() {
    this.nuevaTransaccion.detalles.push({
      idItem: null,
      codigoItem: '',
      descripcionItem: '',
      unidadMedida: '',
      cantidad: null,
      costoUnitario: null,
      costoTotal: 0,
      lote: '',
      fechaVencimiento: null,
      observaciones: '',
      itemSeleccionado: null, // Agregado para autocomplete
    });
  }

  eliminarDetalleTransaccion(index: number) {
    this.nuevaTransaccion.detalles.splice(index, 1);
  }

  seleccionarItemEnDetalle(index: number) {
    const detalle = this.nuevaTransaccion.detalles[index];
    let itemSeleccionado = detalle.itemSeleccionado;
    
    // Si es string, buscar el objeto completo
    if (typeof itemSeleccionado === 'string') {
      itemSeleccionado = this.items.find(item => 
        item.codigoItem === itemSeleccionado || 
        item.label === itemSeleccionado
      );
    }

    if (itemSeleccionado) {
      detalle.idItem = itemSeleccionado.idItem;
      detalle.codigoItem = itemSeleccionado.codigoItem;
      detalle.descripcionItem = itemSeleccionado.descripcionItem;
      detalle.unidadMedida = itemSeleccionado.unidadMedida;
      detalle.costoUnitario = itemSeleccionado.costoPromedio || 0;
      
      // Mantener el objeto completo para el autocomplete
      detalle.itemSeleccionado = itemSeleccionado;
      
      this.calcularTotalDetalle(index);
    }
  }

  calcularTotalDetalle(index: number) {
    const detalle = this.nuevaTransaccion.detalles[index];
    detalle.costoTotal = (detalle.cantidad || 0) * (detalle.costoUnitario || 0);
  }

  calcularTotalTransaccion(): number {
    return this.nuevaTransaccion.detalles.reduce(
      (total, det) => total + (det.costoTotal || 0),
      0,
    );
  }

  // Cargar items para el dropdown
  async cargarItems() {
    try {
      this.loading = true;
      const resultado = await this.kardexService.consultarStock({});

      console.log('Items: ', resultado);

      if (Array.isArray(resultado) && resultado.length > 0) {
        this.items = resultado.map((item: any) => ({
          idItem: item.idItem,
          codigoItem: item.codigoItem,
          descripcionItem: item.descripcionItem,
          unidadMedida: item.unidadMedida,
          costoPromedio: item.costoPromedio,

          almacen: item.almacen, // 👈 IMPORTANTE

          // 👇 lo que mostrará el autocomplete
          label: `${item.codigoItem} - ${item.descripcionItem}`,
          // label: `${item.codigoItem}`
        }));
      }
    } catch (error) {
      console.error('Error al cargar items:', error);
    } finally {
      this.loading = false;
    }
  }
}
