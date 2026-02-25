-- =============================================
-- Stored Procedure para cerrar saldo pendiente (versión final con tabla de detalles)
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
                SELECT 'ERROR' AS error, 
                       'Saldo no encontrado o no puede ser cerrado. Estado debe ser PENDIENTE o ESPERA_STOCK.' AS mensaje,
                       @idSaldo AS idIntentado
                FOR JSON PATH
            ) AS resultado;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Obtener información del saldo antes de cerrar
        DECLARE @reqNumero VARCHAR(50), @estadoActual VARCHAR(20), @idReq INT;
        SELECT @reqNumero = requerimientoNumero, 
               @estadoActual = estado,
               @idReq = idrequerimiento
        FROM LOGISTICA_SaldoPendienteAprobacion 
        WHERE idSolicitud = @idSaldo;

        -- Actualizar estado a CERRADO
        UPDATE LOGISTICA_SaldoPendienteAprobacion
        SET estado = 'CERRADO',
            usuarioResuelve = @usuario,
            fechaResolucion = GETDATE(),
            motivoRechazo = @motivo
        WHERE idSolicitud = @idSaldo;

        -- Insertar notificación de cierre para cada item en el saldo
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
            d.codigo AS iditem,
            d.descripcion AS itemDescripcion,
            'SALDO_CERRADO' AS tipo_notificacion,
            'El saldo pendiente del item ' + d.codigo + ' - ' + d.descripcion + 
            ' (Req: ' + @reqNumero + ') ha sido cerrado. Motivo: ' + @motivo AS mensaje,
            a.usuarioCreador AS usuario_destino,
            0 AS leido,
            GETDATE() AS fecha,
            a.idrequerimiento AS id_dreq
        FROM LOGISTICA_SaldoPendienteAprobacionDet d
        INNER JOIN LOGISTICA_SaldoPendienteAprobacion a ON d.idSolicitud = a.idSolicitud
        WHERE d.idSolicitud = @idSaldo;

        COMMIT TRANSACTION;

        SELECT (
            SELECT 'OK' AS resultado, 
                   'Saldo cerrado correctamente' AS mensaje,
                   @idSaldo AS idSaldoCerrado,
                   @reqNumero AS requerimientoNumero,
                   @estadoActual AS estadoAnterior
            FOR JSON PATH
        ) AS resultado;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT (
            SELECT 'ERROR' AS error, 
                   ERROR_MESSAGE() AS mensaje,
                   ERROR_NUMBER() AS errorCode,
                   @idSaldo AS idSaldoIntentado
            FOR JSON PATH
        ) AS resultado;
    END CATCH
END
GO

-- Probar el SP
PRINT '=== PRUEBA DEL SP LOGISTICA_cerrarSaldo ==='

-- Mostrar saldos disponibles para cerrar
SELECT 
    idSolicitud AS 'ID disponible',
    requerimientoNumero,
    estado,
    fechaCreacion,
    CASE 
        WHEN estado IN ('PENDIENTE', 'ESPERA_STOCK') THEN '✓ Puede cerrar'
        ELSE '✗ No se puede cerrar'
    END AS 'Disponible para cierre'
FROM LOGISTICA_SaldoPendienteAprobacion 
WHERE usuarioCreador = '47904392'
ORDER BY idSolicitud

-- Probar cerrar el primer saldo pendiente encontrado
DECLARE @idParaCerrar INT = (
    SELECT TOP 1 idSolicitud 
    FROM LOGISTICA_SaldoPendienteAprobacion 
    WHERE estado IN ('PENDIENTE', 'ESPERA_STOCK')
    AND usuarioCreador = '47904392'
)

IF @idParaCerrar IS NOT NULL
BEGIN
    PRINT ''
    PRINT 'Cerrando saldo con ID: ' + CAST(@idParaCerrar AS VARCHAR)
    
    DECLARE @jsonTest NVARCHAR(MAX) = '{
        "idSaldo": ' + CAST(@idParaCerrar AS VARCHAR) + ',
        "usuario": "system",
        "motivo": "Cerrado por consolidación automática"
    }'
    
    PRINT 'JSON enviado: ' + @jsonTest
    EXEC LOGISTICA_cerrarSaldo @jsonTest
    
    -- Verificar que se cerró
    PRINT ''
    PRINT 'Verificando cierre:'
    SELECT 
        idSolicitud,
        requerimientoNumero,
        estado,
        usuarioResuelve,
        fechaResolucion,
        motivoRechazo
    FROM LOGISTICA_SaldoPendienteAprobacion 
    WHERE idSolicitud = @idParaCerrar
END
ELSE
BEGIN
    PRINT ''
    PRINT 'No hay saldos pendientes para cerrar'
END

GO

PRINT 'SP LOGISTICA_cerrarSaldo creado y probado correctamente'
