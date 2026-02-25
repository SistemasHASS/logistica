-- =============================================
-- Author:      Sistema Logística
-- Create Date: 2026-02-23
-- Description: Insertar notificación de stock disponible (usando tabla existente)
-- =============================================
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
        @iditem = JSON_VALUE(@json, '$.iditem'),
        @itemDescripcion = JSON_VALUE(@json, '$.itemDescripcion'),
        @usuario = JSON_VALUE(@json, '$.usuario'),
        @mensaje = JSON_VALUE(@json, '$.mensaje'),
        @id_dreq = JSON_VALUE(@json, '$.idrequerimiento')
    
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
        'STOCK_DISPONIBLE',
        @mensaje,
        @usuario,
        0,
        GETDATE(),
        @id_dreq
    )
    
    -- Retornar éxito con el ID insertado
    SELECT JSON_MODIFY(
        '{"resultado": "success", "mensaje": "Notificación insertada correctamente"}',
        '$.id',
        SCOPE_IDENTITY()
    ) AS resultado;
END
