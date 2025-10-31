import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class MaestrasService {

  private readonly baseUrl: string = environment.baseUrl;
  private readonly apiMaestra: string = environment.apiMaestra;

  constructor(private http: HttpClient) { }

  getFundos(body: any): Observable<any> {
    const url = `${this.apiMaestra}/api/Maestros/get-fundos`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error obteniendo fundos');
    }
  }

  getAreas(body: any): Observable<any> {
    const url = `${this.apiMaestra}/api/Maestros/get-areas`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error obteniendo areas');
    }
  }

  getProyectos(body: any): Observable<any> {
    const url = `${this.apiMaestra}/api/Maestros/get-proyectos`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error en el api: proyectos');
    }
  }

  getItems(body: any): Observable<any> {
    const url = `${this.apiMaestra}/api/Maestros/get-items-cmmdty`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error en el api: items');
    }
  }

  getClasificaciones(body: any): Observable<any> {
    const url = `${this.apiMaestra}/api/Maestros/get-clas-rq`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error en el api: clasificaciones');
    }
  }

  getCultivos(body: any): Observable<any> {
    const url = `${this.apiMaestra}/api/Maestros/get-cultivos`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error en el api: cultivos');
    }
  }

  getAlmacenes(body: any): Observable<any> {
    const url = `${this.apiMaestra}/api/Maestros/get-almacen`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error en el api: almacenes');
    }
  }

  async getEmpresas(body: any): Promise<any> {
    const url = `${this.apiMaestra}/api/Maestros/get_empresas`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error en el api: empresas');
    }
  }

  getGrupos(params: any): Observable<any> {
    const url = `${this.baseUrl}/maestras/grupos/${params.ruc}/${params.idproyecto}/${params.nrodocumento}`;
    try {
      return this.http.get<any>(url);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error obteniendo grupos');
    }
  }

  getTapas(): Observable<any> {
    const url = `${this.baseUrl}/maestras/tapas`;
    try {
      return this.http.get<any>(url);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error obteniendo tapas');
    }
  }

  getModulos(sociedad: any): Observable<any> {
    const url = `${this.baseUrl}/maestras/modulos/${sociedad}`;
    try {
      return this.http.get<any>(url);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error obteniendo modulos');
    }
  }

  getLotes(sociedad: any): Observable<any> {
    const url = `${this.baseUrl}/maestras/lotes/${sociedad}`;
    try {
      return this.http.get<any>(url);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error obteniendo lotes');
    }
  }

  getTurnos(body: any): Observable<any> {
    const url = `${this.apiMaestra}/api/Maestros/get-turnos`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error en el api: turnos');
    }
  }

  getVariedades(sociedad: any): Observable<any> {
    const url = `${this.baseUrl}/maestras/variedades/${sociedad}`;
    try {
      return this.http.get<any>(url);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error obteniendo variedades');
    }
  }

  getEnvases(): Observable<any> {
    const url = `${this.baseUrl}/maestras/envases`;
    try {
      return this.http.get<any>(url);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error obteniendo envases');
    }
  }

  getCosechadores(params: any): Observable<any> {
    const url = `${this.baseUrl}/maestras/cosechadores/${params.nrodocumento}`;
    try {
      return this.http.get<any>(url);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error obteniendo cosechadores');
    }
  }

  getAcopios(sociedad: any): Observable<any> {
    const url = `${this.baseUrl}/maestras/acopios/${sociedad}`;
    try {
      return this.http.get<any>(url);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener los acopios');
    }
  }

  getCecos(body: any): Observable<any> {
    const url = `${this.apiMaestra}/api/Maestros/get-cecos`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error en el api: cecos');
    }
  }

  async getLabores(body: any): Promise<any> {
    const url = `${this.apiMaestra}/api/Maestros/get-labores`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body).pipe());
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error en el api: labores');
    }
  }

  getMonedas(params: any): Observable<any> {
    const url = `${this.baseUrl}/tareo/monedas`;
    try {
      let httpParams = new HttpParams();
      const paramsString = JSON.stringify(params)
      httpParams = httpParams.set('parametros', paramsString);
      return this.http.get<any>(url, { params: httpParams });
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener las monedas');
    }
  }

  getActividades(params: any): Observable<any> {
    const url = `${this.baseUrl}/tareo/labor`;
    try {
      let httpParams = new HttpParams();
      const paramsString = JSON.stringify(params)
      httpParams = httpParams.set('parametros', paramsString);
      return this.http.get<any>(url, { params: httpParams });
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener las labores');
    }
  }

  getIncidencias(params: any): Observable<any> {
    const url = `${this.baseUrl}/tareo/incidencias`;
    try {
      let httpParams = new HttpParams();
      const paramsString = JSON.stringify(params)
      httpParams = httpParams.set('parametros', paramsString);
      return this.http.get<any>(url, { params: httpParams });
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener las labores');
    }
  }

  getMotivosSalida(params: any): Observable<any> {
    const url = `${this.baseUrl}/tareo/motivosalida`;
    try {
      let httpParams = new HttpParams();
      const paramsString = JSON.stringify(params)
      httpParams = httpParams.set('parametros', paramsString);
      return this.http.get<any>(url, { params: httpParams });
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener las labores');
    }
  }
}
