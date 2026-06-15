-- =============================================================================
-- CONFIGURACIÓN DE MENÚS DINÁMICOS - TODOS LOS ROLES
-- Fecha: 2026-06-10
-- Descripción: Inserta configuración por defecto (accordion + menú completo) 
--              para todos los roles del sistema Logística
-- =============================================================================

-- NOTA: Ejecutar este script en la BD LOGISTICA
-- Verificar primero que la tabla LOGISTICA_ConfiguracionPermiso exista

-- =============================================================================
-- MENÚ POR DEFECTO (JSON reutilizable)
-- =============================================================================
DECLARE @MENU_JSON_DEFAULT NVARCHAR(MAX) = N'[
  {
    "id": "panel",
    "label": "Mi Panel",
    "icono": "bx bxs-dashboard",
    "activo": true,
    "orden": 1,
    "items": [
      {"id": "dashboard-jlologist", "nombre": "Dashboard Jef. Logística", "icono": "bx bx-line-chart", "ruta": "./dashboard-jlologist", "activo": true, "orden": 1},
      {"id": "dashboard-oplogist", "nombre": "Mi Dashboard", "icono": "bx bx-user-check", "ruta": "./dashboard-oplogist", "activo": true, "orden": 2},
      {"id": "dashboard-logistica", "nombre": "Dashboard Logística", "icono": "bx bx-bar-chart-alt-2", "ruta": "./dashboard-logistica", "activo": true, "orden": 3}
    ]
  },
  {
    "id": "config",
    "label": "Configuración",
    "icono": "icon icon-equalizer",
    "activo": true,
    "orden": 2,
    "items": [
      {"id": "notificaciones", "nombre": "Notificaciones", "icono": "bx bx-bell", "ruta": "./notificaciones", "activo": true, "orden": 1}
    ]
  },
  {
    "id": "requerimientos",
    "label": "Requerimientos",
    "icono": "icon icon-stack",
    "activo": true,
    "orden": 3,
    "items": [
      {"id": "requerimientos", "nombre": "Requerimientos", "icono": "icon icon-stack", "ruta": "./requerimientos", "activo": true, "orden": 1},
      {"id": "saldo-requerimiento", "nombre": "Saldo de Requerimiento", "icono": "icon icon-balance", "ruta": "./saldo-requerimiento", "activo": true, "orden": 2}
    ]
  },
  {
    "id": "compras",
    "label": "Compras & Órdenes",
    "icono": "bx bx-cart",
    "activo": true,
    "orden": 4,
    "items": [
      {"id": "solicitudes-compra", "nombre": "Solicitudes de Compra", "icono": "bx bx-shopping-bag", "ruta": "./solicitudes-compra", "activo": true, "orden": 1},
      {"id": "ordenes-compra", "nombre": "Órdenes de Compra", "icono": "icon icon-file-text", "ruta": "./ordenes-compra", "activo": true, "orden": 2},
      {"id": "consolidacion-compras", "nombre": "Consolidación Compras", "icono": "bx bx-cart", "ruta": "./consolidacion-compras", "activo": true, "orden": 3},
      {"id": "solicitudes-servicio", "nombre": "Solicitudes de Servicio", "icono": "bx bx-briefcase", "ruta": "./solicitudes-servicio", "activo": true, "orden": 4},
      {"id": "ordenes-servicio", "nombre": "Órdenes de Servicio", "icono": "bx bx-wrench", "ruta": "./ordenes-servicio", "activo": true, "orden": 5},
      {"id": "cotizaciones", "nombre": "Cotizaciones", "icono": "icon icon-calculator", "ruta": "./cotizaciones", "activo": true, "orden": 6}
    ]
  },
  {
    "id": "almacen",
    "label": "Almacén & Stock",
    "icono": "bx bx-package",
    "activo": true,
    "orden": 5,
    "items": [
      {"id": "despachos", "nombre": "Gestión de Despachos", "icono": "icon icon-stack", "ruta": "./despachos", "activo": true, "orden": 1},
      {"id": "recepcion-mercaderia", "nombre": "Recepción de Mercadería", "icono": "icon icon-package", "ruta": "./recepcion-mercaderia", "activo": true, "orden": 2},
      {"id": "kardex", "nombre": "Kardex e Inventario", "icono": "bx bx-container", "ruta": "./kardex", "activo": true, "orden": 3}
    ]
  },
  {
    "id": "aprobaciones",
    "label": "Aprobaciones",
    "icono": "icon icon-file-check",
    "activo": true,
    "orden": 6,
    "items": [
      {"id": "aprobaciones-oc", "nombre": "Aprobación OC", "icono": "icon icon-file-check", "ruta": "./aprobaciones-oc", "activo": true, "orden": 1},
      {"id": "aprobaciones-os", "nombre": "Aprobación OS", "icono": "icon icon-file-check", "ruta": "./aprobaciones-os", "activo": true, "orden": 2}
    ]
  },
  {
    "id": "reportes",
    "label": "Reportes",
    "icono": "icon icon-file-text",
    "activo": true,
    "orden": 7,
    "items": [
      {"id": "reportes-compras", "nombre": "Reportes Avanzados", "icono": "icon icon-pie-chart", "ruta": "./reportes-compras", "activo": true, "orden": 1},
      {"id": "reporte-requerimientos", "nombre": "Reporte Requerimientos", "icono": "icon icon-file-check", "ruta": "./reporte-requerimientos", "activo": true, "orden": 2},
      {"id": "reporte-despachos", "nombre": "Reporte de Despachos", "icono": "icon icon-file-text", "ruta": "./reporte-despachos", "activo": true, "orden": 3}
    ]
  }
]';

