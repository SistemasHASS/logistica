# Flujo Actualizado de Despachos - Gestión de Saldos Pendientes

## Flujo en Despachos:

### 1. **DETECTAR SALDO PENDIENTE**
Cuando se despacha y hay ítems sin stock:

```typescript
// despacho.component.ts
private detectarItemsSaldoPendiente(detalle: any[]): any[] {
  return detalle.filter((d: any) => {
    const solicitada = Number(d.cantidad) || 0;
    const atendida = Number(d.atendida || 0);
    const atender = Number(d.atender || 0);
    const saldo = solicitada - atendida - atender;
    return saldo > 0; // Hay saldo pendiente
  });
}
```

### 2. **NOTIFICAR AL USUARIO**
El sistema debe mostrar un diálogo con las opciones:

```typescript
const opcion = await this.alertService.showFourButtons(
  'Saldo Pendiente Detectado',
  `
  Salida NS: <strong>${numeroDocumento}</strong><br><br>
  Los siguientes ítems tienen saldo pendiente:<br>
  ${listaItems}<br><br>

  <strong>¿Qué desea hacer?</strong><br>
  • Esperar Stock → Notificaré cuando haya stock<br>
  • Consolidar Compra → Generar nuevo requerimiento<br>
  • Cerrar Saldo → Cerrar requerimiento<br>
  • Decidir Después → Dejar pendiente
  `,
  'question',
  'Esperar Stock',
  'Consolidar Compra',
  'Cerrar Saldo',
  'Decidir Después'
);
```

### 3. **OPCIONES DEL USUARIO:**

#### **Opción 1: ESPERAR STOCK**
- **Acción**: Marcar como "ESPERA_STOCK"
- **Notificación**: Se registra para notificar cuando haya stock
- **SP**: `LOGISTICA_confirmarAtencionSaldo`
- **Flujo posterior**: Almacén notificará cuando haya stock disponible

#### **Opción 2: CONSOLIDAR COMPRA**
- **Acción**: Crear ítems en consolidación para compra
- **Service**: `consolidacionService.migrarSaldoDirectoConsolidacion()`
- **SP**: `LOGISTICA_migrarSaldoDirectoConsolidacion`
- **Resultado**: Los ítems aparecen en el módulo de consolidación

#### **Opción 3: CERRAR SALDO**
- **Acción**: Cerrar el saldo y el requerimiento
- **Service**: `saldoService.cerrarSaldo()`
- **SP**: `LOGISTICA_cerrarSaldo`
- **Resultado**: El requerimiento queda cerrado

#### **Opción 4: DECIDIR DESPUÉS**
- **Acción**: No hacer nada, queda pendiente
- **Estado**: Permanece en "PENDIENTE"
- **Flujo**: Se puede decidir en otro momento

## Sistema de Notificaciones de Almacén:

### 1. **Módulo de Notificaciones (Nuevo)**
Crear un componente para gestionar notificaciones:

```typescript
// notification.service.ts
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  // Suscribir usuario a notificaciones de stock
  async suscribirStock(item: string, usuario: string) {
    // Guardar suscripción en BD
  }
  
  // Notificar cuando hay stock
  async notificarStockDisponible(items: string[]) {
    // Enviar notificaciones a usuarios suscritos
  }
}
```

### 2. **SP para Notificaciones**
```sql
-- LOGISTICA_registrarNotificacionStock
CREATE PROCEDURE LOGISTICA_registrarNotificacionStock
    @json NVARCHAR(MAX)
AS
BEGIN
    -- Registrar qué usuarios quieren ser notificados de qué ítems
    INSERT INTO LOGISTICA_NotificacionesStock (iditem, idusuario, fecha_registro)
    VALUES (@iditem, @usuario, GETDATE());
END
GO

-- LOGISTICA_notificarStockDisponible
CREATE PROCEDURE LOGISTICA_notificarStockDisponible
    @json NVARCHAR(MAX)
AS
BEGIN
    -- Obtener usuarios suscritos a estos ítems y crear notificaciones
    SELECT u.usuario, u.email, n.iditem
    FROM LOGISTICA_NotificacionesStock n
    INNER JOIN logistica_usuarios u ON n.idusuario = u.id
    WHERE n.iditem IN (SELECT value FROM OPENJSON(@items))
END
GO
```

### 3. **Flujo de Notificación:**

#### **Cuando Almacén recibe stock:**
1. Almacén actualiza stock en el sistema
2. Sistema verifica ítems con notificaciones pendientes
3. Envía notificación a los usuarios:
   - Email: "Stock disponible para ítem XXX"
   - Notificación en el sistema: "Tienes stock pendiente por atender"
   - Opción de ir directamente a saldo-requerimiento

