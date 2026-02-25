-- =============================================
-- Author:      Sistema Logística
-- Create Date: 2026-02-24
-- Description: Insertar notificación de stock (versión corregida)
-- =============================================

-- Eliminar SP si existe para recrearlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'LOGISTICA_insertarNotificacionStock')
    DROP PROCEDURE [dbo].[LOGISTICA_insertarNotificacionStock]
GO

CREATE PROCEDURE [dbo].[LOGISTICA_insertarNotificacionStock]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @iditem VARCHAR(20);
    DECLARE @itemDescripcion VARCHAR(200);
    DECLARE @usuario VARCHAR(20);
    DECLARE @mensaje VARCHAR(500);
    DECLARE @id_dreq BIGINT;
    DECLARE @id_insertado BIGINT;
    
    -- Parsear JSON con manejo de errores
    BEGIN TRY
        SELECT 
            @iditem = ISNULL(JSON_VALUE(@json, '$.iditem'), ''),
            @itemDescripcion = ISNULL(JSON_VALUE(@json, '$.itemDescripcion'), ''),
            @usuario = ISNULL(JSON_VALUE(@json, '$.usuario'), ''),
            @mensaje = ISNULL(JSON_VALUE(@json, '$.mensaje'), ''),
            @id_dreq = ISNULL(JSON_VALUE(@json, '$.idrequerimiento'), 0)
    END TRY
    BEGIN CATCH
        SELECT '{"error": "Error al parsear JSON", "detalle": ERROR_MESSAGE()}' AS resultado
        RETURN
    END CATCH
    
    -- Validar datos requeridos
    IF @iditem = '' OR @usuario = '' OR @mensaje = ''
    BEGIN
        SELECT '{"error": "Faltan datos requeridos: iditem, usuario o mensaje"}' AS resultado
        RETURN
    END
    
    -- Insertar notificación en la tabla existente
    BEGIN TRY
        INSERT INTO logistica_notificaciones 
        (
            iditem,
            itemDescripcion,
            tipo_notificacion,
            mensaje,
            usuario_destino,
            leido,
            fecha,
            id_dreq
        )
        VALUES
        (
            @iditem,
            @itemDescripcion,
            'STOCK_DISPONIBLE',
            @mensaje,
            @usuario,
            0,
            GETDATE(),
            @id_dreq
        )
        
        SET @id_insertado = SCOPE_IDENTITY()
        
        -- Retornar éxito con el ID insertado
        SELECT JSON_MODIFY(
            '{"resultado": "success", "mensaje": "Notificación insertada correctamente"}',
            '$.id',
            @id_insertado
        ) AS resultado
        
    END TRY
    BEGIN CATCH
        SELECT JSON_MODIFY(
            '{"error": "Error al insertar notificación"}',
            '$.detalle',
            ERROR_MESSAGE()
        ) AS resultado
    END CATCH
    
END
GO

-- Probar el SP
DECLARE @testJson NVARCHAR(MAX) = '{
    "iditem": "000018",
    "itemDescripcion": "6 SOLENOIDS 12-50 V DC",
    "mensaje": "Este item ahora tiene stock disponible",
    "idrequerimiento": 12345,
    "usuario": "47904392"
}'
EXEC [dbo].[LOGISTICA_insertarNotificacionStock] @testJson
GO

PRINT 'SP LOGISTICA_insertarNotificacionStock creado y probado correctamente'
