-- =============================================
-- Script de Stored Procedures para Módulo de Administración
-- Base de Datos: Logística
-- Fecha: 2026-01-26
-- =============================================

USE [logistica]
GO

-- =============================================
-- STORED PROCEDURES PARA ÁREAS
-- =============================================

-- SP: Listar Áreas
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_listar_areas]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_listar_areas]
GO

CREATE PROCEDURE [dbo].[sp_listar_areas]
    @json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre,
        descripcion,
        codigo,
        estado,
        fecha_creacion,
        fecha_modificacion,
        usuario_creacion,
        usuario_modificacion
    FROM logistica_areas
    WHERE estado = 'ACTIVO'
    ORDER BY nombre ASC
END
GO

-- SP: Crear Área
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_crear_area]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_crear_area]
GO

CREATE PROCEDURE [dbo].[sp_crear_area]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @nombre NVARCHAR(100)
    DECLARE @descripcion NVARCHAR(500)
    DECLARE @codigo NVARCHAR(20)
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @nombre = JSON_VALUE(@json, '$.nombre'),
        @descripcion = JSON_VALUE(@json, '$.descripcion'),
        @codigo = JSON_VALUE(@json, '$.codigo'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    INSERT INTO logistica_areas (nombre, descripcion, codigo, usuario_creacion)
    VALUES (@nombre, @descripcion, @codigo, @usuario)
    
    SELECT SCOPE_IDENTITY() AS id, 'Área creada exitosamente' AS mensaje
END
GO

-- SP: Actualizar Área
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_actualizar_area]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_actualizar_area]
GO

CREATE PROCEDURE [dbo].[sp_actualizar_area]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @id INT
    DECLARE @nombre NVARCHAR(100)
    DECLARE @descripcion NVARCHAR(500)
    DECLARE @codigo NVARCHAR(20)
    DECLARE @estado NVARCHAR(20)
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @id = JSON_VALUE(@json, '$.id'),
        @nombre = JSON_VALUE(@json, '$.nombre'),
        @descripcion = JSON_VALUE(@json, '$.descripcion'),
        @codigo = JSON_VALUE(@json, '$.codigo'),
        @estado = JSON_VALUE(@json, '$.estado'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    UPDATE logistica_areas
    SET nombre = @nombre,
        descripcion = @descripcion,
        codigo = @codigo,
        estado = @estado,
        fecha_modificacion = GETDATE(),
        usuario_modificacion = @usuario
    WHERE id = @id
    
    SELECT 'Área actualizada exitosamente' AS mensaje
END
GO

-- SP: Eliminar Área
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_eliminar_area]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_eliminar_area]
GO

CREATE PROCEDURE [dbo].[sp_eliminar_area]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @id INT
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @id = JSON_VALUE(@json, '$.id'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    UPDATE logistica_areas
    SET estado = 'INACTIVO',
        fecha_modificacion = GETDATE(),
        usuario_modificacion = @usuario
    WHERE id = @id
    
    SELECT 'Área eliminada exitosamente' AS mensaje
END
GO

-- =============================================
-- STORED PROCEDURES PARA USUARIOS
-- =============================================

-- SP: Listar Usuarios
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_listar_usuarios]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_listar_usuarios]
GO

CREATE PROCEDURE [dbo].[sp_listar_usuarios]
    @json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.id,
        u.documento_identidad,
        u.nombres,
        u.apellidos,
        u.email,
        u.telefono,
        u.area_id,
        a.nombre AS area_nombre,
        u.perfil_id,
        p.nombre AS perfil_nombre,
        u.cargo,
        u.usuario,
        u.estado,
        u.fecha_creacion,
        u.ultimo_acceso
    FROM logistica_usuarios u
    LEFT JOIN logistica_areas a ON u.area_id = a.id
    LEFT JOIN logistica_perfiles p ON u.perfil_id = p.id
    WHERE u.estado = 'ACTIVO'
    ORDER BY u.nombres, u.apellidos ASC
END
GO

-- SP: Crear Usuario
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_crear_usuario]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_crear_usuario]
GO

