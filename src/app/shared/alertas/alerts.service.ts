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
      allowOutsideClick: false,
      customClass: { container: 'swal-high-zindex' }
    });
  }

  showAlertError(title: string, message: string) {
    Swal.fire({
      title: title,
      html: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      allowOutsideClick: false,
      customClass: { container: 'swal-high-zindex' }
    });
  }

  showAlert(title: string, message: string, icon: SweetAlertIcon) {
    Swal.fire({
      title: title,
      html: message,
      icon: icon,
      timer: 3000,
      showConfirmButton: false,
      customClass: { container: 'swal-high-zindex' }
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
      // text: message,
      html: message,
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
      html: message,
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
  ): Promise<'button1' | 'button2' | 'button3' | 'button4' | 'cancel'> {
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
            resolve('button4');
          });
        }
      }).then((result) => {
        // Si el usuario cierra el diálogo con ESC o haciendo clic fuera
        if (result.dismiss === Swal.DismissReason.backdrop || result.dismiss === Swal.DismissReason.esc) {
          resolve('cancel');
        }
      });
    });
  }

  /**
   * Muestra un diálogo con formulario personalizado
   * @param title Título del diálogo
   * @param fields Array de campos del formulario
   * @returns Promise con los valores del formulario o null si se cancela
   */
  async showFormDialog(title: string, fields: Array<{
    label: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'checkbox';
    required?: boolean;
    defaultValue?: any;
  }>): Promise<{ [key: string]: any } | null> {
    let html = '<div style="text-align: left;">';
    
    fields.forEach(field => {
      const required = field.required ? 'required' : '';
      const value = field.defaultValue || '';
      
      if (field.type === 'checkbox') {
        const checked = value ? 'checked' : '';
        html += `
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">${field.label}:</label>
            <input type="checkbox" id="${field.name}" name="${field.name}" ${checked} style="width: 20px; height: 20px;">
          </div>
        `;
      } else if (field.type === 'date') {
        html += `
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">${field.label}:</label>
            <input type="date" id="${field.name}" name="${field.name}" value="${value}" ${required} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
        `;
      } else {
        html += `
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">${field.label}:</label>
            <input type="${field.type}" id="${field.name}" name="${field.name}" value="${value}" ${required} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
        `;
      }
    });
    
    html += '</div>';

    const result = await Swal.fire({
      title: title,
      html: html,
      icon: 'info',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Aceptar',
      allowOutsideClick: false,
      preConfirm: () => {
        const values: { [key: string]: any } = {};
        let isValid = true;
        
        fields.forEach(field => {
          const element = document.getElementById(field.name) as HTMLInputElement;
          if (element) {
            if (field.type === 'checkbox') {
              values[field.name] = element.checked;
            } else {
              values[field.name] = element.value;
              
              if (field.required && !element.value) {
                Swal.showValidationMessage(`El campo "${field.label}" es requerido`);
                isValid = false;
              }
            }
          }
        });
        
        return isValid ? values : Swal.DismissReason.cancel;
      }
    });

    if (result.isConfirmed) {
      return result.value;
    }
    
    return null;
  }
}
