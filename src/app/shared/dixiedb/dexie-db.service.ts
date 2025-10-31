import { Injectable } from '@angular/core';
import {
  Usuario, Configuracion, Empresa, Fundo, Almacen, Area, Proyecto, ItemComodity, Clasificacion, Cultivo, Acopio, Ceco, Labor,
  Trabajador, Turno, DetalleRequerimiento, Requerimiento
} from '../interfaces/Tables'
import Dexie from 'dexie';

@Injectable({
  providedIn: 'root'
})

export class DexieService extends Dexie {
  public usuario!: Dexie.Table<Usuario, number>;
  public configuracion!: Dexie.Table<Configuracion, number>;
  public empresas!: Dexie.Table<Empresa, number>;
  public fundos!: Dexie.Table<Fundo, number>;
  public almacenes!: Dexie.Table<Almacen, number>;
  public areas!: Dexie.Table<Area, number>;
  public cultivos!: Dexie.Table<Cultivo, number>;
  public proyectos!: Dexie.Table<Proyecto, number>;
  public turnos!: Dexie.Table<Turno, number>;
  public acopios!: Dexie.Table<Acopio, string>
  public cecos!: Dexie.Table<Ceco, number>;
  public labores!: Dexie.Table<Labor, number>;
  public clasificaciones!: Dexie.Table<Clasificacion, number>;
  public trabajadores!: Dexie.Table<Trabajador, string>;
  public itemComoditys!: Dexie.Table<ItemComodity, string>
  public detalles!: Dexie.Table<DetalleRequerimiento, number>
  public requerimientos!: Dexie.Table<Requerimiento, number>

  private static readonly DB_NAME = 'Logistica';
  private static readonly DB_VERSION = 2; // ⬅️ cambia este número cuando modifiques el esquema

  constructor() {
    super(DexieService.DB_NAME);
    console.log('🔄 Inicializando DexieService (IndexedDB)');
    // super('Logistica');
    // console.log('DexieService Constructor - Base de datos inicializada');
    try{
     this.version(DexieService.DB_VERSION).stores({
    // this.version(1).stores({
      usuario: `id,sociedad,idempresa,ruc,razonSocial,idProyecto,proyecto,documentoIdentidad,usuario,
      clave,nombre,idrol,rol`,
      configuracion: `id,idempresa,idfundo,idcultivo,idarea,idacopio,idceco,idlabor,idalmacen`,
      empresas: `id,ruc,razonsocial`,
      fundos: `id,codigoFundo,empresa,fundo,nombreFundo`,
      almacenes: `id,idalmacen,almacen`,
      areas: `id,ruc,descripcion,estado`,
      proyectos: `id,ruc,afe,proyecto,esinverison,estado`,
      cultivos: `id,cultivo,codigo,descripcion,empresa`,
      turnos: 'id,codTurno,turno,nombreTurno,modulo',
      acopios: `id,nave,codigoAcopio,acopio`,
      cecos: `id,costcenter,localname`,
      labores: `id,idlabor,idgrupolabor,labor`,
      itemComoditys: `id,tipoclasificacion,codigo,descripcion`,
      clasificaciones: `id,idclasificacion,descripcion_clasificacion,tipoClasificacion`,
      trabajadores: `id,ruc,nrodocumento,nombres,apellidopaterno,apellidomaterno,estado,motivo,
      bloqueado,eliminado,idmotivo,motivosalida`,
      detalles: `++id,codigo,producto,cantidad,proyecto,ceco,turno,labor`,
      requerimientos: `++id,fecha,fundo,almacen,glosa,detalle`,
    });

    this.usuario = this.table('usuario');
    this.configuracion = this.table('configuracion');
    this.empresas = this.table('empresas');
    this.fundos = this.table('fundos');
    this.almacenes = this.table('almacenes');
    this.cultivos = this.table('cultivos');
    this.turnos = this.table('turnos');
    this.proyectos = this.table('proyectos');
    this.areas = this.table('areas');
    this.acopios = this.table('acopios');
    this.cecos = this.table('cecos');
    this.labores = this.table('labores');
    this.itemComoditys = this.table('itemComoditys');
    this.trabajadores = this.table('trabajadores')
    this.clasificaciones = this.table('clasificaciones')
    this.detalles = this.table('detalles')
    this.requerimientos = this.table('requerimientos')

    // 🔧 Manejo automático de errores por versión o corrupción
      this.open().catch(async (err) => {
        console.error('⚠️ Error al abrir IndexedDB, limpiando base antigua:', err);
        await this.delete();
        await this.open();
        console.info('✅ IndexedDB regenerada correctamente.');
      });

    } catch (error) {
      console.error('❌ Error inicializando Dexie:', error);
    }
  }

