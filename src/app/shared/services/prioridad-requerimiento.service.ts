import { Injectable } from '@angular/core';
import {
  PrioridadSpring,
  TipoRequerimiento,
  SubTipoCompra,
  ConfiguracionPrioridad,
  ResultadoPrioridad,
  PRIORIDADES_COMPRA,
  PRIORIDADES_CONSUMO,
  PRIORIDAD_NO_PLANIFICADO
} from '../interfaces/PrioridadRequerimiento';

/**
 * Servicio para gestionar el mapeo de prioridades entre Spring y lógica interna
 * 
 * Mantiene los valores que Spring espera (1, 2, 3) pero calcula internamente
 * los plazos de entrega según el tipo de requerimiento (COMPRA vs CONSUMO)
 */
@Injectable({
  providedIn: 'root'
})
export class PrioridadRequerimientoService {

  constructor() { }

  /**
   * Calcula la prioridad interna y fecha de entrega estimada
   * 
   * @param prioridadSpring - Valor del dropdown (1, 2, 3)
   * @param tipo - Tipo de requerimiento (COMPRA, CONSUMO, TRANSFERENCIA)
   * @param subTipo - Subtipo de compra (NORMAL, IMPORTACION, FABRICACION)
   * @param esNoPlanificado - Si es una compra no planificada
   * @param fechaBase - Fecha base para calcular entrega (por defecto: hoy)
   * @returns Resultado con plazo, fecha estimada y etiquetas
   */
  calcularPrioridad(
    prioridadSpring: PrioridadSpring,
    tipo: TipoRequerimiento,
    subTipo?: SubTipoCompra,
    esNoPlanificado: boolean = false,
    fechaBase: Date = new Date()
  ): ResultadoPrioridad {
    
    let config: ConfiguracionPrioridad;

    // Caso especial: No Planificado (solo COMPRA)
    if (esNoPlanificado && tipo === 'COMPRA') {
      config = PRIORIDAD_NO_PLANIFICADO;
    }
    // COMPRA
    else if (tipo === 'COMPRA') {
      const configuraciones = PRIORIDADES_COMPRA[prioridadSpring];
      
      // Si hay subtipo, buscar configuración específica
      if (subTipo && Array.isArray(configuraciones)) {
        const configEspecifica = configuraciones.find(c => c.subTipo === subTipo);
        config = configEspecifica || configuraciones[0];
      } else {
        config = Array.isArray(configuraciones) ? configuraciones[0] : configuraciones;
      }
    }
    // CONSUMO
    else if (tipo === 'CONSUMO') {
      config = PRIORIDADES_CONSUMO[prioridadSpring];
    }
    // TRANSFERENCIA (usa misma lógica que CONSUMO)
    else {
      config = PRIORIDADES_CONSUMO[prioridadSpring];
    }

    // Calcular días de entrega
    const diasEntrega = this.calcularDiasEntrega(config);

    // Calcular fecha de entrega estimada
    const fechaEntregaEstimada = this.calcularFechaEntrega(fechaBase, diasEntrega, config.horasMaximas);

    // Determinar si es urgente
    const esUrgente = prioridadSpring === '2' || prioridadSpring === '3';

    // Determinar si requiere aprobación especial
    const requiereAprobacionEspecial = prioridadSpring === '3' || esNoPlanificado;

    return {
      prioridadSpring,
      etiquetaInterna: config.etiqueta,
      descripcionPlazo: config.descripcion,
      diasEntrega,
      fechaEntregaEstimada,
      esUrgente,
      requiereAprobacionEspecial
    };
  }

  /**
   * Obtiene la descripción del plazo para mostrar en UI
   */
  obtenerDescripcionPlazo(
    prioridadSpring: PrioridadSpring,
    tipo: TipoRequerimiento,
    subTipo?: SubTipoCompra
  ): string {
    if (tipo === 'COMPRA') {
      const configuraciones = PRIORIDADES_COMPRA[prioridadSpring];
      if (Array.isArray(configuraciones)) {
        if (subTipo) {
          const config = configuraciones.find(c => c.subTipo === subTipo);
          return config?.descripcion || configuraciones[0].descripcion;
        }
        return configuraciones[0].descripcion;
      }
    }
    return PRIORIDADES_CONSUMO[prioridadSpring].descripcion;
  }

  /**
   * Obtiene todas las opciones de subtipo para COMPRA Normal
   */
  obtenerSubTiposCompra(): { value: SubTipoCompra; label: string; dias: string }[] {
    const configuraciones = PRIORIDADES_COMPRA['1'];
    if (!Array.isArray(configuraciones)) return [];

    return configuraciones.map(config => ({
      value: config.subTipo!,
      label: config.etiqueta,
      dias: config.diasMaximos === config.diasMinimos 
        ? `${config.diasMaximos} días`
        : `${config.diasMinimos}-${config.diasMaximos} días`
    }));
  }

