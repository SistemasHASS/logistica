-- =============================================
-- Script para llenar datos de prueba en el sistema
-- =============================================

-- 1. Primero, verificar si las tablas existen
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'LOGISTICA_SaldoPendienteAprobacion')
BEGIN
    PRINT 'ERROR: La tabla LOGISTICA_SaldoPendienteAprobacion no existe'
    PRINT 'Ejecuta primero el script de creación de tablas'
    RETURN
END

-- 2. Limpiar datos de prueba anteriores (opcional)
-- DELETE FROM LOGISTICA_SaldoPendienteAprobacion WHERE usuarioCreador = '47904392'
-- DELETE FROM logistica_notificaciones WHERE usuario_destino = '47904392'

-- 3. Insertar saldos pendientes de prueba
PRINT 'Insertando saldos pendientes de prueba...'

INSERT INTO LOGISTICA_SaldoPendienteAprobacion (
    idrequerimiento,
    requerimientoNumero,
    usuarioCreador,
    fechaCreacion,
    estado,
    motivoRechazo,
    usuarioResuelve,
    fechaResolucion,
    items
) VALUES 
-- Saldo 1: Pendiente reciente
(12345, 'REQ-2024-001', '47904392', GETDATE(), 'PENDIENTE', NULL, NULL, NULL, 
'[
    {
        "codigo": "000018",
        "descripcion": "6 SOLENOIDS 12-50 V DC",
        "cantidadSolicitada": 20,
        "cantidadDespachada": 5,
        "saldoPendiente": 15,
        "unidadMedida": "UND"
    }
]'),

-- Saldo 2: En espera de stock
(12346, 'REQ-2024-002', '47904392', DATEADD(day, -1, GETDATE()), 'ESPERA_STOCK', NULL, NULL, NULL,
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
]'),

-- Saldo 3: Listo para consolidar
(12347, 'REQ-2024-003', '47904392', DATEADD(day, -2, GETDATE()), 'CONSOLIDADO', NULL, 'system', DATEADD(hour, -1, GETDATE()),
'[
    {
        "codigo": "000040",
        "descripcion": "SENSOR DE PRESIÓN",
        "cantidadSolicitada": 8,
        "cantidadDespachada": 0,
        "saldoPendiente": 8,
        "unidadMedida": "UND"
    }
]')

-- 4. Insertar notificaciones de prueba
PRINT 'Insertando notificaciones de prueba...'

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

-- 5. Verificar los datos insertados
PRINT '=== SALDOS PENDIENTES INSERTADOS ==='
SELECT 
    idSolicitud,
    requerimientoNumero,
    estado,
    usuarioCreador,
    fechaCreacion,
    COUNT(*) OVER() AS TotalRegistros
FROM LOGISTICA_SaldoPendienteAprobacion 
WHERE usuarioCreador = '47904392'
ORDER BY fechaCreacion DESC

PRINT ''
PRINT '=== NOTIFICACIONES INSERTADAS ==='
SELECT 
    id,
    iditem,
    tipo_notificacion,
    leido,
    fecha,
    COUNT(*) OVER() AS TotalRegistros
FROM logistica_notificaciones 
WHERE usuario_destino = '47904392'
ORDER BY fecha DESC

-- 6. Probar el SP de listar notificaciones
PRINT ''
PRINT '=== PRUEBA DEL SP LISTAR NOTIFICACIONES ==='
DECLARE @testJson NVARCHAR(MAX) = '{"usuario": "47904392", "soloNoLeidas": false}'
EXEC [dbo].[LOGISTICA_listarMisNotificaciones] @testJson

PRINT ''
PRINT '=== DATOS DE PRUEBA CREADOS CORRECTAMENTE ==='
PRINT 'Ahora puedes:'
PRINT '1. Probar listar notificaciones en el frontend'
PRINT '2. Probar cerrar saldo con el ID: 5356 (o usa los IDs mostrados arriba)'
PRINT '3. Probar consolidar saldos pendientes'

GO
