import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListasStockService {
  private baseUrl = `${environment.baseUrl}/api/logistica/listas-stock`;

  constructor(private http: HttpClient) {}

  async listarListas(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/listar`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al listar listas de stock:', error);
      throw error;
    }
  }

  async crearLista(lista: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/crear`, lista)
      );
      return response;
    } catch (error) {
      console.error('Error al crear lista de stock:', error);
      throw error;
    }
  }

  async actualizarLista(lista: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/actualizar`, lista)
      );
      return response;
    } catch (error) {
      console.error('Error al actualizar lista de stock:', error);
      throw error;
    }
  }

  async eliminarLista(idLista: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/eliminar`, { idLista })
      );
      return response;
    } catch (error) {
      console.error('Error al eliminar lista de stock:', error);
      throw error;
    }
  }

  async verificarStock(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/verificar-stock`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al verificar stock:', error);
      throw error;
    }
  }

  async generarAlertas(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/generar-alertas`, {})
      );
      return response;
    } catch (error) {
      console.error('Error al generar alertas:', error);
      throw error;
    }
  }

  async listarAlertas(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/listar-alertas`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al listar alertas:', error);
      throw error;
    }
  }

  async atenderAlerta(data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/atender-alerta`, data)
      );
      return response;
    } catch (error) {
      console.error('Error al atender alerta:', error);
      throw error;
    }
  }
}
