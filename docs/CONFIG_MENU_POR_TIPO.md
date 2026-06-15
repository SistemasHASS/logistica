# Configuración de Menú por Tipo (Accordion, Nav, List)

## Resumen de Configuración por Tipo

| Tipo | Clave | Valor | Descripción |
|------|-------|-------|-------------|
| **Accordion** | `MENU_TYPE` | `accordion` | Menú colapsable por grupos |
| **Nav** | `MENU_TYPE` | `nav` | Menú vertical con submenús |
| **List** | `MENU_TYPE` | `list` | Lista plana simple |

---

## 1. TIPO: ACCORDION (Grupos Colapsables)

### Configuración en BD

```sql
-- Configuración mínima para menú accordion
INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('OPLOGIST', 'MENU_TYPE', 'accordion', 'Tipo de menú: accordion', 'ADMIN', GETDATE()),
('OPLOGIST', 'LAYOUT_ACCORDION', '1', 'Activar modo accordion', 'ADMIN', GETDATE()),
('OPLOGIST', 'MENU_JSON', '[
  {
    "id": "panel",
    "label": "Mi Panel",
    "icono": "bx bxs-dashboard",
    "activo": true,
    "orden": 1,
    "items": [
      {"id": "dashboard", "nombre": "Dashboard", "icono": "bx bx-line-chart", "ruta": "./dashboard", "activo": true, "orden": 1}
    ]
  },
  {
    "id": "requerimientos",
    "label": "Requerimientos",
    "icono": "icon icon-stack",
    "activo": true,
    "orden": 2,
    "items": [
      {"id": "req", "nombre": "Requerimientos", "icono": "icon icon-stack", "ruta": "./requerimientos", "activo": true, "orden": 1},
      {"id": "saldo", "nombre": "Saldo", "icono": "icon icon-balance", "ruta": "./saldo-requerimiento", "activo": true, "orden": 2}
    ]
  }
]', 'Menú accordion con 2 grupos', 'ADMIN', GETDATE());
```

### Estructura JSON Accordion

```json
[
  {
    "id": "string",           // ID único del grupo
    "label": "string",        // Título visible del grupo
    "icono": "string",        // Icono (ej: "bx bx-cart")
    "activo": true,           // ¿Visible? true/false
    "orden": 1,               // Posición (1, 2, 3...)
    "items": [                // Items dentro del grupo
      {
        "id": "string",       // ID único del item
        "nombre": "string",   // Texto visible
        "icono": "string",    // Icono del item
        "ruta": "./ruta",     // Ruta Angular (ej: "./requerimientos")
        "activo": true,       // ¿Visible? true/false
        "orden": 1            // Posición dentro del grupo
      }
    ]
  }
]
```

### Características
- ✅ Grupos colapsables (click para expandir/contraer)
- ✅ Items organizados por categorías
- ✅ Iconos en grupo y en cada item
- ✅ Ideal para muchas opciones

---

## 2. TIPO: NAV (Menú Vertical con Submenús)

### Configuración en BD

```sql
-- Configuración para menú tipo NAV
INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('OPLOGIST', 'MENU_TYPE', 'nav', 'Tipo de menú: nav (vertical)', 'ADMIN', GETDATE()),
('OPLOGIST', 'LAYOUT_ACCORDION', '0', 'No usar accordion', 'ADMIN', GETDATE()),
('OPLOGIST', 'MENU_JSON', '[
  {
    "id": "dashboard",
    "label": "Dashboard",
    "icono": "bx bxs-dashboard",
    "activo": true,
    "orden": 1,
    "tipo": "nav",
    "items": [
      {"id": "dash1", "nombre": "Dashboard Principal", "icono": "bx bx-line-chart", "ruta": "./dashboard", "activo": true, "orden": 1}
    ]
  },
  {
    "id": "operaciones",
    "label": "Operaciones",
    "icono": "bx bx-briefcase",
    "activo": true,
    "orden": 2,
    "tipo": "nav",
    "items": [
      {"id": "req", "nombre": "Requerimientos", "icono": "icon icon-stack", "ruta": "./requerimientos", "activo": true, "orden": 1},
      {"id": "saldo", "nombre": "Saldo", "icono": "icon icon-balance", "ruta": "./saldo-requerimiento", "activo": true, "orden": 2, 
        "submenu": [
          {"id": "saldo-pendiente", "nombre": "Saldo Pendiente", "ruta": "./saldo-requerimiento/pendiente", "activo": true},
          {"id": "saldo-historico", "nombre": "Histórico", "ruta": "./saldo-requerimiento/historico", "activo": true}
        ]
      }
    ]
  }
]', 'Menú nav vertical con submenús', 'ADMIN', GETDATE());
```

