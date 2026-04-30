import { exp } from '@tensorflow/tfjs';

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
  // Campos para aprobaciones por área (opcionales)
  idarea?: string;
  nombreArea?: string;
  esJefeArea?: boolean;
  rolArea?: string;
}

export interface Perfil {
  id: string;
  idperfil: string;
  descripcion: string;
  estado: string;
}

export interface FlujoAprobacion {
  id: string;
  idflujo: string;
  descripcion: string;
  estado: string;
  niveles: FlujoAprobacionNivel[];
}

export interface FlujoAprobacionNivel {
  id: string;
  idflujo: string;
  nivel: number;
  descripcion: string;
  idrol: string;
  rol: string;
  estado: string;
}

export interface FlujoAprobacionPersona {
  id: string;
  idflujo: string;
  nivel: number;
  usuario: string;
  nombrePersona: string;
  rol: string;
  idrol: string;
  estado: string;
}

export interface AsignacionPerfil {
  id: string;
  idusuario: string;
  idperfil: string;
  perfil: string;
  estado: string;
}

export interface AsignacionFlujo {
  id: string;
  idusuario: string;
  idflujo: string;
  flujo: string;
  estado: string;
}

export interface EmpresaUsuario {
  id: string;
  idusuario: string;
  idempresa: string;
  empresa: string;
  estado: string;
}

export interface UsuarioAdmin {
  id: string;
  usuario: string;
  nombre: string;
  documentoidentidad: string;
  ruc: string;
  razonSocial: string;
  perfil: string;
  flujo: string;
  estado: string;
  esUsuarioSistema: boolean;
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
  nombreFundo: string;
}

export interface Almacen {
  id: number;
  idalmacen: string;
  almacen: string;
}

export interface AlmacenDestino {
  id: number;
  idalmacen: number;
  almacen: string;
}

export interface Area {
  idarea: number;
  ruc: string;
  descripcion: number;
  estado: number;
}

export interface Proyecto {
  id: number;
  ruc: string;
  afe: string;
  proyectoio: string;
  esinverison: number;
  idlabor: string;
  estado: number;
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
  almacen: string;
  um: string;
}

export interface Clasificacion {
  id: number;
  idclasificacion: string;
  descripcion_clasificacion: string;
  tipoClasificacion: string;
}

export interface DetalleRequerimiento {
  id?: number; // ID de Dexie (autogenerado)
  idOriginal?: number; // ID original de LOGISTICA_DReq
  idrequerimiento: string;
  codigo: string;
  // producto: string;
  producto: any;
  descripcion: string;
  cantidad: number;
  unidadMedida: string; // Unidad de medida del producto
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
  disabled: boolean;
  checked: boolean;
  eliminado: number; // 0 = no, 1 = sí
  modificado?: number; // 0 = no, 1 = sí
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
  disabled: boolean;
  checked: boolean;
  eliminado: number; // 0 = no, 1 = sí
  modificado?: number; // 0 = no, 1 = sí
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
  disabled: boolean;
  checked: boolean;
  eliminado: number; // 0 = no, 1 = sí
  modificado?: number; // 0 = no, 1 = sí
  detalle?: DetalleRequerimientoActivoFijoMenor[]; // del backend
  detalleActivoFijoMenor: DetalleRequerimientoActivoFijoMenor[];
}

export interface DistribucionContable {
  Secuencia?: number;
  Linea: number;
  cuenta: string; // Account
  afe?: string;
  monto: number;
  cecoDestino?: string;
}

export interface PersonaFlujoAprobacion {
  id: string;
  ruc: string;
  usuario: string;
  nrodocumento: string;
  nombrePersona: string;
  rol: string;
  idrol: string;
  movimientos: [];
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
  estado?: string; // 'A' for Active, 'I' for Inactive
}

