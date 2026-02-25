-- =============================================
-- STORED PROCEDURES PARA MÓDULO DE CONSOLIDACIÓN
-- =============================================

-- =============================================
-- SP: Obtener Requerimientos Elegibles para Consolidación
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ObtenerRequerimientosElegibles]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_ObtenerRequerimientosElegibles]
GO

CREATE PROCEDURE [dbo].[sp_ObtenerRequerimientosElegibles]
    @no_cia VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Requerimientos de COMPRA elegibles
    SELECT 
        r.idrequerimiento AS id_requerimiento,
        'COMPRA' AS tipo,
        r.idrequerimiento AS numero_requerimiento,
        r.fecha,
        r.estado,
        CASE WHEN r.estado = 1 THEN 1 ELSE 0 END AS aprobado,
        CASE WHEN r.cerrado = 1 THEN 1 ELSE 0 END AS cerrado
    FROM requerimiento r
    WHERE r.ruc = @no_cia
        AND r.estado = 1 -- Aprobado
        AND ISNULL(r.cerrado, 0) = 0 -- No cerrado
        AND r.eliminado = 0
        AND EXISTS (
            SELECT 1 FROM detalle d 
            WHERE d.idrequerimiento = r.idrequerimiento 
            AND d.eliminado = 0
        )
    
    UNION ALL
    
    -- Requerimientos de CONSUMO con saldo pendiente
    SELECT 
        c.idrequerimiento AS id_requerimiento,
        'CONSUMO' AS tipo,
        c.idrequerimiento AS numero_requerimiento,
        c.fecha,
        c.estado,
        CASE WHEN c.estado = 1 THEN 1 ELSE 0 END AS aprobado,
        CASE WHEN c.cerrado = 1 THEN 1 ELSE 0 END AS cerrado
    FROM consumo c
    WHERE c.ruc = @no_cia
        AND c.estado = 1 -- Aprobado
        AND ISNULL(c.cerrado, 0) = 0
        AND c.eliminado = 0
        AND EXISTS (
            SELECT 1 FROM detalleconsumo dc
            WHERE dc.idrequerimiento = c.idrequerimiento
            AND dc.eliminado = 0
            AND (dc.cantidad - ISNULL(dc.cantidad_atendida, 0)) > 0 -- Con saldo
        )
    ORDER BY fecha DESC;
END
GO

-- =============================================
-- SP: Obtener Detalles de Requerimientos Elegibles
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ObtenerDetallesRequerimientosElegibles]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_ObtenerDetallesRequerimientosElegibles]
GO

CREATE PROCEDURE [dbo].[sp_ObtenerDetallesRequerimientosElegibles]
    @id_requerimiento VARCHAR(50),
    @tipo_origen VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @tipo_origen = 'COMPRA'
    BEGIN
        -- Detalles de requerimientos de COMPRA
        SELECT 
            d.id AS no_linea,
            @id_requerimiento AS id_requerimiento_origen,
            d.codigo AS codigo_item,
            d.descripcion AS descripcion_item,
            d.cantidad AS cantidad_solicitada,
            0 AS cantidad_atendida,
            d.cantidad AS saldo,
            d.unidad AS unidad_medida,
            ISNULL(rc.cantidad_consolidada, 0) AS cantidad_consolidada,
            CASE WHEN rc.id IS NOT NULL THEN 1 ELSE 0 END AS consolidado
        FROM detalle d
        LEFT JOIN ReqConsolidado rc ON rc.id_requerimiento_origen = @id_requerimiento 
            AND rc.no_linea_origen = d.id 
            AND rc.eliminado = 0
        WHERE d.idrequerimiento = @id_requerimiento
            AND d.eliminado = 0;
    END
    ELSE IF @tipo_origen = 'CONSUMO'
    BEGIN
        -- Detalles de requerimientos de CONSUMO con saldo
        SELECT 
            dc.id AS no_linea,
            @id_requerimiento AS id_requerimiento_origen,
            dc.codigo AS codigo_item,
            dc.descripcion AS descripcion_item,
            dc.cantidad AS cantidad_solicitada,
            ISNULL(dc.cantidad_atendida, 0) AS cantidad_atendida,
            (dc.cantidad - ISNULL(dc.cantidad_atendida, 0)) AS saldo,
            dc.unidad AS unidad_medida,
            ISNULL(rc.cantidad_consolidada, 0) AS cantidad_consolidada,
            CASE WHEN rc.id IS NOT NULL THEN 1 ELSE 0 END AS consolidado
        FROM detalleconsumo dc
        LEFT JOIN ReqConsolidado rc ON rc.id_requerimiento_origen = @id_requerimiento 
            AND rc.no_linea_origen = dc.id 
            AND rc.eliminado = 0
        WHERE dc.idrequerimiento = @id_requerimiento
            AND dc.eliminado = 0
            AND (dc.cantidad - ISNULL(dc.cantidad_atendida, 0)) > 0;
    END
