-- =============================================
-- Author:		Sistema Logística
-- Create date: 2026-03-03
-- Description:	Crear tablas para solicitudes de cotización
-- =============================================

-- Tabla principal de solicitudes de cotización
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LOGISTICA_solicitud_cotizacion]') AND type in (N'U'))
BEGIN
	CREATE TABLE [dbo].[LOGISTICA_solicitud_cotizacion] (
		[id] INT IDENTITY(1,1) PRIMARY KEY,
		[noSolicitud] VARCHAR(50) NOT NULL UNIQUE,
		[idConsolidacion] INT NULL,
		[sociedad] VARCHAR(3) NOT NULL DEFAULT '001',
		[idproyecto] VARCHAR(10) NOT NULL,
		[fechaGeneracion] DATETIME2 NOT NULL DEFAULT GETDATE(),
		[fechaLimite] DATETIME2 NULL,
		[usuarioGenera] VARCHAR(50) NOT NULL,
		[totalItems] INT NOT NULL DEFAULT 0,
		[estado] VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, EN_REVISION, CERRADA, ANULADA
		[observaciones] TEXT NULL,
		[cotizacionesRecibidas] INT NOT NULL DEFAULT 0,
		[fechaModificacion] DATETIME2 NULL,
		[usuarioModifica] VARCHAR(50) NULL,
		[fechaRegistro] DATETIME2 NOT NULL DEFAULT GETDATE(),
		[eliminado] BIT NOT NULL DEFAULT 0
	);
	
	-- Índices
	CREATE INDEX [IX_LOGISTICA_solicitud_cotizacion_noSolicitud] ON [dbo].[LOGISTICA_solicitud_cotizacion] ([noSolicitud]);
	CREATE INDEX [IX_LOGISTICA_solicitud_cotizacion_idConsolidacion] ON [dbo].[LOGISTICA_solicitud_cotizacion] ([idConsolidacion]);
	CREATE INDEX [IX_LOGISTICA_solicitud_cotizacion_estado] ON [dbo].[LOGISTICA_solicitud_cotizacion] ([estado]);
	CREATE INDEX [IX_LOGISTICA_solicitud_cotizacion_sociedad] ON [dbo].[LOGISTICA_solicitud_cotizacion] ([sociedad]);
	CREATE INDEX [IX_LOGISTICA_solicitud_cotizacion_idproyecto] ON [dbo].[LOGISTICA_solicitud_cotizacion] ([idproyecto]);
END

-- Tabla de detalles de solicitudes de cotización
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LOGISTICA_solicitud_cotizacion_detalle]') AND type in (N'U'))
BEGIN
	CREATE TABLE [dbo].[LOGISTICA_solicitud_cotizacion_detalle] (
		[id] INT IDENTITY(1,1) PRIMARY KEY,
		[idSolicitudCotizacion] INT NOT NULL,
		[noLinea] INT NOT NULL,
		[codigoItem] VARCHAR(50) NOT NULL,
		[descripcionItem] VARCHAR(500) NOT NULL,
		[cantidad] DECIMAL(18,4) NOT NULL,
		[unidadMedida] VARCHAR(20) NOT NULL,
		[fechaRegistro] DATETIME2 NOT NULL DEFAULT GETDATE(),
		[eliminado] BIT NOT NULL DEFAULT 0,
		CONSTRAINT [FK_LOGISTICA_solicitud_cotizacion_detalle_solicitud] 
			FOREIGN KEY ([idSolicitudCotizacion]) 
			REFERENCES [dbo].[LOGISTICA_solicitud_cotizacion] ([id])
			ON DELETE CASCADE
	);
	
	-- Índices
	CREATE INDEX [IX_LOGISTICA_solicitud_cotizacion_detalle_idSolicitud] ON [dbo].[LOGISTICA_solicitud_cotizacion_detalle] ([idSolicitudCotizacion]);
	CREATE INDEX [IX_LOGISTICA_solicitud_cotizacion_detalle_codigoItem] ON [dbo].[LOGISTICA_solicitud_cotizacion_detalle] ([codigoItem]);
END