-- =============================================================================
-- LIMPIAR CONFIGURACIONES EXISTENTES (Opcional - descomentar si se requiere)
-- =============================================================================
/*
DELETE FROM LOGISTICA_ConfiguracionPermiso
WHERE clave IN ('MENU_TYPE', 'MENU_JSON', 'LAYOUT_ACCORDION', 'LAYOUT_MENU_TYPE')
  AND idrol IN ('ADLOGIST', 'OPLOGIST', 'TILOGIST', 'APLOGIST', 'JEMLOGIST', 
                'LOLOGIST', 'EMLOGIST', 'ALLOGIST', 'FINANZAS', 'GERENTE');
*/

-- =============================================================================
-- 1. ADLOGIST - Admin Logística
-- =============================================================================
PRINT 'Configurando ADLOGIST - Admin Logística...';

INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('ADLOGIST', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion (grupos colapsables)', 'ADMIN', GETDATE()),
('ADLOGIST', 'MENU_JSON', @MENU_JSON_DEFAULT, 'Estructura completa del menú accordion por defecto', 'ADMIN', GETDATE()),
('ADLOGIST', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion para Admin Logística', 'ADMIN', GETDATE());

-- =============================================================================
-- 2. OPLOGIST - Operativo Logística
-- =============================================================================
PRINT 'Configurando OPLOGIST - Operativo Logística...';

INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('OPLOGIST', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion (grupos colapsables)', 'ADMIN', GETDATE()),
('OPLOGIST', 'MENU_JSON', @MENU_JSON_DEFAULT, 'Estructura completa del menú accordion por defecto', 'ADMIN', GETDATE()),
('OPLOGIST', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion para Operativo Logística', 'ADMIN', GETDATE());

-- =============================================================================
-- 3. TILOGIST - TI Logística
-- =============================================================================
PRINT 'Configurando TILOGIST - TI Logística...';

INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('TILOGIST', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion (grupos colapsables)', 'ADMIN', GETDATE()),
('TILOGIST', 'MENU_JSON', @MENU_JSON_DEFAULT, 'Estructura completa del menú accordion por defecto', 'ADMIN', GETDATE()),
('TILOGIST', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion para TI Logística', 'ADMIN', GETDATE());

-- =============================================================================
-- 4. APLOGIST - Aprobador Logística
-- =============================================================================
PRINT 'Configurando APLOGIST - Aprobador Logística...';

INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('APLOGIST', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion (grupos colapsables)', 'ADMIN', GETDATE()),
('APLOGIST', 'MENU_JSON', @MENU_JSON_DEFAULT, 'Estructura completa del menú accordion por defecto', 'ADMIN', GETDATE()),
('APLOGIST', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion para Aprobador Logística', 'ADMIN', GETDATE());

-- =============================================================================
-- 5. JEMLOGIST - Jefe Licitaciones/Compras
-- =============================================================================
PRINT 'Configurando JEMLOGIST - Jefe Licitaciones/Compras...';

INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('JEMLOGIST', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion (grupos colapsables)', 'ADMIN', GETDATE()),
('JEMLOGIST', 'MENU_JSON', @MENU_JSON_DEFAULT, 'Estructura completa del menú accordion por defecto', 'ADMIN', GETDATE()),
('JEMLOGIST', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion para Jefe Licitaciones', 'ADMIN', GETDATE());

-- =============================================================================
-- 6. LOLOGIST - Operador Logística
-- =============================================================================
PRINT 'Configurando LOLOGIST - Operador Logística...';

INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('LOLOGIST', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion (grupos colapsables)', 'ADMIN', GETDATE()),
('LOLOGIST', 'MENU_JSON', @MENU_JSON_DEFAULT, 'Estructura completa del menú accordion por defecto', 'ADMIN', GETDATE()),
('LOLOGIST', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion para Operador Logística', 'ADMIN', GETDATE());

-- =============================================================================
-- 7. EMLOGIST - Operador Licitaciones
-- =============================================================================
PRINT 'Configurando EMLOGIST - Operador Licitaciones...';

INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('EMLOGIST', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion (grupos colapsables)', 'ADMIN', GETDATE()),
('EMLOGIST', 'MENU_JSON', @MENU_JSON_DEFAULT, 'Estructura completa del menú accordion por defecto', 'ADMIN', GETDATE()),
('EMLOGIST', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion para Operador Licitaciones', 'ADMIN', GETDATE());

-- =============================================================================
-- 8. ALLOGIST - Almacén Logística
-- =============================================================================
PRINT 'Configurando ALLOGIST - Almacén Logística...';

INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('ALLOGIST', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion (grupos colapsables)', 'ADMIN', GETDATE()),
('ALLOGIST', 'MENU_JSON', @MENU_JSON_DEFAULT, 'Estructura completa del menú accordion por defecto', 'ADMIN', GETDATE()),
('ALLOGIST', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion para Almacén Logística', 'ADMIN', GETDATE());

-- =============================================================================
-- 9. FINANZAS - Finanzas
-- =============================================================================
PRINT 'Configurando FINANZAS - Finanzas...';

INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('FINANZAS', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion (grupos colapsables)', 'ADMIN', GETDATE()),
('FINANZAS', 'MENU_JSON', @MENU_JSON_DEFAULT, 'Estructura completa del menú accordion por defecto', 'ADMIN', GETDATE()),
('FINANZAS', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion para Finanzas', 'ADMIN', GETDATE());

-- =============================================================================
-- 10. GERENTE - Gerente
-- =============================================================================
PRINT 'Configurando GERENTE - Gerente...';

INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('GERENTE', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion (grupos colapsables)', 'ADMIN', GETDATE()),
('GERENTE', 'MENU_JSON', @MENU_JSON_DEFAULT, 'Estructura completa del menú accordion por defecto', 'ADMIN', GETDATE()),
('GERENTE', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion para Gerente', 'ADMIN', GETDATE());

-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================
PRINT '';
PRINT '=============================================================================';
PRINT 'CONFIGURACIÓN COMPLETADA';
PRINT '=============================================================================';
PRINT '';

SELECT 
    idrol,
    COUNT(*) as total_configs,
    STRING_AGG(clave, ', ') as claves_configuradas
FROM LOGISTICA_ConfiguracionPermiso
WHERE clave IN ('MENU_TYPE', 'MENU_JSON', 'LAYOUT_ACCORDION')
GROUP BY idrol
ORDER BY idrol;

PRINT '';
PRINT 'Total de roles configurados: 10';
PRINT 'NOTA: JLOLOGIST no se configura aquí (tiene menú especial hardcodeado)';
PRINT '';

-- =============================================================================
-- NOTAS IMPORTANTES
-- =============================================================================
/*
1. Este script inserta el MENÚ COMPLETO por defecto para todos los roles.

2. Si deseas personalizar el menú de un rol específico (ocultar items), 
   modifica el JSON antes de ejecutar o edítalo desde la interfaz web.

3. Para un rol con MENÚ REDUCIDO (ejemplo Gerente solo aprobaciones y reportes):
   
   DECLARE @MENU_GERENTE NVARCHAR(MAX) = N'[
     {"id":"panel","label":"Mi Panel","icono":"bx bxs-dashboard","activo":true,"orden":1,
      "items":[{"id":"dashboard-jlologist","nombre":"Dashboard","icono":"bx bx-line-chart","ruta":"./dashboard-jlologist","activo":true,"orden":1}]},
     {"id":"aprobaciones","label":"Aprobaciones","icono":"icon icon-file-check","activo":true,"orden":2,
      "items":[{"id":"aprobaciones-oc","nombre":"Aprobación OC","icono":"icon icon-file-check","ruta":"./aprobaciones-oc","activo":true,"orden":1},
               {"id":"aprobaciones-os","nombre":"Aprobación OS","icono":"icon icon-file-check","ruta":"./aprobaciones-os","activo":true,"orden":2}]},
     {"id":"reportes","label":"Reportes","icono":"icon icon-file-text","activo":true,"orden":3,
      "items":[{"id":"reportes-compras","nombre":"Reportes Compras","icono":"icon icon-pie-chart","ruta":"./reportes-compras","activo":true,"orden":1}]}
   ]';
   
   Y reemplazar @MENU_JSON_DEFAULT por @MENU_GERENTE en el INSERT del rol GERENTE.

4. JLOLOGIST tiene menú especial y NO se configura en esta tabla.
   Su menú está hardcodeado en el componente DynamicMenu.

5. Para agregar nuevos roles en el futuro, seguir el mismo patrón de 3 INSERTS.

6. Si un rol ya tiene configuración y quieres REEMPLAZARLA:
   - Descomentar la sección "LIMPIAR CONFIGURACIONES EXISTENTES" al inicio
   - Volver a ejecutar el script completo
*/