  async clearAll() {
    for (const table of this.tables) {
      await table.clear();
    }
    console.log('🧹 Todas las tablas de Dexie han sido limpiadas.');
  }

  //Empresas
  async saveEmpresa(empresa: Empresa) { await this.empresas.put(empresa); }
  async saveEmpresas(empresas: Empresa[]) { await this.empresas.bulkPut(empresas); }
  async showEmpresas() { return await this.empresas.orderBy('razonsocial').toArray(); }
  async showEmpresaById(id: number) { return await this.empresas.where('id').equals(id).first() }
  async clearEmpresas() { await this.empresas.clear(); }
  //Usuarios
  async saveUsuario(usuario: Usuario) { await this.usuario.put(usuario); }
  async showUsuario() { return await this.usuario.toCollection().first() }
  async clearUsuario() { await this.usuario.clear(); }
  //Fundos
  async saveFundo(fundo: Fundo) { await this.fundos.put(fundo); }
  async saveFundos(fundos: Fundo[]) { await this.fundos.bulkPut(fundos); }
  async showFundos() { return await this.fundos.toArray(); }
  async showFundoById(id: number) { return await this.fundos.where('id').equals(id).first() }
  async clearFundos() { await this.fundos.clear(); }
  //Almacenes
  async saveAlmacen(almacen: Almacen) { await this.almacenes.put(almacen); }
  async saveAlmacenes(almacenes: Almacen[]) { await this.almacenes.bulkPut(almacenes); }
  async showAlmacenes() { return await this.almacenes.toArray(); }
  async showAlmaceneById(id: number) { return await this.almacenes.where('id').equals(id).first() }
  async clearAlmacenes() { await this.almacenes.clear(); }
  //Proyectos
  async saveProyecto(proyecto: Proyecto) { await this.proyectos.put(proyecto); }
  async saveProyectos(proyectos: Proyecto[]) { await this.proyectos.bulkPut(proyectos); }
  async showProyectos() { return await this.proyectos.toArray(); }
  async showProyectoById(id: number) { return await this.proyectos.where('id').equals(id).first() }
  async clearProyectos() { await this.proyectos.clear(); }
  //Item Comodity
  async saveItemComodity(ItemComodity: ItemComodity) { await this.itemComoditys.put(ItemComodity); }
  async saveItemComoditys(itemComoditys: ItemComodity[]) { await this.itemComoditys.bulkPut(itemComoditys); }
  async showItemComoditys() { return await this.itemComoditys.toArray(); }
  async showItemComodityById(id: number) { return await this.itemComoditys.where('id').equals(id).first() }
  async clearItemComoditys() { await this.itemComoditys.clear(); }
  //Areas
  async saveArea(area: Area) { await this.areas.put(area); }
  async saveAreas(areas: Area[]) { await this.areas.bulkPut(areas); }
  async showAreas() { return await this.areas.toArray(); }
  async showAreaById(id: number) { return await this.areas.where('id').equals(id).first() }
  async clearAreas() { await this.areas.clear(); }
  //Clasificaciones
  async saveClasificacion(clasificacion: Clasificacion) { await this.clasificaciones.put(clasificacion); }
  async saveClasificaciones(clasificaciones: Clasificacion[]) { await this.clasificaciones.bulkPut(clasificaciones); }
  async showClasificaciones() { return await this.clasificaciones.toArray(); }
  async showClasificacionById(id: number) { return await this.clasificaciones.where('id').equals(id).first() }
  async clearClasificaciones() { await this.clasificaciones.clear(); }
  //Cultivos
  async saveCultivo(cultivo: Cultivo) { await this.cultivos.put(cultivo); }
  async saveCultivos(cultivos: Cultivo[]) { await this.cultivos.bulkPut(cultivos); }
  async showCultivos() { return await this.cultivos.toArray(); }
  async showCultivoById(id: number) { return await this.cultivos.where('id').equals(id).first() }
  async clearCultivos() { await this.cultivos.clear(); }
  //Acopios
  async saveAcopios(params: Acopio[]) { await this.acopios.bulkPut(params); }
  async showAcopios() { return await this.acopios.toArray(); }
  async clearAcopios() { await this.acopios.clear(); }
  //Cecos
  async saveCeco(ceco: Ceco) { await this.cecos.put(ceco); }
  async saveCecos(cecos: Ceco[]) { await this.cecos.bulkPut(cecos); }
  async showCecosById(id: any) { return await this.cecos.where('id').equals(id).first(); }
  async showCecos() { return await this.cecos.toArray(); }
  async clearCecos() { await this.cecos.clear(); }
  //Labores
  async saveLabor(labor: Labor) { await this.labores.put(labor); }
  async saveLabores(labores: Labor[]) { await this.labores.bulkPut(labores); }
  async showLaboresById(id: any) { return await this.labores.where('id').equals(id).first(); }
  async showLabores() { return await this.labores.toArray(); }
  async clearLabores() { await this.labores.clear(); }
  //Turnos
  async saveTurno(turno: Turno) { await this.turnos.put(turno); }
  async saveTurnos(turnos: Turno[]) { await this.turnos.bulkPut(turnos); }
  async showTurnos() { return await this.turnos.toArray(); }
  async showTurnoById(id: number) { return await this.turnos.where('id').equals(id).first() }
  async ShowTurnosByIdTurno(idturno: number) { return await this.turnos.filter(turno => turno.id == idturno).toArray() }
  async clearTurnos() { await this.turnos.clear(); }
  //Trabajadores
  async saveTrabajadores(params: Trabajador[]) { await this.trabajadores.bulkPut(params); }
  async saveTrabajador(params: Trabajador) { await this.trabajadores.put(params); }
  async showTrabajadorById(id: any) { return await this.trabajadores.where('id').equals(id).first(); }
  async showTrabajadores() { return await this.trabajadores.toArray(); }
  async deleteTrabajador(id: any) { return await this.trabajadores.where('id').equals(id).delete(); }
  // ---------------- Detalle Requerimiento ----------------
  async saveDetalleRequerimiento(detalle: DetalleRequerimiento) { await this.detalles.put(detalle); }
  async saveDetallesRequerimientos(detalles: DetalleRequerimiento[]) { await this.detalles.bulkPut(detalles); }
  async showDetallesRequerimiento() { return await this.detalles.toArray(); }
  async deleteDetalleRequerimiento(id: number) { return await this.detalles.where('id').equals(id).delete(); }
  async clearDetallesRequerimiento() { await this.detalles.clear(); }
  // ---------------- Requerimiento ----------------
  async saveRequerimiento(requerimiento: Requerimiento) { await this.requerimientos.put(requerimiento); }
  async saveRequerimientos(requerimientos: Requerimiento[]) { await this.requerimientos.bulkPut(requerimientos); }
  async showRequerimiento() { return await this.requerimientos.toArray(); }
  async deleteRequerimiento(id: number) { return await this.requerimientos.where('id').equals(id).delete(); }
  async clearRequerimiento() { await this.requerimientos.clear(); }
  async generarCodigo(): Promise<string> {
    const total = await this.requerimientos.count();
    const siguiente = total + 1;
    return siguiente.toString().padStart(6, '0');
  }
  //Configuracion
  async clearMaestras() {
    await this.clearFundos();
    await this.clearCultivos();
    await this.clearAcopios();
    await this.clearCecos();
    await this.clearLabores();
    await this.clearTurnos();
    await this.clearAlmacenes();
    await this.clearAreas();
    await this.clearProyectos();
    await this.clearItemComoditys();
    await this.clearClasificaciones();
    await this.clearDetallesRequerimiento();
    await this.clearRequerimiento();
    console.log('Todas las tablas de configuracion han sido limpiadas en indexedDB.');
  }
  //Configuracion
  async saveConfiguracion(configuracion: Configuracion) { await this.configuracion.put(configuracion); }
  async obtenerConfiguracion() { return await this.configuracion.toArray(); }
  async obtenerPrimeraConfiguracion() { return await this.configuracion.toCollection().first(); }
  async clearConfiguracion() { await this.configuracion.clear(); }

}