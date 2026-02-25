-- =============================================
-- Insertar datos de prueba para la estructura final (con tabla de detalles)
-- =============================================

-- 1. Limpiar datos anteriores (opcional)
-- DELETE FROM LOGISTICA_SaldoPendienteAprobacionDet WHERE idSolicitud IN (
--     SELECT idSolicitud FROM LOGISTICA_SaldoPendienteAprobacion 
--     WHERE usuarioCreador = '47904392'
-- )
-- DELETE FROM LOGISTICA_SaldoPendienteAprobacion WHERE usuarioCreador = '47904392'
-- DELETE FROM logistica_notificaciones WHERE usuario_destino = '47904392'

-- 2. Insertar saldos pendientes principales
PRINT 'Insertando saldos pendientes principales...'

DECLARE @idSaldo1 INT, @idSaldo2 INT, @idSaldo3 INT, @idSaldo4 INT

-- Saldo 1: Pendiente reciente (para probar cierre)
INSERT INTO LOGISTICA_SaldoPendienteAprobacion (
    idrequerimiento,
    requerimientoNumero,
    fechaSolicitud,
    usuarioSolicita,
    usuarioCreador,
    ceco,
    estado,
    totalItems,
    fechaCreacion
) VALUES (
    12345,
    'REQ-2024-001',
    GETDATE(),
    '47904392',
    '47904392',
    'CECO001',
    'PENDIENTE',
    1,
    GETDATE()
)

SET @idSaldo1 = SCOPE_IDENTITY()

-- Insertar detalle del saldo 1
INSERT INTO LOGISTICA_SaldoPendienteAprobacionDet (
    idSolicitud,
    codigo,
    descripcion,
    cantidadSolicitada,
    cantidadDespachada,
    saldoPendiente,
    unidadMedida
) VALUES (
    @idSaldo1,
    '000018',
    '6 SOLENOIDS 12-50 V DC',
    20.0000,
    5.0000,
    15.0000,
    'UND'
)

-- Saldo 2: En espera de stock
INSERT INTO LOGISTICA_SaldoPendienteAprobacion (
    idrequerimiento,
    requerimientoNumero,
    fechaSolicitud,
    usuarioSolicita,
    usuarioCreador,
    ceco,
    estado,
    totalItems,
    fechaCreacion
) VALUES (
    12346,
    'REQ-2024-002',
    DATEADD(day, -1, GETDATE()),
    '47904392',
    '47904392',
    'CECO002',
    'ESPERA_STOCK',
    2,
    DATEADD(day, -1, GETDATE())
)

SET @idSaldo2 = SCOPE_IDENTITY()

-- Insertar detalles del saldo 2
INSERT INTO LOGISTICA_SaldoPendienteAprobacionDet (idSolicitud, codigo, descripcion, cantidadSolicitada, cantidadDespachada, saldoPendiente, unidadMedida)
VALUES 
    (@idSaldo2, '000025', 'VALVULA SOLENOIDE 2 VIAS', 10.0000, 0.0000, 10.0000, 'UND'),
    (@idSaldo2, '000030', 'KIT DE REPARACIÓN', 5.0000, 2.0000, 3.0000, 'KIT')

-- Saldo 3: Consolidado (ya cerrado)
INSERT INTO LOGISTICA_SaldoPendienteAprobacion (
    idrequerimiento,
    requerimientoNumero,
    fechaSolicitud,
    usuarioSolicita,
    usuarioCreador,
    ceco,
    estado,
    usuarioResuelve,
    fechaResolucion,
    motivoRechazo,
    totalItems,
    fechaCreacion
) VALUES (
    12347,
    'REQ-2024-003',
    DATEADD(day, -2, GETDATE()),
    '47904392',
    '47904392',
    'CECO003',
    'CERRADO',
    'system',
    DATEADD(hour, -1, GETDATE()),
    'Consolidado y cerrado',
    1,
    DATEADD(day, -2, GETDATE())
)

SET @idSaldo3 = SCOPE_IDENTITY()

-- Insertar detalle del saldo 3
INSERT INTO LOGISTICA_SaldoPendienteAprobacionDet (
    idSolicitud,
    codigo,
    descripcion,
    cantidadSolicitada,
    cantidadDespachada,
    saldoPendiente,
    unidadMedida
) VALUES (
    @idSaldo3,
    '000040',
    'SENSOR DE PRESIÓN',
    8.0000,
    0.0000,
    8.0000,
    'UND'
)

-- Saldo 4: Otro pendiente (para tener más datos de prueba)
INSERT INTO LOGISTICA_SaldoPendienteAprobacion (
    idrequerimiento,
    requerimientoNumero,
    fechaSolicitud,
    usuarioSolicita,
    usuarioCreador,
    ceco,
    estado,
    totalItems,
    fechaCreacion
) VALUES (
    12348,
    'REQ-2024-004',
    DATEADD(hour, -3, GETDATE()),
    '47904392',
    '47904392',
    'CECO004',
    'PENDIENTE',
    1,
    DATEADD(hour, -3, GETDATE())
)

SET @idSaldo4 = SCOPE_IDENTITY()