CREATE PROCEDURE [dbo].[sp_crear_usuario]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @documento NVARCHAR(20)
    DECLARE @nombres NVARCHAR(100)
    DECLARE @apellidos NVARCHAR(100)
    DECLARE @email NVARCHAR(100)
    DECLARE @telefono NVARCHAR(20)
    DECLARE @area_id INT
    DECLARE @perfil_id INT
    DECLARE @cargo NVARCHAR(100)
    DECLARE @usuario_login NVARCHAR(50)
    DECLARE @password NVARCHAR(255)
    DECLARE @usuario_creacion NVARCHAR(50)
    
    SELECT 
        @documento = JSON_VALUE(@json, '$.documento_identidad'),
        @nombres = JSON_VALUE(@json, '$.nombres'),
        @apellidos = JSON_VALUE(@json, '$.apellidos'),
        @email = JSON_VALUE(@json, '$.email'),
        @telefono = JSON_VALUE(@json, '$.telefono'),
        @area_id = JSON_VALUE(@json, '$.area_id'),
        @perfil_id = JSON_VALUE(@json, '$.perfil_id'),
        @cargo = JSON_VALUE(@json, '$.cargo'),
        @usuario_login = JSON_VALUE(@json, '$.usuario'),
        @password = JSON_VALUE(@json, '$.password'),
        @usuario_creacion = JSON_VALUE(@json, '$.usuario_creacion')
    
    INSERT INTO logistica_usuarios (
        documento_identidad, nombres, apellidos, email, telefono,
        area_id, perfil_id, cargo, usuario, password, usuario_creacion
    )
    VALUES (
        @documento, @nombres, @apellidos, @email, @telefono,
        @area_id, @perfil_id, @cargo, @usuario_login, @password, @usuario_creacion
    )
    
    SELECT SCOPE_IDENTITY() AS id, 'Usuario creado exitosamente' AS mensaje
END
GO

-- SP: Actualizar Usuario
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_actualizar_usuario]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_actualizar_usuario]
GO

CREATE PROCEDURE [dbo].[sp_actualizar_usuario]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @id INT
    DECLARE @nombres NVARCHAR(100)
    DECLARE @apellidos NVARCHAR(100)
    DECLARE @email NVARCHAR(100)
    DECLARE @telefono NVARCHAR(20)
    DECLARE @area_id INT
    DECLARE @perfil_id INT
    DECLARE @cargo NVARCHAR(100)
    DECLARE @estado NVARCHAR(20)
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @id = JSON_VALUE(@json, '$.id'),
        @nombres = JSON_VALUE(@json, '$.nombres'),
        @apellidos = JSON_VALUE(@json, '$.apellidos'),
        @email = JSON_VALUE(@json, '$.email'),
        @telefono = JSON_VALUE(@json, '$.telefono'),
        @area_id = JSON_VALUE(@json, '$.area_id'),
        @perfil_id = JSON_VALUE(@json, '$.perfil_id'),
        @cargo = JSON_VALUE(@json, '$.cargo'),
        @estado = JSON_VALUE(@json, '$.estado'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    UPDATE logistica_usuarios
    SET nombres = @nombres,
        apellidos = @apellidos,
        email = @email,
        telefono = @telefono,
        area_id = @area_id,
        perfil_id = @perfil_id,
        cargo = @cargo,
        estado = @estado,
        fecha_modificacion = GETDATE(),
        usuario_modificacion = @usuario
    WHERE id = @id
    
    SELECT 'Usuario actualizado exitosamente' AS mensaje
END
GO

-- =============================================
-- STORED PROCEDURES PARA PERFILES
-- =============================================

-- SP: Listar Perfiles
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_listar_perfiles]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_listar_perfiles]
GO

CREATE PROCEDURE [dbo].[sp_listar_perfiles]
    @json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre,
        descripcion,
        codigo,
        estado,
        fecha_creacion
    FROM logistica_perfiles
    WHERE estado = 'ACTIVO'
    ORDER BY nombre ASC
END
GO

-- SP: Crear Perfil
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_crear_perfil]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_crear_perfil]
GO

