import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea el número de requerimiento mostrando solo los últimos 12 caracteres
 * del `idrequerimiento`, que corresponden al timestamp interno (YYMMDDhhmmss).
 *
 * Reglas (acordadas con el módulo Requerimientos → método `obtenerIdReq`):
 *  - Si recibe vacío / null / undefined → devuelve cadena vacía.
 *  - Si la cadena tiene 12 caracteres o menos → devuelve la cadena tal cual.
 *  - En cualquier otro caso → devuelve los últimos 12 caracteres.
 *
 * Si se pasa una `RequisicionNumero` (string SPRING) y `useRequisicion = true`,
 * retorna ese valor sin modificar (caso despachos / aprobaciones por SPRING).
 *
 * @example
 *   {{ '14779290020260420043324' | numeroRequerimiento }}
 *   // => '260420043324'
 *
 *   {{ req.idrequerimiento | numeroRequerimiento : req.RequisicionNumero }}
 *   // Si RequisicionNumero existe lo prioriza; si no, formatea idrequerimiento
 */
@Pipe({
  name: 'numeroRequerimiento',
  standalone: true,
  pure: true,
})
export class NumeroRequerimientoPipe implements PipeTransform {
  transform(idrequerimiento: string | number | null | undefined, requisicionSPRING?: string | null, mobile: boolean = false): string {
    // 1) Si viene un correlativo SPRING válido, usarlo
    if (requisicionSPRING && String(requisicionSPRING).trim() !== '') {
      const spring = String(requisicionSPRING).trim();
      return mobile ? this.cortoMobile(spring) : spring;
    }

    // 2) Caso normal: tomar últimos 12 caracteres del idrequerimiento
    if (idrequerimiento === null || idrequerimiento === undefined) return '';
    const valor = String(idrequerimiento).trim();
    const formateado = valor.length <= 12 ? valor : valor.slice(-12);
    return mobile ? this.cortoMobile(formateado) : formateado;
  }

  private cortoMobile(valor: string): string {
    // Vista móvil: mostrar exactamente los últimos 4 caracteres
    if (valor.length <= 4) return valor;
    return valor.slice(-4);
  }
}
