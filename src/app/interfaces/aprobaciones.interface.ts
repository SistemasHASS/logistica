export interface UsuarioPorArea {
  documentoidentidad: string;
  nombreCompleto: string;
  rol: string;
  esJefeArea: number;
  esAprobador: number;
  email: string;
  telefono: string;
  nombreArea: string;
  nombreSubarea?: string;
}

export interface AprobadorAsignado {
  aprobadorAsignado: string;
  nombreAprobador: string;
  rolAprobador: string;
  secuencia: number;
  requiereAprobacion: number;
}

export interface FlujoAprobacion {
  secuencia: number;
  rolAprobador: string;
  requiereAprobacion: number;
  montoMinimo: number;
  montoMaximo: number | null;
}

export interface RequerimientoPendiente {
  idrequerimiento: string;  // Corregido: minúscula como viene del API
  RequisicionNumero?: string;  // Agregado
  ruc?: string;
  idarea: string | number;  // Puede ser string o number
  tipoRequerimiento?: string;
  descripcion?: string;
  glosa?: string;
  documentoidentidad_creador?: string;
  nombreCreador?: string;
  fechaCreacion?: string;
  fecha?: string;  // Agregado
  dniregistra?: string;  // Agregado
  nombreSolicitante?: string;  // Agregado
  estado?: string;
  estados?: string;  // Agregado
  dniJefeArea?: string;
  nombreJefeArea?: string;
  estadoArea?: string;
  fechaAsignacionArea?: string;
  nombreArea?: string;
  nombreAreaSolicitante?: string;  // Agregado
  urgencia?: string;
  tiempoEspera?: number;
  totalItems?: number;  // Agregado
  estadoDescripcion?: string;  // Agregado
  puedeAprobar?: number;  // Agregado
  detalles?: any[];  // Agregado - Detalles de ítems
  detalle?: any[];  // Agregado - Para compatibilidad con Mis Requerimientos
}

export interface RequerimientoConAprobacion {
  idrequerimiento: string;  // Corregido: string como viene del API
  ruc: string;
  glosa?: string;
  estado: string;
  usuarioSolicitud: string;
  fechaRegistro: string;
  tipoRequerimiento?: string;
  idarea: number;
  nombreArea: string;
  aprobadorAsignado?: string;
  estadoAprobacion?: string;
  fechaAsignacion?: string;
  detalle?: DetalleItem[];  // Array de ítems del requerimiento
  // Campos adicionales para compatibilidad
  idRequerimiento?: number;  // Para compatibilidad con código antiguo
  numeroRequerimiento?: string;
  fechaRequerimiento?: string;
  nombreSolicitante?: string;
  areaSolicitante?: string;
  descripcion?: string;
  urgencia?: string;
  montoTotal?: number;
}

export interface DetalleItem {
  codigo: string;
  producto?: string;
  descripcion?: string;
  descripcionItem?: string;
  tipoclasificacion?: string;
  cantidad: number;
  ceco?: string;
  idcentrocosto?: string;
  turno?: string;
  idturno?: string;
  labor?: string;
  idlabor?: string;
  idproducto?: string;
  estado?: number;
  estadoItem?: string;
}

export interface AprobacionDetalle {
  aprobadorAsignado: string;
  nombreAprobador: string;
  rolAprobador: string;
  estado: string;
  fechaAsignacion: string;
  fechaAprobacion?: string;
}

export interface DashboardAprobaciones {
  indicadores: {
    tipo: string;
    cantidad: number;
  }[];
  requerimientosUrgentes: {
    idRequerimiento: number;
    numeroRequerimiento: string;
    urgencia: string;
    montoTotal: number;
    solicitante: string;
    areaSolicitante: string;
    fechaAsignacion: string;
    minutosPendiente: number;
  }[];
  estadisticasPorArea?: {
    idarea: number;
    area: string;
    totalRequerimientos: number;
    aprobados: number;
    rechazados: number;
    pendientes: number;
    montoPromedio: number;
  }[];
}

export interface ProcesarAprobacionRequest {
  idRequerimiento: number;
  numeroRequerimiento: string;
  aprobadorAsignado: string;
  accion: 'APROBAR' | 'RECHAZAR';
  observaciones: string;
}

export interface ProcesarAprobacionResponse {
  status: string;
  message: string;
  estadoRequerimiento: string;
  siguienteAprobador?: string;
  nivelActual: number;
  nivelesRestantes: number;
  motivoRechazo?: string;
}
