import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { ItemService } from '@/app/modules/main/services/items.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { async } from 'rxjs';

declare var bootstrap: any; // Para usar Bootstrap modal
@Component({
  selector: 'app-aprobaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './aprobaciones.component.html',
  styleUrl: './aprobaciones.component.scss',
})
export class AprobacionesComponent {
  currentTab: 'ITEM' | 'COMMODITY' | 'ACTIVOFIJO' | 'ACTIVOFIJOMENOR' = 'ITEM';
  incidenciasPersona: any = [];
  dataSelected: any = [];
  // Selección individual por tab
  dataSelectedItems: any[] = [];
  dataSelectedCommodity: any[] = [];
  dataSelectedActivo: any[] = [];
  dataSelectedActivoMenor: any[] = [];
  loading = false;
  allChecked: boolean = false;
  isAllApproved: boolean = true;
  requerimientos: any[] = [];

  allCheckedItems = false;
  allCheckedCommodity = false;
  allCheckedActivo = false;
  allCheckedActivoMenor = false;
  requerimientosItems: any[] = [];
  requerimientosCommodity: any[] = [];
  requerimientosActivoFijo: any[] = [];
  requerimientosActivoFijoMenor: any[] = [];

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
  servicios: any[] = [];
  servicioAF: any[] = [];

  correlativoRequerimiento: any = '';

  // Para el modal de visualización
  requerimientoSeleccionado: any = null;
  detalleRequerimiento: any[] = [];

