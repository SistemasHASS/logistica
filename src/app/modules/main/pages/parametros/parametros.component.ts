import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Configuracion } from '@/app/shared/interfaces/Tables';
import { MaestrasService } from '../../services/maestras.service';
import { FormsModule } from '@angular/forms';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { LogisticaService } from '../../services/logistica.service';
import { UserService } from '@/app/shared/services/user.service';
import { ParametrosService } from '../../services/parametros.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { RequerimientosService } from '../../services/requerimientos.service';


@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametros.component.html',
  styleUrls: ['./parametros.component.scss']
})
export class ParametrosComponent implements OnInit {
  constructor(
    private dexieService: DexieService,
    private maestrasService: MaestrasService,
    private alertService: AlertService, // ✅ inyectar el servicio
    private requerimientosService: RequerimientosService
  ) { }

  fecha = new Date();
  mensajeFundos: String = '';
  empresas: any[] = [];
  sedes: any[] = [];
  cultivos: any[] = [];
  proyectos: any[] = [];
  areas: any[] = [];
  fundos: any[] = [];
  almacenes: any[] = [];
  items: any[] = [];
  turnos: any[] = [];
  labores: any[] = [];
  cecos: any[] = [];
  clasificaciones: any[] = [];

  fundoSeleccionado = '';
  cultivoSeleccionado = '';
  areaSeleccionada = '';
  almacenSeleccionado = '';
  showValidation: boolean = false;

  usuario: Usuario = {
    id: "",
    sociedad: 0,
    idempresa: "",
    ruc: "",
    razonSocial: "",
    idProyecto: "",
    proyecto: "",
    documentoidentidad: "",
    usuario: "",
    clave: "",
    nombre: "",
    idrol: "",
    rol: ""
  }

  configuracion: Configuracion = {
    id: "",
    idempresa: "",
    idfundo: "",
    idcultivo: "",
    idarea: "",
    idalmacen: "",
    idproyecto: "",
    idacopio: 0,
    idceco: "",
    idlabor: "",
    idturno: "",
    iditem: "",
    idclasificacion: "",
  }

  async ngOnInit() {
    await this.getUsuario()
    await this.validarExisteConfiguracion()
    await this.llenarDropdowns();
  }

  async getUsuario() {
    const usuario = await this.dexieService.showUsuario();
    if (usuario) { this.usuario = usuario } else { console.log('Error', 'Usuario not found', 'error'); }
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
  }

  obtenerRol() {
    if (this.usuario.idrol.includes('ALLOGIST')) return 'ALLOGIST'
    if (this.usuario.idrol.includes('APLOGIST')) return 'APLOGIST'
    return ''
  }

