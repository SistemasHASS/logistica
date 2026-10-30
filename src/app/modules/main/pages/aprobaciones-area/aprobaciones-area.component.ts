import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule, Checkbox } from 'primeng/checkbox';
import { AprobacionesService } from '@/app/services/aprobaciones.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { RequerimientosSyncService } from '@/app/modules/main/pages/requerimientos/services/requerimientos-sync.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { ItemService } from '@/app/modules/main/services/items.service';
import { CommodityService } from '@/app/modules/main/services/commoditys.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { AdjuntosService } from '@/app/modules/main/services/adjuntos.service';
import { NotificacionApiService } from '@/app/shared/services/notificacion-api.service';
import Swal from 'sweetalert2';
import { environment } from '@/environments/environment';
import {
  RequerimientoPendiente,
  RequerimientoConAprobacion,
  DashboardAprobaciones,
  ProcesarAprobacionRequest
} from "@/app/interfaces/aprobaciones.interface";

import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';
import { NombreCortoPipe } from '@/app/shared/pipes/nombre-corto.pipe';

@Component({
  selector: 'app-aprobaciones-area',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    CardModule,
    ProgressBarModule,
    TooltipModule,
    CheckboxModule,
    Checkbox,
    NumeroRequerimientoPipe,
    NombreCortoPipe,
],
  templateUrl: './aprobaciones-area.component.html',
  styleUrl: './aprobaciones-area.component.scss',
})
export class AprobacionesAreaComponent implements OnInit {
  // true = bandeja de Gerencia (nivel 2, estados APROBACION1);
  // false = bandeja de jefe de área (nivel 1)
  @Input() modoGerencia = false;

  // Usuario actual
  usuario: any;

  // Dashboard
  dashboard: DashboardAprobaciones | null = null;

  // Requerimientos
  requerimientosPendientes: RequerimientoPendiente[] = [];
  misRequerimientos: RequerimientoConAprobacion[] = [];
  todosRequerimientos: RequerimientoConAprobacion[] = [];

  fundos: any[] = [];
  cultivos: any[] = [];
  areas: any[] = [];
  proyectos: any[] = [];
  items: any[] = [];
  itemsFiltered: any[] = [];
  commodities: any[] = []; // Servicios con cuenta contable
  subcommodities: any[] = []; // Subservicios con cuenta contable
  turnos: any[] = [];
  labores: any[] = [];
  cecos: any[] = [];
  almacenes: any[] = [];
  clasificaciones: any[] = [];
  tipoGastos: any[] = [];

  // Loading states
  loadingDashboard = false;
  loadingPendientes = false;
  loadingMisRequerimientos = false;
  loadingTodos = false;

  // Modal de aprobación
  displayAprobacionModal = false;
  requerimientoSeleccionado: RequerimientoPendiente | null = null;
  observaciones = '';

  // Modal de detalle
  displayDetalleModal = false;
  requerimientoDetalle: any = null;

  // Modal de detalle de requerimientos pendientes (con selección)
  displayDetallePendientesModal = false;
  requerimientoDetallePendientes: any = null;
  loadingDetallePendientes = false;
  detallePendientesTab: 'items' | 'servicios' | 'adjuntos' | 'historial-anulaciones' = 'items';
  detallesPendientesSeleccionados: Set<number> = new Set<number>();
  detallesPendientesAprobados: Set<number> = new Set<number>();

  // Adjuntos
  adjuntosRequerimiento: any[] = [];
  selectedFile: File | null = null;
  loadingAdjuntos = false;
  subiendoAdjunto = false;

  // Anulaciones
  requerimientosAnulados: any[] = [];
  loadingAnulados = false;
  displayAnulacionModal = false;
  requerimientoParaAnular: any = null;
  motivoAnulacion = '';
  tipoAnulacion: 'RETORNABLE' | 'DEFINITIVA' = 'RETORNABLE';
  historialAnulaciones: any[] = [];
  loadingHistorialAnulaciones = false;

  // Tab activo
  activeTabIndex = 0;

  // Filtro por tipo de requerimiento (solo diseño, para filtrar la lista de pendientes)
  filtroTipoPendiente: 'TODOS' | 'COMPRA' | 'CONSUMO' | 'SERVICIO' = 'TODOS';

  // Selección múltiple de requerimientos pendientes para aprobación en bloque
  requerimientosPendientesSeleccionados: RequerimientoPendiente[] = [];
  displayAprobacionMultipleModal = false;
  observacionesMultiple = '';
  procesandoAprobacionMultiple = false;

  get requerimientosPendientesFiltrados(): RequerimientoPendiente[] {
    if (this.filtroTipoPendiente === 'TODOS') return this.requerimientosPendientes;
    return this.requerimientosPendientes.filter(
      req => this.tipoRequerimientoLabel(req) === this.filtroTipoPendiente
    );
  }

  contarPendientesPorTipo(tipo: 'COMPRA' | 'CONSUMO' | 'SERVICIO'): number {
    return this.requerimientosPendientes.filter(
      req => this.tipoRequerimientoLabel(req) === tipo
    ).length;
  }

  constructor(
    private aprobacionesService: AprobacionesService,
    private aprobacionesAreaService: AprobacionesAreaService,
    private requerimientosService: RequerimientosService,
    private syncService: RequerimientosSyncService,
    private dexieService: DexieService,
    private maestrasService: MaestrasService,
    private ItemService: ItemService,
    private commodityService: CommodityService,
    private alertService: AlertService,
    public adjuntosService: AdjuntosService,
    private notificacionApi: NotificacionApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.cargarUsuario().then(() => {
      if (!this.usuario) {
        Swal.fire('Error', 'No se encontró información del usuario', 'error');
        return;
      }

      // Roles globales: acceden sin ser jefe de área (el SP maneja la lógica de áreas)
      // En modoGerencia el SP valida que el usuario sea el aprobador vigente nivel 2
      const rolesGlobales = ['ADLOGIST', 'JLOLOGIST', 'JEMLOGIST', 'FINANZAS', 'GERENTE', 'TILOGIST', 'APLOGIST'];
      const esRolGlobal = rolesGlobales.some(r => this.usuario.idrol?.includes(r));

      if (
        !this.modoGerencia &&
        !esRolGlobal &&
        (!this.usuario.idarea ||
        (this.usuario.esJefeArea !== 1 && this.usuario.esJefeArea !== true))
      ) {
        Swal.fire({
          icon: 'warning',
          title: 'Acceso Restringido',
          text: 'Esta función está disponible solo para jefes de área con área asignada',
          confirmButtonText: 'Entendido',
        });
        return;
      }

      // Cargar datos iniciales
      this.cargarDashboard();
      this.sincronizarTablasMaestras();
      this.cargarRequerimientosPendientes();
      this.cargarRequerimientosAnulados();
    });
  }

  async cargarUsuario() {
    this.usuario = await this.dexieService.showUsuario();

    // Bandeja Gerencia: la sesión vigente es la de admin-logistica
    // (localStorage), no necesariamente hay usuario en Dexie.
    // Se envía el username; el SP lo resuelve a DNI si hace falta.
    if (this.modoGerencia) {
      try {
        const adminUser = JSON.parse(localStorage.getItem('admin_logistica_user') || 'null');
        if (adminUser) {
          this.usuario = {
            ...(this.usuario || {}),
            documentoidentidad: adminUser.usuario,
            ruc: adminUser.ruc || this.usuario?.ruc,
            idrol: adminUser.idrol || this.usuario?.idrol,
            nombre: adminUser.nombre || this.usuario?.nombre,
            esJefeArea: this.usuario?.esJefeArea,
          };
        }
      } catch { /* sin sesión admin-logistica */ }
    }
  }

  async cargarDashboard() {
    if (!this.usuario || this.modoGerencia) return;

    this.loadingDashboard = true;
    try {
      const response = await this.aprobacionesService
        .obtenerDashboardAprobaciones(this.usuario.documentoidentidad)
        .toPromise();

      // console.log('📊 Respuesta del dashboard:', response);

      // El API devuelve un array de indicadores directamente
      if (Array.isArray(response)) {
        this.dashboard = {
          indicadores: response,
          requerimientosUrgentes: [],
          estadisticasPorArea: [],
        };
      } else {
        this.dashboard = null;
      }

      // console.log('✅ Dashboard cargado:', this.dashboard);
    } catch (error) {
      // console.error('❌ Error al cargar dashboard:', error);
      this.dashboard = null;
      Swal.fire(
        'Error',
        'Error al cargar el dashboard de aprobaciones',
        'error',
      );
    } finally {
      this.loadingDashboard = false;
    }
  }

