-- =============================================
-- Script de Stored Procedures para Módulo de Administración (V2)
-- Base de Datos: Logística
-- NOTA: Usuarios y Roles se consultan desde tablas maestras externas
-- Fecha: 2026-01-26
-- =============================================

USE [logistica]
GO

-- =============================================
-- STORED PROCEDURES PARA ÁREAS (Sin cambios)
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
-- STORED PROCEDURES PARA USUARIOS (Consulta desde tabla maestra + config local)
-- =============================================

-- SP: Listar Usuarios con Configuración Local
-- NOTA: Este SP debe hacer JOIN con la tabla maestra de usuarios
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_listar_usuarios_logistica]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_listar_usuarios_logistica]
GO

CREATE PROCEDURE [dbo].[sp_listar_usuarios_logistica]
    @json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- IMPORTANTE: Ajustar el nombre de la tabla maestra según tu BD
    -- Ejemplo: [BD_MAESTRA].[dbo].[usuarios_maestros]
    
    SELECT 
        um.documento_identidad,
        um.nombres,
        um.apellidos,
        um.email,
        um.telefono,
        um.cargo,
        uc.area_id,
        a.nombre AS area_nombre,
        uc.perfil_id,
        p.nombre AS perfil_nombre,
        uc.es_aprobador,
        uc.nivel_aprobacion,
        uc.monto_maximo_aprobacion,
        uc.puede_crear_requerimientos,
        uc.puede_aprobar_requerimientos,
        uc.notificaciones_email,
        ISNULL(uc.estado, 'INACTIVO') AS estado_logistica,
        um.estado AS estado_maestro
    FROM [BD_MAESTRA].[dbo].[usuarios_maestros] um -- AJUSTAR NOMBRE DE TABLA MAESTRA
    LEFT JOIN logistica_usuario_config uc ON um.documento_identidad = uc.documento_identidad
    LEFT JOIN logistica_areas a ON uc.area_id = a.id
    LEFT JOIN logistica_perfiles p ON uc.perfil_id = p.id
    WHERE um.estado = 'ACTIVO'
    ORDER BY um.nombres, um.apellidos ASC
END
GO

-- SP: Crear/Actualizar Configuración de Usuario Local
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_configurar_usuario_logistica]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_configurar_usuario_logistica]
GO

CREATE PROCEDURE [dbo].[sp_configurar_usuario_logistica]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @documento_identidad NVARCHAR(20)
    DECLARE @area_id INT
    DECLARE @perfil_id INT
    DECLARE @es_aprobador BIT
    DECLARE @nivel_aprobacion INT
    DECLARE @monto_maximo DECIMAL(18,2)
    DECLARE @puede_crear BIT
    DECLARE @puede_aprobar BIT
    DECLARE @notificaciones BIT
    DECLARE @estado NVARCHAR(20)
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @documento_identidad = JSON_VALUE(@json, '$.documento_identidad'),
        @area_id = JSON_VALUE(@json, '$.area_id'),
        @perfil_id = JSON_VALUE(@json, '$.perfil_id'),
        @es_aprobador = JSON_VALUE(@json, '$.es_aprobador'),
        @nivel_aprobacion = JSON_VALUE(@json, '$.nivel_aprobacion'),
        @monto_maximo = JSON_VALUE(@json, '$.monto_maximo_aprobacion'),
        @puede_crear = JSON_VALUE(@json, '$.puede_crear_requerimientos'),
        @puede_aprobar = JSON_VALUE(@json, '$.puede_aprobar_requerimientos'),
        @notificaciones = JSON_VALUE(@json, '$.notificaciones_email'),
        @estado = JSON_VALUE(@json, '$.estado'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    -- Verificar si ya existe configuración
    IF EXISTS (SELECT 1 FROM logistica_usuario_config WHERE documento_identidad = @documento_identidad)
    BEGIN
        -- Actualizar configuración existente
        UPDATE logistica_usuario_config
        SET area_id = @area_id,
            perfil_id = @perfil_id,
            es_aprobador = @es_aprobador,
            nivel_aprobacion = @nivel_aprobacion,
            monto_maximo_aprobacion = @monto_maximo,
            puede_crear_requerimientos = @puede_crear,
            puede_aprobar_requerimientos = @puede_aprobar,
            notificaciones_email = @notificaciones,
            estado = @estado,
            fecha_modificacion = GETDATE(),
            usuario_modificacion = @usuario
        WHERE documento_identidad = @documento_identidad
        
        SELECT 'Configuración de usuario actualizada exitosamente' AS mensaje
    END
    ELSE
    BEGIN
        -- Crear nueva configuración
        INSERT INTO logistica_usuario_config (
            documento_identidad, area_id, perfil_id, es_aprobador,
            nivel_aprobacion, monto_maximo_aprobacion, puede_crear_requerimientos,
            puede_aprobar_requerimientos, notificaciones_email, estado, usuario_creacion
        )
        VALUES (
            @documento_identidad, @area_id, @perfil_id, @es_aprobador,
            @nivel_aprobacion, @monto_maximo, @puede_crear,
            @puede_aprobar, @notificaciones, @estado, @usuario
        )
        
        SELECT 'Configuración de usuario creada exitosamente' AS mensaje
    END
END
GO

-- SP: Asignar Roles Adicionales a Usuario
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_asignar_roles_usuario]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_asignar_roles_usuario]
GO