  usuarioAprueba = 'APROBADOR_99';
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

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private requerimientosService: RequerimientosService,
    private maestrasService: MaestrasService,
    private ItemService: ItemService,
  ) { }

  async ngOnInit() {
    await this.getUsuario();
    await this.sincronizarTablasMaestras();
    await this.sincronizarRequerimientos();
    await this.cargar();
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
            'success'
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

      this.itemsFiltered = await firstValueFrom(
        this.ItemService.getItem([{}])
      );


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

      const tipoGastos = this.maestrasService.getTipoGastos([{}]);
      tipoGastos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveTipoGastos(resp);
          await this.ListarTipoGastos();
        }
      });
    } catch (error: any) {
      console.error(error);
      this.alertService.showAlert(
        'Error!',
        '<p>Ocurrio un error</p><p>',
        'error'
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

  async ListarServicios() {
    this.servicios = await this.dexieService.showMaestroCommodity();
    // this.commodityFiltrados = this.servicios.filter(
    //   (serv) => serv.clasificacion === 'SER'
    // );
  }

  async ListarServiciosAF() {
    this.servicioAF = await this.dexieService.showMaestroCommodity();
    // this.commodityFiltradosAF = this.servicioAF.filter(
    //   (servaf) => servaf.clasificacion === 'ACT'
    // );
  }

  get listaActual() {
    if (this.currentTab === 'ITEM') return this.requerimientosItems;
    if (this.currentTab === 'COMMODITY') return this.requerimientosCommodity;
    if (this.currentTab === 'ACTIVOFIJO') return this.requerimientosActivoFijo;
    if (this.currentTab === 'ACTIVOFIJOMENOR')
      return this.requerimientosActivoFijoMenor;
    return [];
  }

  get listaSeleccionada() {
    if (this.currentTab === 'ITEM') return this.dataSelectedItems;
    if (this.currentTab === 'COMMODITY') return this.dataSelectedCommodity;
    if (this.currentTab === 'ACTIVOFIJO') return this.dataSelectedActivo;
    if (this.currentTab === 'ACTIVOFIJOMENOR')
      return this.dataSelectedActivoMenor;
    return [];
  }

  async getUsuario() {
    const usuario = await this.dexieService.showUsuario();
    if (usuario) {
      this.usuario = usuario;
    } else {
      console.log('Error', 'Usuario not found', 'error');
    }
  }

  async cargar() {
    this.requerimientos = await this.dexieService.showRequerimiento();
    this.requerimientosItems = this.requerimientos.filter(
      (x) => x.tipo === 'ITEM' && x.estados === 'PENDIENTE'
    );
    this.ordenarRequerimientos();
    this.requerimientosCommodity = this.requerimientos.filter(
      (x) => x.tipo === 'COMMODITY' && x.estados === 'PENDIENTE'
    );
    this.requerimientosActivoFijo = this.requerimientos.filter(
      (x) => x.tipo === 'ACTIVOFIJO' && x.estados === 'PENDIENTE'
    );
    this.requerimientosActivoFijoMenor = this.requerimientos.filter(
      (x) => x.tipo === 'ACTIVOFIJOMENOR' && x.estados === 'PENDIENTE'
    );
  }

  async cargarRequerimientos() {
    const data = await this.dexieService.showRequerimiento();

    this.requerimientosItems = data.filter(
      (x: { tipo: string; estados: string; }) => x.tipo === 'ITEM' && x.estados === 'PENDIENTE'
    );
    this.requerimientosCommodity = data.filter(
      (x: { tipo: string; estados: string; }) => x.tipo === 'COMMODITY' && x.estados === 'PENDIENTE'
    );
    this.requerimientosActivoFijo = data.filter(
      (x: { tipo: string; estados: string; }) => x.tipo === 'ACTIVOFIJO' && x.estados === 'PENDIENTE'
    );
    this.requerimientosActivoFijoMenor = data.filter(
      (x: { tipo: string; estados: string; }) => x.tipo === 'ACTIVOFIJOMENOR' && x.estados === 'PENDIENTE'
    );
  }

  async cambiarEstado(req: any, estado: 'APROBADO' | 'RECHAZADO') {
    req.estados = estado;
    req.usuarioAprueba = this.usuarioAprueba;
    req.fechaAprobacion = new Date().toISOString();
    await this.dexieService.saveRequerimiento(req);
    this.cargarRequerimientos();
  }

  obtenerRol() {
    if (this.usuario.idrol.includes('ALLOGIST')) return 'ALLOGIST';
    if (this.usuario.idrol.includes('APLOGIST')) return 'APLOGIST';
    return '';
  }

  ordenarRequerimientos() {
    this.requerimientosItems.sort((a, b) => {
      // 1️⃣ Fecha más reciente primero
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  async sincronizarRequerimientos() {
    try {
      const requerimmientos = this.requerimientosService.getRequerimientos([
        { ruc: this.usuario.ruc, idrol: this.obtenerRol() },
      ]);
      requerimmientos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveRequerimientos(resp);
          // Ahora recorre cada requerimiento y guarda su detalle
          for (const req of resp) {
            if (req.detalle && req.detalle.length) {
              for (const det of req.detalle) {
                // Añadimos un campo idrequerimiento para enlazarlo
                await this.dexieService.detalles.add({
                  ...det,
                  idrequerimiento: req.idrequerimiento,
                });
              }
            }
          }

          console.log('✅ Requerimientos y detalles guardados correctamente');

          // 👇👇 AGREGA ESTO PARA REFRESCAR LA VISTA INMEDIATAMENTE
          await this.cargar();
        }
      });
    } catch (error: any) {
      console.error(error);
      this.alertService.showAlert(
        'Error!',
        '<p>Ocurrio un error</p><p>',
        'error'
      );
    }
  }

  /** ✅ Sincronizar requerimiento aprobado a SPRING */
  async sincronizaRequerimientoSPRING(req: any) {
    debugger;
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar los datos?',
      'warning'
    );

    if (!confirmacion) return;

    // const sinDistribucion = req.detalle.some(
    //   (d: { distribucion: string | any[]; }) => !Array.isArray(d.distribucion) || d.distribucion.length === 0
    // );

    // if (sinDistribucion) {
    //   this.alertService.showAlertError(
    //     'Error',
    //     'Existen líneas sin distribución contable'
    //   );
    //   return;
    // }

    // const filtro = {
    //   CompaniaCodigo: this.usuario.idempresa,
    //   TipoComprobante: 'SY',
    //   Serie: 'WHRQ',
    // };

    // const resp: any = await firstValueFrom(
    //   this.requerimientosService.NuevoRequerimientoCorrelativo([filtro])
    // );

    // if (!resp?.length) {
    //   this.alertService.showAlertError(
    //     'Error',
    //     'No se pudo generar el correlativo'
    //   );
    //   return;
    // }

    // this.correlativoRequerimiento = resp[0].codigoGenerado;
    // console.log('🔢 Correlativo generado:', this.correlativoRequerimiento);
    let origenapp = 'app_logistica';
    let comprasAlmacenFlag;
    if (req.itemtipo === 'TRANSFERENCIA' || req.itemtipo === 'CONSUMO') {
      comprasAlmacenFlag = 'A';
    }
    else { comprasAlmacenFlag = 'C'; }
    console.log('comprasAlmacenFlag', comprasAlmacenFlag);

    let centroCostoDefault = '0001';
    let proyectoAfeDefault = 'FUNDO HP';
    let accountDefault = '10411103';

    // req.detalle.forEach((element: any) => {
    //   centroCostoDefault = this.cecos.find((c) => c.localname === element.ceco);
    //   proyectoAfeDefault = this.proyectos.find((p) => p.proyectoio === element.proyecto);
    // });

    const first = req.detalle[0];

    centroCostoDefault = this.cecos.find(c => c.localname === first.ceco)?.costcenter ?? '0001';

    accountDefault = this.cecos.find(c => c.localname === first.ceco)?.ccontable ?? '10411103';

    proyectoAfeDefault = this.proyectos.find(p => p.proyectoio === first.proyecto)?.afe ?? 'FUNDO HP';

    let um = this.itemsFiltered.find(i => i.item === first.codigo)?.unidadCodigo;


    try {
      // 🟦 FORMAMOS el JSON EXACTO para el SP
      const requerimiento = [
        {
          CompaniaSocio: this.usuario.idempresa + '00',
          // RequisicionNumero: this.correlativoRequerimiento,
          RequisicionNumero: '',// AHORA LO GENERA EL SP
          Clasificacion: req.idclasificacion,
          ComprasAlmacenFlag: comprasAlmacenFlag,
          AlmacenCodigo: req.idalmacen,
          MonedaCodigo: 'LO',
          FechaRequerida: new Date(req.fecha).toISOString(),
          FechaPreparacion: new Date().toISOString(),
          FechaAprobacion: new Date(req.fechaAprobacion).toISOString(),
          PreparadaPor: -1,
          AprobadaPor: -1,
          PrecioTotal: 0,
          PrioridadCodigo: String(req.prioridad ?? '1'),
          DefaultPrime: centroCostoDefault, //costcenter
          DefaultAfe: proyectoAfeDefault, //proyecto afe
          CuantiaMonetariaPendienteFlag: 'N',
          UnidadNegocio: '0001', //si es TRUJILLO '0001'; si es OLMOS '0002'
          UnidadReplicacion: 'TRUJ',
          LocalForeignFlag: 'L',
          Comentarios: req.glosa || '',
          Estado: 'AP',
          UltimoUsuario: 'MISESF',
          UltimaFechaModif: new Date().toISOString(),
          UltimoUsuarioNumero: -1,
          TransaccionOperacion: '999',
          DefaultCampoReferencia: req.referenciaGasto ?? '',
          RevisionTecnicaPendienteFlag: 'N',
          ClienteNumeroPedido: '',
          ViaTransporte: 'T',
          OrigenGeneracionFlag: 'L',
          origen: origenapp,

          // 🟩 DETALLE CORREGIDO
          detalle: req.detalle.map((d: any, index: number) => {
            const ceco = this.cecos.find((c) => c.localname === d.ceco);
            console.log(ceco);
            const item = this.itemsFiltered.find(i => i.item === d.codigo);

            return {
              Secuencia: index + 1,
              TipoDetalle: d.tipoDetalle, // ITEM | COMMODITY | ACTIVOFIJO | ACTIVOFIJOMENOR
              Item: req.tipo === 'ITEM' ? d.codigo : null,
              Commodity: req.tipo !== 'ITEM' ? d.codigo : null,
              Condicion: '0',
              // UnidadCodigo: um,
              UnidadCodigo: item?.unidadCodigo ?? um, // ✅ CORRECTO
              Descripcion: req.tipo === 'ITEM' ? d.producto : d.descripcion,
              ComprasAlmacenFlag: comprasAlmacenFlag,
              RedefinidoFlag: 'N',
              CantidadPedida: d.cantidad,
              CantidadOrdenCompra: 0,
              CantidadRecibida: 0,
              PrecioUnitario: 0,
              PrecioxCantidad: 0,
              CotizacionCantidad: 0,
              CotizacionPrecioUnitario: 0,
              CotizacionPrecioUnitarioconIGV: 0,
              CotizacionProveedor: 0,
              ControlPresupuestalFlag: 'S',
              Comentario: d.descripcion ?? '',
              CentroCosto: (ceco?.id ?? '').toString(),
              LoteProduccion: '',
              Estado: 'PE',
              UltimoUsuario: 'MISESF',
              UltimaFechaModif: new Date().toISOString(),
              IGVExoneradoFlag: 'N',
              GenerarContratoFlag: 'N',
              origen: origenapp,
            };
          }),
          distribucion: [
            {
              Secuencia: 1,
              Linea: 1,
              Account: accountDefault,
              Afe: proyectoAfeDefault,
              Monto: '100.00',
              CentroCostoDestino: centroCostoDefault ?? '',
              Sucursal: '0801',
              CampoReferencia: req.referenciaGasto ?? 'GA',
              ReferenciaFiscal01: '',
              ReferenciaFiscal02: '',
              origen: origenapp
            }
          ]
        },
      ];

      console.log('📤 Enviando al SP SPRING:', requerimiento);

      this.requerimientosService
        .getRegristroRequerimientoSPRING(requerimiento)
        .subscribe({
          next: (resp) => {
            console.log('✅ Respuesta del backend:', resp);

            // Manejo del resultado del SP
            if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
              this.alertService.showAlert(
                'Éxito',
                'Requerimiento sincronizado a SPRING correctamente',
                'success'
              );
              this.cargarRequerimientos();
            } else {
              this.alertService.showAlertError(
                'Error',
                'Hubo un problema al sincronizar el requerimiento a SPRING'
              );
              console.error('Detalles del error:', resp);
            }
          },
          error: (err) => {
            console.error('❌ Error HTTP:', err);
            this.alertService.showAlertError(
              'Error',
              'No se pudo conectar con el servidor'
            );
          },
        });
    } catch (error: any) {
      console.error(error);
      this.alertService.showAlert(
        'Error!',
        '<p>Ocurrio un error</p><p>',
        'error'
      );
    }
  }

  /** ✅ Visualizar detalle del requerimiento */
  async visualizarDetalle(req: any, tipo: string) {
    this.requerimientoSeleccionado = req;
    // SIEMPRE inicializamos
    this.requerimientoSeleccionado = {
      ...req,
      tipo: req.tipo || ''
    };

    // Cargar el detalle del requerimiento desde Dexie
    if (req.detalle && req.detalle.length > 0) {
      this.detalleRequerimiento = req.detalle;
    } else {
      // Si no está en memoria, buscar en Dexie
      // this.detalleRequerimiento = await this.dexieService.detalles
      //   .where('idrequerimiento')
      //   .equals(req.idrequerimiento)
      //   .toArray();
      const detalleDexie = await this.dexieService.detalles
        .where('idrequerimiento')
        .equals(req.idrequerimiento)
        .toArray();

      this.detalleRequerimiento = detalleDexie || [];
    }

    // ✔ Mostrar alerta si NO hay detalle
    if (this.detalleRequerimiento.length === 0) {
      this.alertService.mostrarInfo(
        "Este requerimiento no tiene detalles registrados."
      );
    }

    // Abrir el modal
    const modalElement = document.getElementById('modalVisualizarDetalle');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  /** ✅ Seleccionar todos por tab */
  seleccionarTodos(tab: string) {
    if (tab === 'ITEM') {
      this.requerimientosItems.forEach(
        (r) => (r.checked = this.allCheckedItems)
      );
      this.dataSelectedItems = this.requerimientosItems.filter(
        (r) => r.checked
      );
    }

    if (tab === 'COMMODITY') {
      this.requerimientosCommodity.forEach(
        (r) => (r.checked = this.allCheckedCommodity)
      );
      this.dataSelectedCommodity = this.requerimientosCommodity.filter(
        (r) => r.checked
      );
    }

    if (tab === 'ACTIVOFIJO') {
      this.requerimientosActivoFijo.forEach(
        (r) => (r.checked = this.allCheckedActivo)
      );
      this.dataSelectedActivo = this.requerimientosActivoFijo.filter(
        (r) => r.checked
      );
    }

    if (tab === 'ACTIVOFIJOMENOR') {
      this.requerimientosActivoFijoMenor.forEach(
        (r) => (r.checked = this.allCheckedActivoMenor)
      );
      this.dataSelectedActivoMenor = this.requerimientosActivoFijoMenor.filter(
        (r) => r.checked
      );
    }

    this.actualizarSeleccionados();
  }

  /** ✅ Aprobación individual */
  aprobar(req: any, tipo: string) {
    Swal.fire({
      title: '¿Desea aprobar este requerimiento?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      const payload = [
        {
          idRequerimiento: req.idrequerimiento,
          nivel: 1,
          estado: 'APROBADO',
          dniAprobador: this.usuario.documentoidentidad,
          observacion: 'Aprobación individual',
        },
      ];

      this.requerimientosService
        .aprobarRequerimiento(payload)
        .subscribe(async (resp) => {
          if (resp?.[0]?.errorgeneral === 0) {
            req.estados = 'APROBADO';
            req.estado = 1;
            req.usuarioAprueba = this.usuario.usuario;
            req.fechaAprobacion = new Date().toISOString();

            await this.dexieService.saveRequerimiento(req);
            this.quitarDeLista(req.idrequerimiento, tipo);
            this.cargarRequerimientos();
            await this.sincronizaRequerimientoSPRING(req);

            this.alertService.showAlert(
              '✅ Aprobado',
              'Requerimiento aprobado correctamente',
              'success'
            );
          } else {
            this.alertService.showAlert('Error', 'No se pudo aprobar', 'error');
          }
        });
    });
  }

  /** ✅ Rechazo individual */
  rechazar(req: any, tipo: string) {
    Swal.fire({
      title: 'Motivo del rechazo',
      input: 'textarea',
      inputPlaceholder: 'Ingrese el motivo...',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
    }).then((result) => {
      if (!result.isConfirmed || !result.value) {
        this.alertService.showAlert(
          'Atención',
          'Debe ingresar una observación',
          'warning'
        );
        return;
      }

      const payload = [
        {
          idRequerimiento: req.idrequerimiento,
          nivel: 1,
          estado: 'RECHAZADO',
          dniAprobador: this.usuario.documentoidentidad,
          observacion: result.value,
        },
      ];

      this.requerimientosService
        .aprobarRequerimiento(payload)
        .subscribe(async (resp) => {
          if (resp?.[0]?.errorgeneral === 0) {
            req.estados = 'RECHAZADO';
            req.estado = 1;
            req.usuarioAprueba = this.usuario.usuario;
            req.fechaAprobacion = new Date().toISOString();

            await this.dexieService.saveRequerimiento(req);
            this.quitarDeLista(req.idrequerimiento, tipo);
            this.cargarRequerimientos();

            this.alertService.showAlert(
              '❌ Rechazado',
              'Requerimiento rechazado correctamente',
              'warning'
            );
          } else {
            this.alertService.showAlert(
              'Error',
              'No se pudo rechazar',
              'error'
            );
          }
        });
    });
  }

  /** ✅ Aprobación masiva solo del tab seleccionado */
  aprobarMasivo(tipo: string) {
    let seleccionados: any[] = [];

    switch (tipo) {
      case 'ITEM':
        seleccionados = this.dataSelectedItems;
        break;
      case 'COMMODITY':
        seleccionados = this.dataSelectedCommodity;
        break;
      case 'ACTIVOFIJO':
        seleccionados = this.dataSelectedActivo;
        break;
      case 'ACTIVOFIJOMENOR':
        seleccionados = this.dataSelectedActivoMenor;
        break;
    }

    if (!seleccionados.length) return;

    Swal.fire({
      title: '¿Aprobar requerimientos?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      const payload = seleccionados.map((req) => ({
        idRequerimiento: req.idrequerimiento,
        nivel: 1,
        estado: 'APROBADO',
        dniAprobador: this.usuario.documentoidentidad,
        observacion: 'Aprobado desde lista',
      }));

      this.requerimientosService
        .aprobarRequerimiento(payload)
        .subscribe(async (resp) => {
          if (resp[0]?.errorgeneral === 0) {
            for (const req of seleccionados) {
              req.estados = 'APROBADO';
              req.estado = 1;
              req.usuarioAprueba = this.usuario.usuario;
              req.fechaAprobacion = new Date().toISOString();
              await this.dexieService.saveRequerimiento(req);
              await this.sincronizaRequerimientoSPRING(req);
            }

            await this.cargarRequerimientos();
            this.alertService.showAlert(
              '✅ Aprobado',
              'Registros aprobados',
              'success'
            );
          }
        });
    });
  }

  async aprobarSimple(req: any) {
    req.estados = 'APROBADO';
    await this.dexieService.requerimientos.put(req);
    this.alertService.showAlert(
      'Aprobado',
      'Requerimiento aprobado correctamente',
      'success'
    );
    this.requerimientos = this.requerimientos.filter((r) => r.id !== req.id);
  }

  async rechazarSimple(req: any) {
    req.estado = 'RECHAZADO';
    await this.dexieService.requerimientos.put(req);
    this.alertService.showAlert(
      'Rechazado',
      'Requerimiento rechazado correctamente',
      'warning'
    );
    this.requerimientos = this.requerimientos.filter((r) => r.id !== req.id);
  }

  allSelected() {
    this.listaActual.forEach((e) => {
      if (!e.estados) {
        // que no esté aprobado/rechazado
        e.checked = this.allChecked;
      }
    });

    this.dataSelected = this.allChecked
      ? this.listaActual.filter((item) => !item.estados)
      : [];
  }

  quitarDeLista(id: any, tipo: string) {
    if (tipo === 'ITEM') {
      this.requerimientosItems = this.requerimientosItems.filter(
        (r) => r.id !== id
      );
    }
    if (tipo === 'COMMODITY') {
      this.requerimientosCommodity = this.requerimientosCommodity.filter(
        (r) => r.id !== id
      );
    }
    if (tipo === 'ACTIVOFIJO') {
      this.requerimientosActivoFijo = this.requerimientosActivoFijo.filter(
        (r) => r.id !== id
      );
    }
    if (tipo === 'ACTIVOFIJOMENOR') {
      this.requerimientosActivoFijoMenor =
        this.requerimientosActivoFijoMenor.filter((r) => r.id !== id);
    }
  }

  aprobarRequerimientos(tipo: string) {
    // ✅ Forzamos actualización usando tu método seleccionarTodos
    this.seleccionarTodos(tipo);

    let seleccionados: any[] = [];

    switch (tipo) {
      case 'ITEM':
        seleccionados = this.dataSelectedItems;
        break;
      case 'COMMODITY':
        seleccionados = this.dataSelectedCommodity;
        break;
      case 'ACTIVOFIJO':
        seleccionados = this.dataSelectedActivo;
        break;
      case 'ACTIVOFIJOMENOR':
        seleccionados = this.dataSelectedActivoMenor;
        break;
    }

    if (!seleccionados.length) {
      this.alertService.showAlert(
        'Atención',
        'No hay registros seleccionados',
        'warning'
      );
      return;
    }

    Swal.fire({
      title: '¿Aprobar requerimientos?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      const payload = seleccionados.map((req) => ({
        idRequerimiento: req.idrequerimiento,
        nivel: 1,
        estado: 'APROBADO',
        dniAprobador: this.usuario.documentoidentidad,
        observacion: 'Aprobado desde lista',
      }));

      this.requerimientosService
        .aprobarRequerimiento(payload)
        .subscribe(async (resp) => {
          if (resp[0]?.errorgeneral === 0) {
            for (const req of seleccionados) {
              req.estados = 'APROBADO';
              req.estado = 1;
              req.usuarioAprueba = this.usuario.usuario;
              req.fechaAprobacion = new Date().toISOString();
              await this.dexieService.saveRequerimiento(req);
              await this.sincronizaRequerimientoSPRING(req);
            }

            await this.cargarRequerimientos();
            this.alertService.showAlert(
              '✅ Aprobado',
              'Registros aprobados',
              'success'
            );
          }
        });
    });
  }

  tieneSeleccionActual() {
    switch (this.currentTab) {
      case 'ITEM':
        return this.dataSelectedItems.length > 0;
      case 'COMMODITY':
        return this.dataSelectedCommodity.length > 0;
      case 'ACTIVOFIJO':
        return this.dataSelectedActivo.length > 0;
      case 'ACTIVOFIJOMENOR':
        return this.dataSelectedActivoMenor.length > 0;
      default:
        return false;
    }
  }

  async aprobarSeleccionados() {
    for (const req of this.dataSelected) {
      req.estado = 'APROBADO';
      await this.dexieService.saveRequerimiento(req);
    }
    this.cargarRequerimientos();
  }

  clearMemory() {
    this.dataSelected = [];
    this.dataSelectedItems = [];
    this.dataSelectedCommodity = [];
    this.dataSelectedActivo = [];
    this.dataSelectedActivoMenor = [];
    this.allChecked = false;
    this.incidenciasPersona.forEach((e: any) => {
      e.checked = false;
    });
  }

  simpleSelected(tab: string) {
    if (tab === 'ITEM') {
      this.dataSelectedItems = this.requerimientosItems.filter(
        (req) => req.checked
      );
      this.allCheckedItems =
        this.dataSelectedItems.length === this.requerimientosItems.length;
    }

    if (tab === 'COMMODITY') {
      this.dataSelectedCommodity = this.requerimientosCommodity.filter(
        (req) => req.checked
      );
      this.allCheckedCommodity =
        this.dataSelectedCommodity.length ===
        this.requerimientosCommodity.length;
    }

    if (tab === 'ACTIVOFIJO') {
      this.dataSelectedActivo = this.requerimientosActivoFijo.filter(
        (req) => req.checked
      );
      this.allCheckedActivo =
        this.dataSelectedActivo.length === this.requerimientosActivoFijo.length;
    }

    if (tab === 'ACTIVOFIJOMENOR') {
      this.dataSelectedActivoMenor = this.requerimientosActivoFijoMenor.filter(
        (req) => req.checked
      );
      this.allCheckedActivoMenor =
        this.dataSelectedActivoMenor.length ===
        this.requerimientosActivoFijoMenor.length;
    }
  }

  /** ✅ Actualiza dataSelected según checks marcados */
  actualizarSeleccionados() {
    this.dataSelected = [
      ...this.requerimientosItems,
      ...this.requerimientosCommodity,
      ...this.requerimientosActivoFijo,
      ...this.requerimientosActivoFijoMenor,
    ].filter((x: any) => x.checked);

    this.dataSelectedItems = this.dataSelected.filter(
      (x: any) => x.tipo === 'ITEM'
    );
    this.dataSelectedCommodity = this.dataSelected.filter(
      (x: any) => x.tipo === 'COMMODITY'
    );
    this.dataSelectedActivo = this.dataSelected.filter(
      (x: any) => x.tipo === 'ACTIVOFIJO'
    );
    this.dataSelectedActivoMenor = this.dataSelected.filter(
      (x: any) => x.tipo === 'ACTIVOFIJOMENOR'
    );
  }

  obtenerIdReq(idReq: string): string {
    if (!idReq) return '';
    return idReq.slice(-12); // YYMMDDhhmmss
  }
}