CREATE PROCEDURE [dbo].[sp_crear_perfil]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @nombre NVARCHAR(100)
    DECLARE @descripcion NVARCHAR(500)
    DECLARE @codigo NVARCHAR(20)
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @nombre = JSON_VALUE(@json, '$.nombre'),
        @descripcion = JSON_VALUE(@json, '$.descripcion'),
        @codigo = JSON_VALUE(@json, '$.codigo'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    INSERT INTO logistica_perfiles (nombre, descripcion, codigo, usuario_creacion)
    VALUES (@nombre, @descripcion, @codigo, @usuario)
    
    SELECT SCOPE_IDENTITY() AS id, 'Perfil creado exitosamente' AS mensaje
END
GO

-- SP: Actualizar Perfil
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_actualizar_perfil]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_actualizar_perfil]
GO

CREATE PROCEDURE [dbo].[sp_actualizar_perfil]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @id INT
    DECLARE @nombre NVARCHAR(100)
    DECLARE @descripcion NVARCHAR(500)
    DECLARE @codigo NVARCHAR(20)
    DECLARE @estado NVARCHAR(20)
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @id = JSON_VALUE(@json, '$.id'),
        @nombre = JSON_VALUE(@json, '$.nombre'),
        @descripcion = JSON_VALUE(@json, '$.descripcion'),
        @codigo = JSON_VALUE(@json, '$.codigo'),
        @estado = JSON_VALUE(@json, '$.estado'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    UPDATE logistica_perfiles
    SET nombre = @nombre,
        descripcion = @descripcion,
        codigo = @codigo,
        estado = @estado,
        fecha_modificacion = GETDATE(),
        usuario_modificacion = @usuario
    WHERE id = @id
    
    SELECT 'Perfil actualizado exitosamente' AS mensaje
END
GO

-- =============================================
-- STORED PROCEDURES PARA ROLES
-- =============================================

-- SP: Listar Roles
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_listar_roles]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_listar_roles]
GO

CREATE PROCEDURE [dbo].[sp_listar_roles]
    @json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        nombre,
        descripcion,
        codigo,
        modulo,
        permiso,
        estado,
        fecha_creacion
    FROM logistica_roles
    WHERE estado = 'ACTIVO'
    ORDER BY modulo, nombre ASC
END
GO

-- SP: Crear Rol
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_crear_rol]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_crear_rol]
GO

CREATE PROCEDURE [dbo].[sp_crear_rol]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @nombre NVARCHAR(100)
    DECLARE @descripcion NVARCHAR(500)
    DECLARE @codigo NVARCHAR(20)
    DECLARE @modulo NVARCHAR(50)
    DECLARE @permiso NVARCHAR(50)
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @nombre = JSON_VALUE(@json, '$.nombre'),
        @descripcion = JSON_VALUE(@json, '$.descripcion'),
        @codigo = JSON_VALUE(@json, '$.codigo'),
        @modulo = JSON_VALUE(@json, '$.modulo'),
        @permiso = JSON_VALUE(@json, '$.permiso'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    INSERT INTO logistica_roles (nombre, descripcion, codigo, modulo, permiso, usuario_creacion)
    VALUES (@nombre, @descripcion, @codigo, @modulo, @permiso, @usuario)
    
    SELECT SCOPE_IDENTITY() AS id, 'Rol creado exitosamente' AS mensaje
END
GO

-- =============================================
-- STORED PROCEDURES PARA FLUJOS
-- =============================================

-- SP: Listar Flujos
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_listar_flujos]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_listar_flujos]
GO

CREATE PROCEDURE [dbo].[sp_listar_flujos]
    @json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        f.id,
        f.nombre,
        f.descripcion,
        f.codigo,
        f.area_id,
        a.nombre AS area_nombre,
        f.tipo_requerimiento,
        f.monto_minimo,
        f.monto_maximo,
        f.orden,
        f.estado,
        f.fecha_creacion
    FROM logistica_flujos f
    LEFT JOIN logistica_areas a ON f.area_id = a.id
    WHERE f.estado = 'ACTIVO'
    ORDER BY f.orden, f.nombre ASC
END
GO

-- SP: Crear Flujo
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_crear_flujo]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_crear_flujo]
GO

