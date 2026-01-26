-- =============================================
-- Script de Stored Procedures para Módulo de Administración (V2 FINAL)
-- Base de Datos: Logística
-- ALINEADO CON ESTRUCTURA REAL: BDERP_Agro_Hass
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
-- STORED PROCEDURES PARA USUARIOS
-- Consulta desde BDERP_Agro_Hass (ETIQUETA_usuario + ETIQUETA_rolusuario)
-- =============================================

-- SP: Listar Usuarios con Configuración Local
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_listar_usuarios_logistica]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_listar_usuarios_logistica]
GO

CREATE PROCEDURE [dbo].[sp_listar_usuarios_logistica]
    @json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ruc NVARCHAR(20)
    
    SELECT @ruc = JSON_VALUE(@json, '$.ruc')
    
    -- Consulta usuarios desde BDERP_Agro_Hass + configuración local
    SELECT 
        u.nrodocumento AS documento_identidad,
        u.nombre AS nombres,
        '' AS apellidos,
        '' AS email,
        '' AS telefono,
        u.usuario,
        u.clave,
        u.estado AS estado_maestro,
        -- Roles del usuario (concatenados)
        STUFF((
            SELECT '-' + CAST(r2.idrol AS VARCHAR) 
            FROM [BDERP_Agro_Hass].[dbo].[ETIQUETA_rolusuario] r2 
            WHERE r2.ruc = u.ruc 
            AND r2.usuario = u.usuario 
            AND r2.aplicacion = 'LOGISTICA'
            AND ISNULL(r2.eliminado, 0) = 0
            FOR XML PATH('')
        ), 1, 1, '') AS roles,
        -- Configuración local
        uc.area_id,
        a.nombre AS area_nombre,
        uc.perfil_id,
        p.nombre AS perfil_nombre,
        ISNULL(uc.es_aprobador, 0) AS es_aprobador,
        uc.nivel_aprobacion,
        uc.monto_maximo_aprobacion,
        ISNULL(uc.puede_crear_requerimientos, 1) AS puede_crear_requerimientos,
        ISNULL(uc.puede_aprobar_requerimientos, 0) AS puede_aprobar_requerimientos,
        ISNULL(uc.notificaciones_email, 1) AS notificaciones_email,
        ISNULL(uc.estado, 'INACTIVO') AS estado_logistica
    FROM [BDERP_Agro_Hass].[dbo].[ETIQUETA_usuario] u
    INNER JOIN [BDERP_Agro_Hass].[dbo].[ETIQUETA_rolusuario] r 
        ON u.ruc = r.ruc 
        AND u.usuario = r.usuario 
        AND r.aplicacion = 'LOGISTICA'
        AND ISNULL(r.eliminado, 0) = 0
    LEFT JOIN logistica_usuario_config uc ON u.nrodocumento = uc.documento_identidad
    LEFT JOIN logistica_areas a ON uc.area_id = a.id
    LEFT JOIN logistica_perfiles p ON uc.perfil_id = p.id
    WHERE u.estado = 1
    AND (@ruc IS NULL OR u.ruc = @ruc)
    GROUP BY u.nrodocumento, u.nombre, u.usuario, u.clave, u.estado, u.ruc,
             uc.area_id, a.nombre, uc.perfil_id, p.nombre, uc.es_aprobador,
             uc.nivel_aprobacion, uc.monto_maximo_aprobacion, 
             uc.puede_crear_requerimientos, uc.puede_aprobar_requerimientos,
             uc.notificaciones_email, uc.estado
    ORDER BY u.nombre ASC
END
GO

-- SP: Configurar Usuario en Logística
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
    
    -- Verificar que el usuario existe en ETIQUETA_usuario
    IF NOT EXISTS (
        SELECT 1 FROM [BDERP_Agro_Hass].[dbo].[ETIQUETA_usuario] 
        WHERE nrodocumento = @documento_identidad
    )
    BEGIN
        SELECT 'Error: Usuario no existe en tabla maestra' AS mensaje, 0 AS exito
        RETURN
    END
    
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
        
        SELECT 'Configuración de usuario actualizada exitosamente' AS mensaje, 1 AS exito
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
        
        SELECT 'Configuración de usuario creada exitosamente' AS mensaje, 1 AS exito
    END
END
GO

-- =============================================
-- STORED PROCEDURES PARA ROLES
-- Consulta desde BDERP_Agro_Hass (MASTER_ROL)
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
    
    -- Consulta roles desde BDERP_Agro_Hass + configuración local
    SELECT 
        rm.RolNombre AS codigo_rol_maestro,
        rm.RolNombre AS nombre,
        rm.Descripcion AS descripcion,
        rm.aplicacion AS modulo_maestro,
        rm.EsActivo AS estado_maestro,
        -- Configuración local
        rc.modulo_logistica,
        ISNULL(rc.permiso_crear, 0) AS permiso_crear,
        ISNULL(rc.permiso_editar, 0) AS permiso_editar,
        ISNULL(rc.permiso_eliminar, 0) AS permiso_eliminar,
        ISNULL(rc.permiso_aprobar, 0) AS permiso_aprobar,
        ISNULL(rc.permiso_ver_reportes, 0) AS permiso_ver_reportes,
        ISNULL(rc.permiso_administrar, 0) AS permiso_administrar,
        ISNULL(rc.estado, 'INACTIVO') AS estado_logistica
    FROM [BDERP_Agro_Hass].[dbo].[MASTER_ROL] rm
    LEFT JOIN logistica_rol_config rc ON rm.RolNombre = rc.codigo_rol_maestro
    WHERE rm.aplicacion = 'LOGISTICA'
    AND rm.EsActivo = 1
    ORDER BY rm.RolNombre ASC
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
    
    -- Verificar que el rol existe en MASTER_ROL
    IF NOT EXISTS (
        SELECT 1 FROM [BDERP_Agro_Hass].[dbo].[MASTER_ROL] 
        WHERE RolNombre = @codigo_rol_maestro 
        AND aplicacion = 'LOGISTICA'
    )
    BEGIN
        SELECT 'Error: Rol no existe en tabla maestra' AS mensaje, 0 AS exito
        RETURN
    END
    
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
        
        SELECT 'Configuración de rol actualizada exitosamente' AS mensaje, 1 AS exito
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
        
        SELECT 'Configuración de rol creada exitosamente' AS mensaje, 1 AS exito
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
        um.nombre AS usuario_nombre,
        '' AS email,
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
    INNER JOIN [BDERP_Agro_Hass].[dbo].[ETIQUETA_usuario] um 
        ON ap.documento_identidad = um.nrodocumento
    LEFT JOIN logistica_flujos f ON ap.flujo_id = f.id
    LEFT JOIN logistica_areas a ON ap.area_id = a.id
    WHERE ap.estado = 'ACTIVO'
    ORDER BY ap.nivel_aprobacion, um.nombre ASC
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

PRINT 'Stored Procedures creados exitosamente (V2 FINAL)'
PRINT ''
PRINT '✅ Alineado con estructura real:'
PRINT '   - [BDERP_Agro_Hass].[dbo].[ETIQUETA_usuario]'
PRINT '   - [BDERP_Agro_Hass].[dbo].[ETIQUETA_rolusuario]'
PRINT '   - [BDERP_Agro_Hass].[dbo].[MASTER_ROL]'
PRINT ''
GO