export interface SubClasificacion {
  id: number; // PK (generado)
  comodityId: number; // FK al commodity
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
  item: string;
  itemTipo: string;
  linea: string;
  familia: string;
  subFamilia: string;
  descripcionLocal: string;
  descripcionIngles: string;
  descripcionCompleta: string;
  unidadCodigo: string;
  monedaCodigo: string;
  precioCosto: string;
  precioUnitarioLocal: string;
  precioUnitarioDolares: string;
  itemPrecioFlag: string;
  disponibleVentaFlag: string;
  itemProcedencia: string;
  manejoxLoteFlag: string;
  manejoxSerieFlag: string;
  manejoxKitFlag: string;
  afectoImpuestoVentasFlag: string;
  requisicionamientoAutomaticoFl: string;
  disponibleTransferenciaFlag: string;
  disponibleConsumoFlag: string;
  formularioFlag: string;
  manejoxUnidadFlag: string;
  isoAplicableFlag: string;
  cantidadDobleFlag: string;
  unidadReplicacion: string;
  cuentaInventario: string;
  cuentaGasto: string;
  cuentaServicioTecnico: string;
  factorEquivalenciaComercial: string;
  estado: string;
  ultimaFechaModif: string;
  ultimoUsuario: string;
  cuentaVentas: string;
  unidadCompra: string;
  controlCalidadFlag: string;
  cuentaTransito: string;
  cantidadDobleFactor: string;
  subFamiliaInferior: string;
  stockMinimo: string;
  stockMaximo: string;
  referenciaFiscalIngreso02: string;
}

export interface MaestroCommodity {
  id: number;
  commodity01: string;
  clasificacion: string;
  codigoBarrasFlag: string;
  // commodity02: string,
  // commodity: string,
  descripcionLocal: string;
  descripcionIngles: string;
  // unidadporDefecto: string,
  // cuentaContableGasto: string,
  // elementoGasto: string,
  // clasificacionActivo: string,
  estado: string;
  ultimoUsuario: string;
  ultimaFechaModif: string;
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
  igvExoneradoFlag: string;
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
  stockDisponible?: number;
  stockActual?: number;
  stockComprometido?: number;
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

export interface SolicitudCompra {
  id?: number;
  idSolicitud?: number; // ID asignado por el backend al sincronizar
  numeroSolicitud: string;
  fecha: string;
  fechaEnvio?: string;
  fechaAprobacion?: string;
  tipo: 'CONSOLIDADA' | 'DIRECTA' | 'URGENTE';
  almacen: string;
  usuarioSolicita: string;
  nombreSolicita: string;
  sincronizado?: boolean; // Flag para indicar si está sincronizada con el backend
  usuarioAprueba?: string;
  estado:
    | 'GENERADA'
    | 'ENVIADA'
    | 'APROBADA'
    | 'RECHAZADA'
    | 'EN_COTIZACION'
    | 'ORDEN_GENERADA';
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
  cantidadAprobada?: number;
  cantidadAtendida?: number;
  unidadMedida: string;
  precioReferencial?: number;
  moneda?: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ATENDIDO';
  fechaRequerida?: string;
  centroCosto?: string;
  ceco?: string;
  turno?: string;
  labor?: string;
  proyecto?: string;
  observaciones?: string;
  requerimientosOrigen?: string;
  montoReferencial?: number;
}

export interface SolicitudCompraAdjunto {
  idAdjunto?: number;
  idSolicitud?: number;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo?: string;
  tamanoArchivo?: number;
  descripcion?: string;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  activo?: boolean;
  contenidoBase64?: string; // Contenido del archivo en base64
  file?: File; // Para el archivo temporal antes de subir
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
  idSolicitudCotizacion?: number; // FK a solicitud de cotización
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
  estado: 'RECIBIDA' | 'EN_EVALUACION' | 'SELECCIONADA' | 'RECHAZADA' | 'ORDEN_GENERADA';
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
  estado:
    | 'GENERADA'
    | 'ENVIADA'
    | 'CONFIRMADA'
    | 'EN_PROCESO'
    | 'RECIBIDA_PARCIAL'
    | 'RECIBIDA_TOTAL'
    | 'APROBADA'
    | 'RECHAZADA'
    | 'CANCELADA';
  estadoAprobacion?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  requiereAprobacion?: boolean;
  nivelAprobacionActual?: number;
  nivelesAprobacionTotal?: number;
  fechaAprobacionTotal?: string;
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
  unidadMedida: string; // Unidad de medida del producto
  turno: string;
  proyecto: string;
  ceco: string;
  activofijo: string;
  errores: ErrorExcel[];
  error: boolean;
}

export interface DevolucionProveedor {
  id?: number;
  numeroDevolucion: string;
  recepcionId: number;
  numeroRecepcion: string;
  ordenCompraId: number;
  numeroOrden: string;
  proveedor: string;
  nombreProveedor: string;
  rucProveedor: string;
  fecha: string;
  motivo: string;
  tipoDevolucion: 'TOTAL' | 'PARCIAL';
  detalle: DetalleDevolucion[];
  montoTotal: number;
  estado: 'REGISTRADA' | 'ENVIADA' | 'CONFIRMADA' | 'RESUELTA';
  resolucion?: 'REEMPLAZO' | 'NOTA_CREDITO' | 'DEVOLUCION_DINERO';
  fechaResolucion?: string;
  observaciones?: string;
  usuarioRegistra: string;
}

export interface DetalleDevolucion {
  id?: number;
  devolucionId: number;
  codigo: string;
  descripcion: string;
  cantidadDevuelta: number;
  cantidadRecibida: number;
  unidadMedida: string;
  precioUnitario: number;
  subtotal: number;
  motivoDetalle: string;
  lote?: string;
  estado: 'PENDIENTE' | 'REEMPLAZADO' | 'ACREDITADO';
}

export interface EvaluacionProveedor {
  id?: number;
  proveedor: string;
  nombreProveedor: string;
  rucProveedor: string;
  periodo: string; // YYYY-MM
  fechaEvaluacion: string;
  criterios: CriterioEvaluacionProveedor[];
  calificacionTotal: number;
  nivel: 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'DEFICIENTE';
  observaciones?: string;
  usuarioEvalua: string;
  estado: 'BORRADOR' | 'FINALIZADA';
}

export interface CriterioEvaluacionProveedor {
  id?: number;
  evaluacionId: number;
  criterio:
    | 'CALIDAD'
    | 'TIEMPO_ENTREGA'
    | 'PRECIO'
    | 'SERVICIO'
    | 'DOCUMENTACION';
  descripcion: string;
  peso: number; // Porcentaje de importancia (0-100)
  calificacion: number; // Puntuación (0-10)
  puntajePonderado: number; // calificacion * peso / 100
  comentarios?: string;
}

export type TipoRequerimiento = 'COMPRA' | 'CONSUMO';

export interface ItemTemporalConsolidacion {
  id?: number; // ID auto-generado por Dexie
  
