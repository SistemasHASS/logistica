import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea un nombre completo para vista móvil:
 * Primer Nombre + Apellido Paterno + Inicial de Apellido Materno.
 *
 * Ejemplo:
 *   'Claudia Mercedes Jimenez Rodriguez' -> 'Claudia Jimenez R.'
 *   'Luis Fernando Lamela Cubas' -> 'Luis Lamela C.'
 */
@Pipe({
  name: 'nombreCorto',
  standalone: true,
  pure: true,
})
export class NombreCortoPipe implements PipeTransform {
  transform(nombre: string | null | undefined): string {
    if (!nombre) return '';
    const partes = String(nombre).trim().split(/\s+/).filter(p => p.length > 0);
    if (partes.length <= 2) return partes.join(' ');

    const primerNombre = partes[0];
    const apellidoPaterno = partes[partes.length - 2];
    const apellidoMaterno = partes[partes.length - 1];
    return `${primerNombre} ${apellidoPaterno} ${apellidoMaterno.charAt(0).toUpperCase()}.`;
  }
}