-- Insertar detalle del saldo 4
INSERT INTO LOGISTICA_SaldoPendienteAprobacionDet (
    idSolicitud,
    codigo,
    descripcion,
    cantidadSolicitada,
    cantidadDespachada,
    saldoPendiente,
    unidadMedida
) VALUES (
    @idSaldo4,
    '000050',
    'CABLE DE ENERGÍA 10M',
    12.0000,
    0.0000,
    12.0000,
    'MTS'
)

-- 3. Insertar notificaciones
PRINT 'Insertando notificaciones...'

INSERT INTO logistica_notificaciones (
    iditem,
    itemDescripcion,
    tipo_notificacion,
    mensaje,
    usuario_destino,
    leido,
    fecha,
    id_dreq
) VALUES 
-- Notificación 1: Stock disponible (no leída)
('000018', '6 SOLENOIDS 12-50 V DC', 'STOCK_DISPONIBLE', 
 'El item 000018 - 6 SOLENOIDS 12-50 V DC ahora tiene stock disponible y puede ser despachado. Requerimiento: REQ-2024-001.',
 '47904392', 0, DATEADD(minute, -30, GETDATE()), 12345),

-- Notificación 2: Saldo pendiente (no leída)
('000025', 'VALVULA SOLENOIDE 2 VIAS', 'SALDO_PENDIENTE',
 'El item 000025 - VALVULA SOLENOIDE 2 VIAS ha quedado en saldo pendiente por falta de stock. Requerimiento: REQ-2024-002.',
 '47904392', 0, DATEADD(hour, -2, GETDATE()), 12346),

-- Notificación 3: Saldo cerrado (leída)
('000040', 'SENSOR DE PRESIÓN', 'SALDO_CERRADO',
 'El item 000040 - SENSOR DE PRESIÓN ha sido cerrado en el sistema.',
 '47904392', 1, DATEADD(hour, -3, GETDATE()), 12347),

-- Notificación 4: Nuevo saldo pendiente (no leída)
('000050', 'CABLE DE ENERGÍA 10M', 'SALDO_PENDIENTE',
 'El item 000050 - CABLE DE ENERGÍA 10M ha quedado en saldo pendiente. Requerimiento: REQ-2024-004.',
 '47904392', 0, DATEADD(hour, -1, GETDATE()), 12348)

-- 4. Verificar los datos insertados
PRINT ''
PRINT '=== SALDOS PENDIENTES INSERTADOS ==='
SELECT 
    idSolicitud,
    requerimientoNumero,
    estado,
    usuarioCreador,
    fechaCreacion,
    totalItems,
    CASE 
        WHEN estado IN ('PENDIENTE', 'ESPERA_STOCK') THEN '✓ Puede cerrar'
        ELSE '✗ Ya cerrado'
    END AS 'Estado para cierre'
FROM LOGISTICA_SaldoPendienteAprobacion 
WHERE usuarioCreador = '47904392'
ORDER BY fechaCreacion DESC

PRINT ''
PRINT '=== DETALLES DE ITEMS INSERTADOS ==='
SELECT 
    lspd.idSolicitud,
    lspd.codigo,
    lspd.descripcion,
    lspd.cantidadSolicitada,
    lspd.cantidadDespachada,
    lspd.saldoPendiente,
    lspd.unidadMedida,
    lspa.requerimientoNumero,
    lspa.estado
FROM LOGISTICA_SaldoPendienteAprobacionDet lspd
INNER JOIN LOGISTICA_SaldoPendienteAprobacion lspa ON lspd.idSolicitud = lspa.idSolicitud
WHERE lspa.usuarioCreador = '47904392'
ORDER BY lspd.idSolicitud, lspd.codigo

PRINT ''
PRINT '=== NOTIFICACIONES INSERTADAS ==='
SELECT 
    id,
    iditem,
    tipo_notificacion,
    leido,
    fecha
FROM logistica_notificaciones 
WHERE usuario_destino = '47904392'
ORDER BY fecha DESC

PRINT ''
PRINT '=== IDs PARA PROBAR CIERRE ==='
SELECT 
    idSolicitud AS 'ID para cerrar',
    requerimientoNumero,
    estado,
    'Copiar este ID' AS Accion
FROM LOGISTICA_SaldoPendienteAprobacion 
WHERE usuarioCreador = '47904392'
AND estado IN ('PENDIENTE', 'ESPERA_STOCK')

PRINT ''
PRINT '=== PRUEBA DEL SP LISTAR NOTIFICACIONES ==='
DECLARE @testJson NVARCHAR(MAX) = '{"usuario": "47904392", "soloNoLeidas": false}'
EXEC [dbo].[LOGISTICA_listarMisNotificaciones] @testJson

PRINT ''
PRINT '=== DATOS CREADOS CORRECTAMENTE ==='
PRINT 'Ahora puedes:'
PRINT '1. Probar listar notificaciones en el frontend'
PRINT '2. Probar cerrar saldo con los IDs mostrados arriba (ej: ' + CAST(@idSaldo1 AS VARCHAR) + ')'
PRINT '3. Ir a Saldo-Requerimiento para ver los saldos pendientes'
PRINT '4. Probar consolidar saldos pendientes'

GO
