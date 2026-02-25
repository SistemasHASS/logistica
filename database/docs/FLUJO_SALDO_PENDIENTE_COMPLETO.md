# Flujo Completo de Saldo Pendiente - Sistema Logística

## ¿Cuándo se llena la tabla LOGISTICA_SaldoPendienteAprobacion?

### 1. **En Despachos - Cuando no hay stock disponible**

#### Flujo principal:
1. Usuario selecciona un requerimiento aprobado en **Despachos**
2. Hace clic en **"Atender"**
3. Sistema verifica stock de cada item
4. **Si no hay stock** para uno o más items:
   - Aparece diálogo con opciones
   - Si elige "Decidir después" o similar
   - Sistema crea saldos pendientes

#### Código clave en DespachoComponent:
```typescript
// Método: crearSaldosPendientes()
private async crearSaldosPendientes(itemsFaltantes: any[], estado: string) {
  const saldoPendiente = {
    idrequerimiento: this.selected?.idrequerimiento || 0,
    requerimientoNumero: this.selected?.numero || `REQ-${this.selected?.idrequerimiento}`,
    usuario: this.usuario.documentoidentidad,
    items: itemsFaltantes.map(item => ({
      codigo: item.codigo,
      descripcion: item.descripcion,
      cantidadSolicitada: item.cantidad,
      cantidadDespachada: item.atendida || 0,
      saldoPendiente: item.faltante
    }))
  };
  
  // Aquí se inserta en la tabla
  const resp = await this.consolidacionService.registrarSaldoPendienteAprobacion(saldoPendiente);
}
```

### 2. **Endpoint Backend que inserta:**

```
POST /api/logistica/registrar-saldo-pendiente-aprobacion
```

### 3. **Stored Procedure que inserta:**

```sql
CREATE PROCEDURE LOGISTICA_registrarSaldoPendienteAprobacion
    @json NVARCHAR(MAX)
AS BEGIN
    -- Inserta en LOGISTICA_SaldoPendienteAprobacion
    -- Una fila por cada item sin stock
END
```

## ¿Por qué está vacía la tabla?

### Posibles causas:
1. **Nunca se ha creado saldo pendiente** - Nadie ha despachado items sin stock
2. **Los saldos ya fueron procesados** - Se consolidaron y cambiaron de estado
3. **Error en el proceso de creación** - El SP falló al insertar

## ¿Cómo probar el flujo completo?

### Opción 1: Crear datos de prueba manualmente
```sql
-- Insertar un saldo pendiente de prueba
INSERT INTO LOGISTICA_SaldoPendienteAprobacion (
    idrequerimiento,
    requerimientoNumero,
    usuarioCreador,
    fechaCreacion,
    estado,
    items JSON
) VALUES (
    12345,
    'REQ-12345',
    '47904392',
    GETDATE(),
    'PENDIENTE',
    '[{"codigo": "000018", "descripcion": "6 SOLENOIDS", "cantidad": 10}]'
);
```

### Opción 2: Simular el flujo real
1. Ve a **Despachos**
2. Selecciona un requerimiento
3. Ingresa cantidades mayores al stock disponible
4. Haz clic en "Atender"
5. Elige "Decidir después"
6. Esto debería crear el saldo pendiente

## Flujo de vida del Saldo Pendiente:

```
1. DESPACHO (sin stock)
   ↓
2. CREACIÓN -> Estado: PENDIENTE
   ↓
3. ESPERA -> Estado: ESPERA_STOCK
   ↓
4. CONSOLIDACIÓN -> Estado: CONSOLIDADO
   ↓
5. CIERRE -> Estado: CERRADO
```

## Estados posibles:

- **PENDIENTE**: Recién creado, espera acción
- **ESPERA_STOCK**: Esperando que llegue stock
- **CONSOLIDADO**: Items agrupados para compra
- **CERRADO**: Proceso finalizado
- **RECHAZADO**: Cancelado por algún motivo

## ¿Qué hacer si la tabla está vacía?

1. **Verificar que el SP exista:**
   ```sql
   SELECT * FROM sys.procedures WHERE name LIKE '%saldo%'
   ```

2. **Verificar el flujo en Despachos:**
   - Revisa consola al despachar sin stock
   - Debe aparecer: "📝 Insertando notificaciones de saldo pendiente"

3. **Crear datos de prueba:**
   - Usa el script de prueba para insertar manualmente
   - Luego prueba consolidar y cerrar

## Relación con Notificaciones:

- Cuando se crea saldo pendiente → Se inserta notificación
- Cuando llega el stock → Se inserta notificación de STOCK_DISPONIBLE
- Cuando se consolida → Se inserta notificación de CONSOLIDADO

La tabla `LOGISTICA_SaldoPendienteAprobacion` es el corazón del sistema de gestión de saldos pendientes.
