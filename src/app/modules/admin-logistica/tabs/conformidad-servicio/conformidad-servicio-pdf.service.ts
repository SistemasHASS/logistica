import { Injectable } from '@angular/core';
import { OrdenPdfService, EmpresaConfig } from '@/app/modules/main/pages/consolidacion-compras/orden-pdf.service';

export interface PlantillaConformidadServicio {
  tituloDocumento: string;
  etiquetaProveedor: string;
  etiquetaNumeroOS: string;
  etiquetaFechaOS: string;
  etiquetaTotalOS: string;
  etiquetaFechaRecepcion: string;
  etiquetaDescripcionOS: string;
  etiquetaComentarios: string;
  etiquetaCorrespondienteA: string;
  etiquetaMontoServicio: string;
  etiquetaIGV: string;
  etiquetaMontoTotal: string;
  etiquetaConfirmadoPor: string;
  mostrarIGV: boolean;
  mostrarComentarios: boolean;
  piePagina: string;
  firmante1Label: string;
  firmante2Label: string;
  firmaLologistBase64: string;
  nombreLologist: string;
  dniLologist: string;
  cargoLologist: string;
}

const LS_KEY_BASE = 'plantilla_conformidad_servicio';

function lsKey(ruc?: string): string {
  return ruc ? `${LS_KEY_BASE}_${ruc}` : LS_KEY_BASE;
}

const DEFAULT: PlantillaConformidadServicio = {
  tituloDocumento: 'CONFORMIDAD DE SERVICIO',
  etiquetaProveedor: 'Proveedor',
  etiquetaNumeroOS: 'No de Orden de Servicio',
  etiquetaFechaOS: 'Fecha de Orden de Servicio',
  etiquetaTotalOS: 'Total Orden de Servicio',
  etiquetaFechaRecepcion: 'Fecha Recepción',
  etiquetaDescripcionOS: 'Descripcion O.S',
  etiquetaComentarios: 'Comentarios',
  etiquetaCorrespondienteA: 'correspondiente a:',
  etiquetaMontoServicio: 'Monto Servicio',
  etiquetaIGV: 'IGV',
  etiquetaMontoTotal: 'Monto Total a Pagar $',
  etiquetaConfirmadoPor: 'Confirmado por:',
  mostrarIGV: true,
  mostrarComentarios: true,
  piePagina: '',
  firmante1Label: 'Confirmado por',
  firmante2Label: 'Jefe de Área',
  firmaLologistBase64: '',
  nombreLologist: '',
  dniLologist: '',
  cargoLologist: 'Operador Logístico',
};

@Injectable({ providedIn: 'root' })
export class ConformidadServicioPdfService {

  getCfg(ruc?: string): PlantillaConformidadServicio {
    const raw = localStorage.getItem(lsKey(ruc));
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  }

  saveCfg(cfg: PlantillaConformidadServicio, ruc?: string): void {
    localStorage.setItem(lsKey(ruc), JSON.stringify(cfg));
  }

  resetCfg(ruc?: string): void {
    localStorage.removeItem(lsKey(ruc));
  }

  getDefault(): PlantillaConformidadServicio {
    return { ...DEFAULT };
  }

  // ── HTML builder ──────────────────────────────────────────────────────────

