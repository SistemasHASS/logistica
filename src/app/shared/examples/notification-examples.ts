import { NotificationService } from '../services/notification.service';

/**
 * Ejemplos de cómo usar las notificaciones en los componentes
 */

// Ejemplo para DespachoComponent
export class DespachoNotificationExample {
  constructor(private notificationService: NotificationService) {}

  // Cuando se aprueba un despacho
  onDespachoAprobado(numeroDespacho: string) {
    this.notificationService.success(
      'Despacho Aprobado',
      `El despacho ${numeroDespacho} ha sido aprobado exitosamente`
    );
  }

  // Cuando se rechaza un despacho
  onDespachoRechazado(numeroDespacho: string, motivo: string) {
    this.notificationService.warning(
      'Despacho Rechazado',
      `El despacho ${numeroDespacho} fue rechazado: ${motivo}`
    );
  }

  // Cuando hay error al guardar
  onErrorGuardar(error: string) {
    this.notificationService.error(
      'Error al Guardar',
      `No se pudo guardar el despacho: ${error}`
    );
  }
}

// Ejemplo para SaldoRequerimientoComponent
export class SaldoRequerimientoNotificationExample {
  constructor(private notificationService: NotificationService) {}

  // Cuando se crea una consolidación
  onConsolidacionCreada(codigo: string) {
    this.notificationService.success(
      'Consolidación Creada',
      `Se ha creado la consolidación ${codigo} exitosamente`,
      8000
    );
  }

  // Cuando se anula un ítem
  onItemAnulado(descripcion: string) {
    this.notificationService.info(
      'Ítem Anulado',
      `El ítem "${descripcion}" ha sido anulado`
    );
  }

  // Cuando se aprueba un saldo
  onSaldoAprobado() {
    this.notificationService.success(
      'Saldo Aprobado',
      'El saldo pendiente ha sido aprobado correctamente'
    );
  }

  // Notificación de stock disponible (con acción)
  onStockDisponible(itemCodigo: string, itemDescripcion: string) {
    this.notificationService.stockDisponible(itemCodigo, itemDescripcion);
  }
}

// Uso en componentes:
/*
1. Importar el servicio:
import { NotificationService } from '@/app/shared/services/notification.service';

2. Inyectar en el constructor:
constructor(
  private notificationService: NotificationService
) {}

3. Usar los métodos:
this.notificationService.success('Título', 'Mensaje');
this.notificationService.error('Error', 'Mensaje de error');
this.notificationService.warning('Advertencia', 'Mensaje');
this.notificationService.info('Info', 'Mensaje');
this.notificationService.stockDisponible('COD001', 'Descripción del item');
*/
