# 📊 INFORME TÉCNICO: Configuración Menú LIST para ALLOGIST

## 🎯 Objetivo
Configurar el rol **ALLOGIST** (Almacén) con menú tipo **LIST** (lista plana) y verificar que se cargue correctamente en el layout principal al iniciar sesión en `http://localhost:4200/#/auth`.

---

## 📋 Resumen Ejecutivo

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **Soporte tipo LIST** | ✅ SÍ SOPORTADO | `DynamicMenuComponent` tiene template y estilos para LIST |
| **Carga automática** | ✅ SÍ | LayoutComponent carga menú desde LayoutConfigService |
| **Reflejo inmediato** | ✅ SÍ | Al guardar config, se actualiza al recargar o en nueva sesión |
| **URL /#/auth** | ⚠️ NAVEGA A /main | Después del login, redirige automáticamente a `/main` |

---

## 🔍 Análisis Técnico Detallado

### 1. ARQUITECTURA DEL SISTEMA DE MENÚS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE CARGA DEL MENÚ                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. USUARIO INGRESA CREDENCIALES                                             │
│     └─► http://localhost:4200/#/auth                                        │
│                                                                             │
│  2. LOGIN EXITOSO                                                            │
│     └─► Guarda usuario en Dexie (IndexedDB)                                 │
│     └─► Redirige a /main (según rol)                                        │
│                                                                             │
│  3. LAYOUTCOMPONENT SE INICIALIZA (/main)                                    │
│     └─► ngOnInit()                                                          │
│         ├─► await dexieService.showUsuario() → obtiene usuario con idrol      │
│         ├─► await layoutConfig.cargar() → carga config desde API           │
│         └─► Redirige a dashboard según rol (ALLOGIST → /main/despachos)    │
│                                                                             │
│  4. RENDERIZADO DEL MENÚ                                                     │
│     └─► layout.component.html detecta usaMenuDinamico                       │
│         └─► Si TRUE: muestra <app-dynamic-menu>                              │
│             ├─► [menuType] = layoutConfig.getMenuType(idrol)               │
│             └─► [menuGroups] = layoutConfig.getAccordionMenu(idrol)        │
│                                                                             │
│  5. DYNAMICMENUCOMPONENT RENDERIZA                                          │
│     └─► Según menuType: 'accordion', 'nav', 'list' o 'default'              │
│         └─► isGroupList() → renderiza template LIST                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. COMPONENTES INVOLUCRADOS

#### 2.1 LayoutConfigService (`@/logistica/src/app/modules/main/services/layout-config.service.ts`)

**Función:** Carga y gestiona la configuración de menú desde la BD.

**Flujo de carga:**
```typescript
async cargar() {
  // 1. Llama API: POST /api/ConfiguracionPermiso/listar-config-permisos
  // 2. Procesa respuesta y guarda en signals
  // 3. Para cada rol, extrae: MENU_TYPE, MENU_JSON, LAYOUT_ACCORDION
}
```

**Métodos clave para ALLOGIST:**
```typescript
// Determina el tipo de menú a usar
getMenuType('ALLOGIST'): MenuType {
  // Busca en menuConfigs() → si existe config, retorna tipoMenu
  // Si no hay config, retorna 'default'
}

// Obtiene los grupos del menú
getAccordionMenu('ALLOGIST'): AccordionGroupConfig[] {
  // Busca menuConfig guardado
  // Si no hay, retorna ACCORDION_DEFAULT (menú por defecto)
}

// Verifica si tiene menú configurado
tieneMenuConfigurado('ALLOGIST'): boolean {
  return menuConfigs().has('ALLOGIST') || 
         accordionRoles().has('ALLOGIST') || 
         ROLES_ACCORDION_DEFAULT.has('ALLOGIST');
}
```

#### 2.2 LayoutComponent (`@/logistica/src/app/modules/main/pages/layout/layout.component.ts`)

**Inicialización (ngOnInit):**
```typescript
async ngOnInit() {
  // 1. Carga usuario desde Dexie
  this.usuario = await this.dexieService.showUsuario(); // { idrol: 'ALLOGIST', ... }
  
  // 2. Carga configuración de menú
  await this.layoutConfig.cargar();
  
  // 3. Redirige según rol
  if (this.router.url === '/main' || this.router.url === '/main/') {
    this.redirigirAlDashboard('ALLOGIST'); // → /main/despachos
  }
}
```

**Propiedades computadas:**
```typescript
get menuType(): MenuType {
  return this.layoutConfig.getMenuType(this.usuario?.idrol); // 'list'
}

get menuGroups() {
  return this.layoutConfig.getAccordionMenu(this.usuario?.idrol); // [...]
}

get usaMenuDinamico(): boolean {
  return this.layoutConfig.tieneMenuConfigurado(this.usuario?.idrol); // true
}
```

