import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DexieService } from '../dixiedb/dexie-db.service';
import { environment } from '../../../environments/environment';

export interface NotificacionDB {
  id_notificacion: number;
  iditem: string;
  itemDescripcion: string;
  tipo_notificacion: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  fecha_lectura?: string;
  idrequerimiento?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionApiService {
  private readonly baseUrl: string = environment.baseUrl;
  private readonly API_URL_CONSOLIDACION = `${this.baseUrl}/api/consolidacion`;
  private readonly API_URL_LOGISTICA = `${this.baseUrl}/api/logistica`;
  // private readonly API_URL_CONSOLIDACION = 'http://localhost:5213/api/consolidacion';
  // private readonly API_URL_LOGISTICA = 'http://localhost:5213/api/logistica';

  constructor(
    private http: HttpClient,
    private dexieService: DexieService
  ) {}

  /**
   * Listar notificaciones del usuario
   */
  async listarMisNotificaciones(soloNoLeidas: boolean = false): Promise<NotificacionDB[]> {
    try {
      const usuario = await this.dexieService.showUsuario();
      if (!usuario) {
        console.warn('No hay usuario logueado');
        return [];
      }

      // CORRECCIÓN: Usar el backend activo
      const response = await firstValueFrom(
        this.http.post<any>(`${this.API_URL_CONSOLIDACION}/listar-mis-notificaciones`, {
          dni: usuario.documentoidentidad,
          soloNoLeidas
        })
      );

      // El backend retorna un JSON con la propiedad "resultado"
      if (response && response.resultado) {
        // Si resultado es un string, parsearlo
        if (typeof response.resultado === 'string') {
          const parsed = JSON.parse(response.resultado);
          // Si soloNoLeidas es true, filtrar las no leídas
          return soloNoLeidas ? parsed.filter((n: any) => !n.leida) : parsed;
        }
        // Si ya es un array, filtrar si es necesario
        const resultArray = Array.isArray(response.resultado) ? response.resultado : [];
        return soloNoLeidas ? resultArray.filter((n: any) => !n.leida) : resultArray;
      }

      return Array.isArray(response) ? response : [];

      // TEMPORAL: Mock para probar sin backend
      /*
      console.log('🔧 MOCK: Listando notificaciones para:', usuario.documentoidentidad, 'soloNoLeidas:', soloNoLeidas);
      
      // Simular diferentes datos según el parámetro
      const mockData: NotificacionDB[] = soloNoLeidas ? [
        {
          id_notificacion: 1,
          iditem: '000018',
          itemDescripcion: '6 SOLENOIDS 12-50 V DC',
          tipo_notificacion: 'STOCK_DISPONIBLE',
          mensaje: 'El item 000018 - 6 SOLENOIDS 12-50 V DC ahora tiene stock disponible y puede ser despachado.',
          leida: false,
          fecha_creacion: new Date().toISOString(),
          idrequerimiento: 12345
        },
        {
          id_notificacion: 2,
          iditem: '000025',
          itemDescripcion: 'VALVULA SOLENOIDE 2 VIAS',
          tipo_notificacion: 'SALDO_PENDIENTE',
          mensaje: 'El item 000025 - VALVULA SOLENOIDE 2 VIAS ha quedado en saldo pendiente por falta de stock. Requerimiento: REQ-12346.',
          leida: false,
          fecha_creacion: new Date(Date.now() - 3600000).toISOString(),
          idrequerimiento: 12346
        }
      ] : [
        {
          id_notificacion: 1,
          iditem: '000018',
          itemDescripcion: '6 SOLENOIDS 12-50 V DC',
          tipo_notificacion: 'STOCK_DISPONIBLE',
          mensaje: 'El item 000018 - 6 SOLENOIDS 12-50 V DC ahora tiene stock disponible y puede ser despachado.',
          leida: false,
          fecha_creacion: new Date().toISOString(),
          idrequerimiento: 12345
        },
        {
          id_notificacion: 2,
          iditem: '000025',
          itemDescripcion: 'VALVULA SOLENOIDE 2 VIAS',
          tipo_notificacion: 'SALDO_PENDIENTE',
          mensaje: 'El item 000025 - VALVULA SOLENOIDE 2 VIAS ha quedado en saldo pendiente por falta de stock. Requerimiento: REQ-12346.',
          leida: false,
          fecha_creacion: new Date(Date.now() - 3600000).toISOString(),
          idrequerimiento: 12346
        },
        {
          id_notificacion: 3,
          iditem: '000030',
          itemDescripcion: 'KIT DE REPARACIÓN',
          tipo_notificacion: 'SALDO_PENDIENTE',
          mensaje: 'El item 000030 - KIT DE REPARACIÓN ha quedado en saldo pendiente. Requerimiento: REQ-12347.',
          leida: true,
          fecha_creacion: new Date(Date.now() - 7200000).toISOString(),
          idrequerimiento: 12347
        }
      ];
      
      return mockData;
      */
    } catch (error) {
      console.error('Error al listar notificaciones:', error);
      return [];
    }
  }

  /**
   * Listar notificaciones de ambas tablas (logistica_notificaciones y LOGISTICA_NotificacionesStock)
   */
  async listarTodasMisNotificaciones(soloNoLeidas: boolean = false): Promise<NotificacionDB[]> {
    try {
      const usuario = await this.dexieService.showUsuario();
      if (!usuario) {
        console.warn('No hay usuario logueado');
        return [];
      }

      // CORRECCIÓN: Usar el backend activo - listar de ambas tablas
      
      // Obtener notificaciones directas (logistica_notificaciones)
      const responseDirectas = await firstValueFrom(
        this.http.post<any>(`${this.API_URL_LOGISTICA}/listar-mis-notificaciones-directas`, {
          usuario: usuario.documentoidentidad
        })
      );

      // Obtener notificaciones de stock (LOGISTICA_NotificacionesStock)
      const responseStock = await firstValueFrom(
        this.http.post<any>(`${this.API_URL_LOGISTICA}/listar-mis-notificaciones-stock`, {
          usuario: usuario.documentoidentidad
        })
      );

      // Procesar respuestas
      const directas = this.procesarRespuestaNotificaciones(responseDirectas);
      const stock = this.procesarRespuestaNotificaciones(responseStock);
      
      // Combinar ambas listas
      const todasNotificaciones = [...directas, ...stock];
      
      // Filtrar si solo se quieren las no leídas
      const resultado = soloNoLeidas 
        ? todasNotificaciones.filter(n => !n.leida)
        : todasNotificaciones;
      
      // Ordenar por fecha descendente
      resultado.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
      
      return resultado;

      // Mock para notificaciones directas (logistica_notificaciones)
      /*
      const notificacionesDirectas: NotificacionDB[] = [
        {
          id_notificacion: 1,
          iditem: '000018',
          itemDescripcion: '6 SOLENOIDS 12-50 V DC',
          tipo_notificacion: 'STOCK_DISPONIBLE',
          mensaje: 'El item 000018 - 6 SOLENOIDS 12-50 V DC ahora tiene stock disponible y puede ser despachado.',
          leida: false,
          fecha_creacion: new Date().toISOString(),
          idrequerimiento: 12345
        },
        {
          id_notificacion: 2,
          iditem: '000025',
          itemDescripcion: 'VALVULA SOLENOIDE 2 VIAS',
          tipo_notificacion: 'SALDO_PENDIENTE',
          mensaje: 'El item 000025 - VALVULA SOLENOIDE 2 VIAS ha quedado en saldo pendiente por falta de stock. Requerimiento: REQ-12346.',
          leida: false,
          fecha_creacion: new Date(Date.now() - 3600000).toISOString(),
          idrequerimiento: 12346
        }
      ];

      // Mock para notificaciones de stock (LOGISTICA_NotificacionesStock)
      const notificacionesStock: NotificacionDB[] = [
        {
          id_notificacion: 100,
          iditem: '000030',
          itemDescripcion: 'KIT DE REPARACIÓN',
          tipo_notificacion: 'STOCK_DISPONIBLE',
          mensaje: 'El item 000030 - KIT DE REPARACIÓN ahora tiene stock disponible.',
          leida: false,
          fecha_creacion: new Date(Date.now() - 1800000).toISOString(),
          idrequerimiento: 12347
        },
        {
          id_notificacion: 101,
          iditem: '000035',
          itemDescripcion: 'SENSOR DE TEMPERATURA',
          tipo_notificacion: 'STOCK_DISPONIBLE',
          mensaje: 'El item 000035 - SENSOR DE TEMPERATURA ahora tiene stock disponible.',
          leida: true,
          fecha_creacion: new Date(Date.now() - 5400000).toISOString(),
          idrequerimiento: 12348
        }
      ];

      // Combinar ambas listas
      const todasNotificaciones = [...notificacionesDirectas, ...notificacionesStock];
      
      // Filtrar si solo se quieren las no leídas
      const resultado = soloNoLeidas 
        ? todasNotificaciones.filter(n => !n.leida)
        : todasNotificaciones;
      
      // Ordenar por fecha descendente
      resultado.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
      
      return resultado;
      */
    } catch (error) {
      console.error('Error al listar todas las notificaciones:', error);
      return [];
    }
  }

  /**
   * Procesar la respuesta del backend para notificaciones
   */
  private procesarRespuestaNotificaciones(response: any): NotificacionDB[] {
    if (response && response.resultado) {
      // Si resultado es un string, parsearlo
      if (typeof response.resultado === 'string') {
        return JSON.parse(response.resultado);
      }
      // Si ya es un array, retornarlo directamente
      return Array.isArray(response.resultado) ? response.resultado : [];
    }
    return Array.isArray(response) ? response : [];
  }

  /**
   * Insertar notificación de stock
   * Envía notificación a la persona que hizo el requerimiento original (dniregistra)
   */
  async insertarNotificacionStock(data: {
    iditem: string;
    itemDescripcion: string;
    mensaje: string;
    idrequerimiento: number;
    tipo_notificacion?: string;
  }): Promise<boolean> {
    try {
      // Construir el JSON - el usuario se obtiene automáticamente desde dniregistra en el SP
      const jsonData = {
        iditem: data.iditem,
        itemDescripcion: data.itemDescripcion,
        mensaje: data.mensaje,
        idrequerimiento: data.idrequerimiento,
        tipo_notificacion: data.tipo_notificacion || 'STOCK_DISPONIBLE'
      };

      console.log('📝 Enviando notificación de stock:', jsonData);

      const response = await firstValueFrom(
        this.http.post<any>(`${this.API_URL_CONSOLIDACION}/insertar-notificacion-stock`, jsonData)
      );

      console.log('✅ Respuesta del backend:', response);

      return response?.resultado?.success === 1;
    } catch (error) {
      console.error('Error al insertar notificación de stock:', error);
      return false;
    }
  }

  /**
   * Registrar notificación de almacén (usando el SP modificado)
   * Este método envía el DNI del usuario dentro del JSON
   */
  async registrarNotificacionAlmacen(data: {
    iditem: string;
    id_dreq: string;
    mensaje: string;
    itemDescripcion: string;
    tipo_notificacion?: string;
  }): Promise<boolean> {
    try {
      const usuario = await this.dexieService.showUsuario();
      if (!usuario) {
        console.warn('No hay usuario logueado');
        return false;
      }

      // Construir el JSON con el DNI incluido
      const jsonData = {
        iditem: data.iditem,
        id_dreq: data.id_dreq,
        mensaje: data.mensaje,
        itemDescripcion: data.itemDescripcion,
        tipo_notificacion: data.tipo_notificacion || 'SALDO_PENDIENTE',
        dni: usuario.documentoidentidad // ← DNI desde Dexie
      };

      console.log('📝 Enviando notificación a almacén:', jsonData);

      const response = await firstValueFrom(
        this.http.post<any>(`${this.API_URL_LOGISTICA}/registrar-notificacion-almacen`, jsonData)
      );

      console.log('✅ Respuesta del backend:', response);

      return response?.resultado?.success === 1;
    } catch (error) {
      console.error('Error al registrar notificación de almacén:', error);
      return false;
    }
  }

  /**
   * Registrar notificación directa al solicitante del requerimiento (OPLOGIST).
   * Usada para: PENDIENTE_DESPACHO, DESPACHO_REALIZADO, OC_EMITIDA.
   */
  async registrarNotificacionSolicitante(data: {
    usuario_destino: string;
    iditem?: string;
    id_dreq?: string;
    itemDescripcion?: string;
    mensaje: string;
    tipo_notificacion: 'PENDIENTE_DESPACHO' | 'DESPACHO_REALIZADO' | 'OC_EMITIDA' | string;
  }): Promise<boolean> {
    try {
      const jsonData = {
        usuario_destino: data.usuario_destino,
        iditem: data.iditem || '',
        id_dreq: data.id_dreq || '0',
        itemDescripcion: data.itemDescripcion || '',
        mensaje: data.mensaje,
        tipo_notificacion: data.tipo_notificacion
      };

      const response = await firstValueFrom(
        this.http.post<any>(`${this.API_URL_LOGISTICA}/registrar-notificacion-solicitante`, jsonData)
      );

      return response?.resultado?.success === true || response?.resultado?.success === 1;
    } catch (error) {
      console.error('Error al registrar notificación al solicitante:', error);
      return false;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async marcarComoLeida(idNotificacion: number): Promise<boolean> {
    try {
      const usuario = await this.dexieService.showUsuario();
      if (!usuario) {
        console.warn('No hay usuario logueado');
        return false;
      }

      console.log('🔔 Marcando notificación como leída:', {
        id_notificacion: idNotificacion,
        usuario: usuario.documentoidentidad
      });

      // CORRECCIÓN: Usar el backend activo
      const response = await firstValueFrom(
        this.http.post<any>(`${this.API_URL_CONSOLIDACION}/marcar-notificacion-leida`, {
          id_notificacion: idNotificacion,
          usuario: usuario.documentoidentidad
        })
      );

      console.log('✅ Respuesta del backend al marcar como leída:', response);

      const success = response?.resultado === 'success' || response?.resultado?.resultado === 'success';
      
      if (!success) {
        console.warn('⚠️ El backend no confirmó éxito:', response);
      }

      return success;

      // TEMPORAL: Mock para probar sin backend
      /*
      console.log('🔧 MOCK: Marcando notificación como leída:', idNotificacion);
      
      // Simular éxito
      return true;
      */
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      return false;
    }
  }

  /**
   * Enviar solicitud de creación de nuevo item al Jefe de Logística (JLOLOGIST)
   * La imagen se sube como fichero multipart; la BD solo guarda la ruta.
   */
  async enviarSolicitudCreacionItem(data: {
    nombreItem: string;
    descripcion: string;
    unidadMedida?: string;
    areaSolicitante?: string;
    imagen?: File | null;
  }): Promise<{ success: boolean; mensaje: string; id_solicitud?: number }> {
    try {
      const usuario = await this.dexieService.showUsuario();
      if (!usuario) return { success: false, mensaje: 'No hay usuario logueado' };

      const formData = new FormData();
      formData.append('nombreItem',        data.nombreItem.trim());
      formData.append('descripcion',       data.descripcion.trim());
      formData.append('dniSolicitante',    usuario.documentoidentidad);
      formData.append('nombreSolicitante', usuario.nombre);
      formData.append('unidadMedida',      data.unidadMedida ?? '');
      formData.append('areaSolicitante',   data.areaSolicitante ?? (usuario as any).nombreArea ?? '');
      if (data.imagen) {
        formData.append('imagen', data.imagen, data.imagen.name);
      }

      const resp: any = await firstValueFrom(
        this.http.post<any>(`${this.API_URL_LOGISTICA}/admin-logistica/solicitar-creacion-item`, formData)
      );

      const r = resp?.resultado;
      return {
        success:      r?.success === true || r?.success === 1,
        mensaje:      r?.mensaje ?? 'Sin respuesta',
        id_solicitud: r?.id_solicitud,
      };
    } catch (error) {
      console.error('Error al enviar solicitud de creación de item:', error);
      return { success: false, mensaje: 'Error de conexión con el servidor' };
    }
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  async getContadorNoLeidas(): Promise<number> {
    try {
      const usuario = await this.dexieService.showUsuario();
      if (!usuario) {
        return 0;
      }

      // Si es OPLOGIST, contar de ambas tablas
      if (usuario.idrol === 'OPLOGIST') {
        const notificaciones = await this.listarTodasMisNotificaciones(true);
        return notificaciones.length;
      } else {
        const notificaciones = await this.listarMisNotificaciones(true);
        return notificaciones.length;
      }
    } catch (error) {
      console.error('Error al obtener contador de notificaciones no leídas:', error);
      return 0;
    }
  }
}
