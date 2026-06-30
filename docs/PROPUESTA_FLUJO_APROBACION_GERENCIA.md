# Propuesta: Flujo de Aprobación con Gerencia para Compras y Servicios

## 1. Objetivo

Definir cómo integrar al **rol Gerencia** en el flujo de aprobaciones de requerimientos de **COMPRA** y **SERVICIO**, permitiéndole ver el desglose de costos antes de aprobar, basado en:

- **Compras**: costo unitario y total de cada ítem del requerimiento.
- **Servicios**: costo histórico de servicios similares (cotizaciones y órdenes de servicio previas).

---

## 2. Estado actual del flujo de aprobaciones

### 2.1 Roles que intervienen hoy

| Rol | Código | Función actual en aprobaciones |
|-----|--------|--------------------------------|
| Jefe de Área | `JEFE_AREA` | Aprueba requerimientos de su propia área. |
| Jefe Logística | `LOLOGIST` | Aprueba compras, participa en cotización. |
| Jefe Almacén | `ALLOGIST` | Aprueba compras/consumo y despacho. |
| Operativo | `OPLOGIST` | Crea requerimientos. |
| Aprobador genérico | `APLOGIST` | Aprobador especial (ej. Contabilidad). |
| TI | `TILOGIST` | Administración. |

**No existe un rol `GERENTE` ni `FINANZAS` en el flujo actual.**

### 2.2 Tablas que intervienen hoy

| Tabla | Propósito actual |
|-------|------------------|
| `LOGISTICA_Requerimientos` | Cabecera del requerimiento (`montoTotal`, `tipo`, `areaSolicitante`, `estado`). |
| `LOGISTICA_DetalleRequerimientos` | Ítems del requerimiento (`cantidad`, `precioUnitario`, `precioTotal`). |
| `LOGISTICA_SolicitudServicio` | Cabecera de solicitud de servicio (`montoEstimado`, `tipoServicio`). |
| `LOGISTICA_SolicitudServicioDet` | Líneas de servicio (`cantidad`, `precioUnitarioEstimado`, `subtotal`). |
| `LOGISTICA_CotizacionServicio` / `Det` | Cotizaciones recibidas de proveedores. |
| `LOGISTICA_OrdenServicio` / `Det` | Órdenes de servicio ya emitidas (histórico de precios). |
| `LOGISTICA_FlujoAprobacion` | Configura por área y tipo qué rol aprueba y en qué secuencia, con `montoMinimo`/`montoMaximo`. |
| `LOGISTICA_LogAprobaciones` | Registro de cada aprobación pendiente/aprobada/rechazada. |
| `LOGISTICA_UsuariosPorArea` | Relación usuario-rol-área, incluye `esJefeArea`. |

### 2.3 Lógica actual

1. Al crear requerimiento, `LOGISTICA_asignarAprobadoresRequerimiento` lee `LOGISTICA_FlujoAprobacion`.
2. Inserta un registro en `LOGISTICA_LogAprobaciones` por cada nivel configurado.
3. El frontend `aprobaciones-area` muestra los requerimientos pendientes del aprobador logueado.
4. El aprobador ve ítems/servicios pero **no ve comparación de precios históricos ni monto acumulado por área**.
5. El monto total es un campo simple; no hay validación contra presupuesto ni alertas por montos altos.

---

## 3. Propuesta: agregar nivel Gerencia

### 3.1 Nuevo rol en el flujo

| Rol | Código | Momento de intervención |
|-----|--------|--------------------------|
| Gerencia | `GERENTE` | Después de Jefe de Área (y opcionalmente Logística) cuando el monto supere el umbral definido para compras o servicios. |
| Finanzas | `FINANZAS` | Opcional, validación presupuestaria antes de Gerencia. |

### 3.2 Reglas de negocio propuestas

#### Compras
- Si `montoTotal` del requerimiento > `umbralGerenciaCompra` (ej. S/ 10,000), agregar nivel `GERENTE`.
- Gerencia podrá ver:
  - Desglose por ítem: `cantidad × precioUnitario = precioTotal`.
  - Comparación con últimas compras del mismo ítem (`LOGISTICA_DetalleRequerimientos` + `LOGISTICA_OC`/`LOGISTICA_Recepcion`).
  - Monto acumulado del área en el mes/año.
  - Alerta si el precio supera el promedio histórico en más de X %.

