
export interface Usuario {
    id: string;
    sociedad: number;
    idempresa: string;
    ruc: string;
    razonSocial: string;
    idProyecto: string;
    proyecto: string;
    documentoidentidad: string;
    usuario: string;
    clave: string;
    nombre: string;
    idrol: string;
    rol: string;
}

export interface Configuracion {
    id: string;
    idempresa: string;
    idfundo: string;
    idcultivo: string;
    idarea: string;
    idalmacen: string;
    idproyecto?: string;
    idacopio: number;
    idceco: string;
    idlabor: string;
    iditem: string;
    idturno: string;
    idclasificacion: string;
    idgrupolabor: string;
    idproveedor: string;
    idtipoGasto: string;
    idactivoFijo: string;
}

export interface Empresa {
    id: string;
    idempresa: string;
    ruc: string;
    razonsocial: string;
    empresa: number;
}

export interface Fundo {
    id: number;
    fundo: number;
    empresa: number;
    codigoFundo: string;
    nombreFundo: string
}

export interface Almacen {
    id: number;
    idalmacen: number;
    almacen: string
}

export interface Area {
    idarea: number;
    ruc: string;
    descripcion: number;
    estado: number
}

export interface Proyecto {
    id: number;
    ruc: string;
    afe: string;
    proyectoio: string;
    esinverison: number;
    estado: number
}

export interface Cultivo {
    id: number;
    empresa: number;
    codigo: string;
    descripcion: string;
    estado: number;
}

export interface Acopio {
    id: string;
    nave: string;
    codigoAcopio: string;
    acopio: string;
    estado: number;
}

export interface Ceco {
    id: string;
    turno: string;
    costcenter: string;
    localname: string;
    conturno: string;
    esinversion: number;
    nombreTurno: string;
    modulo: number;
    idcultivo: string;
    idproyecto: string;
}

export interface Labor {
    id: string;
    idgrupolabor: string;
    ceco: string;
    idlabor: string;
    labor: string;
}


export interface Labor{
    id: string;
    idlabor: string;
    ceco: string;
    labor: string;
    estado: number;
}

export interface GrupoLabor{
    id : string;
    LocalName: string;
    CostCenterDestinationGroup: string;
}

export interface Turno {
    id: number;
    turno: number;
    codTurno: string;
    nombreTurno: string;
    idcultivo: string;
    idproyecto: string;
    conturno: string;
    estado: number;
}

export interface ItemComodity {
    id: number;
    tipoclasificacion: string;
    codigo: string;
    descripcion: string;
}

export interface Clasificacion {
    id: number;
    idclasificacion: string;
    descripcion_clasificacion: string;
    tipoClasificacion: string;
}

export interface DetalleRequerimiento {
    id?: number;
    codigo: string;
    producto: string;
    cantidad: number;
    proyecto: string;
    ceco: string;
    turno: string;
    labor: string;
    esActivoFijo: boolean;
    activoFijo: string;
    estado: number;
}

export interface Requerimiento {
    id?: number;
    idrequerimiento: string;
    ruc: string;
    idfundo: string;
    idarea: string;
    idclasificacion: string;
    nrodocumento: string;
    idalmacen: string;
    idalmacendestino: string;
    idproyecto: string;
    fecha: string;
    almacen: string;
    glosa: string;
    tipo: string;
    estados: string;
    estado: number;
    detalle: DetalleRequerimiento[];
}

export interface RequerimientoCommodity {
    id?: number;
    idrequerimiento: string;
    proveedor: string;
    servicio: string;
    descripcion: string;
    ruc: string;
    idfundo: string;
    idarea: string;
    idclasificacion: string;
    nrodocumento: string;
    idalmacen: string;
    idalmacendestino: string;
    idproyecto: string;
    fecha: string;
    almacen: string;
    glosa: string;
    tipo: string;
    estados: string;
    estado: number;
    detalleCommodity: DetalleRequerimientoCommodity[];
}

export interface RequerimientoActivoFijo {
    id?: number;
    idrequerimiento: string;
    proveedor: string;
    servicio: string;
    descripcion: string;
    ruc: string;
    idfundo: string;
    idarea: string;
    idclasificacion: string;
    nrodocumento: string;
    idalmacen: string;
    idalmacendestino: string;
    idproyecto: string;
    fecha: string;
    almacen: string;
    glosa: string;
    tipo: string;
    estados: string;
    estado: number;
    detalleActivoFijo: DetalleRequerimientoActivoFijo[];
}

