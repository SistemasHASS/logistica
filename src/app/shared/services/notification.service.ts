import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface Notificacion {
  id: string;
  tipo: 'success' | 'info' | 'warning' | 'error';
  titulo: string;
  mensaje: string;
  duracion?: number; // milisegundos, si no se especifica no se cierra automáticamente
  accion?: {
    texto: string;
    handler: () => void;
  };
  fecha: Date;
  leida: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificaciones: Notificacion[] = [];
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  public notificaciones$: Observable<Notificacion[]> = this.notificacionesSubject.asObservable();

  constructor(private router: Router) {
    this.cargarNotificacionesGuardadas();
  }

  /**
   * Muestra una notificación flotante
   */
  show(notificacion: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) {
    const nuevaNotificacion: Notificacion = {
      ...notificacion,
      id: this.generarId(),
      fecha: new Date(),
      leida: false
    };

    this.notificaciones.unshift(nuevaNotificacion);
    this.actualizarSubject();
    this.guardarEnLocalStorage();

    // Si tiene duración, cerrar automáticamente
    if (nuevaNotificacion.duracion && nuevaNotificacion.duracion > 0) {
      setTimeout(() => {
        this.remove(nuevaNotificacion.id);
      }, nuevaNotificacion.duracion);
    }

    return nuevaNotificacion.id;
  }

  /**
   * Métodos de conveniencia para cada tipo de notificación
   */
  success(titulo: string, mensaje: string, duracion: number = 5000) {
    return this.show({
      tipo: 'success',
      titulo,
      mensaje,
      duracion
    });
  }

  info(titulo: string, mensaje: string, duracion?: number) {
    return this.show({
      tipo: 'info',
      titulo,
      mensaje,
      duracion
    });
  }

  warning(titulo: string, mensaje: string, duracion?: number) {
    return this.show({
      tipo: 'warning',
      titulo,
      mensaje,
      duracion
    });
  }

  error(titulo: string, mensaje: string, duracion?: number) {
    return this.show({
      tipo: 'error',
      titulo,
      mensaje,
      duracion
    });
  }

  /**
   * Notificación de stock disponible con acción para ir a saldo-requerimiento
   */
  stockDisponible(itemCodigo: string, itemDescripcion: string, duracion: number = 10000) {
    return this.show({
      tipo: 'success',
      titulo: '¡Stock Disponible! 📦',
      mensaje: `El item <strong>${itemCodigo}</strong> - ${itemDescripcion} ya tiene stock disponible.`,
      duracion,
      accion: {
        texto: 'Ver Saldo Pendiente',
        handler: () => {
          // Navegar al módulo de saldo-requerimiento usando router
          this.router.navigate(['/main/saldo-requerimiento'], { 
            queryParams: { stock: 'disponible', item: itemCodigo }
          });
        }
      }
    });
  }

  /**
   * Elimina una notificación
   */
  remove(id: string) {
    const index = this.notificaciones.findIndex(n => n.id === id);
    if (index > -1) {
      this.notificaciones.splice(index, 1);
      this.actualizarSubject();
      this.guardarEnLocalStorage();
    }
  }

  /**
   * Marca una notificación como leída
   */
  marcarComoLeida(id: string) {
    const notificacion = this.notificaciones.find(n => n.id === id);
    if (notificacion) {
      notificacion.leida = true;
      this.actualizarSubject();
      this.guardarEnLocalStorage();
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  marcarTodasComoLeidas() {
    this.notificaciones.forEach(n => n.leida = true);
    this.actualizarSubject();
    this.guardarEnLocalStorage();
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  getNoLeidasCount(): number {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  /**
   * Limpia todas las notificaciones
   */
  limpiarTodas() {
    this.notificaciones = [];
    this.actualizarSubject();
    this.guardarEnLocalStorage();
  }

  /**
   * Actualiza el BehaviorSubject
   */
  private actualizarSubject() {
    this.notificacionesSubject.next([...this.notificaciones]);
  }

  /**
   * Genera un ID único para la notificación
   */
  private generarId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Guarda las notificaciones no leídas en localStorage
   */
  private guardarEnLocalStorage() {
    const noLeidas = this.notificaciones.filter(n => !n.leida);
    try {
      localStorage.setItem('notificaciones_pendientes', JSON.stringify(noLeidas));
    } catch (e) {
      console.warn('No se pudo guardar notificaciones en localStorage:', e);
    }
  }

  /**
   * Carga notificaciones guardadas desde localStorage
   */
  private cargarNotificacionesGuardadas() {
    try {
      const guardadas = localStorage.getItem('notificaciones_pendientes');
      if (guardadas) {
        const notificacionesGuardadas: Notificacion[] = JSON.parse(guardadas);
        // Restaurar fechas como objetos Date
        notificacionesGuardadas.forEach(n => n.fecha = new Date(n.fecha));
        this.notificaciones = notificacionesGuardadas;
        this.actualizarSubject();
      }
    } catch (e) {
      console.warn('No se pudo cargar notificaciones desde localStorage:', e);
    }
  }
}