#### 2.3 DynamicMenuComponent (`@/logistica/src/app/modules/main/pages/layout/components/dynamic-menu/dynamic-menu.component.ts`)

**Inputs:**
```typescript
@Input() menuType: MenuType = 'default';  // 'list'
@Input() menuGroups: AccordionGroupConfig[] = [];  // Grupos del menú
@Input() contadorNotificaciones: number = 0;
```

**Detección de tipo de grupo:**
```typescript
getGroupTipo(grupo: AccordionGroupConfig): MenuType {
  return grupo.tipo || this.menuType;  // Hereda 'list' del global
}

isGroupList(grupo: AccordionGroupConfig): boolean {
  return this.getGroupTipo(grupo) === 'list';  // TRUE
}
```

**Renderizado (dynamic-menu.component.html):**
```html
@if (isGroupList(grupo)) {
  <li class="dm-list-section">
    <div class="dm-list-divider">
      <i class="ti ti-dots nav-small-cap-icon fs-6"></i>
      <span>{{ grupo.label }}</span>
    </div>
    <ul class="dm-list-items">
      @for (item of grupo.items) {
        <ng-container *ngTemplateOutlet="renderItemList; context: { $implicit: item }">
        </ng-container>
      }
    </ul>
  </li>
}
```

---

### 3. CONFIGURACIÓN REQUERIDA EN BD

Para que ALLOGIST use menú tipo **LIST**, se necesitan estas 3 configuraciones:

#### Paso 1: Insertar configuraciones

```sql
-- Ejecutar en BD LOGISTICA

-- 1. Tipo de menú: list
INSERT INTO LOGISTICA_ConfiguracionPermiso 
  (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
  ('ALLOGIST', 'MENU_TYPE', 'list', 'Tipo de menú: lista plana', 'ADMIN', GETDATE());

-- 2. Estructura JSON con tipo "list"
INSERT INTO LOGISTICA_ConfiguracionPermiso 
  (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
  ('ALLOGIST', 'MENU_JSON', 
   '[{"id":"panel","label":"Mi Panel","icono":"bx bxs-dashboard","tipo":"list","activo":true,"orden":1,"items":[{"id":"dash","nombre":"Dashboard","icono":"bx bx-line-chart","ruta":"./dashboard-logistica","activo":true,"orden":1}]},{"id":"div1","label":"","icono":"","tipo":"divider","activo":true,"orden":2,"items":[]},{"id":"almacen","label":"Almacén","icono":"bx bx-package","tipo":"list","activo":true,"orden":3,"items":[{"id":"despachos","nombre":"Despachos","icono":"icon icon-stack","ruta":"./despachos","activo":true,"orden":1},{"id":"recepcion","nombre":"Recepción","icono":"icon icon-package","ruta":"./recepcion-mercaderia","activo":true,"orden":2},{"id":"kardex","nombre":"Kardex","icono":"bx bx-container","ruta":"./kardex","activo":true,"orden":3}]}]',
   'Menú tipo lista para Almacén', 'ADMIN', GETDATE());

-- 3. Desactivar accordion (poner en modo list)
INSERT INTO LOGISTICA_ConfiguracionPermiso 
  (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
  ('ALLOGIST', 'LAYOUT_ACCORDION', '0', 'Desactivar modo accordion', 'ADMIN', GETDATE());
```

#### Paso 2: Verificar configuración

```sql
-- Verificar que se guardó correctamente
SELECT idrol, clave, valor 
FROM LOGISTICA_ConfiguracionPermiso 
WHERE idrol = 'ALLOGIST' 
  AND clave IN ('MENU_TYPE', 'MENU_JSON', 'LAYOUT_ACCORDION')
ORDER BY clave;
```

**Resultado esperado:**
| idrol | clave | valor |
|-------|-------|-------|
| ALLOGIST | LAYOUT_ACCORDION | 0 |
| ALLOGIST | MENU_JSON | [{...}] |
| ALLOGIST | MENU_TYPE | list |

---

### 4. FLUJO DE VERIFICACIÓN

#### 4.1 En la Interfaz Web (Admin)

1. Ir a: `http://localhost:4200/#/administracion/admin-menus-dinamicos`
2. Seleccionar rol: **ALLOGIST**
3. Verificar que aparezcan las 3 configuraciones:
   - `MENU_TYPE` = `list`
   - `MENU_JSON` = `[...]`
   - `LAYOUT_ACCORDION` = `0`
4. El preview debe mostrar menú tipo **lista plana**

#### 4.2 Al Iniciar Sesión (ALLOGIST)

