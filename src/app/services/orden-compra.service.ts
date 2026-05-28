import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdenCompraService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Generar orden de compra desde solicitud aprobada
   */
  async generarOrdenDesdeSolicitud(datos: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/orden-compra/generar-desde-solicitud`;
      const response = await firstValueFrom(this.http.post<any>(url, datos));
      return response;
    } catch (error) {
      console.error('Error al generar orden desde solicitud:', error);
      throw error;
    }
  }

  /**
   * Listar órdenes de compra
   */
  async listarOrdenes(filtros: any = {}): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/orden-compra/listar`;
      const response = await firstValueFrom(this.http.post<any>(url, filtros));
      return response;
    } catch (error) {
      console.error('Error al listar órdenes:', error);
      throw error;
    }
  }

  /**
   * Obtener orden de compra por ID
   */
  async obtenerOrdenPorId(idOrden?: number, numeroOrden?: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/orden-compra/obtener-por-id`;
      const response = await firstValueFrom(this.http.post<any>(url, {
        idOrden,
        numeroOrden
      }));
      return response;
    } catch (error) {
      console.error('Error al obtener orden:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de orden de compra
   */
  async actualizarEstado(idOrden: number, nuevoEstado: string, usuarioAccion: string, observaciones?: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/orden-compra/actualizar-estado`;
      const response = await firstValueFrom(this.http.post<any>(url, {
        idOrden,
        nuevoEstado,
        usuarioAccion,
        observaciones
      }));
      return response;
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      throw error;
    }
  }

  /**
   * Anular orden de compra
   */
  async anularOrden(idOrden: number, usuarioAnula: string, motivoAnulacion: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/orden-compra/anular`;
      const response = await firstValueFrom(this.http.post<any>(url, {
        idOrden,
        usuarioAnula,
        motivoAnulacion
      }));
      return response;
    } catch (error) {
      console.error('Error al anular orden:', error);
      throw error;
    }
  }

  /**
   * Asignar aprobadores a una orden de compra
   */
  asignarAprobadores(idOrdenCompra: number, montoTotal: number): any {
    const url = `${this.baseUrl}/api/logistica/aprobacion-oc/asignar-aprobadores`;
    return this.http.post<any>(url, { idOrdenCompra, montoTotal });
  }

  /**
   * Obtener contadores de órdenes
   */
  async obtenerContadores(): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/orden-compra/contadores`;
      const response = await firstValueFrom(this.http.post<any>(url, {}));
      return response;
    } catch (error) {
      console.error('Error al obtener contadores:', error);
      throw error;
    }
  }

  /**
   * Verificar conectividad con el backend
   */
  async verificarConexion(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/logistica/orden-compra/contadores`;
      await firstValueFrom(this.http.post<any>(url, {}));
      return true;
    } catch (error) {
      console.warn('Sin conexión con el backend de órdenes de compra');
      return false;
    }
  }

  /**
   * Sincronizar orden de compra con SPRING (flujo antiguo)
   */
  async sincronizarOrdenCompra(ordenCompra: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/orden-compra/sincronizar`;
      const response = await firstValueFrom(this.http.post<any>(url, ordenCompra));
      return response;
    } catch (error) {
      console.error('Error al sincronizar orden de compra con SPRING:', error);
      throw error;
    }
  }

  /**
   * Listar Incoterms activos desde SPRING (WH_ImportacionIncoterm)
   */
  async listarIncoterms(): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/api/logistica/listar-incoterms`;
      const response = await firstValueFrom(this.http.post<any>(url, {}));
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error al listar incoterms:', error);
      return [];
    }
  }

  /**
   * Sincronizar OC de consolidación con SPRING (flujo nuevo)
   * Usa el endpoint específico para OCs creadas desde el módulo de consolidación
   * @param idOrden ID de la orden de compra
   * @param idEmpresa ID de empresa del usuario (desde API get-usuarios)
   * @param distribucion Array de distribución contable (opcional)
   */
  async sincronizarOCConsolidacion(idOrden: number, idEmpresa?: string, distribucion?: any[], ordenCompleta?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/orden-compra/sincronizar-consolidacion`;
      const body: any = { idOrden };

      if (idEmpresa) {
        body.idEmpresa = idEmpresa;
        body.companiaCodigo = idEmpresa; // CompaniaCodigo es lo mismo que idEmpresa
        body.companiaSocio = idEmpresa.padStart(6, '0') + '00'; // CompaniaSocio = CompaniaCodigo + '00'
      }

      body.tipoComprobante = 'SY'; // Fijo por ahora

      // Enviar cabecera y detalles si se proporcionan
      if (ordenCompleta) {
        // Extraer cabecera (todos los campos excepto items)
        const { items, ...cabecera } = ordenCompleta;
        body.cabecera = cabecera;
        // Enviar detalles (items)
        body.detalles = items || [];
      }

      if (distribucion && distribucion.length > 0) {
        body.distribucion = JSON.stringify(distribucion);
      }

      const response = await firstValueFrom(this.http.post<any>(url, body));
      return response;
    } catch (error) {
      console.error('Error al sincronizar OC de consolidación con SPRING:', error);
      throw error;
    }
  }
}
