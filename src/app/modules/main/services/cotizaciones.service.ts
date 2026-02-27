import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CotizacionesService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // Listar solicitudes de cotización (compras)
  listarSolicitudesCotizacion(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/listar-solicitudes-cotizacion`, request)
    );
  }

  // Listar solicitudes de cotización de servicios
  listarSolicitudesCotizacionServicio(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/listar-solicitudes-cotizacion-servicio`, request)
    );
  }

  // Registrar cotización recibida (compras)
  registrarCotizacion(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/registrar-cotizacion`, request)
    );
  }

  // Registrar cotización de servicio
  registrarCotizacionServicio(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/registrar-cotizacion-servicio`, request)
    );
  }

  // Listar cotizaciones por solicitud
  listarCotizacionesPorSolicitud(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/listar-cotizaciones-por-solicitud`, request)
    );
  }

  // Comparar cotizaciones
  compararCotizaciones(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/comparar-cotizaciones`, request)
    );
  }

  // Seleccionar proveedor ganador
  seleccionarProveedorGanador(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/seleccionar-proveedor-ganador`, request)
    );
  }
}
