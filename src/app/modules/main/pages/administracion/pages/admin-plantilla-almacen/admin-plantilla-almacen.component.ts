import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PlantillaAlmacen {
  id?: number;
  tipoDocumento: 'NI' | 'NS';
  tituloDocumento: string;
  empresa: string;
  mostrarUbicacionFisica: boolean;
  mostrarCodInterno: boolean;
  mostrarStockActual: boolean;
  mostrarCCostos: boolean;
  mostrarCantidadPendiente: boolean;
  mostrarCantidadCompra: boolean;
  firmante1: string;
  firmante2: string;
  piePagina: string;
  estado: 'ACTIVO' | 'INACTIVO';
  esDefault: boolean;
}

@Component({
  selector: 'app-admin-plantilla-almacen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-plantilla-almacen.component.html',
  styleUrls: ['./admin-plantilla-almacen.component.scss'],
})
export class AdminPlantillaAlmacenComponent implements OnInit {

  plantillas: PlantillaAlmacen[] = [
    {
      id: 1,
      tipoDocumento: 'NI',
      tituloDocumento: 'Nota de Ingreso',
      empresa: 'Hass Perú',
      mostrarUbicacionFisica: true,
      mostrarCodInterno: true,
      mostrarStockActual: true,
      mostrarCCostos: false,
      mostrarCantidadPendiente: true,
      mostrarCantidadCompra: true,
      firmante1: 'ALMACEN',
      firmante2: 'AUTORIZA',
      piePagina: '',
      estado: 'ACTIVO',
      esDefault: true,
    },
    {
      id: 2,
      tipoDocumento: 'NS',
      tituloDocumento: 'Nota de Salida',
      empresa: 'Hass Perú',
      mostrarUbicacionFisica: true,
      mostrarCodInterno: true,
      mostrarStockActual: true,
      mostrarCCostos: true,
      mostrarCantidadPendiente: true,
      mostrarCantidadCompra: true,
      firmante1: 'ALMACEN',
      firmante2: 'RECIBI CONFORME',
      piePagina: '',
      estado: 'ACTIVO',
      esDefault: true,
    },
  ];

  tiposDocumento = [
    { value: 'NI', label: 'Nota de Ingreso (NI)' },
    { value: 'NS', label: 'Nota de Salida (NS)' },
  ];

  empresas = ['Hass Perú', 'Hass Agro', 'Hass International'];

  showModal = false;
  isEdit = false;
  previewTipo: 'NI' | 'NS' = 'NI';
  mensajeGuardado = '';

  form: PlantillaAlmacen = this.getFormDefault();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  private getFormDefault(): PlantillaAlmacen {
    return {
      tipoDocumento: 'NI',
      tituloDocumento: 'Nota de Ingreso',
      empresa: 'Hass Perú',
      mostrarUbicacionFisica: true,
      mostrarCodInterno: true,
      mostrarStockActual: true,
      mostrarCCostos: false,
      mostrarCantidadPendiente: true,
      mostrarCantidadCompra: true,
      firmante1: 'ALMACEN',
      firmante2: 'AUTORIZA',
      piePagina: '',
      estado: 'ACTIVO',
      esDefault: false,
    };
  }

  openCreate() {
    this.isEdit = false;
    this.form = this.getFormDefault();
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEdit(p: PlantillaAlmacen) {
    this.isEdit = true;
    this.form = { ...p };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
  }

  onTipoDocumentoChange() {
    if (this.form.tipoDocumento === 'NI') {
      this.form.tituloDocumento = 'Nota de Ingreso';
      this.form.firmante1 = 'ALMACEN';
      this.form.firmante2 = 'AUTORIZA';
      this.form.mostrarCCostos = false;
      this.form.mostrarCantidadCompra = true;
    } else {
      this.form.tituloDocumento = 'Nota de Salida';
      this.form.firmante1 = 'ALMACEN';
      this.form.firmante2 = 'RECIBI CONFORME';
      this.form.mostrarCCostos = true;
      this.form.mostrarCantidadCompra = false;
    }
  }

  setDefault(p: PlantillaAlmacen) {
    this.plantillas
      .filter(pl => pl.tipoDocumento === p.tipoDocumento && pl.empresa === p.empresa)
      .forEach(pl => pl.esDefault = false);
    p.esDefault = true;
  }

  toggleEstado(p: PlantillaAlmacen) {
    p.estado = p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  }

  save() {
    if (!this.form.tituloDocumento.trim()) return;
    if (this.form.esDefault) {
      this.plantillas
        .filter(p => p.tipoDocumento === this.form.tipoDocumento && p.empresa === this.form.empresa)
        .forEach(p => p.esDefault = false);
    }
    if (this.isEdit) {
      const idx = this.plantillas.findIndex(p => p.id === this.form.id);
      if (idx >= 0) this.plantillas[idx] = { ...this.form };
    } else {
      this.form.id = Date.now();
      this.plantillas.push({ ...this.form });
    }

    const key = `plantilla_almacen_${this.form.tipoDocumento.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(this.form));

    this.mensajeGuardado = 'Plantilla guardada correctamente.';
    setTimeout(() => this.mensajeGuardado = '', 3000);
    this.closeModal();
  }

  getColumnasBadge(p: PlantillaAlmacen): string[] {
    const cols: string[] = ['#', 'Ítem', 'Cnd.', 'Descripción'];
    if (p.mostrarUbicacionFisica) cols.push('Ubic. Física');
    if (p.mostrarCodInterno) cols.push('COD.INT.');
    cols.push('Unidad');
    if (p.tipoDocumento === 'NI') {
      cols.push('Cant. Ingreso');
      if (p.mostrarCantidadCompra) cols.push('Cant. Compra');
      if (p.mostrarCantidadPendiente) cols.push('Cant. Pendiente');
    } else {
      cols.push('Cant. Salida');
      cols.push('Cant. Requerida');
      if (p.mostrarCantidadPendiente) cols.push('Cant. Pendiente');
    }
    if (p.mostrarStockActual) cols.push('Stock Actual');
    cols.push('C.Costos');
    return cols;
  }

  static loadPlantilla(tipo: 'NI' | 'NS'): PlantillaAlmacen | null {
    const raw = localStorage.getItem(`plantilla_almacen_${tipo.toLowerCase()}`);
    return raw ? JSON.parse(raw) : null;
  }
}
