import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { PlantillaConformidadServicio } from './conformidad-servicio-pdf.service';

const BASE = `${environment.baseUrl}/api/logistica/admin-logistica/plantilla-conformidad-servicio`;

const DEFAULT: PlantillaConformidadServicio = {
  tituloDocumento: 'CONFORMIDAD DE SERVICIO',
  etiquetaProveedor: 'Proveedor',
  etiquetaNumeroOS: 'No de Orden de Servicio',
  etiquetaFechaOS: 'Fecha de Orden de Servicio',
  etiquetaTotalOS: 'Total Orden de Servicio',
  etiquetaFechaRecepcion: 'Fecha Recepción',
  etiquetaDescripcionOS: 'Descripcion O.S',
  etiquetaComentarios: 'Comentarios',
  etiquetaCorrespondienteA: 'correspondiente a:',
  etiquetaMontoServicio: 'Monto Servicio',
  etiquetaIGV: 'IGV',
  etiquetaMontoTotal: 'Monto Total a Pagar $',
  etiquetaConfirmadoPor: 'Confirmado por:',
  mostrarIGV: true,
  mostrarComentarios: true,
  piePagina: '',
  firmante1Label: 'Confirmado por',
  firmante2Label: 'Jefe de Área',
  firmaLologistBase64: '',
  nombreLologist: '',
  dniLologist: '',
  cargoLologist: 'Operador Logístico',
};

function mapRow(row: any): PlantillaConformidadServicio {
  if (!row) return { ...DEFAULT };
  return {
    tituloDocumento:          row.tituloDocumento          ?? DEFAULT.tituloDocumento,
    etiquetaProveedor:        row.etiquetaProveedor        ?? DEFAULT.etiquetaProveedor,
    etiquetaNumeroOS:         row.etiquetaNumeroOS         ?? DEFAULT.etiquetaNumeroOS,
    etiquetaFechaOS:          row.etiquetaFechaOS          ?? DEFAULT.etiquetaFechaOS,
    etiquetaTotalOS:          row.etiquetaTotalOS          ?? DEFAULT.etiquetaTotalOS,
    etiquetaFechaRecepcion:   row.etiquetaFechaRecepcion   ?? DEFAULT.etiquetaFechaRecepcion,
    etiquetaDescripcionOS:    row.etiquetaDescripcionOS    ?? DEFAULT.etiquetaDescripcionOS,
    etiquetaComentarios:      row.etiquetaComentarios      ?? DEFAULT.etiquetaComentarios,
    etiquetaCorrespondienteA: row.etiquetaCorrespondienteA ?? DEFAULT.etiquetaCorrespondienteA,
    etiquetaMontoServicio:    row.etiquetaMontoServicio    ?? DEFAULT.etiquetaMontoServicio,
    etiquetaIGV:              row.etiquetaIGV              ?? DEFAULT.etiquetaIGV,
    etiquetaMontoTotal:       row.etiquetaMontoTotal       ?? DEFAULT.etiquetaMontoTotal,
    etiquetaConfirmadoPor:    row.etiquetaConfirmadoPor    ?? DEFAULT.etiquetaConfirmadoPor,
    mostrarIGV:               row.mostrarIGV               ?? DEFAULT.mostrarIGV,
    mostrarComentarios:       row.mostrarComentarios       ?? DEFAULT.mostrarComentarios,
    piePagina:                row.piePagina                ?? '',
    firmante1Label:           row.firmante1Label           ?? DEFAULT.firmante1Label,
    firmante2Label:           row.firmante2Label           ?? DEFAULT.firmante2Label,
    firmaLologistBase64:      row.firmaLologistBase64      ?? '',
    nombreLologist:           row.nombreLologist           ?? '',
    dniLologist:              row.dniLologist              ?? '',
    cargoLologist:            row.cargoLologist            ?? DEFAULT.cargoLologist,
  };
}

@Injectable({ providedIn: 'root' })
export class ConformidadServicioPlantillaService {
  private http = inject(HttpClient);

  obtener(ruc?: string): Observable<PlantillaConformidadServicio> {
    const params = ruc ? `?ruc=${encodeURIComponent(ruc)}` : '';
    return this.http.get<any>(`${BASE}${params}`).pipe(
      map(row => mapRow(row)),
      catchError(() => of({ ...DEFAULT }))
    );
  }

  guardar(cfg: PlantillaConformidadServicio, ruc: string, usuario = 'SISTEMA'): Observable<any> {
    return this.http.post(BASE, { ...cfg, ruc, usuario });
  }
}
