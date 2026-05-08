import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPlantillaPdfService } from '../../services/admin-plantilla-pdf.service';

interface PlantillaPdf {
  id?: number;
  idEmpresa: string;
  empresa: string;
  tipoDocumento: string;
  logoBase64: string;
  logoNombre: string;
  colorPrimario: string;
  colorSecundario: string;
  tituloDocumento: string;
  textoEncabezado: string;
  textoPie: string;
  incluirFirmaAutorizador: boolean;
  nombreFirmante1: string;
  cargoFirmante1: string;
  nombreFirmante2: string;
  cargoFirmante2: string;
  incluirSello: boolean;
  mostrarCondicionesPago: boolean;
  mostrarDatosProveedor: boolean;
  estado: string;
  esDefault: boolean;
}

@Component({
  selector: 'app-admin-plantilla-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-plantilla-pdf.component.html',
  styleUrls: ['./admin-plantilla-pdf.component.scss'],
})
export class AdminPlantillaPdfComponent implements OnInit {

  plantillas: PlantillaPdf[] = [
    {
      id: 1, idEmpresa: 'EMP001', empresa: 'Hass Perú', tipoDocumento: 'OC',
      logoBase64: '', logoNombre: '',
      colorPrimario: '#1a4f2a', colorSecundario: '#f5f5f5',
      tituloDocumento: 'ORDEN DE COMPRA',
      textoEncabezado: 'Hass Perú S.A.C. | RUC: 20123456789 | Av. Los Frutales 123, Lima',
      textoPie: 'Documento generado electrónicamente por el Sistema de Logística. Válido sin firma física.',
      incluirFirmaAutorizador: true,
      nombreFirmante1: 'Jefe de Logística', cargoFirmante1: 'Jefatura de Logística',
      nombreFirmante2: 'Gerente de Operaciones', cargoFirmante2: 'Gerencia de Operaciones',
      incluirSello: false,
      mostrarCondicionesPago: true, mostrarDatosProveedor: true,
      estado: 'ACTIVO', esDefault: true
    },
    {
      id: 2, idEmpresa: 'EMP001', empresa: 'Hass Perú', tipoDocumento: 'OS',
      logoBase64: '', logoNombre: '',
      colorPrimario: '#1a4f2a', colorSecundario: '#f5f5f5',
      tituloDocumento: 'ORDEN DE SERVICIO',
      textoEncabezado: 'Hass Perú S.A.C. | RUC: 20123456789 | Av. Los Frutales 123, Lima',
      textoPie: 'Documento generado electrónicamente por el Sistema de Logística.',
      incluirFirmaAutorizador: true,
      nombreFirmante1: 'Jefe de Logística', cargoFirmante1: 'Jefatura de Logística',
      nombreFirmante2: '', cargoFirmante2: '',
      incluirSello: false,
      mostrarCondicionesPago: true, mostrarDatosProveedor: true,
      estado: 'ACTIVO', esDefault: true
    },
  ];

  showModal = false;
  showPreview = false;
  isEdit = false;
  uploadingLogo = false;

  empresas = ['Hass Perú', 'Hass Agro', 'Hass International'];
  tiposDocumento = [
    { value: 'OC', label: 'Orden de Compra (OC)' },
    { value: 'OS', label: 'Orden de Servicio (OS)' },
  ];

  form: PlantillaPdf = {
    idEmpresa: 'EMP001', empresa: 'Hass Perú', tipoDocumento: 'OC',
    logoBase64: '', logoNombre: '',
    colorPrimario: '#1a4f2a', colorSecundario: '#f5f5f5',
    tituloDocumento: 'ORDEN DE COMPRA',
    textoEncabezado: '', textoPie: '',
    incluirFirmaAutorizador: true,
    nombreFirmante1: '', cargoFirmante1: '',
    nombreFirmante2: '', cargoFirmante2: '',
    incluirSello: false,
    mostrarCondicionesPago: true, mostrarDatosProveedor: true,
    estado: 'ACTIVO', esDefault: false
  };

  constructor(private svc: AdminPlantillaPdfService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  openCreate() {
    this.isEdit = false;
    this.form = {
      idEmpresa: 'EMP001', empresa: 'Hass Perú', tipoDocumento: 'OC',
      logoBase64: '', logoNombre: '',
      colorPrimario: '#1a4f2a', colorSecundario: '#f5f5f5',
      tituloDocumento: 'ORDEN DE COMPRA',
      textoEncabezado: '', textoPie: '',
      incluirFirmaAutorizador: true,
      nombreFirmante1: '', cargoFirmante1: '',
      nombreFirmante2: '', cargoFirmante2: '',
      incluirSello: false,
      mostrarCondicionesPago: true, mostrarDatosProveedor: true,
      estado: 'ACTIVO', esDefault: false
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEdit(p: PlantillaPdf) {
    this.isEdit = true;
    this.form = { ...p };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.showPreview = false;
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;

    this.uploadingLogo = true;
    this.form.logoNombre = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.form.logoBase64 = (e.target?.result as string) || '';
      this.uploadingLogo = false;
    };
    reader.readAsDataURL(file);
  }

  removeLogo() {
    this.form.logoBase64 = '';
    this.form.logoNombre = '';
  }

  onTipoDocumentoChange() {
    if (this.form.tipoDocumento === 'OC') {
      this.form.tituloDocumento = 'ORDEN DE COMPRA';
    } else if (this.form.tipoDocumento === 'OS') {
      this.form.tituloDocumento = 'ORDEN DE SERVICIO';
    }
  }

  setDefaultPlantilla(p: PlantillaPdf) {
    this.plantillas
      .filter(pl => pl.tipoDocumento === p.tipoDocumento && pl.empresa === p.empresa)
      .forEach(pl => pl.esDefault = false);
    p.esDefault = true;
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
    this.closeModal();
  }

  toggleEstado(p: PlantillaPdf) {
    p.estado = p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  }
}
