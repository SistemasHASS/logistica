-- =============================================
-- Script de Creación de Tablas para Módulo de Administración (V2)
-- Base de Datos: Logística
-- NOTA: Usuarios y Roles vienen de tablas maestras externas
-- Fecha: 2026-01-26
-- =============================================

USE [logistica]
GO

-- =============================================
-- Tabla: logistica_areas
-- Descripción: Almacena las áreas de la empresa
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_areas]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_areas](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [nombre] [nvarchar](100) NOT NULL,
        [descripcion] [nvarchar](500) NULL,
        [codigo] [nvarchar](20) NULL,
        [estado] [nvarchar](20) NOT NULL DEFAULT 'ACTIVO',
        [fecha_creacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [fecha_modificacion] [datetime] NULL,
        [usuario_creacion] [nvarchar](50) NULL,
        [usuario_modificacion] [nvarchar](50) NULL,
        CONSTRAINT [PK_logistica_areas] PRIMARY KEY CLUSTERED ([id] ASC)
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_areas_estado] ON [dbo].[logistica_areas]([estado] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_areas_codigo] ON [dbo].[logistica_areas]([codigo] ASC)
END
GO

-- =============================================
-- Tabla: logistica_perfiles
-- Descripción: Almacena los perfiles de usuario
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_perfiles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_perfiles](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [nombre] [nvarchar](100) NOT NULL,
        [descripcion] [nvarchar](500) NULL,
        [codigo] [nvarchar](20) NULL,
        [estado] [nvarchar](20) NOT NULL DEFAULT 'ACTIVO',
        [fecha_creacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [fecha_modificacion] [datetime] NULL,
        [usuario_creacion] [nvarchar](50) NULL,
        [usuario_modificacion] [nvarchar](50) NULL,
        CONSTRAINT [PK_logistica_perfiles] PRIMARY KEY CLUSTERED ([id] ASC)
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_perfiles_estado] ON [dbo].[logistica_perfiles]([estado] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_perfiles_codigo] ON [dbo].[logistica_perfiles]([codigo] ASC)
END
GO

-- =============================================
-- Tabla: logistica_usuario_config
-- Descripción: Configuración LOCAL de usuarios (referencia a tabla maestra externa)
-- NOTA: Los usuarios vienen de tabla maestra, aquí solo guardamos configuración local
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_usuario_config]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_usuario_config](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [documento_identidad] [nvarchar](20) NOT NULL, -- Referencia al usuario maestro
        [area_id] [int] NULL,
        [perfil_id] [int] NULL,
        [es_aprobador] [bit] NOT NULL DEFAULT 0,
        [nivel_aprobacion] [int] NULL,
        [monto_maximo_aprobacion] [decimal](18, 2) NULL,
        [puede_crear_requerimientos] [bit] NOT NULL DEFAULT 1,
        [puede_aprobar_requerimientos] [bit] NOT NULL DEFAULT 0,
        [notificaciones_email] [bit] NOT NULL DEFAULT 1,
        [estado] [nvarchar](20) NOT NULL DEFAULT 'ACTIVO',
        [fecha_creacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [fecha_modificacion] [datetime] NULL,
        [usuario_creacion] [nvarchar](50) NULL,
        [usuario_modificacion] [nvarchar](50) NULL,
        CONSTRAINT [PK_logistica_usuario_config] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_logistica_usuario_config_area] FOREIGN KEY([area_id]) REFERENCES [dbo].[logistica_areas]([id]),
        CONSTRAINT [FK_logistica_usuario_config_perfil] FOREIGN KEY([perfil_id]) REFERENCES [dbo].[logistica_perfiles]([id])
    )
    
    CREATE UNIQUE NONCLUSTERED INDEX [IX_logistica_usuario_config_documento] ON [dbo].[logistica_usuario_config]([documento_identidad] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_usuario_config_estado] ON [dbo].[logistica_usuario_config]([estado] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_usuario_config_area] ON [dbo].[logistica_usuario_config]([area_id] ASC)
END
GO

-- =============================================
-- Tabla: logistica_rol_config
-- Descripción: Configuración LOCAL de roles (referencia a roles maestros externos)
-- NOTA: Los roles vienen de tabla maestra, aquí solo guardamos configuración local
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_rol_config]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_rol_config](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [codigo_rol_maestro] [nvarchar](50) NOT NULL, -- Referencia al rol maestro
        [modulo_logistica] [nvarchar](50) NULL, -- Módulo específico de logística
        [permiso_crear] [bit] NOT NULL DEFAULT 0,
        [permiso_editar] [bit] NOT NULL DEFAULT 0,
        [permiso_eliminar] [bit] NOT NULL DEFAULT 0,
        [permiso_aprobar] [bit] NOT NULL DEFAULT 0,
        [permiso_ver_reportes] [bit] NOT NULL DEFAULT 0,
        [permiso_administrar] [bit] NOT NULL DEFAULT 0,
        [estado] [nvarchar](20) NOT NULL DEFAULT 'ACTIVO',
        [fecha_creacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [fecha_modificacion] [datetime] NULL,
        [usuario_creacion] [nvarchar](50) NULL,
        [usuario_modificacion] [nvarchar](50) NULL,
        CONSTRAINT [PK_logistica_rol_config] PRIMARY KEY CLUSTERED ([id] ASC)
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_rol_config_codigo] ON [dbo].[logistica_rol_config]([codigo_rol_maestro] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_rol_config_estado] ON [dbo].[logistica_rol_config]([estado] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_rol_config_modulo] ON [dbo].[logistica_rol_config]([modulo_logistica] ASC)
END
GO

-- =============================================
-- Tabla: logistica_perfil_roles
-- Descripción: Relación entre perfiles y roles (referencia a roles maestros)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_perfil_roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_perfil_roles](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [perfil_id] [int] NOT NULL,
        [codigo_rol_maestro] [nvarchar](50) NOT NULL, -- Referencia al rol maestro
        [fecha_asignacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [usuario_asignacion] [nvarchar](50) NULL,
        CONSTRAINT [PK_logistica_perfil_roles] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_logistica_perfil_roles_perfil] FOREIGN KEY([perfil_id]) REFERENCES [dbo].[logistica_perfiles]([id])
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_perfil_roles_perfil] ON [dbo].[logistica_perfil_roles]([perfil_id] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_perfil_roles_rol] ON [dbo].[logistica_perfil_roles]([codigo_rol_maestro] ASC)
END
GO

