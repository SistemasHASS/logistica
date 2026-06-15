# Nomenclatura y Guía de Configuración de Menús Dinámicos

## Claves de Configuración Oficiales

| Clave | Tipo | Descripción | Valores Permitidos | Ejemplo |
|-------|------|-------------|-------------------|---------|
| **MENU_TYPE** | string | Tipo de menú visual | `accordion`, `nav`, `list`, `default` | `accordion` |
| **MENU_JSON** | JSON | Estructura completa del menú | Array de grupos con items | Ver ejemplo abajo |
| **ITEMS_VISIBLES** | string | Filtrar items específicos | IDs separados por coma | `dashboard,requerimientos,compras` |
| **LAYOUT_ACCORDION** | flag | Activar modo accordion | `1` (activo), `0` (inactivo) | `1` |
| **LAYOUT_MENU_TYPE** | string | Tipo alternativo legacy | `nav`, `list` | `nav` |

## Estructura JSON del Menú (MENU_JSON)

```json
[
  {
    "id": "panel",
    "label": "Mi Panel",
    "icono": "bx bxs-dashboard",
    "activo": true,
    "orden": 1,
    "items": [
      {
        "id": "dashboard-jlologist",
        "nombre": "Dashboard Jef. Logística",
        "icono": "bx bx-line-chart",
        "ruta": "./dashboard-jlologist",
        "activo": true,
        "orden": 1
      }
    ]
  },
  {
    "id": "config",
    "label": "Configuración",
    "icono": "icon icon-equalizer",
    "activo": true,
    "orden": 2,
    "items": [
      {
        "id": "notificaciones",
        "nombre": "Notificaciones",
        "icono": "bx bx-bell",
        "ruta": "./notificaciones",
        "activo": true,
        "orden": 1
      }
    ]
  }
]
```

## Iconos Disponibles

- **Boxicons**: `bx bx-*` (ej: `bx bx-cart`, `bx bx-user`)
- **Simple Line Icons**: `icon icon-*` (ej: `icon icon-stack`, `icon icon-file-text`)

## Rutas Disponibles en el Sistema

| Ruta | Módulo |
|------|--------|
| `./dashboard-jlologist` | Dashboard Jefatura |
| `./dashboard-oplogist` | Dashboard Operativo |
| `./requerimientos` | Requerimientos |
| `./saldo-requerimiento` | Saldo de Requerimiento |
| `./solicitudes-compra` | Solicitudes de Compra |
| `./ordenes-compra` | Órdenes de Compra |
| `./consolidacion-compras` | Consolidación Compras |
| `./solicitudes-servicio` | Solicitudes de Servicio |
| `./ordenes-servicio` | Órdenes de Servicio |
| `./cotizaciones` | Cotizaciones |
| `./despachos` | Gestión de Despachos |
| `./recepcion-mercaderia` | Recepción de Mercadería |
| `./kardex` | Kardex e Inventario |
| `./aprobaciones-oc` | Aprobación OC |
| `./aprobaciones-os` | Aprobación OS |
| `./reportes-compras` | Reportes Avanzados |

## Script SQL para Crear Configuración Manual

### Configuración Mínima (solo tipo de menú)
```sql
-- Insertar tipo de menú accordion para rol ADLOGIST
INSERT INTO LOGISTICA_ConfiguracionPermiso 
  (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
  ('ADLOGIST', 'MENU_TYPE', 'accordion', 
   'Tipo de menú: accordion para Admin Logística', 
   'ADMIN', GETDATE());
```