END
GO

-- =============================================
-- SP: Generar Número de Consolidación
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GenerarNumeroConsolidacion]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GenerarNumeroConsolidacion]
GO

CREATE PROCEDURE [dbo].[sp_GenerarNumeroConsolidacion]
    @no_cia VARCHAR(20),
    @no_reqconsolcompra VARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @contador INT;
    DECLARE @fecha VARCHAR(8) = CONVERT(VARCHAR(8), GETDATE(), 112); -- YYYYMMDD
    
    -- Obtener el último número del día
    SELECT @contador = ISNULL(MAX(CAST(RIGHT(no_reqconsolcompra, 4) AS INT)), 0) + 1
    FROM RequerimientoConsolidadoCompra
    WHERE no_reqconsolcompra LIKE 'RC-' + @fecha + '%';
    
    -- Generar número: RC-YYYYMMDD-0001
    SET @no_reqconsolcompra = 'RC-' + @fecha + '-' + RIGHT('0000' + CAST(@contador AS VARCHAR(4)), 4);
END
GO

-- =============================================
-- SP: Crear Consolidación de Requerimientos
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_CrearConsolidacion]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_CrearConsolidacion]
GO

CREATE PROCEDURE [dbo].[sp_CrearConsolidacion]
    @no_cia VARCHAR(20),
    @usuario_creador VARCHAR(50),
    @observaciones VARCHAR(500) = NULL,
    @lineas NVARCHAR(MAX), -- JSON con las líneas a consolidar
    @no_reqconsolcompra VARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Generar número de consolidación
        EXEC sp_GenerarNumeroConsolidacion @no_cia, @no_reqconsolcompra OUTPUT;
        
        -- Crear encabezado de consolidación
        INSERT INTO RequerimientoConsolidadoCompra (
            no_reqconsolcompra, no_cia, fecha_consolidacion, estado, 
            usuario_creador, fecha_creacion, observaciones
        )
        VALUES (
            @no_reqconsolcompra, @no_cia, GETDATE(), 'CONSOLIDADO',
            @usuario_creador, GETDATE(), @observaciones
        );
        
        -- Procesar líneas desde JSON
        DECLARE @linea_numero INT = 1;
        
        -- Insertar detalles consolidados
        INSERT INTO DetalleRequerimientoConsolidado (
            no_reqconsolcompra, no_linea, no_cia, codigo_item, 
            descripcion_item, cantidad_total, unidad_medida
        )
        SELECT 
            @no_reqconsolcompra,
            ROW_NUMBER() OVER (ORDER BY codigo_item),
            @no_cia,
            codigo_item,
            descripcion_item,
            SUM(cantidad_consolidada) AS cantidad_total,
            unidad_medida
        FROM OPENJSON(@lineas)
        WITH (
            codigo_item VARCHAR(50) '$.codigo_item',
            descripcion_item VARCHAR(200) '$.descripcion_item',
            unidad_medida VARCHAR(20) '$.unidad_medida',
            origenes NVARCHAR(MAX) '$.origenes' AS JSON
        ) AS linea
        CROSS APPLY OPENJSON(linea.origenes)
        WITH (
            tipo_origen VARCHAR(20) '$.tipo_origen',
            id_requerimiento_origen VARCHAR(50) '$.id_requerimiento_origen',
            no_linea_origen INT '$.no_linea_origen',
            cantidad_consolidada DECIMAL(18,4) '$.cantidad_consolidada'
        ) AS origen
        GROUP BY codigo_item, descripcion_item, unidad_medida;
        
        -- Insertar trazabilidad (ReqConsolidado)
        INSERT INTO ReqConsolidado (
            no_reqconsolcompra, no_linea_consolidada, tipo_origen,
            id_requerimiento_origen, no_linea_origen, cantidad_consolidada,
            fecha_consolidacion, estado
        )
        SELECT 
            @no_reqconsolcompra,
            drc.no_linea,
            origen.tipo_origen,
            origen.id_requerimiento_origen,
            origen.no_linea_origen,
            origen.cantidad_consolidada,
            GETDATE(),
            'ACTIVA'
        FROM OPENJSON(@lineas)
        WITH (
            codigo_item VARCHAR(50) '$.codigo_item',
            origenes NVARCHAR(MAX) '$.origenes' AS JSON
        ) AS linea
        CROSS APPLY OPENJSON(linea.origenes)
        WITH (
            tipo_origen VARCHAR(20) '$.tipo_origen',
            id_requerimiento_origen VARCHAR(50) '$.id_requerimiento_origen',
            no_linea_origen INT '$.no_linea_origen',
            cantidad_consolidada DECIMAL(18,4) '$.cantidad_consolidada'
        ) AS origen
        INNER JOIN DetalleRequerimientoConsolidado drc 
            ON drc.no_reqconsolcompra = @no_reqconsolcompra
            AND drc.codigo_item = linea.codigo_item;
        
        COMMIT TRANSACTION;
        
        SELECT @no_reqconsolcompra AS no_reqconsolcompra;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

