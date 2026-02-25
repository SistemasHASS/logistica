-- =============================================
-- Insertar datos de prueba para la estructura actual de la tabla
-- =============================================

-- 1. Limpiar datos anteriores (opcional)
-- DELETE FROM LOGISTICA_SaldoPendienteItems WHERE idSolicitud IN (
--     SELECT idSolicitud FROM LOGISTICA_SaldoPendienteAprobacion 
--     WHERE usuarioCreador = '47904392'
-- )
-- DELETE FROM LOGISTICA_SaldoPendienteAprobacion WHERE usuarioCreador = '47904392'

-- 2. Insertar saldos pendientes principales
PRINT 'Insertando saldos pendientes principales...'

DECLARE @idSaldo1 INT, @idSaldo2 INT, @idSaldo3 INT

-- Saldo 1: Pendiente reciente
INSERT INTO LOGISTICA_SaldoPendienteAprobacion (
    idrequerimiento,
    requerimientoNumero,
    fechaSolicitud,
    usuarioSolicita,
    usuarioCreador,
    ceco,
    estado,
    totalItems,
    items,
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
    '[
        {
            "codigo": "000018",
            "descripcion": "6 SOLENOIDS 12-50 V DC",
            "cantidadSolicitada": 20,
            "cantidadDespachada": 5,
            "saldoPendiente": 15,
            "unidadMedida": "UND"
        }
    ]',
    GETDATE()
)

SET @idSaldo1 = SCOPE_IDENTITY()

-- Insertar detalle del saldo 1
INSERT INTO LOGISTICA_SaldoPendienteItems (
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
    20,
    5,
    15,
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
    items,
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
    '[
        {
            "codigo": "000025",
            "descripcion": "VALVULA SOLENOIDE 2 VIAS",
            "cantidadSolicitada": 10,
            "cantidadDespachada": 0,
            "saldoPendiente": 10,
            "unidadMedida": "UND"
        },
        {
            "codigo": "000030",
            "descripcion": "KIT DE REPARACIÓN",
            "cantidadSolicitada": 5,
            "cantidadDespachada": 2,
            "saldoPendiente": 3,
            "unidadMedida": "KIT"
        }
    ]',
    DATEADD(day, -1, GETDATE())
)

SET @idSaldo2 = SCOPE_IDENTITY()

-- Insertar detalles del saldo 2
INSERT INTO LOGISTICA_SaldoPendienteItems (idSolicitud, codigo, descripcion, cantidadSolicitada, cantidadDespachada, saldoPendiente, unidadMedida)
VALUES 
    (@idSaldo2, '000025', 'VALVULA SOLENOIDE 2 VIAS', 10, 0, 10, 'UND'),
    (@idSaldo2, '000030', 'KIT DE REPARACIÓN', 5, 2, 3, 'KIT')

-- Saldo 3: Consolidado (para probar cierre)
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
    items,
    fechaCreacion
) VALUES (
    12347,
    'REQ-2024-003',
    DATEADD(day, -2, GETDATE()),
    '47904392',
    '47904392',
    'CECO003',
    'CONSOLIDADO',
    'system',
    DATEADD(hour, -1, GETDATE()),
    'Consolidado para compra',
    1,
    '[
        {
            "codigo": "000040",
            "descripcion": "SENSOR DE PRESIÓN",
            "cantidadSolicitada": 8,
            "cantidadDespachada": 0,
            "saldoPendiente": 8,
            "unidadMedida": "UND"
        }
    ]',
    DATEADD(day, -2, GETDATE())
)

SET @idSaldo3 = SCOPE_IDENTITY()

-- Insertar detalle del saldo 3
INSERT INTO LOGISTICA_SaldoPendienteItems (
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
    8,
    0,
    8,
    'UND'
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

-- Notificación 3: Saldo consolidado (leída)
('000040', 'SENSOR DE PRESIÓN', 'SALDO_CONSOLIDADO',
 'El item 000040 - SENSOR DE PRESIÓN ha sido consolidado en un requerimiento de compra.',
 '47904392', 1, DATEADD(hour, -3, GETDATE()), 12347)

-- 4. Verificar los datos insertados
PRINT ''
PRINT '=== SALDOS PENDIENTES INSERTADOS ==='
SELECT 
    idSolicitud,
    requerimientoNumero,
    estado,
    usuarioCreador,
    fechaCreacion,
    totalItems
FROM LOGISTICA_SaldoPendienteAprobacion 
WHERE usuarioCreador = '47904392'
ORDER BY fechaCreacion DESC

PRINT ''
PRINT '=== DETALLES DE ITEMS INSERTADOS ==='
SELECT 
    spi.idSolicitud,
    spi.codigo,
    spi.descripcion,
    spi.cantidadSolicitada,
    spi.cantidadDespachada,
    spi.saldoPendiente,
    lspa.requerimientoNumero
FROM LOGISTICA_SaldoPendienteItems spi
INNER JOIN LOGISTICA_SaldoPendienteAprobacion lspa ON spi.idSolicitud = lspa.idSolicitud
WHERE lspa.usuarioCreador = '47904392'
ORDER BY spi.idSolicitud, spi.codigo

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
PRINT '=== IDs PARA PROBAR ==='
SELECT 
    idSolicitud AS 'ID para probar cerrar',
    requerimientoNumero,
    estado
FROM LOGISTICA_SaldoPendienteAprobacion 
WHERE usuarioCreador = '47904392'
AND estado IN ('PENDIENTE', 'ESPERA_STOCK')

PRINT ''
PRINT '=== DATOS CREADOS CORRECTAMENTE ==='
PRINT 'Ahora puedes:'
PRINT '1. Probar listar notificaciones en el frontend'
PRINT '2. Probar cerrar saldo con los IDs mostrados arriba'
PRINT '3. Probar consolidar saldos pendientes'

GO
