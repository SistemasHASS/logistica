import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConsolidacionService } from '../../../../services/consolidacion.service';
import { AlertService } from '../../../../shared/alertas/alerts.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { LogisticaService } from '../../services/logistica.service';
import {
  ItemPendienteConsolidacion,
  FiltroConsolidacion,
  CrearConsolidacionRequest,
  ConsolidacionCab,
  FiltroHistorial,
  GenerarSolicitudCotizacionRequest,
  AnularConsolidacionRequest,
  AnularLineaConsolidacionRequest,
  AnularItemPendienteRequest,
  SaldoPendienteAprobacion,
  AprobarRechazarSaldoPendienteRequest,
} from '../../../../models/consolidacion.model';
import { SolicitudCotizacion } from '@/app/shared/interfaces/Tables';
import {
  ItemTemporalConsolidacion,
  TipoRequerimiento,
} from '@/app/shared/interfaces/Tables';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

@Component({
  selector: 'app-consolidacion-requerimientos-original',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    SelectModule,
    NumeroRequerimientoPipe,
    DatePickerModule,
    MultiSelectModule,
  ],
  templateUrl: './consolidacion-requerimientos-original.component.html',
  styleUrls: ['./consolidacion-requerimientos-original.component.scss'],
})
export class ConsolidacionRequerimientosOriginalComponent implements OnInit {
  @ViewChild('dtPendientes') tablePendientes!: Table;
  @ViewChild('dtHistorial') tableHistorial!: Table;

  // Usuario
  usuario: any;

  // Tabs
  tabActiva: number = 0;

  // Items pendientes de consolidar
  itemsPendientes: ItemPendienteConsolidacion[] = [];
  seleccionarTodos: boolean = false;

  // Servicios pendientes de consolidar
  serviciosPendientes: any[] = [];
  serviciosPendientesFiltrados: any[] = [];
  seleccionarTodosServicios: boolean = false;

  // Historial de consolidaciones
  historialConsolidaciones: ConsolidacionCab[] = [];

  // Modal detalle
  modalDetalleAbierto: boolean = false;
  consolidacionSeleccionada: ConsolidacionCab | null = null;

  // Modal lista temporal
  modalListaTemporalAbierto: boolean = false;
  itemsTemporales: ItemTemporalConsolidacion[] = [];
  contadorItemsTemporales: number = 0;

  // Loading
  loading: boolean = false;

  // Filtros pendientes (items)
  filtroFamilias: string[] = [];
  filtroCategorias: string[] = [];
  filtroItem: string = '';
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;
  filtroTipo: string = '';
  filtroAreas: string[] = [];
  filtroUsuarios: string[] = [];
  filtroEmpresa: string = '';

  // Filtros servicios
  filtroServicioCommodity: string = '';
  filtroServicioUsuarios: string[] = [];
  filtroServicioFechaInicio: Date | null = null;
  filtroServicioFechaFin: Date | null = null;
  filtroServicioEmpresa: string = '';

  // Opciones de filtro dinámicas
  familiaOpciones: { label: string; value: string }[] = [];
  categoriaOpciones: { label: string; value: string }[] = [];
  tipoOpciones = [
    { label: 'Todos', value: '' },
    { label: 'Compra', value: 'COMPRA' },
    { label: 'Consumo', value: 'CONSUMO' },
  ];
  areaOpciones: { label: string; value: string }[] = [];
  usuarioOpciones: { label: string; value: string }[] = [];
  empresaOpciones: { label: string; value: string }[] = [];

  // Filtros historial
  filtroHistEstado: string = '';
  filtroHistFechaInicio: Date | null = null;
  filtroHistFechaFin: Date | null = null;
  estadoOpciones = [
    { label: 'Todos', value: '' },
    { label: 'Consolidado', value: 'CONSOLIDADO' },
    { label: 'Anulado', value: 'ANULADO' },
  ];
  areasOpciones: any[] | undefined;

  modalDetallePendienteAbierto: boolean = false;
  detallePendienteSeleccionado: any = null;

  constructor(
    private consolidacionService: ConsolidacionService,
    private alertService: AlertService,
    private dexieService: DexieService,
    private logisticaService: LogisticaService,
  ) {
    const usuarioStr = localStorage.getItem('usuario');
    this.usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
  }

  async ngOnInit() {
    await this.cargarEmpresas();
    await this.cargarItemsPendientes();
    await this.cargarHistorial();
    await this.cargarSaldosPendientes();
    await this.actualizarContadorTemporales();
    await this.marcarItemsYaEnListaTemporal();
  }

  // =============================================
  // CARGAR EMPRESAS
  // =============================================

