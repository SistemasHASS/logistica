import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { lastValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Injectable({
    providedIn: 'root'
})
export class ParametrosService {

    private readonly baseUrl: string = environment.baseUrl;

    constructor(
        private http: HttpClient,
        private dexieService: DexieService
    ) { }

    // 🟢 Sincronizar fundos con el backend
    async sincronizarFundos(idEmpresa: string, sociedadUsuario: number): Promise<any[]> {
        const url = `${this.baseUrl}/api/Maestros/get-fundos`;
        const body = [{ idEmpresa }]; // mandas idempresa al backend

        try {
            const response = await lastValueFrom(this.http.post<any[]>(url, body));

            // 🔹 Filtrar fundos solo de la sociedad del usuario
            const fundosFiltrados = response.filter(f => f.empresa === sociedadUsuario);

            // Guardar localmente
            await this.dexieService.saveFundos(fundosFiltrados);

            return fundosFiltrados;
        } catch (error: any) {
            console.error('Error al sincronizar fundos:', error);
            throw new Error(error.error?.message || 'No se pudo sincronizar los fundos');
        }
    }

    // 🟢 Obtener fundos desde la base local (IndexedDB)
    async getFundosLocal(): Promise<any[]> {
        return await this.dexieService.showFundos();
    }

    // 🟢 Guardar manualmente (opcional)
    async saveFundosLocal(fundos: any[]): Promise<void> {
        await this.dexieService.saveFundos(fundos);
    }

    // 🟢 Sincronizar almacenes con el backend
    async sincronizarAlmacenes(ruc: string): Promise<any[]> {
        const url = `${this.baseUrl}/api/Maestros/get-almacen`;
        const body = [{ ruc }]; // mandas ruc al backend

        try {
            const response = await lastValueFrom(this.http.post<any[]>(url, body));

            // Guardar localmente
            await this.dexieService.saveAlmacenes(response);

            return response;
        } catch (error: any) {
            console.error('Error al sincronizar almacenes:', error);
            throw new Error(error.error?.message || 'No se pudo sincronizar los almacenes');
        }
    }

    // 🟢 Obtener almacenes desde la base local (IndexedDB)
    async getAlmacenesLocal(): Promise<any[]> {
        return await this.dexieService.showAlmacenes();
    }

    // 🟢 Guardar manualmente (opcional)
    async saveAlmacenesLocal(almacenes: any[]): Promise<void> {
        await this.dexieService.saveAlmacenes(almacenes);
    }
}
