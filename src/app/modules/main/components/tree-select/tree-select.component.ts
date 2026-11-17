import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  forwardRef, ChangeDetectorRef, ChangeDetectionStrategy, ElementRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface ModuloNode {
  key: string;
  label: string;
  children: TurnoNode[];
}

export interface TurnoNode {
  key: string;
  label: string;
}

@Component({
  selector: 'app-tree-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tree-select.component.html',
  styleUrls: ['./tree-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TreeSelectComponent),
      multi: true
    }
  ]
})
export class TreeSelectComponent implements OnChanges, ControlValueAccessor {
  @Input() options: ModuloNode[] = [];
  @Input() placeholder: string = 'Seleccione una opción';
  @Input() singleSelection: boolean = false;
  @Output() selectionChange = new EventEmitter<Set<string>>();

  selected = new Set<string>();
  expanded = new Set<string>();
  isOpen = false;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef, private elementRef: ElementRef) {}

  readonly MAX_VISIBLE_CHIPS = 3;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.onTouched();
      this.cdr.markForCheck();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options']) {
      this.expanded = new Set();
      this.cdr.markForCheck();
    }
  }

  writeValue(value: any): void {
    if (this.singleSelection) {
      this.selected = typeof value === 'string' && value ? new Set([value]) : new Set();
    } else if (value && typeof value === 'object') {
      if (value instanceof Set) {
        this.selected = new Set(value);
      } else {
        this.selected = new Set(Object.keys(value));
      }
    } else {
      this.selected = new Set();
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) this.onTouched();
    this.cdr.markForCheck();
  }

  toggleExpand(key: string) {
    if (this.expanded.has(key)) {
      this.expanded.delete(key);
    } else {
      this.expanded.add(key);
    }
    this.cdr.markForCheck();
  }

  isExpanded(key: string): boolean {
    return this.expanded.has(key);
  }

  toggleTurno(key: string) {
    if (this.singleSelection) {
      if (this.selected.has(key)) {
        this.selected = new Set();
      } else {
        this.selected = new Set([key]);
      }
      this.emit();
      return;
    }
    if (this.selected.has(key)) {
      this.selected.delete(key);
    } else {
      this.selected.add(key);
    }
    this.emit();
  }

  toggleModulo(modulo: ModuloNode) {
    if (this.singleSelection) {
      this.toggleExpand(modulo.key);
      return;
    }
    const allSelected = this.isModuloFull(modulo);
    modulo.children.forEach(t => {
      if (allSelected) {
        this.selected.delete(t.key);
      } else {
        this.selected.add(t.key);
      }
    });
    this.emit();
  }

  isModuloFull(modulo: ModuloNode): boolean {
    return modulo.children.length > 0 && modulo.children.every(t => this.selected.has(t.key));
  }

  isModuloPartial(modulo: ModuloNode): boolean {
    const count = modulo.children.filter(t => this.selected.has(t.key)).length;
    return count > 0 && count < modulo.children.length;
  }

  getSelectedChips(): { key: string; label: string }[] {
    const chips: { key: string; label: string }[] = [];
    for (const modulo of this.options) {
      for (const turno of modulo.children) {
        if (this.selected.has(turno.key)) {
          chips.push({ key: turno.key, label: turno.label });
        }
      }
    }
    return chips;
  }

  removeChip(key: string) {
    this.selected.delete(key);
    this.emit();
  }

  clearAll(event: Event) {
    event.stopPropagation();
    this.selected = new Set();
    this.emit();
  }

  private emit() {
    if (this.singleSelection) {
      const first = this.selected.values().next().value;
      this.onChange(first ?? '');
      this.selectionChange.emit(this.selected);
      this.cdr.markForCheck();
      return;
    }
    const value: { [key: string]: { checked: boolean; partialChecked: boolean } } = {};
    this.selected.forEach(k => { value[k] = { checked: true, partialChecked: false }; });
    this.onChange(value);
    this.selectionChange.emit(this.selected);
    this.cdr.markForCheck();
  }
}