  async cargarEmpresas() {
    try {
      this.logisticaService.listarEmpresas([]).subscribe({
        next: (empresas: any) => {
          console.log('📊 Empresas recibidas del backend:', empresas);
          if (Array.isArray(empresas)) {
            this.empresaOpciones = [
              { label: 'Todas las empresas', value: '' },
              ...empresas.map((emp: any) => {
                const label = emp.razonSocial || emp.razonsocial || emp.nombre || emp.ruc;
                const value = emp.ruc || emp.id;
                console.log(`  Empresa: ${label} → RUC: ${value}`);
                return { label, value };
              })
            ];
            console.log('✅ Opciones de empresa cargadas:', this.empresaOpciones);
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar empresas:', error);
          this.empresaOpciones = [{ label: 'Todas las empresas', value: '' }];
        }
      });
    } catch (error) {
      console.error('❌ Error al cargar empresas:', error);
      this.empresaOpciones = [{ label: 'Todas las empresas', value: '' }];
    }
  }

  // =============================================
  // GESTIÓN DE LISTA TEMPORAL (DEXIE)
  // =============================================

  async actualizarContadorTemporales() {
    this.contadorItemsTemporales =
      await this.dexieService.contarItemsTemporalesConsolidacion();
  }

  async marcarItemsYaEnListaTemporal() {
    // Marcar los items que ya están en la lista temporal
    for (const item of this.itemsPendientes) {
      const estaEnLista =
        await this.dexieService.itemEstaEnListaTemporalConsolidacion(
          item.idDetalle,
        );
      if (estaEnLista) {
        item.seleccionado = true;
      }
    }
    this.actualizarSeleccionarTodos();
  }

  async agregarSeleccionadosAListaTemporal() {
    const seleccionados = this.itemsSeleccionados;

    if (seleccionados.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar al menos un ítem',
        'warning',
      );
      return;
    }

    try {
      this.loading = true;

      // Agregar a Dexie
      await this.dexieService.agregarItemsTemporalesConsolidacion(
        seleccionados,
      );

      // Actualizar contador
      await this.actualizarContadorTemporales();

      this.alertService.showAlert(
        'Agregado a Lista Temporal',
        `Se agregaron ${seleccionados.length} ítem(s) a la lista temporal de consolidación`,
        'success',
      );

      // Limpiar selección visual pero mantener los items marcados
      await this.marcarItemsYaEnListaTemporal();
    } catch (error) {
      console.error('Error al agregar a lista temporal:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudieron agregar los ítems a la lista temporal',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async verListaTemporal() {
    try {
      this.loading = true;
      this.itemsTemporales =
        await this.dexieService.obtenerItemsTemporalesConsolidacion();
      this.modalListaTemporalAbierto = true;
    } catch (error) {
      console.error('Error al cargar lista temporal:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudo cargar la lista temporal',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async eliminarDeListaTemporal(item: ItemTemporalConsolidacion) {
    const confirmacion = await this.alertService.showConfirm(
      'Eliminar de Lista',
      `¿Desea eliminar el ítem <strong>${item.item}</strong> de la lista temporal?`,
      'question',
    );

    if (!confirmacion) return;

    try {
      await this.dexieService.eliminarItemTemporalConsolidacion(item.idDetalle);
      await this.actualizarContadorTemporales();

      // Recargar lista temporal
      this.itemsTemporales =
        await this.dexieService.obtenerItemsTemporalesConsolidacion();

      // Actualizar marca en tabla principal
      const itemEnTabla = this.itemsPendientes.find(
        (i) => i.idDetalle === item.idDetalle,
      );
      if (itemEnTabla) {
        itemEnTabla.seleccionado = false;
      }
      this.actualizarSeleccionarTodos();

      this.alertService.showAlert(
        'Éxito',
        'Ítem eliminado de la lista temporal',
        'success',
      );
    } catch (error) {
      console.error('Error al eliminar de lista temporal:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudo eliminar el ítem',
        'error',
      );
    }
  }

  async limpiarListaTemporal() {
    if (this.contadorItemsTemporales === 0) {
      this.alertService.showAlert(
        'Atención',
        'No hay ítems en la lista temporal',
        'info',
      );
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Limpiar Lista Temporal',
      `¿Desea eliminar todos los ${this.contadorItemsTemporales} ítem(s) de la lista temporal?`,
      'warning',
    );

    if (!confirmacion) return;

    try {
      await this.dexieService.limpiarListaTemporalConsolidacion();
      await this.actualizarContadorTemporales();
      this.itemsTemporales = [];

      // Desmarcar todos los items
      this.itemsPendientes.forEach((i) => (i.seleccionado = false));
      this.seleccionarTodos = false;

      if (this.modalListaTemporalAbierto) {
        this.modalListaTemporalAbierto = false;
      }

      this.alertService.showAlert(
        'Éxito',
        'Lista temporal limpiada',
        'success',
      );
    } catch (error) {
      console.error('Error al limpiar lista temporal:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudo limpiar la lista temporal',
        'error',
      );
    }
  }

  cerrarModalListaTemporal() {
    this.modalListaTemporalAbierto = false;
  }

  async obtenerResumenListaTemporal() {
    return await this.dexieService.obtenerResumenListaTemporalConsolidacion();
  }

  // =============================================
  // TAB 1: ITEMS PENDIENTES
  // =============================================

  async cargarItemsPendientes() {
    try {
      this.loading = true;

      const filtros: FiltroConsolidacion = {};
      if (this.filtroFamilias.length > 0) filtros.familia = this.filtroFamilias;
      if (this.filtroCategorias.length > 0)
        filtros.categoria = this.filtroCategorias;
      if (this.filtroItem.trim()) filtros.item = this.filtroItem.trim();
      if (this.filtroFechaInicio)
        filtros.fechaInicio = this.formatearFecha(this.filtroFechaInicio);
      if (this.filtroFechaFin)
        filtros.fechaFin = this.formatearFecha(this.filtroFechaFin);
      if (this.filtroTipo) filtros.tipo = this.filtroTipo;
      if (this.filtroEmpresa) filtros.empresa = this.filtroEmpresa;
      this.itemsPendientes =
        await this.consolidacionService.listarItemsPendientes(filtros);
      console.log('Items pendientes:', this.itemsPendientes);

      // this.itemsPendientes = this.itemsPendientes.filter(i => i.tipoitem === 'CONSUMO');
      // console.log('Items pendientes filtrados:', this.itemsPendientes);

      // Limpiar selección
      this.itemsPendientes.forEach((i) => (i.seleccionado = false));
      this.seleccionarTodos = false;

      // Extraer opciones únicas para filtros
      this.extraerOpcionesFiltro();
    } catch (error) {
      console.error('Error al cargar items pendientes:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudieron cargar los ítems pendientes',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  extraerOpcionesFiltro() {
    const familias = [
      ...new Set(this.itemsPendientes.map((i) => i.familia).filter((f) => f)),
    ];
    this.familiaOpciones = familias.map((f) => ({ label: f, value: f }));

    const categorias = [
      ...new Set(this.itemsPendientes.map((i) => i.categoria).filter((c) => c)),
    ];
    this.categoriaOpciones = categorias.map((c) => ({ label: c, value: c }));
  }

  async aplicarFiltros() {
    await this.cargarItemsPendientes();
  }

  limpiarFiltros() {
    this.filtroFamilias = [];
    this.filtroCategorias = [];
    this.filtroItem = '';
    this.filtroFechaInicio = null;
    this.filtroFechaFin = null;
    this.filtroTipo = '';
    this.filtroEmpresa = '';
    this.cargarItemsPendientes();
  }

  // Selección múltiple
  toggleSeleccionarTodos() {
    this.itemsPendientes.forEach(
      (item) => (item.seleccionado = this.seleccionarTodos),
    );
  }

  actualizarSeleccionarTodos() {
    this.seleccionarTodos =
      this.itemsPendientes.length > 0 &&
      this.itemsPendientes.every((i) => i.seleccionado);
  }

  get itemsSeleccionados(): ItemPendienteConsolidacion[] {
    return this.itemsPendientes.filter((i) => i.seleccionado);
  }

  // get itemsSeleccionados() {
  //   return this.itemsPendientes.filter((x) => x.seleccionado);
  // }

  // Consolidar seleccionados
  async consolidarSeleccionados() {
    const seleccionados = this.itemsSeleccionados;

    if (seleccionados.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar al menos un ítem para consolidar',
        'warning',
      );
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Consolidación',
      `¿Desea consolidar ${seleccionados.length} ítem(s) seleccionado(s)?`,
      'question',
    );

    if (!confirmacion) return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: CrearConsolidacionRequest = {
        usuario:
          this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',

        itemsSeleccionados: seleccionados.map((item) => ({
          idDetalle: item.idDetalle,
          tipo: item.tipoRequerimiento,
        })),
      };

      const resultado =
        await this.consolidacionService.crearConsolidacion(request);

      this.alertService.cerrarModalCarga();

      if (resultado.success) {
        this.alertService.showAlert(
          'Consolidación Exitosa',
          `Código: <strong>${resultado.codigo}</strong><br>Total ítems: ${resultado.totalItems}`,
          'success',
        );
        await this.cargarItemsPendientes();
        await this.cargarHistorial();
      } else {
        this.alertService.showAlertError(
          'Error',
          resultado.mensaje || 'No se pudo crear la consolidación',
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      console.error('Error al consolidar:', error);
      const msg =
        error?.error?.mensaje ||
        error?.message ||
        'Error inesperado al consolidar';
      this.alertService.showAlertError('Error', msg);
    } finally {
      this.loading = false;
    }
  }

  // NUEVA: Consolidar TODO de la lista temporal
  async consolidarListaTemporal() {
    const cantidadItems = await this.dexieService.contarItemsTemporales();

    if (cantidadItems === 0) {
      this.alertService.showAlert(
        'Atención',
        'No hay ítems en la lista temporal para consolidar',
        'warning',
      );
      return;
    }

    // Obtener resumen
    const resumen = await this.obtenerResumenListaTemporal();

    let mensajeResumen = `<p>Se consolidarán <strong>${resumen.total}</strong> ítem(s) de la lista temporal</p>`;
    mensajeResumen += '<p><strong>Resumen por Familia:</strong></p><ul>';
    resumen.porFamilia.forEach((f) => {
      mensajeResumen += `<li>${f.familia}: ${f.items} ítem(s)</li>`;
    });
    mensajeResumen += '</ul>';

    const confirmacion = await this.alertService.showConfirm(
      'Consolidar Lista Temporal',
      mensajeResumen,
      'question',
    );

    if (!confirmacion) return;

    try {
      // this.loading = true;
      this.alertService.mostrarModalCarga();

      // Obtener todos los items temporales
      const itemsTemporales = await this.dexieService.obtenerItemsTemporales();

      const request: CrearConsolidacionRequest = {
        usuario:
          this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',

        itemsSeleccionados: itemsTemporales.map((item) => ({
          idDetalle: item.idDetalle,
          tipo: item.tipoRequerimiento as TipoRequerimiento,
        })),
      };

      const resultado =
        await this.consolidacionService.crearConsolidacion(request);

      this.alertService.cerrarModalCarga();

      if (resultado.success) {
        // Limpiar lista temporal después de consolidar exitosamente
        await this.dexieService.limpiarListaTemporal();
        await this.actualizarContadorTemporales();

        this.alertService.showAlert(
          'Consolidación Exitosa',
          `Código: <strong>${resultado.codigo}</strong><br>Total ítems: ${resultado.totalItems}`,
          'success',
        );

        if (this.modalListaTemporalAbierto) {
          this.modalListaTemporalAbierto = false;
        }

        await this.cargarItemsPendientes();
        await this.cargarHistorial();
      } else {
        this.alertService.showAlertError(
          'Error',
          resultado.mensaje || 'No se pudo crear la consolidación',
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      console.error('Error al consolidar lista temporal:', error);
      const msg =
        error?.error?.mensaje ||
        error?.message ||
        'Error inesperado al consolidar';
      this.alertService.showAlertError('Error', msg);
    } finally {
      // this.loading = false;
      // try {
      //   this.alertService.cerrarModalCarga();
      // } catch {}
    }
  }

  // NUEVA: Consolidar lista temporal con opción de cotización
  async consolidarListaTemporalYCotizar() {
    const cantidadItems = await this.dexieService.contarItemsTemporales();

    if (cantidadItems === 0) {
      this.alertService.showAlert(
        'Atención',
        'No hay ítems en la lista temporal para consolidar',
        'warning',
      );
      return;
    }

    const opcion = await this.alertService.showThreeButtons(
      'Consolidar Lista Temporal',
      `Se consolidarán <strong>${cantidadItems}</strong> ítem(s) de la lista temporal.<br><br>¿Qué desea hacer después de consolidar?`,
      'question',
      'Consolidar y Cotizar',
      'Solo Consolidar',
      'Cancelar',
    );

    if (opcion === 'button3') return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      // Obtener todos los items temporales
      const itemsTemporales = await this.dexieService.obtenerItemsTemporales();

      const request: CrearConsolidacionRequest = {
        usuario:
          this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
        itemsSeleccionados: itemsTemporales.map((item) => ({
          idDetalle: item.idDetalle,
          tipo: item.tipoRequerimiento,
        })),
      };

      const resultado =
        await this.consolidacionService.crearConsolidacion(request);

      if (!resultado.success) {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlertError(
          'Error',
          resultado.mensaje || 'No se pudo crear la consolidación',
        );
        return;
      }

      // Si eligió consolidar y cotizar
      if (opcion === 'button1') {
        const reqCotizacion: GenerarSolicitudCotizacionRequest = {
          idConsolidacion: resultado.idConsolidacion,
          usuario:
            this.usuario?.documentoidentidad ||
            this.usuario?.usuario ||
            'SYSTEM',
        };

        try {
          const resCotizacion =
            await this.consolidacionService.generarSolicitudCotizacion(
              reqCotizacion,
            );
          this.alertService.cerrarModalCarga();

          if (resCotizacion.success) {
            // Guardar la solicitud en Dexie para que aparezca en el módulo de cotizaciones
            try {
              // Obtener detalles de la consolidación para guardar en Dexie
              const consolidacionCompleta = await this.consolidacionService.obtenerConsolidacion(resultado.idConsolidacion);
              console.log('Consolidación completa:', consolidacionCompleta);
              
              const solicitudDexie: SolicitudCotizacion = {
                noSolicitud: resCotizacion.noSolicitud,
                idConsolidacion: resultado.idConsolidacion,
                fechaGeneracion: new Date().toISOString(),
                usuarioGenera: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
                totalItems: resultado.totalItems,
                estado: 'PENDIENTE',
                detalle: consolidacionCompleta.detalles?.map((det: any) => ({
                  noLinea: det.noLinea,
                  codigoItem: det.codigoItem,
                  descripcionItem: det.descripcionItem,
                  cantidad: det.cantidadTotal,
                  unidadMedida: det.unidadMedida,
                  ceco: det.ceco || det.origenes?.[0]?.ceco || '',
                  proyecto: det.proyecto || det.origenes?.[0]?.proyecto || ''
                })) || []
              };
              
              console.log('Guardando en Dexie:', solicitudDexie);
              await this.dexieService.saveSolicitudCotizacion(solicitudDexie);
              console.log('✅ Solicitud guardada en Dexie:', resCotizacion.noSolicitud);
            } catch (errDexie: any) {
              console.error('Error al guardar en Dexie:', errDexie);
              // No mostrar error al usuario, solo log
            }

            this.alertService.showAlert(
              'Consolidación y Cotización Generadas',
              `Consolidación: <strong>${resultado.codigo}</strong><br>` +
                `Solicitud Cotización: <strong>${resCotizacion.noSolicitud}</strong><br>` +
                `Total ítems: ${resultado.totalItems}`,
              'success',
            );
          } else {
            this.alertService.showAlert(
              'Consolidación creada, Cotización con error',
              `Consolidación: <strong>${resultado.codigo}</strong> creada correctamente.<br>` +
                `Error en cotización: ${resCotizacion.mensaje}`,
              'warning',
            );
          }
        } catch (errCot: any) {
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Consolidación creada, Cotización con error',
            `Consolidación: <strong>${resultado.codigo}</strong> creada correctamente.<br>` +
              `Error al generar cotización: ${errCot?.message || 'Error inesperado'}`,
            'warning',
          );
        }
      } else {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert(
          'Consolidación Exitosa',
          `Código: <strong>${resultado.codigo}</strong><br>Total ítems: ${resultado.totalItems}`,
          'success',
        );
      }

      // Limpiar lista temporal después de consolidar exitosamente
      await this.dexieService.limpiarListaTemporal();
      await this.actualizarContadorTemporales();

      if (this.modalListaTemporalAbierto) {
        this.modalListaTemporalAbierto = false;
      }

      await this.cargarItemsPendientes();
      await this.cargarHistorial();
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      console.error('Error al consolidar:', error);
      const msg =
        error?.error?.mensaje ||
        error?.message ||
        'Error inesperado al consolidar';
      this.alertService.showAlertError('Error', msg);
    } finally {
      this.loading = false;
    }
  }

  async exportarListaTemporal() {
    const items = await this.dexieService.obtenerItemsTemporalesConsolidacion();

    if (items.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'No hay ítems en la lista temporal para exportar',
        'info',
      );
      return;
    }

    const data = items.map((item) => ({
      Item: item.item,
      Descripción: item.descripcion,
      Familia: item.familia,
      Categoría: item.categoria,
      Cantidad: item.cantidad,
      Unidad: item.unidad,
      'Tipo Requerimiento': item.tipoRequerimiento,
      'Requerimiento Origen': item.requerimientoOrigen,
      'Fecha Creación': item.fechaCreacion,
      'Fecha Selección': item.fechaSeleccion,
    }));

    const csv = this.convertToCSV(data);
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lista_temporal_consolidacion_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    this.alertService.showAlert(
      'Éxito',
      'Lista temporal exportada correctamente',
      'success',
    );
  }

  // =============================================
  // TAB 2: HISTORIAL
  // =============================================

  async cargarHistorial() {
    try {
      const filtros: FiltroHistorial = {};
      if (this.filtroHistEstado) filtros.estado = this.filtroHistEstado;
      if (this.filtroHistFechaInicio)
        filtros.fechaInicio = this.formatearFecha(this.filtroHistFechaInicio);
      if (this.filtroHistFechaFin)
        filtros.fechaFin = this.formatearFecha(this.filtroHistFechaFin);

      this.historialConsolidaciones =
        await this.consolidacionService.listarHistorial(filtros);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  }

  async aplicarFiltrosHistorial() {
    await this.cargarHistorial();
  }

  // Ver detalle de una consolidación
  async verDetalle(consolidacion: ConsolidacionCab) {
    try {
      this.alertService.mostrarModalCarga();
      this.consolidacionSeleccionada =
        await this.consolidacionService.obtenerConsolidacion(
          consolidacion.idConsolidacion,
        );
      console.log('📦 Consolidación seleccionada:', this.consolidacionSeleccionada);
      console.log('📋 Detalles:', this.consolidacionSeleccionada.detalles);
      if (this.consolidacionSeleccionada.detalles && this.consolidacionSeleccionada.detalles.length > 0) {
        console.log('🔍 Primer detalle tipo:', this.consolidacionSeleccionada.detalles[0].tipo);
        console.log('🔍 Primer detalle completo:', this.consolidacionSeleccionada.detalles[0]);
      }
      this.alertService.cerrarModalCarga();
      this.modalDetalleAbierto = true;
    } catch (error) {
      this.alertService.cerrarModalCarga();
      console.error('Error al cargar detalle:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudo cargar el detalle',
        'error',
      );
    }
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.consolidacionSeleccionada = null;
  }

  // =============================================
  // EXPORTAR A EXCEL
  // =============================================

  exportarExcel() {
    const data = this.itemsPendientes.map((item) => ({
      Item: item.item,
      Descripción: item.descripcion,
      Familia: item.familia,
      Categoría: item.categoria,
      Cantidad: item.cantidad,
      Unidad: item.unidad,
      'Tipo Requerimiento': item.tipoRequerimiento,
      'Requerimiento Origen': item.requerimientoOrigen,
      'Fecha Creación': item.fechaCreacion,
      Estado: item.estadoDetalleConsolidacion,
    }));

    const csv = this.convertToCSV(data);
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `consolidacion_pendientes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => `"${row[h] ?? ''}"`).join(','),
    );
    return [headers.join(','), ...rows].join('\n');
  }

  // =============================================
  // GENERAR SOLICITUD DE COTIZACIÓN
  // =============================================

  async generarSolicitudCotizacion(consolidacion: ConsolidacionCab) {
    if (consolidacion.estado !== 'CONSOLIDADO') {
      this.alertService.showAlert(
        'Atención',
        'Solo se pueden cotizar consolidaciones en estado CONSOLIDADO',
        'warning',
      );
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Generar Solicitud de Cotización',
      `¿Desea generar una Solicitud de Cotización para la consolidación <strong>${consolidacion.codigo}</strong>?`,
      'question',
    );

    if (!confirmacion) return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: GenerarSolicitudCotizacionRequest = {
        idConsolidacion: consolidacion.idConsolidacion,
        usuario:
          this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
      };

      const resultado =
        await this.consolidacionService.generarSolicitudCotizacion(request);

      this.alertService.cerrarModalCarga();

      if (resultado.success) {
        // Guardar la solicitud en Dexie para que aparezca en el módulo de cotizaciones
        try {
          // Obtener detalles de la consolidación para guardar en Dexie
          const consolidacionCompleta = await this.consolidacionService.obtenerConsolidacion(consolidacion.idConsolidacion);
          console.log('Consolidación completa (individual):', consolidacionCompleta);
          
          const solicitudDexie: SolicitudCotizacion = {
            noSolicitud: resultado.noSolicitud,
            idConsolidacion: consolidacion.idConsolidacion,
            fechaGeneracion: new Date().toISOString(),
            usuarioGenera: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
            totalItems: resultado.totalItems,
            estado: 'PENDIENTE',
            detalle: consolidacionCompleta.detalles?.map((det: any, index: number) => ({
              noLinea: index + 1,
              codigoItem: det.codigoItem,
              descripcionItem: det.descripcionItem,
              cantidad: det.cantidadTotal || det.cantidad,
              unidadMedida: det.unidadMedida
            })) || []
          };
          
          await this.dexieService.saveSolicitudCotizacion(solicitudDexie);
          console.log('✅ Solicitud guardada en Dexie:', resultado.noSolicitud);
        } catch (errDexie: any) {
          console.error('Error al guardar en Dexie:', errDexie);
          this.alertService.showAlert(
            'Advertencia',
            'La solicitud se generó correctamente, pero hubo un error al guardarla localmente: ' + errDexie.message,
            'warning'
          );
        }

        this.alertService.showAlert(
          'Solicitud Generada',
          `Solicitud de Cotización: <strong>${resultado.noSolicitud}</strong><br>Total ítems: ${resultado.totalItems}`,
          'success',
        );
        await this.cargarHistorial();
      } else {
        this.alertService.showAlertError(
          'Error',
          resultado.mensaje || 'No se pudo generar la solicitud de cotización',
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      console.error('Error al generar solicitud cotización:', error);
      const msg =
        error?.error?.mensaje ||
        error?.message ||
        'Error inesperado al generar solicitud';
      this.alertService.showAlertError('Error', msg);
    } finally {
      this.loading = false;
    }
  }

  // =============================================
  // ANULAR CONSOLIDACIÓN
  // =============================================

  async anularConsolidacion(consolidacion: ConsolidacionCab) {
    if (consolidacion.estado === 'ANULADO') {
      this.alertService.showAlert(
        'Atención',
        'Esta consolidación ya fue anulada',
        'warning',
      );
      return;
    }

    const motivo = await this.alertService.showPrompt(
      'Anular Consolidación',
      'Ingrese el motivo de anulación:',
    );

    if (!motivo) return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: AnularConsolidacionRequest = {
        idConsolidacion: consolidacion.idConsolidacion,
        usuario:
          this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
        motivo: motivo,
      };

      const resultado =
        await this.consolidacionService.anularConsolidacion(request);

      this.alertService.cerrarModalCarga();

      if (resultado.success) {
        this.alertService.showAlert(
          'Éxito',
          'Consolidación anulada correctamente',
          'success',
        );
        await this.cargarItemsPendientes();
        await this.cargarHistorial();
      } else {
        this.alertService.showAlertError(
          'Error',
          resultado.mensaje || 'No se pudo anular la consolidación',
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      console.error('Error al anular consolidación:', error);
      const msg =
        error?.error?.mensaje || error?.message || 'Error inesperado al anular';
      this.alertService.showAlertError('Error', msg);
    } finally {
      this.loading = false;
    }
  }

  // =============================================
  // CONSOLIDAR CON OPCIÓN DE COTIZACIÓN
  // =============================================

  async consolidarYCotizar() {
    const seleccionados = this.itemsSeleccionados;

    if (seleccionados.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar al menos un ítem para consolidar',
        'warning',
      );
      return;
    }

    const opcion = await this.alertService.showThreeButtons(
      'Consolidar Requerimientos',
      `Se consolidarán <strong>${seleccionados.length}</strong> ítem(s) seleccionado(s).<br><br>¿Qué desea hacer después de consolidar?`,
      'question',
      'Consolidar y Cotizar',
      'Solo Consolidar',
      'Cancelar',
    );

    if (opcion === 'button3') return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: CrearConsolidacionRequest = {
        usuario:
          this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
        itemsSeleccionados: seleccionados.map((item) => ({
          idDetalle: item.idDetalle,
          tipo: item.tipoRequerimiento,
        })),
      };

      const resultado =
        await this.consolidacionService.crearConsolidacion(request);

      if (!resultado.success) {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlertError(
          'Error',
          resultado.mensaje || 'No se pudo crear la consolidación',
        );
        return;
      }

      // Si eligió consolidar y cotizar
      if (opcion === 'button1') {
        const reqCotizacion: GenerarSolicitudCotizacionRequest = {
          idConsolidacion: resultado.idConsolidacion,
          usuario:
            this.usuario?.documentoidentidad ||
            this.usuario?.usuario ||
            'SYSTEM',
        };

        try {
          const resCotizacion =
            await this.consolidacionService.generarSolicitudCotizacion(
              reqCotizacion,
            );
          this.alertService.cerrarModalCarga();

          if (resCotizacion.success) {
            // Guardar la solicitud en Dexie para que aparezca en el módulo de cotizaciones
            try {
              // Obtener detalles de la consolidación para guardar en Dexie
              const consolidacionCompleta = await this.consolidacionService.obtenerConsolidacion(resultado.idConsolidacion);
              console.log('Consolidación completa:', consolidacionCompleta);
              
              const solicitudDexie: SolicitudCotizacion = {
                noSolicitud: resCotizacion.noSolicitud,
                idConsolidacion: resultado.idConsolidacion,
                fechaGeneracion: new Date().toISOString(),
                usuarioGenera: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
                totalItems: resultado.totalItems,
                estado: 'PENDIENTE',
                detalle: consolidacionCompleta.detalles?.map((det: any) => ({
                  noLinea: det.noLinea,
                  codigoItem: det.codigoItem,
                  descripcionItem: det.descripcionItem,
                  cantidad: det.cantidadTotal,
                  unidadMedida: det.unidadMedida,
                  ceco: det.ceco || det.origenes?.[0]?.ceco || '',
                  proyecto: det.proyecto || det.origenes?.[0]?.proyecto || ''
                })) || []
              };
              
              console.log('Guardando en Dexie:', solicitudDexie);
              await this.dexieService.saveSolicitudCotizacion(solicitudDexie);
              console.log('✅ Solicitud guardada en Dexie:', resCotizacion.noSolicitud);
            } catch (errDexie: any) {
              console.error('Error al guardar en Dexie:', errDexie);
              // No mostrar error al usuario, solo log
            }

            this.alertService.showAlert(
              'Consolidación y Cotización Generadas',
              `Consolidación: <strong>${resultado.codigo}</strong><br>` +
                `Solicitud Cotización: <strong>${resCotizacion.noSolicitud}</strong><br>` +
                `Total ítems: ${resultado.totalItems}`,
              'success',
            );
          } else {
            this.alertService.showAlert(
              'Consolidación creada, Cotización con error',
              `Consolidación: <strong>${resultado.codigo}</strong> creada correctamente.<br>` +
                `Error en cotización: ${resCotizacion.mensaje}`,
              'warning',
            );
          }
        } catch (errCot: any) {
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Consolidación creada, Cotización con error',
            `Consolidación: <strong>${resultado.codigo}</strong> creada correctamente.<br>` +
              `Error al generar cotización: ${errCot?.message || 'Error inesperado'}`,
            'warning',
          );
        }
      } else {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert(
          'Consolidación Exitosa',
          `Código: <strong>${resultado.codigo}</strong><br>Total ítems: ${resultado.totalItems}`,
          'success',
        );
      }

      await this.cargarItemsPendientes();
      await this.cargarHistorial();
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      console.error('Error al consolidar:', error);
      const msg =
        error?.error?.mensaje ||
        error?.message ||
        'Error inesperado al consolidar';
      this.alertService.showAlertError('Error', msg);
    } finally {
      this.loading = false;
    }
  }

  // =============================================
  // UTILIDADES
  // =============================================

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'CONSOLIDADO':
        return 'badge bg-success';
      case 'ANULADO':
        return 'badge bg-danger';
      case 'EN_COTIZACION':
        return 'badge bg-info';
      case 'COTIZADO':
        return 'badge bg-primary';
      default:
        return 'badge bg-secondary';
    }
  }

  getTipoBadgeClass(tipo: string): string {
    return tipo === 'COMPRA'
      ? 'badge bg-primary'
      : 'badge bg-warning text-dark';
  }

  getEstadoProcesoBadgeClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE_COTIZACION':
        return 'badge bg-warning text-dark';
      case 'EN_COTIZACION':
        return 'badge bg-info';
      case 'COTIZADO':
        return 'badge bg-success';
      case 'ORDEN_GENERADA':
        return 'badge bg-primary';
      default:
        return 'badge bg-secondary';
    }
  }

  formatearFecha(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Anular una línea específica dentro de una consolidación ya creada
  async anularRequerimiento(index: number) {
    if (!this.consolidacionSeleccionada || !this.consolidacionSeleccionada.detalles) return;

    const detalle = this.consolidacionSeleccionada.detalles[index];
    if (!detalle) return;

    const motivo = await this.alertService.showPrompt(
      'Anular Línea de Consolidación',
      `¿Desea anular el ítem <b>${detalle.codigoItem} - ${detalle.descripcionItem}</b>?\nIngrese el motivo:`
    );

    if (!motivo) return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: AnularLineaConsolidacionRequest = {
        idConsolidacion: this.consolidacionSeleccionada.idConsolidacion,
        idDetConsolidacion: detalle.idDetConsolidacion,
        usuario: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
        motivo: motivo
      };

      const resultado = await this.consolidacionService.anularLineaConsolidacion(request);
      this.alertService.cerrarModalCarga();

      if (resultado.success) {
        this.alertService.showAlert('Éxito', resultado.mensaje || 'Línea anulada correctamente', 'success');

        // Si toda la consolidación fue anulada, cerrar modal
        if (resultado.consolidacionAnulada) {
          this.cerrarModalDetalle();
        } else {
          // Recargar detalle de la consolidación
          this.consolidacionSeleccionada = await this.consolidacionService.obtenerConsolidacion(
            this.consolidacionSeleccionada.idConsolidacion
          );
        }

        await this.cargarItemsPendientes();
        await this.cargarHistorial();
      } else {
        this.alertService.showAlertError('Error', resultado.mensaje || 'No se pudo anular la línea');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      console.error('Error al anular línea:', error);
      this.alertService.showAlertError('Error', error?.error?.mensaje || error?.message || 'Error inesperado');
    } finally {
      this.loading = false;
    }
  }

  // Anular un ítem pendiente (antes de consolidar) - lo saca de la lista pendiente
  async anularItemPendiente(item: ItemPendienteConsolidacion) {
    const motivo = await this.alertService.showPrompt(
      'Anular Requerimiento Pendiente',
      `¿Desea anular el ítem <b>${item.item} - ${item.descripcion}</b>?\nEste ítem ya no se podrá consolidar. Ingrese el motivo:`
    );

    if (!motivo) return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: AnularItemPendienteRequest = {
        idDetalle: item.idDetalle,
        tipoRequerimiento: item.tipoRequerimiento,
        usuario: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
        motivo: motivo
      };

      const resultado = await this.consolidacionService.anularItemPendiente(request);
      this.alertService.cerrarModalCarga();

      if (resultado.success) {
        this.alertService.showAlert('Éxito', resultado.mensaje || 'Ítem anulado correctamente. El flujo ha sido cerrado.', 'success');
        await this.cargarItemsPendientes();
      } else {
        this.alertService.showAlertError('Error', resultado.mensaje || 'No se pudo anular el ítem');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      console.error('Error al anular ítem pendiente:', error);
      this.alertService.showAlertError('Error', error?.error?.mensaje || error?.message || 'Error inesperado');
    } finally {
      this.loading = false;
    }
  }

  // =============================================
  // TAB 3: SALDOS PENDIENTES DE APROBACIÓN
  // =============================================

  saldosPendientes: SaldoPendienteAprobacion[] = [];

  async cargarSaldosPendientes() {
    try {
      this.saldosPendientes = await this.consolidacionService.listarSaldosPendientesAprobacion({});
    } catch (error) {
      console.error('Error al cargar saldos pendientes:', error);
    }
  }

  async aprobarSaldoPendiente(saldo: SaldoPendienteAprobacion) {
    const confirmacion = await this.alertService.showConfirm(
      'Aprobar Saldo para Compra',
      `¿Desea aprobar el saldo pendiente del requerimiento <strong>${saldo.requerimientoNumero}</strong> para que pase a consolidación de compra?<br><br>` +
      `CECO: <strong>${saldo.ceco}</strong><br>` +
      `Total ítems: <strong>${saldo.totalItems}</strong>`,
      'question'
    );

    if (!confirmacion) return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: AprobarRechazarSaldoPendienteRequest = {
        idSolicitud: saldo.idSolicitud,
        accion: 'APROBAR',
        usuario: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM'
      };

      const resultado = await this.consolidacionService.aprobarRechazarSaldoPendiente(request);
      this.alertService.cerrarModalCarga();

      if (resultado.success) {
        this.alertService.showAlert('Éxito', 'Saldo aprobado. Los ítems pasarán a consolidación de compra.', 'success');
        await this.cargarSaldosPendientes();
        await this.cargarItemsPendientes();
      } else {
        this.alertService.showAlertError('Error', resultado.mensaje || 'No se pudo aprobar');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlertError('Error', error?.message || 'Error inesperado');
    } finally {
      this.loading = false;
    }
  }

  async rechazarSaldoPendiente(saldo: SaldoPendienteAprobacion) {
    const motivo = await this.alertService.showPrompt(
      'Rechazar Saldo Pendiente',
      `El saldo del requerimiento <b>${saldo.requerimientoNumero}</b> será anulado y no se consolidará. Ingrese el motivo:`
    );

    if (!motivo) return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: AprobarRechazarSaldoPendienteRequest = {
        idSolicitud: saldo.idSolicitud,
        accion: 'RECHAZAR',
        usuario: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
        motivo: motivo
      };

      const resultado = await this.consolidacionService.aprobarRechazarSaldoPendiente(request);
      this.alertService.cerrarModalCarga();

      if (resultado.success) {
        this.alertService.showAlert('Éxito', 'Saldo rechazado. El flujo del saldo pendiente ha sido cerrado.', 'success');
        await this.cargarSaldosPendientes();
      } else {
        this.alertService.showAlertError('Error', resultado.mensaje || 'No se pudo rechazar');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlertError('Error', error?.message || 'Error inesperado');
    } finally {
      this.loading = false;
    }
  }

  async verDetallePendiente(item: any) {
    try {
      const resp = await this.consolidacionService.obtenerDetalleRequerimiento(
        item.idDetalle,
      );

      console.log('RESP:', resp);

      this.detallePendienteSeleccionado = resp;

      // IMPORTANTE: abrir este modal
      this.modalDetallePendienteAbierto = true;

      // ✅ bloquear scroll del body SOLO cuando modal está abierto
      document.body.classList.add('modal-open');
    } catch (error) {
      console.error(error);
    }
  }

  // =============================================
  // MÉTODOS PARA TAB DE SERVICIOS
  // =============================================

  cambiarTab(tab: number) {
    this.tabActiva = tab;
    if (tab === 1) {
      this.cargarServiciosPendientes();
    }
  }

  async cargarServiciosPendientes() {
    try {
      this.loading = true;
      
      const filtros: any = {
        sociedad: this.usuario?.sociedad || '001',
        idproyecto: this.usuario?.idProyecto
      };

      // Agregar filtros si están seleccionados
      if (this.filtroServicioEmpresa) {
        filtros.empresa = this.filtroServicioEmpresa;
      }
      if (this.filtroServicioFechaInicio) {
        filtros.fechaInicio = this.formatearFecha(this.filtroServicioFechaInicio);
      }
      if (this.filtroServicioFechaFin) {
        filtros.fechaFin = this.formatearFecha(this.filtroServicioFechaFin);
      }
      if (this.filtroServicioCommodity?.trim()) {
        filtros.servicio = this.filtroServicioCommodity.trim();
      }

      console.log('📤 Enviando filtros al backend (servicios):', filtros);

      const servicios = await this.consolidacionService.listarCommoditiesPendientes(filtros);
      console.log('📥 Servicios recibidos del backend:', servicios.length, servicios);
      
      this.serviciosPendientes = servicios.map((s: any) => ({ ...s, seleccionado: false }));
      
      // Limpiar selección
      this.serviciosPendientesFiltrados = [...this.serviciosPendientes];
      this.seleccionarTodosServicios = false;
    } catch (error) {
      console.error('❌ Error al cargar servicios pendientes:', error);
      this.alertService.showAlertError('Error', 'No se pudieron cargar los servicios pendientes');
    } finally {
      this.loading = false;
    }
  }

  async aplicarFiltrosServicios() {
    // Recargar desde backend con el filtro de empresa (si existe)
    await this.cargarServiciosPendientes();
  }

  async limpiarFiltrosServicios() {
    this.filtroServicioEmpresa = '';
    this.filtroServicioCommodity = '';
    this.filtroServicioFechaInicio = null;
    this.filtroServicioFechaFin = null;
    await this.cargarServiciosPendientes();
  }

  toggleSeleccionTodosServicios() {
    this.serviciosPendientesFiltrados.forEach(s => s.seleccionado = this.seleccionarTodosServicios);
  }

  hayServiciosSeleccionados(): boolean {
    return this.serviciosPendientesFiltrados.some(s => s.seleccionado);
  }

  contarServiciosSeleccionados(): number {
    return this.serviciosPendientesFiltrados.filter(s => s.seleccionado).length;
  }

  async consolidarServiciosSeleccionados() {
    const seleccionados = this.serviciosPendientesFiltrados.filter(s => s.seleccionado);

    if (seleccionados.length === 0) {
      this.alertService.showAlert('Atención', 'Debe seleccionar al menos un servicio', 'warning');
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Consolidación',
      `¿Desea consolidar ${seleccionados.length} servicio(s)?`,
      'question'
    );

    if (!confirmacion) return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: CrearConsolidacionRequest = {
        usuario: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
        itemsSeleccionados: seleccionados.map(s => ({
          idDetalle: s.idDetalle,
          tipo: 'COMPRA' as TipoRequerimiento
        }))
      };

      const resultado = await this.consolidacionService.crearConsolidacion(request);
      this.alertService.cerrarModalCarga();

      if (resultado.success) {
        this.alertService.showAlert(
          'Éxito',
          `Consolidación creada: ${resultado.codigo}`,
          'success'
        );
        await this.cargarServiciosPendientes();
        await this.cargarHistorial();
      } else {
        this.alertService.showAlertError('Error', resultado.mensaje || 'No se pudo consolidar');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlertError('Error', error?.message || 'Error al consolidar servicios');
    } finally {
      this.loading = false;
    }
  }

  async consolidarYCotizarServicios() {
    const seleccionados = this.serviciosPendientesFiltrados.filter(s => s.seleccionado);

    if (seleccionados.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar al menos un servicio para consolidar',
        'warning'
      );
      return;
    }

    const opcion = await this.alertService.showThreeButtons(
      'Consolidar Servicios',
      `Se consolidarán <strong>${seleccionados.length}</strong> servicio(s) seleccionado(s).<br><br>¿Qué desea hacer después de consolidar?`,
      'question',
      'Consolidar y Cotizar',
      'Solo Consolidar',
      'Cancelar'
    );

    if (opcion === 'button3') return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: CrearConsolidacionRequest = {
        usuario: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
        itemsSeleccionados: seleccionados.map(s => ({
          idDetalle: s.idDetalle,
          tipo: s.tipoRequerimiento || 'COMPRA' as TipoRequerimiento
        }))
      };

      const resultado = await this.consolidacionService.crearConsolidacion(request);

      if (!resultado.success) {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlertError(
          'Error',
          resultado.mensaje || 'No se pudo crear la consolidación'
        );
        return;
      }

      // Si eligió consolidar y cotizar
      if (opcion === 'button1') {
        const reqCotizacion: GenerarSolicitudCotizacionRequest = {
          idConsolidacion: resultado.idConsolidacion,
          usuario: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM'
        };

        try {
          const resCotizacion = await this.consolidacionService.generarSolicitudCotizacion(reqCotizacion);
          this.alertService.cerrarModalCarga();

          if (resCotizacion.success) {
            // Guardar la solicitud en Dexie
            try {
              const consolidacionCompleta = await this.consolidacionService.obtenerConsolidacion(resultado.idConsolidacion);
              
              const solicitudDexie: SolicitudCotizacion = {
                noSolicitud: resCotizacion.noSolicitud,
                idConsolidacion: resultado.idConsolidacion,
                fechaGeneracion: new Date().toISOString(),
                usuarioGenera: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
                totalItems: resultado.totalItems,
                estado: 'PENDIENTE',
                detalle: consolidacionCompleta.detalles?.map((det: any) => ({
                  noLinea: det.noLinea,
                  codigoItem: det.codigoItem,
                  descripcionItem: det.descripcionItem,
                  cantidad: det.cantidadTotal,
                  unidadMedida: det.unidadMedida,
                  ceco: det.ceco || det.origenes?.[0]?.ceco || '',
                  proyecto: det.proyecto || det.origenes?.[0]?.proyecto || ''
                })) || []
              };
              
              await this.dexieService.saveSolicitudCotizacion(solicitudDexie);
            } catch (errDexie: any) {
              console.error('Error al guardar en Dexie:', errDexie);
            }

            this.alertService.showAlert(
              'Consolidación y Cotización Generadas',
              `Consolidación: <strong>${resultado.codigo}</strong><br>` +
                `Solicitud Cotización: <strong>${resCotizacion.noSolicitud}</strong><br>` +
                `Total servicios: ${resultado.totalItems}`,
              'success'
            );
          } else {
            this.alertService.showAlert(
              'Consolidación creada, Cotización con error',
              `Consolidación: <strong>${resultado.codigo}</strong> creada correctamente.<br>` +
                `Error en cotización: ${resCotizacion.mensaje}`,
              'warning'
            );
          }
        } catch (errCot: any) {
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Consolidación creada, Cotización con error',
            `Consolidación: <strong>${resultado.codigo}</strong> creada correctamente.<br>` +
              `Error al generar cotización: ${errCot?.message || 'Error inesperado'}`,
            'warning'
          );
        }
      } else {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert(
          'Consolidación Exitosa',
          `Código: <strong>${resultado.codigo}</strong><br>Total servicios: ${resultado.totalItems}`,
          'success'
        );
      }

      await this.cargarServiciosPendientes();
      await this.cargarHistorial();
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      console.error('Error al consolidar:', error);
      const msg = error?.error?.mensaje || error?.message || 'Error inesperado al consolidar';
      this.alertService.showAlertError('Error', msg);
    } finally {
      this.loading = false;
    }
  }

  async verDetalleServicioPendiente(servicio: any) {
    try {
      const resp = await this.consolidacionService.obtenerDetalleRequerimiento(servicio.idDetalle);
      this.detallePendienteSeleccionado = resp;
      this.modalDetallePendienteAbierto = true;
      document.body.classList.add('modal-open');
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      this.alertService.showAlertError('Error', 'No se pudo cargar el detalle del servicio');
    }
  }

  async anularServicioPendiente(servicio: any) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Anulación',
      `¿Está seguro de anular el servicio ${servicio.commodity}? Esta acción no se puede deshacer.`,
      'warning'
    );

    if (!confirmacion) return;

    try {
      this.loading = true;
      this.alertService.mostrarModalCarga();

      const request: AnularItemPendienteRequest = {
        idDetalle: servicio.idDetalle,
        tipoRequerimiento: 'CONSUMO',
        usuario: this.usuario?.documentoidentidad || this.usuario?.usuario || 'SYSTEM',
        motivo: 'Anulado desde consolidación de servicios'
      };

      const resultado = await this.consolidacionService.anularItemPendiente(request);
      this.alertService.cerrarModalCarga();

      if (resultado.success) {
        this.alertService.showAlert('Éxito', 'Servicio anulado correctamente', 'success');
        await this.cargarServiciosPendientes();
      } else {
        this.alertService.showAlertError('Error', resultado.mensaje || 'No se pudo anular');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlertError('Error', error?.message || 'Error al anular servicio');
    } finally {
      this.loading = false;
    }
  }

  cerrarModalDetallePendiente() {
    this.modalDetallePendienteAbierto = false;
    this.detallePendienteSeleccionado = null;

    // ✅ desbloquear scroll del body SOLO cuando modal se cierra
    document.body.classList.remove('modal-open');
  }
}