export interface DetalleRequerimientoActivoFijo {
    id?: number;
    // codigo: string;
    descripcion: string;
    // producto: string;
    proveedor: string;
    cantidad: number;
    proyecto: string;
    ceco: string;
    turno: string;
    labor: string;
    estado: number;
    esActivoFijo: boolean;
    activoFijo: string;
}

export interface DetalleRequerimientoActivoFijoMenor {
    id?: number;
    // codigo: string;
    descripcion: string;
    // producto: string;
    proveedor: string;
    cantidad: number;
    proyecto: string;
    ceco: string;
    turno: string;
    labor: string;
    estado: number;
    esActivoFijo: boolean;
    activoFijo: string;
}

export interface DetalleRequerimientoCommodity {
    id?: number;
    // codigo: string;
    descripcion: string;
    // servicio: string;
    // producto: string;
    proveedor: string;
    cantidad: number;
    proyecto: string;
    ceco: string;
    turno: string;
    labor: string;
    estado: number;
    esActivoFijo: boolean;
    activoFijo: string;
}

export interface RequerimientoActivoFijoMenor {
    id?: number;
    idrequerimiento: string;
    descripcion: string;
    ruc: string;
    servicio: string;
    idfundo: string;
    idarea: string;
    idclasificacion: string;
    nrodocumento: string;
    idalmacen: string;
    idalmacendestino: string;
    idproyecto: string;
    fecha: string;
    almacen: string;
    glosa: string;
    tipo: string;
    estados: string;
    estado: number;
    detalleActivoFijoMenor: DetalleRequerimientoActivoFijoMenor[];
}

export interface RequerimientoActivoFijo {
    id?: number;
    idrequerimiento: string;
    ruc: string;
    idfundo: string;
    idarea: string;
    idclasificacion: string;
    nrodocumento: string;
    idalmacen: string;
    idalmacendestino: string;
    idproyecto: string;
    fecha: string;
    almacen: string;
    glosa: string;
    tipo: string;
    estados: string;
    estado: number;
    detalleActivoFijo: DetalleRequerimientoActivoFijo[];
}

export interface RequerimientoCommodity {
    id?: number;
    idrequerimiento: string;
    ruc: string;
    idfundo: string;
    idarea: string;
    idclasificacion: string;
    nrodocumento: string;
    idalmacen: string;
    idalmacendestino: string;
    idproyecto: string;
    fecha: string;
    almacen: string;
    glosa: string;
    tipo: string;
    estados: string;
    estado: number;
    detalleCommodity: DetalleRequerimientoCommodity[];
}

export interface Trabajador {
    id: string
    ruc: string
    nrodocumento: string
    nombres: string
    apellidopaterno: string
    apellidomaterno: string
    estado: number
    motivo: string
    bloqueado: number
    eliminado: number
    idmotivo: number
    motivosalida: number
}

export interface TrabajadorPlanilla {
    nrodocumento: string
    nombre: string
    fechatareo: string
    idfundo: number
    idcultivo: number
    idacopio: number
    hora_inicio: string
    fecha_fintareo: string
    hora_fin: string
    horas: number
    fecha_iniciorefrigerio: string
    hora_iniciorefrigerio: string
    fecha_finrefrigerio: string
    hora_finrefrigerio: string
    horas_refrigerio: number
    turno: string
    motivosalida: string
    disabled: boolean
    checked: boolean
    eliminado: number
    estado: number
    cerrado: boolean
    bloqueado: number
    idmotivocierre: number
    fecha_compensa: string
    nombreTurno: string
    labores: LaborPlanilla[]
}

export interface LaborPlanilla {
    idlabor: string
    labor: string
    idceco: string
    ceco: string
    idturno: string
    tipo: number
    horas: number
}

export interface IncidenciaPersona {
    iddetalleincidencia: string,
    fecharegistro: string,
    iddocumento: string,
    serie: string,
    nrodocumento: string,
    fechainicio: string,
    fechafin: string,
    anular: number,
    usuario_aprueba: string,
    idaprobacion: string,
    glosa: string,
    pdf64: string,
    idincidencia: string,
    nombrePersona: string,
    nombreIncidencia: string,
    aprobado: number,
    checked: false,
    estado: number
}

export interface TareoAsistencia {
    idtareo_asistencia: string;
    ruc: string;
    nrodocumentosupervisor: string;
    fecha: string;
    tipo: number;
    fundo: number;
    codfundo: string;
    cultivo: number;
    codcultivo: string;
    planilla: TrabajadorPlanilla[];
}

