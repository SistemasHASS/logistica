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
      html: message,
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

  /**
   * Muestra una alerta con 3 botones personalizados.
   * @param title Título de la alerta.
   * @param message Mensaje de la alerta.
   * @param icon Tipo de icono.
   * @param button1Text Texto del primer botón (izquierda).
   * @param button2Text Texto del segundo botón (centro).
   * @param button3Text Texto del tercer botón (derecha).
   * @returns 'button1', 'button2' o 'button3' según el botón presionado.
   */
  showThreeButtons(
    title: string,
    message: string,
    icon: SweetAlertIcon,
    button1Text: string,
    button2Text: string,
    button3Text: string
  ): Promise<'button1' | 'button2' | 'button3'> {
    return Swal.fire({
      title: title,
      html: message,
      icon: icon,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: button1Text,
      denyButtonText: button2Text,
      cancelButtonText: button3Text,
      confirmButtonColor: '#28a745',
      denyButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        return 'button1';
      } else if (result.isDenied) {
        return 'button2';
      }
      return 'button3';
    });
  }

  showFourButtons(
    title: string,
    message: string,
    icon: SweetAlertIcon,
    button1Text: string,
    button2Text: string,
    button3Text: string,
    button4Text: string = 'Cancelar'
  ): Promise<'button1' | 'button2' | 'button3' | 'cancel'> {
    return new Promise((resolve) => {
      Swal.fire({
        title: title,
        html: `
          ${message}
          <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button id="swal-button1" class="swal2-confirm swal2-styled" style="background-color: #28a745;">${button1Text}</button>
            <button id="swal-button2" class="swal2-deny swal2-styled" style="background-color: #3085d6;">${button2Text}</button>
            <button id="swal-button3" class="swal2-cancel swal2-styled" style="background-color: #d33;">${button3Text}</button>
            <button id="swal-button4" class="swal2-cancel swal2-styled" style="background-color: #6c757d;">${button4Text}</button>
          </div>
        `,
        icon: icon,
        showConfirmButton: false,
        showDenyButton: false,
        showCancelButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          const button1 = document.getElementById('swal-button1');
          const button2 = document.getElementById('swal-button2');
          const button3 = document.getElementById('swal-button3');
          const button4 = document.getElementById('swal-button4');
          
          button1?.addEventListener('click', () => {
            Swal.close();
            resolve('button1');
          });
          button2?.addEventListener('click', () => {
            Swal.close();
            resolve('button2');
          });
          button3?.addEventListener('click', () => {
            Swal.close();
            resolve('button3');
          });
          button4?.addEventListener('click', () => {
            Swal.close();
            resolve('cancel');
          });
        }
      });
    });
  }
}