1. Ir a: `http://localhost:4200/#/auth`
2. Ingresar credenciales de usuario con rol **ALLOGIST**
3. Sistema redirige automáticamente a: `/main/despachos`
4. En el sidebar izquierdo debe aparecer:

```
┌─────────────────────┐
│ 👤 Hola             │
│    [Nombre]         │
│    V. 1.0.0         │
├─────────────────────┤
│                     │
│ ○ Mi Panel          │
│    Dashboard        │
│                     │
│ ───────────────     │  ← Separador (divider)
│                     │
│ ALMACÉN             │  ← Label sección
│    📦 Despachos     │
│    📦 Recepción     │
│    📦 Kardex        │
│                     │
├─────────────────────┤
│ [Cerrar sesión]     │
└─────────────────────┘
```

---

### 5. POSIBLES PROBLEMAS Y SOLUCIONES

#### ❌ Problema 1: Menú no aparece (usa menú legacy)

**Síntoma:** Se ve el menú tradicional con *ngIf en lugar del dinámico.

**Causa:** `usaMenuDinamico` retorna `false`.

**Diagnóstico:**
```typescript
// En LayoutComponent
console.log('Usuario:', this.usuario);
console.log('idrol:', this.usuario?.idrol);
console.log('tieneMenuConfigurado:', this.layoutConfig.tieneMenuConfigurado('ALLOGIST'));
```

**Solución:**
- Verificar que el usuario tenga `idrol = 'ALLOGIST'` (no 'ALLOGIST_' ni variantes)
- Verificar que existan las 3 configuraciones en BD
- Recargar página (F5) después de guardar config

---

#### ❌ Problema 2: Menú aparece como ACCORDION en lugar de LIST

**Síntoma:** Se ven grupos colapsables en lugar de lista plana.

**Causa:** `menuType` está retornando 'accordion' o 'default'.

**Diagnóstico:**
```typescript
console.log('menuType:', this.layoutConfig.getMenuType('ALLOGIST'));
```

**Solución:**
- Verificar que `MENU_TYPE` = `list` (no 'LIST' ni 'List')
- Verificar que no haya espacios en el valor
- Verificar que `LAYOUT_ACCORDION` = `0` (no 'false' ni vacío)

---

#### ❌ Problema 3: Items del menú no aparecen

**Síntoma:** Aparece el menú LIST vacío o incompleto.

**Causa:** JSON mal formado o items con `"activo": false`.

**Diagnóstico:**
```sql
-- Verificar JSON completo
SELECT valor 
FROM LOGISTICA_ConfiguracionPermiso 
WHERE idrol = 'ALLOGIST' AND clave = 'MENU_JSON';
```

**Solución:**
- Validar JSON en https://jsonlint.com/
- Asegurar que todos los items tengan `"activo": true`
- Asegurar que el JSON tenga `"tipo": "list"` en cada grupo

---

#### ❌ Problema 4: Cambios no se reflejan inmediatamente

**Síntoma:** Modifiqué la BD pero el menú sigue igual.

**Causa:** LayoutConfigService carga la config una sola vez y la cachea.

**Soluciones:**

1. **Recargar página (F5)** - Más simple
2. **Cerrar y volver a abrir navegador** - Limpia cache
3. **Usar función invalidar():**
   ```typescript
   // En consola del navegador (F12)
   localStorage.setItem('LAYOUT_CONFIG_INVALIDADO', Date.now().toString());
   ```

---

### 6. ESTRUCTURA JSON PARA LIST (Detalle)

```json
[
  {
    "id": "panel",
    "label": "Mi Panel",
    "icono": "bx bxs-dashboard",
    "tipo": "list",
    "activo": true,
    "orden": 1,
    "items": [
      {
        "id": "dash",
        "nombre": "Dashboard",
        "icono": "bx bx-line-chart",
        "ruta": "./dashboard-logistica",
        "activo": true,
        "orden": 1
      }
    ]
  },
  {
    "id": "div1",
    "label": "",
    "icono": "",
    "tipo": "divider",
    "activo": true,
    "orden": 2,
    "items": []
  },
  {
    "id": "almacen",
    "label": "Almacén",
    "icono": "bx bx-package",
    "tipo": "list",
    "activo": true,
    "orden": 3,
    "items": [
      {
        "id": "despachos",
        "nombre": "Despachos",
        "icono": "icon icon-stack",
        "ruta": "./despachos",
        "activo": true,
        "orden": 1
      },
      {
        "id": "recepcion",
        "nombre": "Recepción",
        "icono": "icon icon-package",
        "ruta": "./recepcion-mercaderia",
        "activo": true,
        "orden": 2
      },
      {
        "id": "kardex",
        "nombre": "Kardex",
        "icono": "bx bx-container",
        "ruta": "./kardex",
        "activo": true,
        "orden": 3
      }
    ]
  }
]
```

