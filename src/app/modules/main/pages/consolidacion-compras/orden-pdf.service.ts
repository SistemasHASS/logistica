import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({ providedIn: 'root' })
export class OrdenPdfService {
  private baseUrl = environment.baseUrl;
  private http = inject(HttpClient);

  /** Abre el HTML de la OC/OS en una nueva ventana y dispara el diálogo de impresión/guardar-PDF */
  imprimirOrdenHtml(html: string, titulo: string): void {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.document.title = titulo;
    win.onload = () => {
      win.focus();
      win.print();
    };
  }

  /** Genera el HTML de la OC para previsualización / impresión desde el frontend */
  buildOCHtml(oc: any, empresa: any): string {
    const logo = empresa?.logoBase64
      ? `<img src="data:image/png;base64,${empresa.logoBase64}" style="max-height:60px;max-width:200px" alt="Logo"/>`
      : `<span style="font-size:18px;font-weight:bold;color:#1a3a6b">${empresa?.razonSocial || ''}</span>`;

    const itemsHtml = (oc.items || []).map((i: any) => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd">${i.codigo || ''}</td>
        <td style="padding:6px;border:1px solid #ddd">${i.descripcion || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center">${i.cantidad || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center">${i.unidadMedida || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:right">${this.fmt(i.precioUnitario)}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:right">${this.fmt(i.total || (i.cantidad * i.precioUnitario))}</td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;color:#333;margin:24px}
  .header{display:flex;justify-content:space-between;align-items:center;background:#1a3a6b;color:white;padding:16px;border-radius:4px 4px 0 0}
  .header-right{text-align:right}
  .section{padding:12px 0}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:12px 0}
  .label{font-weight:bold;color:#555;font-size:10px;text-transform:uppercase;margin-bottom:2px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  thead tr{background:#1a3a6b;color:white}
  thead td{padding:8px;font-weight:bold}
  tfoot td{background:#eef2ff;font-weight:bold;padding:6px}
  .total-row{background:#1a3a6b;color:white}
  .footer{margin-top:16px;text-align:center;font-size:10px;color:#888;border-top:2px solid #1a3a6b;padding-top:8px}
  @media print{body{margin:0}}
</style></head>
<body>
<div class="header">
  <div>${logo}</div>
  <div class="header-right">
    <div style="font-size:16px;font-weight:bold">ORDEN DE COMPRA</div>
    <div style="font-size:22px;font-weight:bold">${oc.numeroOrden || ''}</div>
    <div style="font-size:10px">Fecha: ${oc.fechaCreacion || ''}</div>
  </div>
</div>
<div class="section">
  <div class="grid">
    <div>
      <div class="label">Empresa Compradora</div>
      <div style="font-weight:bold">${empresa?.razonSocial || ''}</div>
      <div>RUC: ${empresa?.ruc || ''}</div>
      <div>${empresa?.direccion || ''}</div>
    </div>
    <div>
      <div class="label">Proveedor</div>
      <div style="font-weight:bold">${oc.nombreProveedor || ''}</div>
      <div>RUC: ${oc.rucProveedor || ''}</div>
      <div>Email: ${oc.emailProveedor || ''}</div>
    </div>
  </div>
  <div class="grid">
    <div><div class="label">Moneda</div>${oc.moneda || ''}</div>
    <div><div class="label">Condiciones de Pago</div>${oc.condicionesPago || ''} — ${oc.formaPago || ''}</div>
    <div><div class="label">Lugar de Entrega</div>${oc.lugarEntrega || ''}</div>
    <div><div class="label">Fecha Estimada de Entrega</div>${oc.fechaEntregaEstimada || ''}</div>
  </div>
  <table>
    <thead><tr>
      <td>Código</td><td>Descripción</td>
      <td style="text-align:center">Cant.</td><td style="text-align:center">UM</td>
      <td style="text-align:right">P. Unit.</td><td style="text-align:right">Total</td>
    </tr></thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td colspan="5" style="text-align:right">Subtotal ${oc.moneda || ''}:</td><td style="text-align:right">${this.fmt(oc.subtotal)}</td></tr>
      <tr><td colspan="5" style="text-align:right">IGV (18%):</td><td style="text-align:right">${this.fmt(oc.igv)}</td></tr>
      <tr class="total-row"><td colspan="5" style="text-align:right;padding:8px;font-size:14px">TOTAL ${oc.moneda || ''}:</td><td style="text-align:right;padding:8px;font-size:14px">${this.fmt(oc.totalOrden)}</td></tr>
    </tfoot>
  </table>
  ${oc.observaciones ? `<div style="margin-top:12px"><strong>Observaciones:</strong> ${oc.observaciones}</div>` : ''}
</div>
<div class="footer">${empresa?.razonSocial || ''} · RUC ${empresa?.ruc || ''} · ${empresa?.direccion || ''}</div>
</body></html>`;
  }

  buildOSHtml(os: any, empresa: any): string {
    const logo = empresa?.logoBase64
      ? `<img src="data:image/png;base64,${empresa.logoBase64}" style="max-height:60px;max-width:200px" alt="Logo"/>`
      : `<span style="font-size:18px;font-weight:bold;color:#1a6b3a">${empresa?.razonSocial || ''}</span>`;

    const itemsHtml = (os.items || []).map((i: any) => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd">${i.descripcionServicio || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center">${i.cantidad || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center">${i.unidadMedida || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:right">${this.fmt(i.precioUnitario)}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:right">${this.fmt(i.subtotal)}</td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;color:#333;margin:24px}
  .header{display:flex;justify-content:space-between;align-items:center;background:#1a6b3a;color:white;padding:16px;border-radius:4px 4px 0 0}
  .header-right{text-align:right}
  .section{padding:12px 0}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:12px 0}
  .label{font-weight:bold;color:#555;font-size:10px;text-transform:uppercase;margin-bottom:2px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  thead tr{background:#1a6b3a;color:white}
  thead td{padding:8px;font-weight:bold}
  tfoot td{background:#eefff4;font-weight:bold;padding:6px}
  .total-row{background:#1a6b3a;color:white}
  .footer{margin-top:16px;text-align:center;font-size:10px;color:#888;border-top:2px solid #1a6b3a;padding-top:8px}
  @media print{body{margin:0}}
</style></head>
<body>
<div class="header">
  <div>${logo}</div>
  <div class="header-right">
    <div style="font-size:16px;font-weight:bold">ORDEN DE SERVICIO</div>
    <div style="font-size:22px;font-weight:bold">${os.numeroOrden || ''}</div>
    <div style="font-size:10px">Fecha: ${os.fechaRegistro || ''}</div>
  </div>
</div>
<div class="section">
  <div class="grid">
    <div>
      <div class="label">Empresa</div>
      <div style="font-weight:bold">${empresa?.razonSocial || ''}</div>
      <div>RUC: ${empresa?.ruc || ''}</div>
      <div>${empresa?.direccion || ''}</div>
    </div>
    <div>
      <div class="label">Proveedor de Servicio</div>
      <div style="font-weight:bold">${os.nombreProveedor || ''}</div>
      <div>RUC: ${os.rucProveedor || ''}</div>
      <div>Email: ${os.emailProveedor || ''}</div>
    </div>
  </div>
  <div class="grid">
    <div><div class="label">Tipo de Servicio</div>${os.tipoServicio || ''}</div>
    <div><div class="label">Moneda</div>${os.moneda || ''}</div>
    <div><div class="label">Fecha Inicio</div>${os.fechaInicioServicio || ''}</div>
    <div><div class="label">Fecha Fin</div>${os.fechaFinServicio || ''}</div>
    <div><div class="label">Ubicación</div>${os.ubicacionServicio || ''}</div>
    <div><div class="label">Condiciones de Pago</div>${os.condicionesPago || ''} — ${os.formaPago || ''}</div>
  </div>
  ${os.alcance ? `<div style="margin-bottom:8px"><strong>Alcance:</strong> ${os.alcance}</div>` : ''}
  <table>
    <thead><tr>
      <td>Descripción del Servicio</td>
      <td style="text-align:center">Cant.</td><td style="text-align:center">UM</td>
      <td style="text-align:right">P. Unit.</td><td style="text-align:right">Subtotal</td>
    </tr></thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr class="total-row"><td colspan="4" style="text-align:right;padding:8px;font-size:14px">MONTO TOTAL ${os.moneda || ''}:</td><td style="text-align:right;padding:8px;font-size:14px">${this.fmt(os.montoTotal)}</td></tr>
    </tfoot>
  </table>
</div>
<div class="footer">${empresa?.razonSocial || ''} · RUC ${empresa?.ruc || ''}</div>
</body></html>`;
  }

  async enviarOrdenAlProveedor(tipoOrden: 'OC' | 'OS', idOrden: number): Promise<any> {
    return lastValueFrom(
      this.http.post(`${this.baseUrl}/api/logistica/enviar-orden-pdf-proveedor`, {
        tipoOrden, idOrden: idOrden.toString()
      })
    );
  }

  private fmt(val: any): string {
    const n = parseFloat(val);
    return isNaN(n) ? '0.00' : n.toFixed(2);
  }
}
