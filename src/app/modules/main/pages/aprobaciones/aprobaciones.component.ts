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
  modalDetalleVisible = false;
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
    console.time('⏱️ ngOnInit total');
    
    // 1️⃣ Cargar usuario primero (crítico)
    await this.getUsuario();
    
    // 2️⃣ Cargar datos existentes en Dexie INMEDIATAMENTE (sin esperar backend)
    await this.cargar();
    
    // 3️⃣ Ejecutar tareas en segundo plano (no bloquean la UI)
    Promise.all([
      this.limpiarDetallesDuplicados(),
      this.sincronizarTablasMaestras(),
      this.sincronizarRequerimientos() // Esto recargará la tabla cuando termine
    ]).then(() => {
      console.timeEnd('⏱️ ngOnInit total');
      console.log('✅ Todas las tareas de inicialización completadas');
    }).catch(error => {
      console.error('❌ Error en tareas de inicialización:', error);
    });
  }

  /**
   * Limpia los detalles duplicados en Dexie
   * Agrupa por idrequerimiento y mantiene solo los registros únicos
   */
  async limpiarDetallesDuplicados() {
    try {
      console.time('🧹 Limpieza de duplicados');
      const todosLosDetalles = await this.dexieService.detalles.toArray();
      
      if (todosLosDetalles.length === 0) {
        console.log('ℹ️ No hay detalles para limpiar');
        return;
      }
      
      // Agrupar por idrequerimiento y eliminar duplicados en memoria
      const detallesUnicos = new Map<string, any>();
      
      todosLosDetalles.forEach(detalle => {
        const key = `${detalle.idrequerimiento}-${detalle.codigo}-${detalle.descripcion}`;
        if (!detallesUnicos.has(key)) {
          detallesUnicos.set(key, detalle);
        }
      });
      
      const duplicadosCount = todosLosDetalles.length - detallesUnicos.size;
      
      if (duplicadosCount > 0) {
        console.log(`🧹 Encontrados ${duplicadosCount} duplicados. Limpiando...`);
        
        // Operación en bloque: limpiar y reinsertar
        await this.dexieService.detalles.clear();
        await this.dexieService.detalles.bulkAdd(Array.from(detallesUnicos.values()));
        
        console.log(`✅ ${duplicadosCount} duplicados eliminados`);
      } else {
        console.log('✅ No se encontraron duplicados');
      }
      
      console.timeEnd('🧹 Limpieza de duplicados');
    } catch (error) {
      console.error('❌ Error al limpiar duplicados:', error);
    }
  }

  async sincronizarTablasMaestras() {
    try {
      console.log('🔄 Sincronizando tablas maestras en segundo plano...');

      const fundos = this.maestrasService.getFundos([
        { idempresa: this.usuario.idempresa },
      ]);
      fundos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveFundos(resp);
          await this.ListarFundos();
          console.log('✅ Fundos sincronizados');
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

      const labores = await this.maestrasService.getLabores([{ aplicacion: 'LOGISTICA', esadmin: 0 }]);
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
    console.log('🔍 Cargando labores desde Dexie...');
    this.labores = await this.dexieService.showLabores();
    console.log('✅ Labores cargadas:', this.labores.length, 'registros');
    if (this.labores.length > 0) {
      console.log('📋 Primera labor:', this.labores[0]);
    }
  }

  async ListarCecos() {
    console.log('🔍 Cargando CECOs desde Dexie...');
    this.cecos = await this.dexieService.showCecos();
    console.log('✅ CECOs cargados:', this.cecos.length, 'registros');
    if (this.cecos.length > 0) {
      console.log('📋 Primer CECO:', this.cecos[0]);
    }
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
    console.time('⏱️ Cargar requerimientos');
    this.requerimientos = await this.dexieService.showRequerimiento();
    
    // Filtrar en una sola pasada para mejor rendimiento
    const pendientes = this.requerimientos.filter(x => x.estados === 'PENDIENTE');
    
    this.requerimientosItems = pendientes
      .filter(x => x.tipo === 'ITEM')
      .map(req => ({ ...req, checked: false }));
    
    this.requerimientosCommodity = pendientes
      .filter(x => x.tipo === 'COMMODITY')
      .map(req => ({ ...req, checked: false }));
    
    this.requerimientosActivoFijo = pendientes
      .filter(x => x.tipo === 'ACTIVOFIJO')
      .map(req => ({ ...req, checked: false }));
    
    this.requerimientosActivoFijoMenor = pendientes
      .filter(x => x.tipo === 'ACTIVOFIJOMENOR')
      .map(req => ({ ...req, checked: false }));
    
    this.ordenarRequerimientos();
    
    console.log(`✅ Cargados: ${this.requerimientosItems.length} Items, ${this.requerimientosCommodity.length} Servicios, ${this.requerimientosActivoFijo.length} Act.Fijos, ${this.requerimientosActivoFijoMenor.length} Act.Menores`);
    console.timeEnd('⏱️ Cargar requerimientos');
  }

  async cargarRequerimientos() {
    const data = await this.dexieService.showRequerimiento();

    this.requerimientosItems = data.filter(
      (x: { tipo: string; estados: string; }) => x.tipo === 'ITEM' && x.estados === 'PENDIENTE'
    ).map(req => ({ ...req, checked: false })); // Inicializar checked en false
    this.requerimientosCommodity = data.filter(
      (x: { tipo: string; estados: string; }) => x.tipo === 'COMMODITY' && x.estados === 'PENDIENTE'
    ).map(req => ({ ...req, checked: false })); // Inicializar checked en false
    this.requerimientosActivoFijo = data.filter(
      (x: { tipo: string; estados: string; }) => x.tipo === 'ACTIVOFIJO' && x.estados === 'PENDIENTE'
    ).map(req => ({ ...req, checked: false })); // Inicializar checked en false
    this.requerimientosActivoFijoMenor = data.filter(
      (x: { tipo: string; estados: string; }) => x.tipo === 'ACTIVOFIJOMENOR' && x.estados === 'PENDIENTE'
    ).map(req => ({ ...req, checked: false })); // Inicializar checked en false
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
    this.requerimientosCommodity.sort((a, b) => {
      // 1️⃣ Fecha más reciente primero
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
    this.requerimientosActivoFijo.sort((a, b) => {
      // 1️⃣ Fecha más reciente primero
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
    this.requerimientosActivoFijoMenor.sort((a, b) => {
      // 1️⃣ Fecha más reciente primero
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  async sincronizarRequerimientos() {
    try {
      console.time('⏱️ Sincronizar requerimientos');
      console.log(`🌐 Sincronizando requerimientos (RUC: ${this.usuario.ruc}, Rol: ${this.obtenerRol()})...`);
      
      const requerimmientos = this.requerimientosService.getRequerimientos([
        { ruc: this.usuario.ruc, idrol: this.obtenerRol() },
      ]);
      
      requerimmientos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          console.log(`� Recibidos ${resp.length} requerimientos del backend`);
          
          // Guardar requerimientos
          await this.dexieService.saveRequerimientos(resp);
          
          // Procesar detalles en lote
          const detallesParaAgregar: any[] = [];
          const requerimientosConDetalle = resp.filter((req: any) => req.detalle && req.detalle.length);
          
          for (const req of requerimientosConDetalle) {
            // Eliminar detalles existentes
            await this.dexieService.detalles
              .where('idrequerimiento')
              .equals(req.idrequerimiento)
              .delete();
            
            // Preparar detalles para inserción en lote
            req.detalle.forEach((det: any) => {
              detallesParaAgregar.push({
                ...det,
                idrequerimiento: req.idrequerimiento,
              });
            });
          }
          
          // Insertar todos los detalles en una sola operación
          if (detallesParaAgregar.length > 0) {
            await this.dexieService.detalles.bulkAdd(detallesParaAgregar);
            console.log(`💾 ${detallesParaAgregar.length} detalles guardados`);
          }

          console.log('✅ Sincronización completada');
          console.timeEnd('⏱️ Sincronizar requerimientos');

          // Recargar la vista
          await this.cargar();
        } else {
          console.warn('⚠️ No se recibieron requerimientos del backend');
        }
      }, (error) => {
        console.error('❌ Error al sincronizar:', error);
        this.alertService.showAlert(
          'Error!',
          'Error al sincronizar requerimientos: ' + (error?.message || 'Error desconocido'),
          'error'
        );
      });
    } catch (error: any) {
      console.error('❌ Error en sincronizarRequerimientos:', error);
      this.alertService.showAlert(
        'Error!',
        '<p>Ocurrio un error al sincronizar</p>',
        'error'
      );
    }
  }

  /** ✅ Sincronizar requerimiento aprobado a SPRING */
  async sincronizaRequerimientoSPRING(req: any, skipConfirmation: boolean = false) {
    // debugger;
    
    // ✅ CORRECCIÓN CRÍTICA: Cargar datos maestros si no están disponibles
    if (!this.cecos || this.cecos.length === 0) {
      console.log('⚠️ CECOs no cargados, cargando desde Dexie...');
      await this.ListarCecos();
      
      // Si aún están vacíos, sincronizar desde el backend
      if (!this.cecos || this.cecos.length === 0) {
        console.log('⚠️ CECOs vacíos en Dexie, sincronizando desde backend...');
        try {
          const cecos = this.maestrasService.getCecos([{ aplicacion: 'LOGISTICA', esadmin: 0 }]);
          const resp: any = await cecos.toPromise();
          if (!!resp && resp.length) {
            console.log('📥 Recibidos', resp.length, 'CECOs del backend');
            await this.dexieService.saveCecos(resp);
            await this.ListarCecos();
            console.log('✅ CECOs sincronizados y cargados:', this.cecos.length);
          } else {
            console.warn('⚠️ Backend no retornó CECOs');
          }
        } catch (error) {
          console.error('❌ Error al sincronizar CECOs:', error);
        }
      }
    }
    
    if (!this.labores || this.labores.length === 0) {
      console.log('⚠️ Labores no cargadas, cargando desde Dexie...');
      await this.ListarLabores();
      
      // Si aún están vacías, sincronizar desde el backend
      if (!this.labores || this.labores.length === 0) {
        console.log('⚠️ Labores vacías en Dexie, sincronizando desde backend...');
        try {
          const labores = await this.maestrasService.getLabores([{ aplicacion: 'LOGISTICA', esadmin: 0 }]);
          if (!!labores && labores.length) {
            console.log('📥 Recibidas', labores.length, 'Labores del backend');
            await this.dexieService.saveLabores(labores);
            await this.ListarLabores();
            console.log('✅ Labores sincronizadas y cargadas:', this.labores.length);
          } else {
            console.warn('⚠️ Backend no retornó Labores');
          }
        } catch (error) {
          console.error('❌ Error al sincronizar Labores:', error);
        }
      }
    }
    
    if (!this.proyectos || this.proyectos.length === 0) {
      console.log('⚠️ Proyectos no cargados, cargando ahora...');
      await this.ListarProyectos();
    }
    if (!this.itemsFiltered || this.itemsFiltered.length === 0) {
      console.log('⚠️ Items no cargados, cargando ahora...');
      await this.ListarItems();
    }
    
    console.log('✅ Datos maestros verificados:', {
      cecos: this.cecos.length,
      labores: this.labores.length,
      proyectos: this.proyectos.length,
      items: this.itemsFiltered.length
    });
    
    // Solo mostrar confirmación si no se está procesando en lote
    if (!skipConfirmation) {
      const confirmacion = await this.alertService.showConfirm(
        'Confirmación',
        '¿Desea enviar los datos?',
        'warning'
      );

      if (!confirmacion) return;
    }

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

    console.log('🔍 DEBUG - Datos del primer detalle:', first);
    console.log('🔍 DEBUG - CECO del detalle:', first.ceco);
    console.log('🔍 DEBUG - Labor del detalle:', first.labor);
    console.log('🔍 DEBUG - Proyecto del detalle:', first.proyecto);
    console.log('🔍 DEBUG - Array de CECOs disponibles:', this.cecos);
    console.log('🔍 DEBUG - Array de Labores disponibles:', this.labores);
    console.log('🔍 DEBUG - Primera labor del array:', this.labores[0]);

    centroCostoDefault = this.cecos.find(c => c.localname === first.ceco)?.costcenter ?? '0001';
    console.log('🔍 DEBUG - Centro de Costo Default:', centroCostoDefault);

    accountDefault = this.cecos.find(c => c.localname === first.ceco)?.ccontable ?? '10411103';
    console.log('🔍 DEBUG - Account Default:', accountDefault);

    proyectoAfeDefault = this.proyectos.find(p => p.proyectoio === first.proyecto)?.afe ?? 'FUNDO HP';
    console.log('🔍 DEBUG - Proyecto AFE Default:', proyectoAfeDefault);

    let um = this.itemsFiltered.find(i => i.item === first.codigo)?.unidadCodigo;

    // let cuentacontable =  this.itemsFiltered.find(i => i.item === first.codigo)?.cuentaGasto;

    let cuentacontable = '';

    let actividad = this.labores.find(l => l.labor === first.labor)?.idlabor;
    console.log('🔍 DEBUG - Actividad (idlabor):', actividad);

    let ccostodestino = '';

    // Obtener el costcenter del CECO para la distribución
    const cecoParaDistribucion = this.cecos.find(c => c.localname === first.ceco);
    console.log('🔍 DEBUG - CECO para distribución:', cecoParaDistribucion);
    console.log('🔍 DEBUG - costcenter del CECO:', cecoParaDistribucion?.costcenter);

    // ✅ CORRECCIÓN: Convertir almacén corto (001) a código completo (H001)
    let almacenCodigo = req.idalmacen || 'H001';
    console.log('🔍 DEBUG - Almacén del requerimiento:', almacenCodigo);
    
    if (almacenCodigo && almacenCodigo.length <= 3 && !isNaN(Number(almacenCodigo))) {
      const almacenes = await this.dexieService.showAlmacenes();
      const almacenCompleto = almacenes.find((a: any) => a.almacen === almacenCodigo);
      if (almacenCompleto) {
        almacenCodigo = almacenCompleto.idalmacen;
        console.log('🔍 DEBUG - Almacén corregido de', req.idalmacen, 'a', almacenCodigo);
      } else {
        almacenCodigo = 'H' + almacenCodigo.padStart(3, '0');
        console.log('🔍 DEBUG - Almacén convertido a formato estándar:', almacenCodigo);
      }
    }

    try {
      // 🟦 FORMAMOS el JSON EXACTO para el SP
      const requerimiento = [
        {
          CompaniaSocio: this.usuario.idempresa + '00',
          // RequisicionNumero: this.correlativoRequerimiento,
          RequisicionNumero: '',// AHORA LO GENERA EL SP
          Clasificacion: req.idclasificacion,
          ComprasAlmacenFlag: comprasAlmacenFlag,
          AlmacenCodigo: almacenCodigo,
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
          ClienteNumeroPedido: actividad || '',
          ViaTransporte: 'T',
          OrigenGeneracionFlag: 'L',
          origen: origenapp,

          // 🟩 DETALLE CORREGIDO
          detalle: req.detalle.map((d: any, index: number) => {
            const ceco = this.cecos.find((c) => c.localname === d.ceco);
            console.log(ceco);
            const item = this.itemsFiltered.find(i => i.item === d.codigo);
            const itemCuentaContable = this.itemsFiltered.find(i => i.item === d.codigo)?.cuentaGasto;
            const labores = this.labores.find(l => l.labor === d.labor);
            console.log('labores', labores);
            // ✅ CORRECCIÓN: Para COMPRA, usar costcenter del CECO si no hay labor
            const itemCcostodestino = labores?.idlabor ?? (ceco?.costcenter || '');
            console.log(itemCuentaContable);
            
            // Actualizar variables globales para la distribución (solo del primer item)
            if (index === 0) {
              cuentacontable = itemCuentaContable;
              ccostodestino = itemCcostodestino;
            }

            return {
              Secuencia: index + 1,
              TipoDetalle: d.tipoDetalle, // ITEM | COMMODITY | ACTIVOFIJO | ACTIVOFIJOMENOR
              // ✅ CORRECCIÓN: Usar idclasificacion para determinar si es Item o Commodity
              Item: (req.idclasificacion !== 'SER' && req.idclasificacion !== 'COM') ? d.codigo : null,
              Commodity: (req.idclasificacion === 'SER' || req.idclasificacion === 'COM') ? d.codigo : null,
              Condicion: '0',
              // UnidadCodigo: um,
              UnidadCodigo: item?.unidadCodigo ?? um, // ✅ CORRECTO
              // ✅ CORRECCIÓN: Usar idclasificacion para determinar descripción
              Descripcion: (req.idclasificacion !== 'SER' && req.idclasificacion !== 'COM') ? d.producto : d.descripcion,
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
              // ✅ CORRECCIÓN: Usar costcenter del CECO, no el id
              CentroCosto: ceco?.costcenter ?? '',
              // ✅ CORRECCIÓN: Usar labor específica del item o costcenter como fallback
              LoteProduccion: itemCcostodestino,
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
              // Account: accountDefault,
              Account: cuentacontable,
              Afe: proyectoAfeDefault,
              Monto: '100.00',
              // ✅ CORRECCIÓN: CentroCostoDestino debe ser el costcenter del CECO, o usar ccostodestino como fallback
              CentroCostoDestino: this.cecos.find(c => c.localname === first.ceco)?.costcenter ?? ccostodestino ?? centroCostoDefault,
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
      console.log('� DETALLE - Verificando CentroCosto y LoteProduccion por item:');
      requerimiento[0].detalle.forEach((det: any, idx: number) => {
        console.log(`  Item ${idx + 1}: CentroCosto="${det.CentroCosto}", LoteProduccion="${det.LoteProduccion}"`);
      });
      console.log('� DISTRIBUCIÓN - Verificando valores:');
      console.log(`  CentroCostoDestino="${requerimiento[0].distribucion[0].CentroCostoDestino}"`);
      console.log(`  Account="${requerimiento[0].distribucion[0].Account}"`);
      console.log(`  Afe="${requerimiento[0].distribucion[0].Afe}"`);

      // 🟩 ENVIAMOS AL SERVICIO
      this.requerimientosService
        .getRegristroRequerimientoSPRING(requerimiento)
        .subscribe({
          next: (resp) => {
            console.log('✅ Respuesta del backend:', resp);

            const resultado = Array.isArray(resp) ? resp[0] : resp;
            // Manejo del resultado del SP
            // if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
            if (resultado?.errorgeneral === 0) {
              const correlativoSPRING = resultado.RequisicionNumero;
              console.log('✅ Requerimiento sincronizado correctamente a SPRING', resp[0]);
              this.actualizarRequisicionSPRING_DB(req.idrequerimiento, correlativoSPRING);

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

  actualizarRequisicionSPRING_DB(idrequerimiento: string, requisicion: string) {
    const payload = [
      {
        idrequerimiento,
        RequisicionNumero: requisicion
      }
    ];

     this.requerimientosService.getNumeroRequerimientoPRING(payload)
        .subscribe({
          next: (resp) => {
            console.log('✅ Respuesta del backend:', resp);
            const resultado = Array.isArray(resp) ? resp[0] : resp;
            // La respuesta tiene 'error' no 'errorgeneral'
            if (resultado?.error === 0) {
              console.log('✅ Requisición actualizada correctamente en DB:', resultado);
            } else {
              console.error('❌ Error al actualizar requisición:', resp);
            }
          },
          error: (err) => {
            console.error('❌ Error HTTP al actualizar requisición:', err);
          },
        });
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

    // Abrir el modal personalizado
    this.modalDetalleVisible = true;
  }

  /** Cerrar modal de detalle */
  cerrarModalDetalle() {
    this.modalDetalleVisible = false;
    this.requerimientoSeleccionado = null;
    this.detalleRequerimiento = [];
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
    // ✅ Actualizar las listas de seleccionados según los checkboxes marcados
    this.simpleSelected(tipo);

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
      title: `¿Aprobar ${seleccionados.length} requerimiento(s)?`,
      text: 'Los requerimientos aprobados se enviarán a SPRING',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar y enviar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
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
            // 🔥 Mostrar progreso
            this.alertService.mostrarModalCarga();
            
            let enviados = 0;
            for (const req of seleccionados) {
              req.estados = 'APROBADO';
              req.estado = 1;
              req.usuarioAprueba = this.usuario.usuario;
              req.fechaAprobacion = new Date().toISOString();
              await this.dexieService.saveRequerimiento(req);
              
              // 🔥 Enviar a SPRING sin confirmación adicional
              await this.sincronizaRequerimientoSPRING(req, true);
              enviados++;
              console.log(`✅ Enviado ${enviados}/${seleccionados.length} a SPRING`);
            }

            this.alertService.cerrarModalCarga();
            await this.cargarRequerimientos();
            this.alertService.showAlert(
              '✅ Aprobado',
              `${seleccionados.length} requerimiento(s) aprobado(s) y enviado(s) a SPRING`,
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
