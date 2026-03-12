import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '@/app/shared/services/user.service';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Agregar el rol del usuario al header para validación en backend
  const userService = new UserService(); // Necesitarás inyectar esto de forma diferente
  
  // console.log('🔐 AuthInterceptor - Request URL:', request.url);
  
  const usuario = userService.getUsuario();
  // console.log('🔐 AuthInterceptor - Usuario:', usuario);
  
  if (usuario) {
    // Mapear roles del frontend a roles del backend
    let backendRole = usuario.idrol || 'USUARIO';
    
    // Manejar si idrol es array o string con múltiples roles
    if (Array.isArray(usuario.idrol)) {
      backendRole = usuario.idrol[0]; // Tomar el primer rol si es array
    } else if (typeof usuario.idrol === 'string' && usuario.idrol.includes(',')) {
      backendRole = usuario.idrol.split(',')[0].trim(); // Tomar el primer rol si hay múltiples
    }
    
    // Para ReingresoController, usar el rol original ya que se agregaron OPLOGIST y LOLOGIST
    // Si necesitas mapeo específico para otros módulos, puedes hacerlo aquí
    
    // console.log('🔐 AuthInterceptor - Rol enviado:', backendRole);
    
    // Clonar la petición y agregar el header
    request = request.clone({
      setHeaders: {
        'X-User-Role': backendRole,
        'X-User-Area': usuario.idarea || '',
        'X-User-Id': usuario.documentoidentidad || ''
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
