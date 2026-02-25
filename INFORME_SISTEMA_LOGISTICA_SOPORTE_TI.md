# INFORME TÉCNICO - SISTEMA DE LOGÍSTICA
## Manual de Soporte para Personal de TI

---

## 1. INTRODUCCIÓN

### 1.1 Propósito del Sistema
Sistema web Angular para gestionar el ciclo completo de requerimientos de materiales: creación, aprobación y despacho, con integración a ERP SPRING.

### 1.2 Tecnologías
- **Frontend**: Angular 17+ (Standalone Components)
- **Base de Datos Local**: IndexedDB (Dexie.js)
- **Backend**: API REST + SQL Server
- **Integración ERP**: SPRING
- **UI**: PrimeNG, Bootstrap 5

### 1.3 Roles del Sistema
- **LOLOGIST**: Logística completa (incluye transferencias)
- **OPLOGIST/EMLOGIST**: Operadores (requerimientos de consumo)
- **ALLOGIST/APLOGIST**: Aprobadores

---

## 2. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────┐
│   NAVEGADOR WEB (Angular)           │
│  ┌──────────┐  ┌──────────┐        │
│  │Parámetros│  │Requerim. │        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐        │
│  │Aprobac.  │  │Despachos │        │
│  └──────────┘  └──────────┘        │
├─────────────────────────────────────┤
│     IndexedDB (Almacenamiento)      │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│         API REST + SQL Server       │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│          SPRING ERP                 │
└─────────────────────────────────────┘
```

---

## 3. MÓDULOS Y FLUJO DE PROCESOS

### 3.1 MÓDULO: PARÁMETROS
**Ubicación**: `src/app/modules/main/pages/parametros/`

**Propósito**: Configurar valores predeterminados para crear requerimientos.

**Funcionalidades**:
1. Selección de Empresa, Fundo, Cultivo, Área
2. Configuración de Almacén (según rol)
3. Tipo de Item: CONSUMO (todos) / TRANSFERENCIA (solo LOLOGIST)
4. Configuración de CECO, Turno, Proyecto, Labor
5. Sincronización de tablas maestras

**Flujo**:
```
Empresa → Fundo → Cultivo → Turno → CECO → Labor → Proyecto
                                                      ↓
                                            Guardar Configuración
```

**Persistencia**: IndexedDB (tabla `configuraciones`)

---

### 3.2 MÓDULO: REQUERIMIENTOS
**Ubicación**: `src/app/modules/main/pages/requerimientos/`

**Propósito**: Crear solicitudes de materiales, servicios o activos fijos.

**Tipos de Requerimientos**:

| Tipo | Descripción | Campos Principales |
|------|-------------|-------------------|
| **ITEM** | Materiales físicos | Código, Producto, Cantidad, Proyecto, CECO, Labor |
| **COMMODITY** | Servicios externos | Proveedor, Servicio, Cantidad, Distribución contable |
| **ACTIVOFIJO** | Activos fijos mayores | Proveedor, Servicio AF, Cantidad, Distribución |
| **ACTIVOFIJOMENOR** | Activos fijos menores | Similar a ACTIVOFIJO |

**Estructura de Datos**:
```typescript
Requerimiento {
  idrequerimiento: RUC + ALMACEN + DNI + TIMESTAMP
  fecha, glosa, tipo, itemtipo, prioridad
  estados: PENDIENTE | APROBADO | RECHAZADO | DESPACHADO
  estado: 0 (no enviado) | 1 (enviado)
  detalle: DetalleRequerimiento[]
}

