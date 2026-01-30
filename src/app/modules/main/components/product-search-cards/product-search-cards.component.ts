import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-search-cards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-search-cards.component.html',
  styleUrls: ['./product-search-cards.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProductSearchCardsComponent),
      multi: true,
    },
  ],
})
export class ProductSearchCardsComponent implements ControlValueAccessor {
  @Input() data: any[] = [];
  @Input() optionLabel!: string;
  @Input() valueField!: string;
  @Input() placeholder = 'Buscar...';

  @Output() onSelect = new EventEmitter<any>();

  value: any;

  searchText: string = '';
  showList: boolean = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(value: any) {
    this.value = value;
    this.searchText = value ? value[this.optionLabel] : '';
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  select(item: any) {
    this.value = item[this.valueField];
    this.onChange(this.value);
    this.onSelect.emit(item);
  }

  get filteredItems() {
    if (!this.searchText) return [];
    const text = this.searchText.toLowerCase();
    return this.data.filter(item =>
      item[this.optionLabel]?.toLowerCase()?.includes(text) ||
      item[this.valueField]?.toString().toLowerCase()?.includes(text)
    );
  }

  onTyping() {
    this.showList = this.searchText.length > 0;
  }

  selectItem(item: any) {
    this.searchText = item[this.optionLabel]; // 👉 llena el input con descripción
    // 👉 Devuelve el item COMPLETO al ngModel
    this.value = item;
    this.onChange(this.value);
    this.onSelect.emit(item);                 // 👉 envía el item al padre
    this.showList = false;                    // 👉 oculta el dropdown
  }
}
