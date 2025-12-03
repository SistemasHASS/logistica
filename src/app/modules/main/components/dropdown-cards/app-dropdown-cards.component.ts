import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent } from '../dropdown/dropdown.component'; 

@Component({
  selector: 'app-dropdown-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './app-dropdown-cards.component.html',
  styleUrls: ['./app-dropdown-cards.component.scss'],
})
export class AppDropdownCardsComponent implements OnInit {

  @Input() data: any[] = [];
  @Input() optionLabel: string = 'descripcion';
  @Input() valueField: string = 'codigo';

  @Input() placeholder: string = 'Buscar...';

  @Output() onSelect = new EventEmitter<any>();

  busqueda = '';
  resultados: any[] = [];
  mostrarPanel = false;

  ngOnInit() {}

  filtrar() {
    const txt = this.busqueda.toLowerCase();
    
    this.resultados = this.data.filter(item =>
      item[this.optionLabel].toLowerCase().includes(txt) ||
      item[this.valueField].toString().includes(txt)
    );

    this.mostrarPanel = this.busqueda.length > 0;
  }

  seleccionar(item: any) {
    this.busqueda = item[this.optionLabel];
    this.mostrarPanel = false;
    this.onSelect.emit(item);
  }
}
