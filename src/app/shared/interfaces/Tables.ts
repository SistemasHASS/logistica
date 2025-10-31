
export interface Usuario {
    id: string;
    sociedad: number;
    idempresa: string;
    ruc: string;
    razonSocial: string;
    idProyecto: string;
    proyecto: string;
    documentoIdentidad: string;
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
    idproyecto: string;
    idacopio: number;
    idceco: string;
    idlabor: string;
    iditem: string;
    idturno: string;
    idclasificacion: string;
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
    id: number,
    empresa: number,
    codigo: string,
    descripcion: string,
}

export interface Acopio {
    id: string;
    nave: string;
    codigoAcopio: string;
    acopio: string;
}

export interface Ceco {
    id: string;
    turno: string;
    costcenter: string;
    localname: string;
    codTurno: string;
    nombreTurno: string;
    modulo: number;
    idcultivo: string;
    idproyecto: string;
}

export interface Labor {
    id: string;
    idgrupolabor: string;
    idlabor: string;
    labor: string;
}

export interface Turno {
    id: number;
    turno: number;
    codTurno: string;
    nombreTurno: string;
    modulo: number;
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
}

export interface Requerimiento {
    id?: number;
    fecha: string;
    fundo: string;
    almacen: string;
    glosa: string;
    tipo: string;
    detalle: DetalleRequerimiento[];
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