#### **Componente de Notificaciones:**
```typescript
// notifications.component.ts
export class NotificationsComponent {
  notifications: any[] = [];
  
  async cargarNotificaciones() {
    this.notifications = await this.notificationService.getMisNotificaciones();
  }
  
  async irASaldoPendiente(notificacion: any) {
    // Navegar al módulo de saldo-requerimiento
    this.router.navigate(['/main/saldo-requerimiento']);
  }
}
```

## Flujo Visual Completo:

```
DESPACHO
    ├── Detecta saldo pendiente
    ├── Muestra diálogo de opciones
    ├── Esperar Stock → Notificación futura
    ├── Consolidar → Módulo consolidación
    ├── Cerrar → Cierra requerimiento
    └── Decidir después → Queda pendiente

ALMACÉN
    ├── Recibe stock
    ├── Verifica ítems con espera de stock
    ├── Notifica a usuarios
    └── Marca ítems como disponibles

USUARIO
    ├── Recibe notificación
    ├── Va a saldo-requerimiento
    ├── Atende saldo con nuevo stock
    └── Cierra ciclo

CIERRE SEMANAL
    ├── Revisa saldos antiguos
    ├── Cierra automáticamente los inactivos
    └── Genera reporte
```

## Implementación en el Frontend:

### 1. **Actualizar despacho.component.ts**
```typescript
private async manejarSaldoPendienteGlobal(
  itemsPendientes: any[],
  reqTemp: any,
  numeroDocumento?: string,
) {
  const listaItems = this.construirHtmlListaItems(itemsPendientes);

  const opcion = await this.alertService.showFourButtons(
    'Saldo Pendiente Detectado',
    `
    ${numeroDocumento ? `Salida NS: <strong>${numeroDocumento}</strong><br><br>` : ''}
    Los siguientes ítems tienen saldo pendiente:<br>
    ${listaItems}<br><br>

    <strong>¿Qué desea hacer?</strong><br>
    • <b>Esperar Stock</b>: Te notificaré cuando haya stock disponible<br>
    • <b>Consolidar Compra</b>: Generar requerimiento de compra<br>
    • <b>Cerrar Saldo</b>: Cerrar requerimiento<br>
    • <b>Decidir Después</b>: Dejar pendiente para más tarde
    `,
    'question',
    'Esperar Stock',
    'Consolidar Compra',
    'Cerrar Saldo',
    'Decidir Después'
  );

  switch (opcion) {
    case 'button1': // Esperar Stock
      await this.marcarEsperaStock(itemsPendientes, reqTemp);
      await this.registrarNotificaciones(itemsPendientes);
      break;
      
    case 'button2': // Consolidar Compra
      await this.migrarAConsolidacion(itemsPendientes, reqTemp);
      break;
      
    case 'button3': // Cerrar Saldo
      await this.cerrarSaldoPendiente(itemsPendientes, reqTemp);
      break;
      
    default: // Decidir Después
      // No hacer nada
      break;
  }
}

private async marcarEsperaStock(itemsPendientes: any[], reqTemp: any) {
  for (const item of itemsPendientes) {
    await this.saldoService.confirmarAtencionSaldo(item.idSaldo);
  }
}

private async registrarNotificaciones(itemsPendientes: any[]) {
  for (const item of itemsPendientes) {
    await this.notificationService.suscribirStock(
      item.codigo, 
      this.usuario.documentoidentidad
    );
  }
}
```

### 2. **Crear notification.service.ts**
```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private baseUrl = environment.baseUrl;
  
  constructor(private http: HttpClient) {}
  
  async suscribirStock(iditem: string, usuario: string) {
    const url = `${this.baseUrl}/api/logistica/registrar-notificacion-stock`;
    return firstValueFrom(this.http.post(url, { iditem, usuario }));
  }
  
  async getMisNotificaciones() {
    const url = `${this.baseUrl}/api/logistica/mis-notificaciones`;
    return firstValueFrom(this.http.get(url));
  }
  
  async marcarLeida(idNotificacion: number) {
    const url = `${this.baseUrl}/api/logistica/marcar-notificacion-leida`;
    return firstValueFrom(this.http.post(url, { idNotificacion }));
  }
}
```

## Consideraciones Finales:

1. **Cierre Semanal Automático**:
   - Job que revisa saldos pendientes > 7 días
   - Envía recordatorio antes de cerrar
   - Cierra automáticamente los inactivos

2. **Reportes**:
   - Reporte de saldos pendientes por antigüedad
   - Reporte de notificaciones enviadas
   - Reporte de cierre semanal

3. **Permisos**:
   - Solo usuarios del rol pueden ver sus saldos
   - Almacén puede ver todos los saldos pendientes
   - Jefatura aprueba consolidaciones

Este flujo asegura que los saldos pendientes siempre tengan un seguimiento adecuado y que los usuarios sean notificados oportunamente.