DetalleRequerimiento {
  codigo, producto, cantidad
  proyecto, ceco, turno, labor
  atendida: cantidad ya despachada
}
```

**Flujo de Creación**:
```
1. Cargar configuración de Parámetros
2. Seleccionar tipo (ITEM/COMMODITY/ACTIVO)
3. Ingresar glosa y prioridad
4. Agregar líneas de detalle
5. Validar stock (solo ITEM)
6. Generar ID único
7. Guardar en IndexedDB (estado=0, estados=PENDIENTE)
8. Sincronizar con servidor → estado=1
```

---

### 3.3 MÓDULO: REPORTE DE REQUERIMIENTOS
**Ubicación**: `src/app/modules/main/pages/reporte-requerimientos/`

**Funcionalidades**:
- Filtros: rango de fechas, búsqueda por texto
- Visualización: tabla con paginación
- Exportación: Excel con formato
- Detalle: modal con líneas completas

**Columnas**: Fecha, N° Requisición, ID Requerimiento, Glosa, Empresa, Fundo, Almacén, Tipo, Estado, Prioridad

---

### 3.4 MÓDULO: APROBACIONES
**Ubicación**: `src/app/modules/main/pages/aprobaciones/`

**Propósito**: Aprobar o rechazar requerimientos según rol.

**Funcionalidades**:
1. Sincronizar requerimientos pendientes (filtrados por rol)
2. Visualizar detalle completo
3. Aprobar individual o masivo
4. Rechazar con motivo
5. Sincronizar con SPRING (genera Requisición)

**Flujo de Aprobación**:
```
1. Sincronizar requerimientos PENDIENTES
2. Seleccionar requerimiento
3. Ver detalle (cabecera + líneas + distribución)
4. APROBAR:
   ├─ Preparar payload para SPRING
   ├─ Enviar a SP: LOGISTICA_registrarRequisicion_JSON
   ├─ Obtener RequisicionNumero
   ├─ Actualizar: estados=APROBADO, estado=1
   └─ Guardar número de requisición
5. RECHAZAR:
   ├─ Solicitar motivo
   ├─ Actualizar: estados=RECHAZADO, estado=1
   └─ Guardar observación
```

**Payload SPRING (Aprobación)**:
```json
{
  "CompaniaSocio": "00000800",
  "RequisicionNumero": "",
  "Clasificacion": "MAT",
  "ComprasAlmacenFlag": "A",
  "AlmacenCodigo": "H001",
  "FechaRequerida": "2026-01-27T00:00:00",
  "PrioridadCodigo": "1",
  "DefaultPrime": "11020",
  "DefaultAfe": "FUNDO HP",
  "Estado": "AP",
  "Comentarios": "Glosa",
  "origen": "app_logistica",
  "detalle": [{
    "Secuencia": 1,
    "TipoDetalle": "ITEM",
    "Item": "00001234",
    "CantidadPedida": 10,
    "CentroCosto": "11020",
    "LoteProduccion": "0502"
  }],
  "distribucion": [{
    "Secuencia": 1,
    "Account": "10411103",
    "Afe": "FUNDO HP",
    "Monto": "100.00"
  }]
}
```

---

### 3.5 MÓDULO: REPORTE DE APROBACIONES
**Ubicación**: `src/app/modules/main/pages/reporte/reporte-aprobados.component.ts`

**Funcionalidades**:
- Tabs: Aprobados / Rechazados
- Filtros: nombre creador, número documento
- Detalle: modal con líneas
- Ordenamiento: fecha descendente

---

### 3.6 MÓDULO: DESPACHOS
**Ubicación**: `src/app/modules/main/pages/despachos/`

**Propósito**: Despachar materiales de requerimientos aprobados, generando salidas NS en SPRING.

**Funcionalidades**:
1. Listar requerimientos APROBADOS
2. Filtros: N° NS, N° Requisición, fechas, proyecto
3. Ver detalle con cálculo de atención
4. Registrar despacho (genera NS en SPRING)

**Cálculo de Atención**:
```typescript
solicitada = cantidad
atendida = cantidadAtendidaPreviamente
pendiente = solicitada - atendida
stock = stockDisponibleEnAlmacen
atender = min(pendiente, stock)
compra = max(0, pendiente - stock)