-- =============================================
-- SP: Obtener Consolidaciones
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ObtenerConsolidaciones]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_ObtenerConsolidaciones]
GO

CREATE PROCEDURE [dbo].[sp_ObtenerConsolidaciones]
    @no_cia VARCHAR(20),
    @estado VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        rc.no_reqconsolcompra,
        rc.no_cia,
        rc.fecha_consolidacion,
        rc.estado,
        rc.usuario_creador,
        rc.fecha_creacion,
        rc.observaciones,
        COUNT(drc.id) AS total_lineas
    FROM RequerimientoConsolidadoCompra rc
    LEFT JOIN DetalleRequerimientoConsolidado drc 
        ON drc.no_reqconsolcompra = rc.no_reqconsolcompra
        AND drc.eliminado = 0
    WHERE rc.no_cia = @no_cia
        AND rc.eliminado = 0
        AND (@estado IS NULL OR rc.estado = @estado)
    GROUP BY 
        rc.no_reqconsolcompra, rc.no_cia, rc.fecha_consolidacion,
        rc.estado, rc.usuario_creador, rc.fecha_creacion, rc.observaciones
    ORDER BY rc.fecha_consolidacion DESC;
END
GO

-- =============================================
-- SP: Obtener Detalle de Consolidación
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ObtenerDetalleConsolidacion]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_ObtenerDetalleConsolidacion]
GO

CREATE PROCEDURE [dbo].[sp_ObtenerDetalleConsolidacion]
    @no_reqconsolcompra VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Encabezado
    SELECT 
        rc.no_reqconsolcompra,
        rc.no_cia,
        rc.fecha_consolidacion,
        rc.estado,
        rc.usuario_creador,
        rc.fecha_creacion,
        rc.observaciones
    FROM RequerimientoConsolidadoCompra rc
    WHERE rc.no_reqconsolcompra = @no_reqconsolcompra
        AND rc.eliminado = 0;
    
    -- Detalles consolidados
    SELECT 
        drc.id,
        drc.no_reqconsolcompra,
        drc.no_linea,
        drc.codigo_item,
        drc.descripcion_item,
        drc.cantidad_total,
        drc.unidad_medida
    FROM DetalleRequerimientoConsolidado drc
    WHERE drc.no_reqconsolcompra = @no_reqconsolcompra
        AND drc.eliminado = 0
    ORDER BY drc.no_linea;
    
    -- Trazabilidad (orígenes)
    SELECT 
        rc.id,
        rc.no_reqconsolcompra,
        rc.no_linea_consolidada,
        rc.tipo_origen,
        rc.id_requerimiento_origen,
        rc.no_linea_origen,
        rc.cantidad_consolidada,
        rc.saldo_origen,
        rc.fecha_consolidacion,
        rc.estado
    FROM ReqConsolidado rc
    WHERE rc.no_reqconsolcompra = @no_reqconsolcompra
        AND rc.eliminado = 0
    ORDER BY rc.no_linea_consolidada, rc.id;
