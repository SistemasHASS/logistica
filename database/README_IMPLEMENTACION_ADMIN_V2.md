# Guía de Implementación - Módulo de Administración V2

## 🎯 Cambio Importante: Usuarios y Roles desde Tablas Maestras

Esta versión está diseñada para trabajar con **usuarios y roles que vienen de tablas maestras externas** (fuera de la BD logística). El sistema de logística solo mantiene **configuraciones locales** de estos usuarios y roles.

---

## 📋 Concepto Clave

### ❌ Lo que NO hacemos:
- NO creamos usuarios en la BD logística
- NO creamos roles en la BD logística
- NO duplicamos información maestra

### ✅ Lo que SÍ hacemos:
- Consultamos usuarios desde tabla maestra externa
- Consultamos roles desde tabla maestra externa
- Guardamos solo la **configuración local** de cada usuario/rol para el sistema de logística
- Asignamos perfiles, áreas, permisos específicos de logística

---

## 🗄️ Estructura de Base de Datos V2

### Tablas que SÍ se crean en BD Logística:

#### 1. `logistica_areas` (Sin cambios)
Gestión de áreas organizacionales del sistema de logística.

#### 2. `logistica_perfiles` (Sin cambios)
Perfiles específicos del sistema de logística.

#### 3. `logistica_usuario_config` ⭐ NUEVA
**Configuración LOCAL de usuarios** (referencia a tabla maestra externa)

```sql
- id (PK)
- documento_identidad (NVARCHAR(20)) -- Referencia al usuario maestro
- area_id (FK -> logistica_areas)
- perfil_id (FK -> logistica_perfiles)
- es_aprobador (BIT)
- nivel_aprobacion (INT)
- monto_maximo_aprobacion (DECIMAL)
- puede_crear_requerimientos (BIT)
- puede_aprobar_requerimientos (BIT)
- notificaciones_email (BIT)
- estado (NVARCHAR(20))
```

**Propósito**: Guardar configuración específica de logística para cada usuario maestro.

#### 4. `logistica_rol_config` ⭐ NUEVA
**Configuración LOCAL de roles** (referencia a roles maestros externos)

```sql
- id (PK)
- codigo_rol_maestro (NVARCHAR(50)) -- Referencia al rol maestro
- modulo_logistica (NVARCHAR(50))
- permiso_crear (BIT)
- permiso_editar (BIT)
- permiso_eliminar (BIT)
- permiso_aprobar (BIT)
- permiso_ver_reportes (BIT)
- permiso_administrar (BIT)
- estado (NVARCHAR(20))
```

**Propósito**: Definir permisos específicos de logística para cada rol maestro.

#### 5. `logistica_perfil_roles`
Relación entre perfiles y roles maestros.

#### 6. `logistica_usuario_roles_adicionales`
Roles adicionales asignados directamente a usuarios (más allá del perfil).

#### 7. `logistica_flujos` (Sin cambios)
Flujos de aprobación.

#### 8. `logistica_aprobadores`
Aprobadores (referencia a usuarios maestros por documento_identidad).

---

## 🔄 Flujo de Trabajo

### Para Usuarios:

```
1. Usuario existe en tabla maestra externa
   ↓
2. Admin selecciona usuario desde lista maestra
   ↓
3. Admin configura usuario para logística:
   - Asigna área
   - Asigna perfil
   - Define si es aprobador
   - Configura permisos específicos
   ↓
4. Se guarda en logistica_usuario_config
   ↓
5. Sistema consulta datos maestros + config local
```

### Para Roles:

```
1. Rol existe en tabla maestra externa
   ↓
2. Admin selecciona rol desde lista maestra
   ↓
3. Admin configura rol para logística:
   - Define módulo de logística
   - Configura permisos específicos (crear, editar, etc.)
   ↓
4. Se guarda en logistica_rol_config
   ↓
5. Sistema consulta roles maestros + config local
```

---

## 📝 Stored Procedures Actualizados