### Estructura JSON Nav

```json
[
  {
    "id": "string",           // ID del grupo/nav
    "label": "string",        // Título
    "icono": "string",        // Icono principal
    "activo": true,
    "orden": 1,
    "tipo": "nav",           // Especificar tipo nav
    "items": [
      {
        "id": "string",
        "nombre": "string",
        "icono": "string",
        "ruta": "./ruta",
        "activo": true,
        "orden": 1,
        "submenu": [           // Opcional: submenú anidado
          {
            "id": "string",
            "nombre": "string",
            "ruta": "./sub-ruta",
            "activo": true
          }
        ]
      }
    ]
  }
]
```

### Características
- ✅ Menú vertical estilo sidebar
- ✅ Submenús desplegables
- ✅ Más compacto que accordion
- ✅ Ideal para navegación rápida

---

## 3. TIPO: LIST (Lista Plana)

### Configuración en BD

```sql
-- Configuración para menú tipo LIST
INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('OPLOGIST', 'MENU_TYPE', 'list', 'Tipo de menú: list (lista plana)', 'ADMIN', GETDATE()),
('OPLOGIST', 'LAYOUT_ACCORDION', '0', 'No usar accordion', 'ADMIN', GETDATE()),
('OPLOGIST', 'MENU_JSON', '[
  {
    "id": "dashboard",
    "label": "Dashboard",
    "icono": "bx bxs-dashboard",
    "activo": true,
    "orden": 1,
    "tipo": "list",
    "items": [
      {"id": "dash", "nombre": "Dashboard", "icono": "bx bx-line-chart", "ruta": "./dashboard", "activo": true, "orden": 1}
    ]
  },
  {
    "id": "separador1",
    "label": "",
    "icono": "",
    "activo": true,
    "orden": 2,
    "tipo": "divider",       // Tipo divider = separador
    "items": []
  },
  {
    "id": "requerimientos",
    "label": "Requerimientos",
    "icono": "icon icon-stack",
    "activo": true,
    "orden": 3,
    "tipo": "list",
    "items": [
      {"id": "req", "nombre": "Requerimientos", "icono": "icon icon-stack", "ruta": "./requerimientos", "activo": true, "orden": 1},
      {"id": "saldo", "nombre": "Saldo", "icono": "icon icon-balance", "ruta": "./saldo-requerimiento", "activo": true, "orden": 2}
    ]
  }
]', 'Menú lista plana con separadores', 'ADMIN', GETDATE());
```

### Estructura JSON List

```json
[
  {
    "id": "string",
    "label": "string",        // Título de sección (opcional)
    "icono": "string",
    "activo": true,
    "orden": 1,
    "tipo": "list",          // Tipo list
    "items": [
      {
        "id": "string",
        "nombre": "string",    // Texto del link
        "icono": "string",
        "ruta": "./ruta",
        "activo": true,
        "orden": 1
      }
    ]
  },
  {
    "id": "separador",
    "label": "",
    "tipo": "divider",         // Separador visual
    "activo": true,
    "orden": 2,
    "items": []
  }
]
```

### Características
- ✅ Lista simple sin grupos colapsables
- ✅ Separadores visuales (tipo "divider")
- ✅ Más limpio y minimalista
- ✅ Ideal para pocos items

---

## Comparación Visual

