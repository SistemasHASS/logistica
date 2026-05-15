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

  // ==================== REPORTES ====================

  // Reporte de Compras
  obtenerReporteCompras(payload: any) {
    return this.http.post<any>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/reporte-compras`,
      payload
    );
  }

  // Reporte de Inventario
  obtenerReporteInventario(payload: any) {
    return this.http.post<any>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/reporte-inventario`,
      payload
    );
  }

  // Reporte de Proveedores
  obtenerReporteProveedores(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/reporte-proveedores`,
      payload
    );
  }

  // Reporte de Tiempos
  obtenerReporteTiempos(payload: any) {
    return this.http.post<any>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/reporte-tiempos`,
      payload
    );
  }

  // Reporte de Gastos
  obtenerReporteGastos(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/reporte-gastos`,
      payload
    );
  }

  // Reporte Consolidado
  obtenerReporteConsolidado(payload: any) {
    return this.http.post<any>(
      `${this.baseUrl}/api/logistica/dashboard-logistica/reporte-consolidado`,
      payload
    );
  }
}
