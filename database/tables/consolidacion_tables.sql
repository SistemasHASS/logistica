-- =============================================
-- TABLAS PARA MÓDULO DE CONSOLIDACIÓN DE REQUERIMIENTOS
-- =============================================

-- Tabla: RequerimientoConsolidadoCompra
-- Almacena el encabezado de la consolidación
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RequerimientoConsolidadoCompra]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RequerimientoConsolidadoCompra] (
        [no_reqconsolcompra] VARCHAR(50) NOT NULL PRIMARY KEY,
        [no_cia] VARCHAR(20) NOT NULL,
        [fecha_consolidacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [estado] VARCHAR(20) NOT NULL DEFAULT 'BORRADOR', -- BORRADOR, CONSOLIDADO, ANULADO
        [usuario_creador] VARCHAR(50) NOT NULL,
        [fecha_creacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [fecha_modificacion] DATETIME NULL,
        [usuario_modificacion] VARCHAR(50) NULL,
        [observaciones] VARCHAR(500) NULL,
        [eliminado] BIT NOT NULL DEFAULT 0,
        
        CONSTRAINT [CK_ReqConsolCompra_Estado] CHECK ([estado] IN ('BORRADOR', 'CONSOLIDADO', 'ANULADO'))
    );
    
    CREATE INDEX [IX_ReqConsolCompra_Cia] ON [dbo].[RequerimientoConsolidadoCompra]([no_cia]);
    CREATE INDEX [IX_ReqConsolCompra_Estado] ON [dbo].[RequerimientoConsolidadoCompra]([estado]);
    CREATE INDEX [IX_ReqConsolCompra_Fecha] ON [dbo].[RequerimientoConsolidadoCompra]([fecha_consolidacion]);
END
GO

-- Tabla: DetalleRequerimientoConsolidado
-- Almacena las líneas consolidadas por ítem
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DetalleRequerimientoConsolidado]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DetalleRequerimientoConsolidado] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [no_reqconsolcompra] VARCHAR(50) NOT NULL,
        [no_linea] INT NOT NULL,
        [no_cia] VARCHAR(20) NOT NULL,
        [codigo_item] VARCHAR(50) NOT NULL,
        [descripcion_item] VARCHAR(200) NOT NULL,
        [cantidad_total] DECIMAL(18,4) NOT NULL,
        [unidad_medida] VARCHAR(20) NOT NULL,
        [fecha_creacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [eliminado] BIT NOT NULL DEFAULT 0,
        
        CONSTRAINT [FK_DetalleReqConsol_ReqConsolCompra] 
            FOREIGN KEY ([no_reqconsolcompra]) 
            REFERENCES [dbo].[RequerimientoConsolidadoCompra]([no_reqconsolcompra]),
        CONSTRAINT [UQ_DetalleReqConsol_Linea] 
            UNIQUE ([no_reqconsolcompra], [no_linea])
    );
    
    CREATE INDEX [IX_DetalleReqConsol_Item] ON [dbo].[DetalleRequerimientoConsolidado]([codigo_item]);
    CREATE INDEX [IX_DetalleReqConsol_ReqConsol] ON [dbo].[DetalleRequerimientoConsolidado]([no_reqconsolcompra]);
END
GO

-- Tabla: ReqConsolidado (Trazabilidad)
-- Relaciona las líneas origen con las líneas consolidadas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ReqConsolidado]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ReqConsolidado] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [no_reqconsolcompra] VARCHAR(50) NOT NULL,
        [no_linea_consolidada] INT NOT NULL,
        [tipo_origen] VARCHAR(20) NOT NULL, -- COMPRA, CONSUMO
        [id_requerimiento_origen] VARCHAR(50) NOT NULL,
        [no_linea_origen] INT NOT NULL,
        [cantidad_consolidada] DECIMAL(18,4) NOT NULL,
        [saldo_origen] DECIMAL(18,4) NULL,
        [fecha_consolidacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [estado] VARCHAR(20) NOT NULL DEFAULT 'ACTIVA', -- ACTIVA, PARCIAL, COMPLETA, ANULADA
        [eliminado] BIT NOT NULL DEFAULT 0,
        
        CONSTRAINT [FK_ReqConsolidado_DetalleReqConsol] 
            FOREIGN KEY ([no_reqconsolcompra]) 
            REFERENCES [dbo].[RequerimientoConsolidadoCompra]([no_reqconsolcompra]),
        CONSTRAINT [CK_ReqConsolidado_TipoOrigen] 
            CHECK ([tipo_origen] IN ('COMPRA', 'CONSUMO')),
        CONSTRAINT [CK_ReqConsolidado_Estado] 
            CHECK ([estado] IN ('ACTIVA', 'PARCIAL', 'COMPLETA', 'ANULADA'))
    );
    
    CREATE INDEX [IX_ReqConsolidado_Origen] ON [dbo].[ReqConsolidado]([id_requerimiento_origen], [no_linea_origen]);
    CREATE INDEX [IX_ReqConsolidado_Consolidado] ON [dbo].[ReqConsolidado]([no_reqconsolcompra], [no_linea_consolidada]);
    CREATE INDEX [IX_ReqConsolidado_TipoOrigen] ON [dbo].[ReqConsolidado]([tipo_origen]);