-- Tabla para cotizaciones recibidas (opcional, para futuro)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LOGISTICA_cotizacion]') AND type in (N'U'))
BEGIN
	CREATE TABLE [dbo].[LOGISTICA_cotizacion] (
		[id] INT IDENTITY(1,1) PRIMARY KEY,
		[numeroCotizacion] VARCHAR(50) NOT NULL UNIQUE,
		[idSolicitudCotizacion] INT NOT NULL,
		[sociedad] VARCHAR(3) NOT NULL DEFAULT '001',
		[idproyecto] VARCHAR(10) NOT NULL,
		[codigoProveedor] VARCHAR(50) NOT NULL,
		[nombreProveedor] VARCHAR(200) NOT NULL,
		[rucProveedor] VARCHAR(20) NOT NULL,
		[fecha] DATETIME2 NOT NULL DEFAULT GETDATE(),
		[moneda] VARCHAR(10) NOT NULL DEFAULT 'USD',
		[montoTotal] DECIMAL(18,4) NOT NULL DEFAULT 0,
		[plazoEntrega] INT NOT NULL DEFAULT 0,
		[formaPago] VARCHAR(100) NULL,
		[estado] VARCHAR(20) NOT NULL DEFAULT 'RECIBIDA', -- RECIBIDA, EN_EVALUACION, SELECCIONADA, RECHAZADA
		[observaciones] TEXT NULL,
		[fechaModificacion] DATETIME2 NULL,
		[usuarioModifica] VARCHAR(50) NULL,
		[fechaRegistro] DATETIME2 NOT NULL DEFAULT GETDATE(),
		[eliminado] BIT NOT NULL DEFAULT 0,
		CONSTRAINT [FK_LOGISTICA_cotizacion_solicitud] 
			FOREIGN KEY ([idSolicitudCotizacion]) 
			REFERENCES [dbo].[LOGISTICA_solicitud_cotizacion] ([id])
	);
	
	-- Índices
	CREATE INDEX [IX_LOGISTICA_cotizacion_numeroCotizacion] ON [dbo].[LOGISTICA_cotizacion] ([numeroCotizacion]);
	CREATE INDEX [IX_LOGISTICA_cotizacion_idSolicitudCotizacion] ON [dbo].[LOGISTICA_cotizacion] ([idSolicitudCotizacion]);
	CREATE INDEX [IX_LOGISTICA_cotizacion_codigoProveedor] ON [dbo].[LOGISTICA_cotizacion] ([codigoProveedor]);
	CREATE INDEX [IX_LOGISTICA_cotizacion_estado] ON [dbo].[LOGISTICA_cotizacion] ([estado]);
END

-- Tabla de detalles de cotizaciones
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LOGISTICA_cotizacion_detalle]') AND type in (N'U'))
BEGIN
	CREATE TABLE [dbo].[LOGISTICA_cotizacion_detalle] (
		[id] INT IDENTITY(1,1) PRIMARY KEY,
		[idCotizacion] INT NOT NULL,
		[noLinea] INT NOT NULL,
		[codigoItem] VARCHAR(50) NOT NULL,
		[descripcionItem] VARCHAR(500) NOT NULL,
		[cantidad] DECIMAL(18,4) NOT NULL,
		[unidadMedida] VARCHAR(20) NOT NULL,
		[precioUnitario] DECIMAL(18,4) NOT NULL DEFAULT 0,
		[total] DECIMAL(18,4) NOT NULL DEFAULT 0,
		[fechaRegistro] DATETIME2 NOT NULL DEFAULT GETDATE(),
		[eliminado] BIT NOT NULL DEFAULT 0,
		CONSTRAINT [FK_LOGISTICA_cotizacion_detalle_cotizacion] 
			FOREIGN KEY ([idCotizacion]) 
			REFERENCES [dbo].[LOGISTICA_cotizacion] ([id])
			ON DELETE CASCADE
	);
	
	-- Índices
	CREATE INDEX [IX_LOGISTICA_cotizacion_detalle_idCotizacion] ON [dbo].[LOGISTICA_cotizacion_detalle] ([idCotizacion]);
	CREATE INDEX [IX_LOGISTICA_cotizacion_detalle_codigoItem] ON [dbo].[LOGISTICA_cotizacion_detalle] ([codigoItem]);
END
