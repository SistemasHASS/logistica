import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '@/environments/environment';

export type TipoNota = 'NI' | 'NS';
export type EstadoConformidad = 'PENDIENTE' | 'CONFORME' | 'NO_CONFORME';

export interface ConformidadNota {
  id: string;
  idNotaFuente?: number;   // idRecepcion (NI) o iddespacho (NS) — necesario para el JOIN del SP
  tipo: TipoNota;
  numeroNota: string;
  fecha: string;
  almacen: string;
  referencia: string;
  descripcionRef: string;
  items: ConformidadItem[];
  estado: EstadoConformidad;
  firmante?: string;
  firmaBase64?: string;
  fechaConformidad?: string;
  usuarioConformidad?: string;
  observaciones?: string;
  usuarioPropietario?: string;  // quien debe dar la conformidad
}

export interface ConformidadItem {
  item: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadDespachada: number;
  cantidadRecibida?: number;
  ceco?: string;
}

export interface RegistrarConformidadPayload {
  idNota: string;
  idNotaFuente?: number;
  tipo: TipoNota;
  estado: 'CONFORME' | 'NO_CONFORME';
  firmaBase64: string;
  firmante: string;
  usuario: string;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class ConformidadAlmacenService {
  private readonly url = `${environment.baseUrl}/api/logistica/conformidad-almacen`;
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  listarNotas(tipo: TipoNota, estado: EstadoConformidad | '' = '', idalmacen = '', idusuario = ''): Observable<ConformidadNota[]> {
    return this.http.post<any>(
      `${this.url}/listar`,
      { tipo, estado, idalmacen, idusuario },
      { headers: this.headers }
    ).pipe(
      map(res => {
        if (!res) return [];
        const arr: any[] = Array.isArray(res) ? res : [];
        return arr.map(n => this.mapNota(n));
      }),
      catchError(err => { console.error('ConformidadAlmacen listarNotas:', err); return throwError(() => err); })
    );
  }

  registrarConformidad(payload: RegistrarConformidadPayload): Observable<any> {
    return this.http.post<any>(
      `${this.url}/registrar`,
      payload,
      { headers: this.headers }
    ).pipe(
      catchError(err => { console.error('ConformidadAlmacen registrarConformidad:', err); return throwError(() => err); })
    );
  }

  obtenerDetalle(idNota: string, tipo: TipoNota): Observable<ConformidadNota | null> {
    return this.http.post<any>(
      `${this.url}/detalle`,
      { idNota, tipo },
      { headers: this.headers }
    ).pipe(
      map(res => res ? this.mapNota(res) : null),
      catchError(err => { console.error('ConformidadAlmacen obtenerDetalle:', err); return throwError(() => err); })
    );
  }

  private mapNota(n: any): ConformidadNota {
    let items: ConformidadItem[] = [];
    if (n.items) {
      try {
        const raw = typeof n.items === 'string' ? JSON.parse(n.items) : n.items;
        items = Array.isArray(raw) ? raw.map((i: any) => ({
          item: i.item ?? 0,
          codigo: i.codigo ?? '',
          descripcion: i.descripcion ?? '',
          unidad: i.unidad ?? 'UND',
          cantidadDespachada: i.cantidadDespachada ?? 0,
          cantidadRecibida: i.cantidadRecibida ?? i.cantidadDespachada ?? 0,
          ceco: i.ceco ?? ''
        })) : [];
      } catch { items = []; }
    }
    return {
      id:                n.id ?? '',
      idNotaFuente:      n.idNotaFuente != null ? Number(n.idNotaFuente) : undefined,
      tipo:              (n.tipo ?? 'NI') as TipoNota,
      numeroNota:        n.numeroNota ?? '',
      fecha:             n.fecha ?? '',
      almacen:           n.almacen ?? '',
      referencia:        n.referencia ?? '',
      descripcionRef:    n.descripcionRef ?? '',
      items,
      estado:            (n.estado ?? 'PENDIENTE') as EstadoConformidad,
      firmante:          n.firmante ?? undefined,
      firmaBase64:       n.firmaBase64 ?? undefined,
      fechaConformidad:  n.fechaConformidad ?? undefined,
      usuarioConformidad:  n.usuarioConformidad  ?? undefined,
      observaciones:      n.observaciones       ?? undefined,
      usuarioPropietario: n.usuarioPropietario   ?? undefined
    };
  }
}