  async sincronizarTablasMaestras() {
    try {
      this.alertService.mostrarModalCarga();

      const fundos = this.maestrasService.getFundos([
        { idempresa: this.usuario.idempresa },
      ]);
      fundos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveFundos(resp);
          await this.ListarFundos();
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Exito!',
            'Sincronizado con exito',
            'success',
          );
        }
      });

      const cultivos = this.maestrasService.getCultivos([
        { idempresa: this.usuario?.idempresa },
      ]);
      cultivos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveCultivos(resp);
          await this.ListarCultivos();
        }
      });

      const areas = this.maestrasService.getAreas([
        { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' },
      ]);
      areas.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAreas(resp);
          await this.ListarAreas();
        }
      });

      const almacenes = this.maestrasService.getAlmacenes([
        { ruc: this.usuario?.ruc },
      ]);
      almacenes.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAlmacenes(resp);
          await this.ListarAlmacenes();
        }
      });

      const proyectos = this.maestrasService.getProyectos([
        { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA', esadmin: 0 },
      ]);
      proyectos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveProyectos(resp);
          await this.ListarProyectos();
        }
      });

      const items = this.maestrasService.getItems([{ ruc: this.usuario?.ruc }]);
      items.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveItemComoditys(resp);
          await this.ListarItems();
        }
      });

      this.itemsFiltered = await firstValueFrom(this.ItemService.getItem([{}]));

      // ✅ Cargar commodities (servicios) con cuenta contable
      const commodities = this.commodityService.getCommodity([{}]);
      commodities.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveMaestroCommodities(resp);
          await this.ListarCommodities();
        }
      });

      // ✅ Cargar subcommodities (subservicios) con cuenta contable
      const subcommodities = this.commodityService.getSubCommodity([{}]);
      subcommodities.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveMaestroSubCommodities(resp);
          await this.ListarSubCommodities();
        }
      });

      const clasificaciones = this.maestrasService.getClasificaciones([{}]);
      clasificaciones.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveClasificaciones(resp);
          await this.ListarClasificaciones();
        }
      });

      const cecos = await this.maestrasService.getCecos([
        { aplicacion: 'LOGISTICA', esadmin: 0 },
      ]);
      cecos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveCecos(resp);
          await this.ListarCecos();
        }
      });

      const labores = await this.maestrasService.getLabores([
        { aplicacion: 'LOGISTICA', esadmin: 0 },
      ]);
      if (!!labores && labores.length) {
        await this.dexieService.saveLabores(labores);
        await this.ListarLabores();
      }

      const turnos = this.maestrasService.getTurnos([
        { aplicacion: 'LOGISTICA', esadmin: 0 },
      ]);
      turnos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveTurnos(resp);
          await this.ListarTurnos();
        }
      });

      const tipoGastos = this.maestrasService.getTipoGastos([{}]);
      tipoGastos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveTipoGastos(resp);
          await this.ListarTipoGastos();
        }
      });
    } catch (error: any) {
      // console.error(error);
      this.alertService.showAlert(
        'Error!',
        '<p>Ocurrio un error</p><p>',
        'error',
      );
    }
  }

  async ListarFundos() {
    this.fundos = await this.dexieService.showFundos();
  }

  async ListarCultivos() {
    this.cultivos = await this.dexieService.showCultivos();
  }

  async ListarAreas() {
    this.areas = await this.dexieService.showAreas();
  }

  async ListarAlmacenes() {
    this.almacenes = await this.dexieService.showAlmacenes();
  }

  async ListarProyectos() {
    this.proyectos = await this.dexieService.showProyectos();
  }

  async ListarItems() {
    this.items = await this.dexieService.showItemComoditys();
  }

  async ListarCommodities() {
    this.commodities = await this.dexieService.showMaestroCommodity();
  }

  async ListarSubCommodities() {
    // Maestro de subcommodities (subservicios) con cuentaContableGasto
    this.subcommodities = await this.dexieService.showMaestroSubCommodity();
    // Si la tabla está vacía (usuario sin sync previo), traerla del API
    if (!this.subcommodities?.length) {
      const resp: any = await lastValueFrom(this.commodityService.getSubCommodity([{}]));
      if (resp?.length) {
        await this.dexieService.saveMaestroSubCommodities(resp);
        this.subcommodities = await this.dexieService.showMaestroSubCommodity();
      }
    }
  }

  async ListarClasificaciones() {
    this.clasificaciones = await this.dexieService.showClasificaciones();
  }

  async ListarTurnos() {
    this.turnos = await this.dexieService.showTurnos();
  }

  async ListarLabores() {
    this.labores = await this.dexieService.showLabores();
  }

  async ListarCecos() {
    this.cecos = await this.dexieService.showCecos();
  }

  async ListarTipoGastos() {
    this.tipoGastos = await this.dexieService.showTipoGastos();
  }

  cargarRequerimientosPendientes() {
    if (!this.usuario) return;

    this.loadingPendientes = true;
    this.requerimientosPendientes = [];

    // Enviar objeto JSON, no string
    const data = {
      documentoidentidad: this.usuario.documentoidentidad,
      ruc: this.usuario.ruc,
    };

    const obs = this.modoGerencia
      ? this.aprobacionesAreaService.obtenerRequerimientosPendientesGerencia(data)
      : this.aprobacionesAreaService.obtenerRequerimientosPendientesArea(data);

    obs.subscribe({
        next: (response) => {
          // console.log('📋 Respuesta de pendientes:', response);
          // El response puede venir como array directo o como {resultado: [...]}
          if (Array.isArray(response)) {
            this.requerimientosPendientes = response;
          } else if (
            response &&
            typeof response === 'object' &&
            'resultado' in response
          ) {
            this.requerimientosPendientes = response.resultado || [];
          } else {
            this.requerimientosPendientes = [];
          }
          // console.log(
          //   '✅ Requerimientos pendientes cargados:',
          //   this.requerimientosPendientes.length,
          // );
          this.loadingPendientes = false;
        },
        error: (error) => {
          // console.log(
          //   '🔧 Error recibido en componente (debería ser manejado por servicio):',
          //   error,
          // );
          this.requerimientosPendientes = [];
          this.loadingPendientes = false;
          // No mostrar alerta para error 500, el servicio ya lo maneja
          if (error.status !== 500) {
            Swal.fire(
              'Error',
              'Error al cargar requerimientos pendientes',
              'error',
            );
          }
        },
      });
  }

  async cargarMisRequerimientos() {
    if (!this.usuario) return;

    this.loadingMisRequerimientos = true;
    this.misRequerimientos = [];

    // En modoGerencia el tab "Aprobados" muestra lo que este aprobador N2
    // ya proceso, no la lista de jefe de area.
    if (this.modoGerencia) {
      try {
        const response: any = await lastValueFrom(
          this.aprobacionesAreaService.obtenerRequerimientosAprobadosGerencia({
            documentoidentidad: this.usuario.documentoidentidad,
            ruc: this.usuario.ruc,
          })
        );
        this.misRequerimientos = Array.isArray(response)
          ? response
          : response?.resultado ?? [];
      } catch {
        this.misRequerimientos = [];
      } finally {
        this.loadingMisRequerimientos = false;
        // La mascara del p-table puede quedar huérfana si el flag se apaga
        // en la misma tarea; detectChanges fuerza el flush visual.
        this.cdr.detectChanges();
      }
      return;
    }

    // El SP espera usuario y rol
    const data = {
      usuario: this.usuario.documentoidentidad,
      rol: this.usuario.rol || 'JEFE_AREA',
      ruc: this.usuario.ruc,
    };

    this.aprobacionesAreaService
      .obtenerRequerimientosConAprobacion(data)
      .subscribe({
        next: (response) => {
          console.log('📝 Respuesta de mis requerimientos:', response);
          // El response puede venir como array directo o como {resultado: [...]}
          if (Array.isArray(response)) {
            this.misRequerimientos = response;
          } else if (
            response &&
            typeof response === 'object' &&
            'resultado' in response
          ) {
            this.misRequerimientos = response.resultado || [];
          } else {
            this.misRequerimientos = [];
          }
          console.log(
            '✅ Mis requerimientos cargados:',
            this.misRequerimientos.length,
          );
          this.loadingMisRequerimientos = false;
        },
        error: (error) => {
          // console.error('Error al cargar mis requerimientos:', error);
          this.misRequerimientos = [];
          this.loadingMisRequerimientos = false;
          if (error.status !== 500) {
            Swal.fire('Error', 'Error al cargar mis requerimientos', 'error');
          }
        },
      });
  }

  cargarTodosRequerimientos() {
    if (!this.usuario) return;

    this.loadingTodos = true;
    this.todosRequerimientos = [];

    // El SP espera usuario y rol
    const data = {
      usuario: this.usuario.documentoidentidad,
      rol: 'TI', // Rol TI para ver todos
      ruc: this.usuario.ruc,
    };

    this.aprobacionesAreaService
      .obtenerRequerimientosConAprobacion(data)
      .subscribe({
        next: (response) => {
          // console.log('📋 Respuesta de todos los requerimientos:', response);
          // El response puede venir como array directo o como {resultado: [...]}
          if (Array.isArray(response)) {
            this.todosRequerimientos = response;
          } else if (
            response &&
            typeof response === 'object' &&
            'resultado' in response
          ) {
            this.todosRequerimientos = response.resultado || [];
          } else {
            this.todosRequerimientos = [];
          }
          // console.log(
          //   '✅ Todos los requerimientos cargados:',
          //   this.todosRequerimientos.length,
          // );
          this.loadingTodos = false;
        },
        error: (error) => {
          // console.error('Error al cargar todos los requerimientos:', error);
          this.todosRequerimientos = [];
          this.loadingTodos = false;
          if (error.status !== 500) {
            Swal.fire(
              'Error',
              'Error al cargar todos los requerimientos',
              'error',
            );
          }
        },
      });
  }

  // =============================================
  // ACCIONES DE APROBACIÓN
  // =============================================

  abrirModalAprobacion(requerimiento: RequerimientoPendiente) {
    this.requerimientoSeleccionado = requerimiento;
    console.log('Requerimientos: ', this.requerimientoSeleccionado);
    this.observaciones = '';
    this.displayAprobacionModal = true;
  }

  async aprobar() {
    console.log('🟢 Iniciando método aprobar()');
    if (!this.requerimientoSeleccionado || !this.usuario) {
      console.error('❌ Falta requerimiento seleccionado o usuario');
      return;
    }

    // Prevenir auto-aprobación (salvo roles globales)
    const rolesGlobalesAprob = ['ADLOGIST', 'JLOLOGIST', 'JEMLOGIST', 'FINANZAS', 'GERENTE', 'TILOGIST'];
    const esRolGlobalAprob = rolesGlobalesAprob.some(r => this.usuario.idrol?.includes(r));
    if (!esRolGlobalAprob && (this.requerimientoSeleccionado as any).dniregistra === this.usuario.documentoidentidad) {
      Swal.fire('No permitido', 'No puede aprobar su propio requerimiento', 'warning');
      return;
    }
    
    console.log('📋 Datos para aprobar:', {
      idrequerimiento: this.requerimientoSeleccionado.idrequerimiento,
      documentoidentidad: this.usuario.documentoidentidad,
      accion: 'APROBADO'
    });
    
    try {
      const requestAprobacion = {
        idrequerimiento: this.requerimientoSeleccionado.idrequerimiento, // Corregido: minúscula
        documentoidentidad: this.usuario.documentoidentidad,
        accion: 'APROBADO' as const,
        comentarios: this.observaciones || 'Aprobado',
        ruc: this.usuario.ruc,
      };
      const response = await (this.modoGerencia
        ? this.aprobacionesAreaService.aprobarRequerimientoGerencia(requestAprobacion)
        : this.aprobacionesAreaService.aprobarRequerimientoArea(requestAprobacion)
      ).toPromise();

      console.log('📤 Respuesta de aprobación:', response);
      this.displayAprobacionModal = false;

      // console.log('📤 Respuesta de aprobación:', response);

      // El API puede devolver diferentes formatos
      // Formato 1: [{ "success": true, "mensaje": "...", "idSolicitud": N }]
      // Formato 2: [{ "resultado": "SUCCESS", "mensaje": "..." }]
      // Formato 3: { "resultado": "OK", "mensaje": "..." } (objeto directo)
      let esExitoso = false;
      let mensaje = '';
      let estadoFinal = 'APROBADO';

      // Normalizar respuesta: si es array, tomar primer elemento; si es objeto, usar directamente
      let responseItem = null;
      if (response && Array.isArray(response) && response.length > 0) {
        responseItem = response[0];
        console.log('🔍 Respuesta es array, tomando primer elemento:', responseItem);
      } else if (response && typeof response === 'object' && !Array.isArray(response)) {
        responseItem = response;
        console.log('🔍 Respuesta es objeto directo:', responseItem);
      }

      if (responseItem) {
        console.log('🔍 Analizando respuesta:', responseItem);
        console.log('🔍 Tiene propiedad "success":', 'success' in responseItem);
        console.log('🔍 Tiene propiedad "resultado":', 'resultado' in responseItem);
        estadoFinal = responseItem.estadoFinal || 'APROBADO';

        if ('success' in responseItem) {
          // Formato nuevo: { success: true, mensaje: "..." }
          esExitoso = responseItem.success === true;
          mensaje = responseItem.mensaje || 'Operación realizada correctamente';
          console.log('✅ Formato nuevo detectado, esExitoso:', esExitoso);
        } else if ('resultado' in responseItem) {
          // Formato antiguo: { resultado: "SUCCESS" | "OK", mensaje: "..." }
          esExitoso = responseItem.resultado === 'SUCCESS' || responseItem.resultado === 'OK';
          mensaje = responseItem.mensaje || 'Operación realizada correctamente';
          console.log('✅ Formato antiguo detectado, esExitoso:', esExitoso);
        }
      } else {
        console.error('❌ Respuesta vacía o inválida:', response);
      }
      
      console.log('🔍 esExitoso final:', esExitoso);

      if (esExitoso) {
        Swal.fire('Éxito', mensaje, 'success');
        console.log('✅ Aprobación exitosa, requerimiento:', this.requerimientoSeleccionado);

        // Ocultar el requerimiento de la lista local del creador sin esperar sincronización
        await this.syncService.marcarAprobadoLocalmente(
          this.requerimientoSeleccionado.idrequerimiento,
        );

        console.log('🔄 Iniciando sincronización con SPRING...');

        if (estadoFinal === 'APROBACION1') {
          // Flujo DOS_NIVELES: queda pendiente de Gerencia.
          // NO migrar a SPRING ni notificar despacho — ocurre en la aprobación nivel 2
          console.log('ℹ️ Requerimiento quedó en APROBACION1 - pendiente de aprobación de Gerencia');
        } else {
          // Sincronizar con SPRING TODOS los requerimientos aprobados (COMPRA y CONSUMO)
          console.log('🔄 Iniciando sincronización con SPRING para requerimiento aprobado...');
          try {
            await this.sincronizarRequerimientoSPRING(
              this.requerimientoSeleccionado,
            );
            console.log('✅ Sincronización con SPRING completada');

            // Información sobre el flujo posterior + notificación PENDIENTE_DESPACHO para CONSUMO
            const tipoReq = (this.requerimientoSeleccionado as any)?.itemtipo ||
                           (this.requerimientoSeleccionado as any)?.tipoRequerimiento ||
                           'COMPRA'; // Default
            if (tipoReq === 'COMPRA') {
              console.log('ℹ️ Requerimiento de COMPRA migrado a SPRING - También aparecerá en consolidación para órdenes de compra');
            } else if (tipoReq === 'CONSUMO') {
              console.log('ℹ️ Requerimiento de CONSUMO migrado a SPRING - Listo para despacho directo');
              const dniSolicitante = (this.requerimientoSeleccionado as any)?.dniregistra
                || (this.requerimientoSeleccionado as any)?.nrodocumento
                || '';
              if (dniSolicitante) {
                const numReq = (this.requerimientoSeleccionado as any)?.numero
                  || (this.requerimientoSeleccionado as any)?.idrequerimiento || 'N/A';
                this.notificacionApi.registrarNotificacionSolicitante({
                  usuario_destino: dniSolicitante,
                  id_dreq: String((this.requerimientoSeleccionado as any)?.idrequerimiento || '0'),
                  mensaje: `Tu requerimiento de consumo ${numReq} fue aprobado y está pendiente de despacho por almacén.`,
                  tipo_notificacion: 'PENDIENTE_DESPACHO'
                }).catch(() => {});
              }
            }
          } catch (error) {
            console.error('❌ Error en sincronización con SPRING:', error);
            // No interrumpir el flujo si falla la sincronización
          }
        }

        console.log('🔄 Recargando datos...');
        await this.cargarRequerimientosPendientes();
        await this.cargarDashboard();
        // También cargar mis requerimientos para que aparezca en el tab 2
        await this.cargarMisRequerimientos();
        console.log('✅ Datos recargados');
      } else {
        console.error('❌ Respuesta inesperada:', response);
        Swal.fire('Error', 'Error al aprobar el requerimiento', 'error');
      }
    } catch (error) {
      console.error('❌ Error en el método aprobar():', error);
      console.error('❌ Detalles del error:', {
        message: error instanceof Error ? error.message : String(error),
        status: (error as any)?.status,
        statusText: (error as any)?.statusText,
        error: (error as any)?.error
      });
      Swal.fire('Error', 'Error al procesar la aprobación', 'error');
    }
  }

  async rechazar() {
    if (!this.requerimientoSeleccionado || !this.usuario) return;

    if (!this.observaciones.trim()) {
      Swal.fire(
        'Advertencia',
        'Debe ingresar una observación para rechazar',
        'warning',
      );
      return;
    }

    try {
      const requestRechazo = {
        idrequerimiento: this.requerimientoSeleccionado.idrequerimiento,
        documentoidentidad: this.usuario.documentoidentidad,
        accion: 'RECHAZADO' as const,
        comentarios: this.observaciones,
        ruc: this.usuario.ruc,
      };
      const response = await (this.modoGerencia
        ? this.aprobacionesAreaService.aprobarRequerimientoGerencia(requestRechazo)
        : this.aprobacionesAreaService.aprobarRequerimientoArea(requestRechazo)
      ).toPromise();

      this.displayAprobacionModal = false;

      // console.log('📤 Respuesta de rechazo:', response);

      // El API puede devolver diferentes formatos
      // Formato 1: [{ "success": true, "mensaje": "...", "idSolicitud": N }]
      // Formato 2: [{ "resultado": "SUCCESS", "mensaje": "..." }]
      let esExitoso = false;
      let mensaje = '';

      if (response && Array.isArray(response) && response.length > 0) {
        const firstItem = response[0];
        if ('success' in firstItem) {
          // Formato nuevo: [{ success: true, mensaje: "..." }]
          esExitoso = firstItem.success === true;
          mensaje =
            firstItem.mensaje || 'Requerimiento rechazado correctamente';
        } else if ('resultado' in firstItem) {
          // Formato antiguo: [{ resultado: "SUCCESS", mensaje: "..." }]
          esExitoso =
            firstItem.resultado === 'SUCCESS' || firstItem.resultado === 'OK';
          mensaje =
            firstItem.mensaje || 'Requerimiento rechazado correctamente';
        }
      }

      if (esExitoso) {
        Swal.fire('Éxito', mensaje, 'success');
        await this.cargarRequerimientosPendientes();
        await this.cargarDashboard();
        // También cargar mis requerimientos
        await this.cargarMisRequerimientos();
      } else {
        // console.error('❌ Respuesta inesperada:', response);
        Swal.fire('Error', 'Error al rechazar el requerimiento', 'error');
      }
    } catch (error) {
      // console.error('Error al rechazar:', error);
      Swal.fire('Error', 'Error al procesar el rechazo', 'error');
    }
  }

  // =============================================
  // APROBACIÓN MÚLTIPLE EN BLOQUE
  // =============================================

  abrirModalAprobacionMultiple() {
    if (this.requerimientosPendientesSeleccionados.length === 0) {
      Swal.fire('Advertencia', 'Seleccione al menos un requerimiento', 'warning');
      return;
    }
    this.observacionesMultiple = '';
    this.displayAprobacionMultipleModal = true;
  }

  async aprobarSeleccionados() {
    if (!this.usuario || this.requerimientosPendientesSeleccionados.length === 0) return;

    this.procesandoAprobacionMultiple = true;

    const rolesGlobalesAprob = ['ADLOGIST', 'JLOLOGIST', 'JEMLOGIST', 'FINANZAS', 'GERENTE', 'TILOGIST'];
    const esRolGlobalAprob = rolesGlobalesAprob.some(r => this.usuario.idrol?.includes(r));

    const aprobables = this.requerimientosPendientesSeleccionados.filter(req => {
      if (!esRolGlobalAprob && (req as any).dniregistra === this.usuario.documentoidentidad) {
        return false;
      }
      return true;
    });

    if (aprobables.length === 0) {
      this.procesandoAprobacionMultiple = false;
      Swal.fire('No permitido', 'No puede aprobar sus propios requerimientos', 'warning');
      return;
    }

    let exitosos = 0;
    let fallidos = 0;
    let sincronizados = 0;
    let fallidosSincronizacion = 0;

    for (const req of aprobables) {
      try {
        const requestAprobacion = {
          idrequerimiento: req.idrequerimiento,
          documentoidentidad: this.usuario.documentoidentidad,
          accion: 'APROBADO' as const,
          comentarios: this.observacionesMultiple || 'Aprobado',
          ruc: this.usuario.ruc,
        };
        const response = await (this.modoGerencia
          ? this.aprobacionesAreaService.aprobarRequerimientoGerencia(requestAprobacion)
          : this.aprobacionesAreaService.aprobarRequerimientoArea(requestAprobacion)
        ).toPromise();

        let esExitoso = false;
        let responseItem = null;
        if (response && Array.isArray(response) && response.length > 0) {
          responseItem = response[0];
        } else if (response && typeof response === 'object' && !Array.isArray(response)) {
          responseItem = response;
        }

        if (responseItem) {
          if ('success' in responseItem) {
            esExitoso = responseItem.success === true;
          } else if ('resultado' in responseItem) {
            esExitoso = responseItem.resultado === 'SUCCESS' || responseItem.resultado === 'OK';
          }
        }

        const estadoFinal = responseItem?.estadoFinal || 'APROBADO';

        if (esExitoso) {
          exitosos++;

          // Ocultar el requerimiento de la lista local del creador sin esperar sincronización
          await this.syncService.marcarAprobadoLocalmente(req.idrequerimiento);

          if (estadoFinal === 'APROBACION1') {
            // Flujo DOS_NIVELES: pendiente de Gerencia, sin migración SPRING aún
            console.log(`ℹ️ ${req.idrequerimiento} quedó en APROBACION1 - pendiente de Gerencia`);
          } else {
            // Sincronizar con SPRING igual que en aprobación individual desde modal
            try {
              await this.sincronizarRequerimientoSPRING(req, true);
              sincronizados++;

              // Notificación PENDIENTE_DESPACHO para requerimientos de CONSUMO
              const tipoReq = (req as any)?.itemtipo || (req as any)?.tipoRequerimiento || 'COMPRA';
              if (tipoReq === 'CONSUMO') {
                const dniSolicitante = (req as any)?.dniregistra || (req as any)?.nrodocumento || '';
                if (dniSolicitante) {
                  const numReq = (req as any)?.numero || (req as any)?.idrequerimiento || 'N/A';
                  this.notificacionApi.registrarNotificacionSolicitante({
                    usuario_destino: dniSolicitante,
                    id_dreq: String((req as any)?.idrequerimiento || '0'),
                    mensaje: `Tu requerimiento de consumo ${numReq} fue aprobado y está pendiente de despacho por almacén.`,
                    tipo_notificacion: 'PENDIENTE_DESPACHO'
                  }).catch(() => {});
                }
              }
            } catch (syncError) {
              console.error(`❌ Error sincronizando requerimiento ${req.idrequerimiento} con SPRING:`, syncError);
              fallidosSincronizacion++;
            }
          }
        } else {
          fallidos++;
        }
      } catch (error) {
        fallidos++;
      }
    }

    this.procesandoAprobacionMultiple = false;
    this.displayAprobacionMultipleModal = false;
    this.observacionesMultiple = '';
    this.requerimientosPendientesSeleccionados = [];

    let mensajeResumen = `Aprobados: ${exitosos}\nFallidos: ${fallidos}`;
    if (sincronizados > 0 || fallidosSincronizacion > 0) {
      mensajeResumen += `\nSincronizados con SPRING: ${sincronizados}\nFallos SPRING: ${fallidosSincronizacion}`;
    }

    Swal.fire(
      'Resumen de aprobación',
      mensajeResumen,
      exitosos > 0 ? 'success' : 'error',
    );

    await this.cargarRequerimientosPendientes();
    await this.cargarDashboard();
    await this.cargarMisRequerimientos();
  }

  // =============================================
  // SINCRONIZACIÓN CON SPRING
  // =============================================

  async sincronizarRequerimientoSPRING(req: any, silencioso: boolean = false) {
    console.log('🟢 INICIO sincronizarRequerimientoSPRING');
    console.log('📋 Objeto recibido en sincronizarSPRING:', req);
    
    // ✅ CORRECCIÓN CRÍTICA: Cargar datos maestros si no están disponibles
    // CECOs
    if (!this.cecos || this.cecos.length === 0) {
      console.log('⚠️ CECOs no cargados, cargando desde Dexie...');
      this.cecos = await this.dexieService.showCecos();
      
      if (!this.cecos || this.cecos.length === 0) {
        console.log('⚠️ CECOs vacíos en Dexie, sincronizando desde backend...');
        try {
          const cecos = this.maestrasService.getCecos([{ aplicacion: 'LOGISTICA', esadmin: 0 }]);
          const resp: any = await cecos.toPromise();
          if (!!resp && resp.length) {
            console.log('📥 Recibidos', resp.length, 'CECOs del backend');
            await this.dexieService.saveCecos(resp);
            this.cecos = await this.dexieService.showCecos();
            console.log('✅ CECOs sincronizados y cargados:', this.cecos.length);
          } else {
            console.warn('⚠️ Backend no retornó CECOs');
          }
        } catch (error) {
          console.error('❌ Error al sincronizar CECOs:', error);
        }
      }
    }
    
    // Labores
    if (!this.labores || this.labores.length === 0) {
      console.log('⚠️ Labores no cargadas, cargando desde Dexie...');
      this.labores = await this.dexieService.showLabores();
      
      if (!this.labores || this.labores.length === 0) {
        console.log('⚠️ Labores vacías en Dexie, sincronizando desde backend...');
        try {
          const labores = await this.maestrasService.getLabores([{ aplicacion: 'LOGISTICA', esadmin: 0 }]);
          if (!!labores && labores.length) {
            console.log('📥 Recibidas', labores.length, 'Labores del backend');
            await this.dexieService.saveLabores(labores);
            this.labores = await this.dexieService.showLabores();
            console.log('✅ Labores sincronizadas y cargadas:', this.labores.length);
          } else {
            console.warn('⚠️ Backend no retornó Labores');
          }
        } catch (error) {
          console.error('❌ Error al sincronizar Labores:', error);
        }
      }
    }
    
    // Proyectos
    if (!this.proyectos || this.proyectos.length === 0) {
      console.log('⚠️ Proyectos no cargados, cargando desde Dexie...');
      this.proyectos = await this.dexieService.showProyectos();
    }
    
    // Items
    if (!this.itemsFiltered || this.itemsFiltered.length === 0) {
      console.log('⚠️ Items no cargados, cargando desde Dexie...');
      this.itemsFiltered = await this.dexieService.showItems();
      
      if (!this.itemsFiltered || this.itemsFiltered.length === 0) {
        console.log('⚠️ Items vacíos en Dexie, sincronizando desde backend...');
        try {
          const items = this.maestrasService.getItems([{ ruc: this.usuario.ruc }]);
          const resp: any = await items.toPromise();
          if (!!resp && resp.length) {
            console.log('📥 Recibidos', resp.length, 'Items del backend');
            await this.dexieService.saveItems(resp);
            this.itemsFiltered = await this.dexieService.showItems();
            console.log('✅ Items sincronizados y cargados:', this.itemsFiltered.length);
          } else {
            console.warn('⚠️ Backend no retornó Items');
          }
        } catch (error) {
          console.error('❌ Error al sincronizar Items:', error);
        }
      }
    }
    
    // Turnos
    if (!this.turnos || this.turnos.length === 0) {
      console.log('⚠️ Turnos no cargados, cargando desde Dexie...');
      this.turnos = await this.dexieService.showTurnos();
    }
    
    console.log('✅ Datos maestros verificados:', {
      cecos: this.cecos?.length || 0,
      labores: this.labores?.length || 0,
      proyectos: this.proyectos?.length || 0,
      items: this.itemsFiltered?.length || 0,
      turnos: this.turnos?.length || 0
    });
    
    try {

      // DEBUG: Ver qué datos tiene el objeto req
      console.log('🔍 DEBUG - req completo:', req);
      console.log('🔍 DEBUG - req.idClasificacion:', req.idClasificacion);
      console.log('🔍 DEBUG - req.idclasificacion:', req.idclasificacion);
      console.log('🔍 DEBUG - req.itemtipo:', req.itemtipo);
      console.log('🔍 DEBUG - req.tipoRequerimiento:', req.tipoRequerimiento);

      // Verificar si el objeto ya tiene el detalle (puede venir como array directo
      // o como propiedad detalles/detalle/items según el SP de origen)
      let requerimientoCompleto = null;

      const detallesDirectos =
        (Array.isArray(req.detalles) && req.detalles.length > 0 && req.detalles) ||
        (Array.isArray(req.detalle) && req.detalle.length > 0 && req.detalle) ||
        (Array.isArray(req.items) && req.items.length > 0 && req.items) ||
        null;

      if (detallesDirectos) {
        // console.log('✅ El objeto ya tiene detalle, usándolo directamente');
        requerimientoCompleto = { ...req, detalles: detallesDirectos };
      } else if (Array.isArray(req) && req.length > 0) {
        // console.log('✅ El objeto es un array de ítems, construyendo objeto');
        requerimientoCompleto = {
          idrequerimiento:
            this.requerimientoSeleccionado?.idrequerimiento ||
            req[0].idrequerimiento,
          idalmacen: 'H001',
          prioridad: '3',
          detalles: req.map((item) => ({
            codigo: item.codigo,
            tipoclasificacion: 'I',
            cantidad: item.cantidad,
            idproducto: item.idproducto || '',
            iddescripcion: item.descripcionItem || item.descripcion || '',
            idproyecto: '',
            idcentrocosto: item.idcentrocosto || '',
            idturno: item.idturno || '',
            idlabor: '',
            eliminado: 0,
          })),
        };
      } else if (
        req.items &&
        Array.isArray(req.items) &&
        req.items.length > 0
      ) {
        // console.log('✅ El objeto tiene .items, usándolo');
        requerimientoCompleto = {
          ...req,
          detalle: req.items,
        };
      } else {
        // console.log(
        //   '⚠️ El objeto no tiene detalle reconocible, buscando en API y Dexie...',
        // );

        // Primero intentar obtener el detalle desde el API usando el endpoint de detalle
        try {
          // Llamar al API para obtener el detalle completo del requerimiento
          const response = await this.aprobacionesAreaService
            .obtenerRequerimientosConAprobacion({
              idrequerimiento: req.idrequerimiento || req.idRequerimiento,
            } as any)
            .toPromise();

          const listaApi: any[] = Array.isArray(response)
            ? response
            : response?.resultado || [];
          // ✅ CORRECCIÓN: buscar EL requerimiento correcto por id (antes tomaba
          // response[0], que podía ser OTRO requerimiento y migrarlo mal a SPRING)
          const idBuscado = req.idrequerimiento || req.idRequerimiento;
          const encontradoApi = listaApi.find(
            (r: any) =>
              (r.idRequerimiento || r.idrequerimiento) === idBuscado,
          );
          if (encontradoApi) {
            const dets =
              (Array.isArray(encontradoApi.detalles) && encontradoApi.detalles) ||
              (Array.isArray(encontradoApi.detalle) && encontradoApi.detalle) ||
              (Array.isArray(encontradoApi.items) && encontradoApi.items) ||
              [];
            requerimientoCompleto = { ...encontradoApi, detalles: dets };
          }
        } catch (error) {
          // console.log('No se pudo obtener del API, intentando desde Dexie...');
        }

        // Si no se pudo obtener del API, intentar desde Dexie
        if (!requerimientoCompleto) {
          const requerimientos = await this.dexieService.requerimientos
            .where('idrequerimiento')
            .equals(req.idrequerimiento || req.idRequerimiento)
            .toArray();
          const dexieReq: any =
            requerimientos.length > 0 ? requerimientos[0] : null;
          if (dexieReq) {
            const dets =
              (Array.isArray(dexieReq.detalles) && dexieReq.detalles) ||
              (Array.isArray(dexieReq.detalle) && dexieReq.detalle) ||
              (Array.isArray(dexieReq.items) && dexieReq.items) ||
              [];
            requerimientoCompleto = { ...dexieReq, detalles: dets };
          }
        }

        // Si aún no hay datos, construir con lo disponible
        if (!requerimientoCompleto) {
          // console.warn(
          //   '⚠️ No se encontró el requerimiento en Dexie ni API, usando datos básicos',
          // );
          requerimientoCompleto = {
            idrequerimiento: req.idrequerimiento || req.idRequerimiento,
            idalmacen: req.idalmacen || 'H001',
            prioridad: req.prioridad || '3',
            detalles:
              (Array.isArray(req.detalle) && req.detalle) ||
              (Array.isArray(req.detalles) && req.detalles) ||
              (Array.isArray(req.items) && req.items) ||
              [],
          };
        }
      }

      // Verificar que tenemos detalle
      if (
        !requerimientoCompleto.detalles ||
        requerimientoCompleto.detalles.length === 0
      ) {
        // console.error('❌ El requerimiento no tiene detalle');
        if (!silencioso) {
          Swal.fire(
            'Error',
            'No se pudo obtener el detalle del requerimiento',
            'error',
          );
          return;
        }
        // En modo silencioso (aprobación múltiple) lanzar para contarlo como fallo
        throw new Error(
          `Requerimiento ${req.idrequerimiento || req.idRequerimiento} sin detalle para sincronizar`,
        );
      }

      let origenapp = 'app_logistica';

      // ✅ CORRECCIÓN: Convertir almacén corto (001) a código completo (H001)
      let almacenCodigo = requerimientoCompleto.idalmacen || 'H001';
      console.log('🔍 DEBUG - Almacén del requerimiento:', almacenCodigo);
      
      // Si el almacén es solo un número corto (ej: "001"), convertir a formato completo
      if (almacenCodigo && almacenCodigo.length <= 3 && !isNaN(Number(almacenCodigo))) {
        // Buscar en la lista de almacenes
        const almacenes = await this.dexieService.showAlmacenes();
        const almacenCompleto = almacenes.find((a: any) => a.almacen === almacenCodigo);
        if (almacenCompleto) {
          almacenCodigo = almacenCompleto.idalmacen;
          console.log('🔍 DEBUG - Almacén corregido de', requerimientoCompleto.idalmacen, 'a', almacenCodigo);
        } else {
          // Si no se encuentra, usar formato H + código (ej: H001)
          almacenCodigo = 'H' + almacenCodigo.padStart(3, '0');
          console.log('🔍 DEBUG - Almacén convertido a formato estándar:', almacenCodigo);
        }
      }

      // ✅ Corregido: Obtener código del CECO y AFE del proyecto antes de construir el JSON
      const first = requerimientoCompleto.detalles?.[0];
      
      // 🔍 DEBUG: Ver qué datos tiene el primer item
      console.log('🔍 DEBUG - Primer item del detalle:', first);
      console.log('🔍 DEBUG - Campos disponibles:', Object.keys(first || {}));
      console.log('🔍 DEBUG - idcentrocosto:', first?.idcentrocosto);
      console.log('🔍 DEBUG - idlabor:', first?.idlabor);
      console.log('🔍 DEBUG - idproyecto:', first?.idproyecto);
      console.log('🔍 DEBUG - ceco (alternativo):', first?.ceco);
      console.log('🔍 DEBUG - labor (alternativo):', first?.labor);
      console.log('🔍 DEBUG - proyecto (alternativo):', first?.proyecto);
      
      // 🔍 DEBUG: Ver datos maestros disponibles
      console.log('🔍 DEBUG - CECOs disponibles:', this.cecos?.length || 0);
      if (this.cecos && this.cecos.length > 0) {
        console.log('🔍 DEBUG - Primer CECO:', this.cecos[0]);
        console.log('🔍 DEBUG - Campos del CECO:', Object.keys(this.cecos[0]));
      }
      console.log('🔍 DEBUG - Labores disponibles:', this.labores?.length || 0);
      if (this.labores && this.labores.length > 0) {
        console.log('🔍 DEBUG - Primera labor:', this.labores[0]);
      }
      
      // Buscar CECO con valor del detalle
      const cecoValue = first?.idcentrocosto || first?.ceco;
      console.log('🔍 DEBUG - Buscando CECO con valor:', cecoValue);
      const cecoEncontrado = this.cecos.find((c) => c.localname === cecoValue);
      console.log('🔍 DEBUG - CECO encontrado:', cecoEncontrado);
      
      const centroCostoDefault = cecoEncontrado?.costcenter ?? '0001';
      console.log('🔍 DEBUG - Centro de costo default:', centroCostoDefault);
      const cuentacontable = this.itemsFiltered.find(
        (i) => i.item === requerimientoCompleto.detalles?.[0].codigo,
      )?.cuentaGasto;
      const proyectoAfeDefault =
        this.proyectos.find((p) => p.proyectoio === first?.idproyecto)?.afe ??
        first?.idproyecto ??
        'FUNDO HP';
      const laborValor = (first?.idlabor || '').toString();
      const labores = this.labores.find((l: any) =>
        l.labor === laborValor ||
        l.idlabor === laborValor ||
        l.localname === laborValor ||
        String(l.id) === laborValor
      );
      // console.log('labores', labores);
      // ✅ CORRECCIÓN: Para COMPRA, usar centroCostoDefault si no hay labor
      const ccostodestino = labores?.idlabor ?? laborValor ?? centroCostoDefault;

      const turnos = this.turnos.find((t: any) =>
        t.nombreTurno === first?.idturno ||
        t.codTurno === first?.idturno ||
        String(t.turno) === String(first?.idturno)
      );
      // console.log('turno', turnos);
      // ✅ CORRECCIÓN: usar codTurno de la maestra; fallback código de empresa si no hay turno
      const turno = turnos?.codTurno ?? this.usuario.idempresa.substring(this.usuario.idempresa.length - 4);

      // ✅ Determinar clasificación usando todos los nombres de campo posibles
      // El SP ahora devuelve idclasificacion (lowercase). También soportar variantes legacy.
      const clasificacionRaw = (
        requerimientoCompleto.idclasificacion ||
        requerimientoCompleto.idClasificacion ||
        req.idclasificacion ||
        (req as any).idClasificacion ||
        ''
      );
      const itemtipo = (requerimientoCompleto.itemtipo || req.itemtipo || '').toUpperCase();

      // Determinar clasificación: priorizar valor real de BD; si no viene
      // (ej. lista de aprobados no devuelve idclasificacion), derivarla del
      // detalle/maestras. SPRING rechaza Clasificacion vacía (FK a
      // WH_ClasificacionRequOrden), por eso nunca debe ir ''.
      let clasificacion = clasificacionRaw;
      if (!clasificacion) {
        const primerDetalle = requerimientoCompleto.detalles[0] || {};
        // tipoDetalle: 'COMMODITY'|'ACTIVOFIJO'|'ACTIVOMENOR'|'ITEM' (lista pendientes)
        // tipoclasificacion: 'I'|'C'|'A'|'M' (logistica_dreq)
        const tipoDetalle = (
          primerDetalle.tipo ||
          primerDetalle.tipoDetalle ||
          primerDetalle.tipoclasificacion ||
          ''
        )
          .toString()
          .toUpperCase();

        if (
          itemtipo === 'SERVICIO' ||
          tipoDetalle === 'COMMODITY' ||
          tipoDetalle === 'ACTIVOFIJO' ||
          tipoDetalle === 'ACTIVOMENOR' ||
          tipoDetalle === 'C' ||
          tipoDetalle === 'A' ||
          tipoDetalle === 'M'
        ) {
          // Buscar la clasificación real del commodity en las maestras
          const comm =
            this.subcommodities.find(
              (sc) => sc.commodity === primerDetalle.codigo,
            ) ||
            this.commodities.find(
              (c) => c.commodity === primerDetalle.codigo,
            );
          clasificacion =
            comm?.clasificacion ||
            (tipoDetalle === 'ACTIVOFIJO' || tipoDetalle === 'A'
              ? 'ACT'
              : tipoDetalle === 'ACTIVOMENOR' || tipoDetalle === 'M'
                ? 'ACM'
                : 'SER');
        } else if (itemtipo === 'COMMODITY') {
          clasificacion = 'COM';
        } else if (itemtipo === 'TRANSFERENCIA') {
          clasificacion = 'TRA';
        } else {
          // Ítem normal: en logistica_req.idclasificacion se guarda
          // CMP (compra) / STO (consumo) — ver requerimientos-item.service.ts
          clasificacion = itemtipo === 'CONSUMO' ? 'STO' : 'CMP';
        }
      }

      const tipoReq = (clasificacion === 'SER' || clasificacion === 'COM') ? 'COMMODITY' : 'ITEM';

      // ✅ Para COMMODITY/SERVICIO el detalle local puede no traer 'descripcion':
      // resolverla desde la maestra de commodities por código
      const descripcionCommodityPorCodigo = new Map<string, string>();
      if (tipoReq !== 'ITEM') {
        try {
          const maestras = [
            ...(await this.dexieService.comodities.toArray()),
            ...(await this.dexieService.maestroCommoditys.toArray()),
          ];
          for (const c of maestras) {
            const cod = (c as any)?.codigo ?? (c as any)?.commodity;
            const desc = (c as any)?.descripcion ?? (c as any)?.descripcionLocal;
            if (cod && desc && !descripcionCommodityPorCodigo.has(cod)) {
              descripcionCommodityPorCodigo.set(cod, desc);
            }
          }
        } catch (e) {
          console.warn('[SPRING] No se pudo cargar maestra de commodities:', e);
        }
      }

      console.log('🏪 DEBUG - AlmacenCodigo FINAL antes de enviar a SPRING:', almacenCodigo);
      console.log('🏪 DEBUG - AlmacenCodigo truncado (max 20 chars):', almacenCodigo.substring(0, 20));
      console.log('🏪 DEBUG - Clasificación FINAL:', clasificacion, '(itemtipo:', itemtipo, ')');

      const requerimiento = [
        {
          // ✅ Corregido: CompaniaSocio con "00" como espera el SP
          CompaniaSocio: this.usuario.idempresa + '00',
          // DEBUG: Mostrar valores para diagnóstico
          DEBUG_idempresa: this.usuario.idempresa,
          DEBUG_CompaniaSocio_final: this.usuario.idempresa + '00',
          DEBUG_AlmacenOriginal: requerimientoCompleto.idalmacen,
          DEBUG_AlmacenFinal: almacenCodigo,
          // ✅ Corregido: Clasificación determinada por itemtipo si no viene explícita
          Clasificacion: clasificacion,
          // ✅ Corregido: Calcular según itemtipo
          ComprasAlmacenFlag:
            requerimientoCompleto.itemtipo === 'TRANSFERENCIA' ||
            requerimientoCompleto.itemtipo === 'CONSUMO'
              ? 'A'
              : 'C',
          // ✅ CORRECCIÓN: Usar almacenCodigo corregido (convertido de 001 a H001)
          AlmacenCodigo: almacenCodigo.substring(0, 20),
          MonedaCodigo: 'LO',
          // ✅ Corregido: Formato de fecha - igual que en aprobaciones.component.ts
          FechaRequerida: this.fechaISO(
            req.fecha,
            req.fechaRegistro,
            req.fecharegistro,
            req.fechaCreacion,
            requerimientoCompleto.fecha,
            requerimientoCompleto.fechaRegistro,
          ),
          FechaPreparacion: new Date().toISOString(),
          FechaAprobacion: this.fechaISO(
            req.fechaAprobacion,
            req.fechaaprobacion,
            requerimientoCompleto.fechaAprobacion,
          ),
          PreparadaPor: req.dniregistra || req.solicitante,
          AprobadaPor: this.usuario.documentoidentidad,
          // PrecioTotal: 0.0,
          // ✅ Corregido: Usar prioridad del requerimiento
          PrioridadCodigo: String(
            requerimientoCompleto.prioridad || '1',
          ).substring(0, 10),
          DefaultPrime: centroCostoDefault, // costcenter (código)
          DefaultAfe: proyectoAfeDefault, // proyecto afe
          CuantiaMonetariaPendienteFlag: 'N',
          // ✅ Limitar longitud de unidad de negocio a 20 caracteres
          UnidadNegocio: '0001',
          // ✅ Limitar longitud de unidad de replicación a 20 caracteres
          UnidadReplicacion: 'TRUJ',
          LocalForeignFlag: 'L',
          // ✅ Limitar longitud de comentarios a 300 caracteres - USAR GLOSA DEL REQUERIMIENTO
          Comentarios: (
            requerimientoCompleto.glosa ||
            req.glosa ||
            'REQUERIMIENTO APROBADO'
          ).substring(0, 300),
          // ✅ Corregido: Estado debe ser 'AP' para aprobados
          Estado: 'AP',
          // ✅ Limitar longitud de usuario a 50 caracteres
          UltimoUsuario: (
            this.usuario.documentoidentidad || 'MISESF'
          ).substring(0, 50),
          UltimaFechaModif: new Date().toISOString(),
          UltimoUsuarioNumero: -1,
          // ✅ Limitar longitud de transacción a 10 caracteres
          TransaccionOperacion: '999'.substring(0, 10),
          // ✅ Limitar longitud de campo referencia a 20 caracteres
          DefaultCampoReferencia: 'PL'.substring(0, 20),
          RevisionTecnicaPendienteFlag: 'N',
          // ✅ ClienteNumeroPedido: idlabor (código) del requerimiento, resuelto via maestra de labores
          ClienteNumeroPedido: (labores?.idlabor ?? laborValor ?? '').toString().substring(0, 20),
          // ✅ Limitar longitud de vía transporte a 5 caracteres
          ViaTransporte: 'T'.substring(0, 5),
          OrigenGeneracionFlag: 'L',
          origen: origenapp,

          // ✅ Corregido: Detalle con TipoDetalle y manejo Item/Commodity
          detalle: (requerimientoCompleto.detalles || []).map(
            (d: any, index: number) => {
              // ✅ CORRECCIÓN CRÍTICA: Calcular centro de costo y labor POR CADA ITEM
              // Buscar con nombres alternativos de campos
              const itemCeco = this.cecos.find((c) => c.localname === (d.idcentrocosto || d.ceco));
              const itemCentroCosto = itemCeco?.costcenter ?? centroCostoDefault;
              
              const itemLaborValor = (d.idlabor || d.labor || '').toString();
              const itemLabor = this.labores.find((l: any) =>
                l.labor === itemLaborValor ||
                l.idlabor === itemLaborValor ||
                String(l.id) === itemLaborValor
              );
              const itemLoteProduccion = itemLabor?.idlabor ?? (itemLaborValor || itemCentroCosto);
              
              return {
                Secuencia: index + 1,
                // ✅ Corregido: Usar tipoReq para decidir Item/Commodity
                Item: tipoReq === 'ITEM' ? d.codigo : null,
                Commodity: tipoReq !== 'ITEM' ? d.codigo : null,
                Condicion: '0',
                // Temporal: debería buscar unidad en una lista de items
                UnidadCodigo: 'UND',
                // ✅ Corregido: Descripción según tipo
                Descripcion:
                  tipoReq === 'ITEM'
                    ? d.idproducto || d.descripcion || ''
                    : d.descripcion ||
                      d.descripcionCommodity ||
                      d.descripcionItem ||
                      d.iddescripcion ||
                      descripcionCommodityPorCodigo.get(d.codigo) ||
                      '',
                ComprasAlmacenFlag:
                  requerimientoCompleto.itemtipo === 'TRANSFERENCIA' ||
                  requerimientoCompleto.itemtipo === 'CONSUMO'
                    ? 'A'
                    : 'C',
                RedefinidoFlag: 'N',
                CantidadPedida: d.cantidad || 0,
                CantidadOrdenCompra: 0.0,
                CantidadRecibida: 0.0,
                PrecioUnitario: 0.0,
                PrecioxCantidad: 0.0,
                CotizacionCantidad: 0.0,
                CotizacionPrecioUnitario: 0.0,
                CotizacionPrecioUnitarioconIGV: 0.0,
                CotizacionProveedor: 0,
                ControlPresupuestalFlag: 'S',
                // ✅ Limitar longitud de comentario a 200 caracteres
                Comentario: (d.comentario || '').substring(0, 200),
                CentroCosto: itemCentroCosto,
                // ✅ CORRECCIÓN: Usar labor específica del item o centro de costo como fallback
                LoteProduccion: itemLoteProduccion,
                Estado: 'PE',
                // ✅ Limitar longitud de usuario a 50 caracteres
                UltimoUsuario: (
                  this.usuario.documentoidentidad || 'MISESF'
                ).substring(0, 50),
                UltimaFechaModif: new Date().toISOString(),
                IGVExoneradoFlag: d.afectoIGV === 'N' ? 'S' : 'N',
                GenerarContratoFlag: 'N',
                // Partida presupuestal (opcional) → WH_RequisicionDetalle
                PartidaPresupuestal: d.subpresupuesto != null ? String(d.subpresupuesto).padStart(4, '0') : null,
                Partida: d.partida || null,
                origen: origenapp,
              };
            }
          ),

          // ✅ Corregido: Distribución contable dinámica
          distribucion: (requerimientoCompleto.detalles || []).map(
            (d: any, index: number) => {
              console.log(`\n🔍 DISTRIBUCIÓN Item ${index + 1} - Inicio cálculo:`);
              console.log('  📋 Detalle del item:', d);
              console.log('  📋 Código item:', d.codigo);
              console.log('  📋 idproyecto:', d.idproyecto);
              console.log('  📋 proyecto (alternativo):', d.proyecto);
              console.log('  📋 idcentrocosto:', d.idcentrocosto);
              console.log('  📋 ceco (alternativo):', d.ceco);
              console.log('  📋 idlabor:', d.idlabor);
              console.log('  📋 labor (alternativo):', d.labor);
              
              // ✅ CORRECCIÓN CRÍTICA: Calcular valores específicos POR CADA ITEM
              // Para commodities, buscar en subcommodities o commodities
              // Para items, buscar en itemsFiltered
              // La maestra puede traer cuentas inválidas ("EX", "PROYECTO003", texto libre).
              // La X en el 2º carácter (ej. 9X331101) es válida: se reemplaza por el div del CECO.
              const esCuentaValida = (c: any): boolean => {
                if (typeof c !== 'string') return false;
                const v = c.trim();
                return /^\d+$/.test(v) || /^\d[Xx]\d+$/.test(v);
              };
              // CECO del detalle: se usa para centro de costo y para el div de la cuenta
              const itemCeco = this.cecos.find(
                (c) => c.localname === (d.idcentrocosto || d.ceco)
              );
              const itemCentroCosto = itemCeco?.costcenter ?? centroCostoDefault;
              let itemCuentaContable;
              if (tipoReq === 'COMMODITY') {
                // Primero buscar en subcommodities (más específico)
                const subcommodity = this.subcommodities.find(
                  (sc) => sc.commodity === d.codigo
                );
                if (esCuentaValida(subcommodity?.cuentaContableGasto)) {
                  itemCuentaContable = subcommodity.cuentaContableGasto;
                } else {
                  // Si no se encuentra, buscar en commodities
                  const commodity = this.commodities.find(
                    (c) => c.commodity === d.codigo
                  );
                  itemCuentaContable =
                    (esCuentaValida(commodity?.cuentaContableGasto) && commodity.cuentaContableGasto) ||
                    itemCeco?.ccontable ||
                    cuentacontable;
                  if (subcommodity && !esCuentaValida(subcommodity.cuentaContableGasto)) {
                    console.warn(`⚠️ Subcommodity ${d.codigo} tiene cuentaContableGasto inválida: '${subcommodity.cuentaContableGasto}'`);
                  }
                }
                // Solo servicios: la X del 2º carácter se reemplaza por el div del CECO del detalle
                if (typeof itemCuentaContable === 'string' && itemCuentaContable[1]?.toUpperCase() === 'X') {
                  if (!itemCeco?.div) {
                    console.warn(`⚠️ Cuenta ${itemCuentaContable} requiere div pero el CECO '${d.idcentrocosto || d.ceco}' no tiene div`);
                  }
                  itemCuentaContable = this.aplicarDivCuenta(itemCuentaContable, itemCeco?.div);
                }
              } else {
                // Para items, buscar en itemsFiltered
                const itemEncontrado = this.itemsFiltered.find(
                  (i) => i.item === d.codigo
                );
                if (itemEncontrado?.cuentaGasto) {
                  itemCuentaContable = itemEncontrado.cuentaGasto;
                } else {
                  // Fallback: ACTIVOFIJO/ACTIVOMENOR usan códigos de la maestra de subcommodity
                  const subcommodity = this.subcommodities.find(
                    (sc) => sc.commodity === d.codigo
                  );
                  const commodity = this.commodities.find(
                    (c) => c.commodity === d.codigo
                  );
                  itemCuentaContable =
                    (esCuentaValida(subcommodity?.cuentaContableGasto) && subcommodity.cuentaContableGasto) ||
                    (esCuentaValida(commodity?.cuentaContableGasto) && commodity.cuentaContableGasto) ||
                    itemCeco?.ccontable ||
                    cuentacontable;
                }

                // Debug: mostrar si no se encontró el item
                if (!itemEncontrado) {
                  console.warn(`⚠️ Item ${d.codigo} no encontrado en itemsFiltered, usando cuenta por defecto`);
                }
              }

              // La cuenta nunca puede ir vacía a SPRING: abortar con mensaje claro
              if (!itemCuentaContable) {
                const msg = tipoReq === 'COMMODITY'
                  ? `El subcommodity ${d.codigo} no tiene cuenta contable en la maestra`
                  : `El item ${d.codigo} no tiene cuenta contable en la maestra`;
                console.error('❌ ' + msg);
                if (!silencioso) {
                  Swal.fire('Error', msg, 'error');
                }
                const err = new Error(msg) as any;
                err.yaNotificado = true;
                throw err;
              }
              console.log('  💰 Account (cuenta contable):', itemCuentaContable);
              
              // Buscar con nombres alternativos de campos
              const itemProyecto = this.proyectos.find((p) => p.proyectoio === (d.idproyecto || d.proyecto));
              console.log('  🎯 Proyecto encontrado:', itemProyecto);
              const itemAfe = itemProyecto?.afe ?? proyectoAfeDefault;
              console.log('  📊 Afe (proyecto):', itemAfe);
              
              console.log('  🏢 CECO encontrado:', itemCeco);
              console.log('  🏢 Centro de costo:', itemCentroCosto);
              
              const itemLaborValor = (d.idlabor || d.labor || '').toString();
              const itemLabor = this.labores.find((l: any) =>
                l.labor === itemLaborValor ||
                l.idlabor === itemLaborValor ||
                String(l.id) === itemLaborValor
              );
              console.log('  👷 Labor encontrada:', itemLabor);
              const itemCentroCostoDestino = itemLabor?.idlabor ?? itemCentroCosto;
              console.log('  🎯 CentroCostoDestino (labor o ceco):', itemCentroCostoDestino);
              
              // ✅ Relacionar idturno del requerimiento con la maestra de turnos
              // (API Maestra get-turnos) para obtener el codTurno (ej: "INV28")
              const turnoValor = (d.idturno || d.turno || '').toString();
              const itemTurno = this.turnos.find((t: any) =>
                t.nombreTurno === turnoValor ||
                t.codTurno === turnoValor ||
                String(t.turno) === turnoValor ||
                String(t.id) === turnoValor
              );
              console.log('  ⏰ Turno encontrado:', itemTurno);
              const itemCodTurno = itemTurno?.codTurno ?? '';
              console.log('  ⏰ codTurno:', itemCodTurno);
              
              // ✅ CORRECCIÓN: Formatear Sucursal a 4 dígitos (ej: 000008 -> 0801)
              let sucursalFormateada = requerimientoCompleto.idfundo;
              if (!sucursalFormateada || sucursalFormateada.length < 4) {
                // Si no hay fundo o es muy corto, usar últimos 2 dígitos de idempresa + '01'
                const empresaCorta = this.usuario.idempresa.substring(this.usuario.idempresa.length - 2);
                sucursalFormateada = empresaCorta + '01';
              }
              // Asegurar que sea exactamente 4 caracteres
              sucursalFormateada = sucursalFormateada.substring(0, 4).padStart(4, '0');
              
              const distribucionItem = {
                Secuencia: index + 1,
                Linea: 1,
                // ✅ CORRECCIÓN: Usar cuenta contable específica del item
                Account: itemCuentaContable,
                // ✅ CORRECCIÓN: Usar AFE específico del proyecto del item
                Afe: itemAfe,
                Monto: 100,
                // ✅ CORRECCIÓN: Usar centro de costo destino específico del item
                CentroCostoDestino: itemCentroCostoDestino,
                // ✅ CORRECCIÓN: Formatear sucursal a 4 dígitos
                Sucursal: sucursalFormateada,
                // ✅ Limitar longitud de campo referencia a 20 caracteres
                CampoReferencia: 'PL',
                // ✅ ReferenciaFiscal01: codTurno de la maestra (INV28, etc.)
                ReferenciaFiscal01: itemCodTurno,
                // ✅ ReferenciaFiscal02: idfundo del requerimiento
                ReferenciaFiscal02: sucursalFormateada,
                origen: origenapp,
              };
              
              console.log('  ✅ Distribución construida:', distribucionItem);
              return distribucionItem;
            }
          ),
        },
      ];

      console.log('📤 Enviando al SP SPRING:', requerimiento);
      console.log('🔍 DETALLE - Verificando CentroCosto y LoteProduccion por item:');
      requerimiento[0].detalle.forEach((det: any, idx: number) => {
        console.log(`  Item ${idx + 1}: CentroCosto="${det.CentroCosto}", LoteProduccion="${det.LoteProduccion}"`);
      });
      console.log('🔍 DISTRIBUCIÓN - Verificando CentroCostoDestino por item:');
      requerimiento[0].distribucion.forEach((dist: any, idx: number) => {
        console.log(`  Item ${idx + 1}: CentroCostoDestino="${dist.CentroCostoDestino}", Account="${dist.Account}", Afe="${dist.Afe}"`);
      });
      console.log('🔍 Llamando a getRegristroRequerimientoSPRING...');

      // ✅ CORRECCIÓN: esperar la respuesta real de SPRING (antes era fire-and-forget:
      // el await resolvía al hacer subscribe y contaba como sincronizado aunque
      // SPRING rechazara el requerimiento)
      const resp = await firstValueFrom(
        this.requerimientosService.getRegristroRequerimientoSPRING(requerimiento),
      );
      console.log('✅ Respuesta del backend:', resp);
      const resultado = Array.isArray(resp) ? resp[0] : resp;

      if (resultado?.errorgeneral === 0) {
        const correlativoSPRING = resultado.RequisicionNumero;
        console.log(
          '✅ Requerimiento sincronizado correctamente a SPRING:',
          correlativoSPRING,
        );

        // Actualizar el número de requisición en la BD
        await this.actualizarRequisicionSPRING_DB(req.idrequerimiento, correlativoSPRING);

        // ✅ NUEVO: Registrar en tablas locales para consolidación (solo para commodities)
        if (tipoReq === 'COMMODITY') {
          this.registrarRequerimientoCommodityLocal(
            correlativoSPRING,
            requerimientoCompleto,
            req
          );
        }

        if (!silencioso) {
          Swal.fire(
            'Éxito',
            'Requerimiento sincronizado a SPRING correctamente',
            'success',
          );
        }
      } else {
        console.error('❌ SPRING rechazó el requerimiento:', resp);
        if (!silencioso) {
          Swal.fire(
            'Error',
            'Hubo un problema al sincronizar el requerimiento a SPRING',
            'error',
          );
        }
        const errSpring = new Error(
          `SPRING rechazó el requerimiento ${req.idrequerimiento}: ${JSON.stringify(resultado)}`,
        ) as any;
        errSpring.yaNotificado = true;
        throw errSpring;
      }
    } catch (error) {
      console.error('❌ Error en sincronizarRequerimientoSPRING:', error);
      console.error('❌ Detalles del error catch:', {
        message: error instanceof Error ? error.message : String(error),
        status: (error as any)?.status,
        statusText: (error as any)?.statusText
      });
      if (!silencioso && !(error as any)?.yaNotificado) {
        Swal.fire('Error', 'Error al procesar la sincronización', 'error');
      }
      throw error;
    }
  }

  // Método para actualizar el número de requisición de SPRING en la BD
  async actualizarRequisicionSPRING_DB(
    idrequerimiento: string,
    correlativoSPRING: string,
  ) {
    try {
      const payload = [
        {
          idrequerimiento: idrequerimiento,
          RequisicionNumero: correlativoSPRING, // ✅ Corregido: SP espera "RequisicionNumero"
        },
      ];

      console.log('📝 Actualizando correlativo SPRING en BD:', payload);

      const resp = await firstValueFrom(
        this.requerimientosService.getNumeroRequerimientoPRING(payload),
      );
      console.log('✅ Respuesta del backend:', resp);
      const resultado = Array.isArray(resp) ? resp[0] : resp;
      // La respuesta tiene 'error' no 'errorgeneral'
      if (resultado?.error === 0) {
        console.log(
          '✅ Requisición actualizada correctamente en DB:',
          resultado,
        );
      } else {
        console.error('❌ Error al actualizar requisición:', resp);
      }

      // TODO: Implementar el método en el servicio si no existe
      // this.aprobacionesAreaService.actualizarCorrelativoSpring(payload).subscribe({
      //   next: (resp) => {
      //     console.log('✅ Correlativo actualizado en BD:', resp);
      //   },
      //   error: (error) => {
      //     console.error('❌ Error al actualizar correlativo en BD:', error);
      //   }
      // });
    } catch (error) {
      console.error('❌ Error en actualizarRequisicionSPRING_DB:', error);
    }
  }

  // ✅ NUEVO: Registrar requerimiento commodity aprobado en tablas locales para consolidación
  async registrarRequerimientoCommodityLocal(
    correlativoSPRING: string,
    requerimientoCompleto: any,
    req: any
  ) {
    try {
      // ✅ VERIFICAR Y CARGAR DATOS MAESTROS SI NO ESTÁN DISPONIBLES
      if (!this.cecos || this.cecos.length === 0) {
        console.log('⚠️ Cecos no cargados, cargando desde Dexie...');
        await this.ListarCecos();
      }
      if (!this.labores || this.labores.length === 0) {
        console.log('⚠️ Labores no cargadas, cargando desde Dexie...');
        await this.ListarLabores();
      }
      if (!this.turnos || this.turnos.length === 0) {
        console.log('⚠️ Turnos no cargados, cargando desde Dexie...');
        await this.ListarTurnos();
      }
      if (!this.proyectos || this.proyectos.length === 0) {
        console.log('⚠️ Proyectos no cargados, cargando desde Dexie...');
        await this.ListarProyectos();
      }

      console.log('📊 Datos maestros disponibles:', {
        cecos: this.cecos.length,
        labores: this.labores.length,
        turnos: this.turnos.length,
        proyectos: this.proyectos.length
      });

      // Obtener el primer detalle para extraer datos de cabecera
      const primerDetalle = requerimientoCompleto.detalles?.[0];
      
      // Buscar código de CECO
      const cecoEncontrado = this.cecos.find(c => 
        c.localname === primerDetalle?.idcentrocosto || 
        c.localname === primerDetalle?.ceco ||
        c.costcenter === primerDetalle?.idcentrocosto ||
        c.costcenter === primerDetalle?.ceco
      );
      const codigoCeco = cecoEncontrado?.costcenter || primerDetalle?.idcentrocosto || '';
      
      console.log('🔍 Búsqueda CECO cabecera:', {
        buscando: primerDetalle?.idcentrocosto || primerDetalle?.ceco,
        encontrado: cecoEncontrado,
        codigoFinal: codigoCeco
      });

      // Buscar idproyecto numérico si viene el nombre del proyecto
      let idproyectoNumerico = requerimientoCompleto.idproyecto;
      if (!idproyectoNumerico && primerDetalle?.idproyecto) {
        const proyectoEncontrado = this.proyectos.find(p => 
          p.proyectoio === primerDetalle.idproyecto || 
          p.proyectoio === primerDetalle.proyecto
        );
        idproyectoNumerico = proyectoEncontrado?.id || null;
      }

      console.log('🔍 Proyecto para cabecera:', {
        nombreProyecto: primerDetalle?.idproyecto || primerDetalle?.proyecto,
        idproyectoNumerico: idproyectoNumerico
      });

      // Convertir sociedad a formato de 3 dígitos con padding de ceros
      const sociedadPadded = String(this.usuario.sociedad || '1').padStart(3, '0');

      const payload = {
        RequisicionNumero: correlativoSPRING,
        sociedad: sociedadPadded,
        idproyecto: idproyectoNumerico,
        proyecto: requerimientoCompleto.proyecto || primerDetalle?.idproyecto || primerDetalle?.proyecto || '',
        usuario: this.usuario.documentoidentidad,
        area: this.usuario.idarea || '',
        idceco: codigoCeco,
        glosa: requerimientoCompleto.glosa || req.glosa || '',
        detalles: (requerimientoCompleto.detalles || []).map((d: any, index: number) => {
          console.log(`🔍 Procesando detalle ${index + 1}:`, {
            codigo: d.codigo,
            idcentrocosto: d.idcentrocosto,
            ceco: d.ceco,
            idlabor: d.idlabor,
            labor: d.labor,
            idturno: d.idturno,
            turno: d.turno,
            idproyecto: d.idproyecto,
            proyecto: d.proyecto
          });

          // Buscar código de CECO para este detalle
          const detalleCeco = this.cecos.find(c => 
            c.localname === d.idcentrocosto || 
            c.localname === d.ceco ||
            c.costcenter === d.idcentrocosto ||
            c.costcenter === d.ceco
          );
          
          // Buscar código de labor
          const laborEncontrada = this.labores.find(l => 
            l.labor === d.idlabor || 
            l.labor === d.labor ||
            l.localname === d.idlabor ||
            l.localname === d.labor
          );
          
          // Buscar código de turno: el idturno del requerimiento guarda el
          // nombreTurno; se relaciona con la maestra (get-turnos) para obtener codTurno
          const turnoValorDet = (d.idturno || d.turno || '').toString();
          const turnoEncontrado = this.turnos.find((t: any) =>
            t.nombreTurno === turnoValorDet ||
            t.codTurno === turnoValorDet ||
            String(t.turno) === turnoValorDet ||
            String(t.id) === turnoValorDet
          );
          
          // Buscar código de proyecto
          const proyectoEncontrado = this.proyectos.find(p => 
            p.proyectoio === d.idproyecto || 
            p.proyectoio === d.proyecto
          );

          const detalleResultado = {
            codigo: d.codigo,
            descripcion: d.descripcion || d.descripcionCommodity || d.descripcionItem || d.iddescripcion || '',
            cantidad: d.cantidad,
            unidadmedida: d.unidadmedida || 'UND',
            cuentaGasto: this.aplicarDivCuenta(
              this.subcommodities.find((sc) => sc.commodity === d.codigo)?.cuentaContableGasto ||
              this.commodities.find((c) => c.commodity === d.codigo)?.cuentaContableGasto ||
              detalleCeco?.ccontable,
              detalleCeco?.div
            ),
            centroCosto: detalleCeco?.costcenter || d.idcentrocosto || d.ceco || '',
            proyecto: proyectoEncontrado?.proyectoio || d.idproyecto || d.proyecto || '',
            labor: laborEncontrada?.idlabor || d.idlabor || d.labor || '',
            turno: turnoEncontrado?.codTurno || d.idturno || d.turno || ''
          };

          console.log(`✅ Detalle ${index + 1} mapeado:`, {
            centroCosto: detalleResultado.centroCosto,
            labor: detalleResultado.labor,
            turno: detalleResultado.turno,
            proyecto: detalleResultado.proyecto
          });

          return detalleResultado;
        })
      };

      console.log('📝 Registrando commodity en BD local para consolidación:', payload);

      this.requerimientosService
        .registrarRequerimientoCommodityAprobado(payload)
        .subscribe({
          next: (resp) => {
            console.log('✅ Commodity registrado en BD local:', resp);
            const resultado = Array.isArray(resp) ? resp[0] : resp;
            if (resultado?.success) {
              console.log('✅ Requerimiento disponible para consolidación');
            } else {
              console.error('❌ Error al registrar en BD local:', resp);
            }
          },
          error: (err) => {
            console.error('❌ Error HTTP al registrar commodity local:', err);
          }
        });
    } catch (error) {
      console.error('❌ Error en registrarRequerimientoCommodityLocal:', error);
    }
  }

  // Reemplaza la X del 2º carácter de la cuenta (ej. 9X331101) por el div del CECO
  aplicarDivCuenta(cuenta: any, div: any): any {
    if (typeof cuenta === 'string' && cuenta[1]?.toUpperCase() === 'X') {
      return cuenta[0] + (div ?? '') + cuenta.substring(2);
    }
    return cuenta;
  }

  // Método auxiliar para obtener código de CECO a partir del nombre
  obtenerCodigoCECO(nombreCECO: string): string {
    // Si ya es un código numérico o corto, devolverlo
    if (/^\d+$/.test(nombreCECO) || nombreCECO.length <= 20) {
      return nombreCECO;
    }

    // Mapeo de CECOs conocidos
    const cecoMap: { [key: string]: string } = {
      'RIEGO Y FERTILIZACION': '11020',
      'RIEGO Y FERTILIZACIO': '11020', // Versión truncada
      ADMINISTRACION: '11010',
      PRODUCCION: '11030',
      MANTENIMIENTO: '11040',
      'COSTOS INDIRECTOS': '11050',
    };

    // Buscar en el mapeo
    for (const [nombre, codigo] of Object.entries(cecoMap)) {
      if (nombreCECO.toUpperCase().includes(nombre.toUpperCase())) {
        return codigo;
      }
    }

    // Si no se encuentra, devolver un código por defecto
    return '11020';
  }

  // Método auxiliar para obtener nombre del CECO (para DefaultPrime)
  obtenerNombreCECO(codigoCECO: string): string {
    // Si ya es un nombre (contiene letras), devolverlo
    if (/[a-zA-Z]/.test(codigoCECO)) {
      return codigoCECO;
    }

    // Mapeo inverso: de código a nombre
    const cecoMap: { [key: string]: string } = {
      '11010': 'ADMINISTRACION',
      '11020': 'RIEGO Y FERTILIZACION',
      '11030': 'PRODUCCION',
      '11040': 'MANTENIMIENTO',
      '11050': 'COSTOS INDIRECTOS',
    };

    return cecoMap[codigoCECO] || 'RIEGO Y FERTILIZACION';
  }

  // Devuelve la primera fecha válida en ISO; si ninguna lo es, usa la fecha actual
  fechaISO(...valores: any[]): string {
    for (const v of valores) {
      if (!v) {
        continue;
      }
      const d = v instanceof Date ? v : new Date(v);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    return new Date().toISOString();
  }

  // Método para formatear fecha a dd-mm-yyyy para SPRING
  formatDateForSpring(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year} 00:00:00.000`;
  }

  // ✅ Nuevo método para formatear fecha local sin problemas de zona horaria
  formatDateForSQLLocal(date: any): string {
    if (typeof date === 'string') {
      // Si es string, asumimos formato yyyy-mm-dd
      const parts = date.split('-');
      if (parts.length === 3) {
        return `${date} 00:00:00`;
      }
    }
    // Si es Date o cualquier otro caso
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // =============================================
  // DETALLE DE REQUERIMIENTO
  // =============================================

  verDetalle(requerimiento: RequerimientoConAprobacion) {
    this.requerimientoDetalle = requerimiento;
    this.displayDetalleModal = true;
  }

  // =============================================
  // RE-SINCRONIZACIÓN A SPRING (aprobados sin migrar)
  // =============================================

  resincronizandoId: string | null = null;

  /**
   * Un requerimiento puede re-sincronizarse si está APROBADO en logística
   * pero aún no tiene RequisicionNumero de SPRING.
   */
  puedeResincronizar(req: any): boolean {
    const estado = (req?.estado || req?.estados || '')
      .toString()
      .toUpperCase();
    const migrado = !!(
      req?.RequisicionNumero ||
      req?.requisicionNumero ||
      req?.correlativoSpring
    );
    return estado === 'APROBADO' && !migrado;
  }

  async resincronizarRequerimiento(req: any) {
    if (!req || this.resincronizandoId) {
      return;
    }
    const confirmar = await this.alertService.showConfirm(
      'Sincronizar a SPRING',
      `El requerimiento <b>${req.idrequerimiento}</b> está aprobado pero no tiene número de requisición en SPRING.<br>¿Desea migrarlo ahora?`,
      'warning',
    );
    if (!confirmar) {
      return;
    }
    this.resincronizandoId = req.idrequerimiento;
    try {
      // sincronizarRequerimientoSPRING ya muestra el resultado (éxito/error)
      await this.sincronizarRequerimientoSPRING(req);
      await this.cargarDashboard();
      await this.cargarMisRequerimientos();
    } catch (error) {
      console.error('❌ Error re-sincronizando requerimiento:', error);
    } finally {
      this.resincronizandoId = null;
    }
  }

  //================================================
  //DETALLE DE REQUERIMIENTO PENDIENTE DE APROBACION
  //================================================
  async verDetallePendientes(requerimiento: any) {
    this.requerimientoDetallePendientes = requerimiento;
    this.loadingDetallePendientes = true;
    this.displayDetallePendientesModal = true;

    // Cargar los items completos del endpoint con detalle
    try {
      const response = await this.aprobacionesAreaService
        .obtenerRequerimientosPendientesAreaDetalle({
          documentoidentidad: this.usuario.documentoidentidad,
          ruc: this.usuario.ruc,
        })
        .toPromise();

      const lista = Array.isArray(response)
        ? response
        : response?.resultado || [];

      const encontrado = lista.find(
        (r: any) =>
          (r.idRequerimiento || r.idrequerimiento) ===
          (requerimiento.idrequerimiento || requerimiento.idRequerimiento),
      );

      const detallesEncontrados =
        encontrado?.items || encontrado?.detalles || encontrado?.detalle || [];
      if (encontrado && detallesEncontrados.length > 0) {
        // Combinar con los detalles del listado: el SP de detalle puede no
        // devolver idproyecto/idlabor/etc., preservamos los del listado.
        const detallesOriginales: any[] =
          requerimiento.items ||
          requerimiento.detalles ||
          requerimiento.detalle ||
          [];
        const camposOpcionales = [
          'idproyecto', 'idlabor', 'idcentrocosto', 'idturno',
          'proyecto', 'labor', 'ceco', 'turno',
        ];
        const detallesCombinados = detallesEncontrados.map((d: any, i: number) => {
          const original =
            detallesOriginales.find(
              (o: any) => o?.id != null && d?.id != null && o.id === d.id,
            ) ||
            detallesOriginales.find((o: any) => o?.codigo === d?.codigo) ||
            detallesOriginales[i] ||
            {};
          const merged = { ...original, ...d };
          camposOpcionales.forEach((k) => {
            if ((merged[k] === undefined || merged[k] === null || merged[k] === '') && original[k]) {
              merged[k] = original[k];
            }
          });
          return merged;
        });
        this.requerimientoDetallePendientes = {
          ...requerimiento,
          items: detallesCombinados,
          detalles: detallesCombinados,
        };
      }
    } catch (error) {
      console.error('Error cargando detalle de pendientes:', error);
    } finally {
      this.loadingDetallePendientes = false;
    }

    // Detectar si es servicio y abrir el tab correspondiente
    const clas = (
      this.requerimientoDetallePendientes?.idClasificacion ||
      this.requerimientoDetallePendientes?.idclasificacion ||
      ''
    )
      .toString()
      .toUpperCase();
    const esServicio =
      clas === 'SER' || clas === 'COM' || clas === 'ACT' || clas === 'ACM';
    this.detallePendientesTab = esServicio ? 'servicios' : 'items';
    this.detallesPendientesSeleccionados = new Set<number>();
    this.detallesPendientesAprobados = new Set<number>();
    // Seleccionar todos por defecto
    const dets = this.getDetallesPendientes();
    dets.forEach((_, i) => this.detallesPendientesSeleccionados.add(i));
    // Cargar adjuntos
    this.cargarAdjuntos();
  }

  getDetallesPendientes(): any[] {
    const r = this.requerimientoDetallePendientes;
    if (!r) return [];
    return r.items || r.detalles || r.detalle || [];
  }

  /** Devuelve los detalles del requerimiento pendiente (ítems o servicios). */
  getDetallesItemsPendientes(): any[] {
    return this.getDetallesPendientes();
  }

  /** Devuelve solo los detalles de tipo servicio (si es requerimiento de servicios). */
  getDetallesServiciosPendientes(): any[] {
    if (!this.esRequerimientoServicio) return [];
    return this.getDetallesPendientes();
  }

  /**
   * Etiqueta del tipo de requerimiento: SERVICIO | CONSUMO | COMPRA | TRANSFERENCIA.
   * Es SERVICIO si itemtipo='SERVICIO' o la clasificación es de commodity
   * (SER/COM/ACT/ACM). En otro caso se usa itemtipo/tipoRequerimiento.
   */
  tipoRequerimientoLabel(req: any): string {
    const itemtipo = (req?.itemtipo || req?.tipoRequerimiento || '')
      .toString()
      .toUpperCase();
    const clas = (req?.idClasificacion || req?.idclasificacion || '')
      .toString()
      .toUpperCase();
    if (itemtipo === 'SERVICIO' || ['SER', 'COM', 'ACT', 'ACM'].includes(clas)) {
      return 'SERVICIO';
    }
    return itemtipo || 'COMPRA';
  }

  /** Devuelve true si el requerimiento es de servicios (COMMODITY / ACTIVO FIJO / ACTIVO MENOR / SERVICIO). */
  esRequerimientoServicioReq(req: any): boolean {
    return this.tipoRequerimientoLabel(req) === 'SERVICIO';
  }

  /** Devuelve true si el requerimiento pendiente es de tipo servicio (COMMODITY / ACTIVO FIJO / ACTIVO MENOR). */
  get esRequerimientoServicio(): boolean {
    return this.esRequerimientoServicioReq(this.requerimientoDetallePendientes);
  }

  /** Nombre del proyecto de una línea de detalle (resuelve código/AFE a nombre via maestras). */
  nombreProyectoDetalle(det: any): string {
    const valor = (det?.idproyecto || det?.proyecto || '').toString();
    if (!valor) return '';
    const p = this.proyectos?.find(
      (x: any) =>
        x.proyectoio === valor ||
        x.afe === valor ||
        String(x.id) === valor,
    );
    return p?.proyectoio || valor;
  }

  /** Nombre de la labor de una línea de detalle (resuelve código a nombre via maestras). */
  nombreLaborDetalle(det: any): string {
    const valor = (det?.idlabor || det?.labor || '').toString();
    if (!valor) return '';
    const l = this.labores?.find(
      (x: any) =>
        x.labor === valor ||
        x.idlabor === valor ||
        String(x.id) === valor,
    );
    return l?.labor || valor;
  }

  isDetallePendienteSeleccionado(i: number): boolean {
    return this.detallesPendientesSeleccionados.has(i);
  }

  toggleSeleccionDetallePendiente(i: number, checked: boolean) {
    if (checked) this.detallesPendientesSeleccionados.add(i);
    else this.detallesPendientesSeleccionados.delete(i);
  }

  isTodosDetallesPendientesSeleccionados(): boolean {
    const dets = this.getDetallesPendientes();
    return dets.length > 0 && this.detallesPendientesSeleccionados.size === dets.length;
  }

  toggleSeleccionTodosDetallesPendientes(checked: boolean) {
    const dets = this.getDetallesPendientes();
    if (checked) dets.forEach((_, i) => this.detallesPendientesSeleccionados.add(i));
    else this.detallesPendientesSeleccionados.clear();
  }

  aprobarDetallePendienteIndividual(index: number) {
    this.detallesPendientesAprobados.add(index);
    this.detallesPendientesSeleccionados.add(index);
  }

  async aprobarDetallesPendientes() {
    if (!this.requerimientoDetallePendientes || !this.usuario) return;

    // Prevenir auto-aprobación (salvo roles globales)
    const rolesGlobalesAprob2 = ['ADLOGIST', 'JLOLOGIST', 'JEMLOGIST', 'FINANZAS', 'GERENTE', 'TILOGIST'];
    const esRolGlobalAprob2 = rolesGlobalesAprob2.some(r => this.usuario.idrol?.includes(r));
    if (!esRolGlobalAprob2 && this.requerimientoDetallePendientes.dniregistra === this.usuario.documentoidentidad) {
      Swal.fire('No permitido', 'No puede aprobar su propio requerimiento', 'warning');
      return;
    }

    if (this.detallesPendientesSeleccionados.size === 0) {
      Swal.fire('Advertencia', 'Debe seleccionar al menos un ítem para aprobar', 'warning');
      return;
    }
    const dets = this.getDetallesPendientes();
    const seleccionados = Array.from(this.detallesPendientesSeleccionados).sort((a, b) => a - b);
    const codigosAprobados = seleccionados.map((i) => dets[i]?.codigo).filter(Boolean).join(', ');
    const comentariosBase = `Aprobados ${seleccionados.length}/${dets.length} ítems: ${codigosAprobados}`;
    const comentarios = comentariosBase.length > 1900 ? comentariosBase.substring(0, 1900) + '...' : comentariosBase;
    try {
      const requestAprobacion = {
        idrequerimiento: this.requerimientoDetallePendientes.idrequerimiento,
        documentoidentidad: this.usuario.documentoidentidad,
        accion: 'APROBADO' as const,
        comentarios,
      };
      const response = await (this.modoGerencia
        ? this.aprobacionesAreaService.aprobarRequerimientoGerencia(requestAprobacion)
        : this.aprobacionesAreaService.aprobarRequerimientoArea(requestAprobacion)
      ).toPromise();
      if (response) {
        const item = Array.isArray(response) ? response[0] : response;
        const estadoFinal = item?.estadoFinal || 'APROBADO';

        // Ocultar el requerimiento de la lista local del creador sin esperar sincronización
        await this.syncService.marcarAprobadoLocalmente(
          this.requerimientoDetallePendientes.idrequerimiento,
        );

        if (estadoFinal === 'APROBACION1') {
          // Flujo DOS_NIVELES: pendiente de Gerencia, sin migración SPRING aún
          console.log('ℹ️ Requerimiento quedó en APROBACION1 - pendiente de Gerencia');
          Swal.fire('Éxito', 'Aprobado nivel 1 - Pendiente de Gerencia', 'success');
        } else {
          // Migrar a SPRING tras aprobación exitosa
          try {
            console.log('🔄 Migrando requerimiento aprobado a SPRING...');
            await this.sincronizarRequerimientoSPRING(this.requerimientoDetallePendientes);
            console.log('✅ Migración a SPRING completada');
          } catch (err) {
            console.error('❌ Error migrando a SPRING:', err);
          }
          Swal.fire('Éxito', 'Requerimiento aprobado correctamente', 'success');
        }
        this.displayDetallePendientesModal = false;
        await this.cargarRequerimientosPendientes();
        await this.cargarDashboard();
        await this.cargarMisRequerimientos();
      }
    } catch {
      Swal.fire('Error', 'Error al aprobar el requerimiento', 'error');
    }
  }

  async rechazarDetallesPendientes() {
    if (!this.requerimientoDetallePendientes || !this.usuario) return;
    const { value: observacion } = await Swal.fire({
      title: 'Rechazar requerimiento',
      input: 'textarea',
      inputLabel: 'Observación',
      inputPlaceholder: 'Ingrese el motivo del rechazo...',
      inputAttributes: { 'aria-label': 'Ingrese el motivo del rechazo' },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      inputValidator: (v) => (!v || !v.trim() ? 'Debe ingresar una observación' : null),
    });
    if (!observacion) return;
    const dets = this.getDetallesPendientes();
    const seleccionados = Array.from(this.detallesPendientesSeleccionados).sort((a, b) => a - b);
    const codigosRechazados = seleccionados.map((i) => dets[i]?.codigo).filter(Boolean).join(', ');
    const comentarios = seleccionados.length
      ? `${observacion} | Ítems rechazados: ${codigosRechazados}`
      : observacion;
    try {
      const requestRechazo = {
        idrequerimiento: this.requerimientoDetallePendientes.idrequerimiento,
        documentoidentidad: this.usuario.documentoidentidad,
        accion: 'RECHAZADO' as const,
        comentarios,
      };
      const response = await (this.modoGerencia
        ? this.aprobacionesAreaService.aprobarRequerimientoGerencia(requestRechazo)
        : this.aprobacionesAreaService.aprobarRequerimientoArea(requestRechazo)
      ).toPromise();
      if (response) {
        Swal.fire('Éxito', 'Requerimiento rechazado correctamente', 'success');
        this.displayDetallePendientesModal = false;
        await this.cargarRequerimientosPendientes();
        await this.cargarDashboard();
        await this.cargarMisRequerimientos();
      }
    } catch {
      Swal.fire('Error', 'Error al rechazar el requerimiento', 'error');
    }
  }

  cerrarDetallePendientes() {
    this.displayDetallePendientesModal = false;
    this.requerimientoDetallePendientes = null;
    this.detallesPendientesSeleccionados.clear();
    this.detallesPendientesAprobados.clear();
  }

  // =============================================
  // UTILIDADES
  // =============================================

  getUrgenciaBadge(urgencia: string): {
    severity: 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast';
    label: string;
  } {
    return this.aprobacionesService.getUrgenciaBadge(urgencia);
  }

  getEstadoBadge(estado: string): {
    severity: 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast';
    label: string;
  } {
    return this.aprobacionesService.getEstadoBadge(estado);
  }

  formatTiempoEspera(minutos: number): string {
    return this.aprobacionesService.formatTiempoEspera(minutos);
  }

  calcularPorcentaje(completadas: number, total: number): number {
    return this.aprobacionesService.calcularPorcentajeAprobacion(
      completadas,
      total,
    );
  }

  getIndicador(tipo: string): number {
    if (!this.dashboard?.indicadores) return 0;
    const indicador = this.dashboard.indicadores.find((i) => i.tipo === tipo);
    return indicador?.cantidad || 0;
  }

  // ✅ Método para formatear fecha para SQL Server
  formatDateForSQL(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index;

    // Cargar datos según el tab seleccionado
    if (event.index === 1 && this.misRequerimientos.length === 0) {
      this.cargarMisRequerimientos();
    } else if (
      event.index === 2 &&
      this.todosRequerimientos.length === 0 &&
      this.usuario?.idrol === 'TI'
    ) {
      this.cargarTodosRequerimientos();
    }
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto);
  }

  getPrecioItem(codigo: string): number {
    const item = this.items.find((i: any) => i.id === codigo || i.codigo === codigo);
    return item ? parseFloat(item.precio) || 0 : 0;
  }

  calcularMontoDetalle(det: any): number {
    const precio = this.getPrecioItem(det.codigo);
    const cantidad = parseFloat(det.cantidad) || 0;
    return precio * cantidad;
  }

  calcularMontoRequerimiento(req: any): number {
    const tipo = (req.itemtipo || req.tipoRequerimiento || '').toString().toUpperCase();
    if (tipo !== 'COMPRA') return 0;
    const detalles: any[] = req.detalles || req.detalle || [];
    return detalles.reduce((total, det) => total + this.calcularMontoDetalle(det), 0);
  }

  calcularMontoModalActual(): number {
    const dets = this.getDetallesItemsPendientes();
    return dets.reduce((total, det) => total + this.calcularMontoDetalle(det), 0);
  }

  esRequerimientoCompra(req: any): boolean {
    const tipo = (req?.itemtipo || req?.tipoRequerimiento || '').toString().toUpperCase();
    return tipo === 'COMPRA';
  }

  esRequerimientoConsumo(req: any): boolean {
    const tipo = (req?.itemtipo || req?.tipoRequerimiento || '').toString().toUpperCase();
    return tipo === 'CONSUMO';
  }

  getDetalleItems(requerimiento: any): any[] {
    try {
      // Si el detalle es un string JSON, parsearlo
      if (typeof requerimiento['detalle'] === 'string') {
        return JSON.parse(requerimiento['detalle']);
      }
      return requerimiento['detalle'] || [];
    } catch (e) {
      console.error('Error al parsear detalle:', e);
      return [];
    }
  }

  // =============================================
  // ADJUNTOS DE REQUERIMIENTOS
  // =============================================

  cargarAdjuntos() {
    if (!this.requerimientoDetallePendientes?.idrequerimiento) {
      this.adjuntosRequerimiento = [];
      return;
    }

    this.loadingAdjuntos = true;
    this.adjuntosService.listarAdjuntosRequerimiento(
      this.requerimientoDetallePendientes.idrequerimiento
    ).subscribe({
      next: (response: any) => {
        const resultado = response.resultado;
        this.adjuntosRequerimiento = Array.isArray(resultado) ? resultado : [];
        this.loadingAdjuntos = false;
      },
      error: (error) => {
        console.error('Error al cargar adjuntos:', error);
        this.adjuntosRequerimiento = [];
        this.loadingAdjuntos = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async subirAdjunto() {
    if (!this.selectedFile || !this.requerimientoDetallePendientes?.idrequerimiento) {
      return;
    }

    this.subiendoAdjunto = true;

    try {
      const base64 = await this.adjuntosService.fileToBase64(this.selectedFile);
      const tipoArchivo = this.adjuntosService.getFileType(this.selectedFile);
      const tamanoArchivo = this.selectedFile.size;

      const data = {
        idRequerimiento: this.requerimientoDetallePendientes.idrequerimiento,
        nombreArchivo: this.selectedFile.name,
        tipoArchivo: tipoArchivo,
        tamanoArchivo: tamanoArchivo,
        contenidoBase64: base64,
        descripcion: '',
        usuarioCreacion: this.usuario?.documentoidentidad || this.usuario?.dni || ''
      };

      this.adjuntosService.guardarAdjuntoRequerimiento(data).subscribe({
        next: (response: any) => {
          if (response.success) {
            Swal.fire('Éxito', 'Archivo adjuntado correctamente', 'success');
            this.selectedFile = null;
            this.cargarAdjuntos();
          } else {
            Swal.fire('Error', response.mensaje || 'Error al adjuntar archivo', 'error');
          }
          this.subiendoAdjunto = false;
        },
        error: (error) => {
          console.error('Error al subir adjunto:', error);
          Swal.fire('Error', 'Error al adjuntar archivo', 'error');
          this.subiendoAdjunto = false;
        }
      });
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      Swal.fire('Error', 'Error al procesar archivo', 'error');
      this.subiendoAdjunto = false;
    }
  }

  cancelarSeleccionArchivo() {
    this.selectedFile = null;
  }

  descargarAdjunto(adjunto: any) {
    if (!adjunto.contenidoBase64) {
      Swal.fire('Error', 'No hay contenido del archivo para descargar', 'error');
      return;
    }

    try {
      const base64 = adjunto.contenidoBase64;
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: adjunto.tipoArchivo || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = adjunto.nombreArchivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      Swal.fire('Error', 'Error al descargar archivo', 'error');
    }
  }

  eliminarAdjunto(idAdjunto: number) {
    Swal.fire({
      title: '¿Eliminar adjunto?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adjuntosService.eliminarAdjuntoRequerimiento(idAdjunto).subscribe({
          next: (response: any) => {
            if (response.success) {
              Swal.fire('Eliminado', 'Adjunto eliminado correctamente', 'success');
              this.cargarAdjuntos();
            } else {
              Swal.fire('Error', response.mensaje || 'Error al eliminar adjunto', 'error');
            }
          },
          error: (error) => {
            console.error('Error al eliminar adjunto:', error);
            Swal.fire('Error', 'Error al eliminar adjunto', 'error');
          }
        });
      }
    });
  }

  // =============================================
  // ANULACIONES DE REQUERIMIENTOS
  // =============================================

  cargarRequerimientosAnulados() {
    this.loadingAnulados = true;
    this.aprobacionesAreaService.obtenerRequerimientosAnulables({
      documentoidentidad: this.usuario?.documentoidentidad || this.usuario?.dni || '',
      ruc: this.usuario?.ruc || ''
    }).subscribe({
      next: (response: any) => {
        const resultado = response.resultado;
        this.requerimientosAnulados = Array.isArray(resultado) ? resultado : [];
        this.loadingAnulados = false;
      },
      error: (error: any) => {
        console.error('Error al cargar requerimientos anulados:', error);
        this.requerimientosAnulados = [];
        this.loadingAnulados = false;
      }
    });
  }

  puedeAnular(req: any): boolean {
    const estado = req.estado || req.estados;
    return estado === 'PENDIENTE' || estado === 'EN APROBACION' || estado === 'APROBADO';
  }

  abrirModalAnulacion(req: any) {
    this.requerimientoParaAnular = req;
    this.motivoAnulacion = '';
    this.tipoAnulacion = 'RETORNABLE';
    this.displayAnulacionModal = true;
  }

  esAdminOTI(): boolean {
    const rol = this.usuario?.idrol || '';
    return rol.includes('ADLOGIST') || rol.includes('TILOGIST');
  }

  async confirmarAnulacion() {
    if (!this.requerimientoParaAnular || !this.motivoAnulacion || this.motivoAnulacion.length < 10) {
      return;
    }

    // Si el req ya migró a SPRING, no se puede devolver a PENDIENTE
    if (this.requerimientoParaAnular.yaMigroSpring && this.tipoAnulacion === 'RETORNABLE') {
      Swal.fire(
        'No permitido',
        `Este requerimiento ya fue migrado a SPRING (${this.requerimientoParaAnular.correlativoSpring}). Solo puede anularse definitivamente por un Administrador.`,
        'warning'
      );
      return;
    }

    // Solo ADLOGIST/TILOGIST pueden hacer anulación definitiva
    if (this.tipoAnulacion === 'DEFINITIVA' && !this.esAdminOTI()) {
      Swal.fire('No permitido', 'Solo Administradores pueden realizar una anulación definitiva.', 'warning');
      return;
    }

    const data = {
      idRequerimiento: this.requerimientoParaAnular.idrequerimiento,
      usuario: this.usuario?.documentoidentidad || this.usuario?.dni || '',
      ruc: this.usuario?.ruc || '',
      motivo: this.motivoAnulacion,
      tipoAnulacion: this.tipoAnulacion
    };

    this.aprobacionesAreaService.anularRequerimientoV2(data).subscribe({
      next: (response: any) => {
        if (response.success) {
          const msg = this.tipoAnulacion === 'RETORNABLE'
            ? 'Requerimiento devuelto a PENDIENTE. El solicitante puede corregir y reenviar a aprobación.'
            : 'Requerimiento anulado definitivamente. No se migrará a SPRING.';
          Swal.fire('Éxito', msg, 'success');
          this.displayAnulacionModal = false;
          this.motivoAnulacion = '';
          this.tipoAnulacion = 'RETORNABLE';
          this.requerimientoParaAnular = null;
          this.cargarRequerimientosPendientes();
          this.cargarRequerimientosAnulados();
        } else {
          Swal.fire('Error', response.mensaje || 'Error al procesar la anulación', 'error');
        }
      },
      error: (error: any) => {
        console.error('Error al anular requerimiento:', error);
        Swal.fire('Error', 'Error al procesar la anulación', 'error');
      }
    });
  }

  cargarHistorialAnulaciones() {
    if (!this.requerimientoDetallePendientes?.idrequerimiento) {
      this.historialAnulaciones = [];
      return;
    }

    this.loadingHistorialAnulaciones = true;
    this.aprobacionesAreaService.listarHistorialAnulaciones({
      idRequerimiento: this.requerimientoDetallePendientes.idrequerimiento
    }).subscribe({
      next: (response: any) => {
        const resultado = response.resultado;
        this.historialAnulaciones = Array.isArray(resultado) ? resultado : [];
        this.loadingHistorialAnulaciones = false;
      },
      error: (error: any) => {
        console.error('Error al cargar historial de anulaciones:', error);
        this.historialAnulaciones = [];
        this.loadingHistorialAnulaciones = false;
      }
    });
  }

  verHistorialAnulacion(req: any) {
    this.requerimientoDetallePendientes = req;
    this.detallePendientesTab = 'historial-anulaciones';
    this.displayDetallePendientesModal = true;
    this.cargarHistorialAnulaciones();
  }
}
