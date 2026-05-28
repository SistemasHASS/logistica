import {
  Component,
  input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-item-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="position-relative item-search-wrapper">
      <div class="input-group input-group-sm">
        <input
          type="text"
          class="form-control form-control-sm"
          [placeholder]="placeholder()"
          [(ngModel)]="busqueda"
          (ngModelChange)="onBusquedaChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          autocomplete="off"
        />
        @if (busqueda) {
          <button class="btn btn-outline-secondary btn-sm" type="button" (click)="limpiar()">
            <i class="bx bx-x"></i>
          </button>
        }
      </div>

      @if (mostrarLista() && sugerencias().length > 0) {
        <div class="item-search-dropdown">
          @for (item of sugerencias(); track item.item) {
            <div class="item-search-option" (mousedown)="seleccionar(item)">
              <div class="d-flex justify-content-between align-items-start">
                <span class="item-codigo text-primary fw-bold">{{ item.item || item.codigo }}</span>
                <span class="item-um text-muted small ms-2">{{ item.unidadCodigo || item.unidadCompra || item.um || 'UND' }}</span>
              </div>
              <div class="item-descripcion text-dark small">{{ item.descripcionLocal || item.descripcion }}</div>
              @if (item.cuentaGasto) {
                <div class="item-cuenta text-success" style="font-size:0.7rem">Cta: {{ item.cuentaGasto }}</div>
              }
            </div>
          }
        </div>
      }

      @if (mostrarLista() && busqueda.length >= 2 && sugerencias().length === 0) {
        <div class="item-search-dropdown">
          <div class="text-muted small p-2 text-center">Sin resultados para "{{ busqueda }}"</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .item-search-wrapper {
      min-width: 200px;
    }
    .item-search-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      min-width: 300px;
      max-height: 280px;
      overflow-y: auto;
      background: #fff;
      border: 1px solid #ced4da;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      z-index: 9999;
      margin-top: 2px;
    }
    .item-search-option {
      padding: 8px 12px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.15s;
    }
    .item-search-option:last-child { border-bottom: none; }
    .item-search-option:hover { background: #f0f7ff; }
    .item-codigo { font-size: 0.8rem; }
    .item-descripcion { font-size: 0.78rem; line-height: 1.3; margin-top: 1px; }
    .item-um { font-size: 0.72rem; }
  `],
})
export class ItemSearchComponent {
  items = input<any[]>([]);
  tipo = input<string>('ITEM');
  placeholder = input('Buscar código o descripción...');

  @Output() itemSelected = new EventEmitter<any>();

  private cdr = inject(ChangeDetectorRef);

  busqueda = '';
  mostrarLista = signal(false);

  itemsFiltradosPorTipo = computed(() => {
    const all = this.items();
    const t = this.tipo().toUpperCase();
    const clasificacion = t === 'ITEM' ? 'I' : 'C';
    return all.filter((i: any) => {
      const tc = (i.itemTipo || i.tipoclasificacion || '').toString().trim().toUpperCase();
      return tc === clasificacion;
    });
  });

  sugerencias = computed(() => {
    const q = this.busqueda?.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    return this.itemsFiltradosPorTipo()
      .filter(
        (i: any) =>
          (i.item || i.codigo || '').toLowerCase().includes(q) ||
          (i.descripcionLocal || i.descripcion || '').toLowerCase().includes(q)
      )
      .slice(0, 12);
  });

  onBusquedaChange(val: string) {
    this.busqueda = val;
    this.mostrarLista.set(val.length >= 1);
    this.cdr.markForCheck();
  }

  onFocus() {
    if (this.busqueda.length >= 1) {
      this.mostrarLista.set(true);
    }
  }

  onBlur() {
    // pequeño delay para permitir el click en la opción
    setTimeout(() => {
      this.mostrarLista.set(false);
      this.cdr.markForCheck();
    }, 180);
  }

  seleccionar(item: any) {
    this.busqueda = '';
    this.mostrarLista.set(false);
    this.itemSelected.emit(item);
    this.cdr.markForCheck();
  }

  limpiar() {
    this.busqueda = '';
    this.mostrarLista.set(false);
    this.cdr.markForCheck();
  }
}
