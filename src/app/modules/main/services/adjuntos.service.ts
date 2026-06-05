import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdjuntosService {
  private apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  guardarAdjuntoRequerimiento(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/logistica/guardar-adjunto-requerimiento`, data);
  }

  listarAdjuntosRequerimiento(idRequerimiento: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/logistica/listar-adjuntos-requerimiento`, {
      idRequerimiento
    });
  }

  eliminarAdjuntoRequerimiento(idAdjunto: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/logistica/eliminar-adjunto-requerimiento`, {
      idAdjunto
    });
  }

  // Utilidad para convertir archivo a base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remover el prefijo "data:application/pdf;base64," o similar
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Utilidad para obtener el tipo MIME del archivo
  getFileType(file: File): string {
    return file.type;
  }

  // Utilidad para obtener el tamaño del archivo en KB
  getFileSizeKB(file: File): number {
    return Math.round(file.size / 1024);
  }
}
