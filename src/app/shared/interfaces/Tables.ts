
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
    idTipoItem: string;
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

export interface AlmacenDestino {
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
    ccontable: string;
    nombreTurno: string;
    modulo: number;
    idcultivo: string;
    idproyecto: string;
}

export interface Labor {
    id: string;
    idlabor: string;
    ceco: string;
    labor: string;
    estado: number;
}

export interface GrupoLabor {
    id: string;
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
    idrequerimiento: string;
    codigo: string;
    // producto: string;
    producto: any;
    descripcion: string;
    cantidad: number;
    proyecto: string;
    ceco: string;
    turno: string;
    labor: string;
    esActivoFijo: boolean;
    activoFijo: string;
    estado: number;
    atendida?: string;
    // 🔥 NUEVO → DISTRIBUCIÓN CONTABLE
    distribucion?: DistribucionContable[];
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
    fecha: any;
    almacen: string;
    glosa: string;
    tipo: string;
    itemtipo: string;
    referenciaGasto: string;
    prioridad: string;
    estados: string;
    estado: number;
    disabled: boolean;
    checked: boolean;
    eliminado: number; // 0 = no, 1 = sí
    modificado?: number; // 0 = no, 1 = sí
    despachado: boolean;
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
    prioridad: string;
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
    detalle?: DetalleRequerimientoCommodity[]; // del backend
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
    prioridad: string;
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
    detalle?: DetalleRequerimientoActivoFijo[]; // del backend
    detalleActivoFijo: DetalleRequerimientoActivoFijo[];
}

export interface DetalleRequerimientoActivoFijo {
    id?: number;
    idrequerimiento: string;
    codigo: string;
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
    idrequerimiento: string;
    codigo: string;
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
    idrequerimiento: string;
    codigo: string;
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
    prioridad: string;
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
    detalle?: DetalleRequerimientoActivoFijoMenor[]; // del backend
    detalleActivoFijoMenor: DetalleRequerimientoActivoFijoMenor[];
}