### Para Usuarios:

#### `sp_listar_usuarios_logistica`
```sql
-- Hace JOIN entre tabla maestra y logistica_usuario_config
-- Retorna: datos del usuario maestro + configuración local
```

#### `sp_configurar_usuario_logistica`
```sql
-- Crea o actualiza configuración local del usuario
-- NO crea el usuario, solo su configuración
```

#### `sp_asignar_roles_usuario`
```sql
-- Asigna roles adicionales al usuario
-- Usa codigo_rol_maestro como referencia
```

### Para Roles:

#### `sp_listar_roles_logistica`
```sql
-- Hace JOIN entre tabla maestra y logistica_rol_config
-- Retorna: datos del rol maestro + configuración local
```

#### `sp_configurar_rol_logistica`
```sql
-- Crea o actualiza configuración local del rol
-- NO crea el rol, solo su configuración
```

---

## 🔧 Services Angular Actualizados

### AdminUsuariosService

```typescript
// Listar usuarios (maestros + config local)
listarUsuarios(body): Observable<any>

// Configurar usuario en logística
configurarUsuario(body): Promise<any>

// Asignar roles adicionales
asignarRolesAdicionales(body): Promise<any>

// Listar usuarios maestros sin config
listarUsuariosMaestros(body): Observable<any>
```

### AdminRolesService

```typescript
// Listar roles (maestros + config local)
listarRoles(body): Observable<any>

// Configurar rol en logística
configurarRol(body): Promise<any>

// Listar roles maestros sin config
listarRolesMaestros(body): Observable<any>
```

---

## 🚀 Pasos de Implementación

### Paso 1: Identificar Tablas Maestras

**IMPORTANTE**: Debes identificar las tablas maestras en tu sistema:

```sql
-- Ejemplo de tablas maestras (ajustar según tu BD)
[BD_MAESTRA].[dbo].[usuarios_maestros]
[BD_MAESTRA].[dbo].[roles_maestros]
```

**Campos mínimos requeridos en tabla maestra de usuarios:**
- `documento_identidad` (NVARCHAR)
- `nombres` (NVARCHAR)
- `apellidos` (NVARCHAR)
- `email` (NVARCHAR)
- `estado` (NVARCHAR)

**Campos mínimos requeridos en tabla maestra de roles:**
- `codigo` (NVARCHAR)
- `nombre` (NVARCHAR)
- `descripcion` (NVARCHAR)
- `modulo` (NVARCHAR)
- `estado` (NVARCHAR)

### Paso 2: Ejecutar Scripts SQL V2

```bash
1. Ejecutar: 01_CREATE_TABLES_LOGISTICA_ADMIN_V2.sql
2. Ejecutar: 02_CREATE_STORED_PROCEDURES_ADMIN_V2.sql
3. AJUSTAR las referencias a tablas maestras en los SPs:
   - Buscar: [BD_MAESTRA].[dbo].[usuarios_maestros]
   - Reemplazar con tu tabla maestra real
   - Buscar: [BD_MAESTRA].[dbo].[roles_maestros]
   - Reemplazar con tu tabla maestra real
```

### Paso 3: Implementar Backend

En el backend, los endpoints deben:

1. **Para listar usuarios/roles**: Hacer JOIN con tablas maestras
2. **Para configurar**: Solo insertar/actualizar en tablas de configuración local
3. **Para validar permisos**: Consultar config local + roles del perfil

### Paso 4: Componentes Frontend

Los componentes de administración deben:

1. **Admin-Usuarios**:
   - Mostrar lista de usuarios maestros
   - Permitir configurar cada usuario para logística
   - Asignar área, perfil, permisos

2. **Admin-Roles**:
   - Mostrar lista de roles maestros
   - Permitir configurar permisos específicos de logística
   - Definir qué puede hacer cada rol en el módulo

---

## 📊 Ejemplo de Uso

### Configurar un Usuario

