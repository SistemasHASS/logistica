# Implementación Módulo de Despachos - Generar Salida NS

## 📋 Resumen

Se ha implementado la funcionalidad completa para el módulo de despachos que permite:

1. **Auto-llenar la columna "Atender"** cuando se hace clic en el botón "Atender"
2. **Llamar al SP `LOGISTICA_generarSalidaNSWH_JSON`** desde el botón "Registrar Atención"
3. **Generar salidas NS en SPRING (WH)** con actualización automática de stock y kardex

---

## ✅ Archivos Creados/Modificados

### **Frontend:**

1. ✅ **`despachos.service.ts`** (NUEVO)
   - Service para llamar al endpoint de generar salida NS
   - Ubicación: `src/app/modules/main/services/despachos.service.ts`

2. ✅ **`despacho.component.ts`** (MODIFICADO)
   - Import del nuevo `DespachosService`
   - Método `verDetalle()` actualizado para auto-llenar columna "atender"
   - Método `registrarAtencion()` completamente reescrito para llamar al API

### **Backend:**

3. ✅ **`LogisticaController.cs`** (MODIFICADO)
   - Nuevo endpoint: `POST /api/logistica/generar-salida-ns`

4. ✅ **`ILogisticaUseCase.cs`** (MODIFICADO)
   - Nuevo método: `Task<List<JsonElement>> GenerarSalidaNSAsync(string json)`

5. ✅ **`LogisticaUseCase.cs`** (MODIFICADO)
   - Implementación del método `GenerarSalidaNSAsync`

6. ✅ **`ILogisticaRepository.cs`** (MODIFICADO)
   - Nuevo método: `Task<List<JsonElement>> GenerarSalidaNSAsync(string json)`

7. ⏳ **`LogisticaRepositoryImpl.cs`** (PENDIENTE)
   - Código disponible en `IMPLEMENTACION_BACKEND_ADMIN.md`

---

## 🔧 Funcionalidad Implementada

### **1. Auto-llenar Columna "Atender"**

Cuando el usuario hace clic en el botón **"Atender"** en la tabla de requerimientos aprobados:

```typescript
verDetalle(r: any) {
  this.selected = r;
  this.detalle = r.detalle;

  // Auto-llenar la columna "Atender" con el cálculo automático
  if (this.detalle && this.detalle.length > 0) {
    this.detalle = this.detalle.map((d: any) => ({
      ...d,
      atender: this.calcularAtencion(d)
    }));
  }

  const modal = new bootstrap.Modal(document.getElementById('modalAtencion'));
  modal.show();
}
```

**¿Qué hace `calcularAtencion(d)`?**
- Calcula la cantidad pendiente: `solicitada - atendida`
- Obtiene el stock disponible en el almacén
- Retorna el mínimo entre `pendiente` y `stock`

**Resultado:** La columna "Atender" se llena automáticamente con la cantidad óptima a despachar.

---

### **2. Registrar Atención y Generar Salida NS**

Cuando el usuario hace clic en **"Registrar Atención"**:

```typescript
async registrarAtencion() {
  // 1. Validaciones
  if (!this.detalle.length) {
    this.alertService.showAlert('Aviso', 'No hay items para despachar', 'warning');
    return;
  }

  // 2. Preparar body para el SP
  const body = {
    CompaniaSocio: this.usuario.ruc + '01',
    RequisicionNumero: this.selected.idrequerimiento,
    AlmacenCodigo: this.selected.idalmacen || 'ALM01',
    Periodo: new Date().toISOString().slice(0, 7).replace('-', ''),
    UltimoUsuario: this.usuario.documentoidentidad,
    TipoCambio: 3.75,
    FechaDocumento: new Date().toISOString().split('T')[0],
    detalle: this.detalle
      .filter((d: any) => (d.atender || 0) > 0)
      .map((d: any, index: number) => ({
        Secuencia: index + 1,
        Item: d.codigo,
        Condicion: '01',
        UnidadCodigo: d.unidadMedida || 'UND',
        Cantidad: d.atender || d.cantidad,
        Lote: d.lote || 'LOTE001',
        CentroCosto: d.centroCosto || this.selected.centroCosto || '0502'
      }))
  };

  // 3. Llamar al service
  this.despachosService.generarSalidaNS(body).subscribe({
    next: async (response: any) => {
      const resultado = response?.resultado || response;
      const errorGeneral = resultado?.errorgeneral || 0;

      if (errorGeneral === 0) {
        // Éxito: actualizar detalles en Dexie
        // Mostrar mensaje con número de documento NS
        this.alertService.showAlert(
          'Éxito',
          `Salida NS generada: ${resultado.NumeroDocumento || 'N/A'}`,
          'success'
        );
      } else {
        // Error en el SP
        const errores = resultado?.detalle || [];
        const mensajeError = errores.map((e: any) => `${e.id}: ${e.error}`).join('\n');
        this.alertService.showAlert('Error', `No se pudo generar la salida NS:\n${mensajeError}`, 'error');
      }
    },
    error: (error: any) => {
      this.alertService.showAlert('Error', 'Error al generar salida NS en SPRING', 'error');
    }
  });
}
```

---

## 📡 Endpoint Backend

### **URL:** `POST /api/logistica/generar-salida-ns`

### **Request Body:**

