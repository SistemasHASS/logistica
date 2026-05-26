import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

const TC_OC_KEY      = 'pdf_tc_oc';
const TC_OS_KEY      = 'pdf_tc_os';
const CFG_OC_KEY     = 'pdf_cfg_oc';
const CFG_OS_KEY     = 'pdf_cfg_os';
const EMPRESA_KEY    = 'pdf_empresa';

export interface EmpresaConfig {
  id?: number;
  razonSocial: string;
  ruc: string;
  logoBase64: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

const EMPRESA_DEFAULT: EmpresaConfig = {
  razonSocial: 'HASS PERU S.A.',
  ruc: '',
  logoBase64: '',
};

export interface PlantillaOC {
  tituloDocumento: string;
  mostrarCommodity: boolean;
  mostrarCnd: boolean;
  mostrarUnidad: boolean;
  mostrarTipoCambio: boolean;
  mostrarClasificacion: boolean;
  mostrarCotizacion: boolean;
  etiquetaCommodity: string;
  etiquetaCnd: string;
  etiquetaDescripcion: string;
  etiquetaUnidad: string;
  etiquetaCantidad: string;
  etiquetaPrecioUnit: string;
  etiquetaMontoTotal: string;
  etiquetaTotalNeto: string;
  etiquetaIGV: string;
  etiquetaTotalOC: string;
  notaPie: string;
}

export interface PlantillaOS {
  tituloDocumento: string;
  mostrarComentarios: boolean;
  mostrarDatosServicio: boolean;
  etiquetaDetalle: string;
  etiquetaMontoTotal: string;
  etiquetaValorServicio: string;
  etiquetaImpuestos: string;
  etiquetaTotal: string;
  tituloSeccionDatos: string;
  datosServicio: string[];
  notaPie: string;
}

const CFG_OC_DEFAULT: PlantillaOC = {
  tituloDocumento: 'Orden de Compra',
  mostrarCommodity: true,
  mostrarCnd: true,
  mostrarUnidad: true,
  mostrarTipoCambio: true,
  mostrarClasificacion: true,
  mostrarCotizacion: true,
  etiquetaCommodity: 'Commodity',
  etiquetaCnd: 'Cnd',
  etiquetaDescripcion: 'Descripción',
  etiquetaUnidad: 'Unidad',
  etiquetaCantidad: 'Cantidad',
  etiquetaPrecioUnit: 'Precio Unit.',
  etiquetaMontoTotal: 'Monto Total',
  etiquetaTotalNeto: 'Total Neto',
  etiquetaIGV: 'I.G.V.',
  etiquetaTotalOC: 'Total O/C',
  notaPie: '',
};

const CFG_OS_DEFAULT: PlantillaOS = {
  tituloDocumento: 'Orden de Servicio',
  mostrarComentarios: true,
  mostrarDatosServicio: true,
  etiquetaDetalle: 'Detalle',
  etiquetaMontoTotal: 'Monto Total',
  etiquetaValorServicio: 'Valor Servicio',
  etiquetaImpuestos: '(+/-) Impuestos',
  etiquetaTotal: 'Total',
  tituloSeccionDatos: 'Datos del Servicio:',
  datosServicio: [
    'Se entregará el Acta de Recepción y Conformidad al usuario solicitante de Fundo a la culminación de su servicio.',
    'En caso de Mantenimiento de Maquinarias, Equipos y Unidades de Transporte se deberá adjuntar adicionalmente el informe técnico.',
    'Relacionar los sustentos del servicio (informes, fotos, etc).',
  ],
  notaPie: '',
};

const TC_OC_DEFAULT = [
  'El proveedor está obligado a entregar los bienes conforme a las especificaciones técnicas, modelo, marca, color, unidad de medida y demás características detalladas en el requerimiento aprobado. Cualquier variación no autorizada por escrito será motivo de rechazo inmediato de los bienes entregados.',
  'La entrega de los bienes deberá realizarse en el lugar establecido por la Entidad, dentro del plazo contractual. Se considerará la entrega efectuada solo cuando todos los bienes hayan sido recibidos y conformados por el área usuaria. El proveedor deberá coordinar previamente la entrega para evitar rechazos.',
  'En caso de incumplimiento del plazo de entrega, se aplicará una penalidad diaria equivalente al 0.10% del monto total de la orden de compra, hasta un máximo del 10%, conforme al artículo 165 del Reglamento de la Ley de Contrataciones del Estado.',
  'La conformidad de los bienes se otorgará dentro del plazo de cinco (05) días hábiles posteriores a la entrega. Como clientes podremos observar o rechazar total o parcialmente los bienes si no cumplen con los estándares establecidos. El proveedor deberá subsanar dichas observaciones en un plazo máximo de tres (03) días hábiles.',
  'El proveedor garantiza el buen estado, funcionamiento y durabilidad de los bienes entregados por un periodo mínimo de 6 meses o el que se indique expresamente. Durante este tiempo, el proveedor se obliga a reparar, reponer o sustituir los bienes defectuosos sin costo adicional, asumiendo todos los costos logísticos y operativos asociados.',
  'Si los bienes entregados presentan fallas o no cumplen con las condiciones establecidas, el proveedor deberá efectuar la sustitución correspondiente en un plazo no mayor a cinco (05) días hábiles, asumiendo todos los costos logísticos y operativos asociados.',
  'El proveedor deberá presentar obligatoriamente los siguientes documentos: guía de remisión, factura, de ser un bien especifico adicionará certificado de garantía (si corresponde), ficha técnica del bien y otros requeridos por la Entidad. Sin esta documentación, no se procesará el pago.',
  'El pago se realizará dentro del plazo establecido (generalmente 30 días calendario), contado desde la conformidad del área usuaria y la presentación de la documentación completa. No se realizará pago anticipado salvo disposición expresa. O condición pactada con en la OC.',
  'La Entidad podrá resolver de pleno derecho la presente orden de compra si el proveedor incurre en incumplimiento injustificado de las condiciones esenciales, sin perjuicio de la aplicación de penalidades, ejecución de garantías y acciones legales correspondientes.',
  'Esta orden de compra se rige por la Ley N° 30225, su Reglamento aprobado por D.S. N° 344-2018-EF y demás normas complementarias. En caso de controversia, las partes se someten a conciliación y/o arbitraje institucional, conforme al artículo 45 de la Ley de Contrataciones.',
];

const TC_OS_DEFAULT = [
  'El proveedor se compromete a ejecutar el servicio conforme a los Términos de Referencia aprobados, respetando la metodología, cronograma, entregables y niveles de calidad establecidos por la Entidad.',
  'El proveedor garantiza la obtención de los resultados esperados según el requerimiento técnico. La Entidad no está obligada a aceptar servicios incompletos, defectuosos o ejecutados fuera del plazo.',
  'El plazo de ejecución es de cumplimiento obligatorio. Cualquier retraso injustificado dará lugar a penalidades equivalentes al 0.10% del valor total del contrato por día calendario de atraso, hasta un máximo del 10%.',
  'La conformidad será emitida por el área usuaria mediante informe técnico dentro de un plazo no mayor de cinco (05) días hábiles, previa verificación de que el servicio se ejecutó conforme a lo pactado. En caso de observaciones, el proveedor deberá corregirlas sin costo adicional.',
  'El proveedor es responsable exclusivo de las obligaciones laborales, tributarias y de seguridad social de su personal. En ningún caso existirá relación laboral entre el personal del proveedor y la Entidad.',
  'El proveedor deberá cumplir con las disposiciones de la Ley N° 29783, Ley de Seguridad y Salud en el Trabajo, garantizando condiciones seguras para su personal durante la ejecución del servicio.',
  'Toda información a la que acceda el proveedor en el marco de la prestación del servicio se considera confidencial. No podrá ser divulgada sin autorización expresa de la Entidad, salvo por mandato legal.',
  'En caso el servicio sea ejecutado por personal específico, cualquier cambio deberá ser autorizado por la Entidad. El nuevo personal deberá contar con igual o mejor perfil que el inicialmente propuesto.',
  'El pago se efectuará únicamente tras la emisión del informe de conformidad, acompañado de los entregables correspondientes y factura o boleta electrónica emitida según las normas tributarias. No se reconocerán pagos por servicios no conformes.',
  'La relación contractual se rige por la Ley N° 30225, su Reglamento, y demás normas complementarias. Cualquier controversia será resuelta mediante conciliación o arbitraje, según lo dispuesto en la Ley de Contrataciones del Estado.',
];

@Injectable({ providedIn: 'root' })
export class OrdenPdfService {
  private baseUrl = environment.baseUrl;
  private http = inject(HttpClient);

