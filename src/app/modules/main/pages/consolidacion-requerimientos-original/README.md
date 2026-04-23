# Módulo de Consolidación de Requerimientos

## Descripción General

El módulo de **Consolidación de Requerimientos** permite agrupar múltiples requerimientos de compra y consumo en un único requerimiento consolidado, optimizando el proceso de adquisición y gestión de compras.

## Características Principales

### ✅ REQ1: Origen Múltiple de Requerimientos
- Consolida requerimientos de **Compras**
- Consolida requerimientos de **Consumo** con saldo pendiente (cantidad - cantidad_atendida)
- Los requerimientos de consumo son enviados por Almacén General

### ✅ REQ2: Validación de Requerimientos Elegibles
El sistema valida automáticamente que:
- El requerimiento esté **aprobado**
- No esté **cerrado**
- No esté ya **consolidado** total o parcialmente
- En consumo, el **saldo > 0**

### ✅ REQ3: Cálculo Automático de Saldo en Consumo
Para requerimientos de consumo:
- Calcula automáticamente: `saldo = cantidad - cantidad_atendida`
- Usa el saldo como cantidad base para consolidación

### ✅ REQ4: Generación de Requerimiento Consolidado
Genera un Requerimiento Consolidado de Compra con:
- Número único: `no_reqconsolcompra`
- Compañía: `no_cia`
- Estados: **Borrador**, **Consolidado**, **Anulado**

### ✅ REQ5: Consolidación por Ítem
Permite consolidar:
- Múltiples líneas de requerimientos
- Del mismo ítem
- Sumando las cantidades/saldos automáticamente

### ✅ REQ6: Registro del Detalle Consolidado
Registra en `DetalleRequerimientoConsolidado`:
- Ítem consolidado
- Cantidad total requerida
- Línea consolidada (`no_linea`)
- Relación con la compañía

### ✅ REQ7: Trazabilidad de Origen
Mantiene trazabilidad completa mediante `ReqConsolidado`:
- Requerimiento original (compra o consumo)
- Línea original
- Requerimiento consolidado
- Línea consolidada

### ✅ REQ8: Relación Uno a Muchos
- Una línea consolidada agrupa **muchas líneas origen**
- Una línea origen solo pertenece a **una consolidación activa**

### ✅ REQ9: Control de Cantidades Consolidadas
Valida que:
- La cantidad consolidada **no supere** la cantidad/saldo del origen
- Las cantidades sean mayores a 0

### ✅ REQ11: Generación Automática de Solicitud de Cotización
- Genera automáticamente la **Solicitud de Cotización**
- Basada en el Requerimiento Consolidado
- Considera: precio, tiempo de entrega, crédito o forma de pago
- Un ítem puede dividirse entre varios proveedores

### ✅ REQ12: Relación Directa Consolidado → Cotización
Cada línea de `SolicitudCotizacion`:
- Referencia obligatoriamente la línea consolidada
- Mantiene ítem y cantidad consolidada exacta

### ✅ REQ14: Auditoría del Sistema
Registra automáticamente:
- Fecha y hora de consolidación
- Proceso que ejecutó la consolidación
- Usuario creador

## Estructura de Archivos

```
consolidacion-requerimientos/
├── consolidacion-requerimientos.component.ts    # Lógica del componente
├── consolidacion-requerimientos.component.html  # Interfaz de usuario
├── consolidacion-requerimientos.component.scss  # Estilos
└── README.md                                    # Esta documentación
```

## Modelos de Datos

### RequerimientoConsolidadoCompra
```typescript
{
  no_reqconsolcompra: string;
  no_cia: string;
  fecha_consolidacion: Date;
  estado: 'BORRADOR' | 'CONSOLIDADO' | 'ANULADO';
  usuario_creador: string;
  observaciones?: string;
  detalles?: DetalleRequerimientoConsolidado[];
}
```

### DetalleRequerimientoConsolidado
```typescript
{
  no_linea: number;
  codigo_item: string;
  descripcion_item: string;
  cantidad_total: number;
  unidad_medida: string;
  origenes?: ReqConsolidado[];
}
```