END
GO

-- =============================================
-- SP: Anular Consolidación
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_AnularConsolidacion]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_AnularConsolidacion]
GO

CREATE PROCEDURE [dbo].[sp_AnularConsolidacion]
    @no_reqconsolcompra VARCHAR(50),
    @motivo VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Actualizar estado de consolidación
        UPDATE RequerimientoConsolidadoCompra
        SET estado = 'ANULADO',
            observaciones = ISNULL(observaciones, '') + ' | ANULADO: ' + @motivo,
            fecha_modificacion = GETDATE()
        WHERE no_reqconsolcompra = @no_reqconsolcompra;
        
        -- Actualizar estado de trazabilidad
        UPDATE ReqConsolidado
        SET estado = 'ANULADA'
        WHERE no_reqconsolcompra = @no_reqconsolcompra;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

-- =============================================
-- SP: Generar Solicitud de Cotización
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GenerarSolicitudCotizacion]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GenerarSolicitudCotizacion]
GO

CREATE PROCEDURE [dbo].[sp_GenerarSolicitudCotizacion]
    @no_reqconsolcompra VARCHAR(50),
    @usuario_creador VARCHAR(50),
    @no_solicitud VARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @no_cia VARCHAR(20);
        DECLARE @fecha VARCHAR(8) = CONVERT(VARCHAR(8), GETDATE(), 112);
        DECLARE @contador INT;
        
        -- Obtener compañía
        SELECT @no_cia = no_cia 
        FROM RequerimientoConsolidadoCompra 
        WHERE no_reqconsolcompra = @no_reqconsolcompra;
        
        -- Generar número de solicitud
        SELECT @contador = ISNULL(MAX(CAST(RIGHT(no_solicitud, 4) AS INT)), 0) + 1
        FROM SolicitudCotizacion
        WHERE no_solicitud LIKE 'SC-' + @fecha + '%';
        
        SET @no_solicitud = 'SC-' + @fecha + '-' + RIGHT('0000' + CAST(@contador AS VARCHAR(4)), 4);
        
        -- Crear solicitud
        INSERT INTO SolicitudCotizacion (
            no_solicitud, no_cia, no_reqconsolcompra, fecha_solicitud,
            estado, usuario_creador, fecha_creacion
        )
        VALUES (
            @no_solicitud, @no_cia, @no_reqconsolcompra, GETDATE(),
            'ENVIADA', @usuario_creador, GETDATE()
        );
        
        -- Copiar detalles consolidados a solicitud
        INSERT INTO DetalleSolicitudCotizacion (
            no_solicitud, no_linea, no_reqconsolcompra, no_linea_consolidada,
            codigo_item, descripcion_item, cantidad, unidad_medida
        )
        SELECT 
            @no_solicitud,
            drc.no_linea,
            drc.no_reqconsolcompra,
            drc.no_linea,
            drc.codigo_item,
            drc.descripcion_item,
            drc.cantidad_total,
            drc.unidad_medida
        FROM DetalleRequerimientoConsolidado drc
        WHERE drc.no_reqconsolcompra = @no_reqconsolcompra
            AND drc.eliminado = 0;
        
        COMMIT TRANSACTION;
        
        SELECT @no_solicitud AS no_solicitud;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

PRINT 'Stored Procedures de Consolidación creados exitosamente';
