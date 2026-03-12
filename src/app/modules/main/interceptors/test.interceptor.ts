import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const testInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Agregar un header de prueba a todas las peticiones
  // console.log('🚀 TEST INTERCEPTOR - URL:', request.url);
  
  if (request.url.includes('/api/')) {
    request = request.clone({
      setHeaders: {
        'X-Test-Header': 'INTERCEPTOR_WORKING',
        'X-User-Role': 'OPLOGIST' // Forzar el rol para prueba
      }
    });
    // console.log('🚀 TEST INTERCEPTOR - Headers agregados');
  }
  
  return next(request);
};