  // Datos del item pendiente de consolidación
  idDetalle: number;
  item: string;
  descripcion: string;
  familia?: string;
  categoria?: string;
  cantidad: number;
  unidad: string;
  tipoRequerimiento: TipoRequerimiento; // 'COMPRA' | 'CONSUMO'
  requerimientoOrigen: string;
  fechaCreacion: string;
  estadoDetalleConsolidacion: string;

    // Datos adicionales opcionales
  codigoItem?: string;
  precioUnitario?: number;
  subtotal?: number;
  impuesto?: number;
  total?: number;
  marca?: string;
  modelo?: string;
  especificaciones?: string;
  
  // Datos de control
  fechaSeleccion?: string; // Fecha en que se agregó a la lista temporal
  seleccionado?: boolean; // Para UI
  
  // Datos del requerimiento origen
  idRequerimiento?: number;
  numeroRequerimiento?: string;
  
  // Metadatos
  observaciones?: string;
  estado?: string;
}

// =====================================================================
// SOLICITUDES DE COTIZACIÓN
// =====================================================================

export interface SolicitudCotizacion {
  id?: number;
  noSolicitud: string;                    // SOL-COT-2026-00001
  idConsolidacion?: number;               // FK a consolidación (si viene de consolidación)
  fechaGeneracion: string;
  fechaLimite?: string;                   // Fecha límite para recibir cotizaciones
  usuarioGenera: string;
  totalItems: number;
  estado: 'GENERADA' | 'PENDIENTE' | 'EN_REVISION' | 'CERRADA' | 'ANULADA';
  observaciones?: string;
  detalle: DetalleSolicitudCotizacionLegacy[];  // Usar legacy para compatibilidad
  cotizacionesRecibidas?: number;         // Contador de cotizaciones recibidas
  fechaModificacion?: string;
  usuarioModifica?: string;
  tipo?: 'COMPRA' | 'SERVICIO';           // Tipo de solicitud: COMPRA para items, SERVICIO para commodities
}

export interface DetalleSolicitudCotizacion {
  id?: number;
  idSolicitudCotizacion?: number;
  noLinea?: number;
  codigo: string;                        // Backend retorna 'codigo'
  descripcion: string;                   // Backend retorna 'descripcion'
  cantidad: string;                      // Backend retorna como string
  unidadMedida?: string;
  especificaciones?: string;              // Especificaciones técnicas del item
  estado?: 'ACTIVO' | 'ANULADO';
}

// Interfaz para compatibilidad con otros componentes que usan codigoItem/descripcionItem
export interface DetalleSolicitudCotizacionLegacy {
  id?: number;
  idSolicitudCotizacion?: number;
  noLinea?: number;
  codigoItem: string;                    // Usado por otros componentes
  descripcionItem: string;               // Usado por otros componentes
  cantidad: number;                      // Usado por otros componentes
  unidadMedida?: string;
  especificaciones?: string;
  estado?: 'ACTIVO' | 'ANULADO';
}

// =====================================================================
// SOLICITUDES DE SERVICIO
// =====================================================================

export interface SolicitudServicio {
  id?: number;
  numeroSolicitud: string;
  fecha: string;
  fechaEnvio?: string;
  fechaAprobacion?: string;
  tipo: 'MANTENIMIENTO' | 'REPARACION' | 'INSTALACION' | 'CONSULTORIA' | 'OTRO';
  area: string;
  usuarioSolicita: string;
  nombreSolicita: string;
  usuarioAprueba?: string;
  estado:
    | 'GENERADA'
    | 'ENVIADA'
    | 'APROBADA'
    | 'RECHAZADA'
    | 'EN_PROCESO'
    | 'COMPLETADA'
    | 'CANCELADA';
  descripcionServicio: string;
  observaciones?: string;
  motivoRechazo?: string;
  prioridad?: 'NORMAL' | 'URGENTE' | 'CRITICA';
  fechaRequerida?: string;
  montoEstimado?: number;
  moneda?: string;
  proveedor?: string;
  empresa?: string;
  adjuntos?: SolicitudServicioAdjunto[];
}

export interface SolicitudServicioAdjunto {
  idAdjunto?: number;
  idSolicitudServicio?: number;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo?: string;
  tamanoArchivo?: number;
  descripcion?: string;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  activo?: boolean;
  file?: File; // Para el archivo temporal antes de subir
}

// =============================================
// INTERFACES DE SEGUIMIENTO DE ORDENES DE SERVICIO
// PASO 3: Estructura de datos para tracking
// =============================================

/**
 * Representa un hito o tarea dentro de un servicio
 */
export interface HitoServicio {
  id?: number;
  descripcion: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado: 'PENDIENTE' | 'EN_EJECUCION' | 'COMPLETADO';
  porcentajeAvance: number; // 0-100
  observaciones?: string;
  responsable?: string;
}

/**
 * Estados posibles del seguimiento de una orden de servicio
 */
export type EstadoSeguimientoOS =
  | 'GENERADA'
  | 'ENVIADA'
  | 'ACEPTADA'
  | 'EN_EJECUCION'
  | 'FINALIZADA'
  | 'RECHAZADA';

/**
 * Seguimiento completo de una orden de servicio
 */
export interface SeguimientoOrdenServicio {
  id?: number;
  idOrdenServicio: number;
  numeroOrden: string;
  
