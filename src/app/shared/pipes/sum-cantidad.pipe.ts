import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sumCantidad', standalone: true, pure: false })
export class SumCantidadPipe implements PipeTransform {
  transform(items: any[], campo: string): number {
    if (!items || !campo) return 0;
    return items.reduce((acc, item) => acc + (Number(item[campo]) || 0), 0);
  }
}