```
┌─────────────────────────────────────────────────────────────────┐
│  ACCORDION (Grupos colapsables)                                  │
├─────────────────────────────────────────────────────────────────┤
│  ▶ Mi Panel                                                      │
│  ▼ Requerimientos        ← Expandido                             │
│    ├─ Requerimientos                                             │
│    └─ Saldo                                                      │
│  ▶ Compras                                                       │
│  ▶ Almacén                                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  NAV (Vertical con submenús)                                     │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard                                                       │
│  Operaciones ▼                                                   │
│    ├─ Requerimientos                                             │
│    └─ Saldo ▶                                                    │
│        ├─ Saldo Pendiente                                        │
│        └─ Histórico                                              │
│  Compras                                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LIST (Lista plana)                                              │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard                                                       │
│  ───────────────  ← Separador                                    │
│  Requerimientos                                                │
│  Saldo                                                           │
│  ───────────────                                                 │
│  Compras                                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ejemplos Completos por Tipo

### Accordion - Admin Completo (7 grupos)

```json
[
  {"id": "panel", "label": "Mi Panel", "icono": "bx bxs-dashboard", "activo": true, "orden": 1, "items": [
    {"id": "dash1", "nombre": "Dashboard Jef. Logística", "icono": "bx bx-line-chart", "ruta": "./dashboard-jlologist", "activo": true, "orden": 1},
    {"id": "dash2", "nombre": "Mi Dashboard", "icono": "bx bx-user-check", "ruta": "./dashboard-oplogist", "activo": true, "orden": 2},
    {"id": "dash3", "nombre": "Dashboard Logística", "icono": "bx bx-bar-chart-alt-2", "ruta": "./dashboard-logistica", "activo": true, "orden": 3}
  ]},
  {"id": "config", "label": "Configuración", "icono": "icon icon-equalizer", "activo": true, "orden": 2, "items": [
    {"id": "notif", "nombre": "Notificaciones", "icono": "bx bx-bell", "ruta": "./notificaciones", "activo": true, "orden": 1}
  ]},
  {"id": "req", "label": "Requerimientos", "icono": "icon icon-stack", "activo": true, "orden": 3, "items": [
    {"id": "req1", "nombre": "Requerimientos", "icono": "icon icon-stack", "ruta": "./requerimientos", "activo": true, "orden": 1},
    {"id": "saldo", "nombre": "Saldo de Requerimiento", "icono": "icon icon-balance", "ruta": "./saldo-requerimiento", "activo": true, "orden": 2}
  ]},
  {"id": "compras", "label": "Compras & Órdenes", "icono": "bx bx-cart", "activo": true, "orden": 4, "items": [
    {"id": "sc", "nombre": "Solicitudes de Compra", "icono": "bx bx-shopping-bag", "ruta": "./solicitudes-compra", "activo": true, "orden": 1},
    {"id": "oc", "nombre": "Órdenes de Compra", "icono": "icon icon-file-text", "ruta": "./ordenes-compra", "activo": true, "orden": 2},
    {"id": "consol", "nombre": "Consolidación Compras", "icono": "bx bx-cart", "ruta": "./consolidacion-compras", "activo": true, "orden": 3},
    {"id": "ss", "nombre": "Solicitudes de Servicio", "icono": "bx bx-briefcase", "ruta": "./solicitudes-servicio", "activo": true, "orden": 4},
    {"id": "os", "nombre": "Órdenes de Servicio", "icono": "bx bx-wrench", "ruta": "./ordenes-servicio", "activo": true, "orden": 5},
    {"id": "cot", "nombre": "Cotizaciones", "icono": "icon icon-calculator", "ruta": "./cotizaciones", "activo": true, "orden": 6}
  ]},
  {"id": "almacen", "label": "Almacén & Stock", "icono": "bx bx-package", "activo": true, "orden": 5, "items": [
    {"id": "desp", "nombre": "Gestión de Despachos", "icono": "icon icon-stack", "ruta": "./despachos", "activo": true, "orden": 1},
    {"id": "recep", "nombre": "Recepción de Mercadería", "icono": "icon icon-package", "ruta": "./recepcion-mercaderia", "activo": true, "orden": 2},
    {"id": "kardex", "nombre": "Kardex e Inventario", "icono": "bx bx-container", "ruta": "./kardex", "activo": true, "orden": 3}
  ]},
  {"id": "apro", "label": "Aprobaciones", "icono": "icon icon-file-check", "activo": true, "orden": 6, "items": [
    {"id": "aproc", "nombre": "Aprobación OC", "icono": "icon icon-file-check", "ruta": "./aprobaciones-oc", "activo": true, "orden": 1},
    {"id": "apros", "nombre": "Aprobación OS", "icono": "icon icon-file-check", "ruta": "./aprobaciones-os", "activo": true, "orden": 2}
  ]},
  {"id": "rep", "label": "Reportes", "icono": "icon icon-file-text", "activo": true, "orden": 7, "items": [
    {"id": "rep1", "nombre": "Reportes Avanzados", "icono": "icon icon-pie-chart", "ruta": "./reportes-compras", "activo": true, "orden": 1},
    {"id": "rep2", "nombre": "Reporte Requerimientos", "icono": "icon icon-file-check", "ruta": "./reporte-requerimientos", "activo": true, "orden": 2},
    {"id": "rep3", "nombre": "Reporte de Despachos", "icono": "icon icon-file-text", "ruta": "./reporte-despachos", "activo": true, "orden": 3}
  ]}
]
```

### Nav - Operativo Simple (2 secciones)

```json
[
  {"id": "panel", "label": "Mi Panel", "icono": "bx bxs-dashboard", "activo": true, "orden": 1, "tipo": "nav", "items": [
    {"id": "dash", "nombre": "Dashboard", "icono": "bx bx-user-check", "ruta": "./dashboard-oplogist", "activo": true, "orden": 1}
  ]},
  {"id": "req", "label": "Requerimientos", "icono": "icon icon-stack", "activo": true, "orden": 2, "tipo": "nav", "items": [
    {"id": "req1", "nombre": "Requerimientos", "icono": "icon icon-stack", "ruta": "./requerimientos", "activo": true, "orden": 1},
    {"id": "saldo", "nombre": "Saldo", "icono": "icon icon-balance", "ruta": "./saldo-requerimiento", "activo": true, "orden": 2}
  ]}
]
```

### List - Minimalista (solo 3 items)

```json
[
  {"id": "inicio", "label": "Inicio", "icono": "bx bxs-dashboard", "activo": true, "orden": 1, "tipo": "list", "items": [
    {"id": "dash", "nombre": "Dashboard", "icono": "bx bx-line-chart", "ruta": "./dashboard", "activo": true, "orden": 1}
  ]},
  {"id": "div1", "label": "", "icono": "", "activo": true, "orden": 2, "tipo": "divider", "items": []},
  {"id": "ops", "label": "Operaciones", "icono": "bx bx-briefcase", "activo": true, "orden": 3, "tipo": "list", "items": [
    {"id": "req", "nombre": "Requerimientos", "icono": "icon icon-stack", "ruta": "./requerimientos", "activo": true, "orden": 1}
  ]}
]
```

---

## Script SQL Completo por Tipo

### Para crear menú Accordion:
```sql
INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion) VALUES 
('ADLOGIST','MENU_TYPE','accordion','Tipo menú accordion','ADMIN',GETDATE()),
('ADLOGIST','LAYOUT_ACCORDION','1','Activar accordion','ADMIN',GETDATE()),
('ADLOGIST','MENU_JSON','[... JSON ...]','Menú accordion completo','ADMIN',GETDATE());
```

### Para crear menú Nav:
```sql
INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion) VALUES 
('OPLOGIST','MENU_TYPE','nav','Tipo menú nav vertical','ADMIN',GETDATE()),
('OPLOGIST','LAYOUT_ACCORDION','0','No usar accordion','ADMIN',GETDATE()),
('OPLOGIST','MENU_JSON','[... JSON con "tipo":"nav" ...]','Menú nav','ADMIN',GETDATE());
```

### Para crear menú List:
```sql
INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion) VALUES 
('ALLOGIST','MENU_TYPE','list','Tipo menú list plana','ADMIN',GETDATE()),
('ALLOGIST','LAYOUT_ACCORDION','0','No usar accordion','ADMIN',GETDATE()),
('ALLOGIST','MENU_JSON','[... JSON con "tipo":"list" y "divider" ...]','Menú lista','ADMIN',GETDATE());
```

---

## Notas Importantes

1. **Siempre incluir** `MENU_TYPE` - es la clave principal que determina el renderizado
2. **LAYOUT_ACCORDION** debe ser `1` para accordion, `0` para otros tipos
3. **En el JSON**, el campo `"tipo"` dentro de cada grupo ayuda al componente a renderizar correctamente
4. **Orden**: El campo `"orden"` determina la posición (1 = primero, 2 = segundo, etc.)
5. **Rutas**: Las rutas deben coincidir con las definidas en `app.routes.ts`
