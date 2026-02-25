-- =============================================
-- Author:      Sistema Logística
-- Create Date: 2026-02-23
-- Description: Marcar notificación como leída (usando tabla existente)
-- =============================================
CREATE PROCEDURE [dbo].[LOGISTICA_marcarNotificacionLeida]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @id_notificacion BIGINT;
    DECLARE @usuario VARCHAR(20);
    
    -- Parsear JSON
    SELECT 
        @id_notificacion = JSON_VALUE(@json, '$.id_notificacion'),
        @usuario = JSON_VALUE(@json, '$.usuario')
    
    -- Actualizar notificación en la tabla existente
    UPDATE logistica_notificaciones 
    SET leido = 1
    WHERE id = @id_notificacion
    AND usuario_destino = @usuario
    
    -- Verificar si se actualizó
    IF @@ROWCOUNT > 0
        SELECT '{"resultado": "success", "mensaje": "Notificación marcada como leída"}' AS resultado
    ELSE
        SELECT '{"resultado": "error", "mensaje": "No se encontró la notificación"}' AS resultado
END