CREATE PROCEDURE [dbo].[sp_crear_flujo]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @nombre NVARCHAR(100)
    DECLARE @descripcion NVARCHAR(500)
    DECLARE @codigo NVARCHAR(20)
    DECLARE @area_id INT
    DECLARE @tipo_requerimiento NVARCHAR(50)
    DECLARE @monto_minimo DECIMAL(18,2)
    DECLARE @monto_maximo DECIMAL(18,2)
    DECLARE @orden INT
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @nombre = JSON_VALUE(@json, '$.nombre'),
        @descripcion = JSON_VALUE(@json, '$.descripcion'),
        @codigo = JSON_VALUE(@json, '$.codigo'),
        @area_id = JSON_VALUE(@json, '$.area_id'),
        @tipo_requerimiento = JSON_VALUE(@json, '$.tipo_requerimiento'),
        @monto_minimo = JSON_VALUE(@json, '$.monto_minimo'),
        @monto_maximo = JSON_VALUE(@json, '$.monto_maximo'),
        @orden = JSON_VALUE(@json, '$.orden'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    INSERT INTO logistica_flujos (
        nombre, descripcion, codigo, area_id, tipo_requerimiento,
        monto_minimo, monto_maximo, orden, usuario_creacion
    )
    VALUES (
        @nombre, @descripcion, @codigo, @area_id, @tipo_requerimiento,
        @monto_minimo, @monto_maximo, @orden, @usuario
    )
    
    SELECT SCOPE_IDENTITY() AS id, 'Flujo creado exitosamente' AS mensaje
END
GO

-- =============================================
-- STORED PROCEDURES PARA APROBADORES
-- =============================================

-- SP: Listar Aprobadores
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_listar_aprobadores]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_listar_aprobadores]
GO

CREATE PROCEDURE [dbo].[sp_listar_aprobadores]
    @json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ap.id,
        ap.usuario_id,
        u.nombres + ' ' + u.apellidos AS usuario_nombre,
        u.documento_identidad,
        ap.flujo_id,
        f.nombre AS flujo_nombre,
        ap.area_id,
        a.nombre AS area_nombre,
        ap.nivel_aprobacion,
        ap.monto_maximo,
        ap.puede_delegar,
        ap.es_aprobador_final,
        ap.estado,
        ap.fecha_creacion
    FROM logistica_aprobadores ap
    INNER JOIN logistica_usuarios u ON ap.usuario_id = u.id
    LEFT JOIN logistica_flujos f ON ap.flujo_id = f.id
    LEFT JOIN logistica_areas a ON ap.area_id = a.id
    WHERE ap.estado = 'ACTIVO'
    ORDER BY ap.nivel_aprobacion, u.nombres ASC
END
GO

-- SP: Crear Aprobador
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_crear_aprobador]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_crear_aprobador]
GO

CREATE PROCEDURE [dbo].[sp_crear_aprobador]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @usuario_id INT
    DECLARE @flujo_id INT
    DECLARE @area_id INT
    DECLARE @nivel_aprobacion INT
    DECLARE @monto_maximo DECIMAL(18,2)
    DECLARE @puede_delegar BIT
    DECLARE @es_aprobador_final BIT
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @usuario_id = JSON_VALUE(@json, '$.usuario_id'),
        @flujo_id = JSON_VALUE(@json, '$.flujo_id'),
        @area_id = JSON_VALUE(@json, '$.area_id'),
        @nivel_aprobacion = JSON_VALUE(@json, '$.nivel_aprobacion'),
        @monto_maximo = JSON_VALUE(@json, '$.monto_maximo'),
        @puede_delegar = JSON_VALUE(@json, '$.puede_delegar'),
        @es_aprobador_final = JSON_VALUE(@json, '$.es_aprobador_final'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    INSERT INTO logistica_aprobadores (
        usuario_id, flujo_id, area_id, nivel_aprobacion,
        monto_maximo, puede_delegar, es_aprobador_final, usuario_creacion
    )
    VALUES (
        @usuario_id, @flujo_id, @area_id, @nivel_aprobacion,
        @monto_maximo, @puede_delegar, @es_aprobador_final, @usuario
    )
    
    SELECT SCOPE_IDENTITY() AS id, 'Aprobador creado exitosamente' AS mensaje
END
GO

PRINT 'Stored Procedures creados exitosamente'
GO
