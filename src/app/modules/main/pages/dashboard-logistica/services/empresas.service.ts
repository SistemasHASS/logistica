import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  private apiUrl = `${environment.apiMaestra}/api/Maestros/get_empresas`;

  constructor(private http: HttpClient) {}

  getEmpresas() {
    return this.http.post<any[]>(this.apiUrl, {});
  }

  // Filtrar solo las 3 empresas requeridas
  filtrarEmpresasRequeridas(empresas: any[]) {
    const empresasRequeridas = ['000010', '000008', '000006']; // CAO, HP, BH
    return empresas.filter(empresa => empresasRequeridas.includes(empresa.id));
  }
}
