import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export type EstadoConformidadOS = 'CONFORME' | 'NO_CONFORME' | 'CONFORME_CON_OBSERVACIONES';

export interface OrdenServicioConformidad {
  idOS: number;
  numeroOrden: string;
  tipoServicio: string;
  descripcion: string;
  proveedor: string;
  nombreProveedor: string;
  rucProveedor: string;
  emailProveedor: string;
  montoTotal: number;
  moneda: string;
  condicionesPago?: string;
  formaPago?: string;
  fechaInicioServicio?: string;
  fechaFinServicio?: string;
  plazoEjecucion?: string;
  ubicacionServicio?: string;
  centroCosto?: string;
  proyecto?: string;
  observaciones?: string;
  estado: string;
  usuarioGenera?: string;
  fechaRegistro?: string;
  tieneConformidad: number;
  // Datos conformidad si ya fue registrada
  estadoConformidad?: EstadoConformidadOS;
  calificacion?: number;
  observacionesConformidad?: string;
  usuarioConformidad?: string;
  nombreConformidad?: string;
  fechaConformidad?: string;
  firmaJefeArea?: string;  // base64 firma del confirmante (firmante 2)
  // Items
  items?: ItemOS[];
}

export interface ItemOS {
  item: number;
  descripcionServicio: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface RegistrarConformidadOSPayload {
  ordenServicioId: number;
  conformidad: EstadoConformidadOS;
  calificacion: number;
  observaciones: string;
  usuarioConformidad: string;
  nombreUsuario: string;
  cargoUsuario?: string;
  firmaBase64?: string;  // firma digital del confirmante (firmante 2 — jefe de área)
}

@Injectable({ providedIn: 'root' })
export class ConformidadServiciosService {
  private readonly base = `${environment.baseUrl}/api/logistica/orden-servicio`;
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  listarParaConformidad(filtros: {
    seccion?: 'PENDIENTE' | 'HISTORIAL' | 'TODAS';
    tipoServicio?: string;
    proveedor?: string;
    usuario?: string;   // documentoidentidad del usuario logueado — filtra por usuarioGenera
  } = {}): Observable<OrdenServicioConformidad[]> {
    return this.http.post<any>(
      `${this.base}/listar-para-conformidad`,
      filtros,
      { headers: this.headers }
    );
  }

  obtenerDetalle(idOS: number): Observable<OrdenServicioConformidad> {
    return this.http.post<any>(
      `${this.base}/obtener-detalle-conformidad`,
      { idOS },
      { headers: this.headers }
    );
  }

  registrarConformidad(payload: RegistrarConformidadOSPayload): Observable<any> {
    return this.http.post<any>(
      `${this.base}/registrar-conformidad`,
      payload,
      { headers: this.headers }
    );
  }
}
