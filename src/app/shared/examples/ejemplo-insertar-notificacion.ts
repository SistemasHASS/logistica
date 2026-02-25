import { NotificacionApiService } from '../services/notificacion-api.service';

/**
 * Ejemplo de cómo insertar una notificación cuando hay stock disponible
 */
export class EjemploNotificacion {
  constructor(private notificacionApi: NotificacionApiService) {}

  async notificarStockDisponible(iditem: string, descripcion: string, idrequerimiento?: number): Promise<void> {
    if (!idrequerimiento) {
      console.error('Error: idrequerimiento es requerido para insertarNotificacionStock');
      return;
    }

    const exito = await this.notificacionApi.insertarNotificacionStock({
      iditem,
      itemDescripcion: descripcion,
      mensaje: `El item ${iditem} - ${descripcion} ahora tiene stock disponible y puede ser despachado.`,
      idrequerimiento: idrequerimiento
    });

    if (exito) {
      console.log('Notificación insertada correctamente');
    } else {
      console.error('Error al insertar notificación');
    }
  }

  async notificarSaldoPendiente(iditem: string, descripcion: string, idrequerimiento?: number): Promise<void> {
    if (!idrequerimiento) {
      console.error('Error: idrequerimiento es requerido para insertarNotificacionStock');
      return;
    }

    const exito = await this.notificacionApi.insertarNotificacionStock({
      iditem,
      itemDescripcion: descripcion,
      mensaje: `El item ${iditem} - ${descripcion} ha quedado en saldo pendiente por falta de stock.`,
      idrequerimiento: idrequerimiento
    });

    if (exito) {
      console.log('Notificación de saldo pendiente insertada');
    }
  }

  /**
   * Nuevo método para registrar notificación de almacén con DNI
   */
  async notificarSaldoPendienteAlmacen(iditem: string, descripcion: string, idrequerimiento: string) {
    const exito = await this.notificacionApi.registrarNotificacionAlmacen({
      iditem,
      id_dreq: idrequerimiento,
      itemDescripcion: descripcion,
      mensaje: `El item ${iditem} - ${descripcion} ha quedado en saldo pendiente por falta de stock. Requerimiento: ${idrequerimiento}.`,
      tipo_notificacion: 'SALDO_PENDIENTE'
    });

    if (exito) {
      console.log('Notificación de almacén registrada correctamente');
    } else {
      console.error('Error al registrar notificación de almacén');
    }
  }
}

/**
 * Ejemplo de uso en DespachoComponent cuando se crea saldo pendiente:
 * 
 * async crearSaldoPendiente() {
 *   // ... lógica para crear saldo pendiente ...
 *   
 *   // Insertar notificación (método antiguo)
 *   const notificacion = new EjemploNotificacion(this.notificacionApi);
 *   await notificacion.notificarSaldoPendiente(
 *     this.selected.codigo,
 *     this.selected.descripcion,
 *     this.selected.id
 *   );
 *   
 *   // Insertar notificación (nuevo método con DNI)
 *   await notificacion.notificarSaldoPendienteAlmacen(
 *     this.selected.codigo,
 *     this.selected.descripcion,
 *     this.selected.numero
 *   );
 * }
 */
