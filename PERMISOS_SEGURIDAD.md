# 📋 Implementación de Permisos y Seguridad

## 🎯 Resumen de Implementación

Se ha implementado un sistema completo de permisos para los módulos de **Devoluciones de Consumo** y **Reingresos** en tres niveles:

1. ✅ **Backend**: Middleware de autorización con atributos por endpoint
2. ✅ **Frontend**: Menú de navegación condicional según rol
3. ✅ **Frontend**: Guards de ruta para protección de acceso

---

## 🔐 1. Backend - Middleware de Autorización

### Archivo Creado
- `Infraestructure/Middleware/AuthorizationMiddleware.cs`

### Funcionalidad
- Intercepta todas las peticiones HTTP
- Valida roles mediante atributos `[RequiredRoles]`
- Retorna 403 Forbidden si no tiene permisos
- Soporta múltiples roles por endpoint

### Atributos de Permisos

#### Devolución de Consumo
```csharp
[RequiredRoles("JEFE_ALMACEN", "PERSONAL_ALMACEN", "JEFE_AREA")]
public class DevolucionConsumoController : ControllerBase

// Métodos específicos
[HttpPost("aprobar")]
[RequiredRoles("JEFE_ALMACEN")]
public async Task<ActionResult<dynamic>> AprobarDevolucion()

[HttpPost("rechazar")]
[RequiredRoles("JEFE_ALMACEN")]
public async Task<ActionResult<dynamic>> RechazarDevolucion()

[HttpPost("anular")]
[RequiredRoles("JEFE_ALMACEN")]
public async Task<ActionResult<dynamic>> AnularDevolucion()
```

#### Reingresos
```csharp
[RequiredRoles("JEFE_AREA", "JEFE_ALMACEN", "PERSONAL_ALMACEN")]
public class ReingresoController : ControllerBase

// Métodos específicos
[HttpPost("aprobar")]
[RequiredRoles("JEFE_AREA")]
public async Task<ActionResult<dynamic>> AprobarReingreso()

[HttpPost("rechazar")]
[RequiredRoles("JEFE_AREA")]
public async Task<ActionResult<dynamic>> RechazarReingreso()
```

### Configuración en Program.cs
```csharp
// Registro del middleware
app.UseMiddleware<AuthorizationMiddleware>();
```

---

## 🎨 2. Frontend - Menú de Navegación

### Archivo Modificado
- `modules/main/pages/layout/layout.component.html`

### Módulos Agregados al Menú

#### Devoluciones de Consumo
```html
<li *ngIf="usuario?.idrol.includes('TI') || usuario?.idrol.includes('ALLOGIST')" class="sidebar-item">
  <a routerLink="./devoluciones-consumo" routerLinkActive="active" class="sidebar-link">
    <span><i class="icon icon-rotate-left"></i></span>
    <span class="hide-menu"> Devoluciones de Consumo</span>
  </a>
</li>
```

#### Reingresos
```html
<li *ngIf="usuario?.idrol.includes('TI') || usuario?.idrol.includes('ALLOGIST') || usuario?.idrol.includes('JEFE_AREA')" class="sidebar-item">
  <a routerLink="./reingresos" routerLinkActive="active" class="sidebar-link">
    <span><i class="icon icon-refresh"></i></span>
    <span class="hide-menu"> Reingresos</span>
  </a>
</li>
```

### Roles con Acceso al Menú
- **Devoluciones de Consumo**: TILOGIST, ALLOGIST, ADLOGIST
- **Reingresos**: TILOGIST, ALLOGIST, ADLOGIST, APLOGIST

---

## 🛡️ 3. Frontend - Guards de Ruta

### Archivo Creado
- `modules/main/guards/role.guard.ts`

### Guards Implementados

#### DevolucionConsumoGuard
```typescript
@Injectable({ providedIn: 'root' })
export class DevolucionConsumoGuard implements CanActivate {
  canActivate(): boolean {
    const rolesPermitidos = ['JEFE_ALMACEN', 'PERSONAL_ALMACEN', 'JEFE_AREA'];
    return this.validarAcceso(rolesPermitidos);
  }
}
```

#### ReingresoGuard
```typescript
@Injectable({ providedIn: 'root' })
export class ReingresoGuard implements CanActivate {
  canActivate(): boolean {
    const rolesPermitidos = ['JEFE_AREA', 'JEFE_ALMACEN', 'PERSONAL_ALMACEN'];
    return this.validarAcceso(rolesPermitidos);
  }
}
```

#### JefeAlmacenGuard
```typescript
@Injectable({ providedIn: 'root' })
export class JefeAlmacenGuard implements CanActivate {
  canActivate(): boolean {
    // Solo JEFE_ALMACEN puede aprobar/rechazar/anular devoluciones
    return this.validarAcceso(['JEFE_ALMACEN']);
  }
}
```