```json
{
  "CompaniaSocio": "2048112196601",
  "RequisicionNumero": "REQ-2024-001",
  "AlmacenCodigo": "ALM01",
  "Periodo": "202401",
  "UltimoUsuario": "74070205",
  "TipoCambio": 3.75,
  "FechaDocumento": "2024-01-27",
  "detalle": [
    {
      "Secuencia": 1,
      "Item": "ITEM001",
      "Condicion": "01",
      "UnidadCodigo": "UND",
      "Cantidad": 10,
      "Lote": "LOTE001",
      "CentroCosto": "0502"
    }
  ]
}
```

### **Response (Éxito):**

```json
{
  "errorgeneral": 0,
  "detalle": [],
  "NumeroDocumento": "000123"
}
```

### **Response (Error):**

```json
{
  "errorgeneral": 1,
  "detalle": [
    {
      "id": "ITEM001-LOTE001",
      "error": "STOCK INSUFICIENTE"
    }
  ],
  "NumeroDocumento": null
}
```

---

## 🗄️ Stored Procedure

El SP `LOGISTICA_generarSalidaNSWH_JSON` realiza las siguientes operaciones:

1. ✅ **Valida lotes** - Verifica que existan en `WH_ItemAlmacenLote`
2. ✅ **Valida stock** - Verifica que haya stock suficiente
3. ✅ **Genera correlativo NS** - Obtiene el siguiente número de salida
4. ✅ **Inserta en WH_TransaccionHeader** - Cabecera de la transacción
5. ✅ **Inserta en WH_TransaccionDetalle** - Detalle de la transacción
6. ✅ **Inserta en WH_Kardex** - Movimiento de kardex
7. ✅ **Actualiza WH_ItemAlmacenLote** - Descuenta el stock

---

## 📋 Pasos para Completar la Implementación

### **Backend:**

1. Abrir `LogisticaRepositoryImpl.cs`
2. Copiar el siguiente código al final de la clase (antes del `}`):

```csharp
// =============================================
// DESPACHOS - GENERAR SALIDA NS
// =============================================

public async Task<List<JsonElement>> GenerarSalidaNSAsync(string json)
{
    var lista = await EjecutarStoredProcedureAsync<JsonElement>(
        "LOGISTICA_generarSalidaNSWH_JSON",
        json,
        result =>
        {
            var jsonString = result.GetString(0);
            return JsonSerializer.Deserialize<JsonElement>(jsonString);
        },
        parametrosRequeridos: true);

    return lista;
}
```

3. Compilar el proyecto backend
4. Ejecutar y probar

### **Frontend:**

✅ Ya está completamente implementado. Solo compilar:

```bash
ng build
# o
ng serve
```

---

## 🧪 Pruebas

### **Escenario 1: Despacho Exitoso**

1. Ir al módulo de **Despachos**
2. Hacer clic en **"Atender"** en un requerimiento aprobado
3. Verificar que la columna **"Atender"** se llene automáticamente
4. Hacer clic en **"Registrar Atención"**
5. Verificar mensaje de éxito con número de documento NS

### **Escenario 2: Stock Insuficiente**

1. Seleccionar un requerimiento con items sin stock
2. Hacer clic en **"Atender"**
3. Verificar que la columna **"Atender"** muestre 0 para items sin stock
4. Hacer clic en **"Registrar Atención"**
5. Verificar mensaje de error indicando stock insuficiente

### **Escenario 3: Lote No Existe**

1. Modificar el código para enviar un lote inexistente
2. Hacer clic en **"Registrar Atención"**
3. Verificar mensaje de error: "LOTE NO EXISTE EN ALMACEN"

---

## 📝 Notas Importantes

### **Ajustes Necesarios:**

Los siguientes valores están hardcodeados y deben ajustarse según tu lógica de negocio:

1. **`CompaniaSocio`**: Actualmente `this.usuario.ruc + '01'`
   - Ajustar según tu estructura de compañía

2. **`TipoCambio`**: Actualmente `3.75`
   - Traer de una tabla de configuración o servicio

3. **`Condicion`**: Actualmente `'01'`
   - Ajustar según tu lógica de condiciones de items

4. **`Lote`**: Actualmente `'LOTE001'` por defecto
   - Implementar selección de lote desde el frontend

5. **`CentroCosto`**: Actualmente `'0502'` por defecto
   - Traer del requerimiento o del detalle

### **Mejoras Futuras:**

- [ ] Implementar selección de lote en el modal
- [ ] Traer tipo de cambio desde configuración
- [ ] Validar permisos de usuario antes de generar salida
- [ ] Agregar confirmación antes de generar salida NS
- [ ] Implementar impresión de documento NS
- [ ] Agregar auditoría de operaciones

---

## ✅ Checklist de Implementación

- [x] Crear `DespachosService`
- [x] Agregar endpoint en `LogisticaController`
- [x] Agregar método en `ILogisticaUseCase`
- [x] Implementar método en `LogisticaUseCase`
- [x] Agregar método en `ILogisticaRepository`
- [ ] Implementar método en `LogisticaRepositoryImpl` (copiar código del documento)
- [x] Modificar `verDetalle()` para auto-llenar columna
- [x] Modificar `registrarAtencion()` para llamar al API
- [ ] Compilar backend
- [ ] Compilar frontend
- [ ] Probar flujo completo

---

**Fecha de Implementación:** 27 de Enero, 2026  
**Versión:** Despachos V1.0 - Generar Salida NS
