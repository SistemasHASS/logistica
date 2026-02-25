USE [LOGISTICA]
GO

/****** Object:  Table [dbo].[logistica_notificaciones]    Script Date: 23/02/2026 18:28:25 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[logistica_notificaciones](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[id_dreq] [int] NULL,
	[mensaje] [varchar](500) NULL,
	[usuario_destino] [varchar](50) NULL,
	[fecha] [datetime] NULL,
	[leido] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[logistica_notificaciones] ADD  DEFAULT (getdate()) FOR [fecha]
GO

ALTER TABLE [dbo].[logistica_notificaciones] ADD  DEFAULT ((0)) FOR [leido]
GO

-- =============================================
-- Author:      Sistema Logística
-- Create Date: 2026-02-23
-- Description: Agregar campos adicionales para el sistema de notificaciones
-- =============================================

-- Agregar campos adicionales si no existen
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'logistica_notificaciones' 
               AND COLUMN_NAME = 'iditem')
BEGIN
    ALTER TABLE [dbo].[logistica_notificaciones]
    ADD [iditem] [VARCHAR](20) NULL;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'logistica_notificaciones' 
               AND COLUMN_NAME = 'itemDescripcion')
BEGIN
    ALTER TABLE [dbo].[logistica_notificaciones]
    ADD [itemDescripcion] [VARCHAR](200) NULL;
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'logistica_notificaciones' 
               AND COLUMN_NAME = 'tipo_notificacion')
BEGIN
    ALTER TABLE [dbo].[logistica_notificaciones]
    ADD [tipo_notificacion] [VARCHAR](50) NULL;
END

GO

-- Crear índices para mejor rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_logistica_notificaciones_usuario_destino_leido')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_logistica_notificaciones_usuario_destino_leido] 
    ON [dbo].[logistica_notificaciones] ([usuario_destino] ASC, [leido] ASC)
    INCLUDE ([mensaje], [fecha], [iditem], [itemDescripcion])
    ON [PRIMARY];
END

GO

-- Índice para búsquedas por item
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_logistica_notificaciones_iditem')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_logistica_notificaciones_iditem] 
    ON [dbo].[logistica_notificaciones] ([iditem] ASC)
    ON [PRIMARY];
END

GO
