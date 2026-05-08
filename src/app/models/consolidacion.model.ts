// =============================================
// Modelos para Consolidación de Requerimientos (Consumo + Compra)
// =============================================

// --- Item pendiente de consolidar (listado unificado) ---
export interface ItemPendienteConsolidacion {
  idDetalle: number;
  item: string;
  descripcion: string;
  familia: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  tipoRequerimiento: 'COMPRA' | 'CONSUMO';
  requerimientoOrigen: string;
  fechaCreacion: string;
  estadoDetalleConsolidacion: string;
  seleccionado?: boolean;
}

// --- Filtros para listar pendientes ---
export interface FiltroConsolidacion {
  familia?: string[];
  categoria?: string[];
  item?: string;
  fechaInicio?: string;
  fechaFin?: string;
  tipo?: string;
  empresa?: string;
}

// --- Request para crear consolidación ---
export type TipoRequerimiento = 'COMPRA' | 'CONSUMO';

export interface CrearConsolidacionRequest {
  usuario: string;
  itemsSeleccionados: ItemSeleccionado[];
}

export interface ItemSeleccionado {
  idDetalle: number;
  tipo: TipoRequerimiento;
}

// --- Respuesta de creación ---
export interface CrearConsolidacionResponse {
  success: boolean;
  idConsolidacion: number;
  codigo: string;
  mensaje: string;
  totalItems: number;
  usuario: string;
  fechaConsolidacion: string;
  errorCodigo?: number;
}

// --- Cabecera de consolidación (historial) ---
export interface ConsolidacionCab {
  idConsolidacion: number;
  codigo: string;
  fechaConsolidacion: string;
  estado: string;
  usuarioCreador: string;
  observaciones?: string;
  totalItems: number;
  estadoProceso?: string;
  totalLineas?: number;
  detalles?: ConsolidacionDet[];
}

// --- Detalle de consolidación ---
export interface ConsolidacionDet {
  idDetConsolidacion: number;
  noLinea: number;
  codigoItem: string;
  descripcionItem: string;
  familia: string;
  categoria: string;
  cantidadTotal: number;
  unidadMedida: string;
  tipo?: string; // 'ITEM' o 'COMMODITY' para identificar si es item o servicio
  origenes?: ConsolidacionOrigen[];
  ceco?: string;     // Centro de costo del requerimiento origen
  proyecto?: string; // Proyecto del requerimiento origen
}

// --- Origen de cada línea consolidada ---
export interface ConsolidacionOrigen {
  idOrigen: number;
  tipoOrigen: 'COMPRA' | 'CONSUMO';
  requerimientoOrigen: string;
  idDetalleOrigen: number;
  cantidadConsolidada: number;
  fechaConsolidacion: string;
  usuarioConsolida: string;
}

// --- Filtros para historial ---
export interface FiltroHistorial {
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
}

// --- Request para generar solicitud de cotización ---
export interface GenerarSolicitudCotizacionRequest {
  idConsolidacion: number;
  usuario: string;
  observaciones?: string;
  proveedores?: string[];
}

// --- Respuesta de generar solicitud cotización ---
export interface GenerarSolicitudCotizacionResponse {
  success: boolean;
  noSolicitud: string;
  mensaje: string;
  totalItems: number;
}

// --- Request para anular consolidación ---
export interface AnularConsolidacionRequest {
  idConsolidacion: number;
  usuario: string;
  motivo: string;
}

// --- Respuesta de anular consolidación ---
export interface AnularConsolidacionResponse {
  success: boolean;
  mensaje: string;
}

// --- Request para anular línea específica de una consolidación ---
export interface AnularLineaConsolidacionRequest {
  idConsolidacion: number;
  idDetConsolidacion: number;
  usuario: string;
  motivo: string;
}

// --- Respuesta de anular línea ---
export interface AnularLineaConsolidacionResponse {
  success: boolean;
  mensaje: string;
  consolidacionAnulada: boolean; // true si todas las líneas fueron anuladas
}

// --- Request para anular item pendiente (antes de consolidar) ---
export interface AnularItemPendienteRequest {
  idDetalle: number;
  tipoRequerimiento: 'COMPRA' | 'CONSUMO';
  usuario: string;
  motivo: string;
}

// --- Respuesta de anular item pendiente ---
export interface AnularItemPendienteResponse {
  success: boolean;
  mensaje: string;
}

// --- Request para registrar saldo pendiente de aprobación (desde despacho) ---
export interface RegistrarSaldoPendienteRequest {
  idrequerimiento: number;
  requerimientoNumero: string;
  usuario: string;
  usuarioCreador: string;
  ceco: string;
  items: SaldoPendienteItem[];
}

export interface SaldoPendienteItem {
  codigo: string;
  descripcion: string;
  cantidadSolicitada: number;
  cantidadDespachada: number;
  saldoPendiente: number;
  unidadMedida: string;
}

// --- Respuesta de registrar saldo pendiente ---
export interface RegistrarSaldoPendienteResponse {
  success: boolean;
  mensaje: string;
  idSolicitud: number;
}

// --- Saldo pendiente de aprobación (listado para jefatura) ---
export interface SaldoPendienteAprobacion {
  idSolicitud: number;
  idrequerimiento: number;
  requerimientoNumero: string;
  fechaSolicitud: string;
  usuarioSolicita: string;
  usuarioCreador: string;
  ceco: string;
  estado: string; // PENDIENTE | APROBADO | RECHAZADO
  items: SaldoPendienteItem[];
  totalItems: number;
}

// --- Request para aprobar/rechazar saldo pendiente ---
export interface AprobarRechazarSaldoPendienteRequest {
  idSolicitud: number;
  accion: 'APROBAR' | 'RECHAZAR';
  usuario: string;
  motivo?: string;
}

export interface AprobarRechazarSaldoPendienteResponse {
  success: boolean;
  mensaje: string;
}

export interface MigrarSaldoDirectoConsolidacionRequest {
  items: ItemPendienteConsolidacion[];
}

export interface MigrarSaldoDirectoConsolidacionResponse {
  success: boolean;
  mensaje: string;
  totalItems?: number;
}