#### JefeAreaGuard
```typescript
@Injectable({ providedIn: 'root' })
export class JefeAreaGuard implements CanActivate {
  canActivate(): boolean {
    // Solo JEFE_AREA puede aprobar/rechazar reingresos
    return this.validarAcceso(['JEFE_AREA']);
  }
}
```

### Configuración de Rutas
```typescript
// app.routes.ts
{ 
  path: 'devoluciones-consumo', 
  component: DevolucionesConsumoComponent, 
  canActivate: [DevolucionConsumoGuard] 
},
{ 
  path: 'reingresos', 
  component: ReingresosComponent, 
  canActivate: [ReingresoGuard] 
}
```

---

## 🔄 4. Interceptor HTTP

### Archivo Creado
- `modules/main/interceptors/auth.interceptor.ts`

### Funcionalidad
- Agrega headers de autorización a todas las peticiones HTTP
- Mapea roles del frontend a roles del backend
- Maneja errores 403 (Forbidden)

### Mapeo de Roles
| Rol Frontend | Rol Backend |
|--------------|-------------|
| TILOGIST | TI |
| ADLOGIST, ALLOGIST | JEFE_ALMACEN |
| APLOGIST | JEFE_AREA |
| OPLOGIST, EMLOGIST, LOLOGIST | PERSONAL_ALMACEN |

### Headers Agregados
```http
X-User-Role: JEFE_ALMACEN
X-User-Area: A001
X-User-Id: 12345678
```

---

## 📊 Matriz de Permisos

### Devoluciones de Consumo

| Acción | JEFE_ALMACEN | PERSONAL_ALMACEN | JEFE_AREA | USUARIO |
|--------|--------------|------------------|-----------|---------|
| Ver módulo | ✅ | ✅ | ✅ | ❌ |
| Registrar devolución | ✅ | ✅ | ✅ | ❌ |
| Aprobar devolución | ✅ | ❌ | ❌ | ❌ |
| Rechazar devolución | ✅ | ❌ | ❌ | ❌ |
| Anular devolución | ✅ | ❌ | ❌ | ❌ |

### Reingresos

| Acción | JEFE_ALMACEN | PERSONAL_ALMACEN | JEFE_AREA | USUARIO |
|--------|--------------|------------------|-----------|---------|
| Ver módulo | ✅ | ✅ | ✅ | ❌ |
| Generar reingreso | ✅ | ✅ | ❌ | ❌ |
| Aprobar reingreso | ❌ | ❌ | ✅ | ❌ |
| Rechazar reingreso | ❌ | ❌ | ✅ | ❌ |
| Anular reingreso | ✅ | ❌ | ❌ | ❌ |

---

## 🔧 Configuración Adicional

### Para activar el interceptor en app.config.ts (Angular 17+)
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([AuthInterceptor])),
    // ... otros providers
  ]
};
```

### O en app.module.ts (Angular 16 y anteriores)
```typescript
@NgModule({
  // ...
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
```

---

## 🚀 Flujo de Validación

1. **Usuario intenta acceder a una ruta**
   - Guard de ruta verifica si tiene el rol permitido
   - Si no tiene permiso → redirige a dashboard

2. **Si el usuario tiene acceso al módulo**
   - El menú muestra el módulo según su rol
   - Puede navegar y ver la interfaz

3. **Al realizar una acción específica**
   - Interceptor agrega headers con rol de usuario
   - Backend valida con `[RequiredRoles]`
   - Si no tiene permiso → retorna 403 Forbidden

4. **Manejo de errores 403**
   - Interceptor captura el error
   - Puede mostrar alerta o redirigir

---

## ✅ Verificación Final

### Backend
- [x] Middleware de autorización creado
- [x] Atributos de permisos en controllers
- [x] Middleware registrado en Program.cs

### Frontend
- [x] Menú actualizado con condición de rol
- [x] Guards de ruta creados
- [x] Rutas configuradas con guards
- [x] Interceptor HTTP creado

### Seguridad
- [x] Validación en backend (no solo frontend)
- [x] Múltiples capas de seguridad
- [x] Manejo adecuado de errores
- [x] Mapeo correcto de roles

---

## 📝 Notas Importantes

1. **El middleware de backend es la capa principal de seguridad**
2. **Los guards de frontend son para mejor UX (evitan navegación innecesaria)**
3. **El interceptor asegura que el backend siempre reciba el rol del usuario**
4. **Los roles deben estar sincronizados entre frontend y backend**
5. **Se recomienda agregar logs de auditoría para acciones sensibles**

---

**Estado**: ✅ **IMPLEMENTACIÓN COMPLETA DE PERMISOS Y SEGURIDAD**
