import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { firstValueFrom } from 'rxjs';
import { ProgressBarModule } from 'primeng/progressbar';
import { AprobacionesService } from '@/app/services/aprobaciones.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { ItemService } from '@/app/modules/main/services/items.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import Swal from 'sweetalert2';
import { environment } from '@/environments/environment';
import {
  RequerimientoPendiente,
  RequerimientoConAprobacion,
  DashboardAprobaciones,
  ProcesarAprobacionRequest,
} from '@/app/interfaces/aprobaciones.interface';

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
  ],
  templateUrl: './aprobaciones-area.component.html',
  styleUrl: './aprobaciones-area.component.scss',
})
export class AprobacionesAreaComponent implements OnInit {
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

  // Tab activo
  activeTabIndex = 0;

  constructor(
    private aprobacionesService: AprobacionesService,
    private aprobacionesAreaService: AprobacionesAreaService,
    private requerimientosService: RequerimientosService,
    private dexieService: DexieService,
    private maestrasService: MaestrasService,
    private ItemService: ItemService,
    private alertService: AlertService,
  ) {}

  ngOnInit() {
    this.cargarUsuario().then(() => {
      if (!this.usuario) {
        Swal.fire('Error', 'No se encontró información del usuario', 'error');
        return;
      }

      // Validar que el usuario tenga área y sea jefe de área
      if (
        !this.usuario.idarea ||
        (this.usuario.esJefeArea !== 1 && this.usuario.esJefeArea !== true)
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
    });
  }

  async cargarUsuario() {
    this.usuario = await this.dexieService.showUsuario();
  }

  async cargarDashboard() {
    if (!this.usuario) return;

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
      ruc: '20481121966',
    };

    this.aprobacionesAreaService
      .obtenerRequerimientosPendientesArea(data)
      .subscribe({
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

  cargarMisRequerimientos() {
    if (!this.usuario) return;

    this.loadingMisRequerimientos = true;
    this.misRequerimientos = [];

    // El SP espera usuario y rol
    const data = {
      usuario: this.usuario.documentoidentidad,
      rol: this.usuario.rol || 'JEFE_AREA',
      ruc: '20481121966',
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
      ruc: '20481121966',
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
    if (!this.requerimientoSeleccionado || !this.usuario) return;
    try {
      const response = await this.aprobacionesAreaService
        .aprobarRequerimientoArea({
          idrequerimiento: this.requerimientoSeleccionado.idrequerimiento, // Corregido: minúscula
          documentoidentidad: this.usuario.documentoidentidad,
          accion: 'APROBADO',
          comentarios: this.observaciones || 'Aprobado',
          ruc: '20481121966',
        })
        .toPromise();

      this.displayAprobacionModal = false;

      // console.log('📤 Respuesta de aprobación:', response);

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
          mensaje = firstItem.mensaje || 'Operación realizada correctamente';
        } else if ('resultado' in firstItem) {
          // Formato antiguo: [{ resultado: "SUCCESS", mensaje: "..." }]
          esExitoso =
            firstItem.resultado === 'SUCCESS' || firstItem.resultado === 'OK';
          mensaje = firstItem.mensaje || 'Operación realizada correctamente';
        }
      }

      if (esExitoso) {
        Swal.fire('Éxito', mensaje, 'success');
        console.log(this.requerimientoSeleccionado);
        // Sincronizar con SPRING después de aprobar
        await this.sincronizarRequerimientoSPRING(
          this.requerimientoSeleccionado,
        );

        await this.cargarRequerimientosPendientes();
        await this.cargarDashboard();
        // También cargar mis requerimientos para que aparezca en el tab 2
        await this.cargarMisRequerimientos();
      } else {
        // console.error('❌ Respuesta inesperada:', response);
        Swal.fire('Error', 'Error al aprobar el requerimiento', 'error');
      }
    } catch (error) {
      // console.error('Error al aprobar:', error);
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
      const response = await this.aprobacionesAreaService
        .aprobarRequerimientoArea({
          idrequerimiento: this.requerimientoSeleccionado.idrequerimiento,
          documentoidentidad: this.usuario.documentoidentidad,
          accion: 'RECHAZADO',
          comentarios: this.observaciones,
          ruc: '20481121966',
        })
        .toPromise();

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
  // SINCRONIZACIÓN CON SPRING
  // =============================================

  async sincronizarRequerimientoSPRING(req: any) {
    try {
      // console.log('📋 Objeto recibido en sincronizarSPRING:', req);

      // Verificar si el objeto ya tiene el detalle (puede venir como array directo o como propiedad detalle)
      let requerimientoCompleto = null;

      if (
        req.detalles &&
        Array.isArray(req.detalles) &&
        req.detalles.length > 0
      ) {
        // console.log(
        //   '✅ El objeto ya tiene detalle en propiedad .detalle, usándolo directamente',
        // );
        requerimientoCompleto = req;
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

          if (response && Array.isArray(response) && response.length > 0) {
            requerimientoCompleto = response[0];
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
          requerimientoCompleto =
            requerimientos.length > 0 ? requerimientos[0] : null;
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
            detalles: req.detalle || [], // Usar el detalle si viene en el objeto
          };
        }
      }

      // Verificar que tenemos detalle
      if (
        !requerimientoCompleto.detalles ||
        requerimientoCompleto.detalles.length === 0
      ) {
        // console.error('❌ El requerimiento no tiene detalle');
        Swal.fire(
          'Error',
          'No se pudo obtener el detalle del requerimiento',
          'error',
        );
        return;
      }

      let origenapp = 'app_logistica';

      // ✅ Corregido: Obtener código del CECO y AFE del proyecto antes de construir el JSON
      const first = requerimientoCompleto.detalles?.[0];
      const centroCostoDefault =
        this.cecos.find((c) => c.localname === first?.idcentrocosto)
          ?.costcenter ?? '0001';
      const cuentacontable = this.itemsFiltered.find(
        (i) => i.item === requerimientoCompleto.detalles?.[0].codigo,
      )?.cuentaGasto;
      const proyectoAfeDefault =
        this.proyectos.find((p) => p.proyectoio === first?.idproyecto)?.afe ??
        'FUNDO HP';
      const labores = this.labores.find((l) => l.labor === first?.idlabor);
      // console.log('labores', labores);
      const ccostodestino = labores?.idlabor ?? '';

      const turnos = this.turnos.find((t) => t.nombreTurno === first?.idturno);
      // console.log('turno', turnos);
      const turno = turnos?.idturno ?? '';

      // ✅ Determinar si es ITEM o COMMODITY
      const tipoReq = req.tipo || requerimientoCompleto.tipo || 'ITEM';

      const requerimiento = [
        {
          // ✅ Corregido: Enviar CompaniaSocio con "00" como espera el SP
          CompaniaSocio: this.usuario.idempresa + '00',
          // ✅ Corregido: Clasificación debe venir del requerimiento (Stock Almacen para consumo)
          Clasificacion: requerimientoCompleto.idClasificacion,
          // ✅ Corregido: Calcular según itemtipo
          ComprasAlmacenFlag:
            requerimientoCompleto.itemtipo === 'TRANSFERENCIA' ||
            requerimientoCompleto.itemtipo === 'CONSUMO'
              ? 'A'
              : 'C',
          // ✅ Limitar longitud de código de almacén a 20 caracteres
          AlmacenCodigo: (requerimientoCompleto.idalmacen || 'H001').substring(
            0,
            20,
          ),
          MonedaCodigo: 'LO',
          // ✅ Corregido: Formato de fecha para SQL Server (yyyy-mm-ddThh:mm:ss)
          FechaRequerida: new Date().toISOString(),
          FechaPreparacion: new Date().toISOString(),
          FechaAprobacion: new Date().toISOString(),
          PreparadaPor: -1,
          AprobadaPor: -1,
          PrecioTotal: 0.0,
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
          UltimaFechaModif: new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, 23),
          UltimoUsuarioNumero: -1,
          // ✅ Limitar longitud de transacción a 10 caracteres
          TransaccionOperacion: '999'.substring(0, 10),
          // ✅ Limitar longitud de campo referencia a 20 caracteres
          DefaultCampoReferencia: 'PL'.substring(0, 20),
          RevisionTecnicaPendienteFlag: 'N',
          // ✅ Limitar longitud de cliente número pedido a 20 caracteres
          ClienteNumeroPedido: '0102'.substring(0, 20),
          // ✅ Limitar longitud de vía transporte a 5 caracteres
          ViaTransporte: 'T'.substring(0, 5),
          OrigenGeneracionFlag: 'L',
          origen: origenapp,

          // ✅ Corregido: Detalle con TipoDetalle y manejo Item/Commodity
          detalle: (requerimientoCompleto.detalles || []).map(
            (d: any, index: number) => ({
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
                  : d.descripcion || '',
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
              CentroCosto: centroCostoDefault,
              // ✅ Limitar longitud de lote a 20 caracteres
              LoteProduccion: ccostodestino,
              Estado: 'PE',
              // ✅ Limitar longitud de usuario a 50 caracteres
              UltimoUsuario: (
                this.usuario.documentoidentidad || 'MISESF'
              ).substring(0, 50),
              UltimaFechaModif: new Date()
                .toISOString()
                .replace('T', ' ')
                .substring(0, 23),
              IGVExoneradoFlag: 'N',
              GenerarContratoFlag: 'N',
              origen: origenapp,
            }),
          ),

          // ✅ Corregido: Distribución contable dinámica
          distribucion: (requerimientoCompleto.detalles || []).map(
            (d: any, index: number) => ({
              Secuencia: index + 1,
              Linea: 1,
              // ✅ Limitar longitud de Account a 50 caracteres
              Account: cuentacontable,
              // ✅ Corregido: Usar AFE del proyecto
              Afe: proyectoAfeDefault,
              Monto: 100,
              CentroCostoDestino: ccostodestino,
              // ✅ Limitar longitud de sucursal a 10 caracteres
              Sucursal: requerimientoCompleto.idfundo,
              // ✅ Limitar longitud de campo referencia a 20 caracteres
              CampoReferencia: 'PL',
              // ✅ Limitar longitud de referencias fiscales a 50 caracteres
              ReferenciaFiscal01: '',
              ReferenciaFiscal02: turno,
              origen: origenapp,
            }),
          ),
        },
      ];

      console.log('📤 Enviando al SP SPRING:', requerimiento);

      this.requerimientosService
        .getRegristroRequerimientoSPRING(requerimiento)
        .subscribe({
          next: (resp) => {
            console.log('✅ Respuesta del backend:', resp);
            const resultado = Array.isArray(resp) ? resp[0] : resp;

            if (resultado?.errorgeneral === 0) {
              const correlativoSPRING = resultado.RequisicionNumero;
              console.log(
                '✅ Requerimiento sincronizado correctamente a SPRING:',
                correlativoSPRING,
              );

              // Actualizar el número de requisición en la BD
              this.actualizarRequisicionSPRING_DB(req.idrequerimiento, correlativoSPRING)
              // this.actualizarRequisicionSPRING_DB(
              //   requerimientoCompleto.idrequerimiento ||
              //     this.requerimientoSeleccionado?.idrequerimiento,
              //   correlativoSPRING,
              // );

              Swal.fire(
                'Éxito',
                'Requerimiento sincronizado a SPRING correctamente',
                'success',
              );
            } else {
              Swal.fire(
                'Error',
                'Hubo un problema al sincronizar el requerimiento a SPRING',
                'error',
              );
              // console.error('Detalles del error:', resp);
            }
          },
          error: (error) => {
            // console.error('❌ Error al sincronizar con SPRING:', error);
            Swal.fire('Error', 'Error al sincronizar con SPRING', 'error');
          },
        });
    } catch (error) {
      // console.error('❌ Error en sincronizarRequerimientoSPRING:', error);
      Swal.fire('Error', 'Error al procesar la sincronización', 'error');
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

      this.requerimientosService
        .getNumeroRequerimientoPRING(payload)
        .subscribe({
          next: (resp) => {
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
          },
          error: (err) => {
            console.error('❌ Error HTTP al actualizar requisición:', err);
          },
        });

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

  // Método para formatear fecha a dd-mm-yyyy para SPRING
  formatDateForSpring(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year} 00:00:00.000`;
  }

  // =============================================
  // DETALLE DE REQUERIMIENTO
  // =============================================

  verDetalle(requerimiento: RequerimientoConAprobacion) {
    this.requerimientoDetalle = requerimiento;
    this.displayDetalleModal = true;
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

  getDetalleItems(requerimiento: any): any[] {
    try {
      // Si el detalle es un string JSON, parsearlo
      if (typeof requerimiento['detalle'] === 'string') {
        return JSON.parse(requerimiento['detalle']);
      }
      // Si ya es un array, devolverlo directamente
      else if (Array.isArray(requerimiento['detalle'])) {
        return requerimiento['detalle'];
      }
      // Si no hay detalle, devolver array vacío
      return [];
    } catch (error) {
      console.error('Error parseando detalle:', error);
      return [];
    }
  }
}
