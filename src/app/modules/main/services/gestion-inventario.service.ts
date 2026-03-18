import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GestionInventarioService {
  private baseUrl = `${environment.baseUrl}/api/logistica/gestion-inventario`;

  constructor(private http: HttpClient) {}

  // Ajustes de Inventario
  async listarAjustes(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/ajustes/listar`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al listar ajustes:', error);
      throw error;
    }
  }

  async crearAjuste(ajuste: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/ajustes/crear`, ajuste)
      );
      return response;
    } catch (error) {
      console.error('Error al crear ajuste:', error);
      throw error;
    }
  }

  async aprobarAjuste(data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/ajustes/aprobar`, data)
      );
      return response;
    } catch (error) {
      console.error('Error al aprobar ajuste:', error);
      throw error;
    }
  }

  // Conteos de Inventario
  async listarConteos(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/conteos/listar`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al listar conteos:', error);
      throw error;
    }
  }

  async crearConteo(conteo: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/conteos/crear`, conteo)
      );
      return response;
    } catch (error) {
      console.error('Error al crear conteo:', error);
      throw error;
    }
  }

  async registrarConteoFisico(data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/conteos/registrar-fisico`, data)
      );
      return response;
    } catch (error) {
      console.error('Error al registrar conteo físico:', error);
      throw error;
    }
  }

  async finalizarConteo(idConteo: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/conteos/finalizar`, { idConteo })
      );
      return response;
    } catch (error) {
      console.error('Error al finalizar conteo:', error);
      throw error;
    }
  }

  async obtenerDetalleConteo(idConteo: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/conteos/detalle`, { idConteo })
      );
      return response;
    } catch (error) {
      console.error('Error al obtener detalle de conteo:', error);
      throw error;
    }
  }
}
