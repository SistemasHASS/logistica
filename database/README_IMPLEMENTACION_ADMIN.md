# Guía de Implementación - Módulo de Administración

## 📋 Tabla de Contenidos
1. [Resumen](#resumen)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [Servicios Angular Creados](#servicios-angular-creados)
4. [Endpoints del Backend](#endpoints-del-backend)
5. [Implementación en el Backend](#implementación-en-el-backend)
6. [Uso de los Componentes](#uso-de-los-componentes)
7. [Pasos de Implementación](#pasos-de-implementación)

---

## 🎯 Resumen

Este módulo de administración proporciona una gestión completa de:
- **Áreas**: Gestión de áreas organizacionales
- **Usuarios**: Administración de usuarios del sistema
- **Perfiles**: Definición de perfiles de usuario
- **Roles**: Gestión de roles y permisos
- **Flujos**: Configuración de flujos de aprobación
- **Aprobadores**: Asignación de aprobadores a flujos

---

## 🗄️ Estructura de Base de Datos

### Tablas Creadas

#### 1. `logistica_areas`
```sql
- id (PK, IDENTITY)
- nombre (NVARCHAR(100), NOT NULL)
- descripcion (NVARCHAR(500))
- codigo (NVARCHAR(20))
- estado (NVARCHAR(20), DEFAULT 'ACTIVO')
- fecha_creacion (DATETIME, DEFAULT GETDATE())
- fecha_modificacion (DATETIME)
- usuario_creacion (NVARCHAR(50))
- usuario_modificacion (NVARCHAR(50))
```

#### 2. `logistica_usuarios`
```sql
- id (PK, IDENTITY)
- documento_identidad (NVARCHAR(20), NOT NULL, UNIQUE)
- nombres (NVARCHAR(100), NOT NULL)
- apellidos (NVARCHAR(100), NOT NULL)
- email (NVARCHAR(100))
- telefono (NVARCHAR(20))
- area_id (FK -> logistica_areas)
- perfil_id (FK -> logistica_perfiles)
- cargo (NVARCHAR(100))
- usuario (NVARCHAR(50))
- password (NVARCHAR(255))
- estado (NVARCHAR(20), DEFAULT 'ACTIVO')
- fecha_creacion (DATETIME)
- ultimo_acceso (DATETIME)
```

#### 3. `logistica_perfiles`
```sql
- id (PK, IDENTITY)
- nombre (NVARCHAR(100), NOT NULL)
- descripcion (NVARCHAR(500))
- codigo (NVARCHAR(20))
- estado (NVARCHAR(20), DEFAULT 'ACTIVO')
- fecha_creacion (DATETIME)
```

#### 4. `logistica_roles`
```sql
- id (PK, IDENTITY)
- nombre (NVARCHAR(100), NOT NULL)
- descripcion (NVARCHAR(500))
- codigo (NVARCHAR(20))
- modulo (NVARCHAR(50))
- permiso (NVARCHAR(50))
- estado (NVARCHAR(20), DEFAULT 'ACTIVO')
```

#### 5. `logistica_flujos`
```sql
- id (PK, IDENTITY)
- nombre (NVARCHAR(100), NOT NULL)
- descripcion (NVARCHAR(500))
- codigo (NVARCHAR(20))
- area_id (FK -> logistica_areas)
- tipo_requerimiento (NVARCHAR(50))
- monto_minimo (DECIMAL(18,2))
- monto_maximo (DECIMAL(18,2))
- orden (INT)
- estado (NVARCHAR(20), DEFAULT 'ACTIVO')
```

#### 6. `logistica_aprobadores`
```sql
- id (PK, IDENTITY)
- usuario_id (FK -> logistica_usuarios)
- flujo_id (FK -> logistica_flujos)
- area_id (FK -> logistica_areas)
- nivel_aprobacion (INT, DEFAULT 1)
- monto_maximo (DECIMAL(18,2))
- puede_delegar (BIT, DEFAULT 0)
- es_aprobador_final (BIT, DEFAULT 0)
- estado (NVARCHAR(20), DEFAULT 'ACTIVO')
```

#### 7. Tablas de Relación
- `logistica_perfil_roles`: Relación muchos a muchos entre perfiles y roles
- `logistica_usuario_roles`: Roles adicionales asignados directamente a usuarios

---

## 🔧 Servicios Angular Creados

### 1. AdminAreasService
**Ubicación**: `src/app/modules/main/pages/administracion/services/admin-areas.service.ts`

**Métodos**:
- `listarAreas(body)`: Observable - Lista todas las áreas activas
- `crearArea(body)`: Promise - Crea una nueva área
- `actualizarArea(body)`: Promise - Actualiza un área existente
- `eliminarArea(body)`: Promise - Cambia el estado de un área a INACTIVO
- `obtenerAreaPorId(body)`: Observable - Obtiene un área específica

### 2. AdminUsuariosService
**Ubicación**: `src/app/modules/main/pages/administracion/services/admin-usuarios.service.ts`

**Métodos**:
- `listarUsuarios(body)`: Observable
- `crearUsuario(body)`: Promise
- `actualizarUsuario(body)`: Promise
- `eliminarUsuario(body)`: Promise
- `obtenerUsuarioPorId(body)`: Observable
- `asignarPerfil(body)`: Promise
- `asignarRoles(body)`: Promise

### 3. AdminPerfilesService
**Ubicación**: `src/app/modules/main/pages/administracion/services/admin-perfiles.service.ts`

**Métodos**:
- `listarPerfiles(body)`: Observable
- `crearPerfil(body)`: Promise
- `actualizarPerfil(body)`: Promise
- `eliminarPerfil(body)`: Promise
- `obtenerPerfilPorId(body)`: Observable
- `asignarRolesPerfil(body)`: Promise

### 4. AdminRolesService
**Ubicación**: `src/app/modules/main/pages/administracion/services/admin-roles.service.ts`

**Métodos**:
- `listarRoles(body)`: Observable
- `crearRol(body)`: Promise
- `actualizarRol(body)`: Promise
- `eliminarRol(body)`: Promise
- `obtenerRolPorId(body)`: Observable

### 5. AdminFlujosService
**Ubicación**: `src/app/modules/main/pages/administracion/services/admin-flujos.service.ts`

**Métodos**:
- `listarFlujos(body)`: Observable
- `crearFlujo(body)`: Promise
- `actualizarFlujo(body)`: Promise
- `eliminarFlujo(body)`: Promise
- `obtenerFlujoPorId(body)`: Observable
- `listarFlujosPorArea(body)`: Observable
- `asignarAprobadores(body)`: Promise

### 6. AdminAprobadoresService
**Ubicación**: `src/app/modules/main/pages/administracion/services/admin-aprobadores.service.ts`

**Métodos**:
- `listarAprobadores(body)`: Observable
- `crearAprobador(body)`: Promise
- `actualizarAprobador(body)`: Promise
- `eliminarAprobador(body)`: Promise
- `obtenerAprobadorPorId(body)`: Observable
- `listarAprobadoresPorArea(body)`: Observable
- `asignarFlujo(body)`: Promise

---

## 🌐 Endpoints del Backend

Todos los endpoints deben agregarse al `LogisticaController.cs` en el backend:

### Áreas
```csharp
POST /api/logistica/listar-areas
POST /api/logistica/crear-area
POST /api/logistica/actualizar-area
POST /api/logistica/eliminar-area
POST /api/logistica/obtener-area
```

### Usuarios
```csharp
POST /api/logistica/listar-usuarios
POST /api/logistica/crear-usuario
POST /api/logistica/actualizar-usuario
POST /api/logistica/eliminar-usuario
POST /api/logistica/obtener-usuario
POST /api/logistica/asignar-perfil-usuario
POST /api/logistica/asignar-roles-usuario
```

### Perfiles
```csharp
POST /api/logistica/listar-perfiles
POST /api/logistica/crear-perfil
POST /api/logistica/actualizar-perfil
POST /api/logistica/eliminar-perfil
POST /api/logistica/obtener-perfil
POST /api/logistica/asignar-roles-perfil
```

### Roles
```csharp
POST /api/logistica/listar-roles
POST /api/logistica/crear-rol
POST /api/logistica/actualizar-rol
POST /api/logistica/eliminar-rol
POST /api/logistica/obtener-rol
```

### Flujos
```csharp
POST /api/logistica/listar-flujos
POST /api/logistica/crear-flujo
POST /api/logistica/actualizar-flujo
POST /api/logistica/eliminar-flujo
POST /api/logistica/obtener-flujo
POST /api/logistica/listar-flujos-area
POST /api/logistica/asignar-aprobadores-flujo
```

### Aprobadores
```csharp
POST /api/logistica/listar-aprobadores
POST /api/logistica/crear-aprobador
POST /api/logistica/actualizar-aprobador
POST /api/logistica/eliminar-aprobador
POST /api/logistica/obtener-aprobador
POST /api/logistica/listar-aprobadores-area
POST /api/logistica/asignar-flujo-aprobador
```

---

## 🔨 Implementación en el Backend

### 1. Agregar Métodos al LogisticaController.cs

```csharp
// EJEMPLO: Endpoint para listar áreas
[HttpPost("listar-areas")]
[ProducesResponseType(typeof(JsonElement), StatusCodes.Status200OK)]
public async Task<ActionResult<dynamic>> ListarAreas([FromBody] JsonElement? body = null)
{
    string json = body.HasValue && body.Value.ValueKind != JsonValueKind.Null ? body.Value.ToString() : "[]";
    var resultado = await this.logisticaUseCase.ListarAreasAsync(json);
    return Ok(resultado.FirstOrDefault());
}

// EJEMPLO: Endpoint para crear área
[HttpPost("crear-area")]
[ProducesResponseType(typeof(JsonElement), StatusCodes.Status200OK)]
public async Task<ActionResult<dynamic>> CrearArea([FromBody] JsonElement? body = null)
{
    string json = body.HasValue && body.Value.ValueKind != JsonValueKind.Null ? body.Value.ToString() : "[]";
    var resultado = await this.logisticaUseCase.CrearAreaAsync(json);
    return Ok(resultado.FirstOrDefault());
}
```

### 2. Agregar Métodos al ILogisticaUseCase

```csharp
public interface ILogisticaUseCase
{
    // Áreas
    Task<List<dynamic>> ListarAreasAsync(string json);
    Task<List<dynamic>> CrearAreaAsync(string json);
    Task<List<dynamic>> ActualizarAreaAsync(string json);
    Task<List<dynamic>> EliminarAreaAsync(string json);
    
    // Usuarios
    Task<List<dynamic>> ListarUsuariosAsync(string json);
    Task<List<dynamic>> CrearUsuarioAsync(string json);
    // ... más métodos
}
```

### 3. Implementar en LogisticaUseCase

```csharp
public async Task<List<dynamic>> ListarAreasAsync(string json)
{
    return await this.logisticaRepository.ListarAreasAsync(json);
}

public async Task<List<dynamic>> CrearAreaAsync(string json)
{
    return await this.logisticaRepository.CrearAreaAsync(json);
}
```

### 4. Implementar en LogisticaRepository

```csharp
public async Task<List<dynamic>> ListarAreasAsync(string json)
{
    return await EjecutarStoredProcedureAsync(
        "sp_listar_areas",
        json,
        reader => new
        {
            id = reader.GetInt32(0),
            nombre = reader.GetString(1),
            descripcion = reader.IsDBNull(2) ? null : reader.GetString(2),
            codigo = reader.IsDBNull(3) ? null : reader.GetString(3),
            estado = reader.GetString(4),
            fecha_creacion = reader.GetDateTime(5)
        },
        parametrosRequeridos: false
    );
}
```

---

## 📖 Uso de los Componentes

### Ejemplo: AdminAreasComponent

```typescript
import { Component, OnInit } from '@angular/core';
import { AdminAreasService } from '../../services/admin-areas.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

export class AdminAreasComponent implements OnInit {
  areas: any[] = [];
  loading = false;

  constructor(
    private adminAreasService: AdminAreasService,
    private userService: UserService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarAreas();
  }

  async cargarAreas() {
    this.loading = true;
    const usuario = this.userService.getUsuario();
    const body = {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };

    this.adminAreasService.listarAreas(body).subscribe({
      next: (response) => {
        this.areas = response?.data || response || [];
        this.loading = false;
      },
      error: (error) => {
        this.alertService.showAlertError('Error', 'Error al cargar áreas');
        this.loading = false;
      }
    });
  }

  async guardar(area: any) {
    const usuario = this.userService.getUsuario();
    const body = {
      ...area,
      usuario: usuario?.documentoidentidad || '',
      ruc: usuario?.ruc || ''
    };

    await this.adminAreasService.crearArea(body);
    this.alertService.showAlertAcept('Éxito', 'Área creada', 'success');
    this.cargarAreas();
  }
}
```

---

## 🚀 Pasos de Implementación

### Paso 1: Ejecutar Scripts SQL
```bash
# En SQL Server Management Studio
1. Abrir: 01_CREATE_TABLES_LOGISTICA_ADMIN.sql
2. Ejecutar el script para crear todas las tablas
3. Abrir: 02_CREATE_STORED_PROCEDURES_ADMIN.sql
4. Ejecutar el script para crear todos los SPs
```

### Paso 2: Implementar Backend (.NET)
```bash
1. Agregar métodos al LogisticaController.cs
2. Agregar definiciones a ILogisticaUseCase
3. Implementar métodos en LogisticaUseCase
4. Implementar métodos en LogisticaRepository
5. Compilar y probar endpoints con Postman
```

### Paso 3: Verificar Frontend (Angular)
```bash
# Los services ya están creados en:
src/app/modules/main/pages/administracion/services/

# Componentes actualizados:
- admin-areas.component.ts (✅ Implementado)
- admin-usuarios.component.ts (Pendiente)
- admin-perfiles.component.ts (Pendiente)
- admin-roles.component.ts (Pendiente)
- admin-flujos.component.ts (Pendiente)
- admin-aprobadores.component.ts (Pendiente)
```

### Paso 4: Probar Integración
```bash
1. Iniciar backend API
2. Iniciar frontend Angular
3. Navegar a /admin/areas
4. Probar CRUD completo:
   - Crear área
   - Listar áreas
   - Editar área
   - Eliminar área
```

---

## 📝 Notas Importantes

### Formato de Body para Requests
Todos los endpoints esperan un JSON con la siguiente estructura base:
```json
{
  "ruc": "20123456789",
  "usuario": "12345678",
  // ... otros campos específicos
}
```

### Respuesta Estándar del Backend
```json
{
  "data": [...],
  "mensaje": "Operación exitosa",
  "success": true
}
```

### Manejo de Errores
- Todos los services tienen try-catch
- Los errores se muestran con AlertService
- Los logs se envían a console.error

---

## 🔐 Seguridad

1. **Validación de Usuario**: Todos los endpoints validan el usuario actual
2. **Estados**: Se usa soft delete (cambio de estado a INACTIVO)
3. **Auditoría**: Todas las tablas tienen campos de auditoría
4. **Permisos**: Los roles definen permisos por módulo

---

## 📚 Recursos Adicionales

- **Scripts SQL**: `/database/scripts/`
- **Services Angular**: `/src/app/modules/main/pages/administracion/services/`
- **Componentes**: `/src/app/modules/main/pages/administracion/pages/`
- **Interfaces**: Agregar a `/src/app/shared/interfaces/Tables.ts`

---

## ✅ Checklist de Implementación

- [x] Crear tablas en SQL Server
- [x] Crear stored procedures
- [x] Crear services Angular
- [x] Actualizar AdminAreasComponent
- [ ] Implementar endpoints en backend
- [ ] Actualizar componentes restantes
- [ ] Probar integración completa
- [ ] Documentar casos de uso
- [ ] Crear tests unitarios

---

**Fecha de Creación**: 26 de Enero, 2026  
**Versión**: 1.0  
**Autor**: Sistema de Logística
