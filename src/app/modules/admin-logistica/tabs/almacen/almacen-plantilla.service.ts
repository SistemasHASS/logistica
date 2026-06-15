import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { PlantillaAlmacen } from './almacen.component';

const BASE = `${environment.baseUrl}/api/logistica/admin-logistica/plantilla-almacen`;

const DEFAULT_NI: PlantillaAlmacen = {
  tipoDocumento: 'NI',
  tituloDocumento: 'Nota de Ingreso',
  mostrarUbicacionFisica: true,
  mostrarCodInterno: true,
  mostrarStockActual: true,
  mostrarCCostos: false,
  mostrarCantidadPendiente: true,
  mostrarCantidadCompra: true,
  firmante1: 'ALMACEN',
  firmante2: 'AUTORIZA',
  piePagina: '',
  firmaAlmacenBase64: '',
  nombreAlmacenero: '',
  dniAlmacenero: '',
  ruc: '',
  razonSocial: '',
  logoEmpresaBase64: '',
};

const DEFAULT_NS: PlantillaAlmacen = {
  tipoDocumento: 'NS',
  tituloDocumento: 'Nota de Salida',
  mostrarUbicacionFisica: true,
  mostrarCodInterno: true,
  mostrarStockActual: true,
  mostrarCCostos: true,
  mostrarCantidadPendiente: true,
  mostrarCantidadCompra: false,
  firmante1: 'ALMACEN',
  firmante2: 'RECIBI CONFORME',
  piePagina: '',
  firmaAlmacenBase64: '',
  nombreAlmacenero: '',
  dniAlmacenero: '',
  ruc: '',
  razonSocial: '',
  logoEmpresaBase64: '',
};

function mapRow(row: any, tipo: 'NI' | 'NS'): PlantillaAlmacen {
  const def = tipo === 'NI' ? DEFAULT_NI : DEFAULT_NS;
  if (!row) return { ...def };
  return {
    tipoDocumento:          tipo,
    tituloDocumento:        row.tituloDocumento        ?? def.tituloDocumento,
    mostrarUbicacionFisica: row.mostrarUbicacionFisica ?? def.mostrarUbicacionFisica,
    mostrarCodInterno:      row.mostrarCodInterno      ?? def.mostrarCodInterno,
    mostrarStockActual:     row.mostrarStockActual     ?? def.mostrarStockActual,
    mostrarCCostos:         row.mostrarCCostos         ?? def.mostrarCCostos,
    mostrarCantidadPendiente: row.mostrarCantidadPendiente ?? def.mostrarCantidadPendiente,
    mostrarCantidadCompra:  row.mostrarCantidadCompra  ?? def.mostrarCantidadCompra,
    firmante1:              row.firmante1              ?? def.firmante1,
    firmante2:              row.firmante2              ?? def.firmante2,
    piePagina:              row.piePagina              ?? '',
    firmaAlmacenBase64:     row.firmaAlmacenBase64     ?? '',
    nombreAlmacenero:       row.nombreAlmacenero       ?? '',
    dniAlmacenero:          row.dniAlmacenero          ?? '',
    ruc:                    row.ruc                    ?? '',
    razonSocial:            row.razonSocial            ?? '',
    logoEmpresaBase64:      row.logoEmpresaBase64      ?? '',
  };
}

@Injectable({ providedIn: 'root' })
export class AlmacenPlantillaService {
  private http = inject(HttpClient);

  /** Obtiene ambas plantillas (NI y NS) desde la BD, filtradas por empresa */
  obtenerAmbas(ruc?: string): Observable<{ ni: PlantillaAlmacen; ns: PlantillaAlmacen }> {
    const params = ruc ? `?ruc=${encodeURIComponent(ruc)}` : '';
    return this.http.get<any[]>(`${BASE}${params}`).pipe(
      map(rows => {
        const ni = rows.find(r => r.tipoDocumento === 'NI');
        const ns = rows.find(r => r.tipoDocumento === 'NS');
        return { ni: mapRow(ni, 'NI'), ns: mapRow(ns, 'NS') };
      }),
      catchError(() => of({ ni: { ...DEFAULT_NI }, ns: { ...DEFAULT_NS } }))
    );
  }

  /** Obtiene una sola plantilla por tipo y empresa */
  obtener(tipo: 'NI' | 'NS', ruc?: string): Observable<PlantillaAlmacen> {
    let url = `${BASE}?tipo=${tipo}`;
    if (ruc) url += `&ruc=${encodeURIComponent(ruc)}`;
    return this.http.get<any[]>(url).pipe(
      map(rows => mapRow(rows?.[0], tipo)),
      catchError(() => of(tipo === 'NI' ? { ...DEFAULT_NI } : { ...DEFAULT_NS }))
    );
  }

  /** Guarda una plantilla en la BD (incluye ruc de empresa) */
  guardar(plantilla: PlantillaAlmacen, usuario?: string): Observable<any> {
    return this.http.post(BASE, { ...plantilla, usuario: usuario ?? 'SISTEMA' });
  }
}