### Configuración Completa (tipo + estructura JSON)
```sql
-- 1. Tipo de menú
INSERT INTO LOGISTICA_ConfiguracionPermiso 
  (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
  ('OPLOGIST', 'MENU_TYPE', 'accordion', 
   'Tipo de menú accordion para Operativo', 
   'ADMIN', GETDATE());

-- 2. JSON del menú (ejemplo: solo panel y requerimientos)
INSERT INTO LOGISTICA_ConfiguracionPermiso 
  (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
  ('OPLOGIST', 'MENU_JSON', 
   '[{"id":"panel","label":"Mi Panel","icono":"bx bxs-dashboard","activo":true,"orden":1,"items":[{"id":"dashboard","nombre":"Dashboard","icono":"bx bx-line-chart","ruta":"./dashboard-oplogist","activo":true,"orden":1}]},{"id":"requerimientos","label":"Requerimientos","icono":"icon icon-stack","activo":true,"orden":2,"items":[{"id":"req","nombre":"Requerimientos","icono":"icon icon-stack","ruta":"./requerimientos","activo":true,"orden":1},{"id":"saldo","nombre":"Saldo","icono":"icon icon-balance","ruta":"./saldo-requerimiento","activo":true,"orden":2}]}]',
   'Menú personalizado para Operativo - solo Panel y Requerimientos', 
   'ADMIN', GETDATE());

-- 3. Flag de accordion activo
INSERT INTO LOGISTICA_ConfiguracionPermiso 
  (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
  ('OPLOGIST', 'LAYOUT_ACCORDION', '1', 
   'Activar modo accordion', 
   'ADMIN', GETDATE());
```

### Configuración para Rol de Solo Lectura (solo reportes)
```sql
INSERT INTO LOGISTICA_ConfiguracionPermiso 
  (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
  ('FINANZAS', 'MENU_TYPE', 'accordion', 
   'Menú accordion para Finanzas', 'ADMIN', GETDATE()),
  ('FINANZAS', 'MENU_JSON', 
   '[{"id":"reportes","label":"Reportes","icono":"icon icon-file-text","activo":true,"orden":1,"items":[{"id":"rep-compras","nombre":"Reportes Compras","icono":"icon icon-pie-chart","ruta":"./reportes-compras","activo":true,"orden":1},{"id":"rep-req","nombre":"Reporte Requerimientos","icono":"icon icon-file-check","ruta":"./reporte-requerimientos","activo":true,"orden":2}]}]',
   'Menú solo reportes para Finanzas', 'ADMIN', GETDATE());
```

### Configuración con ITEMS_VISIBLES (filtrar items del menú default)
```sql
-- Usar menú default pero solo mostrar ciertos items
INSERT INTO LOGISTICA_ConfiguracionPermiso 
  (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
  ('GERENTE', 'MENU_TYPE', 'accordion', 
   'Tipo de menú accordion', 'ADMIN', GETDATE()),
  ('GERENTE', 'ITEMS_VISIBLES', 
   'dashboard-jlologist,aprobaciones-oc,aprobaciones-os,reportes-compras',
   'Solo mostrar Dashboard y Aprobaciones para Gerente', 
   'ADMIN', GETDATE());
```

## Notas Importantes

1. **idrol**: Debe coincidir exactamente con el rol en la tabla de usuarios
2. **Rol especial JLOLOGIST**: Este rol tiene menú hardcodeado y NO usa esta configuración
3. **Orden de prioridad**: Si existe `MENU_JSON`, se usa ese. Si no, se usa `ACCORDION_DEFAULT`.
4. **Activar/desactivar items**: Usar `"activo": false` en el JSON para ocultar items sin eliminarlos
5. **Submenús**: Los items pueden tener `submenu: [...]` con la misma estructura

## Verificar Configuración Existente

```sql
-- Listar todas las configuraciones de menú
SELECT idrol, clave, valor, descripcion, fechaCreacion
FROM LOGISTICA_ConfiguracionPermiso
WHERE clave LIKE 'MENU%' OR clave LIKE 'LAYOUT%'
ORDER BY idrol, clave;

-- Ver configuración específica de un rol
SELECT * FROM LOGISTICA_ConfiguracionPermiso
WHERE idrol = 'ADLOGIST' 
  AND (clave LIKE 'MENU%' OR clave LIKE 'LAYOUT%');
```

## Eliminar Configuración

```sql
-- Eliminar toda la configuración de un rol
DELETE FROM LOGISTICA_ConfiguracionPermiso
WHERE idrol = 'OPLOGIST' 
  AND (clave LIKE 'MENU%' OR clave LIKE 'LAYOUT%');
```