  buildHtml(os: any, empresa?: EmpresaConfig): string {
    const cfg = this.getCfg(empresa?.ruc);
    const emp: EmpresaConfig = empresa ?? this.getFallbackEmpresa();

    const logoSrc = emp?.logoBase64
      ? (emp.logoBase64.startsWith('data:') ? emp.logoBase64 : `data:image/png;base64,${emp.logoBase64}`)
      : '';
    const logoHtml = logoSrc
      ? `<img src="${logoSrc}" alt="Logo" style="max-height:65px;max-width:110px;object-fit:contain"/>`
      : '';

    const razonSocial = emp?.razonSocial || 'HASS PERU S.A.';
    const direccion   = emp?.direccion  || 'JR. DIEGO DE ALMAGRO 537';
    const ruc         = emp?.ruc        || '';
    const telefono    = emp?.telefono   || '';

    const numeroConformidad = os.numeroConformidad || os.idConformidad || os.idOS || '';
    const firmaJefeArea     = os.firmaJefeArea     || '';
    const proveedor         = os.nombreProveedor   || '';
    const numeroOS          = os.numeroOrden        || os.numeroOS     || '';
    const fechaOS           = os.fechaCreacion      || os.fechaOS      || '';
    const totalOS           = this.fmt(os.totalOrden ?? os.montoTotal ?? 0);
    const fechaRecepcion    = os.fechaRecepcion     || os.fechaConformidad || this.hoy();
    const descripcionOS     = os.descripcion        || os.glosaPrincipal  || '';
    const comentarios       = os.comentarios        || '';

    const items: any[] = os.items || [];
    const filasHtml = items.map((it: any, idx: number) => `
      <tr>
        <td style="width:24px;text-align:center;padding:5px 6px;border-bottom:1px solid #ddd">${idx + 1}</td>
        <td style="padding:5px 6px;border-bottom:1px solid #ddd">${it.descripcionServicio || it.descripcion || ''}</td>
      </tr>`).join('');

    const montoServicio = parseFloat(os.valorServicio ?? os.subtotal ?? os.montoServicio ?? 0);
    const igv           = parseFloat(os.igv ?? montoServicio * 0.18);
    const montoTotal    = parseFloat(os.totalOrden ?? os.montoTotal ?? (montoServicio + igv));

    const comentariosHtml = cfg.mostrarComentarios
      ? `<div style="margin:12px 0 0"><span style="font-weight:bold">${cfg.etiquetaComentarios} :</span>
           <span style="display:inline-block;min-height:18px;min-width:200px">${comentarios}</span>
         </div>`
      : '';

    const igvHtml = cfg.mostrarIGV
      ? `<tr>
           <td style="text-align:right;padding:3px 8px">${cfg.etiquetaIGV}</td>
           <td style="text-align:right;padding:3px 8px;font-weight:bold">${this.fmt(igv)}</td>
         </tr>`
      : '';

    const piePaginaHtml = cfg.piePagina
      ? `<div style="margin-top:12px;font-size:10px;color:#555">${cfg.piePagina}</div>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; color: #222; margin: 28px 36px; }
    h1 { font-size: 14px; font-weight: bold; text-decoration: underline; text-align: center; margin: 12px 0 16px; }
    .header-empresa { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
    .header-empresa-info { font-size: 11px; line-height: 1.6; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 20px; margin: 10px 0; }
    .info-row { display: flex; gap: 6px; }
    .info-label { font-weight: normal; min-width: 160px; }
    .info-value { font-weight: bold; }
    .correspondiente { margin-top: 12px; font-size: 11px; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    .totales-table { width: 260px; margin-left: auto; margin-top: 10px; border-collapse: collapse; }
    .totales-table td { padding: 3px 8px; }
    .total-row td { font-weight: bold; border-top: 1px solid #666; }
    .firma-section { margin-top: 60px; display: flex; gap: 40px; }
    .firma-box { flex: 1; }
    .firma-line { border-top: 1px solid #333; padding-top: 4px; margin-top: 10px; }
    @media print { body { margin: 14px 20px; } }
  </style>
</head>
<body>

<!-- CABECERA EMPRESA -->
<div class="header-empresa">
  <div>${logoHtml}</div>
  <div class="header-empresa-info">
    <div style="font-weight:bold">${razonSocial}</div>
    ${direccion ? `<div>${direccion}</div>` : ''}
    <div>RUC ${ruc}${telefono ? `&nbsp;&nbsp;&nbsp;Telf&nbsp;&nbsp;${telefono}` : ''}</div>
  </div>
</div>

<h1>${cfg.tituloDocumento} N° ${numeroConformidad}</h1>

<!-- INFO PRINCIPAL -->
<div style="font-size:11px">
  <div class="info-row" style="margin-bottom:4px">
    <span class="info-label">${cfg.etiquetaProveedor} :</span>
    <span class="info-value">${proveedor}</span>
  </div>

  <div style="display:flex; gap:40px; margin:4px 0">
    <div>
      <span class="info-label">${cfg.etiquetaNumeroOS} :</span>
      <span class="info-value">${numeroOS}</span>
    </div>
    <div>
      <span class="info-label">${cfg.etiquetaTotalOS} :</span>
      <span class="info-value">${totalOS}</span>
    </div>
  </div>

  <div style="display:flex; gap:40px; margin:4px 0">
    <div>
      <span class="info-label">${cfg.etiquetaFechaOS} :</span>
      <span class="info-value">${fechaOS}</span>
    </div>
    <div>
      <span class="info-label">${cfg.etiquetaFechaRecepcion} :</span>
      <span class="info-value">${fechaRecepcion}</span>
    </div>
  </div>

  <div class="info-row" style="margin:4px 0">
    <span class="info-label">${cfg.etiquetaDescripcionOS} :</span>
    <span class="info-value">${descripcionOS}</span>
  </div>

  ${comentariosHtml}
</div>

<!-- CORRESPONDIENTE A -->
<div class="correspondiente">
  <div style="margin-bottom:4px">${cfg.etiquetaCorrespondienteA}</div>
  <hr style="border:none;border-top:1px solid #999;margin:4px 0"/>
  <table class="items-table">
    <tbody>${filasHtml}</tbody>
  </table>
</div>

<!-- TOTALES -->
<table class="totales-table">
  <tbody>
    <tr>
      <td style="text-align:right;padding:3px 8px">${cfg.etiquetaMontoServicio}</td>
      <td style="text-align:right;padding:3px 8px;font-weight:bold">${this.fmt(montoServicio)}</td>
    </tr>
    ${igvHtml}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td style="text-align:right;padding:4px 8px">${cfg.etiquetaMontoTotal}</td>
      <td style="text-align:right;padding:4px 8px">${this.fmt(montoTotal)}</td>
    </tr>
  </tfoot>
</table>

<!-- FIRMA -->
<div class="firma-section">
  <div class="firma-box">
    <div>${cfg.etiquetaConfirmadoPor}</div>
    ${cfg.firmaLologistBase64
      ? `<div style="min-height:48px;display:flex;align-items:flex-end">
           <img src="${cfg.firmaLologistBase64.startsWith('data:') ? cfg.firmaLologistBase64 : 'data:image/png;base64,' + cfg.firmaLologistBase64}"
                style="max-height:48px;max-width:180px;object-fit:contain" alt="firma"/>
         </div>`
      : '<div style="min-height:48px"></div>'}
    <div class="firma-line">
      ${cfg.nombreLologist ? `<div style="font-weight:bold;font-size:11px">${cfg.nombreLologist}</div>` : ''}
      ${cfg.dniLologist   ? `<div style="font-size:10px;color:#555">DNI: ${cfg.dniLologist}</div>` : ''}
      <div style="font-size:10px;margin-top:2px">${cfg.firmante1Label}</div>
      ${cfg.cargoLologist ? `<div style="font-size:10px;color:#555">${cfg.cargoLologist}</div>` : ''}
    </div>
  </div>
  <div class="firma-box">
    <div>&nbsp;</div>
    ${firmaJefeArea
      ? `<div style="min-height:48px;display:flex;align-items:flex-end">
           <img src="${firmaJefeArea}"
                style="max-height:48px;max-width:180px;object-fit:contain" alt="firma jefe area"/>
         </div>`
      : '<div style="min-height:48px"></div>'}
    <div class="firma-line">
      <div style="font-size:10px;margin-top:2px">${cfg.firmante2Label}</div>
    </div>
  </div>
</div>

${piePaginaHtml}

</body>
</html>`;
  }

