import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPlantillaCorreoService } from '../../services/admin-plantilla-correo.service';

interface PlantillaCorreo {
  id?: number;
  idEmpresa: string;
  empresa: string;
  tipoDocumento: string;
  asunto: string;
  cuerpoHtml: string;
  incluirFirma: boolean;
  firmaHtml: string;
  estado: string;
  esDefault: boolean;
}

@Component({
  selector: 'app-admin-plantilla-correo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-plantilla-correo.component.html',
  styleUrls: ['./admin-plantilla-correo.component.scss'],
})
export class AdminPlantillaCorreoComponent implements OnInit {

  plantillas: PlantillaCorreo[] = [
    {
      id: 1, idEmpresa: 'EMP001', empresa: 'Hass Perú', tipoDocumento: 'OC',
      asunto: 'Orden de Compra N° {{numeroOC}} - {{empresa}}',
      cuerpoHtml: `<p>Estimado(a) {{nombreProveedor}},</p>
<p>Por medio del presente, hacemos llegar la <strong>Orden de Compra N° {{numeroOC}}</strong> emitida el {{fechaEmision}}.</p>
<p>Por favor revisar el documento adjunto (PDF) y confirmar la recepción a la brevedad.</p>
<p>En caso de consultas, comunicarse con el área de Logística.</p>
<p>Atentamente,</p>`,
      incluirFirma: true,
      firmaHtml: `<p style="color:#666;font-size:13px;border-top:1px solid #eee;padding-top:10px;margin-top:20px;">
<strong>Área de Logística</strong><br/>Hass Perú S.A.C.<br/>Tel: (01) 000-0000</p>`,
      estado: 'ACTIVO', esDefault: true
    },
    {
      id: 2, idEmpresa: 'EMP001', empresa: 'Hass Perú', tipoDocumento: 'OS',
      asunto: 'Orden de Servicio N° {{numeroOS}} - {{empresa}}',
      cuerpoHtml: `<p>Estimado(a) {{nombreProveedor}},</p>
<p>Adjunto encontrará la <strong>Orden de Servicio N° {{numeroOS}}</strong> con fecha {{fechaEmision}}.</p>
<p>Por favor confirmar la recepción y proceder según los términos indicados.</p>
<p>Atentamente,</p>`,
      incluirFirma: true,
      firmaHtml: `<p style="color:#666;font-size:13px;border-top:1px solid #eee;padding-top:10px;margin-top:20px;">
<strong>Área de Logística</strong><br/>Hass Perú S.A.C.</p>`,
      estado: 'ACTIVO', esDefault: true
    },
  ];

  showModal = false;
  showPreview = false;
  isEdit = false;
  activeTab: 'cuerpo' | 'firma' = 'cuerpo';

  empresas = ['Hass Perú', 'Hass Agro', 'Hass International'];
  tiposDocumento = [
    { value: 'OC', label: 'Orden de Compra (OC)' },
    { value: 'OS', label: 'Orden de Servicio (OS)' },
    { value: 'OC,OS', label: 'OC y OS' },
  ];

  variablesDisponibles = [
    { variable: '{{numeroOC}}', descripcion: 'Número de Orden de Compra' },
    { variable: '{{numeroOS}}', descripcion: 'Número de Orden de Servicio' },
    { variable: '{{empresa}}', descripcion: 'Nombre de la empresa' },
    { variable: '{{nombreProveedor}}', descripcion: 'Nombre del proveedor' },
    { variable: '{{fechaEmision}}', descripcion: 'Fecha de emisión' },
    { variable: '{{montoTotal}}', descripcion: 'Monto total del documento' },
    { variable: '{{moneda}}', descripcion: 'Moneda (PEN / USD)' },
    { variable: '{{solicitante}}', descripcion: 'Nombre del solicitante' },
    { variable: '{{area}}', descripcion: 'Área solicitante' },
  ];

  form: PlantillaCorreo = {
    idEmpresa: 'EMP001', empresa: 'Hass Perú', tipoDocumento: 'OC',
    asunto: '', cuerpoHtml: '', incluirFirma: true, firmaHtml: '',
    estado: 'ACTIVO', esDefault: false
  };

  constructor(private svc: AdminPlantillaCorreoService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  openCreate() {
    this.isEdit = false;
    this.activeTab = 'cuerpo';
    this.form = {
      idEmpresa: 'EMP001', empresa: 'Hass Perú', tipoDocumento: 'OC',
      asunto: '', cuerpoHtml: '', incluirFirma: true, firmaHtml: '',
      estado: 'ACTIVO', esDefault: false
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEdit(p: PlantillaCorreo) {
    this.isEdit = true;
    this.activeTab = 'cuerpo';
    this.form = { ...p };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.showPreview = false;
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  insertVariable(v: string) {
    if (this.activeTab === 'cuerpo') {
      this.form.cuerpoHtml += v;
    } else {
      this.form.firmaHtml += v;
    }
  }

  getPreviewHtml(): string {
    const sample: { [k: string]: string } = {
      '{{numeroOC}}': 'OC-2026-001234',
      '{{numeroOS}}': 'OS-2026-000056',
      '{{empresa}}': this.form.empresa,
      '{{nombreProveedor}}': 'Proveedor Ejemplo SAC',
      '{{fechaEmision}}': '08/05/2026',
      '{{montoTotal}}': '15,200.00',
      '{{moneda}}': 'PEN',
      '{{solicitante}}': 'Juan Quispe',
      '{{area}}': 'Agronomía',
    };

    let html = this.form.cuerpoHtml;
    if (this.form.incluirFirma) html += this.form.firmaHtml;

    Object.entries(sample).forEach(([k, v]) => {
      html = html.split(k).join(v);
    });
    return html;
  }

  save() {
    if (!this.form.asunto.trim() || !this.form.cuerpoHtml.trim()) return;

    if (this.isEdit) {
      const idx = this.plantillas.findIndex(p => p.id === this.form.id);
      if (idx >= 0) this.plantillas[idx] = { ...this.form };
    } else {
      this.form.id = Date.now();
      this.plantillas.push({ ...this.form });
    }
    this.closeModal();
  }

  toggleEstado(p: PlantillaCorreo) {
    p.estado = p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  }
}
