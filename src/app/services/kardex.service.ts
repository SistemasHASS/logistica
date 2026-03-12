import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KardexService {
  private baseUrl = `${environment.baseUrl}/api/kardex`;

  constructor(private http: HttpClient) {}

  async registrarTransaccion(transaccion: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/registrar-transaccion`, transaccion)
      );
      return response;
    } catch (error) {
      console.error('Error al registrar transacción:', error);
      throw error;
    }
  }

  async procesarTransaccion(idTransaccion: number, metodoValorizacion: string = 'PROMEDIO'): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/procesar-transaccion`, {
          idTransaccion,
          metodoValorizacion
        })
      );
      return response;
    } catch (error) {
      console.error('Error al procesar transacción:', error);
      throw error;
    }
  }

  async listarTransacciones(filtros: any = {}): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/listar-transacciones`, filtros)
      );
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error al listar transacciones:', error);
      return [];
    }
  }

  async obtenerDetalleTransaccion(idTransaccion: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/obtener-detalle-transaccion`, {
          idTransaccion
        })
      );
      return response;
    } catch (error) {
      console.error('Error al obtener detalle de transacción:', error);
      throw error;
    }
  }

  async consultarKardex(filtros: any): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/consultar-kardex`, filtros)
      );
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error al consultar kardex:', error);
      return [];
    }
  }

  async consultarStock(filtros: any = {}): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/consultar-stock`, filtros)
      );
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error al consultar stock:', error);
      return [];
    }
  }

  async reporteValorizacion(almacen?: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/reporte-valorizacion`, {
          almacen: almacen || null
        })
      );
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error al obtener reporte de valorización:', error);
      return [];
    }
  }

  async dashboardInventario(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/dashboard-inventario`, {})
      );
      return response || {
        indicadores: {},
        itemsBajoStock: [],
        itemsMayorValor: [],
        movimientosRecientes: []
      };
    } catch (error) {
      console.error('Error al obtener dashboard de inventario:', error);
      return {
        indicadores: {},
        itemsBajoStock: [],
        itemsMayorValor: [],
        movimientosRecientes: []
      };
    }
  }

  async anularTransaccion(idTransaccion: number, motivo: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/anular-transaccion`, {
          idTransaccion,
          motivo
        })
      );
      return response;
    } catch (error) {
      console.error('Error al anular transacción:', error);
      throw error;
    }
  }

  async probarFlujoCompleto(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/probar-flujo-completo`, {})
      );
      return response;
    } catch (error) {
      console.error('Error al probar flujo completo:', error);
      throw error;
    }
  }

  async ejecutarRecepcionOC(data: { companiaSocio: string, numeroOrden: string, almacenCodigo: string, usuario?: string }): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/ejecutar-recepcion-oc`, data)
      );
      return response;
    } catch (error) {
      console.error('Error al ejecutar recepción de OC:', error);
      throw error;
    }
  }

  async sincronizarSpring(params: { companiaSocio?: string, fechaDesde?: string, fechaHasta?: string, soloPendientes?: boolean } = {}): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/sincronizar-spring`, params)
      );
      return response;
    } catch (error) {
      console.error('Error al sincronizar con SPRING:', error);
      throw error;
    }
  }

  async ejecutarSincronizacionSpring(params: { companiaSocio?: string, fechaDesde?: string, fechaHasta?: string, soloPendientes?: boolean, ejecutarReal?: boolean } = {}): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/ejecutar-sincronizacion-spring`, params)
      );
      return response;
    } catch (error) {
      console.error('Error al ejecutar sincronización con SPRING:', error);
      throw error;
    }
  }

  async verificarEstadoSincronizacion(companiaSocio?: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/verificar-estado-sincronizacion`, { companiaSocio })
      );
      return response;
    } catch (error) {
      console.error('Error al verificar estado de sincronización:', error);
      throw error;
    }
  }
}