export interface PlanillasAdicional {
    id: string
    ruc: string
    nrodocumentosupervisor: string
    idfundo: number
    codfundo: string
    idcultivo: number
    codcultivo: string
    idacopio: number
    fechatareo: string
    hora_inicio: string
    fecha_fintareo: string
    hora_fin: string
    horas: number
    idceco: number
    ceco: string
    idlabor: number
    labor: string
    idturno: string
    estado: number
    eliminado: number
    tipo: number
    trabajadores: Trabajador[]
}

export interface PersonaFlujoAprobacion {
    id: string
    ruc: string
    usuario: string
    nrodocumento: string
    nombrePersona: string
    rol: string
    idrol: string
    movimientos: []
}

export interface AprobacionRequest {
  requerimientoId: number;
  tipo: string;
  usuario: string;
  accion: 'APROBAR' | 'RECHAZAR';
  motivo: string;
}

export interface Item {
    id: number;
    codigo: string;
    descripcionLocal: string;
    descripcionCompleta: string;
    unidadMedida: string;
    unidadCompra: string;
    unidadEmbalaje: string;
    estado: string;
    tipoclasificacion: string;
}

export interface Comodity {
    id: number;
    tipoclasificacion: string;
    codigo: string;
    descripcion: string;
    estado?: string;  // 'A' for Active, 'I' for Inactive
}

export interface SubClasificacion {
  id: number;             // PK (generado)
  comodityId: number;     // FK al commodity
  subClase?: string;
  descripcion?: string;
  unidad?: string;
  cuentaGasto?: string;
  elementoGasto?: number | string;
  clasificacionActivo?: string;
  legacyNumber?: string;
}

export interface Proveedor {
    id: number;
    TipoPersona: string;
    documento: string;
    ruc: string;
    Estado: string;
    TipoPago: string;
    MonedaPago: string;
    detraccion: string;
    TipoServicio: string;
}

export interface TipoGasto {
    codigo: string;
    descripcion: string;
}

export interface ActivoFijo {
    id: number;
    codigo: string;
    descripcion: string;
    codigoInterno: string;
    ubicacion: string;
    ceco: string;
    localName: string;
    tipoActivo: string;
    Estado: string;
    activo_descripcion?: string;
}

export interface MaestroItem {
    id: number;
    item: string,
    itemTipo: string,
    linea: string,
    familia: string,
    subFamilia: string,
    descripcionLocal: string,
    descripcionIngles: string,
    descripcionCompleta: string,
    unidadCodigo: string,
    monedaCodigo: string,
    precioCosto: string,
    precioUnitarioLocal: string,
    precioUnitarioDolares: string,
    itemPrecioFlag: string,
    disponibleVentaFlag: string,
    itemProcedencia: string,
    manejoxLoteFlag: string,
    manejoxSerieFlag: string,
    manejoxKitFlag: string,
    afectoImpuestoVentasFlag: string,
    requisicionamientoAutomaticoFl: string,
    disponibleTransferenciaFlag: string,
    disponibleConsumoFlag: string,
    formularioFlag: string,
    manejoxUnidadFlag: string,
    isoAplicableFlag: string,
    cantidadDobleFlag: string,
    unidadReplicacion: string,
    cuentaInventario: string,
    cuentaGasto: string,
    cuentaServicioTecnico: string,
    factorEquivalenciaComercial: string,
    estado: string,
    ultimaFechaModif: string,
    ultimoUsuario: string,
    cuentaVentas: string,
    unidadCompra: string,
    controlCalidadFlag: string,
    cuentaTransito: string,
    cantidadDobleFactor: string,
    subFamiliaInferior: string,
    stockMinimo: string,
    stockMaximo: string,
    referenciaFiscalIngreso02: string
}

export interface MaestroCommodity{
    id: number;
    commodity01: string,
    clasificacion: string,
    codigoBarrasFlag: string,
    // commodity02: string,
    // commodity: string,
    descripcionLocal: string,
    descripcionIngles: string,
    // unidadporDefecto: string,
    // cuentaContableGasto: string,
    // elementoGasto: string,
    // clasificacionActivo: string,
    estado: string,
    ultimoUsuario: string,
    ultimaFechaModif: string,
    // montoReferencial: string,
    // montoReferencialMoneda: string,
    // descripcionEditableFlag: string,
    // igvExoneradoFlag: string  
}

export interface MaestroSubCommodity{
    id?: number;
    commodity01: string,
    commodity02: string,
    commodity: string,
    descripcionLocal: string,
    descripcionIngles: string,
    unidadporDefecto: string,
    cuentaContableGasto: string,
    elementoGasto: string,
    clasificacionActivo: string,
    estado: string,
    ultimoUsuario: string,
    montoReferencial: string,
    montoReferencialMoneda: string,
    descripcionEditableFlag: string,
    igvExoneradoFlag: string
}
