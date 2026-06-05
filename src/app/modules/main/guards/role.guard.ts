import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { UserService } from '@/app/shared/services/user.service';

// Función de utilidad para manejar validación de roles
function tieneRolPermitido(usuarioRol: string | string[], rolesPermitidos: string[]): boolean {
  if (!usuarioRol) return false;
  
  // Si es un array, verificar si algún rol está en los permitidos
  if (Array.isArray(usuarioRol)) {
    return rolesPermitidos.some(rol => usuarioRol.includes(rol));
  }
  
  // Si es un string con comas, dividir y verificar
  if (typeof usuarioRol === 'string' && usuarioRol.includes(',')) {
    const rolesArray = usuarioRol.split(',').map(r => r.trim());
    return rolesPermitidos.some(rol => rolesArray.includes(rol));
  }
  
  // Si es un string simple, verificar si está en los permitidos
  return rolesPermitidos.includes(usuarioRol);
}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  canActivate(): boolean {
    const usuario = this.userService.getUsuario();
    
    if (!usuario) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class DevolucionConsumoGuard implements CanActivate {
  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  canActivate(): boolean {
    const usuario = this.userService.getUsuario();
    
    console.log('DevolucionConsumoGuard - Usuario:', usuario);
    console.log('DevolucionConsumoGuard - Rol:', usuario?.idrol);
    
    if (!usuario) {
      console.log('DevolucionConsumoGuard - No hay usuario, redirigiendo a login');
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Roles permitidos: JEFE_ALMACEN, PERSONAL_ALMACEN
    // Mapeo de roles del frontend a roles del backend
    const rolesPermitidos = ['ALLOGIST', 'ADLOGIST', 'OPLOGIST', 'EMLOGIST', 'LOLOGIST', 'APLOGIST'];
    console.log('DevolucionConsumoGuard - Roles permitidos:', rolesPermitidos);
    console.log('DevolucionConsumoGuard - Tiene rol permitido:', tieneRolPermitido(usuario.idrol, rolesPermitidos));
    
    if (!tieneRolPermitido(usuario.idrol, rolesPermitidos)) {
      console.log('DevolucionConsumoGuard - Acceso denegado, redirigiendo a dashboard');
      this.router.navigate(['/main/dashboard']);
      return false;
    }

    console.log('DevolucionConsumoGuard - Acceso permitido');
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReingresoGuard implements CanActivate {
  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  canActivate(): boolean {
    const usuario = this.userService.getUsuario();
    
    console.log('ReingresoGuard - Usuario:', usuario);
    console.log('ReingresoGuard - Rol:', usuario?.idrol);
    
    if (!usuario) {
      console.log('ReingresoGuard - No hay usuario, redirigiendo a login');
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Roles permitidos: JEFE_AREA, JEFE_ALMACEN, PERSONAL_ALMACEN
    // Mapeo de roles del frontend a roles del backend
    const rolesPermitidos = ['APLOGIST', 'ALLOGIST', 'ADLOGIST', 'OPLOGIST', 'EMLOGIST', 'LOLOGIST'];
    console.log('ReingresoGuard - Roles permitidos:', rolesPermitidos);
    console.log('ReingresoGuard - Tiene rol permitido:', tieneRolPermitido(usuario.idrol, rolesPermitidos));
    
    if (!tieneRolPermitido(usuario.idrol, rolesPermitidos)) {
      console.log('ReingresoGuard - Acceso denegado, redirigiendo a dashboard');
      this.router.navigate(['/main/dashboard']);
      return false;
    }

    console.log('ReingresoGuard - Acceso permitido');
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class JefeAlmacenGuard implements CanActivate {
  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  canActivate(): boolean {
    const usuario = this.userService.getUsuario();
    
    if (!usuario) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Solo JEFE_ALMACEN puede aprobar/rechazar/anular
    if (!tieneRolPermitido(usuario.idrol, ['ALLOGIST', 'ADLOGIST'])) {
      // Mostrar mensaje de acceso denegado
      this.router.navigate(['/main/dashboard']);
      return false;
    }

    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class JefeAreaGuard implements CanActivate {
  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  canActivate(): boolean {
    const usuario = this.userService.getUsuario();
    
    if (!usuario) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Solo JEFE_AREA puede aprobar/rechazar reingresos
    if (!tieneRolPermitido(usuario.idrol, ['APLOGIST'])) {
      // Mostrar mensaje de acceso denegado
      this.router.navigate(['/main/dashboard']);
      return false;
    }

    return true;
  }
}