### ReqConsolidado (Trazabilidad)
```typescript
{
  no_reqconsolcompra: string;
  no_linea_consolidada: number;
  tipo_origen: 'COMPRA' | 'CONSUMO';
  id_requerimiento_origen: string;
  no_linea_origen: number;
  cantidad_consolidada: number;
  saldo_origen?: number;
  fecha_consolidacion: Date;
  estado: 'ACTIVA' | 'PARCIAL' | 'COMPLETA' | 'ANULADA';
}
```

## Flujo de Trabajo

### 1. Selección de Requerimientos Elegibles
- El sistema carga automáticamente requerimientos aprobados
- Separa por tipo: **Compra** y **Consumo**
- Calcula saldos pendientes para consumo
- Permite selección manual de detalles

### 2. Consolidación
- Agrupa automáticamente por **código de ítem**
- Suma cantidades/saldos
- Permite ajustar cantidades a consolidar
- Valida que no se exceda el saldo disponible

### 3. Generación de Consolidación
- Crea el registro `RequerimientoConsolidadoCompra`
- Genera detalles consolidados
- Registra trazabilidad en `ReqConsolidado`
- Actualiza estado de líneas origen

### 4. Solicitud de Cotización (Opcional)
- Genera automáticamente `SolicitudCotizacion`
- Permite cotizaciones de múltiples proveedores
- Soporta división de ítems entre proveedores
- Considera tiempos de entrega y formas de pago

## Permisos y Roles

**Acceso permitido para:**
- `TI` (Administrador TI)
- `ALLOGIST` (Almacén Logística)

## Uso del Módulo

### Paso 1: Acceder al Módulo
Navegar a: **Consolidación → Consolidación de Requerimientos**

### Paso 2: Seleccionar Requerimientos
1. Ir a la pestaña **"Requerimientos Elegibles"**
2. Seleccionar entre **Compra** o **Consumo**
3. Marcar los detalles a consolidar
4. Click en **"Consolidar Seleccionados"**

### Paso 3: Revisar Consolidación
1. Revisar ítems agrupados
2. Ajustar cantidades si es necesario
3. Agregar observaciones (opcional)
4. Click en **"Generar Consolidación"**

### Paso 4: Generar Cotización (Opcional)
- El sistema pregunta si desea generar la solicitud de cotización
- Si acepta, se crea automáticamente vinculada a la consolidación

### Paso 5: Gestionar Consolidaciones
- Ver consolidaciones existentes en la pestaña **"Consolidaciones"**
- Filtrar por estado
- Ver detalles completos
- Anular si es necesario

## API Endpoints (Backend)

```typescript
// Obtener requerimientos elegibles
GET /api/consolidacion/requerimientos-elegibles/{no_cia}

// Consolidar requerimientos
POST /api/consolidacion/consolidar

// Obtener consolidaciones
GET /api/consolidacion/{no_cia}?estado={estado}

// Obtener detalle de consolidación
GET /api/consolidacion/detalle/{no_reqconsolcompra}

// Generar solicitud de cotización
POST /api/consolidacion/generar-solicitud-cotizacion

// Anular consolidación
PUT /api/consolidacion/anular/{no_reqconsolcompra}

// Obtener solicitudes de cotización
GET /api/consolidacion/solicitudes-cotizacion/{no_cia}

// Agregar cotización de proveedor
POST /api/consolidacion/cotizacion-proveedor

// Seleccionar cotización ganadora
PUT /api/consolidacion/seleccionar-cotizacion/{id_cotizacion}
```

## Notas Importantes

⚠️ **Importante:**
- Los requerimientos de activos van a un almacén de commoditys
- La consolidación se hace cuando no se pueden atender los despachos
- Se guardan para ir consolidándose automáticamente
- Un ítem puede dividirse entre varios proveedores según disponibilidad y tiempos de entrega

## Próximas Mejoras

- [ ] REQ10: Estado automático de líneas origen
- [ ] REQ13: Ejecución automática por evento o batch programado
- [ ] Dashboard de consolidaciones
- [ ] Reportes de consolidación
- [ ] Integración con módulo de compras
- [ ] Notificaciones automáticas

## Soporte

Para dudas o problemas con el módulo, contactar al equipo de desarrollo.