export interface DistribucionContable {
  Secuencia?: number;
  Linea: number;
  cuenta: string;              // Account
  afe?: string;
  monto: number;
  cecoDestino?: string;
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

export interface MaestroCommodity {
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

export interface MaestroSubCommodity {
    id: number;
    commodity01: string;
    commodity02: string;
    commodity: string;
    descripcionLocal: string;
    descripcionIngles: string;
    unidadporDefecto: string;
    cuentaContableGasto: string;
    elementoGasto: string;
    clasificacionActivo: string;
    estado: string;
    ultimoUsuario: string;
    montoReferencial: string;
    montoReferencialMoneda: string;
    descripcionEditableFlag: string;
    igvExoneradoFlag: string
}


export interface ListaStock {
    id: number;
    nombre: string;
    descripcion: string;
    almacen: string;
    fecha: string;
    estado: string;
    usuarioCreador: string;
    detalle: DetalleListaStock[];
}

export interface DetalleListaStock {
    id: number;
    listaStockId: number;
    codigo: string;
    descripcion: string;
    stockInicial: number;
    stockActual: number;
    stockMinimo: number;
    stockMaximo: number;
    unidadMedida: string;
    estado: string;
}

export interface Stock {
    id?: number;
    codigo: string;
    almacen: string;
    cantidad: number;
    descripcion: string;
    unidadMedida: string;
    ultimaActualizacion: string;
}

export interface MovimientoStock {
    id?: number;
    fecha: string;
    tipo: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA' | 'AJUSTE';
    codigo: string;
    almacenOrigen?: string;
    almacenDestino?: string;
    cantidad: number;
    referenciaDocumento?: string;
    usuario: string;
    motivo?: string;
}

export interface Cotizacion {
    id?: number;
    ordenCompraId: number;
    proveedor: string;
    fecha: string;
    montoTotal: number;
    moneda: string;
    plazoEntrega: number;
    condicionesPago: string;
    validezOferta: number;
    items: DetalleCotizacion[];
    seleccionada: boolean;
    observaciones?: string;
}

export interface DetalleCotizacion2 {
    id?: number;
    cotizacionId2?: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
    impuesto: number;
    total: number;
}

export interface SolicitudCompra {
    id?: number;
    numeroSolicitud: string;
    fecha: string;
    fechaEnvio?: string;
    fechaAprobacion?: string;
    tipo: 'CONSOLIDADA' | 'DIRECTA' | 'URGENTE';
    almacen: string;
    usuarioSolicita: string;
    nombreSolicita: string;
    usuarioAprueba?: string;
    estado: 'GENERADA' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'EN_COTIZACION' | 'ORDEN_GENERADA';
    observaciones?: string;
    motivoRechazo?: string;
    detalle: DetalleSolicitudCompra[];
    requerimientosOrigen?: string; // IDs separados por coma
    montoEstimado?: number;
    moneda?: string;
    prioridad?: 'NORMAL' | 'URGENTE' | 'CRITICA';
    fechaRequerida?: string;
}

export interface DetalleSolicitudCompra {
    id: number;
    solicitudCompraId: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
    cantidadAprobada: number;
    cantidadAtendida: number;
    unidadMedida: string;
    precioReferencial?: number;
    montoReferencial?: number;
    proyecto?: string;
    ceco?: string;
    turno?: string;
    labor?: string;
    requerimientosOrigen?: string;
    especificacionesTecnicas?: string;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'PARCIAL';
    observaciones?: string;
}

export interface AprobacionSolicitud {
    id?: number;
    solicitudCompraId: number;
    numeroSolicitud: string;
    nivel: number;
    nombreNivel: string; // 'JEFE', 'GERENTE', 'FINANZAS'
    usuarioAprobador: string;
    nombreAprobador: string;
    fechaAprobacion?: string;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
    observaciones?: string;
    montoAprobado?: number;
}

export interface Cotizacion {
    id?: number;
    numeroCotizacion: string;
    solicitudCompraId: number;
    numeroSolicitud: string;
    proveedor: string;
    nombreProveedor: string;
    rucProveedor: string;
    fecha: string;
    fechaVencimiento: string;
    montoTotal: number;
    moneda: string;
    plazoEntrega: number; // días
    condicionesPago: string;
    validezOferta: number; // días
    formaPago: string;
    lugarEntrega: string;
    garantia?: string;
    observaciones?: string;
    detalle: DetalleCotizacion[];
    estado: 'RECIBIDA' | 'EN_EVALUACION' | 'SELECCIONADA' | 'RECHAZADA';
    seleccionada: boolean;
    motivoSeleccion?: string;
    motivoRechazo?: string;
    usuarioRegistra: string;
    usuarioEvalua?: string;
    fechaEvaluacion?: string;
}

export interface DetalleCotizacion {
    id?: number;
    cotizacionId: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
    unidadMedida: string;
    precioUnitario: number;
    descuento: number;
    porcentajeDescuento: number;
    subtotal: number;
    impuesto: number;
    porcentajeImpuesto: number;
    total: number;
    marca?: string;
    modelo?: string;
    especificaciones?: string;
    plazoEntrega?: number;
    observaciones?: string;
}

export interface ComparativoCotizaciones {
    id?: number;
    solicitudCompraId: number;
    numeroSolicitud: string;
    fecha: string;
    cotizaciones: number[]; // IDs de cotizaciones
    criteriosEvaluacion: CriterioEvaluacion[];
    recomendacion?: string;
    usuarioElabora: string;
    estado: 'EN_PROCESO' | 'FINALIZADO';
    observaciones?: string;
}

export interface CriterioEvaluacion {
    nombre: string; // 'PRECIO', 'CALIDAD', 'PLAZO_ENTREGA', 'GARANTIA', etc.
    peso: number; // Porcentaje de importancia
    puntajes: { [proveedorId: string]: number }; // Puntaje por proveedor
}

export interface OrdenCompra {
    id?: number;
    numeroOrden: string;
    solicitudCompraId: number;
    cotizacionId?: number;
    fecha: string;
    fechaEntrega: string;
    proveedor: string;
    nombreProveedor: string;
    rucProveedor: string;
    direccionEntrega: string;
    contactoProveedor?: string;
    telefonoProveedor?: string;
    correoProveedor?: string;
    montoTotal: number;
    moneda: string;
    formaPago: string;
    condicionesPago: string;
    plazoEntrega: number;
    garantia?: string;
    penalidades?: string;
    observaciones?: string;
    detalle: DetalleOrdenCompra[];
    estado: 'GENERADA' | 'ENVIADA' | 'CONFIRMADA' | 'EN_PROCESO' | 'RECIBIDA_PARCIAL' | 'RECIBIDA_TOTAL' | 'CANCELADA';
    usuarioGenera: string;
    usuarioAprueba?: string;
    fechaAprobacion?: string;
    archivoAdjunto?: string;
}

export interface DetalleOrdenCompra {
    id?: number;
    ordenCompraId: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
    cantidadRecibida: number;
    cantidadPendiente: number;
    unidadMedida: string;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
    impuesto: number;
    total: number;
    marca?: string;
    modelo?: string;
    especificaciones?: string;
    fechaEntregaEstimada?: string;
    estado: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO' | 'CANCELADO';
    observaciones?: string;
}

export interface RecepcionOrdenCompra {
    id?: number;
    numeroRecepcion: string;
    ordenCompraId: number;
    numeroOrden: string;
    fecha: string;
    almacen: string;
    detalle: DetalleRecepcion[];
    observaciones?: string;
    conformidad: boolean;
    usuarioRecibe: string;
    estado: 'PARCIAL' | 'COMPLETA';
}

export interface DetalleRecepcion {
    id?: number;
    recepcionId: number;
    detalleOrdenCompraId: number;
    codigo: string;
    descripcion: string;
    cantidadOrdenada: number;
    cantidadRecibida: number;
    cantidadAceptada: number;
    cantidadRechazada: number;
    motivoRechazo?: string;
    observaciones?: string;
    lote?: string;
    fechaVencimiento?: string;
    estado: 'CONFORME' | 'NO_CONFORME';
}

export interface Nivel {
    idNivel: number;
    descripcion: string;
    orden: number;
    estado?: boolean;
}

export interface TipoDocumento {
    idTipoDocumento: number;
    codigo: string;
    descripcion: string;
    estado?: boolean;
}

export interface Aprobador {
    idAprobador?: number;
    dni: string;
    nombres: string;
    correo?: string;
    idNivel: number;
    idTipoDocumento: number;
    activo?: boolean;
    fechaRegistro?: string;
}

export interface Despacho {
    id?: number;
    numeroDespacho: string;
    fecha: string;
    almacen: string;
    detalle: DetalleDespacho[];
    observaciones?: string;
    usuarioDespacha: string;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

export interface DetalleDespacho {
    id?: number;
    despachoId: number;
    detalleRecepcionId: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
    unidadMedida: string;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
    impuesto: number;
    total: number;
    marca?: string;
    modelo?: string;
    especificaciones?: string;
    fechaEntregaEstimada?: string;
    estado: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO' | 'CANCELADO';
    observaciones?: string;
}

export interface ErrorExcel {
  columna: string;
  mensaje: string;
}

export interface DetalleExcelPreview {
  codigo: string;
  descripcion: string;
  cantidad: number;
  turno: string;
  proyecto: string;
  ceco: string;
  activofijo: string;
  errores: ErrorExcel[];
  error: boolean;
}