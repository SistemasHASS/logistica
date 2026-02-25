-- =============================================
-- Author:      Sistema Logística
-- Create Date: 2026-02-24
-- Description: Listar notificaciones (versión final corregida)
-- =============================================

-- Primero, verificar si la tabla existe y tiene la estructura correcta
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'logistica_notificaciones')
BEGIN
    -- Crear tabla si no existe
    CREATE TABLE [dbo].[logistica_notificaciones](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [id_dreq] [int] NULL,
        [mensaje] [varchar](500) NULL,
        [usuario_destino] [varchar](50) NULL,
        [fecha] [datetime] NULL,
        [leido] [bit] NULL,
        PRIMARY KEY CLUSTERED ([id] ASC)
    )
    
    -- Agregar campos adicionales
    ALTER TABLE [dbo].[logistica_notificaciones] ADD [iditem] [VARCHAR](20) NULL
    ALTER TABLE [dbo].[logistica_notificaciones] ADD [itemDescripcion] [VARCHAR](200) NULL
    ALTER TABLE [dbo].[logistica_notificaciones] ADD [tipo_notificacion] [VARCHAR](50) NULL
    
    -- Defaults
    ALTER TABLE [dbo].[logistica_notificaciones] ADD DEFAULT (getdate()) FOR [fecha]
    ALTER TABLE [dbo].[logistica_notificaciones] ADD DEFAULT ((0)) FOR [leido]
END

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
    
    -- Parsear JSON con valores por defecto
    SELECT 
        @usuario = ISNULL(JSON_VALUE(@json, '$.usuario'), ''),
        @solo_no_leidas = ISNULL(JSON_VALUE(@json, '$.soloNoLeidas'), 'false')
    
    -- Si no hay usuario, retornar vacío
    IF @usuario = ''
    BEGIN
        SELECT '[]' AS resultado
        RETURN
    END
    
    -- Consultar notificaciones
    SELECT 
        id AS id_notificacion,
        ISNULL(iditem, '') AS iditem,
        ISNULL(itemDescripcion, '') AS itemDescripcion,
        ISNULL(tipo_notificacion, 'GENERAL') AS tipo_notificacion,
        ISNULL(mensaje, '') AS mensaje,
        ISNULL(leido, 0) AS leida,
        CONVERT(varchar, fecha, 120) AS fecha_creacion,
        NULL AS fecha_lectura,
        ISNULL(id_dreq, 0) AS idrequerimiento
    FROM logistica_notificaciones WITH (NOLOCK)
    WHERE usuario_destino = @usuario
    AND (@solo_no_leidas = 'false' OR ISNULL(leido, 0) = 0)
    ORDER BY fecha DESC
    
    FOR JSON PATH
    
END
GO

-- Probar el SP
DECLARE @testJson NVARCHAR(MAX) = '{"usuario": "47904392", "soloNoLeidas": false}'
PRINT 'Ejecutando SP con usuario: 47904392'
EXEC [dbo].[LOGISTICA_listarMisNotificaciones] @testJson
GO

PRINT 'SP LOGISTICA_listarMisNotificaciones creado correctamente'