  // ── T&C dinámicos ─────────────────────────────────────────────────────────

  getTcOC(): string[] {
    const raw = localStorage.getItem(TC_OC_KEY);
    return raw ? JSON.parse(raw) : TC_OC_DEFAULT;
  }

  getTcOS(): string[] {
    const raw = localStorage.getItem(TC_OS_KEY);
    return raw ? JSON.parse(raw) : TC_OS_DEFAULT;
  }

  saveTcOC(items: string[]): void { localStorage.setItem(TC_OC_KEY, JSON.stringify(items)); }
  saveTcOS(items: string[]): void { localStorage.setItem(TC_OS_KEY, JSON.stringify(items)); }

  resetTcOC(): void { localStorage.removeItem(TC_OC_KEY); }
  resetTcOS(): void { localStorage.removeItem(TC_OS_KEY); }

  // ── Configuración de plantilla ────────────────────────────────────────────

  getCfgOC(): PlantillaOC {
    const raw = localStorage.getItem(CFG_OC_KEY);
    return raw ? { ...CFG_OC_DEFAULT, ...JSON.parse(raw) } : { ...CFG_OC_DEFAULT };
  }

  getCfgOS(): PlantillaOS {
    const raw = localStorage.getItem(CFG_OS_KEY);
    return raw ? { ...CFG_OS_DEFAULT, ...JSON.parse(raw) } : { ...CFG_OS_DEFAULT };
  }

