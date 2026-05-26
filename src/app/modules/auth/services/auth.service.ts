import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '@/environments/environment';
import { lastValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl: string = environment.baseUrl;
  private readonly aplicaciones: string = 'LOGISTICA';
  private readonly baseUrlMaestra: string = environment.apiMaestra;

  constructor(
    private http: HttpClient, 
    private dexieService: DexieService, 
    private aprobacionesAreaService: AprobacionesAreaService,
    private router: Router
  ) { }

  async login(
    usuario: string,
    clave: string,
    aplicacion: string
  ): Promise<any> {
    const url = `${this.baseUrlMaestra}/api/Maestros/get-usuarios`;

    // const body = [{ usuario, clave, aplicacion:'LOGISTICA' }];
    const body = [{ usuario, clave, aplicacion: this.aplicaciones }];

    try {
      const response = await lastValueFrom(this.http.post<any>(url, body));
      return response;
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error de autenticación');
    }
  }
  async isLoggedIn() {
    const user = await this.dexieService.showUsuario();
    return !!user;
  }

  async getUser() {
    return await this.dexieService.getUsuarioLogueado();
  }

  //Perfil Administrador
  async isAdministrador() {
    const user = await this.getUser();
    const rol = user?.idrol ?? '';
    return rol.includes('ADLOGIST') || rol.includes('TILOGIST');
  }

  //Perfil Aprobador
  async isAprobador() {
    const user = await this.getUser();
    return user?.idrol === 'APLOGIST';
  }

  //Perfil Almacen
  async isAlmacen() {
    const user = await this.getUser();
    return user?.idrol === 'ALLOGIST';
  }

  //Perfil Usuario
  async isUsuario() {
    const user = await this.getUser();
    return user?.idrol === 'OPLOGIST';
  }

  //Perfil Sistemas
  async isSistemas() {
    const user = await this.getUser();
    return user?.idrol === 'TILOGIST';
  }

  //Perfil Empaque
  async isEmpaque() {
    const user = await this.getUser();
    return user?.idrol === 'EMLOGIST';
  }

  //Perfil Logístico
  async isLogistico() {
    const user = await this.getUser();
    const rol = user?.idrol ?? '';
    return rol.includes('LOLOGIST') || rol.includes('TILOGIST') || 
           rol.includes('ADLOGIST') || rol.includes('JLOLOGIST');
  }

  // ============================
  // 🔐 VALIDACIÓN LOGÍSTICA REAL
  // ============================
  async isAdminSistemaLogistica(): Promise<boolean> {
    const u = await this.getUser();
    if (!u) return false;

    const url = `${this.baseUrl}/api/logistica/es-admin-sistema/${u.usuario}`;
    const resp: any = await lastValueFrom(this.http.get(url));

    return resp?.permitido === true;
  }

  /**
   * Carga el área del usuario logueado y la guarda en Dexie
   */
  async cargarAreaUsuario(): Promise<any> {
    let usuario: any = null;
    
    try {
      usuario = await this.getUser();
      if (!usuario) return null;

      // Obtener información del área del usuario
      const response = await lastValueFrom(
        this.aprobacionesAreaService.obtenerAreaUsuario({
          documentoidentidad: usuario.documentoidentidad,
          ruc: usuario.ruc
        })
      );

      console.log('Respuesta de obtenerAreaUsuario:', response);

      // Verificar si la respuesta es un array y tiene datos
      if (response && Array.isArray(response) && response.length > 0) {
        const areaInfo = response[0];
        
        // Actualizar el usuario con la información del área
        const usuarioActualizado = {
          ...usuario,
          idarea: areaInfo.idarea?.toString(),
          nombreArea: areaInfo.nombreArea,
          esJefeArea: areaInfo.esJefeArea,
          rolArea: areaInfo.rolArea
        };

        // Guardar usuario actualizado en Dexie
        await this.dexieService.saveUsuario(usuarioActualizado);
        
        console.log('Usuario actualizado con información de área:', usuarioActualizado);
        
        // ✅ Redirección según rol y área para APLOGIST
        if (usuarioActualizado.idrol === 'APLOGIST') {
          if (usuarioActualizado.idarea) {
            // Si tiene área, redirigir a aprobaciones-area
            console.log('🔄 APLOGIST con área - Redirigiendo a aprobaciones-area');
            this.router.navigate(['/main/aprobaciones-area']);
          } else {
            // Si no tiene área, redirigir a aprobaciones
            console.log('🔄 APLOGIST sin área - Redirigiendo a aprobaciones');
            this.router.navigate(['/main/aprobaciones']);
          }
        }
        
        return usuarioActualizado;
      } else {
        // El usuario no tiene área asignada, continuar sin área
        console.log('ℹ️ Usuario sin área asignada - Usando flujo de aprobación normal');
        console.log('📝 Para asignar un área, contacte al administrador del sistema');
        
        // ✅ Redirección para APLOGIST sin área
        if (usuario && usuario.idrol === 'APLOGIST') {
          console.log('🔄 APLOGIST sin área - Redirigiendo a aprobaciones');
          this.router.navigate(['/main/aprobaciones']);
        }
        
        // Mostrar mensaje informativo al usuario (opcional)
        // Podrías usar un toast o notificación aquí si quieres
        
        return usuario;
      }
    } catch (error) {
      console.error('Error al cargar área del usuario:', error);
      console.log('ℹ️ Continuando sin área asignada - Usando flujo normal');
      
      // En caso de error, continuar sin área
      return usuario;
    }
  }
}
