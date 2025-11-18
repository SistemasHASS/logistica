import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Item } from '@/app/shared/interfaces/Tables';
import * as XLSX from 'xlsx';
// import bootstrap from 'bootstrap';

@Component({
  selector: 'app-maestros-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maestros-items.component.html',
  styleUrls: ['./maestros-items.component.scss'],
})
export class MaestrosItemsComponent implements OnInit {
  @ViewChild('modalEdicion') modalEdicion!: ElementRef;

  item: Item = {
    id: 0,
    codigo: '',
    descripcionLocal: '',
    descripcionCompleta: '',
    unidadMedida: '',
    unidadCompra: '',
    unidadEmbalaje: '',
    compania: '',
    estado: 'Activo',
    numeracion: '',
    tipoclasificacion: 'ITEM',
  };
  listaItems: Item[] = [];

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService
  ) {}

  async ngOnInit() {
    this.listaItems = await this.dexieService.showItems();
  }

  nuevo() {
    this.item = {
      id: 0,
      codigo: '',
      descripcionLocal: '',
      descripcionCompleta: '',
      unidadMedida: '',
      unidadCompra: '',
      unidadEmbalaje: '',
      compania: '',
      estado: 'Activo',
      numeracion: '',
      tipoclasificacion: 'ITEM',
    };
  }

  editar(data: Item) {
    this.item = { ...data };
    // new bootstrap.Modal(this.modalEdicion.nativeElement).show();
    this.modalEdicion.nativeElement.show();
  }

  async guardar() {
    await this.dexieService.saveItem(this.item);
    this.listaItems = await this.dexieService.showItems();
    this.alertService.showAlertAcept(
      'Item guardado correctamente',
      'Item',
      'success'
    );
  }

  openImportModal() {
    const modal = document.getElementById('importModal');
    (window as any).bootstrap.Modal.getOrCreateInstance(modal).show();
  }

  downloadTemplate() {
    const plantilla = [
      {
        codigo: '',
        descripcionLocal: '',
        descripcionCompleta: '',
        unidadMedida: '',
        unidadCompra: '',
        unidadEmbalaje: '',
        compania: '',
        estado: '',
      },
    ];

    // Crear hoja
    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        'codigo',
        'descripcionLocal',
        'descripcionCompleta',
        'unidadMedida',
        'unidadCompra',
        'unidadEmbalaje',
        'compania',
        'estado',
      ],
    ]);

    // Crear libro
    const workbook = XLSX.utils.book_new();

    // Agregar hoja
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    // Descargar
    XLSX.writeFile(workbook, 'plantilla_items.xlsx');
  }
}