-- =============================================
-- Tabla: logistica_usuario_roles_adicionales
-- Descripción: Roles adicionales asignados directamente a usuarios (más allá del perfil)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_usuario_roles_adicionales]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_usuario_roles_adicionales](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [documento_identidad] [nvarchar](20) NOT NULL, -- Referencia al usuario maestro
        [codigo_rol_maestro] [nvarchar](50) NOT NULL, -- Referencia al rol maestro
        [fecha_asignacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [fecha_expiracion] [datetime] NULL,
        [usuario_asignacion] [nvarchar](50) NULL,
        [estado] [nvarchar](20) NOT NULL DEFAULT 'ACTIVO',
        CONSTRAINT [PK_logistica_usuario_roles_adicionales] PRIMARY KEY CLUSTERED ([id] ASC)
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_usuario_roles_adicionales_usuario] ON [dbo].[logistica_usuario_roles_adicionales]([documento_identidad] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_usuario_roles_adicionales_rol] ON [dbo].[logistica_usuario_roles_adicionales]([codigo_rol_maestro] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_usuario_roles_adicionales_estado] ON [dbo].[logistica_usuario_roles_adicionales]([estado] ASC)
END
GO

-- =============================================
-- Tabla: logistica_flujos
-- Descripción: Almacena los flujos de aprobación
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_flujos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_flujos](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [nombre] [nvarchar](100) NOT NULL,
        [descripcion] [nvarchar](500) NULL,
        [codigo] [nvarchar](20) NULL,
        [area_id] [int] NULL,
        [tipo_requerimiento] [nvarchar](50) NULL,
        [monto_minimo] [decimal](18, 2) NULL,
        [monto_maximo] [decimal](18, 2) NULL,
        [orden] [int] NULL,
        [estado] [nvarchar](20) NOT NULL DEFAULT 'ACTIVO',
        [fecha_creacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [fecha_modificacion] [datetime] NULL,
        [usuario_creacion] [nvarchar](50) NULL,
        [usuario_modificacion] [nvarchar](50) NULL,
        CONSTRAINT [PK_logistica_flujos] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_logistica_flujos_area] FOREIGN KEY([area_id]) REFERENCES [dbo].[logistica_areas]([id])
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_flujos_estado] ON [dbo].[logistica_flujos]([estado] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_flujos_area] ON [dbo].[logistica_flujos]([area_id] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_flujos_tipo] ON [dbo].[logistica_flujos]([tipo_requerimiento] ASC)
END
GO

-- =============================================
-- Tabla: logistica_aprobadores
-- Descripción: Almacena los aprobadores del sistema (referencia a usuarios maestros)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_aprobadores]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_aprobadores](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [documento_identidad] [nvarchar](20) NOT NULL, -- Referencia al usuario maestro
        [flujo_id] [int] NULL,
        [area_id] [int] NULL,
        [nivel_aprobacion] [int] NOT NULL DEFAULT 1,
        [monto_maximo] [decimal](18, 2) NULL,
        [puede_delegar] [bit] NOT NULL DEFAULT 0,
        [es_aprobador_final] [bit] NOT NULL DEFAULT 0,
        [estado] [nvarchar](20) NOT NULL DEFAULT 'ACTIVO',
        [fecha_creacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [fecha_modificacion] [datetime] NULL,
        [usuario_creacion] [nvarchar](50) NULL,
        [usuario_modificacion] [nvarchar](50) NULL,
        CONSTRAINT [PK_logistica_aprobadores] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_logistica_aprobadores_flujo] FOREIGN KEY([flujo_id]) REFERENCES [dbo].[logistica_flujos]([id]),
        CONSTRAINT [FK_logistica_aprobadores_area] FOREIGN KEY([area_id]) REFERENCES [dbo].[logistica_areas]([id])
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_aprobadores_usuario] ON [dbo].[logistica_aprobadores]([documento_identidad] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_aprobadores_flujo] ON [dbo].[logistica_aprobadores]([flujo_id] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_aprobadores_area] ON [dbo].[logistica_aprobadores]([area_id] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_aprobadores_estado] ON [dbo].[logistica_aprobadores]([estado] ASC)
END
GO

PRINT 'Tablas creadas exitosamente (V2 - Con referencia a tablas maestras)'
GO