#### Servicios
- Si `montoEstimado` > `umbralGerenciaServicio` (ej. S/ 5,000), agregar nivel `GERENTE`.
- Gerencia podrá ver:
  - Líneas de servicio con `precioUnitarioEstimado`.
  - Cotizaciones recibidas (`LOGISTICA_CotizacionServicio`).
  - Histórico de precios de servicios similares (`LOGISTICA_OrdenServicio` + `LOGISTICA_OrdenServicioDet`).
  - Promedio del último año para el mismo `tipoServicio`.

### 3.3 Cambios en base de datos

| Tabla | Cambio |
|-------|--------|
| `LOGISTICA_FlujoAprobacion` | Agregar registros con `rolAprobador = 'GERENTE'` y `tipoRequerimiento = 'COMPRA'` / `'SERVICIO'`. |
| `LOGISTICA_UsuariosPorArea` | Agregar usuarios con `rol = 'GERENTE'`; no requieren área específica (aprueban de cualquier área). |
| `LOGISTICA_LogAprobaciones` | Sin cambio de estructura; solo se insertarán filas con `rolAprobador = 'GERENTE'`. |
| `LOGISTICA_Requerimientos` | Opcional: agregar `umbralAplicado` o `requiereAprobacionGerencia`. |
| `LOGISTICA_DetalleRequerimientos` | Sin cambio; ya tiene precios. |
| `LOGISTICA_SolicitudServicio` | Sin cambio estructural; ya tiene `montoEstimado`. |
| **Nueva vista/tabla** `LOGISTICA_HistorialPrecioItem` | Vista que calcule promedio, mínimo, máximo y último precio pagado por ítem. |
| **Nueva vista/tabla** `LOGISTICA_HistorialPrecioServicio` | Vista que calcule promedio por `tipoServicio` y proveedor. |

### 3.4 Cambios en backend

| Componente | Cambio |
|------------|--------|
| `LOGISTICA_asignarAprobadoresRequerimiento` | Incluir lógica condicional para agregar `GERENTE`/`FINANZAS` según `montoTotal` y `tipoRequerimiento`. |
| `LOGISTICA_obtenerRequerimientosPendientesAprobacion` | Sin cambio; filtra por `aprobadorAsignado`. |
| `LOGISTICA_obtenerFlujoCompletoAprobacion` | Incluir resolución de `GERENTE` (usuarios con ese rol, no por área). |
| Nuevo SP `LOGISTICA_obtenerHistorialPrecioItem` | Devuelve histórico de precios de un ítem. |
| Nuevo SP `LOGISTICA_obtenerHistorialPrecioServicio` | Devuelve histórico de precios por tipo de servicio. |
| Nuevo SP `LOGISTICA_obtenerResumenPresupuestoArea` | Devuelve monto acumulado aprobado por área en un período. |
| Controller `AprobacionesController` / `AprobacionesAreaController` | Agregar endpoints para consultar histórico y resumen. |

### 3.5 Cambios en frontend

| Componente | Cambio |
|------------|--------|
| `aprobaciones-area.component` | Mostrar badge/mensaje cuando el requerimiento requiera aprobación de Gerencia. |
| Modal de detalle de aprobación | Nueva sección **"Análisis de costos"** con:
  - Tabla de ítems/servicios + totales.
  - Histórico de precios (línea o tabla).
  - Resumen de presupuesto del área.
  - Alerta visual si supera umbral. |
| `numeroRequerimiento` / `nombreCorto` | Sin cambio. |

---

## 4. Diferencia entre lo actual y lo propuesto

| Aspecto | Actual | Propuesto |
|---------|--------|-----------|
| Roles en flujo | Jefe Área, Logística, Almacén, Aprobador genérico. | Se agrega `GERENTE` (y opcional `FINANZAS`). |
| Aprobación por monto | Solo `montoMinimo`/`montoMaximo` por nivel. | Umbral específico que dispara aprobación de Gerencia. |
| Visibilidad de costos | Solo monto total. | Desglose por ítem/servicio + histórico + presupuesto. |
| Compras | No hay comparación de precios. | Comparación con últimas compras y promedio histórico. |
| Servicios | No hay comparación de costos. | Comparación con cotizaciones y órdenes de servicio previas. |
| Tablas nuevas | Ninguna. | Vistas `HistorialPrecioItem` y `HistorialPrecioServicio`. |
| Seguridad de precios | Todos los aprobadores ven el mismo monto. | **Solo Gerencia/Finanzas ven precios detallados**; Jefe de Área puede ver solo cantidades/descripción. |
| Configuración | Fija por área. | Umbral configurable por empresa/tipo. |

