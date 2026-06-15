-- ============================================
-- FIX COMPLETO PARA MENÚ ALLOGIST TIPO LIST
-- ============================================
-- Este script sincroniza ambos sistemas (Admin y Layout)
-- para que ALLOGIST funcione con menú tipo LIST

-- PASO 1: Limpiar configuraciones anteriores (todos los sistemas)
DELETE FROM LOGISTICA_ConfiguracionPermiso 
WHERE idrol = 'ALLOGIST' 
  AND clave IN ('MENU_TYPE', 'MENU_JSON', 'LAYOUT_ACCORDION', 'LAYOUT_MENU_TYPE', 'ACCORDION_MENU_CONFIG');

-- PASO 2: Insertar configuraciones para LAYOUT CONFIG SERVICE (Sistema que carga el menú)
-- Estas son las que realmente usa el LayoutConfigService para renderizar el menú
INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion, activo)
VALUES 
-- Tipo de menú
('ALLOGIST', 'LAYOUT_MENU_TYPE', 'list', 'Tipo de menú: lista plana', 'ADMIN', GETDATE(), 1),

-- JSON del menú (estructura completa)
('ALLOGIST', 'ACCORDION_MENU_CONFIG', 
'[
  {"id":"panel","label":"Mi Panel","icono":"bx bxs-dashboard","tipo":"list","activo":true,"orden":1,
   "items":[{"id":"dash","nombre":"Dashboard","icono":"bx bx-line-chart","ruta":"./dashboard-logistica","activo":true,"orden":1}]},
  {"id":"div1","label":"","icono":"","tipo":"divider","activo":true,"orden":2,"items":[]},
  {"id":"almacen","label":"Almacén","icono":"bx bx-package","tipo":"list","activo":true,"orden":3,
   "items":[
     {"id":"despachos","nombre":"Despachos","icono":"icon icon-stack","ruta":"./despachos","activo":true,"orden":1},
     {"id":"recepcion","nombre":"Recepción","icono":"icon icon-package","ruta":"./recepcion-mercaderia","activo":true,"orden":2},
     {"id":"kardex","nombre":"Kardex","icono":"bx bx-container","ruta":"./kardex","activo":true,"orden":3}
   ]}
]',
'Configuración menú JSON para ALLOGIST', 'ADMIN', GETDATE(), 1),

-- Flag accordion desactivado
('ALLOGIST', 'LAYOUT_ACCORDION', '0', 'Modo accordion desactivado', 'ADMIN', GETDATE(), 1);

-- PASO 3: Insertar configuraciones para ADMIN MENÚS DINÁMICOS (Interfaz de admin)
-- Estas permiten que el admin vea y edite la configuración en la UI
INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion, activo)
VALUES 
('ALLOGIST', 'MENU_TYPE', 'list', 'Tipo menú (legacy admin)', 'ADMIN', GETDATE(), 1),

('ALLOGIST', 'MENU_JSON', 
'[
  {"id":"panel","label":"Mi Panel","icono":"bx bxs-dashboard","tipo":"list","activo":true,"orden":1,
   "items":[{"id":"dash","nombre":"Dashboard","icono":"bx bx-line-chart","ruta":"./dashboard-logistica","activo":true,"orden":1}]},
  {"id":"div1","label":"","icono":"","tipo":"divider","activo":true,"orden":2,"items":[]},
  {"id":"almacen","label":"Almacén","icono":"bx bx-package","tipo":"list","activo":true,"orden":3,
   "items":[
     {"id":"despachos","nombre":"Despachos","icono":"icon icon-stack","ruta":"./despachos","activo":true,"orden":1},
     {"id":"recepcion","nombre":"Recepción","icono":"icon icon-package","ruta":"./recepcion-mercaderia","activo":true,"orden":2},
     {"id":"kardex","nombre":"Kardex","icono":"bx bx-container","ruta":"./kardex","activo":true,"orden":3}
   ]}
]',
'JSON menú (legacy admin)', 'ADMIN', GETDATE(), 1),

('ALLOGIST', 'LAYOUT_ACCORDION', '0', 'Flag accordion (legacy admin)', 'ADMIN', GETDATE(), 1);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
SELECT 
    idrol,
    clave,
    CASE 
        WHEN LEN(valor) > 50 THEN LEFT(valor, 50) + '...'
        ELSE valor
    END as valor_preview,
    descripcion,
    activo,
    fechaCreacion
FROM LOGISTICA_ConfiguracionPermiso
WHERE idrol = 'ALLOGIST'
ORDER BY 
    CASE clave
        WHEN 'LAYOUT_MENU_TYPE' THEN 1
        WHEN 'LAYOUT_ACCORDION' THEN 2
        WHEN 'ACCORDION_MENU_CONFIG' THEN 3
        WHEN 'MENU_TYPE' THEN 4
        WHEN 'MENU_JSON' THEN 5
        ELSE 6
    END;