CREATE PROCEDURE [dbo].[sp_asignar_roles_usuario]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @documento_identidad NVARCHAR(20)
    DECLARE @codigo_rol NVARCHAR(50)
    DECLARE @fecha_expiracion DATETIME
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @documento_identidad = JSON_VALUE(@json, '$.documento_identidad'),
        @codigo_rol = JSON_VALUE(@json, '$.codigo_rol_maestro'),
        @fecha_expiracion = JSON_VALUE(@json, '$.fecha_expiracion'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    INSERT INTO logistica_usuario_roles_adicionales (
        documento_identidad, codigo_rol_maestro, fecha_expiracion, usuario_asignacion
    )
    VALUES (
        @documento_identidad, @codigo_rol, @fecha_expiracion, @usuario
    )
    
    SELECT 'Rol adicional asignado exitosamente' AS mensaje
END
GO

-- =============================================
-- STORED PROCEDURES PARA ROLES (Consulta desde tabla maestra + config local)
-- =============================================

-- SP: Listar Roles con Configuración Local
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_listar_roles_logistica]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_listar_roles_logistica]
GO

CREATE PROCEDURE [dbo].[sp_listar_roles_logistica]
    @json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- IMPORTANTE: Ajustar el nombre de la tabla maestra según tu BD
    -- Ejemplo: [BD_MAESTRA].[dbo].[roles_maestros]
    
    SELECT 
        rm.codigo AS codigo_rol_maestro,
        rm.nombre,
        rm.descripcion,
        rm.modulo AS modulo_maestro,
        rc.modulo_logistica,
        rc.permiso_crear,
        rc.permiso_editar,
        rc.permiso_eliminar,
        rc.permiso_aprobar,
        rc.permiso_ver_reportes,
        rc.permiso_administrar,
        ISNULL(rc.estado, 'INACTIVO') AS estado_logistica,
        rm.estado AS estado_maestro
    FROM [BD_MAESTRA].[dbo].[roles_maestros] rm -- AJUSTAR NOMBRE DE TABLA MAESTRA
    LEFT JOIN logistica_rol_config rc ON rm.codigo = rc.codigo_rol_maestro
    WHERE rm.estado = 'ACTIVO'
    ORDER BY rm.modulo, rm.nombre ASC
END
GO

-- SP: Configurar Rol para Logística
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_configurar_rol_logistica]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_configurar_rol_logistica]
GO

CREATE PROCEDURE [dbo].[sp_configurar_rol_logistica]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @codigo_rol_maestro NVARCHAR(50)
    DECLARE @modulo_logistica NVARCHAR(50)
    DECLARE @permiso_crear BIT
    DECLARE @permiso_editar BIT
    DECLARE @permiso_eliminar BIT
    DECLARE @permiso_aprobar BIT
    DECLARE @permiso_reportes BIT
    DECLARE @permiso_administrar BIT
    DECLARE @estado NVARCHAR(20)
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @codigo_rol_maestro = JSON_VALUE(@json, '$.codigo_rol_maestro'),
        @modulo_logistica = JSON_VALUE(@json, '$.modulo_logistica'),
        @permiso_crear = JSON_VALUE(@json, '$.permiso_crear'),
        @permiso_editar = JSON_VALUE(@json, '$.permiso_editar'),
        @permiso_eliminar = JSON_VALUE(@json, '$.permiso_eliminar'),
        @permiso_aprobar = JSON_VALUE(@json, '$.permiso_aprobar'),
        @permiso_reportes = JSON_VALUE(@json, '$.permiso_ver_reportes'),
        @permiso_administrar = JSON_VALUE(@json, '$.permiso_administrar'),
        @estado = JSON_VALUE(@json, '$.estado'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    -- Verificar si ya existe configuración
    IF EXISTS (SELECT 1 FROM logistica_rol_config WHERE codigo_rol_maestro = @codigo_rol_maestro)
    BEGIN
        -- Actualizar configuración existente
        UPDATE logistica_rol_config
        SET modulo_logistica = @modulo_logistica,
            permiso_crear = @permiso_crear,
            permiso_editar = @permiso_editar,
            permiso_eliminar = @permiso_eliminar,
            permiso_aprobar = @permiso_aprobar,
            permiso_ver_reportes = @permiso_reportes,
            permiso_administrar = @permiso_administrar,
            estado = @estado,
            fecha_modificacion = GETDATE(),
            usuario_modificacion = @usuario
        WHERE codigo_rol_maestro = @codigo_rol_maestro
        
        SELECT 'Configuración de rol actualizada exitosamente' AS mensaje
    END
    ELSE
    BEGIN
        -- Crear nueva configuración
        INSERT INTO logistica_rol_config (
            codigo_rol_maestro, modulo_logistica, permiso_crear, permiso_editar,
            permiso_eliminar, permiso_aprobar, permiso_ver_reportes,
            permiso_administrar, estado, usuario_creacion
        )
        VALUES (
            @codigo_rol_maestro, @modulo_logistica, @permiso_crear, @permiso_editar,
            @permiso_eliminar, @permiso_aprobar, @permiso_reportes,
            @permiso_administrar, @estado, @usuario
        )
        
        SELECT 'Configuración de rol creada exitosamente' AS mensaje
    END
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

-- SP: Asignar Roles a Perfil
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_asignar_roles_perfil]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_asignar_roles_perfil]
GO

