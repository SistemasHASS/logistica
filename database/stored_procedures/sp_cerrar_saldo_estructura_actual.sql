-- =============================================
-- Stored Procedure para cerrar saldo pendiente (adaptado a estructura actual)
-- =============================================

-- Eliminar SP si existe
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'LOGISTICA_cerrarSaldo')
    DROP PROCEDURE LOGISTICA_cerrarSaldo;
GO

CREATE PROCEDURE LOGISTICA_cerrarSaldo
    @json NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @idSaldo INT = JSON_VALUE(@json, '$.idSaldo');
    DECLARE @usuario VARCHAR(50) = JSON_VALUE(@json, '$.usuario');
    DECLARE @motivo NVARCHAR(500) = ISNULL(JSON_VALUE(@json, '$.motivo'), 'Cerrado por usuario');

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Verificar que el saldo exista y esté en estado PENDIENTE o ESPERA_STOCK
        IF NOT EXISTS (
            SELECT 1 FROM LOGISTICA_SaldoPendienteAprobacion 
            WHERE idSolicitud = @idSaldo 
            AND estado IN ('PENDIENTE', 'ESPERA_STOCK')
        )
        BEGIN
            SELECT (
                SELECT 'ERROR' AS error, 'Saldo no encontrado o no puede ser cerrado' AS mensaje
                FOR JSON PATH
            ) AS resultado;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Obtener información del saldo antes de cerrar (para log/auditoría)
        DECLARE @reqNumero VARCHAR(50), @estadoActual VARCHAR(20);
        SELECT @reqNumero = requerimientoNumero, @estadoActual = estado
        FROM LOGISTICA_SaldoPendienteAprobacion 
        WHERE idSolicitud = @idSaldo;

        -- Actualizar estado a CERRADO
        UPDATE LOGISTICA_SaldoPendienteAprobacion
        SET estado = 'CERRADO',
            usuarioResuelve = @usuario,
            fechaResolucion = GETDATE(),
            motivoRechazo = @motivo
        WHERE idSolicitud = @idSaldo;

        -- Insertar notificación de cierre
        INSERT INTO logistica_notificaciones (
            iditem,
            itemDescripcion,
            tipo_notificacion,
            mensaje,
            usuario_destino,
            leido,
            fecha,
            id_dreq
        )
        SELECT 
            TOP 1 codigo AS iditem,
            descripcion AS itemDescripcion,
            'SALDO_CERRADO' AS tipo_notificacion,
            'El saldo pendiente del requerimiento ' + @reqNumero + ' ha sido cerrado. Motivo: ' + @motivo AS mensaje,
            usuarioCreador AS usuario_destino,
            0 AS leido,
            GETDATE() AS fecha,
            idrequerimiento AS id_dreq
        FROM LOGISTICA_SaldoPendienteItems
        WHERE idSolicitud = @idSaldo;

        COMMIT TRANSACTION;

        SELECT (
            SELECT 'OK' AS resultado, 
                   'Saldo cerrado correctamente' AS mensaje,
                   @idSaldo AS idSaldoCerrado,
                   @reqNumero AS requerimientoNumero
            FOR JSON PATH
        ) AS resultado;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT (
            SELECT 'ERROR' AS error, 
                   ERROR_MESSAGE() AS mensaje,
                   @idSaldo AS idSaldoIntentado
            FOR JSON PATH
        ) AS resultado;
    END CATCH
END
GO

-- Probar el SP
PRINT '=== PRUEBA DEL SP LOGISTICA_cerrarSaldo ==='

-- Primero verificar qué saldos están disponibles para cerrar
SELECT 
    idSolicitud AS 'ID disponible',
    requerimientoNumero,
    estado,
    'Usar este ID para probar' AS Accion
FROM LOGISTICA_SaldoPendienteAprobacion 
WHERE estado IN ('PENDIENTE', 'ESPERA_STOCK')
AND usuarioCreador = '47904392'

-- Probar cerrar el primer saldo encontrado
DECLARE @idParaCerrar INT = (
    SELECT TOP 1 idSolicitud 
    FROM LOGISTICA_SaldoPendienteAprobacion 
    WHERE estado IN ('PENDIENTE', 'ESPERA_STOCK')
    AND usuarioCreador = '47904392'
)

IF @idParaCerrar IS NOT NULL
BEGIN
    PRINT 'Cerrando saldo con ID: ' + CAST(@idParaCerrar AS VARCHAR)
    
    DECLARE @jsonTest NVARCHAR(MAX) = '{
        "idSaldo": ' + CAST(@idParaCerrar AS VARCHAR) + ',
        "usuario": "system",
        "motivo": "Cerrado por consolidación"
    }'
    
    EXEC LOGISTICA_cerrarSaldo @jsonTest
END
ELSE
BEGIN
    PRINT 'No hay saldos pendientes para cerrar'
END

GO

PRINT 'SP LOGISTICA_cerrarSaldo creado y probado correctamente'
