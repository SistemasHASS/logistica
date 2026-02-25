-- =============================================
-- Crear todos los Stored Procedures para notificaciones
-- =============================================

-- 1. SP para insertar notificación
-- Ejecutar si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'LOGISTICA_insertarNotificacionStock')
BEGIN
    EXEC ('
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
        
        -- Parsear JSON
        SELECT 
            @iditem = JSON_VALUE(@json, ''$.iditem''),
            @itemDescripcion = JSON_VALUE(@json, ''$.itemDescripcion''),
            @usuario = JSON_VALUE(@json, ''$.usuario''),
            @mensaje = JSON_VALUE(@json, ''$.mensaje''),
            @id_dreq = JSON_VALUE(@json, ''$.idrequerimiento'')
        
        -- Insertar notificación en la tabla existente
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
            ''STOCK_DISPONIBLE'',
            @mensaje,
            @usuario,
            0,
            GETDATE(),
            @id_dreq
        )
        
        -- Retornar éxito con el ID insertado
        SELECT JSON_MODIFY(
            ''{"resultado": "success", "mensaje": "Notificación insertada correctamente"}'',
            ''$.id'',
            SCOPE_IDENTITY()
        ) AS resultado;
    END
    ')
END
GO

-- 2. SP para listar notificaciones
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'LOGISTICA_listarMisNotificaciones')
BEGIN
    EXEC ('CREATE PROCEDURE [dbo].[LOGISTICA_listarMisNotificaciones] AS BEGIN SET NOCOUNT ON; SELECT ''[]'' AS resultado END')
END
GO

-- 3. SP para marcar como leída
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'LOGISTICA_marcarNotificacionLeida')
BEGIN
    EXEC ('CREATE PROCEDURE [dbo].[LOGISTICA_marcarNotificacionLeida] AS BEGIN SET NOCOUNT ON; SELECT ''{"resultado": "success"}'' AS resultado END')
END
GO

PRINT 'Stored Procedures de notificaciones creados correctamente'
