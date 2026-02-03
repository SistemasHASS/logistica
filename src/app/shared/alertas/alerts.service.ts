import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor() { }

  /**
   * Muestra una alerta SweetAlert2.
   * @param title Título de la alerta.
   * @param message Mensaje de la alerta.
   * @param icon Tipo de icono (success, error, warning, info, question).
   */
  showAlertAcept(title: string, message: string, icon: SweetAlertIcon) {
    Swal.fire({
      title: title,
      html: message,
      icon: icon,
      confirmButtonText: 'Aceptar',
      allowOutsideClick: false
    });
  }

  showAlertError(title: string, message: string) {
    Swal.fire({
      title: title,
      html: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      allowOutsideClick: false
    });
  }

  showAlert(title: string, message: string, icon: SweetAlertIcon) {
    Swal.fire({
      title: title,
      html: message,
      icon: icon,
      timer: 2000,
      showConfirmButton: false
    })
  }

  mostrarInfo(mensaje: string) {
    Swal.fire({
      title: 'Información',
      text: mensaje,
      icon: 'info',
      timer: 2000,
      showConfirmButton: false
    });
  }

  mostrarModalCarga() {
    Swal.fire({
      title: 'Espere, por favor...',
      html: ``,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  cerrarModalCarga() {
    Swal.close()
  }

  /**
   * Muestra una alerta de confirmación con botones.
   * @param title Título de la alerta.
   * @param message Mensaje de la alerta.
   * @param icon Tipo de icono.
   * @returns Una promesa que devuelve `true` si se confirma o `false` si se cancela.
   */
  showConfirm(title: string, message: string, icon: SweetAlertIcon): Promise<boolean> {
    return Swal.fire({
      title: title,
      text: message,
      icon: icon,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Aceptar',
      allowOutsideClick: false
    }).then((result) => {
      return result.isConfirmed;
    });
  }

  showPrompt(title: string, message: string): Promise<string | null> {
    return Swal.fire({
      title: title,
      text: message,
      input: 'text',
      inputPlaceholder: 'Escriba aquí...',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Aceptar',
      allowOutsideClick: false,
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un valor.';
        }
        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed) return null;
      return (result.value ?? '').toString();
    });
  }

  /**
   * Muestra una alerta con 3 botones: Confirmar, Denegar y Cancelar.
   * @param title Título de la alerta.
   * @param message Mensaje de la alerta.
   * @param icon Tipo de icono.
   * @param confirmText Texto del botón confirmar.
   * @param denyText Texto del botón denegar.
   * @returns 'confirm' si confirma, 'deny' si deniega, 'cancel' si cancela.
   */
  showConfirmWithCancel(
    title: string,
    message: string,
    icon: SweetAlertIcon,
    confirmText: string = 'Confirmar',
    denyText: string = 'Denegar'
  ): Promise<'confirm' | 'deny' | 'cancel'> {
    return Swal.fire({
      title: title,
      text: message,
      icon: icon,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: confirmText,
      denyButtonText: denyText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#d33',
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        return 'confirm';
      } else if (result.isDenied) {
        return 'deny';
      }
      return 'cancel';
    });
  }
}
