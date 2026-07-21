import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { UserService } from '@/app/shared/services/user.service';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Log simple para verificar si se ejecuta
  // console.log('🔐 INTERCEPTOR ACTIVO - URL:', request.url);
  
  // Solo procesar URLs de la API
  if (!request.url.includes('localhost:5213') && !request.url.includes('/api/')) {
    return next(request);
  }
  
  // Inyectar el servicio usando inject()
  const userService = inject(UserService);
  
  const usuario = userService.getUsuario();
  // console.log('🔐 AuthInterceptor - Usuario:', usuario);
  
  if (usuario) {
    // Mapear roles del frontend a roles del backend
    let backendRole = usuario.idrol || 'USUARIO';
    
    // Manejar si idrol es array o string con múltiples roles
    if (Array.isArray(usuario.idrol)) {
      backendRole = usuario.idrol.map((rol: unknown) => String(rol).trim()).filter(Boolean).join(',');
    } else if (typeof usuario.idrol === 'string') {
      backendRole = usuario.idrol.split(',').map((rol: string) => rol.trim()).filter(Boolean).join(',');
    }
    
    // Para ReingresoController, usar el rol original ya que se agregaron OPLOGIST y LOLOGIST
    // Si necesitas mapeo específico para otros módulos, puedes hacerlo aquí
    
    // console.log('🔐 AuthInterceptor - Rol enviado:', backendRole);
    
    // Clonar la petición y agregar el header
    request = request.clone({
      setHeaders: {
        'X-User-Role': backendRole,
        'X-User-Area': usuario.idarea || '',
        'X-User-Id': usuario.documentoidentidad || '',
        'X-Company-Id': usuario.idempresa || ''
      }
    });
    
    // console.log('🔐 AuthInterceptor - Headers agregados:', {
    //   'X-User-Role': backendRole,
    //   'X-User-Area': usuario.idarea || '',
    //   'X-User-Id': usuario.documentoidentidad || ''
    // });
  } else {
    console.log('🔐 AuthInterceptor - No hay usuario');
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        // Acceso denegado - redirigir al dashboard
        console.error('Acceso denegado:', error.error);
        // Aquí podrías mostrar un toast o alerta
      }
      return throwError(() => error);
    })
  );
};
