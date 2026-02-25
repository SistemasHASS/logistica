-- =============================================
-- Author:      Sistema Logística
-- Create Date: 2026-02-24
-- Description: Listar notificaciones de stock para un usuario (versión corregida)
-- =============================================

-- Eliminar SP si existe para recrearlo
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'LOGISTICA_listarMisNotificaciones')
    DROP PROCEDURE [dbo].[LOGISTICA_listarMisNotificaciones]
GO

-- Crear SP
CREATE PROCEDURE [dbo].[LOGISTICA_listarMisNotificaciones]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @usuario VARCHAR(20);
    DECLARE @solo_no_leidas BIT;
    
    -- Parsear JSON con manejo de errores
    BEGIN TRY
        SELECT 
            @usuario = ISNULL(JSON_VALUE(@json, '$.usuario'), ''),
            @solo_no_leidas = ISNULL(JSON_VALUE(@json, '$.soloNoLeidas'), 'false')
    END TRY
    BEGIN CATCH
        -- Si hay error en el JSON, usar valores por defecto
        SET @usuario = ''
        SET @solo_no_leidas = 'false'
    END CATCH
    
    -- Validar que tengamos usuario
    IF @usuario = ''
    BEGIN
        SELECT '{"error": "Usuario no proporcionado"}' AS resultado
        RETURN
    END
    
    -- Consultar notificaciones de la tabla existente
    -- Usar FOR JSON PATH con manejo de NULL
    SELECT 
        id AS id_notificacion,
        ISNULL(iditem, '') AS iditem,
        ISNULL(itemDescripcion, '') AS itemDescripcion,
        ISNULL(tipo_notificacion, 'GENERAL') AS tipo_notificacion,
        ISNULL(mensaje, '') AS mensaje,
        ISNULL(leido, 0) AS leida,
        FORMAT(fecha, 'yyyy-MM-dd HH:mm:ss') AS fecha_creacion,
        NULL AS fecha_lectura,
        ISNULL(id_dreq, 0) AS idrequerimiento
    FROM logistica_notificaciones 
    WHERE usuario_destino = @usuario
    AND (@solo_no_leidas = 'false' OR leido = 0)
    ORDER BY fecha DESC
    
    FOR JSON PATH, INCLUDE_NULL_VALUES
    
END
GO

-- Probar el SP
DECLARE @testJson NVARCHAR(MAX) = '{"usuario": "47904392", "soloNoLeidas": false}'
EXEC [dbo].[LOGISTICA_listarMisNotificaciones] @testJson
GO

PRINT 'SP LOGISTICA_listarMisNotificaciones creado y probado correctamente'