  // Estados del flujo
  estado: EstadoSeguimientoOS;
  
  // Fechas de transición
  fechaGenerada?: string;
  fechaEnviada?: string;
  fechaAceptada?: string;
  fechaInicioEjecucion?: string;
  fechaFinalizacion?: string;
  
  // Porcentaje de avance (0-100)
  porcentajeAvance: number;
  
  // Usuarios responsables
  usuarioGenera: string;
  usuarioEjecuta?: string;
  usuarioFinaliza?: string;
  
  // Hitos del servicio
  hitos: HitoServicio[];
  
  // Conformidad final
  conformidadFinal?: 'CONFORME' | 'NO_CONFORME' | 'CONFORME_CON_OBSERVACIONES';
  calificacion?: number; // 1-5
  observacionesConformidad?: string;
  
  // Control de cambios
  fechaRegistro?: string;
  fechaActualizacion?: string;
  usuarioActualiza?: string;
  
  // Datos relacionados de la orden (opcionales, para UI)
  tipoServicio?: string;
  descripcionServicio?: string;
  proveedor?: string;
  nombreProveedor?: string;
  montoTotal?: number;
  moneda?: string;
}

/**
 * Orden de Servicio con seguimiento incluido
 * Extiende la estructura base agregando tracking
 */
export interface OrdenServicioConSeguimiento {
  id?: number;
  numeroOrden: string;
  solicitudServicioId?: number;
  cotizacionServicioId?: number;
  fecha?: string;
  estado: EstadoSeguimientoOS;
  tipoServicio: string;
  descripcion: string;
  alcance?: string;
  entregables?: string;
  proveedor: string;
  nombreProveedor: string;
  rucProveedor?: string;
  contactoProveedor?: string;
  telefonoProveedor?: string;
  emailProveedor?: string;
  fechaInicioServicio?: string;
  fechaFinServicio?: string;
  plazoEjecucion?: number;
  ubicacionServicio?: string;
  montoTotal: number;
  moneda: string;
  formaPago?: string;
  condicionesPago?: string;
  garantia?: string;
  penalidades?: string;
  centroCosto?: string;
  proyecto?: string;
  observaciones?: string;
  usuarioGenera: string;
  nombreUsuarioGenera?: string;
  fechaGenerada?: string;
  