END
GO

-- Tabla: SolicitudCotizacion
-- Almacena las solicitudes de cotización generadas desde consolidaciones
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SolicitudCotizacion]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SolicitudCotizacion] (
        [no_solicitud] VARCHAR(50) NOT NULL PRIMARY KEY,
        [no_cia] VARCHAR(20) NOT NULL,
        [no_reqconsolcompra] VARCHAR(50) NOT NULL,
        [fecha_solicitud] DATETIME NOT NULL DEFAULT GETDATE(),
        [fecha_limite_respuesta] DATETIME NULL,
        [estado] VARCHAR(20) NOT NULL DEFAULT 'BORRADOR', -- BORRADOR, ENVIADA, EN_PROCESO, CERRADA, ANULADA
        [usuario_creador] VARCHAR(50) NOT NULL,
        [fecha_creacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [observaciones] VARCHAR(500) NULL,
        [eliminado] BIT NOT NULL DEFAULT 0,
        
        CONSTRAINT [FK_SolicitudCotizacion_ReqConsolCompra] 
            FOREIGN KEY ([no_reqconsolcompra]) 
            REFERENCES [dbo].[RequerimientoConsolidadoCompra]([no_reqconsolcompra]),
        CONSTRAINT [CK_SolicitudCotizacion_Estado] 
            CHECK ([estado] IN ('BORRADOR', 'ENVIADA', 'EN_PROCESO', 'CERRADA', 'ANULADA'))
    );
    
    CREATE INDEX [IX_SolicitudCotizacion_ReqConsol] ON [dbo].[SolicitudCotizacion]([no_reqconsolcompra]);
    CREATE INDEX [IX_SolicitudCotizacion_Estado] ON [dbo].[SolicitudCotizacion]([estado]);
END
GO

-- Tabla: DetalleSolicitudCotizacion
-- Detalle de ítems en la solicitud de cotización
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DetalleSolicitudCotizacion]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DetalleSolicitudCotizacion] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [no_solicitud] VARCHAR(50) NOT NULL,
        [no_linea] INT NOT NULL,
        [no_reqconsolcompra] VARCHAR(50) NOT NULL,
        [no_linea_consolidada] INT NOT NULL,
        [codigo_item] VARCHAR(50) NOT NULL,
        [descripcion_item] VARCHAR(200) NOT NULL,
        [cantidad] DECIMAL(18,4) NOT NULL,
        [unidad_medida] VARCHAR(20) NOT NULL,
        [fecha_creacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [eliminado] BIT NOT NULL DEFAULT 0,
        
        CONSTRAINT [FK_DetalleSolicitudCotiz_Solicitud] 
            FOREIGN KEY ([no_solicitud]) 
            REFERENCES [dbo].[SolicitudCotizacion]([no_solicitud]),
        CONSTRAINT [UQ_DetalleSolicitudCotiz_Linea] 
            UNIQUE ([no_solicitud], [no_linea])
    );
    
    CREATE INDEX [IX_DetalleSolicitudCotiz_Item] ON [dbo].[DetalleSolicitudCotizacion]([codigo_item]);
END
GO

-- Tabla: CotizacionProveedor
-- Cotizaciones recibidas de proveedores
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CotizacionProveedor]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CotizacionProveedor] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [no_solicitud] VARCHAR(50) NOT NULL,
        [no_linea_solicitud] INT NOT NULL,
        [codigo_proveedor] VARCHAR(50) NOT NULL,
        [nombre_proveedor] VARCHAR(200) NOT NULL,
        [precio_unitario] DECIMAL(18,4) NOT NULL,
        [cantidad_ofertada] DECIMAL(18,4) NOT NULL,
        [dias_entrega] INT NOT NULL,
        [forma_pago] VARCHAR(100) NOT NULL,
        [credito_dias] INT NULL,
        [fecha_cotizacion] DATETIME NOT NULL DEFAULT GETDATE(),
        [observaciones] VARCHAR(500) NULL,
        [seleccionado] BIT NOT NULL DEFAULT 0,
        [fecha_seleccion] DATETIME NULL,
        [usuario_seleccion] VARCHAR(50) NULL,
        [eliminado] BIT NOT NULL DEFAULT 0,
        
        CONSTRAINT [FK_CotizacionProveedor_Solicitud] 
            FOREIGN KEY ([no_solicitud]) 
            REFERENCES [dbo].[SolicitudCotizacion]([no_solicitud])
    );
    
    CREATE INDEX [IX_CotizacionProveedor_Solicitud] ON [dbo].[CotizacionProveedor]([no_solicitud], [no_linea_solicitud]);
    CREATE INDEX [IX_CotizacionProveedor_Proveedor] ON [dbo].[CotizacionProveedor]([codigo_proveedor]);
    CREATE INDEX [IX_CotizacionProveedor_Seleccionado] ON [dbo].[CotizacionProveedor]([seleccionado]);
END
GO

PRINT 'Tablas de Consolidación creadas exitosamente';
