-- =============================================
-- Script de Creación de Tablas para Módulo de Administración
-- Base de Datos: Logística
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
-- Tabla: logistica_roles
-- Descripción: Almacena los roles del sistema
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_roles](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [nombre] [nvarchar](100) NOT NULL,
        [descripcion] [nvarchar](500) NULL,
        [codigo] [nvarchar](20) NULL,
        [modulo] [nvarchar](50) NULL,
        [permiso] [nvarchar](50) NULL,
        [estado] [nvarchar](20) NOT NULL DEFAULT 'ACTIVO',
        [fecha_creacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [fecha_modificacion] [datetime] NULL,
        [usuario_creacion] [nvarchar](50) NULL,
        [usuario_modificacion] [nvarchar](50) NULL,
        CONSTRAINT [PK_logistica_roles] PRIMARY KEY CLUSTERED ([id] ASC)
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_roles_estado] ON [dbo].[logistica_roles]([estado] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_roles_codigo] ON [dbo].[logistica_roles]([codigo] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_roles_modulo] ON [dbo].[logistica_roles]([modulo] ASC)
END
GO

-- =============================================
-- Tabla: logistica_usuarios
-- Descripción: Almacena los usuarios del sistema
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_usuarios]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_usuarios](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [documento_identidad] [nvarchar](20) NOT NULL,
        [nombres] [nvarchar](100) NOT NULL,
        [apellidos] [nvarchar](100) NOT NULL,
        [email] [nvarchar](100) NULL,
        [telefono] [nvarchar](20) NULL,
        [area_id] [int] NULL,
        [perfil_id] [int] NULL,
        [cargo] [nvarchar](100) NULL,
        [usuario] [nvarchar](50) NULL,
        [password] [nvarchar](255) NULL,
        [estado] [nvarchar](20) NOT NULL DEFAULT 'ACTIVO',
        [fecha_creacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [fecha_modificacion] [datetime] NULL,
        [usuario_creacion] [nvarchar](50) NULL,
        [usuario_modificacion] [nvarchar](50) NULL,
        [ultimo_acceso] [datetime] NULL,
        CONSTRAINT [PK_logistica_usuarios] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_logistica_usuarios_area] FOREIGN KEY([area_id]) REFERENCES [dbo].[logistica_areas]([id]),
        CONSTRAINT [FK_logistica_usuarios_perfil] FOREIGN KEY([perfil_id]) REFERENCES [dbo].[logistica_perfiles]([id])
    )
    
    CREATE UNIQUE NONCLUSTERED INDEX [IX_logistica_usuarios_documento] ON [dbo].[logistica_usuarios]([documento_identidad] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_usuarios_estado] ON [dbo].[logistica_usuarios]([estado] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_usuarios_area] ON [dbo].[logistica_usuarios]([area_id] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_usuarios_perfil] ON [dbo].[logistica_usuarios]([perfil_id] ASC)
END
GO

-- =============================================
-- Tabla: logistica_perfil_roles
-- Descripción: Relación muchos a muchos entre perfiles y roles
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_perfil_roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_perfil_roles](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [perfil_id] [int] NOT NULL,
        [rol_id] [int] NOT NULL,
        [fecha_asignacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [usuario_asignacion] [nvarchar](50) NULL,
        CONSTRAINT [PK_logistica_perfil_roles] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_logistica_perfil_roles_perfil] FOREIGN KEY([perfil_id]) REFERENCES [dbo].[logistica_perfiles]([id]),
        CONSTRAINT [FK_logistica_perfil_roles_rol] FOREIGN KEY([rol_id]) REFERENCES [dbo].[logistica_roles]([id])
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_perfil_roles_perfil] ON [dbo].[logistica_perfil_roles]([perfil_id] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_perfil_roles_rol] ON [dbo].[logistica_perfil_roles]([rol_id] ASC)
END
GO

-- =============================================
-- Tabla: logistica_usuario_roles
-- Descripción: Relación muchos a muchos entre usuarios y roles (roles adicionales)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_usuario_roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_usuario_roles](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [usuario_id] [int] NOT NULL,
        [rol_id] [int] NOT NULL,
        [fecha_asignacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [usuario_asignacion] [nvarchar](50) NULL,
        CONSTRAINT [PK_logistica_usuario_roles] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_logistica_usuario_roles_usuario] FOREIGN KEY([usuario_id]) REFERENCES [dbo].[logistica_usuarios]([id]),
        CONSTRAINT [FK_logistica_usuario_roles_rol] FOREIGN KEY([rol_id]) REFERENCES [dbo].[logistica_roles]([id])
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_usuario_roles_usuario] ON [dbo].[logistica_usuario_roles]([usuario_id] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_usuario_roles_rol] ON [dbo].[logistica_usuario_roles]([rol_id] ASC)
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
-- Descripción: Almacena los aprobadores del sistema
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[logistica_aprobadores]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[logistica_aprobadores](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [usuario_id] [int] NOT NULL,
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
        CONSTRAINT [FK_logistica_aprobadores_usuario] FOREIGN KEY([usuario_id]) REFERENCES [dbo].[logistica_usuarios]([id]),
        CONSTRAINT [FK_logistica_aprobadores_flujo] FOREIGN KEY([flujo_id]) REFERENCES [dbo].[logistica_flujos]([id]),
        CONSTRAINT [FK_logistica_aprobadores_area] FOREIGN KEY([area_id]) REFERENCES [dbo].[logistica_areas]([id])
    )
    
    CREATE NONCLUSTERED INDEX [IX_logistica_aprobadores_usuario] ON [dbo].[logistica_aprobadores]([usuario_id] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_aprobadores_flujo] ON [dbo].[logistica_aprobadores]([flujo_id] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_aprobadores_area] ON [dbo].[logistica_aprobadores]([area_id] ASC)
    CREATE NONCLUSTERED INDEX [IX_logistica_aprobadores_estado] ON [dbo].[logistica_aprobadores]([estado] ASC)
END
GO

PRINT 'Tablas creadas exitosamente'
GO
