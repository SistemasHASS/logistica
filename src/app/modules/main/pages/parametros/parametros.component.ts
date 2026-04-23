import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import {
  Configuracion,
  Ceco,
  Turno,
  Proyecto,
  Labor,
  Fundo,
  Cultivo,
  Item,
  ActivoFijo,
  Requerimiento,
  DetalleRequerimiento,
  RequerimientoCommodity,
  DetalleRequerimientoCommodity,
  RequerimientoActivoFijo,
  DetalleRequerimientoActivoFijo,
  RequerimientoActivoFijoMenor,
  DetalleRequerimientoActivoFijoMenor,
} from '@/app/shared/interfaces/Tables';
import { MaestrasService } from '../../services/maestras.service';
import { AuthService } from '@/app/modules/auth/services/auth.service';
import { FormsModule } from '@angular/forms';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { RequerimientosService } from '../../services/requerimientos.service';
import { DropdownComponent } from '../../components/dropdown/dropdown.component';
import { CommodityService } from '../../services/commoditys.service';
import { any } from '@tensorflow/tfjs';

@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './parametros.component.html',
  styleUrls: ['./parametros.component.scss'],
})
export class ParametrosComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
    private dexieService: DexieService,
    private maestrasService: MaestrasService,
    private alertService: AlertService, // ✅ inyectar el servicio
    private requerimientosService: RequerimientosService,
    private CommodityService: CommodityService
  ) { }

  fecha = new Date();
  mensajeFundos: String = '';
  nombreProyectoHeader: string = '';
  empresas: any[] = [];
  sedes: any[] = [];
  cultivos: any[] = [];
  proyectos: any[] = [];
  areas: any[] = [];
  fundos: any[] = [];
  almacenes: any[] = [];
  almacenesDestino: any[] = [];
  items: any[] = [];
  turnos: any[] = [];
  labores: any[] = [];
  cecos: any[] = [];
  clasificaciones: any[] = [];
  tipoGastos: any[] = [];
  proveedores: any[] = [];
  servicios: any[] = [];
  activosFijos: any[] = [];
  comodities: any[] = [];

  // 🔥 TIPO ITEM DINÁMICO
  tipoItem: any[] = [];

  // 🔐 ROLES
  esLogist = false;
  esOpLogist = false;
  esEmLogist = false;

  TipoItemSeleccionado = '';

  // 🎯 TABS MANAGEMENT
  activeTab: 'compras' | 'consumo' = 'consumo';

  fundoSeleccionado = '';
  cultivoSeleccionado = '';
  areaSeleccionada = '';
  almacenSeleccionado = '';

  ocultarItem = true;
  ocultarLabor = true;
  ocultarCeco = true;
  ocultarTurno = true;
  ocultarProyecto = true;
  ocultarClasificacion = false;
  showValidation: boolean = false;

  //Filtros
  filteredCecos: Ceco[] = [];
  filteredTurnos: Turno[] = [];
  filteredProyectos: Proyecto[] = [];
  filteredLabores: Labor[] = [];
  filteredFundos: Fundo[] = [];
  filteredCultivos: Cultivo[] = [];
  filteredItems: Item[] = [];

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

  configuracion: Configuracion = {
    id: '',
    idempresa: '',
    idfundo: '',
    idcultivo: '',
    idarea: '',
    idalmacen: '',
    idproyecto: '',
    idacopio: 0,
    idceco: '',
    idlabor: '',
    idturno: '',
    iditem: '',
    idclasificacion: '',
    idgrupolabor: '',
    idproveedor: '',
    idtipoGasto: '',
    idactivoFijo: '',
    idTipoItem: '',
  };

  async ngOnInit() {
    await this.getUsuario();
    await this.cargarRoles(); // 🔥 FALTABA ESTO
    console.log('ROL REAL:', this.usuario?.idrol);
    
    // 🔥 INICIALIZAR TIPO ITEM SIEMPRE (independientemente de si hay configuración guardada)
    this.configurarTipoItemPorRol();
    console.log('🔍 Tipo Item inicializado en ngOnInit:', this.configuracion.idTipoItem);
    console.log('🔍 Array tipoItem:', this.tipoItem);
    
    await this.llenarDropdowns(); // Cargar todos los datos base primero
    await this.validarExisteConfiguracion(); // Luego cargar configuración guardada
    
    // 
    if (this.configuracion) {
      console.log(' Configuración final cargada:', this.configuracion);
      
      // 
      if (this.configuracion.idTipoItem === 'COMPRA') {
        this.activeTab = 'compras';
      } else if (this.configuracion.idTipoItem === 'CONSUMO') {
        this.activeTab = 'consumo';
      } else {
        // Si no hay tipo guardado, establecer CONSUMO por defecto
        this.activeTab = 'consumo';
        this.configuracion.idTipoItem = 'CONSUMO';
      }
      
      console.log(' Tab inicial establecido:', this.activeTab);
    }
    
    // Oculta todos al inicio
    this.ocultarItem = true;
    this.ocultarLabor = true;
    this.ocultarCeco = true;
    this.ocultarTurno = true;
    this.ocultarProyecto = true;
  }

  // 🎯 MÉTODO PARA CAMBIAR ENTRE TABS
  switchTab(tab: 'compras' | 'consumo') {
    this.activeTab = tab;
    
    // Actualizar automáticamente el tipo de requerimiento según el tab
    if (tab === 'compras') {
      this.configuracion.idTipoItem = 'COMPRA';
      console.log('🛒 Cambiado a tab COMPRAS - Tipo: COMPRA');
    } else if (tab === 'consumo') {
      this.configuracion.idTipoItem = 'CONSUMO';
      console.log('📦 Cambiado a tab CONSUMO - Tipo: CONSUMO');
    }
    
    // Ejecutar la lógica de cambio de tipo
    this.onTipoItemChange();
  }

  async getUsuario() {
    const usuario = await this.dexieService.showUsuario();
    console.log('👤 USUARIO EN PARAMETROS:', usuario);
    if (usuario) {
      this.usuario = usuario;
    } else {
      console.log('Error', 'Usuario not found', 'error');
    }
  }

  async cargarUsuario() {
    const user = await this.dexieService.showUsuario();

    console.log('👤 USUARIO CARGADO:', this.usuario);

    if (!this.usuario) {
      console.error('❌ No se pudo cargar el usuario');
    }
  }

  async validarExisteConfiguracion() {
    const configuracion = await this.dexieService.obtenerPrimeraConfiguracion();
    if (configuracion) {
      this.configuracion = configuracion;
      console.log('🔄 Configuración cargada:', this.configuracion);
      console.log('🔍 Tipo Item cargado desde BD:', this.configuracion.idTipoItem);
      
      // 🔥 Asegurar que el tipo item esté configurado según el rol
      await this.cargarRoles();
      this.configurarTipoItemPorRol();
      console.log('🔍 Tipo Item después de configurarPorRol:', this.configuracion.idTipoItem);
      
      // 🔥 Cargar datos dependientes según la configuración guardada
      if (this.configuracion.idcultivo) {
        await this.darTurnoCecosProyectos(false); // Cargar turnos, CECOs y proyectos según cultivo
      }
      
      if (this.configuracion.idturno) {
        await this.darProyectoCecos(false); // Cargar CECOs y proyectos según turno
      }
      
      if (this.configuracion.idceco) {
        await this.darProyectoInversionLabor(false); // Cargar labor según CECO
      }
      
      if (this.configuracion.idlabor) {
        await this.filtrarProyectoPorLabor(true); // Filtrar proyectos según labor, preservando selección
      }
      
      // 🔥 Cargar almacenes según tipo item y rol
      if (this.configuracion.idTipoItem) {
        await this.ListarAlmacenesPorRol();
      }
    }
  }

  async llenarDropdowns() {
    await this.ListarEmpresas();
    await this.ListarFundos();
    await this.ListarCultivos();
    await this.ListarAreas();
    // await this.ListarAlmacenes();
    // await this.ListarAlmacenesPorRol();
    await this.ListarProyectos();
    await this.ListarItems();
    await this.ListarTurnos();
    await this.ListarLabores();
    await this.ListarCecos();
    await this.ListarClasificaciones();
    await this.ListarTipoGastos();
    await this.ListarProveedores();
    await this.ListarServicios();
    await this.ListarActivosFijos();
    await this.filtrarLaboresInicio();
    await this.filtraCecoTurnoProyectoInicio();
  }

  async cargarRoles() {
    const rol = this.usuario.idrol;

    this.esLogist = rol === 'LOLOGIST';
    this.esOpLogist = rol === 'OPLOGIST';
    this.esEmLogist = rol === 'EMLOGIST';

    console.log('ROLES CARGADOS:', {
      esLogist: this.esLogist,
      esOpLogist: this.esOpLogist,
      esEmLogist: this.esEmLogist,
    });
  }



  // ===============================
  // TIPO ITEM POR ROL
  // ===============================
  configurarTipoItemPorRol() {

    console.log('🔧 Configurando Tipo Item - Rol:', this.usuario?.idrol, 'esLogist:', this.esLogist);
    
    // Base: todos pueden COMPRA y CONSUMO
    this.tipoItem = [
      { id: 'COMPRA', descripcion: 'COMPRA' },
      { id: 'CONSUMO', descripcion: 'CONSUMO' },
    ];

    console.log('🔧 Tipo Item base:', this.tipoItem);

    // 🔐 SOLO LOGIST puede TRANSFERENCIA
    if (this.esLogist) {
      this.tipoItem.push({
        id: 'TRANSFERENCIA',
        descripcion: 'TRANSFERENCIA',
      });
      console.log('🔧 Tipo Item con TRANSFERENCIA:', this.tipoItem);
    }

    // Reset por seguridad si cambia el rol
    if (
      this.configuracion.idTipoItem === 'TRANSFERENCIA' &&
      !this.esLogist
    ) {
      this.configuracion.idTipoItem = 'CONSUMO';
      console.log('🔧 Reset a CONSUMO por rol no autorizado');
    }

    // 🔹 Auto-seleccionar si no hay valor o si está vacío
    if (!this.configuracion.idTipoItem || this.configuracion.idTipoItem.trim() === '') {
      // Por defecto seleccionar CONSUMO para todos los roles
      this.configuracion.idTipoItem = 'CONSUMO';
      console.log('🤖 Tipo Item auto-seleccionado (CONSUMO):', this.configuracion.idTipoItem);
    }

    // 🔹 Auto-seleccionar si solo hay una opción
    if (this.tipoItem.length === 1 && !this.configuracion.idTipoItem) {
      this.configuracion.idTipoItem = this.tipoItem[0].id;
      console.log('✅ Auto-seleccionado tipoItem:', this.configuracion.idTipoItem);
    }
    
    console.log('🔧 Resultado final - idTipoItem:', this.configuracion.idTipoItem, 'array:', this.tipoItem);
  }

  // ===============================
  // VALIDACIONES DE SEGURIDAD
  // ===============================
  esTransferenciaNoPermitida(): boolean {
    return (
      this.configuracion.idTipoItem === 'TRANSFERENCIA' &&
      !this.esLogist
    );
  }


  async filtrarLaboresInicio() {
    if (this.configuracion.idceco) {
      const labores = await this.dexieService.showLabores();
      this.filteredLabores = labores.filter(
        (x: Labor) => x.ceco?.trim() === this.configuracion.idceco
      );
    }
  }

  async filtrarLabores() {
    this.filteredLabores.length = 0;
    this.configuracion.idlabor = '';
    if (this.configuracion.idgrupolabor) {
      const labores = await this.dexieService.showLabores();
      const grupoLaborId = this.configuracion.idgrupolabor.trim();
      this.filteredLabores = labores.filter(
        (x: Labor) => x.idlabor?.trim() === grupoLaborId
      );
    }
  }

  async onCultivoChange() {
    console.log('🔄 Cultivo cambiado:', this.configuracion.idcultivo);
    console.log('🔄 Tipo Item actual:', this.configuracion.idTipoItem);
    
    // Buscar el cultivo seleccionado para ver sus propiedades
    const cultivoSeleccionado = this.cultivos.find(c => c.codigo === this.configuracion.idcultivo);
    if (cultivoSeleccionado) {
      console.log('📋 Cultivo seleccionado:', {
        id: cultivoSeleccionado.id,
        codigo: cultivoSeleccionado.codigo,
        descripcion: cultivoSeleccionado.descripcion
      });
    } else {
      console.log('❌ No se encontró el cultivo con código:', this.configuracion.idcultivo);
    }
    
    // Limpiar campos dependientes
    this.configuracion.idturno = '';
    this.configuracion.idceco = '';
    this.configuracion.idlabor = '';
    this.configuracion.idproyecto = '';
    
    // Limpiar filtros
    this.filteredTurnos = [];
    this.filteredCecos = [];
    this.filteredLabores = [];
    this.filteredProyectos = [];
    
    if (this.configuracion.idcultivo) {
      console.log('📊 Total de CECOs disponibles:', this.cecos.length);
      console.log('📊 Cultivos disponibles:', this.cultivos.map(c => ({ id: c.id, codigo: c.codigo })));
      console.log('📊 Total de turnos disponibles:', this.turnos.length);
      
      // Mostrar turnos disponibles para depurar
      if (this.turnos.length > 0) {
        console.log('📋 Ejemplos de turnos disponibles:');
        this.turnos.slice(0, 3).forEach((turno, index) => {
          console.log(`  ${index + 1}. ID: ${turno.id}, idcultivo: "${turno.idcultivo}", codTurno: "${turno.codTurno}", nombreTurno: "${turno.nombreTurno}"`);
        });
      }
      
      // Cargar turnos según cultivo (para CONSUMO y TRANSFERENCIA)
      this.filteredTurnos = this.turnos.filter(
        (x: Turno) => x.idcultivo?.trim() === this.configuracion.idcultivo
      );
      
      console.log(`🔍 Filtrando turnos para cultivo "${this.configuracion.idcultivo}": ${this.filteredTurnos.length} encontrados`);
      
      // Para COMPRA: cargar CECOs según cultivo
      if (this.configuracion.idTipoItem === 'COMPRA') {
        console.log('🎯 Cargando CECOs para COMPRA...');
        await this.cargarCecosPorCultivo();
      } else {
        console.log('🎯 No es COMPRA, no cargar CECOs por cultivo');
      }
    }
    
    console.log('📊 Turnos filtrados:', this.filteredTurnos.length);
    console.log('📊 CECOs filtrados:', this.filteredCecos.length);
  }

  // Método para cargar CECOs según cultivo (para flujo COMPRA)
  async cargarCecosPorCultivo() {
    try {
      if (!this.configuracion.idcultivo) return;
      
      console.log('🔍 Buscando CECOs para cultivo:', this.configuracion.idcultivo);
      console.log('📊 Total CECOs antes de filtrar:', this.cecos.length);
      
      // Mostrar algunos CECOs de ejemplo para depurar
      if (this.cecos.length > 0) {
        console.log('📋 Ejemplos de CECOs disponibles:');
        this.cecos.slice(0, 3).forEach((ceco, index) => {
          console.log(`  ${index + 1}. ID: ${ceco.id}, idcultivo: "${ceco.idcultivo}", localname: "${ceco.localname}"`);
        });
      }
      
      // Filtrar CECOs por cultivo
      this.filteredCecos = this.cecos.filter(
        (ceco: Ceco) => ceco.idcultivo?.trim() === this.configuracion.idcultivo
      );
      
      console.log('🔄 CECOs filtrados por cultivo:', this.filteredCecos.length);
      
      if (this.filteredCecos.length > 0) {
        console.log('✅ CECOs encontrados:');
        this.filteredCecos.slice(0, 3).forEach((ceco, index) => {
          console.log(`  ${index + 1}. ID: ${ceco.id}, localname: "${ceco.localname}"`);
        });
      } else {
        console.log('❌ No se encontraron CECOs para este cultivo');
      }
    } catch (error) {
      console.error('❌ Error al cargar CECOs por cultivo:', error);
    }
  }

  async sincronizarTablasMaestras() {
    try {
      this.alertService.mostrarModalCarga();
      const empresas = await this.maestrasService.getEmpresas([]);
      if (!!empresas && empresas.length) {
        await this.dexieService.saveEmpresas(empresas);
        await this.ListarEmpresas();
      }

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
        { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' },
      ]);
      almacenes.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAlmacenes(resp);
          await this.ListarAlmacenesPorRol(); // 🔹 Auto-seleccionar almacén
        }
      });

      const almacenesDestino = this.requerimientosService.getAlmacenes([
        { ruc: this.usuario?.ruc },
      ]);
      almacenesDestino.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAlmacenesDestino(resp);
          await this.ListarAlmacenesPorRol(); // 🔹 Auto-seleccionar almacén
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

      const clasificaciones = this.maestrasService.getClasificaciones([{}]);
      clasificaciones.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveClasificaciones(resp);
          await this.ListarClasificaciones();
        }
      });

      const turnos = this.maestrasService.getTurnos([
        {
          idempresa: this.usuario?.idempresa,
          aplicacion: 'LOGISTICA',
          // esadmin: 0,
        },
      ]);
      turnos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveTurnos(resp);
          await this.ListarTurnos();
        }
      });

      const labores = await this.maestrasService.getLabores([
        { aplicacion: 'LOGISTICA', esadmin: 0 },
      ]);
      if (!!labores && labores.length) {
        await this.dexieService.saveLabores(labores);
        await this.ListarLabores();
      }

      const cecos = await this.maestrasService.getCecos([
        { aplicacion: 'LOGISTICA', esadmin: 0 },
      ]);
      cecos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveCecos(resp);
          await this.ListarCecos();
        }
      });

      const proveedores = this.maestrasService.getProveedores([{},
      ]);
      proveedores.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveProveedores(resp);
          await this.ListarProveedores();
        }
      });

      const tipoGastos = this.maestrasService.getTipoGastos([{},
      ]);
      tipoGastos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveTipoGastos(resp);
          await this.ListarTipoGastos();
        }
      });

      const servicios = this.maestrasService.getItems([{ ruc: this.usuario?.ruc },
      ]);
      servicios.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveComodities(resp);
          await this.ListarServicios();
        }
      });

      const activosFijos = this.maestrasService.getActivosFijos([{ idempresa: this.usuario?.idempresa },
      ]);
      activosFijos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveActivosFijos(resp);
          await this.ListarActivosFijos();
        }
      });

      const comodities = this.CommodityService.getCommodity([]);
      comodities.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveMaestroCommodities(resp);
        }
      });

      const subcommodities = this.CommodityService.getSubCommodity([]);
      subcommodities.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveMaestroSubCommodities(resp);
        }
      });

      const requerimmientos = this.requerimientosService.getRequerimientos([
        { ruc: this.usuario.ruc, idrol: this.usuario.idrol },
      ]);
      requerimmientos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          // await this.dexieService.saveRequerimientos(resp);
          // Ahora recorre cada requerimiento y guarda su detalle
          await this.separarYGuardarRequerimientosDesdeAPI(resp);
          // for (const req of resp) {
          //   if (req.detalle && req.detalle.length) {
          //     for (const det of req.detalle) {
          //       // Añadimos un campo idrequerimiento para enlazarlo
          //       await this.dexieService.detalles.add({
          //         ...det,
          //         idrequerimiento: req.idrequerimiento,
          //       });
          //     }
          //   }
          // }

          console.log('✅ Requerimientos y detalles guardados correctamente');
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

  async separarYGuardarRequerimientosDesdeAPI(requerimientos: any[]) {

    const reqItems: Requerimiento[] = [];
    const detItems: DetalleRequerimiento[] = [];

    const reqCom: RequerimientoCommodity[] = [];
    const detCom: DetalleRequerimientoCommodity[] = [];

    const reqAF: RequerimientoActivoFijo[] = [];
    const detAF: DetalleRequerimientoActivoFijo[] = [];

    const reqAFM: RequerimientoActivoFijoMenor[] = [];
    const detAFM: DetalleRequerimientoActivoFijoMenor[] = [];

    for (const req of requerimientos) {
      const detalles = req.detalle ?? [];
      // const { detalle, ...cabecera } = req;
      const cabecera = { ...req };
      delete cabecera.detalle; // Eliminamos solo el detalle

      const idReq = req.idrequerimiento; // Garantizamos referencia correcta

      switch (req.tipo) {

        case 'ITEM':
          reqItems.push(cabecera);
          for (const d of detalles) {
            console.log('🔍 Detalle desde backend:', d);
            console.log('🔍 ID del detalle:', d.id);
            detItems.push({
              ...d,
              idOriginal: d.id, // Guardar ID original de LOGISTICA_DReq
              idrequerimiento: req.idrequerimiento
            });
          }
          break;

        case 'COMMODITY':
          reqCom.push(cabecera);
          for (const d of detalles) {
            detCom.push({
              ...d,
              idrequerimiento: req.idrequerimiento
            });
          }
          break;

        case 'ACTIVOFIJO':
          reqAF.push(cabecera);
          for (const d of detalles) {
            detAF.push({
              ...d,
              idrequerimiento: req.idrequerimiento
            });
          }
          break;

        case 'ACTIVOFIJOMENOR':
          reqAFM.push(cabecera);
          for (const d of detalles) {
            detAFM.push({
              ...d,
              idrequerimiento: req.idrequerimiento
            });
          }
          break;

        default:
          console.warn('⚠️ Tipo no reconocido:', req.tipo);
      }
    }

    // ====================================================
    // GUARDADO POR ARREGLOS (bulkPut)
    // ====================================================

    if (reqItems.length) await this.dexieService.saveRequerimientos(reqItems);
    if (detItems.length) await this.dexieService.saveDetallesRequerimientos(detItems);

    if (reqCom.length) await this.dexieService.saveRequerimientosCommodity(reqCom);
    if (detCom.length) await this.dexieService.saveDetallesCommodity(detCom);

    if (reqAF.length) await this.dexieService.saveRequerimientosActivoFijo(reqAF);
    if (detAF.length) await this.dexieService.saveDetallesActivoFijo(detAF);

    if (reqAFM.length) await this.dexieService.saveRequerimientosActivoFijoMenor(reqAFM);
    if (detAFM.length) await this.dexieService.saveDetallesActivoFijoMenor(detAFM);

    console.log('✅ Requerimientos separados y guardados correctamente (bulkPut).');
  }


  async ListarEmpresas() {
    this.empresas = await this.dexieService.showEmpresas();
    this.configuracion.idempresa =
      this.empresas.find((empresa: any) => empresa.ruc === this.usuario.ruc)
        ?.ruc || '';
  }

  async ListarFundos() {
    const fundos = await this.dexieService.showFundos();
    const empresa = this.empresas.find(
      (empresa: any) => empresa.ruc === this.usuario.ruc
    );
    this.fundos = fundos.filter(
      (fundo: any) => fundo.empresa === empresa.empresa
    );
    if (this.fundos.length == 1) {
      this.configuracion.idfundo = this.fundos[0].codigoFundo;
    }
  }

  async ListarCultivos() {
    const cultivos = await this.dexieService.showCultivos();
    const empresa = this.empresas.find(
      (empresa: any) => empresa.ruc === this.usuario.ruc
    );
    this.cultivos = cultivos.filter(
      (cultivo: any) => cultivo.empresa === empresa.empresa
    );
    if (this.cultivos.length == 1) {
      this.configuracion.idcultivo = this.cultivos[0].codigo;
    }
  }

  async ListarAreas() {
    const areas = await this.dexieService.showAreas();
    const empresa = this.empresas.find(
      (empresa: any) => empresa.ruc === this.usuario.ruc
    );
    this.areas = areas.filter((area: any) => area.ruc === empresa.ruc);
    if (this.areas.length == 1) {
      this.configuracion.idarea = this.areas[0].idarea;
    }
  }

  async ListarProyectos() {
    const proyectos = await this.dexieService.showProyectos();

    const empresa = this.empresas.find(
      (e: any) => e.ruc === this.usuario.ruc
    );

    // 🔥 NO agrupar, NO eliminar duplicados - mantener todas las combinaciones CECO-LABOR-PROYECTO
    if (empresa) {
      this.proyectos = proyectos.filter(
        (p: any) => p.ruc === empresa.ruc && p.estado === 1
      );
    } else {
      this.proyectos = proyectos.filter((p: any) => p.estado === 1);
    }

    console.log('🔎 PROYECTOS TOTALES CARGADOS:', this.proyectos.length);
    console.log('� SAMPLE:', this.proyectos[0]);
  }


  async ListarAlmacenes() {
    const almacenes = await this.dexieService.showAlmacenes();
    this.almacenes = almacenes;
    if (this.almacenes.length == 1) {
      this.configuracion.idalmacen = this.almacenes[0].idalmacen;
    }
  }

  async ListarAlmacenesDestino() {
    const almacenesDestino = await this.dexieService.showAlmacenesDestino();
    this.almacenesDestino = almacenesDestino;
    // if (this.almacenes.length == 1) {
    //   this.configuracion.idalmacen = this.almacenes[0].idalmacen;
    // }
  }

  async ListarItems() {
    const items = await this.dexieService.showItemComoditys();
    this.items = items;
    if (this.items.length == 1) {
      this.configuracion.iditem = this.items[0].id;
    }
  }

  async ListarClasificaciones() {
    const clasificaciones = await this.dexieService.showClasificaciones();
    this.clasificaciones = clasificaciones;
    if (this.clasificaciones.length == 1) {
      this.configuracion.idclasificacion = this.items[0].idclasificacion;
    }
  }

  async ListarTurnos() {
    const turnos = await this.dexieService.showTurnos();
    this.turnos = turnos;
    if (this.turnos.length == 1) {
      this.configuracion.idturno = this.turnos[0].id;
    }
  }

  async ListarLabores() {
    const labores = await this.dexieService.showLabores();
    this.labores = labores;
    if (this.labores.length == 1) {
      this.configuracion.idlabor = this.labores[0].idlabor;
    }
  }

  async ListarCecos() {
    const cecos = await this.dexieService.showCecos();
    this.cecos = cecos;
    console.log('Cecos: ', cecos);
    // if (this.cecos.length == 1) {
    //   this.configuracion.idceco = this.cecos[0].id;
    //   // this.configuracion.idceco = this.cecos[0].costcenter;
    // }
    if (this.cecos.length > 0) {
    this.configuracion.idceco = this.cecos[0].costcenter;
    }
    console.log(this.configuracion.idceco);
  }

  async ListarTipoGastos() {
    const tipoGastos = await this.dexieService.showTipoGastos();
    this.tipoGastos = tipoGastos;
    if (this.tipoGastos.length == 1) {
      this.configuracion.idtipoGasto = this.tipoGastos[0].id;
    }
  }

  async ListarProveedores() {
    const proveedores = await this.dexieService.showProveedores();
    this.proveedores = proveedores;
    if (this.proveedores.length == 1) {
      this.configuracion.idproveedor = this.proveedores[0].id;
    }
  }

  async ListarServicios() {
    const servicios = await this.dexieService.showComodities();
    this.servicios = servicios;
    if (this.servicios.length == 1) {
      this.configuracion.idproveedor = this.proveedores[0].id;
    }
  }

  async ListarActivosFijos() {
    const activosFijos = await this.dexieService.showActivosFijos();
    this.activosFijos = activosFijos;
    if (this.activosFijos.length == 1) {
      this.configuracion.idactivoFijo = this.activosFijos[0].id;
    }
  }

  async filtraCecoTurnoProyecto() {
    this.filteredTurnos.length = 0;
    this.configuracion.idturno = '';
    if (this.configuracion.idcultivo) {
      const cultivo = this.cultivos.find(
        (e: any) => e.id == this.configuracion.idcultivo
      );
      this.filteredTurnos = this.turnos.filter(
        (x: Turno) => x.idcultivo?.trim() === cultivo.codigo
      );
    }
  }

  async darTurnoCecosProyectos(limpiar = false) {
    // Limpiar campos dependientes si se solicita
    if (limpiar) {
      this.configuracion.idturno = '';
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      this.configuracion.idproyecto = '';
      this.filteredTurnos = [];
      this.filteredCecos = [];
      this.filteredLabores = [];
      this.filteredProyectos = [];
    }

    if (this.configuracion.idcultivo) {
      // Cargar turnos según cultivo
      this.filteredTurnos = this.turnos.filter(
        (x: Turno) => x.idcultivo?.trim() === this.configuracion.idcultivo
      );

      // Para COMPRA: cargar CECOs según cultivo
      if (this.configuracion.idTipoItem === 'COMPRA') {
        await this.cargarCecosPorCultivo();
      } else {
        // Para CONSUMO y TRANSFERENCIA: cargar CECOs según cultivo
        this.filteredCecos = this.cecos.filter(
          (x: Ceco) => x.idcultivo?.trim() === this.configuracion.idcultivo
        );
      }

      console.log('✅ Turnos cargados:', this.filteredTurnos.length);
      console.log('✅ CECOs cargados:', this.filteredCecos.length);
    }
  }

  async darProyectoCecos(limpiar = false) {
    this.filteredCecos = [];

    if (limpiar) {
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      // this.configuracion.idproyecto = '';
      // this.filteredProyectos = [];
    }

    if (this.configuracion.idcultivo) {
      // Para COMPRA: ya se cargaron CECOs por cultivo en onCultivoChange()
      if (this.configuracion.idTipoItem !== 'COMPRA') {
        // Para CONSUMO y TRANSFERENCIA: lógica original
        this.filteredCecos = this.cecos.filter(
          (x: Ceco) => x.idcultivo?.trim() === this.configuracion.idcultivo
        );
      } else {
        // Para COMPRA: ya están cargados desde onCultivoChange()
        // No hacer nada, los CECOs ya están filtrados por cultivo
      }
    }

    const turno = this.filteredTurnos.find(
      (e: any) => e.codTurno === this.configuracion.idturno
    );

    if (turno && this.configuracion.idturno) {
      // Para CONSUMO y TRANSFERENCIA: filtrar CECOs por turno
      const cecosPorTurno = this.cecos.filter((x: Ceco) =>
        x.conturno.includes(turno.conturno ?? '')
      );
      
      // Si hay CECOs que coinciden con el turno, usarlos
      // Si no, mantener los CECOs filtrados por cultivo (para CONSUMO)
      if (cecosPorTurno.length > 0) {
        this.filteredCecos = cecosPorTurno;
        console.log('✅ CECOs filtrados por turno:', cecosPorTurno.length);
      } else {
        console.log('⚠️ No hay CECOs para el turno, manteniendo CECOs por cultivo');
        // Para CONSUMO, mantener los CECOs por cultivo si no hay por turno
        if (this.configuracion.idTipoItem !== 'COMPRA') {
          // Ya están filtrados por cultivo desde arriba
        } else {
          // Para COMPRA, limpiar si no hay CECOs por turno
          this.filteredCecos = [];
        }
      }
    }
    
    console.log('✅ Cecos finales:', this.filteredCecos.length);
  }


  async darProyectoInversionLabor(limpiar = false) {
    this.filteredProyectos.length = 0;
    if (limpiar) {
      this.configuracion.idlabor = '';
      this.configuracion.idproyecto = '';
    }
    
    if (this.configuracion.idceco) {
      console.log('🔍 CECO seleccionado:', this.configuracion.idceco);
      
      // Para COMPRA: cargar labores según CECO
      if (this.configuracion.idTipoItem === 'COMPRA') {
        console.log('🎯 Cargando labores para COMPRA según CECO...');
        
        // Filtrar labores que pertenecen al CECO seleccionado
        const labores = await this.dexieService.showLabores();
        this.filteredLabores = labores.filter(
          (x: Labor) => x.ceco === this.configuracion.idceco
        );
        
        console.log('📊 Labores filtradas por CECO:', this.filteredLabores.length);
        
        if (this.filteredLabores.length > 0) {
          console.log('✅ Labores encontradas:');
          this.filteredLabores.slice(0, 3).forEach((labor, index) => {
            console.log(`  ${index + 1}. ${labor.idlabor} - ${labor.labor}`);
          });
          
          // 🎯 AUTO-SELECCIÓN: Si solo hay una labor, seleccionarla automáticamente
          if (this.filteredLabores.length === 1) {
            this.configuracion.idlabor = this.filteredLabores[0].idlabor;
            console.log('🤖 Labor auto-seleccionada:', this.configuracion.idlabor);
            
            // Cargar proyectos automáticamente para la labor seleccionada
            await this.filtrarProyectoPorLabor();
          }
        } else {
          console.log('❌ No se encontraron labores para este CECO');
        }
      } else {
        // Lógica original para otros tipos
        const ceco = this.filteredCecos.find(
          // (e: any) => e.id === this.configuracion.idceco
          (e: any) => e.costcenter === this.configuracion.idceco
        );
        if (ceco) {
          if (ceco.esinversion === 1) {
            this.configuracion.idproyecto = '';
            const proyectos = await this.dexieService.showProyectos();
            this.filteredProyectos = proyectos;
          }
          const labores = await this.dexieService.showLabores();
          console.log('labores: ',labores);
          this.filteredLabores = labores.filter(
            // (x: Labor) => x.ceco == this.configuracion.idceco
            (x: Labor) => x.ceco === ceco.costcenter
          );
          console.log('filtro de labores: ', this.filteredLabores);
        }
      }
    }
  }

  async filtraCecoTurnoProyectoInicio() {
    if (this.configuracion.idcultivo) {
      const cultivo = this.cultivos.find(
        (e: any) => e.id == this.configuracion.idcultivo
      );
      this.filteredTurnos = this.turnos.filter(
        (x: Turno) => x.idcultivo?.trim() === cultivo.codigo
      );
      // LIMPIAR PROYECTOS AL CAMBIAR CULTIVO
      // this.filteredProyectos = [];
      this.darProyectoCecos();
    }
  }

  async nombreProyecto(idproyecto: string) {
    const proyecto = this.proyectos.find((p) => p.afe === idproyecto);
    this.nombreProyectoHeader = proyecto?.proyectoio || '';
  }

  async filtrarProyectoPorLabor(preservarSeleccion = false) {
    console.log('🔥 CULTIVO SELECCIONADO:', this.configuracion.idcultivo);
    console.log('🔥 TURNO SELECCIONADO:', this.configuracion.idturno);
    console.log('🔥 CECO SELECCIONADO:', this.configuracion.idceco);
    console.log('🔥 LABOR SELECCIONADA:', this.configuracion.idlabor);
    console.log('🔥 TIPO ITEM:', this.configuracion.idTipoItem);

    const proyectoGuardado = this.configuracion.idproyecto; // Guardar valor antes de limpiar
    
    this.filteredProyectos = [];
    if (!preservarSeleccion) {
      this.configuracion.idproyecto = '';
      this.nombreProyectoHeader = '';
    }

    if (!this.configuracion.idlabor || !this.configuracion.idceco) {
      console.log('⚠️ Falta CECO o LABOR');
      return;
    }

    // Para COMPRA: filtrar proyectos por CECO + LABOR
    if (this.configuracion.idTipoItem === 'COMPRA') {
      console.log('🎯 Filtrando proyectos para COMPRA (CECO + LABOR)...');
      
      this.filteredProyectos = this.proyectos.filter(
        (p: any) =>
          p.ceco?.trim() === this.configuracion.idceco?.trim() &&
          p.idlabor?.trim() === this.configuracion.idlabor?.trim() &&
          p.idcultivo?.trim() === this.configuracion.idcultivo?.trim()
      );
      
      console.log('✅ PROYECTOS FILTRADOS (CECO + LABOR):', this.filteredProyectos.length);
      console.log('📦 PROYECTOS FILTRADOS:', this.filteredProyectos);
      
      // Auto-selección si solo hay uno
      if (this.filteredProyectos.length === 1) {
        this.configuracion.idproyecto = this.filteredProyectos[0].afe;
        await this.nombreProyecto(this.configuracion.idproyecto);
        console.log('✅ PROYECTO AUTO-SELECCIONADO:', this.configuracion.idproyecto, '-', this.nombreProyectoHeader);
      } else if (this.filteredProyectos.length > 1 && preservarSeleccion && proyectoGuardado) {
        // Si hay múltiples proyectos y estamos preservando la selección, buscar el guardado
        const proyectoExistente = this.filteredProyectos.find(p => p.afe === proyectoGuardado);
        if (proyectoExistente) {
          this.configuracion.idproyecto = proyectoGuardado;
          await this.nombreProyecto(proyectoGuardado);
          console.log('✅ PROYECTO RESTAURADO:', proyectoGuardado, '-', this.nombreProyectoHeader);
        } else {
          console.log('⚠️ Proyecto guardado no encontrado en lista filtrada');
          this.configuracion.idproyecto = '';
        }
      } else if (this.filteredProyectos.length === 0) {
        console.log('⚠️ No hay proyectos para CECO:', this.configuracion.idceco, 'y LABOR:', this.configuracion.idlabor);
      } else {
        console.log(`ℹ️ Hay ${this.filteredProyectos.length} proyectos disponibles para seleccionar`);
      }
      return;
    }

    // Lógica original para otros tipos (CONSUMO, TRANSFERENCIA)
    // �🔑 RELACIÓN: CULTIVO → TURNO → CECO → LABOR → PROYECTO
    // Validar que el CECO pertenezca al cultivo seleccionado a través del TURNO

    const cultivo = this.cultivos.find((c: any) => c.codigo === this.configuracion.idcultivo);
    console.log('📋 CULTIVO:', cultivo);

    if (cultivo) {
      // Buscar turnos del cultivo (turno.idcultivo = cultivo.codigo)
      const turnosDelCultivo = this.turnos.filter((t: Turno) => t.idcultivo?.trim() === cultivo.codigo?.trim());
      console.log('📋 TURNOS DEL CULTIVO:', turnosDelCultivo.length);

      // Obtener el CECO seleccionado
      const cecoSeleccionado = this.cecos.find((c: Ceco) => c.costcenter?.trim() === this.configuracion.idceco?.trim());
      console.log('📋 CECO SELECCIONADO:', cecoSeleccionado);

      if (cecoSeleccionado) {
        // Verificar que el CECO pertenezca a algún turno del cultivo (ceco.conturno debe estar en turnosDelCultivo)
        const cecoPerteneceCultivo = turnosDelCultivo.some((t: Turno) =>
          cecoSeleccionado.conturno?.includes(t.conturno || '')
        );

        console.log('🔍 CECO pertenece al cultivo?', cecoPerteneceCultivo);

        if (!cecoPerteneceCultivo) {
          console.log('⚠️ El CECO no pertenece al cultivo seleccionado');
          console.log('   CECO conturno:', cecoSeleccionado.conturno);
          console.log('   Turnos del cultivo:', turnosDelCultivo.map((t: Turno) => t.conturno));
          return;
        }
      }
    }

    // 🔑 FILTRADO POR CECO + LABOR + CULTIVO
    // Los proyectos deben coincidir con CECO, IDLABOR y CULTIVO
    this.filteredProyectos = this.proyectos.filter(
      (p: any) =>
        p.ceco?.trim() === this.configuracion.idceco?.trim() &&
        p.idlabor?.trim() === this.configuracion.idlabor?.trim() &&
        p.idcultivo?.trim() === cultivo.codigo?.trim()
    );

    console.log('✅ PROYECTOS FILTRADOS (CULTIVO + CECO + LABOR):', this.filteredProyectos.length);
    console.log('📦 PROYECTOS FILTRADOS:', this.filteredProyectos);

    // ✅ AUTOSELECCIÓN si solo hay uno
    if (this.filteredProyectos.length === 1) {
      this.configuracion.idproyecto = this.filteredProyectos[0].afe;
      await this.nombreProyecto(this.configuracion.idproyecto);
      console.log('✅ PROYECTO AUTO-SELECCIONADO:', this.configuracion.idproyecto, '-', this.nombreProyectoHeader);
    } else if (this.filteredProyectos.length === 0) {
      console.log('⚠️ No hay proyectos para CECO:', this.configuracion.idceco, 'y LABOR:', this.configuracion.idlabor);
    } else {
      console.log(`ℹ️ Hay ${this.filteredProyectos.length} proyectos disponibles para seleccionar`);
    }
  }

  async ListarAlmacenesPorRol() {

    console.log('👤 Usuario:', this.usuario);
    console.log('📦 Tipo Item:', this.configuracion.idTipoItem);
    console.log('🎭 Rol:', this.usuario.idrol);

    this.almacenes = [];
    this.configuracion.idalmacen = '';

    // ===============================
    // 🔁 TRANSFERENCIA
    // ===============================
    if (this.configuracion.idTipoItem === 'TRANSFERENCIA') {

      // SOLO LOLOGIST
      if (this.usuario.idrol !== 'LOLOGIST') {
        console.warn('⛔ Transferencia no permitida para este rol');
        return;
      }

      const destino = await this.dexieService.showAlmacenesDestino();
      this.almacenes = destino ?? [];

      console.log('🔁 ALMACENES DESTINO:', this.almacenes);
      return;
    }

    // ===============================
    // 🏷️ COMPRA / CONSUMO
    // ===============================
    console.log('🔍 Cargando almacenes para COMPRA/CONSUMO');
    const almacenes = await this.dexieService.showAlmacenes();

    console.log('📊 Almacenes encontrados en Dexie:', almacenes?.length || 0);
    if (!almacenes?.length) {
      console.warn('⚠️ No hay almacenes en Dexie');
      return;
    }

    console.log('👤 Rol del usuario:', this.usuario.idrol);

    // 🔥 EMLOGIST → TODOS
    if (this.usuario.idrol === 'EMLOGIST') {
      console.log('📦 Rol EMLOGIST detectado, cargando almacenes de destino');
      const destino = await this.dexieService.showAlmacenesDestino();
      this.almacenes = destino;
      console.log('📦 ALMACENES EMPAQUE:', this.almacenes);
      return;
    }

    // 🔐 LOLOGIST / OPLOGIST → SOLO UNO
    console.log('🔐 Rol LOLOGIST/OPLOGIST detectado, asignando primer almacén');
    // const almacenUsuario = almacenes[0];
    // this.almacenes = [almacenes[0]];
    const almentrada = almacenes.find((c: any) => c.almentrada === "S"); 
    this.almacenes = almentrada ? [almentrada] : almacenes.slice(0, 1);

    // 🔹 Auto-seleccionar si solo hay un almacén
    if (this.almacenes.length === 1 && !this.configuracion.idalmacen) {
      this.configuracion.idalmacen = String(this.almacenes[0].idalmacen);
      console.log('✅ Auto-seleccionado almacén:', this.configuracion.idalmacen);
    }

    console.log('🏷️ ALMACÉN USUARIO:', this.almacenes);
  }


  async onTipoItemChange() {
    console.log('🔄 Tipo Item cambiado a:', this.configuracion.idTipoItem);
    console.log('🔍 Estado actual - Cultivo:', this.configuracion.idcultivo, 'Turno:', this.configuracion.idturno, 'CECO:', this.configuracion.idceco);

    // Limpiar campos específicos según el tipo
    if (this.configuracion.idTipoItem === 'COMPRA') {
      console.log('🛒 Configurando flujo COMPRA');
      // Limpiar campos de CONSUMO
      this.configuracion.idturno = '';
      this.filteredTurnos = [];
      
      // Para COMPRA: cargar CECOs según cultivo si ya hay cultivo seleccionado
      if (this.configuracion.idcultivo) {
        console.log('📋 Cargando CECOs para COMPRA con cultivo:', this.configuracion.idcultivo);
        await this.cargarCecosPorCultivo();
      }
    } else if (this.configuracion.idTipoItem === 'CONSUMO') {
      console.log('🥤 Configurando flujo CONSUMO');
      // Limpiar campos dependientes
      this.configuracion.idturno = '';
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      this.configuracion.idproyecto = '';
      this.filteredTurnos = [];
      this.filteredCecos = [];
      this.filteredLabores = [];
      this.filteredProyectos = [];
      
      // Para CONSUMO: flujo completo cultivo → turno → ceco → labor → proyecto
      if (this.configuracion.idcultivo) {
        console.log('🎯 Cargando flujo CONSUMO para cultivo:', this.configuracion.idcultivo);
        
        // 1. Cargar turnos según cultivo
        this.filteredTurnos = this.turnos.filter(
          (x: Turno) => x.idcultivo?.trim() === this.configuracion.idcultivo
        );
        
        // 2. Cargar CECOs según cultivo (para CONSUMO también se filtran por cultivo)
        this.filteredCecos = this.cecos.filter(
          (x: Ceco) => x.idcultivo?.trim() === this.configuracion.idcultivo
        );
        
        console.log('✅ Turnos para CONSUMO:', this.filteredTurnos.length);
        console.log('✅ CECOs para CONSUMO:', this.filteredCecos.length);
        console.log('🔍 Cultivo seleccionado:', this.configuracion.idcultivo);
        console.log('📊 Total CECOs disponibles:', this.cecos.length);
        
        // Mostrar algunos CECOs filtrados para depurar
        if (this.filteredCecos.length > 0) {
          console.log('📋 Ejemplos de CECOs filtrados:');
          this.filteredCecos.slice(0, 3).forEach((ceco, index) => {
            console.log(`  ${index + 1}. ID: ${ceco.id}, idcultivo: "${ceco.idcultivo}", localname: "${ceco.localname}"`);
          });
        } else {
          console.log('⚠️ No se encontraron CECOs para el cultivo:', this.configuracion.idcultivo);
          console.log('📋 CECOs disponibles con sus cultivos:');
          this.cecos.slice(0, 5).forEach((ceco, index) => {
            console.log(`  ${index + 1}. ID: ${ceco.id}, idcultivo: "${ceco.idcultivo}", localname: "${ceco.localname}"`);
          });
        }
      } else {
        console.log('⚠️ No hay cultivo seleccionado para CONSUMO');
      }
    } else if (this.configuracion.idTipoItem === 'TRANSFERENCIA') {
      // Limpiar todos los campos específicos
      this.configuracion.idturno = '';
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      this.configuracion.idproyecto = '';
      this.filteredTurnos = [];
      this.filteredCecos = [];
      this.filteredLabores = [];
      this.filteredProyectos = [];
      
      // Para TRANSFERENCIA: cargar turnos según cultivo si ya hay cultivo seleccionado
      if (this.configuracion.idcultivo) {
        this.filteredTurnos = this.turnos.filter(
          (x: Turno) => x.idcultivo?.trim() === this.configuracion.idcultivo
        );
      }
    }

    // Cargar almacenes según el tipo
    await this.ListarAlmacenesPorRol();
  }

  async guardarConfiguracion() {
    this.showValidation = true;
    
    // Validaciones básicas comunes para todos los tipos
    if (!this.configuracion.idempresa || !this.configuracion.idfundo || !this.configuracion.idcultivo || !this.configuracion.idTipoItem) {
      this.alertService.showAlert(
        'Advertencia!',
        'Debe seleccionar Empresa, Fundo, Cultivo y Tipo',
        'warning'
      );
      return;
    }

    // Validaciones específicas según tipo
    if (this.configuracion.idTipoItem === 'COMPRA') {
      if (!this.configuracion.idceco || !this.configuracion.idlabor || !this.configuracion.idproyecto) {
        this.alertService.showAlert(
          'Advertencia!',
          'Para COMPRA debe seleccionar CECO, Labor y Proyecto',
          'warning'
        );
        return;
      }
    } else if (this.configuracion.idTipoItem === 'CONSUMO') {
      if (!this.configuracion.idturno) {
        this.alertService.showAlert(
          'Advertencia!',
          'Para CONSUMO debe seleccionar Turno',
          'warning'
        );
        return;
      }
    } else if (this.configuracion.idTipoItem === 'TRANSFERENCIA') {
      if (!this.configuracion.idturno || !this.configuracion.idceco || !this.configuracion.idlabor || !this.configuracion.idproyecto) {
        this.alertService.showAlert(
          'Advertencia!',
          'Para TRANSFERENCIA debe seleccionar Turno, CECO, Labor y Proyecto',
          'warning'
        );
        return;
      }
    }

    // Si pasa todas las validaciones
    this.configuracion.id = this.usuario.ruc + this.usuario.documentoidentidad;
    await this.dexieService.saveConfiguracion(this.configuracion);
    this.alertService.showAlert(
      '¡Éxito!',
      'La configuración se guardó correctamente',
      'success'
    );

    this.router.navigate(['/main/requerimientos']);
  }
}
