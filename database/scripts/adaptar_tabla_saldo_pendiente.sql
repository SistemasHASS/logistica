-- =============================================
-- Adaptar la tabla LOGISTICA_SaldoPendienteAprobacion a la estructura existente
-- =============================================

-- La tabla actual no tiene el campo 'items' para almacenar el JSON
-- Vamos a agregarlo y crear las tablas relacionadas necesarias

-- 1. Agregar el campo items a la tabla principal
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'LOGISTICA_SaldoPendienteAprobacion' 
               AND COLUMN_NAME = 'items')
BEGIN
    ALTER TABLE [dbo].[LOGISTICA_SaldoPendienteAprobacion]
    ADD [items] NVARCHAR(MAX) NULL
    
    PRINT 'Campo items agregado a LOGISTICA_SaldoPendienteAprobacion'
END
ELSE
BEGIN
    PRINT 'El campo items ya existe en LOGISTICA_SaldoPendienteAprobacion'
END

-- 2. Crear tabla para los detalles de los items del saldo pendiente
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES 
               WHERE TABLE_NAME = 'LOGISTICA_SaldoPendienteItems')
BEGIN
    CREATE TABLE [dbo].[LOGISTICA_SaldoPendienteItems](
        [idItem] [int] IDENTITY(1,1) NOT NULL,
        [idSolicitud] [int] NOT NULL,
        [codigo] [varchar](20) NOT NULL,
        [descripcion] [varchar](200) NULL,
        [cantidadSolicitada] [decimal](10,2) NOT NULL,
        [cantidadDespachada] [decimal](10,2) NOT NULL,
        [saldoPendiente] [decimal](10,2) NOT NULL,
        [unidadMedida] [varchar](20) NULL,
        [fechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
        PRIMARY KEY CLUSTERED ([idItem] ASC),
        FOREIGN KEY ([idSolicitud]) REFERENCES [dbo].[LOGISTICA_SaldoPendienteAprobacion]([idSolicitud])
    )
    
    PRINT 'Tabla LOGISTICA_SaldoPendienteItems creada'
END
ELSE
BEGIN
    PRINT 'La tabla LOGISTICA_SaldoPendienteItems ya existe'
END

-- 3. Verificar la estructura final
PRINT ''
PRINT '=== ESTRUCTURA ACTUAL DE LOGISTICA_SaldoPendienteAprobacion ==='
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'LOGISTICA_SaldoPendienteAprobacion'
ORDER BY ORDINAL_POSITION

-- 4. Crear índices para mejorar el rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LOGISTICA_SaldoPendienteAprobacion_usuario')
BEGIN
    CREATE INDEX IX_LOGISTICA_SaldoPendienteAprobacion_usuario 
    ON [dbo].[LOGISTICA_SaldoPendienteAprobacion]([usuarioCreador])
    
    PRINT 'Índice por usuario creado'
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LOGISTICA_SaldoPendienteAprobacion_estado')
BEGIN
    CREATE INDEX IX_LOGISTICA_SaldoPendienteAprobacion_estado 
    ON [dbo].[LOGISTICA_SaldoPendienteAprobacion]([estado])
    
    PRINT 'Índice por estado creado'
END

GO

PRINT 'Adaptación completada'