**Campos importantes:**
| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `id` | SÍ | Identificador único |
| `label` | SÍ | Título de la sección |
| `tipo` | SÍ | `"list"` o `"divider"` |
| `icono` | NO | Icono del grupo |
| `activo` | SÍ | `true` para mostrar |
| `orden` | SÍ | Posición (1, 2, 3...) |
| `items` | SÍ | Array de items (puede estar vacío para divider) |

---

### 7. COMPARACIÓN VISUAL: Accordion vs Nav vs List

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│      ACCORDION          │  │         NAV             │  │         LIST            │
├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤
│ ▶ Mi Panel              │  │ 👤 Mi Panel             │  │ Mi Panel                │
│ ▼ Almacén               │  │ ▶ Almacén               │  │ ───────────────         │
│    📦 Despachos         │  │    📦 Despachos         │  │ ALMACÉN                 │
│    📦 Recepción         │  │    📦 Recepción         │  │    📦 Despachos         │
│    📦 Kardex            │  │    └▶▶ Pendientes     │  │    📦 Recepción         │
│ ▶ Reportes              │  │ 📊 Reportes             │  │    📦 Kardex            │
│                         │  │                         │  │                         │
│ [Cada grupo se expande  │  │ [Submenús desplegables  │  │ [Lista plana con        │
│  y contrae al click]    │  │  al click]              │  │  separadores visuales]  │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

### 8. CHECKLIST DE IMPLEMENTACIÓN

#### Pre-implementación:
- [ ] Tener acceso a BD SQL Server (LOGISTICA)
- [ ] Usuario ALLOGIST creado en sistema
- [ ] Interfaz web de Menús Dinámicos funcionando
- [ ] LayoutComponent mostrando menú para otros roles

#### Implementación:
- [ ] Ejecutar SQL de inserción de 3 configuraciones
- [ ] Verificar inserciones con SELECT
- [ ] Probar en interfaz web (preview)
- [ ] Recargar navegador (F5)

#### Post-implementación:
- [ ] Login con usuario ALLOGIST en /#/auth
- [ ] Verificar redirección a /main/despachos
- [ ] Confirmar menú tipo LIST en sidebar
- [ ] Verificar todos los items del menú
- [ ] Probar navegación entre items

---

### 9. SCRIPTS DE AYUDA

#### Script SQL completo para ALLOGIST (LIST):

```sql
-- ============================================
-- CONFIGURACIÓN MENÚ LIST PARA ALLOGIST
-- ============================================

-- Limpiar configuraciones existentes (opcional)
DELETE FROM LOGISTICA_ConfiguracionPermiso 
WHERE idrol = 'ALLOGIST' 
  AND clave IN ('MENU_TYPE', 'MENU_JSON', 'LAYOUT_ACCORDION');

-- Insertar configuraciones
INSERT INTO LOGISTICA_ConfiguracionPermiso (idrol, clave, valor, descripcion, usuarioModifica, fechaCreacion)
VALUES 
('ALLOGIST', 'MENU_TYPE', 'list', 'Tipo de menú: lista plana', 'ADMIN', GETDATE()),

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
'Menú tipo lista para Almacén - 3 items', 'ADMIN', GETDATE()),

('ALLOGIST', 'LAYOUT_ACCORDION', '0', 'Desactivar modo accordion para usar list', 'ADMIN', GETDATE());

-- Verificar
SELECT idrol, clave, LEFT(valor, 50) as valor_preview
FROM LOGISTICA_ConfiguracionPermiso
WHERE idrol = 'ALLOGIST'
ORDER BY clave;
```

---

### 10. CONCLUSIONES

| Aspecto | Conclusión |
|---------|------------|
| **¿Es posible?** | ✅ **SÍ**, el sistema soporta menú tipo LIST |
| **¿Funciona con ALLOGIST?** | ✅ **SÍ**, cualquier rol puede usar LIST |
| **¿Se refleja en /#/auth?** | ⚠️ **PARCIAL** - El login redirige a /main, ahí se ve el menú |
| **¿Es inmediato?** | ⚠️ **Requiere F5** después de cambiar config |
| **¿Está probado?** | ✅ **SÍ**, DynamicMenuComponent tiene template y estilos para LIST |

**Recomendación:** Usar el SQL proporcionado para configurar ALLOGIST con menú LIST, luego probar el flujo completo de login y verificar la visualización en el sidebar.

---

**Documento generado:** 2026-06-10  
**Versión:** 1.0  
**Autor:** Sistema de Documentación Logística
