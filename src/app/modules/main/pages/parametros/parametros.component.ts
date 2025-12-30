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
import { FormsModule } from '@angular/forms';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { RequerimientosService } from '../../services/requerimientos.service';
import { DropdownComponent } from '../../components/dropdown/dropdown.component';
import { CommodityService } from '../../services/commoditys.service';

@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './parametros.component.html',
  styleUrls: ['./parametros.component.scss'],
})
export class ParametrosComponent implements OnInit {
  constructor(
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
  };

  async ngOnInit() {
    await this.getUsuario();
    await this.validarExisteConfiguracion();
    await this.llenarDropdowns();
    // Oculta todos al inicio
    this.ocultarItem = true;
    this.ocultarLabor = true;
    this.ocultarCeco = true;
    this.ocultarTurno = true;
    this.ocultarProyecto = true;
  }

  async getUsuario() {
    const usuario = await this.dexieService.showUsuario();
    if (usuario) {
      this.usuario = usuario;
    } else {
      console.log('Error', 'Usuario not found', 'error');
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
    await this.ListarAlmacenes();
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

  obtenerRol() {
    if (this.usuario.idrol.includes('ALLOGIST')) return 'ALLOGIST';
    if (this.usuario.idrol.includes('APLOGIST')) return 'APLOGIST';
    return '';
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
          await this.ListarAlmacenes();
        }
      });

      const almacenesDestino = this.requerimientosService.getAlmacenes([
        { ruc: this.usuario?.ruc },
      ]);
      almacenesDestino.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAlmacenesDestino(resp);
          await this.ListarAlmacenesDestino();
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
        { ruc: this.usuario.ruc, idrol: this.obtenerRol() },
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

  async ListarProyectos() {
    const proyectos = await this.dexieService.showProyectos();
    const empresa = this.empresas.find(
      (empresa: any) => empresa.ruc === this.usuario.ruc
    );
    this.proyectos = proyectos.filter(
      (proyecto: any) => proyecto.ruc === empresa.ruc
    );
    if (this.proyectos.length == 1) {
      this.configuracion.idproyecto = this.proyectos[0].id;
    }
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

  async darProyectoCecos(limpiar = false) {

    this.filteredCecos = [];

    if (limpiar) {
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      this.configuracion.idproyecto = '';
    }

    const turno = this.filteredTurnos.find(
      (e: any) => e.codTurno === this.configuracion.idturno
    );

    // =========================
    // SI ES SIN TURNO
    // =========================
    if (!turno || turno.nombreTurno?.toLowerCase() === 'sinturno') {

      const cultivo = this.cultivos.find(
        (c: any) => c.id == this.configuracion.idcultivo
      );

      if (cultivo) {
        this.filteredProyectos = this.proyectos.filter(
          (p: any) => p.cultivo === cultivo.codigo
        );

        // ✅ AUTO-SELECCIONAR EL PRIMER PROYECTO
        if (this.filteredProyectos.length > 0) {
          this.configuracion.idproyecto = this.filteredProyectos[0].afe;
          await this.nombreProyecto(this.configuracion.idproyecto);
        }
      } else {
        this.filteredProyectos = [];
      }

    }
    // =========================
    // TURNO NORMAL
    // =========================
    else {

      this.configuracion.idproyecto = turno.idproyecto;

      this.filteredProyectos = this.proyectos.filter(
        (p: any) => p.afe === turno.idproyecto
      );

      if (this.configuracion.idproyecto)
        await this.nombreProyecto(this.configuracion.idproyecto);
    }

    // CECO SEGÚN TURNO
    if (turno && this.configuracion.idturno) {
      this.filteredCecos = this.cecos.filter((x: Ceco) =>
        x.conturno.includes(turno.conturno ?? '')
      );
    }

    console.log('✅ Proyectos:', this.filteredProyectos);
    console.log('✅ Proyecto asignado:', this.configuracion.idproyecto);
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

  async filtraCecoTurnoProyectoInicio() {
    if (this.configuracion.idcultivo) {
      const cultivo = this.cultivos.find(
        (e: any) => e.id == this.configuracion.idcultivo
      );
      this.filteredTurnos = this.turnos.filter(
        (x: Turno) => x.idcultivo?.trim() === cultivo.codigo
      );
      // LIMPIAR PROYECTOS AL CAMBIAR CULTIVO
      this.filteredProyectos = [];
      this.darProyectoCecos();
    }
  }

  async nombreProyecto(idproyecto: string) {
    const proyecto = this.proyectos.find((p) => p.afe === idproyecto);
    this.nombreProyectoHeader = proyecto?.proyectoio || '';
  }

  async guardarConfiguracion() {
    this.showValidation = true;
    if (
      !this.configuracion.idempresa ||
      !this.configuracion.idfundo ||
      !this.configuracion.idcultivo
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
