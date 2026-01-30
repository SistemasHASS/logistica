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

  // tipoItem: any[] = [
  //   { id: 'COMPRA', descripcion: 'COMPRA' },
  //   { id: 'CONSUMO', descripcion: 'CONSUMO' }
  // ];

  // 🔥 TIPO ITEM DINÁMICO
  tipoItem: any[] = [];

  // 🔐 ROLES
  esLogist = false;
  esOpLogist = false;
  esEmLogist = false;

  TipoItemSeleccionado = '';

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
    await this.validarExisteConfiguracion();
    await this.llenarDropdowns();
    // 🔒 FORZAR TIPO ITEM A CONSUMO
    // this.configuracion.idTipoItem = 'CONSUMO';
    this.configurarTipoItemPorRol(); // 👈 OBLIGATORIO
    // 👇 SOLO después de tener todo
    if (this.configuracion.idTipoItem) {
      await this.ListarAlmacenesPorRol();
    }
    // Oculta todos al inicio
    this.ocultarItem = true;
    this.ocultarLabor = true;
    this.ocultarCeco = true;
    this.ocultarTurno = true;
    this.ocultarProyecto = true;
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

    // Base: todos pueden COMPRA y CONSUMO
    this.tipoItem = [
      // { id: 'COMPRA', descripcion: 'COMPRA' },
      { id: 'CONSUMO', descripcion: 'CONSUMO' },
    ];

    // 🔐 SOLO LOGIST puede TRANSFERENCIA
    if (this.esLogist) {
      this.tipoItem.push({
        id: 'TRANSFERENCIA',
        descripcion: 'TRANSFERENCIA',
      });
    }

    // Reset por seguridad si cambia el rol
    if (
      this.configuracion.idTipoItem === 'TRANSFERENCIA' &&
      !this.esLogist
    ) {
      this.configuracion.idTipoItem = 'CONSUMO';
    }

    // 🔹 Auto-seleccionar si solo hay una opción
    if (this.tipoItem.length === 1 && !this.configuracion.idTipoItem) {
      this.configuracion.idTipoItem = this.tipoItem[0].id;
      console.log('✅ Auto-seleccionado tipoItem:', this.configuracion.idTipoItem);
    }
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

  async onCecoTurnoProyectoChange(limpiar = false) {
    if (limpiar) {
      this.configuracion.idturno = '';
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      this.configuracion.idproyecto;
    }
    await this.filtraCecoTurnoProyecto();
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
        { ruc: this.usuario?.ruc },
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
            detItems.push({
              ...d,
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

  // async ListarProyectos() {
  //   const proyectos = await this.dexieService.showProyectos();
  //   const empresa = this.empresas.find(
  //     (empresa: any) => empresa.ruc === this.usuario.ruc
  //   );
  //   this.proyectos = proyectos.filter(
  //     (proyecto: any) => proyecto.ruc === empresa.ruc
  //   );
  //   if (this.proyectos.length == 1) {
  //     this.configuracion.idproyecto = this.proyectos[0].id;
  //   }
  // }

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
    if (this.cecos.length == 1) {
      this.configuracion.idceco = this.cecos[0].id;
    }
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

  // async darProyectoCecos(limpiar = false) {

  //   this.filteredCecos = [];

  //   if (limpiar) {
  //     this.configuracion.idceco = '';
  //     this.configuracion.idlabor = '';
  //     this.configuracion.idproyecto = '';
  //   }

  //   const turno = this.filteredTurnos.find(
  //     (e: any) => e.codTurno === this.configuracion.idturno
  //   );

  //   // =========================
  //   // SI ES SIN TURNO
  //   // =========================
  //   if (!turno || turno.nombreTurno?.toLowerCase() === 'sinturno') {

  //     const cultivo = this.cultivos.find(
  //       (c: any) => c.id == this.configuracion.idcultivo
  //     );

  //     if (cultivo) {
  //       this.filteredProyectos = this.proyectos.filter(
  //         (p: any) => p.cultivo === cultivo.codigo
  //       );

  //       // ✅ AUTO-SELECCIONAR EL PRIMER PROYECTO
  //       if (this.filteredProyectos.length > 0) {
  //         this.configuracion.idproyecto = this.filteredProyectos[0].afe;
  //         await this.nombreProyecto(this.configuracion.idproyecto);
  //       }
  //     } else {
  //       this.filteredProyectos = [];
  //     }

  //   }
  //   // =========================
  //   // TURNO NORMAL
  //   // =========================
  //   else {

  //     this.configuracion.idproyecto = turno.idproyecto;

  //     this.filteredProyectos = this.proyectos.filter(
  //       (p: any) => p.afe === turno.idproyecto
  //     );

  //     if (this.configuracion.idproyecto)
  //       await this.nombreProyecto(this.configuracion.idproyecto);
  //   }

  //   // CECO SEGÚN TURNO
  //   if (turno && this.configuracion.idturno) {
  //     this.filteredCecos = this.cecos.filter((x: Ceco) =>
  //       x.conturno.includes(turno.conturno ?? '')
  //     );
  //   }

  //   console.log('✅ Proyectos:', this.filteredProyectos);
  //   console.log('✅ Proyecto asignado:', this.configuracion.idproyecto);
  // }

  async darProyectoCecos(limpiar = false) {

    this.filteredCecos = [];

    if (limpiar) {
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      // this.configuracion.idproyecto = '';
      // this.filteredProyectos = [];
    }

    const turno = this.filteredTurnos.find(
      (e: any) => e.codTurno === this.configuracion.idturno
    );

    // CECO SEGÚN TURNO
    if (turno && this.configuracion.idturno) {
      this.filteredCecos = this.cecos.filter((x: Ceco) =>
        x.conturno.includes(turno.conturno ?? '')
      );
    }

    console.log('✅ Cecos:', this.filteredCecos);
  }


  async darProyectoInversionLabor(limpiar = false) {
    this.filteredProyectos.length = 0;
    if (limpiar) {
      this.configuracion.idlabor = '';
    }
    if (this.configuracion.idceco) {
      const ceco = this.filteredCecos.find(
        (e: any) => e.id === this.configuracion.idceco
      );
      if (ceco) {
        if (ceco.esinversion === 1) {
          this.configuracion.idproyecto = '';
          const proyectos = await this.dexieService.showProyectos();
          this.filteredProyectos = proyectos;
        }
        const labores = await this.dexieService.showLabores();
        this.filteredLabores = labores.filter(
          (x: Labor) => x.ceco == this.configuracion.idceco
        );
      }
    }
  }

  // async darProyectoInversionLabor(limpiar = false) {

  //   // this.filteredLabores = [];
  //   // this.filteredProyectos = [];

  //   if (limpiar) {
  //     this.configuracion.idlabor = '';
  //     // this.configuracion.idproyecto = '';
  //   }

  //   if (!this.configuracion.idceco) return;

  //   const ceco = this.filteredCecos.find(
  //     (e: any) => e.id === this.configuracion.idceco
  //   );

  //   if (!ceco) return;

  //   // 🔹 LABORES POR CECO
  //   const labores = await this.dexieService.showLabores();
  //   this.filteredLabores = labores.filter(
  //     (x: Labor) => x.ceco === this.configuracion.idceco
  //   );
  // }


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

  async filtrarProyectoPorLabor() {

    console.log('🔥 CULTIVO SELECCIONADO:', this.configuracion.idcultivo);
    console.log('🔥 TURNO SELECCIONADO:', this.configuracion.idturno);
    console.log('🔥 CECO SELECCIONADO:', this.configuracion.idceco);
    console.log('� LABOR SELECCIONADA:', this.configuracion.idlabor);

    this.filteredProyectos = [];
    this.configuracion.idproyecto = '';
    this.nombreProyectoHeader = '';

    if (!this.configuracion.idlabor || !this.configuracion.idceco) {
      console.log('⚠️ Falta CECO o LABOR');
      return;
    }

    // 🔑 RELACIÓN: CULTIVO → TURNO → CECO → LABOR → PROYECTO
    // Validar que el CECO pertenezca al cultivo seleccionado a través del TURNO

    const cultivo = this.cultivos.find((c: any) => c.id == this.configuracion.idcultivo);
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

    // 🔑 FILTRADO POR CECO + LABOR
    // Los proyectos deben coincidir con CECO e IDLABOR
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

  // async ListarAlmacenesPorRol() {

  //   console.log('👤 Usuario:', this.usuario);
  //   console.log('📦 Tipo Item:', this.configuracion.idTipoItem);
  //   console.log('🎭 Rol:', this.usuario.idrol);

  //   this.almacenes = [];

  //   // 🔁 TRANSFERENCIA → SOLO LOLOGIST
  //   if (this.configuracion.idTipoItem === 'TRANSFERENCIA') {

  //     if (this.usuario.idrol !== 'LOLOGIST') {
  //       console.warn('⛔ Transferencia no permitida para este rol');
  //       return;
  //     }

  //     const destino = await this.dexieService.showAlmacenesDestino();

  //     this.almacenes = destino ?? [];

  //     console.log('🔁 ALMACENES DESTINO:', this.almacenes);
  //     return;
  //   }

  //   // 🏷️ COMPRA / CONSUMO → UN SOLO ALMACÉN
  //   const almacenes = await this.dexieService.showAlmacenes();

  //   if (!almacenes?.length) {
  //     console.warn('⚠️ No hay almacenes en Dexie');
  //     return;
  //   }

  //   // 👉 EN PARÁMETROS SOLO SE USA UNO
  //   const almacenUsuario = almacenes[0];

  //   this.almacenes = [almacenUsuario];
  //   this.configuracion.idalmacen = String(almacenUsuario.idalmacen);

  //   console.log('🏷️ ALMACÉN USUARIO:', this.almacenes);
  // }

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
    const almacenes = await this.dexieService.showAlmacenes();

    if (!almacenes?.length) {
      console.warn('⚠️ No hay almacenes en Dexie');
      return;
    }

    // 🔥 EMLOGIST → TODOS
    if (this.usuario.idrol === 'EMLOGIST') {
      const destino = await this.dexieService.showAlmacenesDestino();
      this.almacenes = destino;
      console.log('📦 ALMACENES EMPAQUE:', this.almacenes);
      return;
    }

    // 🔐 LOLOGIST / OPLOGIST → SOLO UNO
    // const almacenUsuario = almacenes[0];
    this.almacenes = [almacenes[0]];

    // 🔹 Auto-seleccionar si solo hay un almacén
    if (this.almacenes.length === 1 && !this.configuracion.idalmacen) {
      this.configuracion.idalmacen = String(this.almacenes[0].idalmacen);
      console.log('✅ Auto-seleccionado almacén:', this.configuracion.idalmacen);
    }

    console.log('🏷️ ALMACÉN USUARIO:', this.almacenes);
  }


  async onTipoItemChange() {
    console.log('🔄 Tipo Item cambiado:', this.configuracion.idTipoItem);

    // limpiar selección previa
    // this.configuracion.idalmacen = '';
    // this.almacenes = [];

    await this.ListarAlmacenesPorRol();
  }

  async guardarConfiguracion() {
    this.showValidation = true;
    if (
      !this.configuracion.idempresa ||
      !this.configuracion.idfundo ||
      !this.configuracion.idcultivo ||
      !this.configuracion.idlabor ||
      !this.configuracion.idceco ||
      !this.configuracion.idTipoItem
    ) {
      this.alertService.showAlert(
        'Advertencia!',
        'Debe seleccionar todos los campos',
        'warning'
      );
    } else {
      this.configuracion.id =
        this.usuario.ruc + this.usuario.documentoidentidad;
      await this.dexieService.saveConfiguracion(this.configuracion);
      this.alertService.showAlert(
        '¡Éxito!',
        'La operación se completó correctamente',
        'success'
      );

      this.router.navigate(['/main/requerimientos']);
    }
  }
}
