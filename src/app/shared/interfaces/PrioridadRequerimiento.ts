/**
 * Sistema de Prioridades para Requerimientos
 * 
 * Mapeo entre valores de Spring (1, 2, 3) y lógica interna con plazos de entrega
 * según el tipo de requerimiento (COMPRA vs CONSUMO)
 */

// Valores que Spring espera (se mantienen en el UI)
export type PrioridadSpring = '1' | '2' | '3';

// Tipos de requerimiento
export type TipoRequerimiento = 'COMPRA' | 'CONSUMO' | 'TRANSFERENCIA';

// Subtipos de COMPRA (para plazos específicos)
export type SubTipoCompra = 'NORMAL' | 'IMPORTACION' | 'FABRICACION';

/**
 * Interfaz para configuración de prioridad interna
 */
export interface ConfiguracionPrioridad {
  prioridadSpring: PrioridadSpring;
  tipo: TipoRequerimiento;
  subTipo?: SubTipoCompra;
  diasMinimos: number;
  diasMaximos: number;
  horasMaximas?: number; // Para urgencias en horas
  etiqueta: string;
  descripcion: string;
}

/**
 * Resultado del cálculo de prioridad
 */
export interface ResultadoPrioridad {
  prioridadSpring: PrioridadSpring;
  etiquetaInterna: string;
  descripcionPlazo: string;
  diasEntrega: number;
  fechaEntregaEstimada: Date;
  esUrgente: boolean;
  requiereAprobacionEspecial: boolean;
}

/**
 * Mapeo de prioridades según tipo de requerimiento
 */
export const PRIORIDADES_COMPRA: Record<PrioridadSpring, ConfiguracionPrioridad[]> = {
  '1': [
    {
      prioridadSpring: '1',
      tipo: 'COMPRA',
      subTipo: 'NORMAL',
      diasMinimos: 7,
      diasMaximos: 21,
      etiqueta: 'Normal',
      descripcion: 'Compra normal: 7 a 21 días'
    },
    {
      prioridadSpring: '1',
      tipo: 'COMPRA',
      subTipo: 'IMPORTACION',
      diasMinimos: 120,
      diasMaximos: 120,
      etiqueta: 'Normal - Importación',
      descripcion: 'Importación: 120 días'
    },
    {
      prioridadSpring: '1',
      tipo: 'COMPRA',
      subTipo: 'FABRICACION',
      diasMinimos: 45,
      diasMaximos: 45,
      etiqueta: 'Normal - Fabricación',
      descripcion: 'Fabricación: 45 días'
    }
  ],
  '2': [
    {
      prioridadSpring: '2',
      tipo: 'COMPRA',
      diasMinimos: 0,
      diasMaximos: 2,
      horasMaximas: 48,
      etiqueta: 'Urgente',
      descripcion: 'Urgente: 48 horas'
    }
  ],
  '3': [
    {
      prioridadSpring: '3',
      tipo: 'COMPRA',
      diasMinimos: 0,
      diasMaximos: 1,
      horasMaximas: 24,
      etiqueta: 'Emergencia',
      descripcion: 'Emergencia: 24 horas'
    }
  ]
};

export const PRIORIDADES_CONSUMO: Record<PrioridadSpring, ConfiguracionPrioridad> = {
  '1': {
    prioridadSpring: '1',
    tipo: 'CONSUMO',
    diasMinimos: 0,
    diasMaximos: 1,
    horasMaximas: 24,
    etiqueta: 'Normal',
    descripcion: 'Consumo normal: el mismo día'
  },
  '2': {
    prioridadSpring: '2',
    tipo: 'CONSUMO',
    diasMinimos: 0,
    diasMaximos: 0,
    horasMaximas: 12,
    etiqueta: 'Urgente',
    descripcion: 'Consumo urgente: dentro del día'
  },
  '3': {
    prioridadSpring: '3',
    tipo: 'CONSUMO',
    diasMinimos: 0,
    diasMaximos: 0,
    horasMaximas: 6,
    etiqueta: 'Emergencia',
    descripcion: 'Consumo emergencia: inmediato (6 horas)'
  }
};

/**
 * Prioridad especial: No Planificado (solo para COMPRA)
 */
export const PRIORIDAD_NO_PLANIFICADO: ConfiguracionPrioridad = {
  prioridadSpring: '1', // Se envía como Normal a Spring
  tipo: 'COMPRA',
  diasMinimos: 7,
  diasMaximos: 21,
  etiqueta: 'No Planificado',
  descripcion: 'No planificado: 7 a 21 días'
};
