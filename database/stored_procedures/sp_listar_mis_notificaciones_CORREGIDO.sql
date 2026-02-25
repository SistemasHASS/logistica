-- =============================================
-- Stored Procedure corregido para listar notificaciones
-- =============================================

-- Eliminar SP si existe
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'LOGISTICA_listarMisNotificaciones')
    DROP PROCEDURE [dbo].[LOGISTICA_listarMisNotificaciones]
GO

-- Crear SP corregido
CREATE PROCEDURE [dbo].[LOGISTICA_listarMisNotificaciones]
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @usuario VARCHAR(50);
    DECLARE @solo_no_leidas BIT;
    
    -- Parsear JSON
    SELECT 
        @usuario = ISNULL(JSON_VALUE(@json, '$.usuario'), ''),
        @solo_no_leidas = ISNULL(JSON_VALUE(@json, '$.soloNoLeidas'), 'false')
    
    -- Si no hay usuario, retornar JSON vacío válido
    IF @usuario = '' OR @usuario IS NULL
    BEGIN
        SELECT '[]' AS resultado
        RETURN
    END
    
    -- Consultar notificaciones y asegurar que retorne JSON
    DECLARE @result NVARCHAR(MAX)
    
    SELECT @result = (
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
        FROM logistica_notificaciones WITH (NOLOCK)
        WHERE usuario_destino = @usuario
        AND (@solo_no_leidas = 'false' OR ISNULL(leido, 0) = 0)
        ORDER BY fecha DESC
        FOR JSON PATH, INCLUDE_NULL_VALUES
    )
    
    -- Si no hay resultados, retornar array vacío
    IF @result IS NULL OR @result = ''
    BEGIN
        SELECT '[]' AS resultado
    END
    ELSE
    BEGIN
        SELECT @result AS resultado
    END
    
END
GO

-- Probar con datos de ejemplo
-- Primero insertar una notificación de prueba
INSERT INTO logistica_notificaciones (
    iditem, 
    itemDescripcion, 
    tipo_notificacion, 
    mensaje, 
    usuario_destino, 
    leido, 
    fecha, 
    id_dreq
) VALUES (
    '000018',
    '6 SOLENOIDS 12-50 V DC',
    'STOCK_DISPONIBLE',
    'Este item ahora tiene stock disponible y puede ser despachado.',
    '47904392',
    0,
    GETDATE(),
    12345
)

-- Ahora probar el SP
DECLARE @testJson NVARCHAR(MAX) = '{"usuario": "47904392", "soloNoLeidas": false}'
PRINT 'Ejecutando SP con usuario: 47904392'
EXEC [dbo].[LOGISTICA_listarMisNotificaciones] @testJson

-- Limpiar datos de prueba
-- DELETE FROM logistica_notificaciones WHERE usuario_destino = '47904392' AND iditem = '000018'

GO

PRINT 'SP LOGISTICA_listarMisNotificaciones creado y probado correctamente'