  // Campos de seguimiento
  hitos?: HitoServicio[];
  porcentajeCompletado?: number;
  
  // Campos de conformidad
  conformidad?: 'CONFORME' | 'NO_CONFORME' | 'CONFORME_CON_OBSERVACIONES';
  calificacion?: number;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  observacionesConformidad?: string;
  entregablesRecibidos?: string;
  incidencias?: string;
  recomendaciones?: string;
  
  // Detalle de la orden
  detalle?: any[];
}

/**
 * DTO para actualizar seguimiento desde el frontend
 */
export interface ActualizarSeguimientoOSDTO {
  idOrdenServicio: number;
  nuevoEstado: EstadoSeguimientoOS;
  hitos?: HitoServicio[];
  observaciones?: string;
}

/**
 * DTO para registrar conformidad final
 */
export interface RegistrarConformidadOSDTO {
  idOrdenServicio: number;
  conformidad: 'CONFORME' | 'NO_CONFORME' | 'CONFORME_CON_OBSERVACIONES';
  calificacion: number; // 1-5
  observaciones: string;
}

// ============================================
// INTERFACES DE SEGUIMIENTO DE ORDENES DE COMPRA
// ============================================

/**
 * Estados del seguimiento de Órdenes de Compra
 */
export type EstadoSeguimientoOC =
  | 'GENERADA'
  | 'APROBADA'
  | 'CONFIRMADA'
  | 'EN_PROCESO'
  | 'RECIBIDA_PARCIAL'
  | 'RECIBIDA_TOTAL'
  | 'ANULADA';

/**
 * Hito de seguimiento para Órdenes de Compra
 */
export type EstadoHitoCompra = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';

export interface HitoCompra {
  descripcion: string;
  estado: EstadoHitoCompra;
  porcentajeAvance: number;
  fechaProgramada?: string;
  fechaEjecucion?: string;
  responsable?: string;
  observaciones?: string;
}

/**
 * Seguimiento de Orden de Compra
 */
export interface SeguimientoOrdenCompra {
  id: number;
  idOrden: number;
  numeroOrden: string;
  estado: EstadoSeguimientoOC;
  fechaGenerada?: string;
  fechaAprobada?: string;
  fechaConfirmada?: string;
  fechaInicioProceso?: string;
  fechaPrimeraRecepcion?: string;
  fechaRecepcionTotal?: string;
  porcentajeAvance: number;
  usuarioGenera: string;
  usuarioAprueba?: string;
  usuarioConfirma?: string;
  usuarioRecibe?: string;
  hitos?: HitoCompra[];
  fechaRegistro: string;
  fechaActualizacion?: string;
  usuarioActualiza?: string;
  proveedor?: string;
  nombreProveedor?: string;
  montoTotal?: number;
  almacen?: string;
}

export interface OrdenCompraConSeguimiento {
  id?: number;
  numeroOrden: string;
  solicitudCompraId?: number;
  fecha?: string;
  estado: EstadoSeguimientoOC;
  proveedor: string;
  nombreProveedor: string;
  rucProveedor?: string;
  montoTotal: number;
  moneda: string;
  fechaEntregaEstimada?: string;
  usuarioGenera: string;

  // Campos de seguimiento
  hitos?: HitoCompra[];
  porcentajeCompletado?: number;
  fechaGenerada?: string;
  fechaAprobada?: string;
  fechaConfirmada?: string;
  fechaInicioProceso?: string;
  fechaPrimeraRecepcion?: string;
  fechaRecepcionTotal?: string;
}

/**
 * DTO para actualizar seguimiento de OC
 */
export interface ActualizarSeguimientoOCDTO {
  idOrden: number;
  nuevoEstado: EstadoSeguimientoOC;
  usuario: string;
  hitos?: HitoCompra[];
}
