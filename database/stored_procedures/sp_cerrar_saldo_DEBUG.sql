-- =============================================
-- Script para debug del problema de cerrar saldo
-- =============================================

-- Verificar la estructura de la tabla
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'LOGISTICA_SaldoPendienteAprobacion'
ORDER BY ORDINAL_POSITION

-- Verificar si existe el saldo con ID 5356
SELECT * 
FROM LOGISTICA_SaldoPendienteAprobacion 
WHERE idSolicitud = 5356

-- Verificar todos los saldos pendientes
SELECT TOP 10 
    idSolicitud,
    idrequerimiento,
    estado,
    usuarioCreador,
    fechaCreacion
FROM LOGISTICA_SaldoPendienteAprobacion
ORDER BY idSolicitud DESC

-- Verificar el SP actual
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'LOGISTICA_cerrarSaldo')
BEGIN
    PRINT 'SP LOGISTICA_cerrarSaldo existe'
    
    -- Ejecutar SP con debug
    DECLARE @json NVARCHAR(MAX) = '{
        "idSaldo": 5356,
        "usuario": "system",
        "motivo": "Cerrado por consolidación"
    }'
    
    PRINT 'Ejecutando SP con JSON: ' + @json
    EXEC LOGISTICA_cerrarSaldo @json
END
ELSE
BEGIN
    PRINT 'SP LOGISTICA_cerrarSaldo NO existe'
END

GO