```typescript
// 1. Usuario selecciona un usuario de la tabla maestra
const usuarioMaestro = {
  documento_identidad: '12345678',
  nombres: 'Juan',
  apellidos: 'Pérez'
};

// 2. Configura el usuario para logística
const configuracion = {
  documento_identidad: '12345678',
  area_id: 1, // Área de Logística
  perfil_id: 2, // Perfil "Solicitante"
  es_aprobador: false,
  puede_crear_requerimientos: true,
  puede_aprobar_requerimientos: false,
  notificaciones_email: true,
  estado: 'ACTIVO',
  usuario: 'admin'
};

await adminUsuariosService.configurarUsuario(configuracion);
```

### Configurar un Rol

```typescript
// 1. Usuario selecciona un rol de la tabla maestra
const rolMaestro = {
  codigo: 'ROL_COMPRAS',
  nombre: 'Rol de Compras'
};

// 2. Configura el rol para logística
const configuracion = {
  codigo_rol_maestro: 'ROL_COMPRAS',
  modulo_logistica: 'REQUERIMIENTOS',
  permiso_crear: true,
  permiso_editar: true,
  permiso_eliminar: false,
  permiso_aprobar: false,
  permiso_ver_reportes: true,
  permiso_administrar: false,
  estado: 'ACTIVO',
  usuario: 'admin'
};

await adminRolesService.configurarRol(configuracion);
```

---

## 🔐 Validación de Permisos

Cuando un usuario intenta realizar una acción en logística:

```sql
1. Obtener usuario desde tabla maestra
2. Obtener configuración local (logistica_usuario_config)
3. Obtener perfil asignado
4. Obtener roles del perfil (logistica_perfil_roles)
5. Obtener roles adicionales (logistica_usuario_roles_adicionales)
6. Obtener configuración de cada rol (logistica_rol_config)
7. Validar permisos según la acción solicitada
```

---

## ⚠️ Consideraciones Importantes

### 1. Sincronización
- Los usuarios/roles maestros pueden cambiar externamente
- Implementar proceso de sincronización periódica si es necesario
- Validar que el usuario/rol maestro siga activo

### 2. Eliminación
- NO eliminar usuarios/roles maestros
- Solo cambiar estado en configuración local
- Mantener histórico de configuraciones

### 3. Permisos
- Los permisos de logística son **adicionales** a los permisos maestros
- Un usuario puede tener permisos maestros pero no configuración en logística
- La configuración local define qué puede hacer en el módulo de logística

### 4. Auditoría
- Todas las configuraciones tienen campos de auditoría
- Registrar quién configuró cada usuario/rol
- Mantener fechas de creación y modificación

---

## 📁 Archivos Creados

### Scripts SQL V2:
- `01_CREATE_TABLES_LOGISTICA_ADMIN_V2.sql`
- `02_CREATE_STORED_PROCEDURES_ADMIN_V2.sql`

### Services Actualizados:
- `admin-usuarios.service.ts` (V2)
- `admin-roles.service.ts` (V2)
- `admin-areas.service.ts` (Sin cambios)
- `admin-perfiles.service.ts` (Sin cambios)
- `admin-flujos.service.ts` (Sin cambios)
- `admin-aprobadores.service.ts` (Sin cambios)

---

## ✅ Checklist de Implementación

- [ ] Identificar tablas maestras de usuarios y roles
- [ ] Ajustar referencias en stored procedures
- [ ] Ejecutar scripts SQL V2
- [ ] Implementar endpoints en backend
- [ ] Probar JOIN con tablas maestras
- [ ] Actualizar componentes frontend
- [ ] Implementar validación de permisos
- [ ] Crear proceso de sincronización (opcional)
- [ ] Documentar tablas maestras utilizadas
- [ ] Capacitar usuarios administradores

---

**Fecha de Creación**: 26 de Enero, 2026  
**Versión**: 2.0  
**Cambio Principal**: Integración con tablas maestras externas para usuarios y roles