Estado:
- atender = 0 → SIN STOCK
- atender < pendiente → PARCIAL
- atender = pendiente → COMPLETO
```

**Flujo de Despacho**:
```
1. Sincronizar requerimientos APROBADOS
2. Seleccionar requerimiento
3. Cargar detalle y calcular stock
4. Ajustar cantidades a despachar
5. Preparar payload para SPRING
6. Enviar a SP: LOGISTICA_generarSalidaNSWH_JSON
7. Obtener NumeroDocumento (NS)
8. Actualizar cantidades atendidas
9. Actualizar: estados=DESPACHADO
10. Registrar despacho en BD local
```

**Payload SPRING (Despacho)**:
```json
{
  "CompaniaSocio": "00000800",
  "RequisicionNumero": "0000006070",
  "AlmacenCodigo": "H001",
  "Periodo": "202601",
  "FechaDocumento": "2026-01-27 14:30:00",
  "Proyecto": "FUNDO HP",
  "detalle": [{
    "Secuencia": 1,
    "Item": "00001234",
    "Cantidad": 10,
    "Lote": "00",
    "CentroCosto": "11020",
    "Actividad": "0502"
  }]
}
```

---

### 3.7 MÓDULO: REPORTE DE DESPACHOS
**Ubicación**: `src/app/modules/main/pages/reporte/reporte-despachos.component.ts`

**Funcionalidades**:
- Filtros: N° NS, N° Requisición, fechas
- Columnas: N° NS, N° Requisición, Fecha, Almacén, Usuario, Estado
- Detalle: modal con líneas despachadas
- Exportar: Excel con formato

---

### 3.8 MÓDULO: REPORTE DE SALDOS
**Ubicación**: `src/app/modules/main/pages/reporte/reporte-saldos.component.ts`

**Funcionalidades**:
- Listar saldos de stock por item y almacén
- Filtros: almacén, código de item
- Información: Código, Descripción, Almacén, Cantidad, UM

---

## 4. DIAGRAMA DE FLUJO COMPLETO

```
┌──────────────────────────────────────────────────────────────┐
│ 1. CONFIGURACIÓN (Parámetros)                                │
│    Usuario configura: Empresa, Fundo, Almacén, CECO, etc.    │
│    → Guarda en IndexedDB                                      │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. CREACIÓN DE REQUERIMIENTO                                 │
│    - Carga configuración                                      │
│    - Selecciona tipo (ITEM/COMMODITY/ACTIVO)                 │
│    - Agrega líneas de detalle                                │
│    - Valida stock (si ITEM)                                  │
│    - Guarda: estado=0, estados=PENDIENTE                     │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. SINCRONIZACIÓN                                            │
│    - Envía a API REST → SQL Server                           │
│    - Actualiza: estado=1                                     │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. APROBACIÓN                                                │
│    - Aprobador sincroniza pendientes                         │
│    - Revisa detalle                                          │
│    - APRUEBA:                                                │
│      • Envía a SPRING                                        │
│      • Obtiene RequisicionNumero                             │
│      • estados=APROBADO                                      │
│    - RECHAZA:                                                │
│      • Solicita motivo                                       │
│      • estados=RECHAZADO                                     │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. DESPACHO                                                  │
│    - Despachador sincroniza aprobados                        │
│    - Calcula stock disponible                                │
│    - Ingresa cantidades a despachar                          │
│    - Genera salida NS en SPRING                              │
│    - Actualiza cantidades atendidas                          │
│    - estados=DESPACHADO                                      │
│    - Registra despacho en BD                                 │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. REPORTES                                                  │
│    - Reporte de Requerimientos                               │
│    - Reporte de Aprobaciones                                 │
│    - Reporte de Despachos                                    │
│    - Reporte de Saldos                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. ESTADOS DEL REQUERIMIENTO

```
        CREACIÓN
           │
           ▼
      PENDIENTE (estado=0)
           │
           │ Sincronización
           ▼
      PENDIENTE (estado=1)
           │
      ┌────┴────┐
      │         │
  APROBADO   RECHAZADO
      │
      │ Despacho
      ▼
  DESPACHADO
```

---

## 6. BASE DE DATOS

### 6.1 Tablas SQL Server

**logistica_requerimientos**:
- id, idrequerimiento (único), ruc, idfundo, idarea, idalmacen
- tipo, itemtipo, estados, prioridad, glosa
- fecha, nrodocumento, RequisicionNumero
- estado (0/1), eliminado (0/1)

**logistica_detalle_requerimientos**:
- id, idrequerimiento, codigo, producto, cantidad
- proyecto, ceco, turno, labor
- atendida (cantidad despachada)

**logistica_aprobaciones**:
- id, idrequerimiento, nivel, estado
- dniAprobador, fechaAprobacion, observacion

**logistica_despachos**:
- id, idrequerimiento, numeroNS, numeroRequisicion
- fechaDespacho, almacen, usuario, estado

**logistica_detalle_despachos**:
- id, iddespacho, codigo, solicitado, despachado

### 6.2 IndexedDB (Dexie)

**Tablas Principales**:
- `usuarios`, `configuraciones`
- `empresas`, `fundos`, `cultivos`, `areas`, `almacenes`
- `proyectos`, `items`, `cecos`, `labores`, `turnos`
- `requerimientos`, `detalles`
- `requerimientosCommodity`, `detallesCommodity`
- `requerimientosActivoFijo`, `detallesActivoFijo`
- `requerimientosActivoFijoMenor`, `detallesActivoFijoMenor`