  buildPreviewHtml(empresa?: EmpresaConfig): string {
    const os = {
      numeroConformidad: '073753',
      nombreProveedor: 'NEW TRANSPORT S.A.',
      numeroOrden: '8-00000788',
      fechaCreacion: '11-03-2024',
      totalOrden: 21546.80,
      fechaRecepcion: this.hoy(),
      descripcion: 'SERVICIO DE TRASLADO DE PLANTAS MAGICA.-',
      comentarios: '',
      valorServicio: 11620.00,
      igv: 2091.60,
      montoTotal: 13711.60,
      items: [
        { descripcionServicio: 'SERVICIO DE TRASLADO DE PLANTAS MAGICA DESDE VIVERO OZ HACIA FUNDO HASS PERU.' },
      ],
    };
    return this.buildHtml(os, empresa);
  }

  imprimirConformidad(html: string, titulo: string): void {
    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.document.title = titulo;
    win.onload = () => { win.focus(); win.print(); };
  }

  private fmt(val: any): string {
    const n = parseFloat(val);
    return isNaN(n) ? '0.00' : n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private hoy(): string {
    return new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private getFallbackEmpresa(): EmpresaConfig {
    const raw = localStorage.getItem('pdf_empresa');
    const def: EmpresaConfig = { razonSocial: 'HASS PERU S.A.', ruc: '20481121966', logoBase64: '', direccion: 'JR. DIEGO DE ALMAGRO 537', telefono: '044-225141' };
    return raw ? { ...def, ...JSON.parse(raw) } : def;
  }
}
