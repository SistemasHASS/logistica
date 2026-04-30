import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardLogisticaService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // KPIs de Requerimientos
  obtenerKPIsRequerimientos(payload: any) {
    return this.http.post<any>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/kpis-requerimientos`,
      payload
    );
  }

  // Requerimientos por Mes
  obtenerRequerimientosPorMes(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/requerimientos-por-mes`,
      payload
    );
  }

  // Seguimiento de Órdenes
  obtenerSeguimientoOrdenes(payload: any) {
    return this.http.post<any>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/seguimiento-ordenes`,
      payload
    );
  }

  // Entregas de Hoy
  obtenerEntregasHoy(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/entregas-hoy`,
      payload
    );
  }

  // Estado del Almacén
  obtenerEstadoAlmacen(payload: any) {
    return this.http.post<any>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/estado-almacen`,
      payload
    );
  }

  // Resumen de Compras
  obtenerResumenCompras(payload: any) {
    return this.http.post<any>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/resumen-compras`,
      payload
    );
  }

  // Gastos Mensuales
  obtenerGastosMensuales(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/gastos-mensuales`,
      payload
    );
  }

  // Órdenes de Compra
  obtenerOrdenesCompra(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/ordenes-compra`,
      payload
    );
  }

  // Solicitudes de Compra
  obtenerSolicitudesCompra(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/solicitudes-compra`,
      payload
    );
  }

  // Proveedores
  obtenerProveedores(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/proveedores`,
      payload
    );
  }

  // Lista de requerimientos por estado (para modal del dashboard)
  obtenerRequerimientosPorEstado(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/requerimientos-por-estado`,
      payload
    );
  }
}
