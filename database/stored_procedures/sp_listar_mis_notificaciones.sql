-- =============================================
-- Author:      Sistema Logística
-- Create Date: 2026-02-23
-- Description: Listar notificaciones de stock para un usuario (usando tabla existente)
-- =============================================
CREATE PROCEDURE [dbo].[LOGISTICA_listarMisNotificaciones]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @usuario VARCHAR(20);
    DECLARE @solo_no_leidas BIT;
    
    -- Parsear JSON
    SELECT 
        @usuario = ISNULL(JSON_VALUE(@json, '$.usuario'), ''),
        @solo_no_leidas = ISNULL(JSON_VALUE(@json, '$.soloNoLeidas'), 'false')
    
    -- Consultar notificaciones de la tabla existente
    SELECT 
        id AS id_notificacion,
        iditem,
        itemDescripcion,
        ISNULL(tipo_notificacion, 'GENERAL') AS tipo_notificacion,
        mensaje,
        leido AS leida,
        FORMAT(fecha, 'yyyy-MM-dd HH:mm:ss') AS fecha_creacion,
        NULL AS fecha_lectura,
        id_dreq AS idrequerimiento
    FROM logistica_notificaciones 
    WHERE usuario_destino = @usuario
    AND (@solo_no_leidas = 'false' OR leido = 0)
    ORDER BY fecha DESC
    
    FOR JSON PATH
END
