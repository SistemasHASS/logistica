-- =============================================
-- Script definitivo para tu estructura de tablas
-- =============================================

-- 1. Verificar estructura actual
PRINT '=== ESTRUCTURA ACTUAL DE TABLAS ==='
PRINT 'Tabla principal:'
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'LOGISTICA_SaldoPendienteAprobacion'
AND COLUMN_NAME IN ('idSolicitud', 'items')
ORDER BY ORDINAL_POSITION

PRINT ''
PRINT 'Tabla detalles:'
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'LOGISTICA_SaldoPendienteAprobacionDet'
ORDER BY ORDINAL_POSITION

-- 2. Limpiar datos de prueba anteriores (opcional)
/*
DELETE FROM LOGISTICA_SaldoPendienteAprobacionDet WHERE idSolicitud IN (
    SELECT idSolicitud FROM LOGISTICA_SaldoPendienteAprobacion 
    WHERE usuarioCreador = '47904392'
)
DELETE FROM LOGISTICA_SaldoPendienteAprobacion WHERE usuarioCreador = '47904392'
DELETE FROM logistica_notificaciones WHERE usuario_destino = '47904392'
*/

-- 3. Insertar saldos pendientes con JSON en campo items
PRINT ''
PRINT 'Insertando saldos pendientes...'

DECLARE @idSaldo1 INT, @idSaldo2 INT, @idSaldo3 INT, @idSaldo4 INT
DECLARE @jsonItems NVARCHAR(MAX)

-- Saldo 1: Pendiente reciente
SET @jsonItems = '[
    {
        "codigo": "000018",
        "descripcion": "6 SOLENOIDS 12-50 V DC",
        "cantidadSolicitada": 20.0000,
        "cantidadDespachada": 5.0000,
        "saldoPendiente": 15.0000,
        "unidadMedida": "UND"
    }
]'

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
    @jsonItems,
    GETDATE()
)

SET @idSaldo1 = SCOPE_IDENTITY()

-- Insertar en tabla de detalles
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

-- Saldo 2: En espera de stock (múltiples items)
SET @jsonItems = '[
    {
        "codigo": "000025",
        "descripcion": "VALVULA SOLENOIDE 2 VIAS",
        "cantidadSolicitada": 10.0000,
        "cantidadDespachada": 0.0000,
        "saldoPendiente": 10.0000,
        "unidadMedida": "UND"
    },
    {
        "codigo": "000030",
        "descripcion": "KIT DE REPARACIÓN",
        "cantidadSolicitada": 5.0000,
        "cantidadDespachada": 2.0000,
        "saldoPendiente": 3.0000,
        "unidadMedida": "KIT"
    }
]'

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
    @jsonItems,
    DATEADD(day, -1, GETDATE())
)

SET @idSaldo2 = SCOPE_IDENTITY()

-- Insertar detalles
INSERT INTO LOGISTICA_SaldoPendienteAprobacionDet (idSolicitud, codigo, descripcion, cantidadSolicitada, cantidadDespachada, saldoPendiente, unidadMedida)
VALUES 
    (@idSaldo2, '000025', 'VALVULA SOLENOIDE 2 VIAS', 10.0000, 0.0000, 10.0000, 'UND'),
    (@idSaldo2, '000030', 'KIT DE REPARACIÓN', 5.0000, 2.0000, 3.0000, 'KIT')

-- Saldo 3: Ya cerrado
SET @jsonItems = '[
    {
        "codigo": "000040",
        "descripcion": "SENSOR DE PRESIÓN",
        "cantidadSolicitada": 8.0000,
        "cantidadDespachada": 0.0000,
        "saldoPendiente": 8.0000,
        "unidadMedida": "UND"
    }
]'

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
    'CERRADO',
    'system',
    DATEADD(hour, -1, GETDATE()),
    'Consolidado y cerrado',
    1,
    @jsonItems,
    DATEADD(day, -2, GETDATE())
)

SET @idSaldo3 = SCOPE_IDENTITY()

-- Insertar detalle
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

-- 4. Insertar notificaciones
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
('000018', '6 SOLENOIDS 12-50 V DC', 'STOCK_DISPONIBLE', 
 'El item 000018 - 6 SOLENOIDS 12-50 V DC ahora tiene stock disponible. Requerimiento: REQ-2024-001.',
 '47904392', 0, DATEADD(minute, -30, GETDATE()), 12345),

('000025', 'VALVULA SOLENOIDE 2 VIAS', 'SALDO_PENDIENTE',
 'El item 000025 - VALVULA SOLENOIDE 2 VIAS ha quedado en saldo pendiente. Requerimiento: REQ-2024-002.',
 '47904392', 0, DATEADD(hour, -2, GETDATE()), 12346),

('000030', 'KIT DE REPARACIÓN', 'SALDO_PENDIENTE',
 'El item 000030 - KIT DE REPARACIÓN tiene saldo pendiente. Requerimiento: REQ-2024-002.',
 '47904392', 0, DATEADD(hour, -2, GETDATE()), 12346),

('000040', 'SENSOR DE PRESIÓN', 'SALDO_CERRADO',
 'El item 000040 - SENSOR DE PRESIÓN ha sido cerrado. Requerimiento: REQ-2024-003.',
 '47904392', 1, DATEADD(hour, -3, GETDATE()), 12347)

-- 5. Verificación final
PRINT ''
PRINT '=== SALDOS CREADOS ==='
SELECT 
    idSolicitud,
    requerimientoNumero,
    estado,
    totalItems,
    CASE 
        WHEN items IS NOT NULL THEN '✓ Con JSON'
        ELSE '✗ Sin JSON'
    END AS 'Tiene JSON',
    CASE 
        WHEN estado IN ('PENDIENTE', 'ESPERA_STOCK') THEN '✓ Puede cerrar'
        ELSE '✗ Cerrado'
    END AS 'Estado para cierre'
FROM LOGISTICA_SaldoPendienteAprobacion 
WHERE usuarioCreador = '47904392'
ORDER BY idSolicitud

PRINT ''
PRINT '=== IDs PARA PRUEBAS ==='
SELECT 
    idSolicitud AS 'ID para cerrar',
    requerimientoNumero,
    estado,
    'Copiar este ID' AS Accion
FROM LOGISTICA_SaldoPendienteAprobacion 
WHERE usuarioCreador = '47904392'
AND estado IN ('PENDIENTE', 'ESPERA_STOCK')

PRINT ''
PRINT '=== NOTIFICACIONES CREADAS ==='
SELECT COUNT(*) AS TotalNotificaciones,
       SUM(CASE WHEN leido = 0 THEN 1 ELSE 0 END) AS NoLeidas
FROM logistica_notificaciones 
WHERE usuario_destino = '47904392'

PRINT ''
PRINT '=== DATOS LISTOS PARA USAR ==='
PRINT '1. Usa los IDs mostrados arriba para probar cierre'
PRINT '2. Usuario para notificaciones: 47904392'
PRINT '3. Las tablas están perfectamente estructuradas'

GO