  /**
   * Valida si una prioridad es válida para el tipo de requerimiento
   */
  esPrioridadValida(prioridadSpring: PrioridadSpring, tipo: TipoRequerimiento): boolean {
    if (tipo === 'COMPRA') {
      return prioridadSpring in PRIORIDADES_COMPRA;
    } else {
      return prioridadSpring in PRIORIDADES_CONSUMO;
    }
  }

  /**
   * Calcula días de entrega promedio según configuración
   */
  private calcularDiasEntrega(config: ConfiguracionPrioridad): number {
    // Si hay horas máximas y son menos de 24, considerar como 1 día
    if (config.horasMaximas && config.horasMaximas < 24) {
      return 1;
    }
    
    // Si diasMinimos y diasMaximos son iguales, usar ese valor
    if (config.diasMinimos === config.diasMaximos) {
      return config.diasMaximos;
    }
    
    // Caso contrario, usar promedio
    return Math.ceil((config.diasMinimos + config.diasMaximos) / 2);
  }

  /**
   * Calcula fecha de entrega estimada
   */
  private calcularFechaEntrega(fechaBase: Date, dias: number, horas?: number): Date {
    const fecha = new Date(fechaBase);
    
    if (horas && horas < 24) {
      // Sumar horas directamente
      fecha.setHours(fecha.getHours() + horas);
    } else {
      // Sumar días (excluyendo fines de semana si es necesario)
      fecha.setDate(fecha.getDate() + dias);
    }
    
    return fecha;
  }

  /**
   * Calcula fecha de entrega considerando días hábiles
   * (excluye sábados y domingos)
   */
  calcularFechaEntregaHabil(fechaBase: Date, diasHabiles: number): Date {
    const fecha = new Date(fechaBase);
    let diasAgregados = 0;

    while (diasAgregados < diasHabiles) {
      fecha.setDate(fecha.getDate() + 1);
      const diaSemana = fecha.getDay();
      
      // Si no es sábado (6) ni domingo (0), contar como día hábil
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasAgregados++;
      }
    }

    return fecha;
  }

  /**
   * Formatea fecha para mostrar en UI
   */
  formatearFechaEntrega(fecha: Date): string {
    const opciones: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return fecha.toLocaleDateString('es-PE', opciones);
  }

  /**
   * Obtiene las opciones de prioridad para mostrar en el dropdown según tipo de requerimiento
   */
  obtenerOpcionesPrioridad(tipo: TipoRequerimiento): { value: PrioridadSpring; label: string; descripcion: string }[] {
    if (tipo === 'COMPRA') {
      return [
        { 
          value: '1', 
          label: 'Normal (7-21 días)', 
          descripcion: 'Compra estándar, importación (120d) o fabricación (45d)'
        },
        { 
          value: '2', 
          label: 'Urgente (48 horas)', 
          descripcion: 'Requiere atención prioritaria'
        },
        { 
          value: '3', 
          label: 'Emergencia (24 horas)', 
          descripcion: 'Máxima prioridad, requiere aprobación especial'
        }
      ];
    } else if (tipo === 'CONSUMO') {
      return [
        { 
          value: '1', 
          label: 'Normal (mismo día)', 
          descripcion: 'Consumo estándar del almacén'
        },
        { 
          value: '2', 
          label: 'Urgente (dentro del día)', 
          descripcion: 'Requiere atención prioritaria'
        },
        { 
          value: '3', 
          label: 'Emergencia (inmediato)', 
          descripcion: 'Máxima prioridad, 6 horas'
        }
      ];
    } else { // TRANSFERENCIA usa misma lógica que CONSUMO
      return [
        { 
          value: '1', 
          label: 'Normal (mismo día)', 
          descripcion: 'Transferencia estándar'
        },
        { 
          value: '2', 
          label: 'Urgente (dentro del día)', 
          descripcion: 'Requiere atención prioritaria'
        },
        { 
          value: '3', 
          label: 'Emergencia (inmediato)', 
          descripcion: 'Máxima prioridad'
        }
      ];
    }
  }

  /**
   * Obtiene color de badge según prioridad
   */
  obtenerColorPrioridad(prioridadSpring: PrioridadSpring): string {
    switch (prioridadSpring) {
      case '1': return 'success';  // Verde
      case '2': return 'warning';  // Amarillo
      case '3': return 'danger';   // Rojo
      default: return 'secondary';
    }
  }

  /**
   * Obtiene icono según prioridad
   */
  obtenerIconoPrioridad(prioridadSpring: PrioridadSpring): string {
    switch (prioridadSpring) {
      case '1': return 'bi-clock';
      case '2': return 'bi-exclamation-triangle';
      case '3': return 'bi-lightning';
      default: return 'bi-info-circle';
    }
  }
}