CREATE PROCEDURE [dbo].[sp_asignar_roles_perfil]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @perfil_id INT
    DECLARE @codigo_rol NVARCHAR(50)
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @perfil_id = JSON_VALUE(@json, '$.perfil_id'),
        @codigo_rol = JSON_VALUE(@json, '$.codigo_rol_maestro'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    INSERT INTO logistica_perfil_roles (perfil_id, codigo_rol_maestro, usuario_asignacion)
    VALUES (@perfil_id, @codigo_rol, @usuario)
    
    SELECT 'Rol asignado al perfil exitosamente' AS mensaje
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

-- SP: Listar Aprobadores (con datos de usuario maestro)
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
        ap.documento_identidad,
        um.nombres + ' ' + um.apellidos AS usuario_nombre,
        um.email,
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
    INNER JOIN [BD_MAESTRA].[dbo].[usuarios_maestros] um ON ap.documento_identidad = um.documento_identidad
    LEFT JOIN logistica_flujos f ON ap.flujo_id = f.id
    LEFT JOIN logistica_areas a ON ap.area_id = a.id
    WHERE ap.estado = 'ACTIVO'
    ORDER BY ap.nivel_aprobacion, um.nombres ASC
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
    
    DECLARE @documento_identidad NVARCHAR(20)
    DECLARE @flujo_id INT
    DECLARE @area_id INT
    DECLARE @nivel_aprobacion INT
    DECLARE @monto_maximo DECIMAL(18,2)
    DECLARE @puede_delegar BIT
    DECLARE @es_aprobador_final BIT
    DECLARE @usuario NVARCHAR(50)
    
    SELECT 
        @documento_identidad = JSON_VALUE(@json, '$.documento_identidad'),
        @flujo_id = JSON_VALUE(@json, '$.flujo_id'),
        @area_id = JSON_VALUE(@json, '$.area_id'),
        @nivel_aprobacion = JSON_VALUE(@json, '$.nivel_aprobacion'),
        @monto_maximo = JSON_VALUE(@json, '$.monto_maximo'),
        @puede_delegar = JSON_VALUE(@json, '$.puede_delegar'),
        @es_aprobador_final = JSON_VALUE(@json, '$.es_aprobador_final'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    INSERT INTO logistica_aprobadores (
        documento_identidad, flujo_id, area_id, nivel_aprobacion,
        monto_maximo, puede_delegar, es_aprobador_final, usuario_creacion
    )
    VALUES (
        @documento_identidad, @flujo_id, @area_id, @nivel_aprobacion,
        @monto_maximo, @puede_delegar, @es_aprobador_final, @usuario
    )
    
    SELECT SCOPE_IDENTITY() AS id, 'Aprobador creado exitosamente' AS mensaje
END
GO

PRINT 'Stored Procedures creados exitosamente (V2 - Con referencia a tablas maestras)'
PRINT ''
PRINT '⚠️ IMPORTANTE: Ajustar las referencias a tablas maestras:'
PRINT '   - [BD_MAESTRA].[dbo].[usuarios_maestros]'
PRINT '   - [BD_MAESTRA].[dbo].[roles_maestros]'
PRINT ''
GO