  async sincronizarTablasMaestras() {
    try {
      this.alertService.mostrarModalCarga();
      const empresas = await this.maestrasService.getEmpresas([])
      if (!!empresas && empresas.length) {
        await this.dexieService.saveEmpresas(empresas)
        await this.ListarEmpresas()
      }

      const fundos = this.maestrasService.getFundos([{ idempresa: this.usuario.idempresa }])
      fundos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveFundos(resp);
          await this.ListarFundos();
          this.alertService.cerrarModalCarga()
          this.alertService.showAlert('Exito!', 'Sincronizado con exito', 'success');
        }
      });

      const cultivos = this.maestrasService.getCultivos([{ idempresa: this.usuario?.idempresa }])
      cultivos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveCultivos(resp);
          await this.ListarCultivos();
        }
      });

      const areas = this.maestrasService.getAreas([{ ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' }])
      areas.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAreas(resp);
          await this.ListarAreas();
        }
      });

      const almacenes = this.maestrasService.getAlmacenes([{ ruc: this.usuario?.ruc }])
      almacenes.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAlmacenes(resp);
          await this.ListarAlmacenes();
        }
      });

      const proyectos = this.maestrasService.getProyectos([{ ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA', esadmin: 0 }])
      proyectos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveProyectos(resp);
          await this.ListarProyectos();
        }
      });

      const items = this.maestrasService.getItems([{ ruc: this.usuario?.ruc }])
      items.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveItemComoditys(resp);
          await this.ListarItems();
        }
      });

      const clasificaciones = this.maestrasService.getClasificaciones([{}])
      clasificaciones.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveClasificaciones(resp);
          await this.ListarClasificaciones();
        }
      });

      const turnos = this.maestrasService.getTurnos([{ idempresa: this.usuario?.idempresa, aplicacion: 'LOGISTICA', esadmin: 0 }])
      turnos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveTurnos(resp);
          await this.ListarTurnos();
        }
      });

      const labores = await this.maestrasService.getLabores([{ aplicacion: 'LOGISTICA', esadmin: 0 }])
      if (!!labores && labores.length) {
        await this.dexieService.saveLabores(labores)
        await this.ListarLabores()
      }

      const cecos = await this.maestrasService.getCecos([{ aplicacion: 'LOGISTICA', esadmin: 0 }])
      cecos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveCecos(resp);
          await this.ListarCecos();
        }
      });

      const requerimmientos = this.requerimientosService.getRequerimientos([{ ruc: this.usuario.ruc, idrol: this.obtenerRol() }])
      requerimmientos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveRequerimientos(resp)
          // Ahora recorre cada requerimiento y guarda su detalle
          for (const req of resp) {
            if (req.detalle && req.detalle.length) {
              for (const det of req.detalle) {
                // Añadimos un campo idrequerimiento para enlazarlo
                await this.dexieService.detalles.add({
                  ...det,
                  idrequerimiento: req.idrequerimiento
                });
              }
            }
          }

          console.log('✅ Requerimientos y detalles guardados correctamente');
        }
      });

    } catch (error: any) {
      console.error(error);
      this.alertService.showAlert('Error!', '<p>Ocurrio un error</p><p>', 'error');
    }
  }

  async ListarEmpresas() {
    this.empresas = await this.dexieService.showEmpresas();
    this.configuracion.idempresa = this.empresas.find((empresa: any) => empresa.ruc === this.usuario.ruc)?.ruc || '';
  }

  async ListarFundos() {
    const fundos = await this.dexieService.showFundos();
    const empresa = this.empresas.find((empresa: any) => empresa.ruc === this.usuario.ruc);
    this.fundos = fundos.filter((fundo: any) => fundo.empresa === empresa.empresa);
    if (this.fundos.length == 1) {
      this.configuracion.idfundo = this.fundos[0].codigoFundo;
    }
  }

  async ListarCultivos() {
    const cultivos = await this.dexieService.showCultivos();
    const empresa = this.empresas.find((empresa: any) => empresa.ruc === this.usuario.ruc);
    this.cultivos = cultivos.filter((cultivo: any) => cultivo.empresa === empresa.empresa);
    if (this.cultivos.length == 1) {
      this.configuracion.idcultivo = this.cultivos[0].codigo;
    }
  }

  async ListarAreas() {
    const areas = await this.dexieService.showAreas();
    const empresa = this.empresas.find((empresa: any) => empresa.ruc === this.usuario.ruc);
    this.areas = areas.filter((area: any) => area.ruc === empresa.ruc);
    if (this.areas.length == 1) {
      this.configuracion.idarea = this.areas[0].idarea;
    }
  }

  async ListarProyectos() {
    const proyectos = await this.dexieService.showProyectos();
    const empresa = this.empresas.find((empresa: any) => empresa.ruc === this.usuario.ruc);
    this.proyectos = proyectos.filter((proyecto: any) => proyecto.ruc === empresa.ruc);
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

  async ListarItems() {
    const items = await this.dexieService.showItemComoditys();
    this.items = items;
    // const empresa = this.empresas.find((empresa: any) => empresa.ruc === this.usuario.ruc);
    // this.items = items.filter((almacen: any) => almacen.empresa === empresa.empresa);
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
    // const empresa = this.empresas.find((empresa: any) => empresa.ruc === this.usuario.ruc);
    // this.turnos = turnos.filter((almacen: any) => almacen.empresa === empresa.empresa);
    if (this.turnos.length == 1) {
      this.configuracion.idturno = this.turnos[0].id;
    }
  }

  async ListarLabores() {
    const labores = await this.dexieService.showLabores();
    this.labores = labores;
    // const empresa = this.empresas.find((empresa: any) => empresa.ruc === this.usuario.ruc);
    // this.labores = labores.filter((almacen: any) => almacen.empresa === empresa.empresa);
    if (this.labores.length == 1) {
      this.configuracion.idlabor = this.labores[0].idlabor;
    }
  }

  async ListarCecos() {
    const cecos = await this.dexieService.showCecos();
    this.cecos = cecos;
    // const empresa = this.empresas.find((empresa: any) => empresa.ruc === this.usuario.ruc);
    // this.cecos = cecos.filter((ceco: any) => ceco.empresa === empresa.empresa);
    if (this.cecos.length == 1) {
      this.configuracion.idceco = this.cecos[0].id;
    }
  }

  async guardarConfiguracion() {
    this.showValidation = true;
    if (!this.configuracion.idempresa || !this.configuracion.idfundo || !this.configuracion.idcultivo) {
      this.alertService.showAlert('Advertencia!', 'Debe seleccionar todos los campos', 'warning')
    } else {
      this.configuracion.id = this.usuario.ruc + this.usuario.documentoidentidad;
      await this.dexieService.saveConfiguracion(this.configuracion)
      this.alertService.showAlert('¡Éxito!', 'La operación se completó correctamente', 'success')
    }
  }
}