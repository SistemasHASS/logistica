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
  transform(idrequerimiento: string | number | null | undefined, requisicionSPRING?: string | null): string {
    // 1) Si viene un correlativo SPRING válido, usarlo (no mutar)
    if (requisicionSPRING && String(requisicionSPRING).trim() !== '') {
      return String(requisicionSPRING).trim();
    }

    // 2) Caso normal: tomar últimos 12 caracteres del idrequerimiento
    if (idrequerimiento === null || idrequerimiento === undefined) return '';
    const valor = String(idrequerimiento).trim();
    if (valor.length <= 12) return valor;
    return valor.slice(-12);
  }
}
