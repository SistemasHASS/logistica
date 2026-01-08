import { Injectable } from '@angular/core';
import {
  Usuario, Configuracion, Empresa, Fundo, Almacen, AlmacenDestino, Area, Proyecto, ItemComodity, Clasificacion, Cultivo, Acopio, Ceco, Labor, Turno, DetalleRequerimiento, Requerimiento, Item, Comodity, SubClasificacion, Proveedor, TipoGasto, ActivoFijo,
  DetalleRequerimientoActivoFijo, DetalleRequerimientoCommodity, RequerimientoCommodity, RequerimientoActivoFijo, RequerimientoActivoFijoMenor, DetalleRequerimientoActivoFijoMenor, MaestroItem, MaestroCommodity, MaestroSubCommodity,
  DetalleListaStock, ListaStock, MovimientoStock, SolicitudCompra, DetalleSolicitudCompra, OrdenCompra, DetalleCotizacion, Cotizacion, Stock, DetalleOrdenCompra, Despacho, DetalleDespacho
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
  public almacenesDestino!: Dexie.Table<AlmacenDestino, number>;
  public areas!: Dexie.Table<Area, number>;
  public cultivos!: Dexie.Table<Cultivo, number>;
  public proyectos!: Dexie.Table<Proyecto, number>;
  public turnos!: Dexie.Table<Turno, number>;
  public acopios!: Dexie.Table<Acopio, string>
  public cecos!: Dexie.Table<Ceco, number>;
  public labores!: Dexie.Table<Labor, number>;
  public clasificaciones!: Dexie.Table<Clasificacion, number>;
  public itemComoditys!: Dexie.Table<ItemComodity, string>
  public detalles!: Dexie.Table<DetalleRequerimiento, number>
  public detallesActivoFijo!: Dexie.Table<DetalleRequerimientoActivoFijo, number>
  public detallesCommodity!: Dexie.Table<DetalleRequerimientoCommodity, number>
  public requerimientos!: Dexie.Table<Requerimiento, number>
  public items!: Dexie.Table<Item, string>
  public comodities!: Dexie.Table<Comodity, string>
  public subClasificaciones!: Dexie.Table<SubClasificacion, string>
  public proveedores!: Dexie.Table<Proveedor, string>
  public tipoGastos!: Dexie.Table<TipoGasto, string>
  public commoditys!: Dexie.Table<Comodity, string>
  public activosFijos!: Dexie.Table<ActivoFijo, string>
  public requerimientosCommodity!: Dexie.Table<RequerimientoCommodity, number>
  public requerimientosActivoFijo!: Dexie.Table<RequerimientoActivoFijo, number>
  public requerimientosActivoFijoMenor!: Dexie.Table<RequerimientoActivoFijoMenor, number>
  public detallesActivoFijoMenor!: Dexie.Table<DetalleRequerimientoActivoFijoMenor, number>
  public maestroItems!: Dexie.Table<MaestroItem, number>
  public maestroCommoditys!: Dexie.Table<MaestroCommodity, number>
  public maestroSubCommoditys!: Dexie.Table<MaestroSubCommodity, number>
  public solicitudesCompra!: Dexie.Table<SolicitudCompra, number>;
  public detalleSolicitudCompra!: Dexie.Table<DetalleSolicitudCompra, number>;
  public cotizaciones!: Dexie.Table<Cotizacion, number>;
  public detalleCotizacion!: Dexie.Table<DetalleCotizacion, number>;
  public ordenesCompra!: Dexie.Table<OrdenCompra, number>;
  public detalleOrdenCompra!: Dexie.Table<DetalleOrdenCompra, number>;
  public stock!: Dexie.Table<Stock, number>;
  public movimientosStock!: Dexie.Table<MovimientoStock, number>;
  public listasStock!: Dexie.Table<ListaStock, number>;
  public detalleListaStock!: Dexie.Table<DetalleListaStock, number>;
  public despachos!: Dexie.Table<Despacho, number>;
  public detalleDespachos!: Dexie.Table<DetalleDespacho, number>;

  private static readonly DB_NAME = 'Logistica';
  private static readonly DB_VERSION = 23; // ⬅️ cambia este número cuando modifiques el esquema

  constructor() {
    super(DexieService.DB_NAME);
    console.log('🔄 Inicializando DexieService (IndexedDB)');
    // super('Logistica');
    // console.log('DexieService Constructor - Base de datos inicializada');
    try {
      this.version(DexieService.DB_VERSION).stores({
        // this.version(1).stores({
        usuario: `id,sociedad,idempresa,ruc,razonSocial,idProyecto,proyecto,documentoidentidad,usuario,
        clave,nombre,idrol,rol`,
        configuracion: `id,idempresa,idfundo,idcultivo,idarea,idacopio,idceco,idlabor,idalmacen,idactivoFijo`,
        empresas: `id,ruc,razonsocial`,
        fundos: `id,codigoFundo,empresa,fundo,nombreFundo`,
        almacenes: `id,idalmacen,almacen`,
        almacenesDestino: `id,idalmacen,almacen`,
        areas: `id,ruc,descripcion,estado`,
        proyectos: `id,ruc,afe,proyecto,esinverison,estado`,
        cultivos: `id,cultivo,codigo,descripcion,empresa`,
        turnos: `id,turno,codTurno,nombreTurno,idcultivo,idproyecto,conturno,estado`,
        acopios: `id,nave,codigoAcopio,acopio`,
        cecos: `id,costcenter,localname,cultivo,conturno,esinversion,estado,ccontable`,
        labores: `id,idlabor,idgrupolabor,ceco,labor,estado`,
        itemComoditys: `id,tipoclasificacion,codigo,descripcion`,
        clasificaciones: `id,idclasificacion,descripcion_clasificacion,tipoClasificacion`,
        detalles: `++id,idrequerimiento,codigo,descripcion,producto,cantidad,proyecto,ceco,turno,labor,esActivoFijo,activoFijo,estado,atendida`,
        requerimientos: `++id,idrequerimiento,fecha,idfundo,idarea,idalmacen,estados,estado,tipo,idproyecto,glosa,detalle,despachado,prioridad`,
        items: `id,tipoclasificacion,codigo,descripcion`,
        comodities: `id,tipoclasificacion,codigo,descripcion`,
        subClasificaciones: `id,comodityId,subClase,descripcion,unidad,cuentaGasto,elementoGasto,clasificacionActivo,legacyNumber`,
        proveedores: `id,TipoPersona,documento,ruc,Estado,TipoPago,MonedaPago,detraccion,TipoServicio`,
        tipoGastos: `codigo,descripcion`,
        commoditys: `id,tipoclasificacion,codigo,descripcion`,
        activosFijos: `id,codigo,descripcion,codigoInterno,ubicacion,ceco,localName,tipoActivo,Estado`,
        detallesActivoFijo: `++id,idrequerimiento,codigo,cantidad,proyecto,ceco,turno,labor`,
        detallesCommodity: `++id,idrequerimiento,codigo,cantidad,proyecto,ceco,turno,labor`,
        requerimientosCommodity: `++id,idrequerimiento,fecha,idfundo,idarea,idalmacen,estados,tipo,idproyecto,glosa,detalleCommodity`,
        requerimientosActivoFijo: `++id,idrequerimiento,fecha,idfundo,idarea,idalmacen,estados,tipo,idproyecto,glosa,detalleActivoFijo`,
        requerimientosActivoFijoMenor: `++id,idrequerimiento,fecha,idfundo,idarea,idalmacen,estados,tipo,idproyecto,glosa,detalleActivoFijoMenor`,
        detallesActivoFijoMenor: `++id,idrequerimiento,codigo,cantidad,proyecto,ceco,turno,labor`,
        maestroCommoditys: `id,commodity01,commodity02,commodity,clasificacion,descripcionLocal,descripcionIngles,
        unidadporDefecto,cuentaContableGasto,elementoGasto,clasificacionActivo,estado,ultimoUsuario,
        montoReferencial,montoReferencialMoneda,descripcionEditableFlag,igvExoneradoFlag`,
        maestroItems: `id,item,itemTipo,linea,familia,subFamilia,descripcionLocal,descripcionIngles,
        descripcionCompleta,unidadCodigo,monedaCodigo,precioCosto,precioUnitarioLocal,
        precioUnitarioDolares,itemPrecioFlag,disponibleVentaFlag,itemProcedencia,manejoxLoteFlag,
        manejoxSerieFlag,manejoxKitFlag,afectoImpuestoVentasFlag,requisicionamientoAutomaticoFl,
        disponibleTransferenciaFlag,disponibleConsumoFlag,formularioFlag,manejoxUnidadFlag,isoAplicableFlag,
        cantidadDobleFlag,unidadReplicacion,cuentaInventario,cuentaGasto,cuentaServicioTecnico,
        factorEquivalenciaComercial,estado,ultimaFechaModif,ultimoUsuario,cuentaVentas,
        unidadCompra,controlCalidadFlag,cuentaTransito,cantidadDobleFactor,subFamiliaInferior,
        stockMinimo,stockMaximo,referenciaFiscalIngreso02`,
        maestroSubCommoditys: `id,commodity01,commodity02,commodity,descripcionLocal,descripcionIngles,
        unidadporDefecto,cuentaContableGasto,elementoGasto,clasificacionActivo,estado,ultimoUsuario,
        montoReferencial,montoReferencialMoneda,descripcionEditableFlag,igvExoneradoFlag`,
        // ✅ NUEVAS TABLAS PARA EL FLUJO DE COMPRAS
        solicitudesCompra: `++id,numeroSolicitud,fecha,estado,usuarioSolicita,almacen,tipo`,
        detalleSolicitudCompra: `++id,solicitudCompraId,codigo,descripcion,cantidad,estado`,
        cotizaciones: `++id,numeroCotizacion,solicitudCompraId,proveedor,fecha,estado,seleccionada`,
        detalleCotizacion: `++id,cotizacionId,codigo,descripcion,cantidad,precioUnitario,total`,
        ordenesCompra: `++id,numeroOrden,solicitudCompraId,proveedor,fecha,estado,montoTotal`,
        detalleOrdenCompra: `++id,ordenCompraId,codigo,descripcion,cantidad,cantidadRecibida,estado`,
        stock: `++id,[codigo+almacen],codigo,almacen,cantidad`,
        movimientosStock: `++id,fecha,tipo,codigo,almacenOrigen,almacenDestino,cantidad,usuario`,
        listasStock: `++id,nombre,almacen,fecha,estado,usuarioCreador`,
        detalleListaStock: `++id,listaStockId,codigo,descripcion,stockActual,estado`,
        despachos: `++id,numeroDespacho,fecha,estado,usuarioSolicita,almacen,tipo`,
        detalleDespachos: `++id,despachoId,codigo,descripcion,cantidad,estado`,
      });

      this.usuario = this.table('usuario');
      this.configuracion = this.table('configuracion');
      this.empresas = this.table('empresas');
      this.fundos = this.table('fundos');
      this.almacenes = this.table('almacenes');
      this.almacenesDestino = this.table('almacenesDestino');
      this.cultivos = this.table('cultivos');
      this.turnos = this.table('turnos');
      this.proyectos = this.table('proyectos');
      this.areas = this.table('areas');
      this.acopios = this.table('acopios');
      this.cecos = this.table('cecos');
      this.labores = this.table('labores');
      this.itemComoditys = this.table('itemComoditys');
      this.clasificaciones = this.table('clasificaciones')
      this.detalles = this.table('detalles')
      this.requerimientos = this.table('requerimientos')
      this.items = this.table('items')
      this.comodities = this.table('comodities')
      this.subClasificaciones = this.table('subClasificaciones')
      this.proveedores = this.table('proveedores')
      this.tipoGastos = this.table('tipoGastos')
      this.commoditys = this.table('commoditys')
      this.activosFijos = this.table('activosFijos')
      this.detallesActivoFijo = this.table('detallesActivoFijo')
      this.detallesCommodity = this.table('detallesCommodity')
      this.requerimientosCommodity = this.table('requerimientosCommodity')
      this.requerimientosActivoFijo = this.table('requerimientosActivoFijo')
      this.requerimientosActivoFijoMenor = this.table('requerimientosActivoFijoMenor')
      this.detallesActivoFijoMenor = this.table('detallesActivoFijoMenor')
      this.maestroItems = this.table('maestroItems')
      this.maestroCommoditys = this.table('maestroCommoditys')
      this.maestroSubCommoditys = this.table('maestroSubCommoditys')
      this.solicitudesCompra = this.table('solicitudesCompra');
      this.detalleSolicitudCompra = this.table('detalleSolicitudCompra');
      this.cotizaciones = this.table('cotizaciones');
      this.detalleCotizacion = this.table('detalleCotizacion');
      this.ordenesCompra = this.table('ordenesCompra');
      this.detalleOrdenCompra = this.table('detalleOrdenCompra');
      this.stock = this.table('stock');
      this.movimientosStock = this.table('movimientosStock');
      this.listasStock = this.table('listasStock');
      this.detalleListaStock = this.table('detalleListaStock');
      this.despachos = this.table('despachos');
      this.detalleDespachos = this.table('detalleDespachos');

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
  async getUsuarioLogueado() { return await this.usuario.toArray().then(res => res[0]); }
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
  //Almacenes Destino
  async saveAlmacenDestino(almacenDestino: AlmacenDestino) { await this.almacenesDestino.put(almacenDestino); }
  async saveAlmacenesDestino(almacenesDestino: AlmacenDestino[]) { await this.almacenesDestino.bulkPut(almacenesDestino); }
  async showAlmacenesDestino() { return await this.almacenesDestino.toArray(); }
  async showAlmaceneDestinoById(id: number) { return await this.almacenesDestino.where('id').equals(id).first() }
  async clearAlmacenesDestino() { await this.almacenesDestino.clear(); }
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
  //Proveedores
  async saveProveedor(proveedor: Proveedor) { await this.proveedores.put(proveedor); }
  async saveProveedores(proveedores: Proveedor[]) { await this.proveedores.bulkPut(proveedores); }
  async showProveedores() { return await this.proveedores.toArray(); }
  async showProveedorById(id: number) { return await this.proveedores.where('id').equals(id).first() }
  async clearProveedores() { await this.proveedores.clear(); }
  //Tipo Gastos
  async saveTipoGasto(tipoGasto: TipoGasto) { await this.tipoGastos.put(tipoGasto); }
  async saveTipoGastos(tipoGastos: TipoGasto[]) { await this.tipoGastos.bulkPut(tipoGastos); }
  async showTipoGastos() { return await this.tipoGastos.toArray(); }
  async showTipoGastoById(id: number) { return await this.tipoGastos.where('id').equals(id).first() }
  async clearTipoGastos() { await this.tipoGastos.clear(); }
  //Activos Fijos
  async saveActivosFijo(activosFijo: ActivoFijo) { await this.activosFijos.put(activosFijo); }
  async saveActivosFijos(activosFijos: ActivoFijo[]) { await this.activosFijos.bulkPut(activosFijos); }
  async showActivosFijos() { return await this.activosFijos.toArray(); }
  async showActivosFijoById(id: number) { return await this.activosFijos.where('id').equals(id).first() }
  async clearActivosFijos() { await this.activosFijos.clear(); }
  // ---------------- Detalle Activo Fijo ----------------
  async saveDetalleActivoFijo(detalleActivoFijo: DetalleRequerimientoActivoFijo) { await this.detallesActivoFijo.put(detalleActivoFijo); }
  async saveDetallesActivoFijo(detallesActivoFijo: DetalleRequerimientoActivoFijo[]) { await this.detallesActivoFijo.bulkPut(detallesActivoFijo); }
  async showDetallesActivoFijo() { return await this.detallesActivoFijo.toArray(); }
  async deleteDetalleActivoFijo(id: number) { return await this.detallesActivoFijo.where('id').equals(id).delete(); }
  async clearDetallesActivoFijo() { await this.detallesActivoFijo.clear(); }
  // ---------------- Detalle Commodity ----------------
  async saveDetalleCommodity(detalleCommodity: DetalleRequerimientoCommodity) { await this.detallesCommodity.put(detalleCommodity); }
  async saveDetallesCommodity(detallesCommodity: DetalleRequerimientoCommodity[]) { await this.detallesCommodity.bulkPut(detallesCommodity); }
  async showDetallesCommodity() { return await this.detallesCommodity.toArray(); }
  async deleteDetalleCommodity(id: number) { return await this.detallesCommodity.where('id').equals(id).delete(); }
  async clearDetallesCommodity() { await this.detallesCommodity.clear(); }
  // ---------------- Detalle Activo Fijo Menor ----------------
  async saveDetalleActivoFijoMenor(detalleActivoFijoMenor: DetalleRequerimientoActivoFijoMenor) { await this.detallesActivoFijoMenor.put(detalleActivoFijoMenor); }
  async saveDetallesActivoFijoMenor(detallesActivoFijoMenor: DetalleRequerimientoActivoFijoMenor[]) { await this.detallesActivoFijoMenor.bulkPut(detallesActivoFijoMenor); }
  async showDetallesActivoFijoMenor() { return await this.detallesActivoFijoMenor.toArray(); }
  async deleteDetalleActivoFijoMenor(id: number) { return await this.detallesActivoFijoMenor.where('id').equals(id).delete(); }
  async clearDetallesActivoFijoMenor() { await this.detallesActivoFijoMenor.clear(); }
  // ---------------- Detalle Requerimiento ----------------
  async saveDetalleRequerimiento(detalle: DetalleRequerimiento) { await this.detalles.put(detalle); }
  async saveDetallesRequerimientos(detalles: DetalleRequerimiento[]) { await this.detalles.bulkPut(detalles); }
  async showDetallesRequerimiento() { return await this.detalles.toArray(); }
  async deleteDetalleRequerimiento(id: number) { return await this.detalles.where('id').equals(id).delete(); }
  async clearDetallesRequerimiento() { await this.detalles.clear(); }
  // ---------------- Requerimiento ----------------
  async saveRequerimiento(requerimiento: Requerimiento) { await this.requerimientos.put(requerimiento); }
  async saveRequerimientos(requerimientos: Requerimiento[]) { await this.requerimientos.bulkPut(requerimientos); }
  // async showRequerimiento() { return await this.requerimientos.toArray(); }
  // async showRequerimiento() { return this.joinDetalle(this.requerimientos, this.detalles); }
  async showRequerimiento() {
    const reqs = await this.requerimientos.toArray();
    const dets = await this.detalles.toArray();

    return this.joinDetalle(reqs, dets);
  }
  // async deleteRequerimiento(id: number) { return await this.requerimientos.where('id').equals(id).delete(); }
  async deleteRequerimiento(idrequerimiento: string) { return await this.requerimientos.where('idrequerimiento').equals(idrequerimiento).delete(); }
  async clearRequerimiento() { await this.requerimientos.clear(); }
  // ---------------- Requerimiento Commodity ----------------
  async saveRequerimientoCommodity(requerimientosCommodity: RequerimientoCommodity) { await this.requerimientosCommodity.put(requerimientosCommodity); }
  async saveRequerimientosCommodity(requerimientosCommodity: RequerimientoCommodity[]) { await this.requerimientosCommodity.bulkPut(requerimientosCommodity); }
  // async showRequerimientoCommodity() { return await this.requerimientosCommodity.toArray(); }
  // async showRequerimientoCommodity() { return this.joinDetalle(this.requerimientosCommodity, this.detallesCommodity); }
  async showRequerimientoCommodity() {
    const reqs = await this.requerimientosCommodity.toArray();
    const dets = await this.detallesCommodity.toArray();
    return this.joinDetalle(reqs, dets);
  }
  async deleteRequerimientoCommodity(idrequerimiento: string) { return await this.requerimientosCommodity.where('idrequerimiento').equals(idrequerimiento).delete(); }
  async clearRequerimientoCommodity() { await this.requerimientosCommodity.clear(); }
  // ---------------- Requerimiento Activo Fijo ----------------
  async saveRequerimientoActivoFijo(requerimientoActivoFijo: RequerimientoActivoFijo) { await this.requerimientosActivoFijo.put(requerimientoActivoFijo); }
  async saveRequerimientosActivoFijo(requerimientosActivoFijo: RequerimientoActivoFijo[]) { await this.requerimientosActivoFijo.bulkPut(requerimientosActivoFijo); }
  // async showRequerimientoActivoFijo() { return await this.requerimientosActivoFijo.toArray(); }
  // async showRequerimientoActivoFijo() { return this.joinDetalle(this.requerimientosActivoFijo, this.detallesActivoFijo); }
  async showRequerimientoActivoFijo() {
    const reqs = await this.requerimientosActivoFijo.toArray();
    const dets = await this.detallesActivoFijo.toArray();
    return this.joinDetalle(reqs, dets);
  }
  async deleteRequerimientoActivoFijo(idrequerimiento: string) { return await this.requerimientosActivoFijo.where('idrequerimiento').equals(idrequerimiento).delete(); }
  async clearRequerimientoActivoFijo() { await this.requerimientosActivoFijo.clear(); }
  // ---------------- Requerimiento Activo Fijo Menor ----------------
  async saveRequerimientoActivoFijoMenor(requerimientoActivoFijoMenor: RequerimientoActivoFijoMenor) { await this.requerimientosActivoFijoMenor.put(requerimientoActivoFijoMenor); }
  async saveRequerimientosActivoFijoMenor(requerimientosActivoFijoMenor: RequerimientoActivoFijoMenor[]) { await this.requerimientosActivoFijoMenor.bulkPut(requerimientosActivoFijoMenor); }
  // async showRequerimientoActivoFijoMenor() { return await this.requerimientosActivoFijoMenor.toArray(); }
  // async showRequerimientoActivoFijoMenor() { return this.joinDetalle(this.requerimientosActivoFijoMenor, this.detallesActivoFijoMenor); }
  async showRequerimientoActivoFijoMenor() {
    const reqs = await this.requerimientosActivoFijoMenor.toArray();
    const dets = await this.detallesActivoFijoMenor.toArray();
    return this.joinDetalle(reqs, dets);
  }
  async deleteRequerimientoActivoFijoMenor(idrequerimiento: string) { return await this.requerimientosActivoFijoMenor.where('idrequerimiento').equals(idrequerimiento).delete(); }
  async clearRequerimientoActivoFijoMenor() { await this.requerimientosActivoFijoMenor.clear(); }
  // ---------------- Maestro Item ----------------
  async saveMaestroItem(maestroItem: MaestroItem) { await this.maestroItems.put(maestroItem); }
  async saveMaestroItems(maestroItems: MaestroItem[]) { await this.maestroItems.bulkPut(maestroItems); }
  async showMaestroItem() { return await this.maestroItems.toArray(); }
  async countMaestroItems() { return await this.maestroItems.count(); }
  async clearMaestroItem() { await this.maestroItems.clear(); }
  // ---------------- Maestro Commodity ----------------
  async saveMaestroCommodity(maestroCommodity: MaestroCommodity) { await this.maestroCommoditys.put(maestroCommodity); }
  async saveMaestroCommodities(maestroCommodities: MaestroCommodity[]) { await this.maestroCommoditys.bulkPut(maestroCommodities); }
  async showMaestroCommodity() { return await this.maestroCommoditys.toArray(); }
  async countMaestroCommodity() { return await this.maestroCommoditys.count(); }
  async clearMaestroCommodity() { await this.maestroCommoditys.clear(); }
  // ---------------- Maestro SubCommodity ----------------
  async saveMaestroSubCommodity(maestroSubCommodity: MaestroSubCommodity) { await this.maestroSubCommoditys.put(maestroSubCommodity); }
  async saveMaestroSubCommodities(maestroSubCommoditys: MaestroSubCommodity[]) { await this.maestroSubCommoditys.bulkPut(maestroSubCommoditys); }
  async showMaestroSubCommodity() { return await this.maestroSubCommoditys.toArray(); }
  async countMaestroSubCommodity() { return await this.maestroSubCommoditys.count(); }
  async clearMaestroSubCommodity() { await this.maestroSubCommoditys.clear(); }
  // ---------------- Despacho ----------------
  async saveDespacho(despacho: Despacho) { await this.despachos.put(despacho); }
  async saveDespachos(despachos: Despacho[]) { await this.despachos.bulkPut(despachos); }
  async showDespacho() { return await this.despachos.toArray(); }
  async showDespachoById(id: number) { return await this.despachos.where('id').equals(id).first() }
  async clearDespacho() { await this.despachos.clear(); }
  // ---------------- Detalle Despacho ----------------
  async saveDetalleDespacho(detalleDespacho: DetalleDespacho) { await this.detalleDespachos.put(detalleDespacho); }
  async saveDetalleDespachos(detalleDespachos: DetalleDespacho[]) { await this.detalleDespachos.bulkPut(detalleDespachos); }
  async showDetalleDespacho() { return await this.detalleDespachos.toArray(); }
  async showDetalleDespachoById(id: number) { return await this.detalleDespachos.where('id').equals(id).first() }
  async clearDetalleDespacho() { await this.detalleDespachos.clear(); }
  async generarCodigo(): Promise<string> {
    const total = await this.requerimientos.count();
    const siguiente = total + 1;
    return siguiente.toString().padStart(6, '0');
  }
  //--------------------- Items ---------------------
  async saveItem(item: Item) { await this.items.put(item); }
  async saveItems(items: Item[]) { await this.items.bulkPut(items); }
  async showItems() { return await this.items.toArray(); }
  async showItemById(id: number) { return await this.items.where('id').equals(id).first() }
  async clearItems() { await this.items.clear(); }
  //--------------------- Comodities ---------------------
  async saveComodity(comodity: Comodity) { await this.comodities.put(comodity); }
  async saveComodities(comodities: Comodity[]) { await this.comodities.bulkPut(comodities); }
  async showComodities() { return await this.comodities.toArray(); }
  async showComodityById(id: number) { return await this.comodities.where('id').equals(id).first() }
  async clearComodities() { await this.comodities.clear(); }
  //--------------------- SubClasificaciones ---------------------
  async saveSubClasificacion(subClasificacion: SubClasificacion) { await this.subClasificaciones.put(subClasificacion); }
  async saveSubClasificaciones(subClasificaciones: SubClasificacion[]) { await this.subClasificaciones.bulkPut(subClasificaciones); }
  async showSubClasificaciones() { return await this.subClasificaciones.toArray(); }
  async showSubClasificacionById(id: number) { return await this.subClasificaciones.where('id').equals(id).first() }
  async clearSubClasificaciones() { await this.subClasificaciones.clear(); }
  //--------------------- Solicitudes de Compra ---------------------
  async saveSolicitudCompra(solicitud: SolicitudCompra) { return await this.solicitudesCompra.put(solicitud); }
  async showSolicitudesCompra() { return await this.solicitudesCompra.toArray(); }
  async showSolicitudCompraById(id: number) { return await this.solicitudesCompra.where('id').equals(id).first(); }
  async clearSolicitudesCompra() { await this.solicitudesCompra.clear(); }
  //--------------------- Cotizaciones ---------------------
  async saveCotizacion(cotizacion: Cotizacion) { return await this.cotizaciones.put(cotizacion); }
  async showCotizaciones() { return await this.cotizaciones.toArray(); }
  async showCotizacionesBySolicitud(solicitudId: number) { return await this.cotizaciones.where('solicitudCompraId').equals(solicitudId).toArray(); }
  async clearCotizaciones() { await this.cotizaciones.clear(); }
  //--------------------- Órdenes de Compra ---------------------
  async saveOrdenCompra(orden: OrdenCompra) { return await this.ordenesCompra.put(orden); }
  async showOrdenesCompra() { return await this.ordenesCompra.toArray(); }
  async showOrdenCompraById(id: number) { return await this.ordenesCompra.where('id').equals(id).first(); }
  async clearOrdenesCompra() { await this.ordenesCompra.clear(); }
  //--------------------- Stock ---------------------
  async saveStock(stock: Stock) { return await this.stock.put(stock); }
  async saveStocks(stocks: Stock[]) { return await this.stock.bulkPut(stocks); }
  async showStock() { return await this.stock.toArray(); }
  async showStockByAlmacen(almacen: string) { return await this.stock.where('almacen').equals(almacen).toArray(); }
  async updateStock(codigo: string, almacen: string, cantidad: number) {
    const stockItem = await this.stock.where(['codigo', 'almacen']).equals([codigo, almacen]).first();
    if (stockItem) {
      stockItem.cantidad += cantidad;
      return await this.stock.put(stockItem);
    }
    return null;
  }
  async clearStock() { await this.stock.clear(); }
  //--------------------- Movimientos de Stock ---------------------
  async saveMovimientoStock(movimiento: MovimientoStock) { return await this.movimientosStock.put(movimiento); }
  async showMovimientosStock() { return await this.movimientosStock.toArray(); }
  async clearMovimientosStock() { await this.movimientosStock.clear(); }
  //--------------------- Listas de Stock ---------------------
  async saveListaStock(lista: ListaStock) { return await this.listasStock.put(lista); }
  async showListasStock() { return await this.listasStock.toArray(); }
  async showListaStockById(id: number) { return await this.listasStock.where('id').equals(id).first(); }
  async showListasStockByAlmacen(almacen: string) { return await this.listasStock.where('almacen').equals(almacen).toArray(); }
  async clearListasStock() { await this.listasStock.clear(); }
  // 🔥 Une cabecera + detalles según idrequerimiento
  // async joinDetalle(cabeceraTable: any, detalleTable: any) {
  //   const cabeceras = await cabeceraTable.toArray();

  //   for (const r of cabeceras) {
  //     r.detalle = await detalleTable
  //       .where("idrequerimiento")
  //       .equals(r.idrequerimiento)
  //       .toArray();
  //   }

  //   return cabeceras;
  // }
  async joinDetalle(requerimientos: any[], detalles: any[]) {
    return requerimientos.map(req => {
      const det = detalles.filter(
        d => d.idrequerimiento === req.idrequerimiento
      );

      return {
        ...req,
        detalles: det
      };
    });
  }

  //--------------------- Maestras ---------------------
  async clearMaestras() {
    await this.clearUsuario();
    await this.clearFundos();
    await this.clearCultivos();
    await this.clearAcopios();
    await this.clearEmpresas();
    await this.clearProveedores();
    await this.clearTipoGastos();
    await this.clearCecos();
    await this.clearLabores();
    await this.clearTurnos();
    await this.clearAlmacenes();
    await this.clearAreas();
    await this.clearProyectos();
    await this.clearItemComoditys();
    await this.clearClasificaciones();
    await this.clearDetallesRequerimiento();
    await this.clearDetallesActivoFijo();
    await this.clearDetallesCommodity();
    await this.clearRequerimiento();
    await this.clearRequerimientoCommodity();
    await this.clearRequerimientoActivoFijo();
    await this.clearRequerimientoActivoFijoMenor();
    await this.clearMaestroItem();
    await this.clearMaestroCommodity();
    console.log('Todas las tablas de configuracion han sido limpiadas en indexedDB.');
  }
  //Configuracion
  async saveConfiguracion(configuracion: Configuracion) { await this.configuracion.put(configuracion); }
  async obtenerConfiguracion() { return await this.configuracion.toArray(); }
  async obtenerPrimeraConfiguracion() { return await this.configuracion.toCollection().first(); }
  async clearConfiguracion() { await this.configuracion.clear(); }
  // CECO
  async getCecoById(id: string) { return await this.cecos.where('id').equals(id).first(); }
  // PROYECTO (busca por AFE)
  async getProyectoByAfe(afe: string) { return await this.proyectos.where('afe').equals(afe).first(); }
  // LABOR
  async getLaborById(idlabor: string) { return await this.labores.where('idlabor').equals(idlabor).first(); }
  // DESPACHO COMPLETO CON TRANSACCION
  async confirmarDespachoCompleto(
    despacho: Despacho,
    detalles: DetalleDespacho[],
    usuario: string,
    requerimiento: any
  ): Promise<number> {

    return await this.transaction(
      'rw',
      [
        this.despachos,
        this.detalleDespachos,
        this.stock,
        this.movimientosStock,
        this.requerimientos
      ],
      async () => {

        // 1️⃣ Guardar despacho
        const despachoId = await this.despachos.add(despacho);

        // 2️⃣ Detalle + stock + movimiento
        for (const d of detalles) {

          await this.detalleDespachos.add({
            ...d,
            despachoId
          });

          const stockItem = await this.stock
            .where('[codigo+almacen]')
            .equals([d.codigo, despacho.almacen])
            .first();

          if (!stockItem || stockItem.cantidad < d.cantidad) {
            throw new Error(`Stock insuficiente para ${d.codigo}`);
          }

          stockItem.cantidad -= d.cantidad;
          await this.stock.put(stockItem);

          await this.movimientosStock.add({
            fecha: new Date().toISOString(),
            tipo: 'SALIDA',
            codigo: d.codigo,
            almacenOrigen: despacho.almacen,
            cantidad: d.cantidad,
            usuario
          });
        }

        // 3️⃣ Actualizar requerimiento
        requerimiento.estado = 'DESPACHADO_COMPLETO';
        requerimiento.despachado = true;

        await this.requerimientos.put(requerimiento);

        return despachoId;
      }
    );
  }
}