  saveCfgOC(cfg: PlantillaOC): void { localStorage.setItem(CFG_OC_KEY, JSON.stringify(cfg)); }
  saveCfgOS(cfg: PlantillaOS): void { localStorage.setItem(CFG_OS_KEY, JSON.stringify(cfg)); }

  resetCfgOC(): void { localStorage.removeItem(CFG_OC_KEY); }
  resetCfgOS(): void { localStorage.removeItem(CFG_OS_KEY); }

  // ── Configuración de empresa ──────────────────────────────────────────────

  getEmpresa(): EmpresaConfig {
    const raw = localStorage.getItem(EMPRESA_KEY);
    return raw ? { ...EMPRESA_DEFAULT, ...JSON.parse(raw) } : { ...EMPRESA_DEFAULT };
  }

  saveEmpresa(cfg: EmpresaConfig): void { localStorage.setItem(EMPRESA_KEY, JSON.stringify(cfg)); }

  resetEmpresa(): void { localStorage.removeItem(EMPRESA_KEY); }

  // ── Apertura de ventana de impresión ──────────────────────────────────────

  imprimirOrdenHtml(html: string, titulo: string): void {
    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.document.title = titulo;
    win.onload = () => { win.focus(); win.print(); };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private fmt(val: any): string {
    const n = parseFloat(val);
    return isNaN(n) ? '0.00' : n.toFixed(2);
  }

  private tcHtml(items: string[]): string {
    const rows = items.map((t, i) =>
      `<tr><td style="width:22px;vertical-align:top;padding:4px 6px 4px 2px">${i + 1}.</td>
       <td style="padding:4px 2px;text-align:justify">${t}</td></tr>`
    ).join('');
    return `<table style="width:100%;border-collapse:collapse;font-size:10.5px;line-height:1.55">${rows}</table>`;
  }

  private firmasHtml(preparadoPor: string, preparadoFecha: string, aprobadoPor: string, aprobadoFecha: string): string {
    return `
    <div style="display:flex;justify-content:space-between;margin-top:60px">
      <div style="text-align:center;width:45%">
        <div style="border-top:1px solid #000;padding-top:6px">
          <div>Preparado por</div>
          <div style="font-weight:bold">${preparadoPor}</div>
          <div>${preparadoFecha}</div>
        </div>
      </div>
      <div style="text-align:center;width:45%">
        <div style="border-top:1px solid #000;padding-top:6px">
          <div>Aprobado por</div>
          <div style="font-weight:bold">${aprobadoPor}</div>
          <div>${aprobadoFecha}</div>
        </div>
      </div>
    </div>`;
  }

  private estilosBase(): string {
    return `
      body{font-family:Arial,sans-serif;font-size:11px;color:#222;margin:28px 32px}
      h1{font-size:15px;font-weight:bold;text-align:center;margin:0}
      table{border-collapse:collapse}
      .info-row{display:flex;gap:32px;margin:4px 0}
      .info-label{min-width:90px;font-weight:bold}
      .items-table{width:100%;margin-top:10px}
      .items-table thead tr{background:#fff}
      .items-table thead td{border:1px solid #999;padding:5px 6px;font-weight:bold;text-align:center}
      .items-table tbody td{border:1px solid #ccc;padding:5px 6px;vertical-align:top}
      .items-table tfoot td{border:1px solid #ccc;padding:5px 6px;font-weight:bold}
      .tc-box{border:1px solid #999;padding:12px 14px;margin-top:16px}
      .page-break{page-break-before:always}
      @media print{body{margin:0 16px}}
    `;
  }

  // ── OC HTML ───────────────────────────────────────────────────────────────

  buildOCHtml(oc: any, empresa?: any): string {
    const cfg = this.getCfgOC();
    const emp = empresa ?? this.getEmpresa();
    const logoSrc = emp?.logoBase64
      ? (emp.logoBase64.startsWith('data:') ? emp.logoBase64 : `data:image/png;base64,${emp.logoBase64}`)
      : '';
    const logo = logoSrc
      ? `<img src="${logoSrc}" style="max-height:70px;max-width:110px" alt="Logo"/>`
      : '';

    const razonSocial = emp?.razonSocial || 'HASS PERU S.A.';
    const fecha = oc.fechaCreacion || '';
    const pagina = 'Página 1 de 1';

    const colSpanItems = 4 + (cfg.mostrarCommodity ? 1 : 0) + (cfg.mostrarCnd ? 1 : 0) + (cfg.mostrarUnidad ? 1 : 0);

    const itemsHtml = (oc.items || []).map((i: any, idx: number) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        ${cfg.mostrarCommodity ? `<td style="text-align:center">${i.commodity || i.codigoCommodity || ''}</td>` : ''}
        ${cfg.mostrarCnd ? `<td style="text-align:center">${i.cnd || ''}</td>` : ''}
        <td>${i.descripcion || i.descripcionLocal || ''}</td>
        ${cfg.mostrarUnidad ? `<td style="text-align:center">${i.unidadMedida || i.unidadCodigo || ''}</td>` : ''}
        <td style="text-align:right">${this.fmt(i.cantidad)}</td>
        <td style="text-align:right">${this.fmt(i.precioUnitario)}</td>
        <td style="text-align:right">${this.fmt(i.total ?? (parseFloat(i.cantidad) * parseFloat(i.precioUnitario)))}</td>
      </tr>`).join('');

    const subtotal = parseFloat(oc.subtotal ?? oc.totalNeto ?? 0);
    const igv = parseFloat(oc.igv ?? subtotal * 0.18);
    const total = parseFloat(oc.totalOrden ?? (subtotal + igv));
    const moneda = oc.moneda === 'USD' ? '$' : 'S/';

    const tc = this.getTcOC();

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>${this.estilosBase()}</style></head>
<body>
<!-- CABECERA -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:10px">
  <div style="display:flex;align-items:center;gap:12px">
    ${logo}
    <div style="font-size:13px;font-weight:bold">${razonSocial}</div>
  </div>
  <div style="text-align:right;font-size:11px">
    <div>Fecha&nbsp;&nbsp;${fecha}</div>
    <div>${pagina}</div>
  </div>
</div>
<h1>${cfg.tituloDocumento} # ${oc.numeroOrden || ''}</h1>
<div style="margin:10px 0">
  <table style="width:100%;font-size:11px">
    <tr>
      <td style="width:50%;vertical-align:top">
        <div><span style="font-weight:bold">Proveedor:</span>&nbsp;${oc.nombreProveedor || ''}</div>
        <div><span style="font-weight:bold">Nro. RUC:</span>&nbsp;${oc.rucProveedor || ''}</div>
        <div><span style="font-weight:bold">Dirección:</span>&nbsp;${oc.direccionProveedor || ''}</div>
        <div><span style="font-weight:bold">Teléfono:</span>&nbsp;${oc.telefonoProveedor || ''}</div>
        <div><span style="font-weight:bold">Contacto:</span>&nbsp;${oc.contactoProveedor || ''}</div>
        <div><span style="font-weight:bold">Correo:</span>&nbsp;${oc.emailProveedor || ''}</div>
        <div><span style="font-weight:bold">Observaciones:</span>&nbsp;${oc.observaciones || ''}</div>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:16px">
        ${cfg.mostrarCotizacion ? `<div><span style="font-weight:bold">Cotización #:</span>&nbsp;${oc.numeroCotizacion || ''}</div>` : ''}
        <div><span style="font-weight:bold">Fecha Preparación:</span>&nbsp;${oc.fechaPreparacion || fecha}</div>
        ${cfg.mostrarClasificacion ? `<div><span style="font-weight:bold">Clasificación:</span>&nbsp;${oc.clasificacion || ''}</div>` : ''}
        <div><span style="font-weight:bold">Forma de Pago:</span>&nbsp;${oc.formaPago || ''}</div>
        <div><span style="font-weight:bold">Estado:</span>&nbsp;<strong>${oc.estado || ''}</strong></div>
        <div><span style="font-weight:bold">Moneda:</span>&nbsp;${oc.moneda || ''}</div>
        ${cfg.mostrarTipoCambio ? `<div><span style="font-weight:bold">T.Cambio:</span>&nbsp;${oc.tipoCambio || ''}</div>` : ''}
        <div><span style="font-weight:bold">Fecha Entrega:</span>&nbsp;${oc.fechaEntregaEstimada || ''}</div>
      </td>
    </tr>
  </table>
</div>

<!-- TABLA DE ÍTEMS -->
<table class="items-table">
  <thead>
    <tr>
      <td style="width:28px">#</td>
      ${cfg.mostrarCommodity ? `<td>${cfg.etiquetaCommodity}</td>` : ''}
      ${cfg.mostrarCnd ? `<td>${cfg.etiquetaCnd}</td>` : ''}
      <td>${cfg.etiquetaDescripcion}</td>
      ${cfg.mostrarUnidad ? `<td>${cfg.etiquetaUnidad}</td>` : ''}
      <td style="text-align:right">${cfg.etiquetaCantidad}</td>
      <td style="text-align:right">${cfg.etiquetaPrecioUnit}</td>
      <td style="text-align:right">${cfg.etiquetaMontoTotal}</td>
    </tr>
  </thead>
  <tbody>${itemsHtml}</tbody>
  <tfoot>
    <tr>
      <td colspan="${colSpanItems}" style="text-align:right">${cfg.etiquetaTotalNeto} ${moneda}</td>
      <td style="text-align:right">${this.fmt(subtotal)}</td>
    </tr>
    <tr>
      <td colspan="${colSpanItems}" style="text-align:right">${cfg.etiquetaIGV}&nbsp;&nbsp;${moneda}</td>
      <td style="text-align:right">${this.fmt(igv)}</td>
    </tr>
    <tr>
      <td colspan="${colSpanItems}" style="text-align:right">${cfg.etiquetaTotalOC}&nbsp;&nbsp;${moneda}</td>
      <td style="text-align:right;font-size:12px">${this.fmt(total)}</td>
    </tr>
  </tfoot>
</table>

${cfg.notaPie ? `<div style="margin-top:8px;font-size:10.5px">${cfg.notaPie}</div>` : ''}

${this.firmasHtml(
  oc.preparadoPor || '',
  oc.fechaPreparacion || fecha,
  oc.aprobadoPor || '',
  oc.fechaAprobacion || ''
)}

<!-- PÁGINA T&C -->
<div class="page-break"></div>
<div class="tc-box">
  <div style="font-weight:bold;margin-bottom:8px">Términos y Condiciones Detallados:</div>
  ${this.tcHtml(tc)}
</div>
</body></html>`;
  }

  // ── OS HTML ───────────────────────────────────────────────────────────────

  buildOSHtml(os: any, empresa?: any): string {
    const cfg = this.getCfgOS();
    const emp = empresa ?? this.getEmpresa();
    const logoSrc = emp?.logoBase64
      ? (emp.logoBase64.startsWith('data:') ? emp.logoBase64 : `data:image/png;base64,${emp.logoBase64}`)
      : '';
    const logo = logoSrc
      ? `<img src="${logoSrc}" style="max-height:70px;max-width:110px" alt="Logo"/>`
      : '';

    const razonSocial = emp?.razonSocial || 'HASS PERU S.A.';
    const fecha = os.fechaRegistro || os.fechaCreacion || '';
    const pagina = 'Página 1 de 1';

    const itemsHtml = (os.items || []).map((i: any, idx: number) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>${i.descripcionServicio || i.descripcion || ''}</td>
        <td style="text-align:right">${this.fmt(i.subtotal ?? i.montoTotal ?? i.total ?? 0)}</td>
      </tr>`).join('');

    const valorServicio = parseFloat(os.valorServicio ?? os.subtotal ?? os.montoTotal ?? 0);
    const impuestos = parseFloat(os.igv ?? os.impuestos ?? valorServicio * 0.18);
    const total = parseFloat(os.totalOrden ?? os.montoTotal ?? (valorServicio + impuestos));
    const monedaSimbolo = (os.moneda || '').toLowerCase().includes('dol') ? '$' : 'S/';

    const datosServicio: string[] = cfg.mostrarDatosServicio
      ? (os.datosServicio?.length ? os.datosServicio : cfg.datosServicio)
      : [];

    const tc = this.getTcOS();

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>${this.estilosBase()}</style></head>
<body>
<!-- CABECERA -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:10px">
  <div style="display:flex;align-items:center;gap:12px">
    ${logo}
    <div style="font-size:13px;font-weight:bold">${razonSocial}</div>
  </div>
  <div style="text-align:right;font-size:11px">
    <div>Fecha:&nbsp;&nbsp;${fecha}</div>
    <div>${pagina}</div>
  </div>
</div>
<h1>${cfg.tituloDocumento} # ${os.numeroOrden || ''}</h1>

<!-- INFO -->
<div style="margin:10px 0">
  <table style="width:100%;font-size:11px">
    <tr>
      <td style="width:50%;vertical-align:top">
        <div><span style="font-weight:bold">Proveedor:</span>&nbsp;${os.nombreProveedor || ''}</div>
        <div><span style="font-weight:bold">N° RUC:</span>&nbsp;${os.rucProveedor || ''}</div>
        <div><span style="font-weight:bold">Dirección:</span>&nbsp;${os.direccionProveedor || ''}</div>
        <div><span style="font-weight:bold">Teléfono/Fax:</span>&nbsp;${os.telefonoProveedor || ''}</div>
        <div><span style="font-weight:bold">Observaciones:</span>&nbsp;${os.observaciones || ''}</div>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:16px">
        <div><span style="font-weight:bold">Fecha Documento:</span>&nbsp;${fecha}</div>
        <div><span style="font-weight:bold">Fecha Entrega:</span>&nbsp;${os.fechaEntregaEstimada || os.fechaFinServicio || ''}</div>
        <div><span style="font-weight:bold">Tipo de Cotización:</span>&nbsp;${os.tipoCotizacion || 'Sin Cotización'}</div>
        <div><span style="font-weight:bold">Moneda:</span>&nbsp;${os.moneda || ''}</div>
        <div><span style="font-weight:bold">Forma de Pago:</span>&nbsp;${os.formaPago || ''}</div>
      </td>
    </tr>
  </table>
</div>

<!-- TABLA DE SERVICIOS -->
<table class="items-table">
  <thead>
    <tr>
      <td style="width:28px;text-align:center">#</td>
      <td>${cfg.etiquetaDetalle}</td>
      <td style="text-align:right">${cfg.etiquetaMontoTotal}</td>
    </tr>
  </thead>
  <tbody>${itemsHtml}</tbody>
  <tfoot>
    <tr>
      <td colspan="2" style="text-align:right">${cfg.etiquetaValorServicio}</td>
      <td style="text-align:right">${this.fmt(valorServicio)}</td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:right">${cfg.etiquetaImpuestos}</td>
      <td style="text-align:right">${this.fmt(impuestos)}</td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:right;font-size:12px">${cfg.etiquetaTotal} ${monedaSimbolo}</td>
      <td style="text-align:right;font-size:12px">${this.fmt(total)}</td>
    </tr>
  </tfoot>
</table>

${cfg.mostrarComentarios && os.comentarios ? `<div style="margin-top:8px"><strong>Comentarios:</strong><br>${os.comentarios}</div>` : ''}

${cfg.mostrarDatosServicio && datosServicio.length ? `
<div style="margin-top:12px">
  <div style="font-weight:bold;text-decoration:underline;margin-bottom:4px">${cfg.tituloSeccionDatos}</div>
  ${datosServicio.map((d, i) => `<div>${i + 1}. ${d}</div>`).join('')}
</div>` : ''}

${cfg.notaPie ? `<div style="margin-top:8px;font-size:10.5px">${cfg.notaPie}</div>` : ''}

${this.firmasHtml(
  os.preparadoPor || '',
  os.fechaPreparacion || fecha,
  os.aprobadoPor || '',
  os.fechaAprobacion || ''
)}

<!-- PÁGINA T&C -->
<div class="page-break"></div>
<div class="tc-box">
  <div style="font-weight:bold;margin-bottom:8px">Términos y Condiciones Detallados:</div>
  ${this.tcHtml(tc)}
</div>
</body></html>`;
  }

  // ── Preview con datos de muestra ─────────────────────────────────────────

  buildPreviewOCHtml(empresa?: any): string {
    const oc = {
      numeroOrden: 'OC-2025-0001',
      fechaCreacion: '2025-05-25',
      fechaPreparacion: '2025-05-25',
      fechaAprobacion: '2025-05-26',
      fechaEntregaEstimada: '2025-06-05',
      nombreProveedor: 'PROVEEDOR EJEMPLO S.A.C.',
      rucProveedor: '20123456789',
      direccionProveedor: 'Av. Los Negocios 123, Lima',
      telefonoProveedor: '01-234-5678',
      contactoProveedor: 'Juan Pérez',
      emailProveedor: 'proveedor@ejemplo.com',
      observaciones: 'Entrega en almacén central',
      numeroCotizacion: 'COT-2025-042',
      clasificacion: 'Materiales',
      formaPago: 'Crédito 30 días',
      estado: 'APROBADA',
      moneda: 'PEN',
      tipoCambio: '3.75',
      subtotal: 5000.00,
      igv: 900.00,
      totalOrden: 5900.00,
      preparadoPor: 'María García',
      aprobadoPor: 'Carlos López',
      items: [
        { commodity: 'ITEM-001', cnd: 'A1', descripcion: 'Fertilizante NPK 20-20-20 x 50kg', unidadMedida: 'SAC', cantidad: 50, precioUnitario: 60.00, total: 3000.00 },
        { commodity: 'ITEM-002', cnd: 'B2', descripcion: 'Sulfato de Potasio Granulado x 25kg', unidadMedida: 'SAC', cantidad: 40, precioUnitario: 50.00, total: 2000.00 },
      ],
    };
    return this.buildOCHtml(oc, empresa);
  }

  buildPreviewOSHtml(empresa?: any): string {
    const os = {
      numeroOrden: 'OS-2025-0001',
      fechaRegistro: '2025-05-25',
      fechaPreparacion: '2025-05-25',
      fechaAprobacion: '2025-05-26',
      fechaFinServicio: '2025-06-15',
      nombreProveedor: 'SERVICIOS TÉCNICOS S.R.L.',
      rucProveedor: '20987654321',
      direccionProveedor: 'Jr. Las Industrias 456, Lima',
      telefonoProveedor: '01-765-4321',
      observaciones: 'Servicio a realizarse en fundo principal',
      tipoCotizacion: 'Directa',
      moneda: 'PEN',
      formaPago: 'Contado',
      estado: 'APROBADA',
      valorServicio: 8000.00,
      igv: 1440.00,
      montoTotal: 9440.00,
      preparadoPor: 'Luis Torres',
      aprobadoPor: 'Ana Ríos',
      comentarios: 'Incluye materiales y mano de obra.',
      items: [
        { descripcionServicio: 'Mantenimiento preventivo de sistema de riego — Sectores A y B', subtotal: 5000.00 },
        { descripcionServicio: 'Instalación de válvulas hidráulicas (8 unidades)', subtotal: 3000.00 },
      ],
      datosServicio: [
        'Se entregará el Acta de Recepción y Conformidad al usuario solicitante a la culminación del servicio.',
        'En caso de Mantenimiento de Maquinarias se deberá adjuntar adicionalmente el informe técnico.',
        'Relacionar los sustentos del servicio (informes, fotos, etc.).',
      ],
    };
    return this.buildOSHtml(os, empresa);
  }

  // ── Empresas desde BD ────────────────────────────────────────────────────

  async listarEmpresas(): Promise<EmpresaConfig[]> {
    try {
      const res: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-empresas`, {})
      );
      const arr = Array.isArray(res) ? res : [];
      return arr.map((e: any) => ({
        id: e.id,
        razonSocial: e.razonSocial || '',
        ruc: e.ruc || '',
        logoBase64: e.logoBase64 || '',
        direccion: e.direccion || '',
        telefono: e.telefono || '',
        email: e.email || '',
      }));
    } catch {
      return [];
    }
  }

  async enviarOrdenAlProveedor(tipoOrden: 'OC' | 'OS', idOrden: number): Promise<any> {
    return lastValueFrom(
      this.http.post(`${this.baseUrl}/api/logistica/enviar-orden-pdf-proveedor`, {
        tipoOrden, idOrden: idOrden.toString()
      })
    );
  }
}