---

## 5. Flujo propuesto (ejemplo COMPRA > S/ 10,000)

```
[Usuario crea requerimiento de COMPRA]
           ↓
[SP asigna aprobadores según flujo + monto]
           ↓
[1. Jefe de Área] → aprueba cantidad/necesidad (sin precios)
           ↓
[2. Jefe de Logística] → valida disponibilidad/cotización (con precios estimados)
           ↓
[3. Gerencia] → aprueba monto total (ve desglose + histórico + presupuesto)
           ↓
[4. Almacén / Compras] → genera OC
```

---

## 6. Flujo propuesto (ejemplo SERVICIO > S/ 5,000)

```
[Usuario crea solicitud de SERVICIO]
           ↓
[SP asigna aprobadores según flujo + monto]
           ↓
[1. Jefe de Área] → aprueba alcance/necesidad (sin precios)
           ↓
[2. Logística / Cotización] → registra cotizaciones
           ↓
[3. Gerencia] → aprueba monto (ve líneas + cotizaciones + histórico OS)
           ↓
[4. Orden de Servicio] → se genera OS
```

---

## 7. Tablas que se verían afectadas en el flujo completo

### Requerimientos de compra
- `LOGISTICA_Requerimientos`
- `LOGISTICA_DetalleRequerimientos`
- `LOGISTICA_FlujoAprobacion`
- `LOGISTICA_LogAprobaciones`
- `LOGISTICA_UsuariosPorArea`
- `LOGISTICA_OC` / `LOGISTICA_OCDetalle` (histórico de compras)
- `LOGISTICA_Recepcion` / `LOGISTICA_Kardex` (validación de ingreso)

### Servicios
- `LOGISTICA_SolicitudServicio`
- `LOGISTICA_SolicitudServicioDet`
- `LOGISTICA_CotizacionServicio`
- `LOGISTICA_CotizacionServicioDet`
- `LOGISTICA_OrdenServicio`
- `LOGISTICA_OrdenServicioDet`
- `LOGISTICA_AprobacionSS`
- `LOGISTICA_AprobacionOS`
- `LOGISTICA_FlujoAprobacion`
- `LOGISTICA_LogAprobaciones`
- `LOGISTICA_UsuariosPorArea`

---

## 8. Opciones de implementación

### Opción A: Mínima (recomendada para revisión rápida)
1. Agregar `GERENTE` en `LOGISTICA_UsuariosPorArea`.
2. Agregar flujos `GERENTE` en `LOGISTICA_FlujoAprobacion` con `montoMinimo` umbral.
3. Modificar `LOGISTICA_asignarAprobadoresRequerimiento` para respetar umbral.
4. En frontend, en el modal de detalle, mostrar el `montoTotal` y desglose (ya existe en detalle).

### Opción B: Completa
1. Todo lo de la Opción A.
2. Crear vistas de histórico de precios.
3. Crear endpoints de consulta de histórico y presupuesto.
4. Mostrar histórico y alertas en el modal de aprobación.
5. Agregar permiso de visibilidad de precios por rol.

---

## 9. Preguntas pendientes para definir

1. ¿El umbral para Gerencia es el mismo para todas las áreas o varía por área?
2. ¿Gerencia aprueba solo compras, o también consumos de alto valor?
3. ¿Finanzas debe intervenir antes o después de Gerencia?
4. ¿El Jefe de Área actualmente ve precios? ¿Se quiere ocultar?
5. ¿Existe un presupuesto por área ya cargado en alguna tabla?
6. ¿Los precios de ítems provienen de cotizaciones, de OC anteriores o de ambos?

---

## 10. Próximos pasos sugeridos

1. Validar la propuesta con el usuario/gerencia.
2. Definir umbrales por tipo y área.
3. Identificar si ya existen datos históricos de precios (OC, recepciones, cotizaciones).
4. Elegir Opción A o B.
5. Implementar cambios en base de datos, backend y frontend.