---

## 7. TROUBLESHOOTING

### 7.1 Error: "No se puede sincronizar requerimientos"

**Causas**:
- Sin conexión a internet
- API REST no disponible
- Token expirado
- Datos inválidos

**Solución**:
1. Verificar conexión
2. Verificar API corriendo
3. Revisar consola (F12)
4. Logout/Login si es token
5. Validar campos obligatorios

### 7.2 Error: "No se puede aprobar en SPRING"

**Causas**:
- SPRING no disponible
- CECO no existe en SPRING
- AFE no existe en SPRING
- Item no existe en SPRING

**Solución**:
1. Verificar SPRING disponible
2. Revisar logs del backend
3. Validar CECO en SPRING
4. Validar AFE en SPRING
5. Validar código de item
6. Revisar formato JSON

### 7.3 Error: "No se puede generar salida NS"

**Causas**:
- Stock insuficiente
- Lote no encontrado
- Item no existe en almacén
- Almacén bloqueado

**Solución**:
1. Verificar stock real en SPRING
2. Verificar lote (default '00')
3. Validar item en almacén
4. Verificar almacén no bloqueado
5. Revisar logs SPRING

### 7.4 Error: "Configuración no guardada"

**Causas**:
- No configurado en Parámetros
- IndexedDB limpiada
- Error al guardar

**Solución**:
1. Ir a Parámetros y configurar
2. Verificar guardado correcto
3. Revisar consola IndexedDB
4. Limpiar caché y reconfigurar

### 7.5 Comandos de Debugging

**Limpiar IndexedDB**:
```javascript
indexedDB.deleteDatabase('LogisticaDB');
location.reload();
```

**Ver datos en IndexedDB**:
```javascript
const db = await new Dexie('LogisticaDB').open();
const reqs = await db.table('requerimientos').toArray();
console.table(reqs);
```

**Ver configuración actual**:
```javascript
const config = await db.table('configuraciones').toArray();
console.log(config[0]);
```

---

## 8. SERVICIOS ANGULAR PRINCIPALES

### DexieService
**Ubicación**: `src/app/shared/dixiedb/dexie-db.service.ts`
- Gestiona IndexedDB
- Métodos: showUsuario(), saveRequerimientos(), obtenerPrimeraConfiguracion()

### RequerimientosService
**Ubicación**: `src/app/modules/main/services/requerimientos.service.ts`
- Comunicación con API REST
- Métodos: getRequerimientos(), aprobarRequerimiento(), getRegristroRequerimientoSPRING()

### DespachosService
**Ubicación**: `src/app/modules/main/services/despachos.service.ts`
- Gestiona despachos
- Métodos: generarSalidaNS(), registrarDespacho(), listarDespachosRealizados()

### MaestrasService
**Ubicación**: `src/app/modules/main/services/maestras.service.ts`
- Sincroniza tablas maestras
- Métodos: getEmpresas(), getFundos(), getItems(), getCecos(), etc.

---

## 9. RESUMEN DE VISTAS HTML

| Módulo | Vista | Descripción |
|--------|-------|-------------|
| Parámetros | parametros.component.html | Formulario de configuración con dropdowns en cascada |
| Requerimientos | requerimientos.component.html | Tabs por tipo, formulario de cabecera, tabla de detalle |
| Reporte Req. | reporte-requerimientos.html | Tabla con filtros, paginación, exportar Excel |
| Aprobaciones | aprobaciones.component.html | Tabs por tipo, tabla con checkboxes, botones aprobar/rechazar |
| Reporte Aprob. | reporte-aprobados.component.html | Tabs aprobados/rechazados, filtros, detalle modal |
| Despachos | despacho.component.html | Tabla de aprobados, modal de atención con stock |
| Reporte Desp. | reporte-despachos.component.html | Tabla con filtros, detalle modal, exportar |
| Reporte Saldos | reporte-saldos.component.html | Tabla de saldos por item/almacén |

---

## 10. CONTACTO Y SOPORTE

Para soporte técnico, contactar al equipo de desarrollo con:
- Logs de consola del navegador (F12)
- Captura de pantalla del error
- Pasos para reproducir el problema
- Usuario y rol afectado

---

**Fin del Informe**
